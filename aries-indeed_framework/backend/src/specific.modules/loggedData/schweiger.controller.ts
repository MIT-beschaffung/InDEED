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
import {LabelingService} from "src/specific.modules/labeling/labeling.service";
import {loggedProsumerDataDto} from "src/specific.modules/labeling/labelingData.dto";
import {PoseidonMerkleUtils} from 'src/generic.modules/merkletree/poseidonMerkleUtils';
import {CryptoService} from "src/generic.modules/crypto/crypto.service";
import {HttpService} from '@nestjs/axios';
import {masterRegistryDto} from '../masterData/masterRegistryData.dto';
import {locationDto} from '../masterData/location.dto';
import {facilities} from 'src/generic.modules/crypto/keyListArgs.enum';
import {timeFrameDto} from './timeFrame.dto';
import {masterDataService} from "../masterData/masterData.service";
import {ConfigService} from "../../config.service";
import {keyPairDto} from "../labeling/keyPair.dto";
import {AuthService} from "../authentication/auth.service";

const poseidonMerkleUtils = new PoseidonMerkleUtils();

@ApiTags('Schweiger')
@Controller('schweiger')
@UseGuards(APIKEYAuthGuard)
export class SchweigerController {

    private facilities: {fac: facilities, latitude: number, longitude: number}[];
    producer_count = 5;
    consumer_count = 2;
    constructor(
        private readonly loggedDataService: LoggeddataService,
        private readonly databaseService: DatabaseService,
        private readonly labelingService: LabelingService,
        private readonly cryptoService: CryptoService,
        private readonly httpService: HttpService,
        private readonly masterDataService: masterDataService,
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
        setTimeout(async () => this.initialize(), 20000);
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
        this.facilities = [
            {
                'fac': facilities.ews1,  // = 'EWS1',
                'latitude': 47.659805,
                'longitude': 8.3606799
            }, {
                'fac': facilities.ews2,  // = 'EWS2',
                'latitude': 48.346717,
                'longitude': 11.848897
            }, {
                'fac': facilities.ews3,  // = 'EWS3',
                'latitude': 48.363882,
                'longitude': 11.857727
            }, {
                'fac': facilities.ews4,  // = 'EWS4',
                'latitude': 48.324072,
                'longitude': 11.841509
            }, {
                'fac': facilities.ews5,  // = 'EWS5',
                'latitude': 48.336639,
                'longitude': 11.838376
            },{
                'fac': facilities.ews6,  // = 'EWS_Gewerbe_2',
                'latitude': 51.484712,
                'longitude': 10.774232
            },{
                'fac': facilities.ews7,  // = 'EWS_Gewerbe_1',
                'latitude': 48.360239,
                'longitude': 9.923412
            },
        ]

        this.MyLogger.warn('Registering masterData (Schweiger): ');
        // TODO: for each
        for (let index = 0; index <this.producer_count; ++index) {

            //TODO: try key pair, try master data als eigene funktionen
            const name = 'SchweigerEWS_' + (index + 1);
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
                    this.MyLogger.error('Error during preparation of schweiger data:');
                    this.MyLogger.error("Can't store the generated key in the secret-vault or key list" + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the Schweiger Controller.");
                }
            }

            if(!await this.masterDataService.ensureRegistered(keyPair.pKey[0])){
                this.MyLogger.info('Register new master data...');
                const location = new locationDto(this.facilities[index].latitude, this.facilities[index].longitude);
                // producer -> preference = null
                const masterData = new masterRegistryDto(keyPair.pKey[0], location, null, 'hydro', 'Schweiger (EWS' + (index + 1) + ')',)

                try {
                    const result = await this.masterDataService.registerMasterData(masterData);
                    this.MyLogger.info("Registered Schweiger (EWS" + (index + 1) + ") masterData: " + JSON.stringify(result));
                } catch (error) {
                    this.MyLogger.error('The following error occurred trying to register masterData (Schweiger; EWS' + (index + 1) + '): ' + error.toString());
                    throw new InternalServerErrorException(error, "Can't init the Schweiger Controller.");
                }
            }

            //TODO: should be unnecessary
            try {
                //TODO: response is an array ...
                const response = await this.masterDataService.getMasterData(keyPair.pKey[0]);
                //@ts-ignore
                if (response[0].pubKey_x == keyPair.pKey[0]) {
                    this.MyLogger.info("Successfully registered (EWS" + (index + 1) + ")");
                } else {
                    this.MyLogger.warn("Caution: In (EWS" + (index + 1) + ") KeyCheck went wrong!  Equal should be:");
                    //@ts-ignore
                    this.MyLogger.warn('response.data[0].pubKey_x: ' + response.pubKey_x);
                    this.MyLogger.warn('this.globalKeyList[index].pKey[0]: ' + keyPair.pKey[0]);
                }
            } catch (error) {
                this.MyLogger.error('The following error occurred trying to register masterData (Schweiger; EWS' + (index + 1) + '): ' + error);
            }
        }

        for (let index = this.consumer_count; index <this.facilities.length; ++index) {

            //TODO: try key pair, try master data als eigene funktionen
            const name = 'SchweigerEWS_C_' + (index + 1);
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
                    this.MyLogger.error('Error during preparation of schweiger data:');
                    this.MyLogger.error("Can't store the generated key in the secret-vault or key list" + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the Schweiger Controller.");
                }
            }

            if(!await this.masterDataService.ensureRegistered(keyPair.pKey[0])){
                this.MyLogger.info('Register new master data...');
                const location = new locationDto(this.facilities[index].latitude, this.facilities[index].longitude);
                // producer -> preference = null
                const c_masterData = new masterRegistryDto(keyPair.pKey[0], location, {wasser: 3, solar: 3},
                    '', 'Schweiger (EWS' + (index + 1) + ')');

                try {
                    const result = await this.masterDataService.registerMasterData(c_masterData);
                    this.MyLogger.info("Registered Schweiger (EWS" + (index + 1) + ") masterData: " + JSON.stringify(result));
                } catch (error) {
                    this.MyLogger.error('The following error occurred trying to register masterData (Schweiger; EWS' + (index + 1) + '): ' + error.toString());
                    throw new InternalServerErrorException(error, "Can't init the Schweiger Controller.");
                }
            }

            //TODO: should be unnecessary
            try {
                //TODO: response is an array ...
                const response = await this.masterDataService.getMasterData(keyPair.pKey[0]);
                //@ts-ignore
                if (response[0].pubKey_x == keyPair.pKey[0]) {
                    this.MyLogger.info("Successfully registered (EWS" + (index + 1) + ")");
                } else {
                    this.MyLogger.warn("Caution: In (EWS" + (index + 1) + ") KeyCheck went wrong!  Equal should be:");
                    //@ts-ignore
                    this.MyLogger.warn('response.data[0].pubKey_x: ' + response.pubKey_x);
                    this.MyLogger.warn('this.globalKeyList[index].pKey[0]: ' + keyPair.pKey[0]);
                }
            } catch (error) {
                this.MyLogger.error('The following error occurred trying to register masterData (Schweiger; EWS' + (index + 1) + '): ' + error);
            }
        }
        this.MyLogger.info('Schweiger registered.');
    }

    @Post('logData')
    @ApiOperation({summary: 'Records new logged data for Schweiger'})
    @ApiBody({type: loggedProsumerDataDto, description: 'A JSON object representing the data that should be logged'})
    @ApiCreatedResponse({description: 'Returns a logData entry'})
    @ApiBadRequestResponse({description: 'Returns if the request was malformed'})
    @ApiResponse({status: 201, description: 'The record has been successfully created.'})
    @ApiSecurity('api_key', ['api_key'])
    async recordLogData(@Body() completeBody) {
        this.MyLogger.info("Receiving logData from Schweiger:");
        if(completeBody.energy_kWh < 0 )
            this.MyLogger.error("Logging negative consumption: " + JSON.stringify(completeBody));
        let result = {};
        try {
            result = await this.loggedDataService.createOne(completeBody, databases.SchweigerDataDB, 'Schweiger');
        } catch (err) {
            this.MyLogger.error("Error when creating new logData entry");
            this.MyLogger.error(err);
        }
        this.MyLogger.debug("Writing new producer data set");

        let index = -1;
        try {
            index = this.facilities.findIndex(item => {
                /*
                for (let count = 0; count < 5; count++) {
                    try {
                        return item['fac'] === completeBody.ownerPubKey_x;
                    } catch (err) {
                        this.MyLogger.warn("Unexpected structure of the data");
                        this.MyLogger.warn(JSON.stringify(err));
                        return false;
                    }
                }*/
                try {
                    return item['fac'] === completeBody.ownerPubKey_x;
                } catch (err) {
                    this.MyLogger.warn("Unexpected structure of the data");
                    this.MyLogger.warn(JSON.stringify(err));
                    return false;
                }
            });
        } catch (error3){
            this.MyLogger.error('An error occurred! Check key index - ' + error3);
        }

        this.MyLogger.debug("Index of the selected Schweiger facility: " + index);

        let time = Number(completeBody.epoch);

        if(index < this.producer_count) {   //Sender is Producer
            let greenEnergy = 0;
            let grayEnergy = 0;

            try {
                // this.MyLogger.debug('Check index and facility:')
                if (index != -1 &&
                    ((completeBody['ownerPubKey_x']).toString() === ('EWS' + (index + 1)).toString())
                ) {
                    greenEnergy = Math.round(completeBody.energy_kWh * 12 * 1000);  // in W ( = kWh *12 *1000 )
                    // grayEnergy = ;
                }
            } catch {
                this.MyLogger.error("Schweiger data (EWS" + (index + 1) + ") is incomplete!");
            }
            const name = 'SchweigerEWS_' + (index + 1);
            const keyPairID = name + 'keyPair';
            const keyPair = await this.authService.readSecret(keyPairID);
            let msghashed = poseidonMerkleUtils.poseidonHashFunction([greenEnergy.toString(), grayEnergy.toString(), time.toString()]);
            let msgsigned = this.cryptoService.signMessageWithPoseidon(keyPair.sKey, BigInt(msghashed));

            const signedMsg = [msgsigned.R8[0].toString(), msgsigned.R8[1].toString(), msgsigned.S.toString()];
            //TODO: zweimal time als parameter?
            // only green Power ( in W ) produced
            const producer = new loggedProsumerDataDto(0, greenEnergy, 0, keyPair.pKey[0], keyPair.pKey[1],
                signedMsg, time, 'Producer', time);

            try {
                await this.labelingService.logOne(producer);
            } catch (error) {
                this.MyLogger.error('Could not log data - logOne failed!');
            }
            this.MyLogger.info('Created new labeledData record for a producer');
        }else {
            let consumed = 0;
            try {
                consumed = completeBody.energy_kWh * 1000; //in Wh

                const name = 'SchweigerEWS_C_' + (index + 1);
                const keyPairID = name + 'keyPair';

                const keyPair = await this.authService.readSecret(keyPairID);
                const consumer = new loggedProsumerDataDto(consumed,0,0,keyPair.pKey[0],"",
                    [],completeBody.epoch,'Consumer',time);

                await this.labelingService.logOne(consumer);
                this.MyLogger.info('Created new labeledData record for Consumer')
            }catch (e) {
                this.MyLogger.error(e);
            }

        }

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
            const result = await this.databaseService.getAllIDs(databases.SchweigerDataDB);
            this.MyLogger.debug('Returning all IDs in the database');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                    databases.SchweigerDataDB + '\n' + error);
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
            const res = await this.databaseService.findByID(id, databases.SchweigerDataDB);
            this.MyLogger.debug('Queried record with ID ' + id + '\n' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get the document with this id: ' +
                    id + 'in this database' + databases.SchweigerDataDB + '\n' + error);
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
            const res = await this.databaseService.deleteByID(id, databases.SchweigerDataDB,);
            this.MyLogger.debug('Deleted record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete in ' +
                    databases.SchweigerDataDB + 'for this id: ' + id + '\n this is the error statement: ' + error);
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
            return await this.databaseService.findManyByTime(upperbound, lowerbound, databases.SchweigerDataDB);
        } catch (error) {
            this.MyLogger.error(
                'The following error occurred while trying to get documents within this time period: ' +
                    lowerbound + ' : ' + upperbound + 'in this database' + databases.SchweigerDataDB + '\n' + error);
            return error;
        }
    }
}
