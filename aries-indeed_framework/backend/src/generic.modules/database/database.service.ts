import {Inject, Injectable} from '@nestjs/common';
import {Model, Types} from 'mongoose';
import {ConfigService} from 'src/config.service';
import {MyLogger} from '../logger/logger.service';

import {ConsumerConsumption} from '../schemas/consumerConsumption.schema';
import {ConsumerAggregation} from '../schemas/consumerAggregation.schema';
import {ConsumerCompilation} from '../schemas/consumerCompilation.schema';
import {ConsumerCompilationAggregation} from '../schemas/consumerCompilationAggregation.schema';
import {ConsumerFootprint} from '../schemas/consumerFootprint.schema';
import {ConsumerFootprintData} from '../schemas/consumerFootprintData.schema';
import {ConsumerForecast} from '../schemas/consumerForecast.schema';
import {ConsumerPriorization} from '../schemas/consumerPriorization.schema';
import {masterRegistry} from '../schemas/masterRegistry.schema';

import {AggregatedData} from '../schemas/aggregatedData.schema';
import {LoggedData} from '../schemas/loggedData.schema';
import {NotarizedData} from '../schemas/notarizedData.schema';
import {NotarizedOwnerData} from "../schemas/notarizedOwnerData.schema";
import {CommittedProsumerData, LoggedProsumerData, VerifiableProsumerData,} from '../schemas/labeledData.schema';
import {labeledConsumerAggregation} from '../schemas/labeledConsumerAggregation.schema';
import {databases} from './db.enum';
import {databaseModels} from './db.models.enum';
import {RemoteNotarizedData} from "../schemas/remoteNotarizationData.schema";
import {CollectiveNotarizationData} from "../schemas/collectiveNotarizationData.schema";
import {User} from "../../specific.modules/users/schemas/user.schema";
import {CreateUserDto} from "../../specific.modules/users/dto/create-user.dto";
import {PatchUserDto} from "../../specific.modules/users/dto/patch-user.dto";

/**
 * This Service is responsible for Database Connections and common CRUD functions. If you want to use this service please import the DatabaseModule in the corresponding Module imports.
 * This service then needs to be added into the service's constructor.
 * You can then use its functions like with any other custom provider.
 */
@Injectable()
export class DatabaseService {
    constructor(
        @Inject(databaseModels.LoggedDataDBModel)
        private readonly LoggedDataDBModel: Model<LoggedData>,
        @Inject(databaseModels.RheinenergieDataDBModel)
        private readonly RheinenergieDataDBModel: Model<LoggedData>,
        @Inject(databaseModels.SMADataDBModel)
        private readonly SMADataDBModel: Model<LoggedData>,
        @Inject(databaseModels.SMAprobandenDataDBModel)
        private readonly SMAprobandenDataDBModel: Model<LoggedData>,
        @Inject(databaseModels.LiqwotecDataDBModel)
        private readonly LiqwotecDataDBModel: Model<LoggedData>,
        @Inject(databaseModels.LEWDataDBModel)
        private readonly LEWDataDBModel: Model<LoggedData>,
        @Inject(databaseModels.SchweigerDataDBModel)
        private readonly SchweigerDataDBModel: Model<LoggedData>,
        @Inject(databaseModels.ffeDataDBModel)
        private readonly ffeDataDBModel: Model<LoggedData>,        
        @Inject(databaseModels.AggregatedDataDBModel)
        private readonly AggregatedDataDBModel: Model<AggregatedData>,
        @Inject(databaseModels.NotarizedDataDBModel)
        private readonly NotarizedDataDBModel: Model<NotarizedData>,
        @Inject(databaseModels.RemoteNotarizationDataDBModel)
        private readonly RemoteNotarizationDataDBModel: Model<RemoteNotarizedData>,
        @Inject(databaseModels.NotarizedOwnerDataDBModel)
        private readonly NotarizedOwnerDataDBModel: Model<NotarizedOwnerData>,
        @Inject(databaseModels.CollectiveNotarizationDataDBModel)
        private readonly CollectiveNotarizationDataDBModel: Model<CollectiveNotarizationData>,
        @Inject(databaseModels.LoggedProsumerDataDBModel)
        private readonly LoggedProsumerDataDBModel: Model<LoggedProsumerData>,
        @Inject(databaseModels.CommittedProsumerDataDBModel)
        private readonly CommittedProsumerDataDBModel: Model<CommittedProsumerData>,
        @Inject(databaseModels.VerifiableProsumerDataDBModel)
        private readonly VerifiableProsumerDataDBModel: Model<VerifiableProsumerData>,
        @Inject(databaseModels.labeledConsumerAggregationDBModel)
        private readonly labeledConsumerAggregationDBModel: Model<labeledConsumerAggregation>,

        @Inject(databaseModels.ConsumerConsumptionDBModel)
        private readonly consumerConsumptionDBModel: Model<ConsumerConsumption>,
        @Inject(databaseModels.ConsumerAggregationDBModel)
        private readonly consumerAggregationDBModel: Model<ConsumerAggregation | { } >, // TODO remove this fix
        @Inject(databaseModels.ConsumerCompilationDBModel)
        private readonly consumerCompilationDBModel: Model<ConsumerCompilation>,
        @Inject(databaseModels.ConsumerCompilationAggregationDBModel)
        private readonly consumerCompilationAggregationDBModel: Model<ConsumerCompilationAggregation>,
        @Inject(databaseModels.ConsumerFootprintDBModel)
        private readonly consumerFootprintDBModel: Model<ConsumerFootprint>,
        @Inject(databaseModels.ConsumerFootprintDataDBModel)
        private readonly consumerFootprintDataDBModel: Model<ConsumerFootprintData>,
        @Inject(databaseModels.ConsumerForecastDBModel)
        private readonly consumerForecastDBModel: Model<ConsumerForecast>,
        @Inject(databaseModels.ConsumerPriorizationDBModel)
        private readonly consumerPriorizationDBModel: Model<ConsumerPriorization>,
        @Inject(databaseModels.masterRegistryDBModel)
        private readonly masterRegistryDBModel: Model<masterRegistry>,
        @Inject(databaseModels.usersDBModel)
        private readonly userDBModel: Model<User>,
        private readonly config: ConfigService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Checks if the data suits the model related to the assigned databases and writes the data to the db.
     * @param data: The data you want to save. It needs to fit the corresponding Schema (See schema folder for further information)
     * @param database: db.enum.ts
     * @returns the saved object with its id
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    async saveOne(data: {}, database: databases) {
        if (!data['_id']) {
            data['_id'] = new Types.ObjectId().toHexString();
        }
        try {
            const dbModel = this.getDatabaseModel(data, database);
            return dbModel.save();
        } catch (error) {
            this.MyLogger.error('Could not save data to ' + database);
            this.MyLogger.info('Data: ' + JSON.stringify(data));
            this.MyLogger.info(error)
        }
    }

    /**
     * Takes an array of JSON and saves it into the assigned database
     * @param data
     * @param database
     * @returns
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    async saveMany(data: [{}], database: databases) {
        const db = this.getDatabase(database);
        return db.insertMany(data);
    }

    /**
     * Checks if an entry exists for a given ID in the DB.
     *
     * @param id the id
     * @param database the DB
     * @returns true if the user exists, false otherwise
     */
    async entryExist(id: string, database: databases): Promise<boolean> {
        const db = this.getDatabase(database);
        return await db.exists({_id: id});
    }

    //TODO: passing a object from endpoint to db.find() enables code injection on the ConsumerConsumptionDB (happens on Consumer/search)
    /**
     * Takes a query object and returns the results for the assigned database
     * @param query
     * @param database
     * @returns the search result
     */
    async find(query, database: databases) {
        const db = this.getDatabase(database);
        return db.find(query).lean().exec();
    }

    /**
     * Finds specific data
     * @param query
     * @param database
     * @param sort
     * @param limit
     */
    async findWithSortAndLimit(query, database: databases, sort, limit) {
        this.MyLogger.log("Trying to find and sort data with limit");
        const db = this.getDatabase(database);
        return db.find(query).sort(sort).limit(limit).exec();
    }

    /**
     * Returns a list with all IDs that currently in the assigned database
     * @param database
     * @returns
     */
    async getAllIDs(database: databases): Promise<string[]> {
        const res: string[] = [];
        const db = this.getDatabase(database);
        const temp = await db.find().select('_id').exec();
        temp.forEach((element) => {
            const temp = element.toObject();
            res.push(temp['_id']);
        });
        return res;
    }

    /**
     * Returns a Mongoose document with the searched ID
     * @param id The value for "_id"  in the db
     * @param database: db.enum.ts
     * @returns the found document
     */
    async findByID(id: string, database: databases) {
        const db = this.getDatabase(database);
        return await db.findById(id).exec();
    }

    /**
     * Takes an array of ids and returns the saved objects
     * @param ids Array of document IDS you want to look up
     * @param database The database in which you want to search
     * @returns an array of lean objects (no mongoose documents)
     */
    async findManyByID(ids: string[], database: databases) {
        const db = this.getDatabase(database);
        try {
            const res = [];
            const job = await db.find({_id: { $in: ids }}).exec();
            for (const data of job) {
                res.push(data.toObject());
            }
            return res;
        } catch (error) {
            this.MyLogger.error(
                'Error while querying for these ids: ' + ids + '\n' + error,
            );
        }
    }

    /**
     * Returns all saved objects of a database.
     * @param database the database
     * @param query optional query parameter
     * @param sort optional sorting direction
     * @returns an array of all saved objects
     */
    async getAllEntries(database: databases, query={}, sort?): Promise<Array<object>> {
        const db = this.getDatabase(database);

        if (sort) return await db.find(query).sort(sort);
        return await db.find(query);
    }

    /**
     * Returns a Mongoose document with the searched public key x-coordinate
     * @param key The value for "pubKey_x"  in the db
     * @param database: db.enum.ts
     * @returns the found document
     */
    async findByPKx(key: string, database: databases) {
        const db = this.getDatabase(database);
        try {
            return await db.find({pubKey_x: key}).exec();
        } catch (error) {
            this.MyLogger.error(
                'Error while querying for the key: ' + key + '\n' + error,
            );
        }
    }

    /**
     * Takes an array of pubKey x-coordinates and returns the saved objects
     * @param keys Array of document pubKey x-coordinates you want to look up
     * @param database The database in which you want to search
     * @returns an array of lean objects (no mongoose documents)
     */
    async findManyByPKx(keys: string[], database: databases) {
        const db = this.getDatabase(database);
        try {
            const res = [];
            const job = await db
                .find({
                    pubKey_x: {
                        $in: keys,
                    },
                })
                .exec();
            for (const data of job) {
                res.push(data.toObject());
            }
            return res;
        } catch (error) {
            this.MyLogger.error(
                'Error while querying for these keys: ' + keys + '\n' + error,
            );
        }
    }

    /**
     * Takes a timestamp and returns all saved database Entries for the given database.
     * @param timestamp The timestamp as Number
     * @param database The database to search
     * @return the found document
     */
    async findByTime(timestamp: number, database: databases) {
        const db = this.getDatabase(database);
        try {
            return await db.find({timestamp: {$eq: timestamp}}).exec();
        } catch (error) {
            this.MyLogger.error('Error while querying for the timestamp: ' + timestamp + '\n' + error,);
        }
    }

    /**
     * Takes an upper-bound timestamp and a lower-bound timestamp and returns all saved database entries for the given database.
     * Remember to use the timestamps you received in the response body.
     * @param upperbound Latest timestamp included as Number
     * @param lowerbound Earliest timestamp included as Number
     * @param database The database in which you want to search
     * @returns an array of lean objects (no mongoose documents)
     */
     async findManyByTime(upperbound: number, lowerbound: number, database: databases): Promise<Object> {

        const db = this.getDatabase(database);
        const res = [];

        if (upperbound < lowerbound) {
            this.MyLogger.error('Error while querying for this intervall: '+ upperbound + ' : ' + lowerbound + '\n'
                + 'The upperbound ist smaller than the lower bound.');
            return res;
        }

        if (upperbound === lowerbound) {
            const data = await this.findByTime(upperbound, database);
            res.push(data);
            return res;
        }

        try {
            const job = await db.find({timestamp: { $gte: lowerbound, $lte: upperbound }}).exec();
            for (const data of job) {
                res.push(data.toObject());
            }
            return res;
        } catch (error) {
            this.MyLogger.error(
                'Error while querying for this intervall: ' + upperbound +' : '+lowerbound+ '\n' + error,
            );
            return res;
        }
    }

    /**
     *Updates a Document for the given ID and returns it
     * @param id The documents ID you want to update
     * @param data The new data for this document
     * @param database: db.enum.ts
     * @returns the updated document
     */
    async updateOne(id: string, data: {}, database: databases) {
        const doc_query = await this.findByID(id, database);
        //Gets the Keys that need to be updated
        const dataKeys = Object.keys(data);
        const res = doc_query;
        dataKeys.forEach((element) => {
            if (data[element]) {
                res[element] = data[element];
            }
        });
        return res.save();
    }

    /**
     * Deletes all entries of a DB
     * @param database the database to be dropped
     * @throws re-throws error
     */
    async deleteAll(database: databases): Promise<Object> {
        const db = this.getDatabase(database)
        try {
            return await db.deleteMany({});
        } catch (e) {
            this.MyLogger.error("Drop Table " + database.toString() + "failed. " + e.toString());
            throw e;
        }
    }

    /**
     * Deletes the Object with the assigned ID
     * @param id The documents ID that you want to delete
     * @param database: db.enum.ts
     * @returns the deleted document
     */
    async deleteByID(id: string, database: databases) {
        const db = this.getDatabase(database);
        const doc = this.findByID(id, database);
        try {
            await db.findByIdAndDelete({ _id: id }).exec();
        } catch (error) {
            this.MyLogger.error(
                'This error is occurred while trying to delete a document with id: ' +
                    id +
                    ' in ' +
                    database +
                    ': ' +
                    error,
            );
        }
        return doc;
    }

    /**
     * Deletes the Object with the assigned pubKey_x
     * @param key The documents pubKey_x that you want to delete
     * @param database: db.enum.ts
     * @returns the deleted document
     */
     async deleteByKey(key: string, database: databases) {
        const db = this.getDatabase(database);
        const doc = this.findByPKx(key, database);
        try {
            await db.deleteOne({ pubKey_x: key }).exec();
        } catch (error) {
            this.MyLogger.error(
                'This error is occurred while trying to delete a document with key: ' +
                    key +
                    ' in ' +
                    database +
                    ': ' +
                    error,
            );
        }
        return doc;
    }

    async testing(data, database: databases) {
        return this.getDatabaseModel(data, database);
    }

    /**
     * Returns the Database Model. This Object has the common functions from mongoose for queries etc.
     * @param database: db.enum.ts
     * @returns DatabaseModel corresponding to assigned database
     */
    private getDatabase(database: databases) {
        switch (database) {
            case databases.AggregatedDataDB:
                return this.AggregatedDataDBModel;
            case databases.CommittedProsumerDataDB:
                return this.CommittedProsumerDataDBModel;
            case databases.LiqwotecDataDB:
                return this.LiqwotecDataDBModel;
            case databases.LoggedDataDB:
                return this.LoggedDataDBModel;
            case databases.LoggedProsumerDataDB:
                return this.LoggedProsumerDataDBModel;
            case databases.NotarizedDataDB:
                return this.NotarizedDataDBModel;
            case databases.NotarizedOwnerDataDB:
                return this.NotarizedOwnerDataDBModel;
            case databases.RemoteNotarizationDataDB:
                return this.RemoteNotarizationDataDBModel;
            case databases.CollectiveNotarizationDataDB:
                return this.CollectiveNotarizationDataDBModel;
            case databases.RheinenergieDataDB:
                return this.RheinenergieDataDBModel;
            case databases.SMADataDB:
                return this.SMADataDBModel;
            case databases.SMAprobandenDataDB:
                return this.SMAprobandenDataDBModel;
            case databases.LEWDataDB:
                return this.LEWDataDBModel;
            case databases.SchweigerDataDB:
                return this.SchweigerDataDBModel;
            case databases.ffeDataDB:
                return this.ffeDataDBModel;
            case databases.VerifiableProsumerDataDB:
                return this.VerifiableProsumerDataDBModel;
            case databases.labeledConsumerAggregationDB:
                return this.labeledConsumerAggregationDBModel;

            case databases.ConsumerConsumptionDB:
                return this.consumerConsumptionDBModel;
            case databases.ConsumerAggregationDB:
                return this.consumerAggregationDBModel;
            case databases.ConsumerCompilationDB:
                return this.consumerCompilationDBModel;
            case databases.ConsumerCompilationAggregationDB:
                return this.consumerCompilationAggregationDBModel;
            case databases.ConsumerFootprintDB:
                return this.consumerFootprintDBModel;
            case databases.ConsumerFootprintDataDB:
                return this.consumerFootprintDataDBModel;
            case databases.ConsumerForecastDB:
                return this.consumerForecastDBModel;
            case databases.ConsumerPriorizationDB:
                return this.consumerPriorizationDBModel;
            case databases.masterRegistryDB :
                return this.masterRegistryDBModel;
            case databases.usersDB:
                return this.userDBModel;
            default:
                this.MyLogger.error('Unknown database');
        }
    }

    /**
     * Returns an object that suits the corresponding database Model. This Object can be saved into the database.
     * @param document: Object, fitting to the assigned data
     * @param database: db.enum.ts
     * @returns A new Model corresponding to the assigned Database. E.g. this model can be saved into the corresponding db.
     */
    private getDatabaseModel(document, database: databases) {
        // TODO: this function rejects zero-values!!!
        //  If the data don't match the schema mongoose will handle this, no need to do this as a side effect here ...
        //  A switch would be better to read
        if (database == databases.LoggedDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.LoggedDataDBModel(document);
            } else {
                throw Error(
                    'No data, timestamp or timestampReadable keys were assigned',
                );
            }
        } else if (database == databases.RheinenergieDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.RheinenergieDataDBModel(document);
            } else {
                throw Error('No hashedData key was assigned');
            }
        } else if (database == databases.SMADataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.SMADataDBModel(document);
            } else {
                throw Error('No hashedData key was assigned');
            }
        } else if (database == databases.SMAprobandenDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                const res = new this.SMAprobandenDataDBModel(document);
                return res;
            } else {
                throw Error('No hashedData key was assigned');
            }
        } else if (database == databases.LiqwotecDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.LiqwotecDataDBModel(document);
            } else {
                throw Error('No hashedData key was assigned');
            }
        } else if (database == databases.LEWDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.LEWDataDBModel(document);
            } else {
                throw Error('No hashedData key was assigned');
            }
        } else if (database == databases.SchweigerDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.SchweigerDataDBModel(document);
            } else {
                throw Error('No hashedData key was assigned');
            }
        } else if (database == databases.ffeDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.ffeDataDBModel(document);
            } else {
                throw Error('No correct ConsumerPriorization given');
            }
        } else if (database == databases.AggregatedDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.AggregatedDataDBModel(document);
            } else {
                throw Error(
                    'No lemma, hashedData, txReceipt keys were assigned',
                );
            }
        } else if (database == databases.NotarizedDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.NotarizedDataDBModel(document);
            } else {
                throw Error('No MerkleRoot keys were assigned');
            }
        }else if (database == databases.NotarizedOwnerDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.NotarizedOwnerDataDBModel(document);
            } else {
                throw Error('No MerkleRoot keys were assigned');
            }
        } else if (database == databases.RemoteNotarizationDataDB) {
            if (
                document['data'] &&
                document['localMerkleProof']
            ) {
                return new this.RemoteNotarizationDataDBModel(document);
            } else {
                throw Error('RemoteNotarizationDataDBModels');
            }
        } else if (database == databases.CollectiveNotarizationDataDB) {
            if (
                document['_id']
            ) {
                return new this.CollectiveNotarizationDataDBModel(document);
            } else {
                throw Error('RemoteNotarizationDataDBModels');
            }
        } else if (database == databases.LoggedProsumerDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.LoggedProsumerDataDBModel(document);
            } else {
                throw Error('Problem with labeledData format');
            }
        } else if (database == databases.CommittedProsumerDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.CommittedProsumerDataDBModel(document);
            } else {
                throw Error('Problem with labeledData format');
            }
        } else if (database == databases.VerifiableProsumerDataDB) {
            if (
                document['data'] &&
                document['timestamp'] &&
                document['timestampReadable']
            ) {
                return new this.VerifiableProsumerDataDBModel(document);
            } else {
                throw Error('Problem with labeledData format');
            }
        } else if (database == databases.labeledConsumerAggregationDB) {
            if (
                document['localTimeSeries']
            ) {
                return new this.labeledConsumerAggregationDBModel(document);
            } else {
                throw Error('Problem with labeledConsumerAggregation data format');
            }
        } else if (database == databases.ConsumerConsumptionDB) {
            if (document['timestamp'] && typeof(document['consumption']) != 'undefined') {
                return new this.consumerConsumptionDBModel(document);
            } else {
                console.log("Document: " + JSON.stringify(document));
                throw Error('No timestamp or consumption were assigned');
            }
        } else if (database == databases.ConsumerAggregationDB) {
            if (document['timestamp'] && document['averageConsumption']) {
                return new this.consumerAggregationDBModel(document);
            } else {
                throw Error('No timestamp or averageConsumption were assigned');
            }
        } else if (database == databases.ConsumerCompilationDB) {
            return new this.consumerCompilationDBModel(document);
        } else if (database == databases.ConsumerCompilationAggregationDB) {
            if (document['timestamp'] && document['averageConsumption']) {
                return new this.consumerCompilationAggregationDBModel(document);
            } else {
                throw Error('No correct ConsumerCompilationAggregation given');
            }
        } else if (database == databases.ConsumerFootprintDB) {
            if (document['timestamp'] && document['footprint']) {
                return new this.consumerFootprintDBModel(document);
            } else {
                throw Error('No correct ConsumerFootprint given');
            }
        } else if (database == databases.ConsumerFootprintDataDB) {
            if (document['timestamp'] && document['days']) {
                return new this.consumerFootprintDataDBModel(document);
            } else {
                throw Error('No correct ConsumerFootprintData given');
            }
        } else if (database == databases.ConsumerForecastDB) {
            if (document['timestamp'] && document['forecast']) {
                return new this.consumerForecastDBModel(document);
            } else {
                throw Error('No correct ConsumerForecast given');
            }
        } else if (database == databases.ConsumerPriorizationDB) {
            if (
                document['timestamp'] &&
                document['prioValueWind'] &&
                document['prioValueWasser'] &&
                document['prioValuePhotovoltaik'] &&
                document['prioValueBiogas'] &&
                document['prioValueGeothermie']
            ) {
                return new this.consumerPriorizationDBModel(document);
            } else {
                throw Error('No correct ConsumerPriorization given');
            }
        } else if (database == databases.masterRegistryDB) {
            if (
                document['pubKey_x'] &&
                document['location'] &&
                document['prosumer_name']
            ) {
                return new this.masterRegistryDBModel(document);
            } else {
                throw Error('No correct masterData given');
            }
        } else {
            throw Error('Something went wrong during getDatabaseModel');
        }
    }

    /**
     * Checks if a user to a given name exists in the DB.
     *
     * @returns true if the user exists, false otherwise
     */
    async userExist(name: string): Promise<boolean> {
        return await this.userDBModel.exists({name: name});
    }

    /**
     * Creates and stores a new user entity in the DB, if the username isn't already taken.
     *
     * @param createUserDto object with all needed information, according to CreateUserDto
     * @returns the new user entity
     * @throws if the username is already taken
     */
    async createUser(createUserDto: CreateUserDto): Promise<User> | never {
        if(await this.userDBModel.exists({name: createUserDto.name})) {
            this.MyLogger.warn("Username already taken");
            throw new Error("Username already taken");
        }
        return this.userDBModel.create(createUserDto);
    }

    /**
     * Deletes one user from the DB. The Function will always return and throw no errors, even if the entry
     * can't be deleted. In the end it doesn't matter whether the entry wasn't in the DB in the first place
     * or is deleted now.
     *
     * @param id the id of the user that is to be deleted.
     * @returns an object containing
     */
    async deleteUser(id: string): Promise<Object> {
        const res = await this.userDBModel.deleteOne({_id: id});
        if (!res.deletedCount) this.MyLogger.warn(`User ${id} can't be deleted, because the user can't be found.`);
        return res;
    }

    /**
     * Search for a user in the DB, based on his username. This function doesn't throw an error if the user
     * can't be found, because of the way it is used to check if thw user exists when a user is validated.
     *
     * @param username the username
     * @returns the user entity or null if the user can't be found
     */
    async findUserByName(username: string): Promise<User> {
        const user = await this.userDBModel.findOne({name: username}, null, {lean: true});
        if(user) return user;
        this.MyLogger.warn("User with this name (" + username + ") does not exist");
        return null;
    }

    /**
     * Search for a user in the DB, based on his id. Like findUserByName() this function returns null and doesn't
     * throw an error if the user can't be found, because of the way the function is used to check if a user exists
     * when a JWt is validated.
     *
     * @param id the users id
     * @returns the user entity or null if an error occurs
     */
    async findUserById(id: string): Promise<User> {
        const user = this.userDBModel.findById(id, null, {lean: true});
        if(user) return user;
        this.MyLogger.warn("User with this id (" + id + ") does not exist");
        return null;
    }

    /**
     * Updates a user entry.
     *
     * @param id the users id
     * @param patchUserDto the new updates
     * @returns the updated user entry
     * @throws error if the user does not exist
     */
    async updateUser(id: string, patchUserDto: PatchUserDto): Promise<User> | never {
        const user = await this.userDBModel.findByIdAndUpdate(id, {$set: patchUserDto},
            {returnDocument: 'after', lean: true, new: true});
        if (user) return user;
        this.MyLogger.error("Can't update user data, because the user can't be found.");
        throw new Error("Can't update user data, because the user can't be found.");
    }

    async getAllUser(): Promise<Array<User>> {
        return await this.userDBModel.find({});
    }

}
