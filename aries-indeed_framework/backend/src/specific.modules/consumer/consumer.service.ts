import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from 'eventemitter2';
import { ConfigService } from 'src/config.service';
import { ConsumerLogData } from './consumer.model';
import { MyLogger } from '../../generic.modules/logger/logger.service';
import { DatabaseService } from 'src/generic.modules/database/database.service';
import { LabelingService} from "../labeling/labeling.service";
import { databases } from 'src/generic.modules/database/db.enum';
import { labeledConsumerAggregation } from 'src/generic.modules/schemas/labeledConsumerAggregation.schema';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SHA256 = require('crypto-js/sha256');

@Injectable()
export class ConsumerService {
    constructor(
        private readonly DatabaseService: DatabaseService,
        private readonly HttpService: HttpService,
        private readonly config: ConfigService,
        private readonly Event: EventEmitter2,
        private readonly LabelingService: LabelingService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Stores new data to the ConsumerConsumptionDB.
     *
     * @param logdata the data to be stored
     * @returns the new entry stored in the DB
     */
    async createOne(logdata: {}) {
        const timestampNumber = Date.now();
        const timestamp = new Date(timestampNumber).toString();

        const temp: {} = {logdata: logdata};
        this.MyLogger.debug(JSON.stringify(temp));
        const result_hashed: string = SHA256(JSON.stringify(temp)).toString();
        this.MyLogger.debug(result_hashed);

        const newLogData = {
            timestampNumber: timestampNumber,
            timestamp: timestamp,
            logdata: logdata,
            hashedLogData: result_hashed
        };

        return await this.DatabaseService.saveOne(newLogData, databases.ConsumerConsumptionDB);
    }

    /**
     * Implementation of the PATCH endpoint.
     * Updates an entry (id given in body parameter) in the ConsumerConsumptionDB.
     *
     * @param completeBody the entry to be stored
     */
    async updateOne(completeBody: {}): Promise<void> {
        const logdataid: string = completeBody['id'];
        const updatedLogData = await this.findbyID(logdataid);
        if (completeBody['timestamp']) {
            updatedLogData.timestamp = completeBody['timestamp'];
        }
        if (completeBody['logData']) {
            updatedLogData.logData = completeBody['logData'];
        }
        if (completeBody['hashedLogData']) {
            updatedLogData.hashedLogData = completeBody['hashedLogData'];
        }
        if (completeBody['root_id']) {
            updatedLogData.root_id = completeBody['root_id'];
        }
        if (completeBody['proof']) {
            updatedLogData.proof = completeBody['proof'];
        }
        await updatedLogData.save();
    }

    /**
     * Implementation of the DELETE endpoint.
     * Deletes an entry (id given in body parameter) from the ConsumerConsumptionDB.
     *
     * @param completeBody the entry to be deleted
     */
    async deleteOne(completeBody) {
        const id = completeBody['id'];

        if (id) {
            await this.DatabaseService.deleteByID(id, databases.ConsumerConsumptionDB,);
        }
    }

    /**
     * Implementation of the POST /search/byID endpoint.
     * Returns the entry related to the given id from the ConsumerConsumptionDB.
     *
     * @param id the entry id
     * @returns the entry
     */
    async findbyID(id: string): Promise<ConsumerLogData> {
        let logdata;
        try {
            logdata = await this.DatabaseService.findByID(
                id,
                databases.ConsumerConsumptionDB,
            );
        } catch (error) {
            throw new NotFoundException('could not find requested logdata');
        }

        if (!logdata) {
            throw new NotFoundException('could not find requested logdata');
        }
        return logdata;
    }

    //TODO: passing an object from endpoint to DatabaseService.find() enables code injection on the ConsumerConsumptionDB
    /**
     * Implementation of the POST /search endpoint.
     * Returns all matching entries from the ConsumerConsumptionDB.
     *
     * @param criteria the mongoose query object
     * @returns array of matching data
     */
    async search(criteria: {}) {
        let logdata;
        try {
            logdata = await this.DatabaseService.find(
                criteria,
                databases.ConsumerConsumptionDB,
            );
        } catch (error) {
            throw new NotFoundException('could not find requested logdata');
        }
        return logdata;
    }

    async findAll() {
        this.MyLogger.log('Getting all IDs')
        let query;
        try {
            query = await this.DatabaseService.getAllIDs(
                databases.ConsumerConsumptionDB,
            );
        } catch (error) {
            throw new NotFoundException('could not find requested logdata');
        }
        return query; 
    }

    // TODO debug!
    /**
     * This function updates an entry of the ConsumerConsumptionDB with its labeling proof and non-verifiable master data.
     * This also includes various checks, whether the labeling proof is valid or not.
     * An invalid labeling proof will result in error messages and the entry from ConsumerConsumptionDB will not be updated.
     *
     * After this the function will update the Consumers LTS with its green share.
     * As a side effect the entry that was stored from the UBt backend for the labeling proof is deleted.
     *
     * @param id the id of the entry from ConsumerConsumptionDB.
     */
    async updateLoggedDataWithLabelingProof(id: string): Promise<void> {
        this.MyLogger.info("Updating locally recorded data with labeling proof");
        // TODO if this fails, repeat later
        try {
            /*
             * The http call to the labeling controller is necessary, because the consumer service and the
             * labeling service life on seperated docker containers.
             */
            const result = await this.HttpService.get('http://nestjs-ubt:8105/labeling/labeledData/' + id, {headers: {'api_key': this.config.ApiKey}}).toPromise();

            const greenConsumptionLabelingProof = Number(result.data.labelingProof.labelingMerkleProof.rawData.green);
            const grayConsumptionLabelingProof = Number(result.data.labelingProof.labelingMerkleProof.rawData.gray);
            const totalConsumptionLabelingProof = greenConsumptionLabelingProof + grayConsumptionLabelingProof;
            const timestampLabelingProof = Number(result.data.labelingProof.labelingMerkleProof.rawData.timestamp);

            this.MyLogger.info("Verifying labeling proof and comparing it to the locally recorded data");
            const labelingProofVerificationResult = await this.HttpService.post('http://nestjs-ubt:8105/labeling/verifyLabelingProofConsumer', result.data.labelingProof, {headers: {'api_key': this.config.ApiKey}}).toPromise();

            if (labelingProofVerificationResult.data.valid == true) {
                // TODO at some stage also check the contract address
                this.MyLogger.info("Labeling proof is true");
                this.MyLogger.debug("Contract address: " + labelingProofVerificationResult.data.contractAddress)
                this.MyLogger.debug("Comparing consumption data and timestamp");

                const timestampSmartContract = Math.round(Number(labelingProofVerificationResult.data.timestamp)/1000);

                const dataTyped = (await this.DatabaseService.findByID(id, databases.ConsumerConsumptionDB)).toObject();
                // dirty fix needed because consumedPower and timestamp is not in dataTyped
                let data = JSON.parse(JSON.stringify(dataTyped));

                this.MyLogger.debug("Looking for ID " + id + " in consumer database: " + JSON.stringify(data) );
                
                const totalConsumptionRecorded = Number(data.consumption);
                const timestampRecorded = Math.round(Number(data.timestamp));
                this.MyLogger.debug("Total consumption from local records: " + totalConsumptionRecorded/1000);  // kW
                this.MyLogger.debug("Total consumption labeling proof: " + totalConsumptionLabelingProof/1000);  // kW
                this.MyLogger.debug("Timestamp from local records: " + timestampRecorded);

                const differenceConsumption = Math.abs(totalConsumptionRecorded - totalConsumptionLabelingProof);
                this.MyLogger.debug("Checking whether consumptions match: " + (differenceConsumption < 1));
                if (differenceConsumption > 1) {
                    this.MyLogger.error("Difference: " + differenceConsumption);
                    throw Error("Skipping update because consumptions are inconsistent");
                } else {
                    this.MyLogger.debug("Difference: " + differenceConsumption);
                }

                const differenceTimestamp = Math.abs(timestampLabelingProof - timestampRecorded);
                this.MyLogger.info("Checking whether timestamps match: " + (differenceTimestamp < 1));
                if (differenceConsumption <= 1) {
                    this.MyLogger.debug("Difference: " + differenceTimestamp);
                } else {
                    this.MyLogger.error("Difference: " + differenceTimestamp);
                    throw Error("Skipping update because timestamps are inconsistent");
                }
                this.MyLogger.debug("Difference to proof publication: " + Math.abs(timestampLabelingProof - timestampSmartContract));

                this.MyLogger.info("Labeling proof matches local records");
                try {
                    this.MyLogger.info("Updating data accordingly");

                    const nonVerifiableMasterData = result.data.labelingProof.labelingMerkleProof.nonVerifiableMasterData;
                    const rawData = result.data.labelingProof.labelingMerkleProof.rawData;

                    data["greenConsumption"] = rawData.green/1000;  // kW
                    data["grayConsumption"] = rawData.gray/1000;  // kW
                    data["labelingProof"] = result.data.labelingProof;

                    data["location"] = nonVerifiableMasterData.location;
                    data["asset_type"] = nonVerifiableMasterData.source;
                    data["optimized_consumptions"] = nonVerifiableMasterData.consumerConsumption;
                    data["transactions"] = nonVerifiableMasterData.transactions;
                } catch (error) {
                    this.MyLogger.error('This error occurred during updating with nvm_data: ' + error);
                }

                // remove labelingProof from db
                this.MyLogger.info('Delete labelingData after proof handover ...')
                await this.HttpService.delete('http://nestjs-ubt:8105/labeling/' + id, {headers: {'api_key': this.config.ApiKey}});//.toPromise();
                await this.DatabaseService.updateOne(id, data, databases.ConsumerConsumptionDB);

                const newData = await this.DatabaseService.findByID(id, databases.ConsumerConsumptionDB);
                this.MyLogger.debug("Data after the update: " + JSON.stringify(newData));

                try { // update localConsumption with greenShare
                    const Ids = await this.DatabaseService.getAllIDs(databases.labeledConsumerAggregationDB)
                        .catch(e => {
                                this.MyLogger.error("Could not get id: " + e.toString() + "\nSet Ids = []");
                                return [];
                            });
                    const id = (Ids.length==0)?null:Ids[0];

                    if (Ids.length != 0) {
                        const labeledConsumerData: labeledConsumerAggregation = await this.DatabaseService.findByID(id, databases.labeledConsumerAggregationDB)
                            .catch(e => {
                                this.MyLogger.error("Could not get labeledConsumerData: " + e.toString());
                            }) as any;

                        let position = labeledConsumerData.localTimeSeries.length;
                        let found = false;
                        this.MyLogger.debug("Initial position: " + position);
                        while (position > 0) {
                            position = position - 1;
                            this.MyLogger.debug("New position: " + position);
                            this.MyLogger.debug("Checking the last timestamp")
                            let timestampTimeSeries = labeledConsumerData.localTimeSeries[position][0];
                            this.MyLogger.debug("Timestamp time series: " + timestampTimeSeries);
                            this.MyLogger.debug("Timestamp recorded: " + timestampRecorded);
                            this.MyLogger.log("Difference: " + Math.abs(timestampTimeSeries - timestampRecorded).toString());
                            if (Math.abs(timestampTimeSeries - timestampRecorded) < 10) {
                                this.MyLogger.info("Timestamps match");
                                found = true;
                                break;
                            } else {
                                this.MyLogger.debug("Timestamps do not match - next try...");
                            }
                        }
                        if (!found) {
                            position = labeledConsumerData.localTimeSeries.length;
                            this.MyLogger.error("No corresponding timestamp found - failing to update");
                        }

                        this.MyLogger.debug("Updating position " + position);
                        const greenShare = result.data.labelingProof.labelingMerkleProof.rawData.green/1000;  // kW
                        const grayShare = result.data.labelingProof.labelingMerkleProof.rawData.gray/1000;  // kW
                        
                        this.MyLogger.debug('greenShare: ' + greenShare);  // kW

                        if ( greenShare > totalConsumptionRecorded * 1000 * 1.01 || (greenShare + grayShare) > totalConsumptionRecorded * 1000 * 1.01 ) {
                            this.MyLogger.warn("Green share exceeds consumption - please check data!");
                            this.MyLogger.info("Green share: " + greenShare + ' kW');
                            this.MyLogger.info("Gray share: " + grayShare + ' kW');
                            this.MyLogger.info("Locally recorded consumption: " + totalConsumptionRecorded * 1000);
                        }
                        
                        labeledConsumerData.localTimeSeries[position][2] = Math.round(greenShare *100)/100;

                        this.MyLogger.debug("Updating localTimeSeries ...");
                        await this.DatabaseService.updateOne(id, {localTimeSeries: labeledConsumerData.localTimeSeries}, databases.labeledConsumerAggregationDB);
                    } else {
                        throw Error('More entries than anticipated!');
                    }
                } catch (error) {
                    this.MyLogger.error('Could not store consumption info in labeledConsumerAggregationDB. Check whether new line has been added.')
                }
            } else {
                this.MyLogger.warn("Labeling proof invalid");
                this.MyLogger.error("Skipping...")
            }
        } catch (err)  {
            this.MyLogger.warn("Updating labeling proof failed: " + err.toString());
        }
    }
}
