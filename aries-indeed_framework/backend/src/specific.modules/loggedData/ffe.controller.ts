import {Body, Controller, Delete, Get, InternalServerErrorException, Param, Post, UseGuards} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import {APIKEYAuthGuard} from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import {LoggeddataService} from 'src/specific.modules/loggedData/loggeddata.service';
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {databases} from 'src/generic.modules/database/db.enum';
import {DatabaseService} from 'src/generic.modules/database/database.service';
import {facilities} from 'src/generic.modules/crypto/keyListArgs.enum';
import {CryptoService} from 'src/generic.modules/crypto/crypto.service';
import {masterDataService} from '../masterData/masterData.service';
import {masterRegistryDto} from '../masterData/masterRegistryData.dto';
import {ConfigService} from 'src/config.service';
import {loggedProsumerDataDto} from '../labeling/labelingData.dto';
import {LabelingService} from '../labeling/labeling.service';
import {HttpService} from "@nestjs/axios";
import {timeFrameDto} from './timeFrame.dto';
import {keyPairDto} from "../labeling/keyPair.dto";
import {AuthService} from "../authentication/auth.service";
import {locationDto} from "../masterData/location.dto";

@ApiTags('FfE')
@Controller('ffe')
@UseGuards(APIKEYAuthGuard)
export class ffeController {

    consumption=0;

    private facility: {fac: facilities, latitude: number, longitude: number}
    
    constructor(
        private readonly loggedDataService: LoggeddataService,
        private readonly databaseService: DatabaseService,
        private readonly labelingService: LabelingService,
        private readonly cryptoService: CryptoService,
        private readonly masterDataService: masterDataService,
        private readonly config: ConfigService,
        private readonly httpService: HttpService,
        private MyLogger: MyLogger,
        private readonly authService: AuthService,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
        setTimeout(async () => this.initialize(), 40000);
    }

    /**
     * Function to initialize all consumer and producer linked to this controller. This includes fetching the key pair
     * and master data for every participant or generate new one.
     * On first start up after a fresh build 404 NOT FOUND Errors will occur but must be ignored since there are no keys or
     * master data do be found yet.
     *
     * @throws InternalServerErrorException on Error while storing a new key pair or master data
     */
    async initialize(): Promise<void> {
        this.MyLogger.warn('Registering masterData (FfE): ');
        this.facility = {
                "fac": facilities.hq,
                "latitude": 48.200764,
                "longitude": 11.510461
            };

        const name = 'FfE';
        const keyPairID = name + 'keyPair';

        let keyPair: keyPairDto;
        try {
            this.MyLogger.info('Get keypair from secret-vault...');
            keyPair = await this.authService.readSecret(keyPairID);
        } catch (e) {
            this.MyLogger.warn('Reading the Keypair from secret-vault failed with ' + e.toString());
            this.MyLogger.info('Generating keypair');
            keyPair = this.labelingService.createKeyPair();
            try {
                await this.authService.writeSecret(keyPairID, keyPair);
            } catch (e) {
                this.MyLogger.error("Can't store the generated key in the secret-vault or key list" + e.toString());
                throw new InternalServerErrorException(e, "Can't init the FfE Controller.");
            }
        }

        if(!await this.masterDataService.ensureRegistered(keyPair.pKey[0])) {
            this.MyLogger.info('Register new master data...');
            const location = new locationDto(this.facility.latitude, this.facility.longitude);
            // this.config.preference,  <<--- undefined!? => yes because it's not set in docker compose
            // consumer
            const c_masterData = new masterRegistryDto(keyPair.pKey[0], location, {wasser: 3, solar:3}, '', 'FfE');

            try {
                await this.masterDataService.registerMasterData(c_masterData);
            } catch (e) {
                this.MyLogger.error('The following error occurred trying to register masterData (FfE): ' + e.toString());
                throw new InternalServerErrorException(e, "Can't init the FfE Controller.");
            }
        }
        this.MyLogger.info("Registered masterData (FfE)");
    }

    @Post('logData')
    @ApiOperation({summary: 'Records new logged data for FfE'})
    @ApiBody({type: loggedProsumerDataDto, description: 'A JSON object representing the data that should be logged'})
    @ApiCreatedResponse({description: 'Returns a logData entry'})
    @ApiBadRequestResponse({description: 'Returns if the request was malformed'})
    @ApiResponse({status: 201, description: 'The record has been successfully created.'})
    @ApiSecurity('api_key', ['api_key'])
    async recordLogData(@Body() completeBody) {
        if(completeBody.consumedPower < 0 )
            this.MyLogger.error("Logging negative consumption: " + JSON.stringify(completeBody));
        const result = this.loggedDataService.createOne(completeBody, databases.ffeDataDB, 'ffe');
        this.MyLogger.debug('Created new logData record');
        // add a consumer:

        //TODO use key provided by completeBody
        const consumed = Math.round( completeBody.consumedPower *12*1000)  // in W (X kWh = X*12*1000 W)

        let data = {
            "data": [{
                "uuid": 0,
                "tuples": [ [ Math.floor(completeBody.epoch * 1000), consumed ] ]  // in [ VZtime, W ]
            }]
        }
        this.MyLogger.info("Simulating VZLogger hook");
        this.MyLogger.debug("Data: " + JSON.stringify(data));

        let response = await this.httpService.post("http://nestjs-consumer2:8108/consumerfrontend/vzpush", data, {headers: {'api_key': this.config.ApiKey}}).toPromise();
        this.MyLogger.debug(response.data);

        return result;
    }

    @Get()
    @ApiOperation({summary: 'Returns IDs and timestamps of all currently saved documents'})
    @ApiOkResponse({description: 'Returned if LogData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async getAllLogData() {
        this.MyLogger.info('serving GET /');
        try {
            const result = await this.databaseService.getAllIDs(databases.ffeDataDB);
            this.MyLogger.debug('Returning all IDs in the database');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                    databases.ffeDataDB + '\n' + error);
            return error;
        }
    }

    @Get(':id')
    @ApiOperation({summary: 'Get logged data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async getLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving GET /:id');
        try {
            const res = await this.databaseService.findByID(id, databases.ffeDataDB);
            this.MyLogger.debug('Queried record with ID ' + id + '\n' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get the document with this id: ' +
                    id + 'in this database' + databases.ffeDataDB + '\n' + error);
            return error;
        }
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete logged data by ID'})
    @ApiResponse({status: 200, description: 'The record has been successfully deleted.'})
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async deleteLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving DELETE /:id');
        try {
            const res = await this.databaseService.deleteByID(id, databases.ffeDataDB);
            this.MyLogger.debug('Deleted record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete in ' +
                    databases.ffeDataDB + 'for this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }

    @Post('findByTimePeriod')
    @ApiOperation({summary: 'Get logged data by Time'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiBody({type: timeFrameDto, description: 'A JSON object of upperbound and lower-bound of the time frame to be queried'})
    @ApiSecurity('api_key', ['api_key'])
    async getLogDataByTime(@Body('upperbound') upperbound: number, @Body('lowerbound') lowerbound:number) {
        this.MyLogger.debug('This was assigned for Upperbound:' + upperbound + '\n' + 'This was assigned for lower-bound:' + lowerbound )
        try {
            return await this.databaseService.findManyByTime(upperbound, lowerbound, databases.ffeDataDB);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get documents within this time period: ' +
                    lowerbound + ' : ' + upperbound + 'in this database' + databases.ffeDataDB + '\n' + error,);
            return error;
        }
    }
}
