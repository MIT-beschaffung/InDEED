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
import {LabelingService} from '../labeling/labeling.service';
import {CryptoService} from 'src/generic.modules/crypto/crypto.service';
import {masterDataService} from '../masterData/masterData.service';
import {masterRegistryDto} from '../masterData/masterRegistryData.dto';
import {locationDto} from '../masterData/location.dto';
import {PoseidonMerkleUtils} from 'src/generic.modules/merkletree/poseidonMerkleUtils';
import {loggedProsumerDataDto} from '../labeling/labelingData.dto';
import {HttpService} from "@nestjs/axios";
import {facilities} from 'src/generic.modules/crypto/keyListArgs.enum';
import {timeFrameDto} from './timeFrame.dto';
import {keyPairDto} from "../labeling/keyPair.dto";
import {AuthService} from "../authentication/auth.service";
import {ConfigService} from "../../config.service";

const poseidonMerkleUtils = new PoseidonMerkleUtils();

@ApiTags('Rheinenergie')
@Controller('rheinenergie')
@UseGuards(APIKEYAuthGuard)
export class RheinenergieController{

    consumption: number[] = [];
    uBound_p = 6;
    uBound_c = 6;  // consumer (ZE06 AG06) -->> consumer1
    private facilities: {fac: facilities, latitude: number, longitude: number}[]

    constructor(
        private readonly loggedDataService: LoggeddataService,
        private readonly databaseService: DatabaseService,
        private readonly labelingService: LabelingService,
        private readonly cryptoService: CryptoService,
        private readonly httpService: HttpService,
        private readonly masterDataService: masterDataService,
        private readonly authService: AuthService,
        private readonly config: ConfigService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
        setTimeout(async () => this.initialize(), 30000);
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
                "fac": facilities.ze01,
                "latitude": 50.949543,
                "longitude":6.9915025
            },{
                "fac": facilities.ze02,
                "latitude": 50.950286,
                "longitude":6.9922295
            },{
                "fac": facilities.ze03,
                "latitude": 50.949596,
                "longitude":6.9906784
            },{
                "fac": facilities.ze04,
                "latitude": 50.949646,
                "longitude":6.9900973
            },{
                "fac": facilities.ze05,
                "latitude": 50.950902,
                "longitude":6.9903091
            },{
                "fac": facilities.ze06,
                "latitude": 50.950534,
                "longitude":6.9912673
            }
        ]

        this.MyLogger.warn('Registering masterData (Rheinenergie): ');
        // producer
        for (let facilityNbr=0; facilityNbr < this.uBound_p; facilityNbr++) {
            const currentFac = this.facilities[facilityNbr];
            const name = 'Rheinenergie_p_' + facilityNbr ;
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
                    this.MyLogger.error('Error during preparation of Rheinenergie (producer) data:');
                    this.MyLogger.error("Can't store the generated key in the secret-vault or key list" + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the Rheinenergie Controller.");
                }
            }

            if(!await this.masterDataService.ensureRegistered(keyPair.pKey[0])) {
                this.MyLogger.info('Register new master data...');
                const location = new locationDto(currentFac.latitude, currentFac.longitude);
                // producer -> preference = null
                const p_masterData = new masterRegistryDto(keyPair.pKey[0], location, null,'hydro', 'Rheinenergie ' + currentFac.fac + ' (p)');
                try {
                    await this.masterDataService.registerMasterData(p_masterData);
                    this.MyLogger.info("Registered Rheinenergie (" + currentFac.fac + ") producer masterData: ");
                } catch (e) {
                    this.MyLogger.error('The following error occurred trying to register masterData (Rheinenergie producer): ' + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the Rheinenergie Controller.");
                }
            }
        }

        // consumer
        for (let facilityNbr=0; facilityNbr < this.uBound_c; facilityNbr++) {

            this.consumption.push(0);

            const currentFac = this.facilities[facilityNbr];
            const name = 'Rheinenergie_c_' + facilityNbr ;
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
                    this.MyLogger.error('Error during preparation of Rheinenergie (consumer) data:');
                    this.MyLogger.error("Can't store the generated key in the secret-vault or key list" + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the Rheinenergie Controller.");
                }
            }

            if(!await this.masterDataService.ensureRegistered(keyPair.pKey[0])) {
                this.MyLogger.info('Register new master data...');
                const location = new locationDto(currentFac.latitude, currentFac.longitude);
                // producer -> preference = null
                const c_masterData = new masterRegistryDto(keyPair.pKey[0], location, {wasser: 3, solar: 3},'', 'Rheinenergie ' + currentFac.fac + ' (c)');
                try {
                    await this.masterDataService.registerMasterData(c_masterData);
                    this.MyLogger.info("Registered Rheinenergie (" + currentFac.fac + ") consumer masterData: ");
                } catch (e) {
                    this.MyLogger.error('The following error occurred trying to register masterData (Rheinenergie consumer): ' + e.toString());
                    throw new InternalServerErrorException(e, "Can't init the Rheinenergie Controller.");
                }
            }
        }
        this.MyLogger.info('Rheinenergie registered.');
    }

    @Post('logData')
    @ApiOperation({summary: 'Records new logged data for Rheinenergie'})
    @ApiBody({type: loggedProsumerDataDto, description: 'A JSON object representing the data that should be logged'})
    @ApiCreatedResponse({description: 'Returns a logData entry'})
    @ApiBadRequestResponse({description: 'Returns if the request was malformed'})
    @ApiResponse({status: 201, description: 'The record has been successfully created.'})
    @ApiSecurity('api_key', ['api_key'])
    async recordLogData(@Body() completeBody) {
        this.MyLogger.info('serving /logData');
        const result = await this.loggedDataService.createOne(completeBody, databases.RheinenergieDataDB, 'Rheinenergie');

        try {
            // translate to english decimal style:
            const Wert = Number(Math.round( ( (completeBody.Wert).toString().replace(',','.') ) * 1000 ) );  // in W ( = kW *1000 )

            let time = completeBody.Zeitstempel;

            // add producer
            for (let facilityNbr=0; facilityNbr < this.uBound_p; facilityNbr++) {
                if (completeBody.Bezeichnung == '4' && completeBody['Station-ID'] == this.facilities[facilityNbr]["fac"]) {

                    let greenEnergy = 0;
                    let grayEnergy = 0;
                
                    try {
                        greenEnergy = Math.abs( Math.min(Wert, 0) );  // in W -- "producer dummy", if Wert > 0
                    } catch (error) {
                        this.MyLogger.error('The following error occurred trying to update production (rheinenergie):' + error);
                    }

                    const name = 'Rheinenergie_p_' + facilityNbr ;
                    const keyPairID = name + 'keyPair';
                    const keyPair = await this.authService.readSecret(keyPairID);
                    const msghashed = poseidonMerkleUtils.poseidonHashFunction([ greenEnergy.toString(), grayEnergy.toString(), time.toString() ]);
                    const msgsigned = this.cryptoService.signMessageWithPoseidon(keyPair.sKey, BigInt(msghashed));
                    const signedMsg = [msgsigned.R8[0].toString(), msgsigned.R8[1].toString(), msgsigned.S.toString()];
                    try {
                        //TODO: zweimal time als param
                        //only green Power produced
                        const producer = new loggedProsumerDataDto(0, greenEnergy, 0, keyPair.pKey[0], keyPair.pKey[1], signedMsg, time, 'Producer', time,);
                        await this.labelingService.logOne(producer);
                        this.MyLogger.info('Created new labeledData record for a producer');
                    } catch (error) {
                        this.MyLogger.error('The following error occurred trying to register masterData (Rheinenergie)(p): ' + error);
                    }
                }
            }

            // add consumer
            for (let facilityNbr=0; facilityNbr < this.uBound_c-1; facilityNbr++) {
                if (completeBody.Bezeichnung == '4' && completeBody['Station-ID'] == this.facilities[facilityNbr]["fac"]) {
                    try {
                        this.consumption[facilityNbr] = Math.max(Wert, 0);  // in W -- "consumer dummy", if Wert < 0
                    } catch (error) {
                        this.MyLogger.error('The following error occurred trying to update production (rheinenergie):' + error.toString());
                    }

                    try {
                        const name = 'Rheinenergie_c_' + facilityNbr ;
                        const keyPairID = name + 'keyPair';
                        const keyPair = await this.authService.readSecret(keyPairID);
                        //TODO: zweimal time als parameter, optionale parameter einführen
                        //only green Power consumed
                        const consumer = new loggedProsumerDataDto(this.consumption[facilityNbr], 0, 0, keyPair.pKey[0], "", [], time, 'Consumer', time);
                        await this.labelingService.logOne(consumer);
                    } catch (err) {
                        this.MyLogger.error('The following error occurred trying to register masterData (Rheinenergie)(c): ' + err.toString());
                    }
                }
            }

            // send last one to consumer1
            if (completeBody.Bezeichnung === '4' && completeBody['Station-ID'] === this.facilities[this.uBound_c-1]['fac']) {
                try {
                    let data = {
                        "data": [{
                            "uuid": 0,
                            "tuples": [ [ Math.floor(time * 1000), Math.max(Wert,0) ] ]  // in [ VZtime, W ]
                        }]
                    }
                    this.MyLogger.info("Simulating VZLogger hook");
                    this.MyLogger.debug("Data: " + JSON.stringify(data));

                    //TODO: warum ist das der job vom frontend?!
                    let response = await this.httpService.post("http://nestjs-consumer1:8106/consumerfrontend/vzpush", data, {headers: {'api_key': this.config.ApiKey}}).toPromise();
                    this.MyLogger.debug(response.data);

                } catch {
                    this.MyLogger.error("Something went wrong trying to log data in Rheinenergie (vzPush).")
                }
            }
        } catch (error3) {
            this.MyLogger.error('Something went wrong during logData: ' + error3.toString());
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
            const result = await this.databaseService.getAllIDs(databases.RheinenergieDataDB);
            this.MyLogger.debug('Returning all IDs in the database');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                    databases.RheinenergieDataDB + '\n' + error);
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
            const res = await this.databaseService.findByID(id, databases.RheinenergieDataDB);
            this.MyLogger.debug('Queried record with ID ' + id + '\n' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get the document with this id: ' +
                    id + 'in this database' + databases.RheinenergieDataDB + '\n' + error);
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
            const res = await this.databaseService.deleteByID(id, databases.RheinenergieDataDB,);
            this.MyLogger.debug('Deleted record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete in ' +
                    databases.RheinenergieDataDB + 'for this id: ' + id + '\n this is the error statement: ' + error);
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
            return await this.databaseService.findManyByTime(upperbound, lowerbound, databases.RheinenergieDataDB);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get documents within this time period: ' +
                    lowerbound + ' : ' + upperbound + 'in this database' + databases.RheinenergieDataDB + '\n' + error);
            return error;
        }
    }
}





// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
/*
 1,Wirkenergie   gesamt HAK 1           Messung - Einspeisung EVU
 2,Wirkenergie   gesamt Bezug HAK 1     Messung - Einspeisung EVU
 3,Wirkenergie   gesamt Lieferung HAK 1 Messung - Einspeisung EVU
 4,Wirkleistung  gesamt HAK 1           Messung - Einspeisung EVU

 5,Wirkenergie   gesamt HAK 2           Messung - Einspeisung Kunde
 6,Wirkenergie   gesamt Bezug HAK 2     Messung - Einspeisung Kunde
 7,Wirkenergie   gesamt Lieferung HAK 2 Messung - Einspeisung Kunde
 8,Wirkleistung  gesamt HAK 2           Messung - Einspeisung Kunde

 9,Wirkenergie   gesamt                 Messung - Einspeisung RE
10,Wirkenergie   gesamt Bezug           Messung - Einspeisung RE
11,Wirkenergie   gesamt Lieferung       Messung - Einspeisung RE
12,Wirkleistung  gesamt                 Messung - Einspeisung RE

13,Wirkenergie   gesamt                 Messung - WP
14,Wirkleistung  gesamt                 Messung - WP
15,Wirkenergie   gesamt                 Messung - Heizstab
16,Wirkleistung  gesamt                 Messung - Heizstab

17,Wirkenergie   gesamt                 Messung - PV + Batterie
18,Wirkenergie   gesamt Bezug           Messung - PV + Batterie
19,Wirkenergie   gesamt Lieferung       Messung - PV + Batterie
20,Wirkleistung  gesamt                 Messung - PV + Batterie

21,Wirkenergie   gesamt                 Messung - Abgang PV
22,Wirkenergie   gesamt Bezug           Messung - Abgang PV
23,Wirkenergie   gesamt Lieferung       Messung - Abgang PV
24,Wirkleistung  gesamt                 Messung - Abgang PV

25,Wirkenergie   gesamt                 Messung - Abgang Batterie
26,Wirkenergie   gesamt Bezug           Messung - Abgang Batterie
27,Wirkenergie   gesamt Lieferung       Messung - Abgang Batterie
28,Wirkleistung  gesamt                 Messung - Abgang Batterie
*/
