import {Body, Controller, Delete, Get, InternalServerErrorException, Param, Post, UseGuards} from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiCreatedResponse,
    ApiBadRequestResponse,
    ApiOkResponse,
    ApiTags,
    ApiSecurity,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { APIKEYAuthGuard } from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import { LoggeddataService } from 'src/specific.modules/loggedData/loggeddata.service';
import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { databases } from 'src/generic.modules/database/db.enum';
import { DatabaseService } from 'src/generic.modules/database/database.service';
import { masterDataService } from 'src/specific.modules/masterData/masterData.service';
import { LabelingService } from 'src/specific.modules/labeling/labeling.service';
import { loggedProsumerDataDto } from 'src/specific.modules/labeling/labelingData.dto';
import { PoseidonMerkleUtils } from 'src/generic.modules/merkletree/poseidonMerkleUtils';
import { CryptoService } from 'src/generic.modules/crypto/crypto.service';
import { facilities } from 'src/generic.modules/crypto/keyListArgs.enum';
import { HttpService } from '@nestjs/axios';
import { masterRegistryDto } from '../masterData/masterRegistryData.dto';
import { timeFrameDto } from './timeFrame.dto';
import {keyPairDto} from "../labeling/keyPair.dto";
import {AuthService} from "../authentication/auth.service";
import {locationDto} from "../masterData/location.dto";
import { ConfigService } from 'src/config.service';



// #######################################################
//             SMA Probanden
// #######################################################


const poseidonMerkleUtils = new PoseidonMerkleUtils();
@ApiTags('SMAprobanden')
@Controller('smaProbanden')
export class SMAprobandenController {

    consumption = 0;

    uBound_p = 17;
    uBound_c = 17;
    private addressList: {Reference: string, proband: facilities, latitude: number, longitude: number}[];
    private indexHelper = [ '01', '02', '03', '04', '05', '06', '07', '08',
                            '09', '10', '11', '12', '13', '14', '15', '16', '17']

    constructor(
        private readonly masterDataService: masterDataService,
        private readonly loggedDataService: LoggeddataService,
        private readonly databaseService: DatabaseService,
        private readonly labelingService: LabelingService,
        private readonly cryptoService: CryptoService,
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly config: ConfigService,
        private MyLogger: MyLogger,

    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
        setTimeout(() => this.initialize(), 10000);
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
        this.MyLogger.warn('Registering masterData (SMA Probanden): ');
        this.addressList = [
            {
                "Reference": "539df2ca-f41f-4573-8151-ed4eea1eb3ec",
                "proband": facilities.proband01,
                "latitude": 51.28774427,
                "longitude": 9.46614538
            }, {
                "Reference": "3833284b-8fbb-4ee1-bca1-6f1484885fdd",
                "proband": facilities.proband02,
                "latitude": 51.50388961,
                "longitude": 9.79300533
            }, {
                "Reference": "221c31c9-faaf-447c-802a-1ef4e55c7ce1",
                "proband": facilities.proband03,
                "latitude": 51.32403012,
                "longitude": 9.553214744
            }, {
                "Reference": "41f3268f-965c-45e6-9dbe-05ac4419ce24",
                "proband": facilities.proband04,
                "latitude": 51.94510596,
                "longitude": 7.976118975
            }, {
                "Reference": "523b76c4-73a5-410a-b88c-b6c469ee5c22",
                "proband": facilities.proband05,
                "latitude": 51.33996956,
                "longitude": 9.446226003
            }, {
                "Reference": "ba7d5829-8ab5-4bd5-baae-7c1a87468a7f",
                "proband": facilities.proband06,
                "latitude": 48.11739698,
                "longitude": 10.82092263
            }, {
                "Reference": "43227f31-aad4-4d2d-a242-4010d9f14c66",
                "proband": facilities.proband07,
                "latitude": 51.31830028,
                "longitude": 9.668801935
            }, {
                "Reference": "10e813c8-292c-44af-9f30-63ba7920c668",
                "proband": facilities.proband08,
                "latitude": 51.31012967,
                "longitude": 9.673906624
            }, {
                "Reference": "54296a88-dcc0-4db2-95ad-118a2771dc88",
                "proband": facilities.proband09,
                "latitude": 51.33025709,
                "longitude": 9.520220233
            }, {
                "Reference": "225f8b35-eb84-478b-84cb-36fd9d3d3ef5",
                "proband": facilities.proband10,
                "latitude": 51.30973897,
                "longitude": 9.672412452
            }, {
                "Reference": "79fc8c80-e36c-4d5d-919c-1bd9fb4a04c6",
                "proband": facilities.proband11,
                "latitude": 51.36549314,
                "longitude": 9.516736871
            }, {
                "Reference": "aa4654ec-81f1-459f-b04e-d0af50e433c1",
                "proband": facilities.proband12,
                "latitude": 51.30098886,
                "longitude": 9.567875388
            }, {
                "Reference": "cc2c5697-e5f7-4d00-9844-050f2e2c3adc",
                "proband": facilities.proband13,
                "latitude": 51.25006023,
                "longitude": 9.40609201
            }, {
                "Reference": "739e9da2-bced-45ce-bd63-c4398e0a2d9f",
                "proband": facilities.proband14,
                "latitude": 51.28967339,
                "longitude": 9.637216955
            }, {
                "Reference": "e3f0145d-c958-407d-841d-83245dbb58bb",
                "proband": facilities.proband15,
                "latitude": 51.28912707,
                "longitude": 9.542132861
            }, {
                "Reference": "b530463c-11fa-451f-90cd-d533c55f9ec1",
                "proband": facilities.proband16,
                "latitude": 51.29147924,
                "longitude": 9.469785967
            }, {
                "Reference": "11111111-1111-1111-1111-111111111111",
                "proband": facilities.proband17,
                "latitude": 51.063226,
                "longitude": 9.180642
            }
        ]

        for (let adr = 0; adr < this.uBound_p; adr++) {
            // add a producer:
            const name = 'SMAprobanden_p_' + adr ;
            const keyPairID = name + 'keyPair';
            const currentAdr = this.addressList[adr];

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
                    this.MyLogger.error('Error during preparation of SMA Probanden(producer) data:');
                    this.MyLogger.error("Can't store the generated key in the secret-vault or key list" + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the SMA Probanden Controller.");
                }
            }

            if(!await this.masterDataService.ensureRegistered(keyPair.pKey[0])) {
                this.MyLogger.info('Register new master data...');
                const location = new locationDto(currentAdr.latitude, currentAdr.longitude);
                // producer -> preference = null
                const p_masterData = new masterRegistryDto(keyPair.pKey[0], location, null,'solar', 'SMA Probanden (p) (' + this.addressList[adr]['plz'] + ')');
                try {
                    const result = await this.masterDataService.registerMasterData(p_masterData);
                    this.MyLogger.info("Registered masterData (SMA Probanden): " + JSON.stringify(result['prosumer_name'], null, 4));
                } catch (e) {
                    this.MyLogger.error('The following error occurred trying to register masterData (SMA Probanden)(p): ' + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the SMA Probanden Controller.");
                }
            }
        }

        // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+--+-+-+-+-+-+-+-+

        for (let adr = 0; adr < this.uBound_c; adr++) {
            // add a consumer:
            const name = 'SMAprobanden_c_' + adr ;
            const keyPairID = name + 'keyPair';
            const currentAdr = this.addressList[adr];

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
                    this.MyLogger.error('Error during preparation of SMA Probanden (consumer) data:');
                    this.MyLogger.error("Can't store the generated key in the secret-vault or key list" + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the SMA Probanden Controller.");
                }
            }

            if(!await this.masterDataService.ensureRegistered(keyPair.pKey[0])){
                this.MyLogger.info('Register new master data...');
                const location = new locationDto(currentAdr.latitude, currentAdr.longitude);
                // TODO: preference from config
                const c_masterData = new masterRegistryDto(keyPair.pKey[0], location, {wasser: 3, solar: 3},
                    '', 'SMA (c) (' + currentAdr.proband + ')');
                try {
                    const result = await this.masterDataService.registerMasterData(c_masterData);
                    this.MyLogger.info("Registered masterData (SMA Probanden): " + JSON.stringify(result['prosumer_name'], null, 4));
                } catch (error) {
                    this.MyLogger.error('An error occurred trying to register masterData (SMA Probanden)(c): ' + error.toString());
                    throw new InternalServerErrorException(error, "Can't init the SMA Probanden Controller.");
                }
            }
        }
        this.MyLogger.info('SMA Probanden registered.');
    }

    @Post('logData')
    @ApiOperation({summary: 'Records new logged data for SMA Probanden'})
    @ApiBody({type: Object, description: 'A JSON object representing the data that should be logged'})
    @ApiCreatedResponse({description: 'Returns a logData entry'})
    @ApiBadRequestResponse({description: 'Returns if the request was malformed'})
    @ApiResponse({status: 201, description: 'The record has been successfully created.'})
    @ApiSecurity('api_key', ['api_key'])
    // @UseGuards(APIKEYAuthGuard)
    async recordLogData(@Body() completeBody) {
        const result = await this.loggedDataService.createOne(completeBody, databases.SMAprobandenDataDB, 'SMA Probanden');

        let workaroundTime = new Date().toISOString();  // <<--- ISO-Format in real data: 2022-09-01T13:50:00Z
        let timeCorrerctionDummy = 10;
        let time = Math.floor(( (new Date(workaroundTime)).getTime() - timeCorrerctionDummy) / 1000);

        // add producers:
        this.MyLogger.info('SMA Probanden: Start adding producers')
        for(let adr=0; adr < this.uBound_p; ++adr) {
            this.MyLogger.debug((adr + 1) + '. producer ...')
            
            let index = completeBody.Data.findIndex(item => {
                try {
                    return item.Name === this.addressList[adr]['proband'];
                } catch (err) {
                    this.MyLogger.error("Unexpected structure of the data - region not found: ");
                    this.MyLogger.error(JSON.stringify(err));
                    return false;
                }
            });
            this.MyLogger.debug("Index of the selected SMA proband: " + index);
            
            const production = {
                "greenPower": 0,
                "grayPower": 0
            };
            const values = completeBody.Data[index].Values;
            
            if (values.length != 0) {
                this.MyLogger.debug('length of Values = ' + values.length);
                
                for(let val=0; val<values.length; val++) {
                    if(values[val].Mmt === "GridFeedIn") {  // in kW                        
                        production.greenPower = Math.round( values[val].V *1000 );  // in W
                    }
                    // PvProduction (Erzeugung aus dieser PV) für uns uninteressant
                }

                this.MyLogger.debug('Producer at pos ' + index + ' produced ' + JSON.stringify(production) + ' (W)');

                console.log('SMA Probanden (' + this.addressList[adr]['proband'] + ')')
                console.log('------------------------------index: ' + index);
                console.log('Length of Values = ' + values.length);
                for(let i=0;i<values.length;++i){ console.log(values[i].Mmt );}
                console.log('production: ' + JSON.stringify(production) + '(W)\n');

            } else {
                this.MyLogger.warn('At position ' + index + ': Neither production nor consumption - Values is empty!');
                this.MyLogger.warn('Continue with 0 production!');
            }

            try {
                const name = 'SMAprobanden_p_' + adr ;
                const keyPairID = name + 'keyPair';
                const keyPair = await this.authService.readSecret(keyPairID);
                const msghashed = poseidonMerkleUtils.poseidonHashFunction([production.greenPower.toString(), production.grayPower.toString(), time.toString()]);
                const msgsigned = this.cryptoService.signMessageWithPoseidon(keyPair.sKey, BigInt(msghashed));
                const signedMsg = [msgsigned.R8[0].toString(), msgsigned.R8[1].toString(), msgsigned.S.toString()];
                const producer = new loggedProsumerDataDto(
                    (production.grayPower + production.greenPower),  // in W
                    production.greenPower,  // in W
                    production.grayPower,  // in W (=0, da nur Grünstrom (PV/solar) )
                    keyPair.pKey[0],
                    keyPair.pKey[1],
                    signedMsg,
                    time,
                    'Producer',
                    time,
                );
                await this.labelingService.logOne(producer)
                this.MyLogger.info('Created new labeledData record for a producer');
            } catch (err) {
                this.MyLogger.error(err.toString());
            }
        }

        // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+--+-+-+-+-+-+-+-+

        // add consumers:                   // TODO send all consumers' data to their frontend !!
        this.MyLogger.info('SMA Probanden: Start adding consumers')
        for(let adr=0; adr < this.uBound_c; ++adr) {
            this.MyLogger.debug((adr + 1) + '. consumer ...')

            this.MyLogger.info("Looking for " + this.addressList[adr]['proband']);
            let index = completeBody.Data.findIndex(item => {
                try {
                    return item.Name === this.addressList[adr]['proband'];
                } catch (err) {
                    this.MyLogger.warn("Unexpected structure of the.toS data");
                    this.MyLogger.warn(JSON.stringify(err));
                    return false;
                }
            });
            
            this.MyLogger.debug("Index of the selected SMA proband: " + index);
            const values = completeBody.Data[index].Values;
            const consumed = {"greenPower": 0, "grayPower": 0};
            
            if (values.length != 0) {
                this.MyLogger.debug('length of Values = ' + values.length);
                
                for(let val=0; val<values.length; val++) {
                    if(values[val].Mmt === "GridConsumption") {  // in kW                        
                        consumed.grayPower = Math.round( values[val].V *1000 );  // in W
                    }
                }

            } else {
                this.MyLogger.warn('At position ' + index + ': Neither production nor consumption - Values is empty!');
                this.MyLogger.warn('Continue with 0 consumption!');
            }

            try {
                let data = {
                    "data": [{
                        "uuid": 0,
                        "tuples": [ [ Math.floor(time * 1000), consumed.grayPower ] ]  // this.consumption ] ]  // in [ VZtime, W ]
                    }]
                }
                this.MyLogger.info("Simulating VZLogger hook");
                this.MyLogger.debug("Data: " + JSON.stringify(data));
                
                let response = await this.httpService.post("http://nestjs-consumer" + this.indexHelper[adr] + ":82" + this.indexHelper[adr] + "/consumerfrontend/vzpush",
                    data,{headers: {'api_key': this.config.ApiKey}}).toPromise();
                this.MyLogger.debug(response.data);
            } catch {
                this.MyLogger.error("Something went wrong trying to log data in SMA Probanden(vzPush).")
            }

        }
        this.MyLogger.debug('Created new logData record');
        return result;
    }

    @Get()
    @ApiOperation({summary: 'Returns IDs and timestamps of all currently saved documents'})
    @ApiOkResponse({description: 'Returned if LogData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    // @UseGuards(APIKEYAuthGuard)
    async getAllLogData() {
        try {
            const result = await this.databaseService.getAllIDs(databases.SMAprobandenDataDB);
            this.MyLogger.debug('Returning all IDs in the database');
            console.log('Returning all IDs in the database: ' + result);
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                    databases.SMAprobandenDataDB + '\n' + error);
            return error;
        }
    }

    @Get(':id')
    @ApiOperation({summary: 'Get logged data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    @UseGuards(APIKEYAuthGuard)
    async getLogDataById(@Param('id') id: string) {
        try {
            const res = await this.databaseService.findByID(id, databases.SMAprobandenDataDB);
            this.MyLogger.debug('Queried record with ID ' + id + '\n' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get the document with this id: ' +
                    id + 'in this database' + databases.SMAprobandenDataDB + '\n' + error);
            return error;
        }
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete logged data by ID'})
    @ApiResponse({status: 200, description: 'The record has been successfully deleted.',})
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    @UseGuards(APIKEYAuthGuard)
    async deleteLogDataById(@Param('id') id: string) {
        try {
            const res = await this.databaseService.deleteByID(id, databases.SMAprobandenDataDB);
            this.MyLogger.debug('Deleted record with ID ' + id);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete in ' +
                    databases.SMAprobandenDataDB + 'for this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }

    @Post('findByTimePeriod')
    @ApiOperation({summary: 'Get logged data by Time'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiBody({type: timeFrameDto, description: 'A JSON object of upperbound and lower-bound of the time frame to be queried'})
    @ApiSecurity('api_key', ['api_key'])
    @UseGuards(APIKEYAuthGuard)
    async getLogDataByTime(@Body('upperbound') upperbound: number, @Body('lowerbound') lowerbound:number) {
        this.MyLogger.debug('This was assigned for Upperbound:' + upperbound + '\n' + 'This was assigned for lower-bound:' + lowerbound )
        try {
            return await this.databaseService.findManyByTime(upperbound, lowerbound, databases.SMAprobandenDataDB);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get documents within this time period: ' +
                    lowerbound + ' : ' + upperbound + 'in this database' + databases.SMAprobandenDataDB + '\n' + error);
            return error; 
        }
    }
}
