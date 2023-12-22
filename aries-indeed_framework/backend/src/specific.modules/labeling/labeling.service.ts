import {Injectable, NotFoundException} from '@nestjs/common';
import {EventEmitter2} from 'eventemitter2';
import {ConfigService} from 'src/config.service';
import {MerkleTreeService} from 'src/generic.modules/merkletree/merkletree.service';
import {DatabaseService} from 'src/generic.modules/database/database.service';
import {merkleLemmaElementDto} from 'src/generic.modules/merkletree/merkleLemmaElement.dto';
import {merkleProofDto} from 'src/generic.modules/merkletree/merkleProof.dto';
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {databases} from 'src/generic.modules/database/db.enum';
import {
    labelingMerkleProofDto,
    labelingProofDto,
    nonVerifiableMasterDataDto,
    producerConsumerTransactionDto,
    rawConsumerLabelingDataDto,
    rawProducerLabelingDataDto
} from './labelingProof.dto';
import {labelingZKPInfoDto} from './labelingZKPInputDto';
import {loggedProsumerDataDto} from './labelingData.dto';
import {QuorumService} from 'src/generic.modules/quorum/quorum.service';
import {BigNumber} from 'bignumber.js';
import {
    CommittedProsumerData,
    EnergyData,
    LoggedProsumerData,
    VerifiableProsumerData,
} from '../../generic.modules/schemas/labeledData.schema';
import {roles} from 'src/generic.modules/schemas/roles.enum';
import {HttpService} from '@nestjs/axios';
import {CryptoService} from 'src/generic.modules/crypto/crypto.service';
import {PoseidonMerkleUtils} from "../../generic.modules/merkletree/poseidonMerkleUtils";
import {masterDataService} from '../masterData/masterData.service';
import {keyPairDto} from './keyPair.dto'
import {locationDto} from "../masterData/location.dto";
import {masterRegistryDto} from "../masterData/masterRegistryData.dto";


const Web3 = require('web3');
const ppMax = BigInt(Math.pow(2, 252) - 1);
const poseidonMerkleUtils = new PoseidonMerkleUtils();

const final_num_producers = 64
const final_num_consumers = 512

const legacy_data_lifetime = 30*24*60*60 //30 days

@Injectable()
export class LabelingService {
    private starttime = Math.round(Date.now()/1000);  // initialized to prevent starttime=0 during first proofGeneration

    constructor(
        private readonly databaseService: DatabaseService,
        private readonly config: ConfigService,
        private readonly Event: EventEmitter2,
        private readonly MerkleTreeService: MerkleTreeService,
        private readonly QuorumService: QuorumService,
        private readonly HttpService: HttpService,
        private readonly CryptoService: CryptoService,
        private readonly masterDataService: masterDataService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Sets the global_timer for comparison
     */
     setStarttime(): void {
        try {
            this.starttime = Math.round(Date.now()/1000) - 300;
        } catch (error) {
            this.MyLogger.error("Setting start time failed: " + error);
        }
     }

    /**
     * Converts a Number or BigNumber to Ethereum-style hex
     * @param n the number
     * @returns the hex string
     */
    p256(n: number | BigNumber): string {
        let nstr = new BigNumber(n).toString(16);
        while (nstr.length < 64) nstr = '0' + nstr;
        nstr = '0x' + nstr;
        return nstr;
    }

    /**
     * Auxiliary function to convert an Ethereum-style hex string to a number string.
     * @param s the hex string
     * @returns the number string
     */
    p256_inv(s: string): string {    // stimmt das schon so ??
        return new BigNumber(s).toString();
    }

    /**
     * Creates a new keypair, consisting out of a private and a public key.
     *
     * @returns the keypair as keyPairDto object
     */
    createKeyPair(): keyPairDto {
        let sKey, pKey;
        do {
            sKey = this.CryptoService.generateSecretKey();
            pKey = this.CryptoService.getPublicKey(sKey);
        } while (BigInt(pKey[0]) >= ppMax);

        if (pKey.length >= 77) {
            this.MyLogger.error("Public key too long despite creation algorithm");
        }
        return new keyPairDto(sKey, pKey);
    }

    /**
     * Auxiliary function to generate log data for consumer dummys.
     * The key will be a random number and the consumption 0.
     *
     * @returns the data as loggedProsumerDataDto
     */
    createConsumer(): loggedProsumerDataDto {
        const key = Math.round(Math.random() * 100000000000).toString(10) + Math.round(Math.random() * 100000000000).toString(10);
        const consumedPower = 0;
        const timestamp = this.starttime + 2;

        return new loggedProsumerDataDto(
            consumedPower,
            0,
            0,
            key,
            '',    // consumers do not need a y coordinate of public key
            [],    // signedMsg (only Prod)
            timestamp,
            'Consumer',
            0
        )
    }

    /**
     * Auxiliary function to generate log data for producer dummys.
     * This data contains a new generated keypair. Production and consumption are both 0.
     */
    createProducer(): loggedProsumerDataDto {
        const keys = this.createKeyPair();

        const producedGreenPower = 0;
        const producedGrayPower = 0;
        const timestamp = this.starttime + 2;

        let msghashed = poseidonMerkleUtils.poseidonHashFunction([producedGreenPower.toString(), producedGrayPower.toString(), timestamp.toString()]);
        let msgsigned = this.CryptoService.signMessageWithPoseidon(keys.sKey, BigInt(msghashed));

        return new loggedProsumerDataDto(
            0,
            producedGreenPower,
            producedGrayPower,
            keys.pKey[0].toString(),
            keys.pKey[1].toString(),
            [msgsigned.R8[0].toString(), msgsigned.R8[1].toString(), msgsigned.S.toString()],
            timestamp,
            'Producer',
            0
        )
    }

    /**
     * Saves data to LoggedProsumerDataDB. Selects Production/Consumption based on role.
     * @param data: LoggedProsumerDataDto
     * @returns the response from Mongoose (or the error object)
     */
    async logOne(data: loggedProsumerDataDto) {
        // const timestamp = Date.now();
        const timestamp = data.timestamp;
        const timestampReadable = new Date(timestamp).toString();
        const owner = data['ownerPubkey_x'];
        let temp: EnergyData;

        //Select Production / Consumption based on role.
        if (data.role == roles.CONSUMER) {
            this.MyLogger.debug("Recording consumer data for labeling");
            temp = {
                consumedPower: data.consumedPower,
                ownerPubKey_x: data.ownerPubKey_x,
                timestamp: data.timestamp,
                role: data.role,
            };

        } else if (data.role == roles.PRODUCER) {
            this.MyLogger.debug("Recording producer data for labeling");
            temp = {
                consumedPower: data.consumedPower,
                greenProduction: data.greenPower,
                grayProduction: data.grayPower,
                ownerPubKey_x: data.ownerPubKey_x,
                ownerPubKey_y: data.ownerPubKey_y,
                signedMsg: data.signedMsg,
                timestamp: data.timestamp,
                role: data.role,
            };
        }

        const result_hashed: string = this.MerkleTreeService.hashObject(data, 'SHA256');

        const newLogData = {
            data: temp,
            timestampReadable,
            timestamp,
            dataHash: result_hashed,
            owner,
        };

        try {
            return await this.databaseService.saveOne(newLogData, databases.LoggedProsumerDataDB);
        } catch (error) {
            this.MyLogger.error('This error occurred while saving to LoggedDatabase: ' + error,);
            this.MyLogger.info("Data: " + JSON.stringify(newLogData));
            return error;
        }
    }

    /**
     * @deprecated use the databaseService.deleteByID() function instead
     *
     * Deletes an entry with given id from the given database
     *
     * @param id the id
     * @param database the database
     * @returns the response from Mongoose
     * @throws NotFoundException
     */
    async deleteById(id: string, database: databases) {
        const result = await this.databaseService.deleteByID(id, database);
        if (result == undefined) {
            throw new NotFoundException('Could not find id ' + id + ' in database ' + database);
        } else {
            return result;
        }
    }

    /**
     * @deprecated use databaseService.deleteAll() instead
     *
     * Deletes all entries from the given Database.
     * @param database the database
     */
    async deleteAll(database: databases): Promise<void> {
        const ids = await this.databaseService.getAllIDs(database);
        let promises = [];
        ids.forEach((id) => {promises.push(this.databaseService.deleteByID(id, database));});
        await Promise.all(promises);
    }

    /**
     * @deprecated use the databaseService.findByID() function instead
     *
     * Returns an entry from the given database for the given id
     *
     * @param id the id
     * @param database the database
     * @returns the matching entry
     * @throws NotFoundException
     */
    async findByID(id: string, database: databases): Promise<LoggedProsumerData | CommittedProsumerData | VerifiableProsumerData> {
        let logdata;
        try {
            logdata = await this.databaseService.findByID(id, database);
        } catch (error) {
            throw new NotFoundException('could not find requested data in database ' + database);
        }

        if (!logdata) {
            throw new NotFoundException('could not find requested labeling data',);
        }
        return logdata;
    }

    /**
     * Computes the distance between to given locations on the globe.
     *
     * @param location1 first location as locationDto
     * @param location2 second location
     * @returns the distance
     */
    async getDistance(location1: locationDto, location2: locationDto): Promise<number> {
        let radius=6371; // Earth radius in km
        
        // Convert everything into radiant, 2\pi = 360°
        let latitude1 = location1['latitude'] / 180 * Math.PI;
        let longitude1= location1['longitude'] / 180 * Math.PI;
        
        let latitude2 = location2['latitude'] / 180 * Math.PI;
        let longitude2 = location2['longitude'] / 180 * Math.PI;
        
        // Compute distance
        // formula from https://www.movable-type.co.uk/scripts/latlong.html
        return radius * Math.acos(
                    Math.sin(latitude2)*Math.sin(latitude1) +
                    Math.cos(latitude2)*Math.cos(latitude1)*Math.cos(longitude2 - longitude1)
                );
    }

    /**
     * Generates the distance matrix that's sent to the optimization service.
     *
     * @param c_masterData array of master data from the consumers // TODO this is redundant
     * @param p_length the number of producers
     * @param c_locations array of the consumer locations
     * @param p_locations array of the producer locations
     *
     * @returns a 2D array containing the distance between all consumers and producers
     */
    async generateDistanceMatrix(c_masterData: masterRegistryDto[], p_length: number, c_locations: locationDto[], p_locations: locationDto[]): Promise<number[][]> {
        // what if p_masterData.length > c_masterData.length ?!
        this.MyLogger.info("Generating distance matrix");

        // scaling factor
        const rho = 0.9;
        
        // get preferences:
        const preferences = [];
        for(let c =0; c < c_masterData.length; ++c) {
            preferences.push(c_masterData[c]['preference']);
        }

        let distanceMatrix = [];
        for (let c = 0; c < c_masterData.length; c++) {
            distanceMatrix[c] = [];
            for (let p = 0; p < p_length; p++) {
                distanceMatrix[c][p] = Math.round( (await this.getDistance(c_locations[c], p_locations[p]))*(1 - rho*preferences[c]/10) *100)/100;
                // Workaround: Why are there values 'null' in the distance matrix? 
                if(!distanceMatrix[c][p]) {
                    distanceMatrix[c][p] = 0;
                }
            }
        }

        this.MyLogger.debug('Size of distance matrix: ' + distanceMatrix.length + ' x ' + distanceMatrix[0].length);
        return distanceMatrix;
    }

    /**
     * Auxiliary function to archive an amount of consumer and producer log entries that is a power of 2.
     * The function will fetch all logged data from LoggedProsumerDataDB and generate dummy data until the number of
     * entries match final_num_producers and final_num_consumers.
     * The generated data is stored in the DB.
     */
    async fillDummyData(): Promise<void> {
        this.MyLogger.debug('Counting producer and consumer data');
        this.MyLogger.warn('start time: ' + this.starttime);
        let num_producers = 0;
        let num_consumers = 0;
        let loggedData: LoggedProsumerData[] =
            await this.databaseService.findManyByID(await this.databaseService.getAllIDs(databases.LoggedProsumerDataDB), databases.LoggedProsumerDataDB);

        const known_keys = [];
        for (const data of loggedData) {
            //makes sure only data in the current timeframe is used
            if(data.data.timestamp < this.starttime){
                if(data.data.timestamp < (this.starttime - legacy_data_lifetime)){
                    await this.databaseService.deleteByID(data._id, databases.LoggedProsumerDataDB);
                }
                continue;
            }else if(data.data.timestamp >= this.starttime+300){
                continue;
            }
            //DIRTY FIX: make sure the keys only appear once -> broken since consumers are mapped to frontends
            // TODO: why is consumer1 aka. Rheinenergie ZE06 AG06 two times in this list at all?
            else if (known_keys.includes(data.data.ownerPubKey_x)) {
                this.MyLogger.error("Found two logged data for one key, removing...");
                await this.databaseService.deleteByID(data._id, databases.LoggedProsumerDataDB);
                continue;
            } else {
                known_keys.push(data.data.ownerPubKey_x)
            }

            if (data.data.role == roles.CONSUMER) {
                num_consumers += 1;
            } else if (data.data.role == roles.PRODUCER) {
                num_producers += 1;
            } else {
                this.MyLogger.error('Unknown role');
            }
        }
        this.MyLogger.info('Found ' + num_producers + ' producers and ' + num_consumers + ' consumers');
        if (num_producers > final_num_producers || num_consumers > final_num_consumers) {
            this.MyLogger.error('Too many entries were there initially');
            await this.deleteAll(databases.LoggedProsumerDataDB);
            await this.deleteAll(databases.CommittedProsumerDataDB);
        } else if (num_producers < final_num_producers || num_consumers < final_num_consumers) {
            this.MyLogger.info('Creating additional data (for testing purposes)');

            if (num_consumers < final_num_consumers) {
                this.MyLogger.info('Number of consumers needed: ' + (final_num_consumers - num_consumers).toString());
                for (let i = num_consumers; i < final_num_consumers; i++) {
                    let consumer = this.createConsumer();
                    await this.logOne(consumer);
                }
            }
            if (num_producers < final_num_producers) {
                this.MyLogger.info('Number of producers needed: ' + (final_num_producers - num_producers).toString());
                for (let i = num_producers; i < final_num_producers; i++) {
                    let producer = this.createProducer();
                    await this.logOne(producer);
                }
            }

            this.MyLogger.debug('Counting producer and consumer data again');
            num_producers = 0;
            num_consumers = 0;
            try {
                loggedData = await this.databaseService.findManyByID(await this.databaseService.getAllIDs(databases.LoggedProsumerDataDB), databases.LoggedProsumerDataDB);
            } catch (error) {
                this.MyLogger.error('This error occurred during findManyById while creating additional dummy data: ' + error)
            }
            for (const data of loggedData) {

                if(data.data.timestamp < this.starttime || //Data not in scope
                    data.data.timestamp >= this.starttime + 300){
                    continue;
                }
                if (data.data.role == roles.CONSUMER) {
                    num_consumers += 1;
                } else if (data.data.role == roles.PRODUCER) {
                    num_producers += 1;
                } else {
                    this.MyLogger.error('Unknown role');
                }
            }
            this.MyLogger.info('Found ' + num_producers + ' producers and ' + num_consumers + ' consumers');
            if (num_producers != final_num_producers || num_consumers != final_num_consumers) {
                this.MyLogger.error('Something went wrong when adding dummy data');
            }

            this.MyLogger.warn("Filled dummy data successfully");
        } else {
            this.MyLogger.log('No need to add any more loggedProsumerData');
        }
    }


    /**
     * Function to prepare and send the logged data to the optimization service.
     * This process includes filling the logged data with dummy data if necessary,
     * fetching the master data from all involved consumers and producers,
     * generating the distance matrix and transfer those data into the format that's expected by the opt service:
     *  -   consumers: an array containing the public keys of all consumers,
     *  -   generators: an array containing the public keys of all producers,
     *  -   cost_matrix: 2D array representing the physical distance between all consumers and producers
     *  -   loggedProsumerIds: the ids of the logged data sets,
     *  -   locations: an array containing the locations of all consumers and producers,
     *  -   sources: a string array indicating the type of energy every producer delivers,
     *  -   prosumer_names: a string array of the internal given names from every consumer and producer
     *
     * If it's not possible to prepare the data, the LoggedProsumerDataDB and the CommittedProsumerDataDB will be dropped.
     */
    async initializeOptimization(): Promise<void> {

        this.MyLogger.warn("Filling with dummy data");
        await this.fillDummyData();

        this.MyLogger.warn("Preparing optimization");
        try {
            let loggedProsumerIds = await this.databaseService.getAllIDs(databases.LoggedProsumerDataDB);
            
            let input = await this.collectAndSortData(loggedProsumerIds);

            // resort the prosumer IDs
            loggedProsumerIds = input.consumer_ids.concat(input.producer_ids)

            this.MyLogger.log('Initialize optimization ...');

            let consumers = [];
            let generators = [];
            for (let j = 0; j < 2; j++) {
                consumers[j] = [];
                generators[j] = [];
                for (let i = 0; i < input.consumers_num.length; i++) {
                    consumers[j].push((input.consumers_num[i][j * 4]).toString());
                }
                for (let i2 = 0; i2 < input.producers_num.length; i2++) {
                    generators[j].push((input.producers_num[i2][j * 2]).toString());
                }
            }

            const consumer_keys: Array<string> = [];
            for (let c = 0; c < input.consumers_num.length; c++) {
                consumer_keys.push(input.consumers_num[c][0])
            }
            const generator_keys: Array<string> = [];
            for (let p = 0; p < input.producers_num.length; ++p) {
                generator_keys.push(input.producers_num[p][0])
            }

            // get masterData:
            this.MyLogger.info('Get masterData ...')
            let c_masterData = await this.masterDataService.getMasterDataMany(consumer_keys) as masterRegistryDto[];

            let p_masterData = await this.masterDataService.getMasterDataMany(generator_keys);

            this.MyLogger.debug('Sorting c_masterData according to pubKey_x')
            c_masterData = c_masterData.sort(function (a, b) {
                let x = new BigNumber(a['pubKey_x']);
                let y = new BigNumber(b['pubKey_x']);
                return x.comparedTo(y);
            });

            this.MyLogger.debug('Sorting p_masterData according to pubKey_x')
            p_masterData = p_masterData.sort(function (a, b) {
                let x = new BigNumber(a['pubKey_x']);
                let y = new BigNumber(b['pubKey_x']);
                return x.comparedTo(y);
            });

            const c_locations = [];
            const prosumer_names = [];
            for (let c = 0; c < c_masterData.length; ++c) {
                c_locations.push(c_masterData[c]['location']);
                prosumer_names.push(c_masterData[c]['prosumer_name']);
            }

            const p_locations = [];
            const sources = [];
            for (let p = 0; p < p_masterData.length; ++p) {
                p_locations.push(p_masterData[p]['location']);
                sources.push(p_masterData[p]['source']);
                prosumer_names.push(p_masterData[p]['prosumer_name']);
            }
            const cost_matrix = await this.generateDistanceMatrix(c_masterData, p_masterData.length, c_locations, p_locations);

            const locations = [];
            try {
                for (let i = 0; i < c_locations.length; ++i) {
                    locations.push([c_locations[i]['latitude'], c_locations[i]['longitude']]);
                }
                for (let i = 0; i < p_locations.length; ++i) {
                    locations.push([p_locations[i]['latitude'], p_locations[i]['longitude']]);
                }
            } catch (err) {
                this.MyLogger.error("Fill Dummy Error: " + err);
            }

            let optIn = {consumers, generators, cost_matrix, loggedProsumerIds, locations, sources, prosumer_names};

            let totalProduction: number;
            let totalConsumption: number = 0;

            let greenProduction: number = 0;
            let grayProduction: number = 0;

            for (const data of input.producers_num) {
                greenProduction += data[2];
                grayProduction += data[3];
            }

            totalProduction = greenProduction + grayProduction;

            for (const data of input.consumers_num) {
                totalConsumption += data[4];
            }

            this.MyLogger.log("Total production: " + totalProduction);
            this.MyLogger.log("Total green production: " + greenProduction);
            this.MyLogger.log("Total consumption: " + totalConsumption);

            const shareOfGreenProduction: number = Math.round( Math.min(greenProduction / totalConsumption, 1) *100)/100;
            if (shareOfGreenProduction == 1) {
                this.MyLogger.log('Enough green power was produced. Hence, "shareOfGreenProduction" is set to 1 (100% green power).')
            }
            this.MyLogger.log('A total share of ' + shareOfGreenProduction +
                ' electricity consumption was produced from renewable sources (green) during the last period');

            const headersRequest = {'api_key': this.config.ApiKey};

            this.MyLogger.warn("Check:\n" + 
                                    "\nconsumers: " + optIn.consumers[0].length +
                                    "\ngenerators: " + optIn.generators[0].length +
                                    "\ncost_matrix: " + optIn.cost_matrix.length +
                                    "\ncost_matrix: " + optIn.cost_matrix[0].length +
                                    "\nlocations: " + optIn.locations.length +
                                    "\nloggedProsumerIds: " + optIn.loggedProsumerIds.length +
                                    "\nlocations: " + optIn.locations.length +
                                    "\nprosumer_names: " + optIn.prosumer_names.length);

            if(optIn.consumers[0].length > 512){
                this.MyLogger.warn(JSON.stringify(optIn));
            }
            if(optIn.generators[0].length > 64){
                this.MyLogger.warn(JSON.stringify(optIn));
            }

            this.MyLogger.warn("Starting the optimization");
            try {
                this.MyLogger.log("Trigger Optimization ...");


                optIn.consumers[1].forEach((e, i, array) => {
                    if (e < 0) {
                        this.MyLogger.warn("Found negative Consumption, replacing with 0.");
                        array[i] = "0";
                    }
                })

                const response = await this.HttpService.post(
                    'http://opt-service:5000/optimize',
                    optIn,
                    {headers: headersRequest},
                ).toPromise();
                this.MyLogger.info("Calling 'optimize': "  + (response.status==200?'valid':'invalid'));
            } catch (error) {
                this.MyLogger.error(JSON.stringify(error.message, error.status));
                this.MyLogger.error("Triggering optimization not successful!");

            }
        } catch (err) {
            this.MyLogger.error("Error during the preparation of the optimiziation: " + err);
        }
    }

    /**
     * After a successful labeling proof this function updates the involved
     * logged data and moves it from the LoggedProsumerDataDB to the CommittedProsumerDataDB.
     *
     * @param optimizedInputs the input that was sent to the optimization service
     * @param labeledData the result of the labeling proof
     * @param optResult the result that was generated from the optimization service
     */
    async labelingMerkleProofService(optimizedInputs, labeledData, optResult): Promise<void> {
        this.MyLogger.info("Preparing the database for ZKP generation");
        this.MyLogger.info("Creating Labeling Merkle Proofs");
        let consumerAccounts = [];

        optimizedInputs.consumers.forEach(consumer => {
            consumer[1] = Math.round(Number(consumer[1])).toString();
            consumer[2] = Math.round(Number(consumer[2])).toString();
        });

        for (let i = 0; i < optimizedInputs.consumers.length; i++) {
            let acc: string[] = [];
            optimizedInputs.consumers[i].forEach((element) => {acc.push(element.toString());});
            try {  //TODO handle if "this.MerkleTreeService.buildMerkleTreeFromHashArray" fails !!
                const ca = this.MerkleTreeService.buildMerkleTreeFromHashArray(acc, 'POSEIDON').getRoot()
                consumerAccounts.push(ca);
            } catch (error) {
                this.MyLogger.error("buildMerkleTreeFromHashArray failed for consumer at pos " + i);
            }
        }

        let producerAccounts = [];

        for (let i = 0; i < optimizedInputs.producers.length; i++) {
            let acc: string[] = [];
            optimizedInputs.producers[i].forEach((element) => {
                acc.push(element.toString());
            });
            try {  //TODO handle if "this.MerkleTreeService.buildMerkleTreeFromHashArray" fails !!
                producerAccounts.push(this.MerkleTreeService.buildMerkleTreeFromHashArray(acc, 'POSEIDON',).getRoot());
            } catch (error) {
                this.MyLogger.error("buildMerkleTreeFromHashArray failed for producer at pos " + i);
            }
        }

        this.MyLogger.debug('Building the full tree for comparison');
        let fullLeaves = [];

        for (let i = 0; i < optimizedInputs.consumers.length; i++) {
            for (let j = 0; j < optimizedInputs.consumers[i].length; j++) {
                fullLeaves.push(optimizedInputs.consumers[i][j]);
            }
        }
        for (let i = 0; i < optimizedInputs.producers.length; i++) {
            for (let j = 0; j < optimizedInputs.producers[i].length; j++) {
                fullLeaves.push(optimizedInputs.producers[i][j]);
            }
        }

        const consumerMerkleProofs = this.MerkleTreeService.buildMerkleProofsFromHashArray(consumerAccounts, 'POSEIDON');

        const producerMerkleProofs = this.MerkleTreeService.buildMerkleProofsFromHashArray(producerAccounts, 'POSEIDON');

        let consumerConsumption = [];
        let transactions = [];
        for(let k = 0; k < optimizedInputs.consumers.length; k++) {
            let allGreen = 0;
            for (let g = 0; g < optimizedInputs.producers.length; g++) {
                allGreen += optResult['transactions_abs'][k][g];
                if (optResult['transactions_abs'][k][g] > 0) {
                    transactions.push(new producerConsumerTransactionDto(optResult.generator_ids[g], optResult.consumer_ids[k], optResult['transactions_abs'][k][g]))
                }
            }
            this.MyLogger.debug("Consumer " + k + " consumed " + allGreen + " units of green energy");
            consumerConsumption.push(allGreen);
        }

        this.MyLogger.info("Shifting the data from LoggedProsumerDataDB to CommittedProsumerDataDB by adding Merkle proofs")
        for (let i = 0; i < labeledData.consumers_num.length; i++) {
            const merkleProof = consumerMerkleProofs[i];
            const temp = labeledData.loggedConsumerData[i];
            const nonVerifiableMasterData = new nonVerifiableMasterDataDto(
                optResult['locations'],
                optResult['sources'],
                optResult['prosumer_names'],
                consumerConsumption,  // n x 1 Array of green consumption for all n consumers
                transactions // TODO: only push the transactions of this consumer -> no filter required in consumerfrontend service getOriginData()
            );
            temp['labelingMerkleProof'] = new labelingMerkleProofDto(
                merkleProof,
                new rawConsumerLabelingDataDto(
                    labeledData.consumers_num[i][0].toString(),
                    optimizedInputs.consumers[i][1].toString(),
                    optimizedInputs.consumers[i][2].toString(),
                    labeledData.consumers_num[i][3].toString(),
                ),
                consumerAccounts[i],
                nonVerifiableMasterData
            );

            // Save the new data in the CommittedProsumerDataDB and delete it from the LoggedProsumerDataDB
            try {
                await this.databaseService.saveOne(temp, databases.CommittedProsumerDataDB);
                await this.databaseService.deleteByID(temp._id, databases.LoggedProsumerDataDB);
            } catch (error) {
                this.MyLogger.error('The following error occurred while saving to ' +
                    databases.CommittedProsumerDataDB + ': ' + error);
            }
        }
        for (let i = 0; i < labeledData.producers_num.length; i++) {
            const temp = labeledData.loggedProducerData[i];

            let signature: string[] = [];
            signature[0] = labeledData.producers_num[i][5].toString();
            signature[1] = labeledData.producers_num[i][6].toString();
            signature[2] = labeledData.producers_num[i][7].toString();

            temp['labelingMerkleProof'] = new labelingMerkleProofDto(
                producerMerkleProofs[i],
                new rawProducerLabelingDataDto(
                    labeledData.producers_num[i][0].toString(),
                    labeledData.producers_num[i][1].toString(),
                    labeledData.producers_num[i][2].toString(),
                    labeledData.producers_num[i][3].toString(),
                    labeledData.producers_num[i][4].toString(),
                    signature,
                ),
                producerAccounts[i],
            );

            // Save the new data in the CommittedProsumerDataDB and delete it from the LoggedProsumerDataDB
            try {
                await this.databaseService.saveOne(temp, databases.CommittedProsumerDataDB,);
                await this.databaseService.deleteByID(temp._id, databases.LoggedProsumerDataDB);
            } catch (error) {
                this.MyLogger.error('The following error occurred while saving to ' +
                    databases.CommittedProsumerDataDB + ': ' + error);
            }
        }
    }

    /**
     * This function is triggered then receiving the result from the optimization service.
     * It updates the grey and green consumption values for all consumers and validates the optimization result with
     * the ZKP.
     * If the validation of the optimization result fails the LoggedProsumerDataDB and the CommittedProsumerDataDB
     * will be dropped.
     *
     * @param optResult the optimization result
     */
    async handleOptimizationWebhook(optResult): Promise<void> {
        this.MyLogger.warn("Receiving the optimization result");
        try {
            const labeledData = await this.collectAndSortData(optResult['loggedProsumerIds']);
          
            if(!labeledData){
                this.MyLogger.error("Having troubles collecting labeledData. Skip proof generation for this epoch!");
            }

            let optimizedInputs: { starttime: string, consumers: string[][]; producers: string[][] } = {
                starttime: this.starttime.toString(),
                consumers: [],
                producers: [],
            };
            
            if (optResult['generator_ids'][optResult['generator_ids'].length-1] == '-1') {
                this.MyLogger.log("An artificial generator was introduced by the optimization");
                let purelyGray = 0;
                for(let k=0; k < optResult['transactions_abs'].length; k++) {
                    purelyGray += optResult['transactions_abs'][k][optResult['generator_ids'].length-1];
                }
                this.MyLogger.log('Total consumption is higher than total green production. Hence, ' + purelyGray + ' electricity was distributed.');
            }

            for (const data of labeledData.consumers_num) {
                let temp: string[] = new Array(4);
                const c = data[4];
                temp[0] = data[0].toString();
                temp[1] = "-1";
                temp[2] = (c - parseFloat(temp[1])).toString();
                temp[3] = data[3].toString();
                optimizedInputs.consumers.push(temp);
            }

            for (const prod of labeledData.producers_num) {
                let temp: string[] = new Array(prod.length);
                for (let i = 0; i < prod.length; i++) {
                    temp[i] = prod[i].toString();
                }
                optimizedInputs.producers.push(temp);
            }

            this.MyLogger.log('Calculate optimizedGreenConsumption and distribute green power ...')

            let optimizedGreenConsumption = 0;
            for(let k = 0; k < optimizedInputs.consumers.length; k++) {
                let allGreen = 0;
                for (let g = 0; g < optimizedInputs.producers.length; g++) {
                    allGreen += optResult['transactions_abs'][k][g];
                }
                allGreen = Math.round(allGreen*100)/100;
                this.MyLogger.debug("Consumer " + k + " consumed " + allGreen + " units of green energy");
                optimizedGreenConsumption += allGreen;
                optimizedInputs.consumers[k][1] = allGreen.toString();
                let new_grey = Number(optimizedInputs.consumers[k][2]) - allGreen;
                if (new_grey < 0) { //TODO this need to be fixed, how can this even occur?
                    this.MyLogger.error("Calculated value would be negative, replace with 0.");
                    new_grey = 0;
                }
                optimizedInputs.consumers[k][2] = (new_grey).toString();
            }
            this.MyLogger.log('optimizedGreenConsumption = ' + optimizedGreenConsumption)

            let greenProduction = 0;
            for(let i=0; i < optimizedInputs.producers.length; ++i) {
                greenProduction += parseInt(optimizedInputs.producers[i][2]);
            }  

            this.MyLogger.info('Difference between green production and optimized green consumption is ' + (greenProduction - optimizedGreenConsumption));

            if ((greenProduction - optimizedGreenConsumption) > -50) {
                this.MyLogger.info("Continue with proof generation");
            } else {
                this.MyLogger.error("Too large rounding errors");
            }

            //--------------------------------------

            const checkResult = this.CryptoService.checkInputs(optimizedInputs);
            this.MyLogger.info('Checking optimized inputs: ' + checkResult);
            if (!checkResult) {
                this.MyLogger.error("Check failed");
                this.MyLogger.error("Error handling required -- potentially we need to delete all data in loggedProsumerDataDB and skip a proof for this epoch.")

                await this.deleteAll(databases.LoggedProsumerDataDB);
                await this.deleteAll(databases.CommittedProsumerDataDB);
            } else {
                await this.labelingMerkleProofService(optimizedInputs, labeledData, optResult)
                    .catch(err => this.MyLogger.error("labelingMerkleProofService failed: " + JSON.stringify(err.status, err.message)));
                
                this.MyLogger.info("Calling ZKP Service");
                try {
                    let response = await this.HttpService.post('http://zkp-service:8100/zkp/publish-proof', optimizedInputs, {headers: {'api_key': this.config.ApiKey}}).toPromise();
                    this.MyLogger.info('Receiving ZKP-call response: ' + (response.status===201?'valid':'invalid'));
                } catch (errors) {
                    this.MyLogger.error('Error occurred: ' + errors);
                }
            }
        } catch (err) {
            this.MyLogger.error("Error during handling optimization webhook: " + err);
            this.MyLogger.info('Deleting all data from the two databases (loggedProsumerData, CommittedProsumerData)');
            await this.deleteAll(databases.LoggedProsumerDataDB);
            await this.deleteAll(databases.CommittedProsumerDataDB);
        }
    }

    //filters data in this timestamp
    /**
     * Auxiliary function for data preparation before sending it to the optimization service.
     * The function fetches data from LoggedProsumerDataDB and splits it into the format that's demanded from the
     * optimization service:
     *  -   loggedConsumerData: the logged data from LoggedProsumerDataDB linked to the consumer
     *  -   loggedProducerData: the logged data from LoggedProsumerDataDB linked to the producer
     *  -   consumers_num: // TODO redundant to loggedConsumerData
     *  -   producers_num: // TODO redundant to loggedProducerData
     *  -   consumer_ids: the public keys of the consumer
     *  -   producer_ids: the public keys of the producer
     *
     * @param loggedProsumerIDs the ids of the data to be fetched
     * @returns an object as it was described above
     */
    async collectAndSortData(loggedProsumerIDs: Array<string>) {
        try {
            this.MyLogger.log('Collect and sort data ...');
            
            const loggedProsumerData = await this.databaseService.findManyByID(loggedProsumerIDs, databases.LoggedProsumerDataDB);

            let loggedConsumerData: LoggedProsumerData[] = [];
            let loggedProducerData: LoggedProsumerData[] = [];

            let consumers_num = [];
            let producers_num = [];

            let consumerSorter = [];
            let producerSorter = []

            loggedProsumerData.forEach((data) => {
                if(data.data.timestamp >= this.starttime && data.data.timestamp < this.starttime + 300) {
                    if (data.data.role == roles.CONSUMER) {
                        consumers_num.push([
                            data.data.ownerPubKey_x,
                            data.data.greenConsumption = 0,
                            data.data.grayConsumption = 0,
                            data.data.timestamp,
                            data.data.consumedPower,
                        ]);
                        loggedConsumerData.push(data);
                        consumerSorter.push([data.data.ownerPubKey_x, data._id]);
                    } else {
                        producers_num.push([
                            data.data.ownerPubKey_x,
                            data.data.ownerPubKey_y,
                            data.data.greenProduction,
                            data.data.grayProduction,
                            data.data.timestamp,
                            data.data.signedMsg[0],
                            data.data.signedMsg[1],
                            data.data.signedMsg[2],
                        ]);
                        loggedProducerData.push(data);
                        producerSorter.push([data.data.ownerPubKey_x, data._id]);
                    }
                }
            });

            //SORT WITH FIRST COLUMN
            consumers_num = consumers_num.sort(function (a, b) {
                let x = new BigNumber(a[0]);
                let y = new BigNumber(b[0]);
                return x.comparedTo(y);
            });

            loggedConsumerData = loggedConsumerData.sort(function (a, b) {
                let x = new BigNumber(a.data.ownerPubKey_x);
                let y = new BigNumber(b.data.ownerPubKey_x);
                return x.comparedTo(y);
            });

            consumerSorter = consumerSorter.sort(function (a, b) {
                let x = new BigNumber(a[0]);
                let y = new BigNumber(b[0]);
                return x.comparedTo(y);
            });

            producers_num = producers_num.sort(function (a, b) {
                let x = new BigNumber(a[0]);
                let y = new BigNumber(b[0]);
                return x.comparedTo(y);
            });
            loggedProducerData = loggedProducerData.sort(function (a, b) {
                let x = new BigNumber(a.data.ownerPubKey_x);
                let y = new BigNumber(b.data.ownerPubKey_x);
                return x.comparedTo(y);
            });

            producerSorter = producerSorter.sort(function (a, b) {
                let x = new BigNumber(a[0]);
                let y = new BigNumber(b[0]);
                return x.comparedTo(y);
            });

            let consumer_ids = [];
            consumerSorter.forEach(entry => {consumer_ids.push(entry[1]);});

            let producer_ids = [];
            producerSorter.forEach(entry => {producer_ids.push(entry[1]);});

            return {loggedConsumerData, loggedProducerData, consumers_num, producers_num, consumer_ids, producer_ids};

        } catch (err) {
            this.MyLogger.error("Error during collecting/sorting: " + JSON.stringify(err));
        }
    }

    /**
     * This function is triggered then receiving the result of an ZKP proof.
     * It updates all involved data from CommittedProsumerDataDB and moves it to VerifiableProsumerDataDB.
     * If the validation of the ZKP result fails the LoggedProsumerDataDB and the CommittedProsumerDataDB
     * will be dropped.
     * @param completeBody the result of the ZKP
     */
    async handleProofWebhook(completeBody: labelingZKPInfoDto): Promise<void> {
        this.MyLogger.warn("Receiving ZKP result");
        this.MyLogger.debug("Data from ZKP service: " + JSON.stringify(completeBody));
        if (completeBody.valid == true) {
            let txHash: string = completeBody.getTxHash();
            let publicInputs: string[] = completeBody.getPublicInputs();

            const committedProsumerIDs = await this.databaseService.getAllIDs(databases.CommittedProsumerDataDB,);
            this.MyLogger.info('Found ' + committedProsumerIDs.length + ' accounts');
            const committedProsumerData = await this.databaseService.findManyByID(committedProsumerIDs, databases.CommittedProsumerDataDB,);

            // Add the proofs
            this.MyLogger.info("Shifting all data with Labeling Merkle Proofs to data with Labeling Proofs by adding the txHash")

            for (const data of committedProsumerData) {

                let merkleProof: labelingMerkleProofDto = data.labelingMerkleProof;
                let labelingProof: labelingProofDto = new labelingProofDto(merkleProof, txHash);

                if (data.data.role == roles.CONSUMER) {
                    if (publicInputs[0] != merkleProof.merkleProof.root) {
                        this.MyLogger.error('In handleProofWebhook: Merkle Proof and consumer hashes do not match!')
                    }
                } else {
                    if (publicInputs[2] != merkleProof.merkleProof.root) {
                        this.MyLogger.error('In handleProofWebhook: Merkle Proof and consumer hashes do not match!')
                    }
                }

                data["labelingProof"] = labelingProof;
                try {
                    await this.databaseService.saveOne(data, databases.VerifiableProsumerDataDB);
                    await this.databaseService.deleteByID(data._id, databases.CommittedProsumerDataDB);
                } catch (error) {
                    this.MyLogger.error('The following error occurred while moving to ' +
                        databases.VerifiableProsumerDataDB + ': ' + error);
                }
            }
            this.MyLogger.warn("Labeling proofs stored in database");
            return;
        } else {
            this.MyLogger.info("ZKP creation failed")
            this.MyLogger.info('Deleting all data from the two databases (loggedProsumerData, CommittedProsumerData)');
            await this.deleteAll(databases.LoggedProsumerDataDB);
            await this.deleteAll(databases.CommittedProsumerDataDB);
        }
    }

    /**
     * Verify a merkle proof (using auxiliary functions) by rebuilding the merkle tree and comparing the merkle roots.
     *
     * @param data the labeling merkle proof
     * @returns true if the proof is valid, false otherwise
     */
    async verifyLabelingMerkleProof(data: labelingMerkleProofDto): Promise<boolean> {
        this.MyLogger.debug('Verifying Labeling Merkle Proof');

        const merkleProof = data.merkleProof;
        const rawData = data.rawData;
        const rawDataRoot = data.rawDataRoot;

        // check if valid for both cons and pros (consider: rawLabelingDataDto)!
        let rawDataArray = [rawData.ownerPubkey_x, rawData.green, rawData.gray, rawData.timestamp];
        this.MyLogger.debug('Raw data as array: ' + JSON.stringify(rawDataArray));

        let tree = this.MerkleTreeService.buildMerkleTreeFromHashArray(rawDataArray, "POSEIDON");
        let vmp = this.MerkleTreeService.verifyMerkleProof(merkleProof, "POSEIDON");
        this.MyLogger.info('Result of Merkle proof verification: ' + vmp);

        this.MyLogger.debug("Leaf of the Merkle Proof: " + merkleProof.getLeaf());
        this.MyLogger.debug("Root of the raw Data by computation: " + tree.getRoot());
        this.MyLogger.debug("Root of the raw data from the Labeling Merkle Proof: " + rawDataRoot);

        if (!vmp || rawDataRoot != tree.getRoot() || tree.getRoot() != merkleProof.getLeaf()) {
            this.MyLogger.error('Result of equality checks for leaf, root(rawData) and rawDataRoot: true');
            return false;
        }
        this.MyLogger.info('Result of equality checks for leaf, root(rawData) and rawDataRoot: true');
        return true;
    }

    /**
     * Verify a labeling proof by comparing the merkle root with the stored merkle roots on the quorum chain.
     * This returns an object containing the "valid" field, indicating whether the proof is valid or not, together with
     * some extra information.
     *
     * @param input the labeling proof
     * @param role the role of the identity the proof was generated for
     * @returns true if the proof is valid, false (or error string) otherwise
     * @throws on invalid role input
     */
    async verifyLabelingProof(input: labelingProofDto, role: roles): Promise<object | string> {

        try {
            this.MyLogger.info('Verifying Labeling Proof');
            // eslint-disable-next-line @typescript-eslint/ban-types
            const lemma: merkleLemmaElementDto[] = input.labelingMerkleProof.merkleProof.lemma;
            const root: string = input.labelingMerkleProof.merkleProof.root;
            const leaf: string = input.labelingMerkleProof.merkleProof.leaf;
            const txHash: string = input.txHash;
            const rawData: rawConsumerLabelingDataDto | rawProducerLabelingDataDto = input.labelingMerkleProof.rawData;
            const rawDataRoot: string = input.labelingMerkleProof.rawDataRoot;
            const merkleProof: merkleProofDto = new merkleProofDto(root, lemma, leaf);
            const labelingMerkleProof: labelingMerkleProofDto = new labelingMerkleProofDto(merkleProof, rawData, rawDataRoot);

            if (await this.verifyLabelingMerkleProof(labelingMerkleProof)) {
                this.MyLogger.info('Merkle proof is valid');
                let quorumUrl = 'http://quorum_quorum-node1_1:8545';
                this.MyLogger.debug('Quorum node URL: ' + quorumUrl);
                const provider = new Web3.providers.HttpProvider(quorumUrl);
                const web3 = new Web3(provider);

                this.MyLogger.debug('Getting transaction details for txHash ' + txHash);
                let transactionDetails = await web3.eth.getTransaction(txHash);
                let lenShifted = transactionDetails.input.length - 6 * 64; // check shift

                let publicOutputsHex: string[] = [];
                for (let i = 0; i < 6; i++) { // check shift
                    let value = '0x' + transactionDetails.input.substring(lenShifted + i * 64, lenShifted + (i + 1) * 64);
                    publicOutputsHex.push(value);
                }

                let valid;
                if (role == roles.CONSUMER) {
                    this.MyLogger.debug('Comparing ' + publicOutputsHex[0] + ' and '
                        + this.p256(Number(labelingMerkleProof.merkleProof.getRoot())) + ' as the data is from a consumer');
                    valid = (publicOutputsHex[0] == this.p256(Number(labelingMerkleProof.merkleProof.getRoot())));
                } else if (role == roles.PRODUCER) {
                    this.MyLogger.debug('Comparing ' + publicOutputsHex[2] + ' and '
                        + this.p256(Number(labelingMerkleProof.merkleProof.getRoot())) + ' as the data is from a producer');
                    valid = (publicOutputsHex[2] == this.p256(Number(labelingMerkleProof.merkleProof.getRoot())));
                } else {
                    this.MyLogger.error('invalid role');
                    throw 'Invalid role';
                }
                this.MyLogger.debug('Labeling proof valid: ' + valid);

                //Getting timestamp for block
                let timestamps;
                try {
                    timestamps = await this.QuorumService.getBlockTimestamp(transactionDetails.blockNumber);
                } catch (err) {
                    this.MyLogger.error("Error when retrieving block timestamp");
                    this.MyLogger.error(err);
                }

                //TODO how can we "send" the contract address to the nestjs-owner?
                if (parseInt(transactionDetails.blockNumber) >= 0) {
                    return {
                        valid: true,
                        blockNumber: transactionDetails.blockNumber,
                        contractAddress: transactionDetails.to,
                        timestamp: timestamps.timestamp,
                        timestampReadable: timestamps.timestampReadable,
                    };
                } else {
                    return {valid: false};
                }
            } else {
                return 'Merkle proof invalid';
            }

        } catch (err) {
            this.MyLogger.error(err);
            this.MyLogger.error("Verifying Labeling Proof failed");
        }
    }

    /**
     * Endpoint implementation of GET /labeledData/:id.
     * Returns the entry with the given id from VerifiableProsumerDataDB.
     * @param id the id
     * @returns the matching entry
     */
    async getLabeledDataById(id: string) {
        try {
            const res = await this.databaseService.findByID(id, databases.VerifiableProsumerDataDB);

            this.MyLogger.log(`Queried labeled data record with ID ${id}`);
            this.MyLogger.log(JSON.stringify(res));

            return res;
        } catch (e) {
            this.MyLogger.error(`The following error occurred while trying to get the document with this id:
                                    ${id} in this database: ${databases.VerifiableProsumerDataDB} \n ${e}`);
            return e;
        }
    }

}
