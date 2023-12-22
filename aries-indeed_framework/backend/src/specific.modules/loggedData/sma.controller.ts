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
import {masterDataService} from 'src/specific.modules/masterData/masterData.service';
import {LabelingService} from 'src/specific.modules/labeling/labeling.service';
import {loggedProsumerDataDto} from 'src/specific.modules/labeling/labelingData.dto';
import {PoseidonMerkleUtils} from 'src/generic.modules/merkletree/poseidonMerkleUtils';
import {CryptoService} from 'src/generic.modules/crypto/crypto.service';
import {facilities} from 'src/generic.modules/crypto/keyListArgs.enum';
import {HttpService} from '@nestjs/axios';
import {masterRegistryDto} from '../masterData/masterRegistryData.dto';
import {timeFrameDto} from './timeFrame.dto';
import {keyPairDto} from "../labeling/keyPair.dto";
import {AuthService} from "../authentication/auth.service";
import {locationDto} from "../masterData/location.dto";
import {ConfigService} from "../../config.service";

// #######################################################
//             SMA
// #######################################################

const poseidonMerkleUtils = new PoseidonMerkleUtils();

@ApiTags('SMA')
@Controller('sma')
@UseGuards(APIKEYAuthGuard)
export class SMAController {

    uBound_p = 10;
    uBound_c = 10; // facility in 91177 -->> consumer3
    private addressList: {plz: facilities, latitude: number, longitude: number}[];

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
        setTimeout(async () => this.initialize(), 10000);
    }

    /**
     * Function to initialize all consumer and producer linked to this controller. This includes fetching the key pair
     * and master data for every participant or generate new one.
     * On first start up after a fresh build 404 NOT FOUND Errors will occur but must be ignored since there are no keys or
     * master data do be found yet.
     *
     * @throws InternalServerErrorException on Error while storing a new key pair or master data
     */
    async initialize() {
        this.MyLogger.warn('Registering masterData (SMA): ');
        this.addressList = [
            {
                "plz": facilities.ger04600,
                "latitude": 50.977566,
                "longitude": 12.437406
            }, {
                "plz": facilities.ger04603,
                "latitude": 50.950090,
                "longitude": 12.489023
            }, {
                "plz": facilities.ger08301,
                "latitude": 50.616252,
                "longitude": 12.663929
            }, {
                "plz": facilities.ger08309,
                "latitude": 50.469442,
                "longitude": 12.610048
            }, {
                "plz": facilities.ger25917,
                "latitude": 54.763476,
                "longitude": 9.013129
            }, {
                "plz": facilities.ger59609,
                "latitude": 51.548962,
                "longitude": 8.309165
            }, {
                "plz": facilities.ger71154,
                "latitude": 48.621401,
                "longitude": 8.896882
            }, {
                "plz": facilities.ger85567,
                "latitude": 48.031184,
                "longitude": 11.950554
            }, {
                "plz": facilities.ger85656,
                "latitude": 48.216678,
                "longitude": 12.000332
            }, {
                "plz": facilities.ger91177,
                "latitude": 49.097579,
                "longitude": 11.223815
            }
        ]

        for (let adr = 0; adr < this.uBound_p; adr++) {
            // add a producer:
            const name = 'SMA_p_' + adr ;
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
                    this.MyLogger.error('Error during preparation of SMA (producer) data:');
                    this.MyLogger.error("Can't store the generated key in the secret-vault or key list" + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the SMA Controller.");
                }
            }

            if(!await this.masterDataService.ensureRegistered(keyPair.pKey[0])) {
                this.MyLogger.info('Register new master data...');
                const location = new locationDto(currentAdr.latitude, currentAdr.longitude);
                // producer -> preference = null
                const p_masterData = new masterRegistryDto(keyPair.pKey[0], location, null,'solar', 'SMA (p) (' + this.addressList[adr]['plz'] + ')');
                try {
                    const result = await this.masterDataService.registerMasterData(p_masterData);
                    this.MyLogger.info("Registered masterData (SMA): " + JSON.stringify(result['prosumer_name'], null, 4));
                } catch (e) {
                    this.MyLogger.error('The following error occurred trying to register masterData (SMA)(p): ' + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the SMA Controller.");
                }
            }

        }

        for (let adr = 0; adr < this.uBound_c; adr++) {
            // add a consumer:
            const name = 'SMA_c_' + adr ;
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
                    this.MyLogger.error('Error during preparation of SMA (consumer) data:');
                    this.MyLogger.error("Can't store the generated key in the secret-vault or key list" + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the SMA Controller.");
                }
            }

            if(!await this.masterDataService.ensureRegistered(keyPair.pKey[0])){
                this.MyLogger.info('Register new master data...');
                const location = new locationDto(currentAdr.latitude, currentAdr.longitude);
                // TODO: preference from config
                const c_masterData = new masterRegistryDto(keyPair.pKey[0], location, {wasser: 3, solar: 3},
                    '', 'SMA (c) (' + currentAdr.plz + ')');
                try {
                    const result = await this.masterDataService.registerMasterData(c_masterData);
                    this.MyLogger.info("Registered masterData (SMA): " + JSON.stringify(result['prosumer_name'], null, 4));
                } catch (error) {
                    this.MyLogger.error('An error occurred trying to register masterData (SMA)(c): ' + error.toString());
                    throw new InternalServerErrorException(error, "Can't init the SMA Controller.");
                }
            }
        }
        this.MyLogger.info('SMA registered.');
    }

    @Post('logData')
    @ApiOperation({summary: 'Records new logged data for SMA'})
    @ApiBody({type: Object, description: 'A JSON object representing the data that should be logged'})
    @ApiCreatedResponse({description: 'Returns a logData entry'})
    @ApiBadRequestResponse({description: 'Returns if the request was malformed'})
    @ApiResponse({status: 201, description: 'The record has been successfully created.'})
    @ApiSecurity('api_key', ['api_key'])
    async recordLogData(@Body() completeBody) {
        this.MyLogger.info('serving /logData');
        const result = await this.loggedDataService.createOne(completeBody, databases.SMADataDB, 'SMA');

        let workaroundTime = new Date().toISOString();  // <<--- ISO-Format in real data: 2022-09-01T13:50:00Z
        let timeCorrerctionDummy = 10;
        let time = Math.floor(( (new Date(workaroundTime)).getTime() - timeCorrerctionDummy) / 1000);

        // add producers:
        this.MyLogger.info('SMA: Start adding producers')
        for(let adr=0; adr < this.uBound_p; ++adr) {

            this.MyLogger.debug((adr + 1) + '. producer ...')

            let index = completeBody.Data.findIndex(item => {
                try {
                    return item.RegionName === this.addressList[adr]['plz'];
                } catch (err) {
                    this.MyLogger.error("Unexpected structure of the data");
                    this.MyLogger.error(JSON.stringify(err));
                    return false;
                }
            });

            this.MyLogger.debug("Index of the selected SMA plant: " + index);

            let produced = 0;
            let gridFeed = completeBody.Data[index].Values.findIndex(item => {
                try {
                    return item.Mmt === "GridFeedIn";  // in kW
                } catch (error) {
                    return false;
                }
            });
            this.MyLogger.debug('GridFeedin-Index: ' + gridFeed + (gridFeed===0?' (valid)':' (invalid)'));
            try {
                if (index != -1) {
                    produced = completeBody.Data[index].Values[gridFeed].V;  // in kW
                    this.MyLogger.debug('produced = ' + produced + ' (kW)')
                }
            } catch {
                this.MyLogger.error("SMA data incomplete - key not found!");
            }
            let greenPower = Math.round( produced *1000 );  // in W ( = kW *1000 )
            let grayPower = 0;

            try {
                const name = 'SMA_p_' + adr ;
                const keyPairID = name + 'keyPair';
                const keyPair = await this.authService.readSecret(keyPairID);
                const msghashed = poseidonMerkleUtils.poseidonHashFunction([greenPower.toString(), grayPower.toString(), time.toString()]);
                const msgsigned = this.cryptoService.signMessageWithPoseidon(keyPair.sKey, BigInt(msghashed));
                const signedMsg = [msgsigned.R8[0].toString(), msgsigned.R8[1].toString(), msgsigned.S.toString()];
                //TODO: zweimal time als parameter?
                //only green power ( in W ) produced
                const producer = new loggedProsumerDataDto(0, greenPower, 0, keyPair.pKey[0], keyPair.pKey[1], signedMsg, time, 'Producer', time,);

                await this.labelingService.logOne(producer)
                this.MyLogger.info('Created new labeledData record for a producer');
            } catch (err) {
                this.MyLogger.error(err.toString());
            }
        }

        // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+--+-+-+-+-+-+-+-+

        // add consumers:
        this.MyLogger.info('SMA: Start adding consumers')
        for(let adr=0; adr < this.uBound_c-1; ++adr) {

            this.MyLogger.debug((adr + 1) + '. consumer ...')

            this.MyLogger.info("Looking for " + this.addressList[adr]['plz']);
            let index = completeBody.Data.findIndex(item => {
                try {
                    return item.RegionName === this.addressList[adr]['plz'];
                } catch (err) {
                    this.MyLogger.warn("Unexpected structure of the data");
                    this.MyLogger.warn(JSON.stringify(err));
                    return false;
                }
            });
            
            this.MyLogger.debug("Index of the selected SMA plant: " + index);
            let consumed = 0;
            let gridCons = completeBody.Data[index].Values.findIndex(item => {
                try {
                    return item.Mmt === "GridConsumption";  // in kW
                } catch (error) {
                    return false;
                }
            })
            this.MyLogger.debug('GridConsumption = ' + gridCons + (gridCons===1?' (valid)':' (invalid)'))
            try {
                if (index != -1) {
                    consumed = completeBody.Data[index].Values[gridCons].V;  // in kW
                    this.MyLogger.debug('consumed = ' + consumed + ' (kW)')
                }
            } catch {
                this.MyLogger.error("SMA data incomplete - key not found!");
            }

            let greenPower = Math.round( consumed *1000 );  // in W ( = kW *1000 )

            try {
                const name = 'SMA_c_' + adr ;
                const keyPairID = name + 'keyPair';
                const keyPair = await this.authService.readSecret(keyPairID);
                const consumer = new loggedProsumerDataDto(greenPower, 0, 0, keyPair.pKey[0], "", [], time, 'Consumer', time,);
                await this.labelingService.logOne(consumer)
                this.MyLogger.info('Created new labeledData record for a consumer');
            } catch (err) {
                this.MyLogger.error(err);
            }
        }

        // send last one to consumer3
        let index = completeBody.Data.findIndex(item => {
            try {
                return item.RegionName === this.addressList[this.uBound_c-1]['plz'];
            } catch (err) {
                this.MyLogger.warn("Unexpected structure of the data");
                this.MyLogger.warn(JSON.stringify(err));
                return false;
            }
        });
        
        this.MyLogger.debug("Index of the selected SMA plant: " + index);

        let gridCons = completeBody.Data[index].Values.findIndex(item => {
            try {
                return item.Mmt === "GridConsumption";  // in kW
            } catch (error) {
                return false;
            }
        })

        let consumption
        try {
            if (index != -1) {
                consumption = Math.round(completeBody.Data[index].Values[gridCons].V *1000 );  // in W (X kW = X*1000 W)
            }
        } catch {
            this.MyLogger.error("SMA data incomplete - key not found!");
        }

        try {
            let data = {
                "data": [{
                    "uuid": 0,
                    "tuples": [ [ Math.floor(time * 1000), consumption ] ]  // in [ VZtime, W ]
                }]
            }
            this.MyLogger.info("Simulating VZLogger hook");
            this.MyLogger.debug("Data: " + JSON.stringify(data));

            let response = await this.httpService.post("http://nestjs-consumer3:8109/consumerfrontend/vzpush", data, {headers: {'api_key': this.config.ApiKey}}).toPromise();
            this.MyLogger.debug(response.data);
        } catch {
            this.MyLogger.error("Something went wrong trying to log data in SMA (vzPush).")
        }

        this.MyLogger.debug('Created new logData record');
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
            const result = await this.databaseService.getAllIDs(databases.SMADataDB,);
            this.MyLogger.debug('Returning all IDs in the database');
            console.log('Returning all IDs in the database: ' + result);
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                    databases.SMADataDB + '\n' + error);
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
            const res = await this.databaseService.findByID(id, databases.SMADataDB);
            this.MyLogger.debug('Queried record with ID ' + id + '\n' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get the document with this id: ' +
                    id + 'in this database' + databases.SMADataDB + '\n' + error);
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
            const res = await this.databaseService.deleteByID(id, databases.SMADataDB);
            this.MyLogger.debug('Deleted record with ID ' + id);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete in ' +
                    databases.SMADataDB + 'for this id: ' + id + '\n this is the error statement: ' + error);
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
            return await this.databaseService.findManyByTime(upperbound, lowerbound, databases.SMADataDB);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get documents within this time period: ' +
                    lowerbound + ' : ' + upperbound + 'in this database' + databases.SMADataDB + '\n' + error);
            return error; 
        }
    }
}
