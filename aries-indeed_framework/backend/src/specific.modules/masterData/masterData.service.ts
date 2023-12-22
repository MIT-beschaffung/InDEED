import {Injectable, InternalServerErrorException} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {DatabaseService} from 'src/generic.modules/database/database.service';
import {databases} from 'src/generic.modules/database/db.enum';
import {ConfigService} from 'src/config.service';
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {masterRegistryDto} from './masterRegistryData.dto';

@Injectable()
export class masterDataService {
    constructor(
        private httpService: HttpService,
        private databaseService: DatabaseService,
        private readonly config: ConfigService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    //TODO: exists() method to check if master data is registered in consumer frontend service and producer controllers

    /**
     * Stores new data to the masterRegistryDB, iff the pubKey_x field is set.
     *
     * @param completeBody the data to be stored
     * @returns result of the DB
     * @throws on DB error
     */
    async registerMasterData(completeBody): Promise<object> | never {
        // check whether data with that key is already registered
        if ((await this.ensureRegistered(completeBody['pubKey_x'])) == false) {
            // since key and location are required:
            if (Object.keys(completeBody).length === 0 || !completeBody['pubKey_x']) {
                this.MyLogger.error("No key was given serving POST /masterData/register");
                return;
            } else if (!completeBody['location']) {
                this.MyLogger.error("No location was given serving POST /masterData/register");
                return;
            }
            
            try {
                return await this.databaseService.saveOne(completeBody, databases.masterRegistryDB);
            } catch (error) {
                this.MyLogger.error('The following error occurred while trying to register masterData: ' + error);
                this.MyLogger.error(JSON.stringify(completeBody));
                throw error;
            }
        } else {
            this.MyLogger.warn('Note: masterData with "pubKey_x": ' + completeBody['pubKey_x'] + ' already exists in masterRegistry!');
            return;
        }
    }

    /**
     * Returns master data from masterRegistryDB for a given public key.
     * @param prosumerKey the public key
     * @returns the matching entry
     */
    async getMasterData(prosumerKey: string): Promise<Array<object>> {
        this.MyLogger.debug("Looking for master data associated with publicKey_x " + prosumerKey);
        try {
            return await this.databaseService.findByPKx(prosumerKey, databases.masterRegistryDB);
        } catch (error) {
            this.MyLogger.error('The following error occurred serving GET masterData: ' + error);
        }
    }

    /**
     * Returns master data from masterRegistryDB for a given public keys.
     * This function will generate mocked master data for keys that don't exist in the DB.
     *
     * @param prosumerKeys array of the public keys
     * @returns the matching and generated entries
     */
    async getMasterDataMany(prosumerKeys:Array<string>): Promise<Array<object>> {
        // First look for registered agents
        const agents = await this.databaseService.findManyByPKx(prosumerKeys, databases.masterRegistryDB);
        this.MyLogger.debug("Found some master data: ");// + JSON.stringify(agents));
        // Remove the keys that were found
        agents.forEach(agent => {prosumerKeys = prosumerKeys.filter(item => item != agent.pubKey_x);});

        // Fill remaining agents with random location data
        prosumerKeys.forEach(prosumerKey => {agents.push(
            new masterRegistryDto(
                    prosumerKey,          // pubKey_x
                    {"latitude": 0, "longitude": 0}, // dummy: WR10 + noise
                    0,                          // preference = 0; without effect if producer
                    '',                         // source = '';    without effect if consumer
                    'dummy'
                ));
        });

        this.MyLogger.debug('Filled with additional random master data');
        return agents;
    }

    /**
     * Checks whether the DB contains master data for a given public key or not.
     *
     * @param prosumerKey the public key
     * @returns true if a matching entry exist, false otherwise
     */
    async ensureRegistered(prosumerKey: string): Promise<boolean> {
        if ( typeof(prosumerKey) === 'undefined') {
            this.MyLogger.warn('Undefined key -- look for reasons!')
        }
        try {
            this.MyLogger.debug('Checking whether key ' + JSON.stringify(prosumerKey) +  ' has previously been registered');
            const entry = await this.databaseService.findByPKx(prosumerKey, databases.masterRegistryDB);

            if (Object.keys(entry).length === 0 || !(entry[0]['pubKey_x'])) {
                this.MyLogger.debug('Entry not found serving ensureRegistered.');
                return false;
            } else {
                return true;
            }

        } catch (error) {
            this.MyLogger.error('The following error occurred while checking register: ' + error);
            return false;
        }
    }

    /**
     * Updates an already existing entry of master data with new given object of master data.
     *
     * @param completeBody the complete updated master data
     * @returns the stored data, or void on error
     */
    async putMasterData(completeBody): Promise<object | void> {
        try {
            if (Object.keys(completeBody).length === 0 || !completeBody['pubKey_x']) { // key is required
                this.MyLogger.error("No key was given serving PUT /masterData");
                return;
            }

            const agent = await this.databaseService.findByPKx(completeBody['pubKey_x'], databases.masterRegistryDB);
            
            const dataKeys = Object.keys(completeBody)
            const res = agent[0];
            dataKeys.forEach((element) => {
                if (completeBody[element]) {
                    res[element] = completeBody[element];
                }
            });
            
            return res.save();
        } catch (error) {
            this.MyLogger.error('The following error occurred serving PUT /masterData/preference:' + error);
        }
    }

    /**
     * Drops the masterRegistryDB.
     * @returns the result of the DB
     * @throws InternalServerErrorException on DB error
     */
    async deleteAll(): Promise<object> {
        try {
            return this.databaseService.deleteAll(databases.masterRegistryDB);
        } catch (e) {
            throw new InternalServerErrorException(e);
        }
    }
}