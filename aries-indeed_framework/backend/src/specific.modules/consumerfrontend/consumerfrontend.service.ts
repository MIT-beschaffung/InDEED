import {Injectable} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {map} from 'rxjs/operators';
import {DatabaseService} from 'src/generic.modules/database/database.service';
import {databases} from 'src/generic.modules/database/db.enum';
import {ConfigService} from 'src/config.service';
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {CryptoService} from 'src/generic.modules/crypto/crypto.service';
import {ConsumerService} from "../consumer/consumer.service";
import {firstValueFrom} from 'rxjs';
import {AuthService} from "../authentication/auth.service";
import {keyPairDto} from "../labeling/keyPair.dto";
import {locationDto} from "../masterData/location.dto";



@Injectable()
export class ConsumerfrontendService {
    constructor(
        private httpService: HttpService,
        private databaseService: DatabaseService,
        private readonly config: ConfigService,
        private cryptoService: CryptoService,
        private ConsumerService: ConsumerService,
        private MyLogger: MyLogger,
        private readonly authService: AuthService
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
        this.initialize();
    }

    private lastConsumptionUpdateTime = 0;
    private originData = null;
    private footprintParam = null;

    // For signing messages
    private sKey;
    private pKey;


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /*
     * Functions to process the thenables from Database Queries
     */

    /**
     * Return the data of a thenable.
     * Implementing a function to process the promise in .Then() is not working (Error: There is no property 'abc' when working with object of 'unnotarizedHash')
     * @param res: The result of the Thenable
     * @returns the data of res for further processing
     */
    returnData(res) {
        return res;
    }

    /**
     * Sums up the consumption values to get the total consumption
     * @param res: The result of the Thenable. This thenable is a list of objects, each with an attribute consumption
     * @returns the total Consumption
     */
    sumUpConsumption(res): number {
        let totalConsumed = 0;
        for (let i = 0; i < res.length; i++) {
            if (res[i].consumption) {
                totalConsumed += res[i].consumption;
            }
        }
        return totalConsumed;
    }

    /**
     * Auxiliary function, that computes the average consumption from an array of given consumption data over a specific time interval.
     * It's expected to have data for every 5 Minutes.
     *
     * @param data the given array of compilations
     * @param time amount of ms for the given time interval (e.g. 86400000 for 1 day)
     *
     * @returns the average consumption
     */
    averageConsumption(data, time: number): number {

        if (data.length == 0) return 0;

        let averageConsumption = 0;
        data.forEach(e => averageConsumption += e.consumption);

        return averageConsumption / Math.floor((time / (1000 * 60 * 5))); // amount of 5 minute slots in time interval
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Database query (find) with query option
     * @param query: The query
     * @param db: The database
     * @returns matching objects
     */
    async queryDB(query, db: databases) {
        return  await this.databaseService.find(query, db);
    }

    // Datenbankabfrage mit query und db
    async queryDBWithSortAndLimit(query: {}, db: databases, sort: {}, limit: number) {
        return await this.databaseService.findWithSortAndLimit(query, db, sort, limit);
    }

    /**
     * Caches the total and average consumption in the ConsumerAggregationDB.
     * The values are computed from the logged values in ConsumerConsumptionDB.
     * The funktion is triggered everytime a new consumption gets logged via VZ Push.
     */
    async createAggregationData(): Promise<void> {
        const averageConsumption = {
            '15m': 0,
            '1h': 0,
            '24h': 0,
            '7d': 0,
            '30d': 0,
        };
        const current = Date.now();
        const consumptionData = {
            _id: '507f191e810c19729de860ea',
            totalConsumption: 0,
            timestamp: current,
            timestampReadable: new Date(current).toString(),
            averageConsumption: averageConsumption,
        };

        const data = await this.databaseService.getAllEntries(databases.ConsumerConsumptionDB);

        consumptionData.totalConsumption = this.sumUpConsumption(data);
        this.MyLogger.log("Total consumption so far: " + consumptionData.totalConsumption);

        // Dirty fix, because the timestamps in ConsumerConsumptionDB are in s, not in ms
        consumptionData.timestamp = current / 1000;

        consumptionData.averageConsumption = {
            '15m': await this.queryDB(
                { timestamp: { $gte: consumptionData.timestamp - 900 } },
                databases.ConsumerConsumptionDB,
            ).then(res => {
                return this.averageConsumption(res, 900000)
            }),
            '1h': await this.queryDB(
                { timestamp: { $gte: consumptionData.timestamp - 3600 } },
                databases.ConsumerConsumptionDB,
            ).then(res => {
                return this.averageConsumption(res, 3600000)
            }),
            '24h': await this.queryDB(
                { timestamp: { $gte: consumptionData.timestamp - 86400 } },
                databases.ConsumerConsumptionDB,
            ).then(res => {
                return this.averageConsumption(res, 86400000)
            }),
            '7d': await this.queryDB(
                { timestamp: { $gte: consumptionData.timestamp - 604800 } },
                databases.ConsumerConsumptionDB,
            ).then(res => {
                return this.averageConsumption(res, 604800000)
            }),
            '30d': await this.queryDB(
                { timestamp: { $gte: consumptionData.timestamp - 18144000 } },
                databases.ConsumerConsumptionDB,
            ).then(res => {
                return this.averageConsumption(res, 18144000000)
            }),
        };

        try {
            this.MyLogger.info("Update consumptionData");
            if(!await this.databaseService.entryExist(consumptionData._id,databases.ConsumerAggregationDB)){
                await this.databaseService.saveOne(consumptionData, databases.ConsumerAggregationDB);
            } else {
                await this.databaseService.updateOne(consumptionData._id, consumptionData, databases.ConsumerAggregationDB);
            }
        } catch (error) {
            this.MyLogger.error("Updating consumptionData failed: " + error.toString());            
        }
    }

    /**
     * Triggers createAggregationData() and repeats this in an infinitive loop in a given time interval.
     * @deprecated Aggregation is triggered after VZpush
     * @param timeout the time to wait until function call is repeated
     */
    async startAggregation(timeout: number): Promise<void> {
        // TODO: change to setInterval
        this.createAggregationData();
        setTimeout(() => {
            this.createAggregationData();
            this.startAggregation(timeout);
        }, timeout);
    }

    /**
     * Auxiliary function to generate a random integer between 0 and 100.
     *
     * @returns an integer between 0 and 100
     */
    randomScalingFactor(): number {
        return Math.floor(Math.random() * 101);
    }

    /**
     * Saves a new entry with the share of consumption sources from all labeled entries of ConsumerConsumptionDB to ConsumerCompilationDB.
     * This funktion is triggered by the Consumer service every time after receiving a new labeling proof.
     *
     * @param id of the last ConsumerConsumptionDB entry
     */
    async createConsumerCompilation(id: string): Promise<void> {
        try {
            const data = await this.databaseService.findByID(id, databases.ConsumerConsumptionDB).then(this.returnData);

            const compilation = {
                timestamp: Date.now() / 1000,
                // wind: 0,
                wasser: 0,
                pv: 0,
                // biogas: 0,
                // geothermie: 0,
                graustrom: 0
            }

            if (!data.grayConsumption) {
                this.MyLogger.warn("No ConsumerConsumption Data found.");
                await this.databaseService.saveOne(compilation, databases.ConsumerCompilationDB); //TODO hier 0 werte speichern oder nicht?
                return;
            }

            compilation.graustrom = data.grayConsumption;

            if (data.labelingProof) {
                for (const t of data.transactions) {
                    if (t.consumerID !== this.pKey[0]) continue;
                    try {
                        const producer_data = await firstValueFrom(
                            await this.httpService.get('http://nestjs-ubt:8105/masterData/byKey' + t.producerID,
                                {headers: {'api_key': this.config.ApiKey}})
                        );

                        switch (producer_data.data[0].source) {
                            // case 'windkraft':
                            //     compilation.wind += t.value;
                            //     break;
                            case 'hydro':
                                compilation.wasser += t.value;
                                break;
                            case 'solar':
                                compilation.pv += t.value;
                                break;
                            // case 'biogas':
                            //     compilation.biogas += t.value;
                            //     break;
                            // case 'geothermie':
                            //     compilation.geothermie += t.value;
                            //     break;
                            default:
                                this.MyLogger.warn("Unknown source type '" +
                                    producer_data.data[0].source + "' while aggregating the consumer compilation.");
                        }
                    } catch (e) {
                        this.MyLogger.error(e.toString());
                        //TODO Hier partiellen DB eintrag anlegen?
                        return;
                    }
                }
            }
            await this.databaseService.saveOne(compilation, databases.ConsumerCompilationDB);
        } catch(err) {
            this.MyLogger.error("Error while updating consumer compilation: " + err.toString());
        }
        //kein Await soll nur async triggern
        this.createCompilationAggregationData();
    }

    /**
     * Creates randomized compilation data and stores it to the ConsumerCompilationDB.
     * This is repeated in an infinitive loop in a given time interval.
     * @deprecated only for testing reasons
     * @param timeout the time to wait between data generations
     */
    async startRandomCompilationCreation(timeout: number): Promise<void> {
        setTimeout(() => {
            const compilation = {
                timestamp: Date.now(),
                // wind: this.randomScalingFactor(),
                wasser: this.randomScalingFactor(),
                pv: this.randomScalingFactor(),
                // biogas: this.randomScalingFactor(),
                // geothermie: this.randomScalingFactor(),
                graustrom: this.randomScalingFactor(),
            };
            try {
                this.MyLogger.debug("Trying to save in startRandomCompilationCreation");
                this.databaseService.saveOne(
                    compilation,
                    databases.ConsumerCompilationDB,
                );
            } catch(err) {
                this.MyLogger.error(err.toString());
            }
        }, timeout);
    }

    /**
     * Auxiliary function, that computes the average compilation from an array of given compilations over a specific time interval.
     * It's expected to have on compilation every 5 Minutes.
     *
     * @param data the given array of compilations
     * @param time amount of ms for the given time interval (e.g. 86400000 for 1 day)
     *
     * @returns a compilation object, that contains the average compilation
     */
    averageCompilation(data, time: number): {wasser: number, pv: number, graustrom: number} {  //{wind: number, wasser: number, pv: number, biogas: number, geothermie: number, graustrom: number} {
        const result = {
            // wind: 0,
            wasser: 0,
            pv: 0,
            // biogas: 0,
            // geothermie: 0,
            graustrom: 0
        }

        data.forEach(e => {
            // result.wind += e.wind;
            result.wasser += e.wasser;
            result.pv += e.pv;
            // result.biogas +=e.biogas;
            // result.geothermie += e.geothermie;
            result.graustrom += e.graustrom;
        })

        for (const [key, val] of Object.entries(result)) {
            result[key] = val / Math.floor((time / (1000 * 60 * 5))); // amount of 5 minute slots in time interval
        }
        return result;
    }

    /**
     * Caches the share of sources consumption in the ConsumerCompilationAggregationDB.
     * The values are computed from the logged values in ConsumerCompilationDB.
     * The function is triggered everytime a new entry was added to ConsumerCompilationDB.
     */
    async createCompilationAggregationData(): Promise<void> {
        this.MyLogger.log("Compiling aggregate data");
        const compilation = {
            // wind: 0,
            wasser: 0,
            pv: 0,
            // biogas: 0,
            // geothermie: 0,
            graustrom: 0
        };
        const averageConsumption = {
            '1d': compilation,
            '7d': compilation,
            '30d': compilation,
            '365d': compilation
        };
        const compilationData = {
            _id: '507f191e810c19729de860ea',
            totalConsumption: null,
            timestamp: null,
            averageConsumption: averageConsumption,
        };
        compilationData.timestamp = Date.now() / 1000;
        this.MyLogger.debug("Timestamp: " + compilationData.timestamp);

        try {
            compilationData.averageConsumption = {
                '1d': await this.queryDB(
                    { timestamp: { $gt: compilationData.timestamp - 86400000 } },
                    databases.ConsumerCompilationDB,
                ).then(res => {
                    return this.averageCompilation(res, 86400000)
                }),
                '7d': await this.queryDB(
                    { timestamp: { $gt: compilationData.timestamp - 604800000 } },
                    databases.ConsumerCompilationDB,
                ).then(res => {
                    return this.averageCompilation(res, 604800000)
                }),
                '30d': await this.queryDB(
                    { timestamp: { $gt: compilationData.timestamp - 18144000000 } },
                    databases.ConsumerCompilationDB,
                ).then(res => {
                    return this.averageCompilation(res, 18144000000)
                }),
                '365d': await this.queryDB(
                    { timestamp: { $gt: compilationData.timestamp - 31536000000 } },
                    databases.ConsumerCompilationDB,
                ).then(res => {
                    return this.averageCompilation(res, 31536000000)
                }),
            };

            this.MyLogger.debug("Trying to save in ConsumerCompilationAggregationDB");
            if (await this.databaseService.entryExist('507f191e810c19729de860ea', databases.ConsumerCompilationAggregationDB))
                await this.databaseService.updateOne('507f191e810c19729de860ea', compilationData, databases.ConsumerCompilationAggregationDB);
            else
                await this.databaseService.saveOne(compilationData, databases.ConsumerCompilationAggregationDB);
        } catch (err) {
            this.MyLogger.error("Error while fetching and updating the average consumption: " + err.toString());
        }
    }

    /**
     * Triggers startCompilationAggregationData() and repeats this in an infinitive loop in a given time interval.
     * @deprecated Aggregation is triggered after receiving a labeling proof
     * @param timeout the time to wait until function call is repeated
     */
    async startCompilationAggregation(timeout: number): Promise<void> {
        setTimeout(() => {
            this.createCompilationAggregationData();
            this.startCompilationAggregation(timeout);
        }, timeout);
    }

    /**
     * Returns an array containing the average CO2 emission of the last 30 days, computed from the entries of
     * ConsumerCompilationDB. Each entry of the array represents the emission of 15 minutes.
     *
     * @param res Array of ConsumerCompilationDB entries
     * @returns array of average CO2 emissions
     */
    getAverageCO2Emission(res): Array<number> {
        const sumGraustrom = [];
        res.forEach((element) => {
            sumGraustrom.push(element.graustrom);
        });
        const averageCO2Emission = [];
        for (let i = 0; i < res.length; i += 4) {
            let sum = 0;
            for (var j = i; j < i + 4 && j < res.length; j++) {
                sum += sumGraustrom[j];
            }
            averageCO2Emission.push(sum / (j - i + 1));
        }
        return averageCO2Emission;
    }

    /**
     * Returns the carbon footprint of the last months, computed out of the average C02 emission.
     *
     * @param res
     * @param quarters number of months
     * @returns array of average gray consumption
     */
    async queryGraustrom(res, quarters: number): Promise<number> {
        const array = [];
        res.forEach((element) => {array.push(element.footprint.value)});
        const result = await this.queryDBWithSortAndLimit({}, databases.ConsumerCompilationDB, { timestamp: -1 }, quarters,)
            .then(this.getAverageCO2Emission);
        const carbonFootprint = [];
        for (let i = 0; i < result.length; i++) {
            carbonFootprint[i] = result[i] * array[i];
        }
        return Math.round(carbonFootprint.reduce((a, b) => {return a + b;}));
    }

    /**
     * @deprecated This is not yet implemented
     * @returns Array of 30 0's
     */
    async queryGrayConsumption(): Promise<Array<number>> {  // of current consumer
        // for the last days up to dayMax
        const dayMax = 30;
        const gray = [];
        // TODO
        for(let i=0; i<dayMax; i++) {
            gray.push(0)
        }
        return gray;
    }

    /**
     * Fetches the CO2 footprint parameters from ffe and stores it in footprintParam.
     */
    async updateFootprintParam(): Promise<void> {
        this.MyLogger.debug('...update footprint parameter');
        this.footprintParam = await firstValueFrom(
            this.httpService.get('https://opendata.ffe.de/api/od/rpc/v_id_opendata_56')
             .pipe(map((response) => response.data))
        );
    }

    // TODO calculate with this.footprintParam; adjust format <-- use Dto
    /**
     * If footprintParam is not set, this triggers updateFootprintParam().
     * The function is used from the controller and is accessible over an endpoint.
     */
    async createFootprintData(): Promise<void> {
        if(!this.footprintParam) await this.updateFootprintParam();
    }

    /**
     * Caches the CO2 forecast in the ConsumerForecastDB.
     */
    async startForecast(): Promise<void> {
        this.MyLogger.debug('...start forecast');
        try {
            const data = await firstValueFrom(this.httpService.get('https://opendata.ffe.de/api/od/rpc/v_id_opendata_57')
                .pipe(map((response) => response.data)));

            const entry = {
                _id: '507f191e810c19729de860ea',
                timestamp: Math.round(Date.now() / 1000),
                forecast: data  // val * emission (of last 24 h) ?
            };

            if(!await this.databaseService.entryExist('507f191e810c19729de860ea', databases.ConsumerForecastDB)) {
                await this.databaseService.saveOne(entry,databases.ConsumerForecastDB);
            }else
                await this.databaseService.updateOne('507f191e810c19729de860ea', entry, databases.ConsumerForecastDB);

        } catch (err) {
            this.MyLogger.error("Error when starting Forecast: " + err.toString());
        }
    }

    /**
     * Then new consumption data is received via POST request this function stores the Data in the ConsumerConsumptionDB.
     * Then the data is sent to the UBT backend (POST /labeling) to include them in the next labeling proof iteration.
     * After this the localTimeSeries (LTS; used to display the history of energy consumption) in the labeledConsumerAggregationDB is updated.
     * This includes filling the LTS with zero values if data is missing for certain timestamps and removing entries from
     * the LTS that are older than 24 hours.
     * In the end createAggregationData() is triggered to update cached data.
     * After a delay of 6 minutes ConsumerService.updateLoggedDataWithLabelingProof(), createConsumerCompilation()
     * and cacheOriginData() are triggered to update the consumption data with the labeling proof, that should be generated by now.
     *
     * @param jsondata
     * @returns a string that indicates the end of function and is returned via HTTP response
     */
    async processVZLoggerData(jsondata): Promise<string> {
        this.MyLogger.debug("Processing new VZLogger data: " + JSON.stringify(jsondata));

        const data = jsondata.data;
        const channel = data.find((c) => c.uuid == '0');
        this.MyLogger.debug("Channel: " + JSON.stringify(channel));

        // check, if channel is defined
        if (channel == undefined) {
            return 'Ignoriere Update, da Channel undefined';
        }

        // const consumption = channel.tuples[0][1];
        const consumed = channel.tuples[0][1];
        const vzloggerTime = Math.round(channel.tuples[0][0] / 1000);
        const updateTime = Math.round(Date.now()/1000);

        this.MyLogger.debug("Comparing vzlogger time and current time: ");
        this.MyLogger.debug("VZLogger time: " + vzloggerTime);
        this.MyLogger.debug("Current time:  " + updateTime);

        // Update consumption if last update is older than 15 min
        this.MyLogger.debug("Updating ConsumerConsumptionDB")
        this.lastConsumptionUpdateTime = updateTime;

        try {
            this.MyLogger.debug("Saved new database entry to ConsumerConsumptionDB");
            const consumerData = {
                consumedPower: consumed,  // in W
                ownerPubKey_x: this.pKey[0],
                timestamp: vzloggerTime,
                role: "Consumer"
            }

            // this.MyLogger.warn('###' + JSON.stringify(consumerData))

            this.MyLogger.log("Sending consumption data to UBT: " + JSON.stringify(consumerData));
            let result = await this.httpService.post('http://nestjs-ubt:8105/labeling', consumerData, {headers: {'api_key': this.config.ApiKey}}).toPromise();

            this.MyLogger.debug("Received response from utility: " + JSON.stringify(result.data));
            const id = result.data._id;
            this.MyLogger.debug("Id: " + id);

            try {
                await this.databaseService.saveOne(
                    {_id: id, timestamp: vzloggerTime, consumption: consumed},  // in W
                    databases.ConsumerConsumptionDB,
                );
            } catch (err) {
                this.MyLogger.error("Error while updating consumption data: " + err.toString());
            }

            try { // localConsumption
                const Ids = await this.databaseService.getAllIDs(databases.labeledConsumerAggregationDB)
                    .catch(err => {
                        this.MyLogger.error("Could not get id:" + err);
                        return [];
                    });

                if (Ids.length == 0) {
                    await this.databaseService.saveOne(
                        {localTimeSeries: [vzloggerTime, Math.round(consumed) / 1000, null]},  // in [ VZtime, kW, - ]
                        databases.labeledConsumerAggregationDB);
                } else if (Ids.length == 1) {
                    const labeledData = await this.databaseService.findByID(Ids[0], databases.labeledConsumerAggregationDB) as any;
                    let localTimeSeries = labeledData.localTimeSeries;

                    this.MyLogger.debug("Time series before update:\n" + JSON.stringify(localTimeSeries));

                    if (localTimeSeries.length > 1) {
                        // add empty lines if older than 5 min and then add line with !null (TOL = +2,5 min)  <-- CHANGE to 15 min later !!
                        const TOL = 2.5 * 60; // 2,5 min tolerance
                        let oldTime = localTimeSeries[localTimeSeries.length - 1][0];

                        this.MyLogger.debug("oldTime: " + oldTime);
                        this.MyLogger.debug("localTime: " + vzloggerTime);
                        this.MyLogger.debug("Adding additional entries");

                        // TODO ...
                        if (oldTime.toString().length != vzloggerTime.toString().length) {
                            this.MyLogger.error('Problem with timestamps in labeledConsumerAggregationDB - no additional entries added!');
                        }

                        while (vzloggerTime > 300 + TOL + oldTime) {
                            oldTime += 300;  // adding 5 minutes
                            this.MyLogger.debug("Adding timestamp " + oldTime);
                            localTimeSeries.push([oldTime, 0, null]);
                        }
                    }

                    this.MyLogger.info("Updating local consumption data");

                    localTimeSeries.push([vzloggerTime, Math.round(consumed) / 1000, null]);  // in [ VZtime, kW, - ]

                    localTimeSeries = localTimeSeries.filter(e => e[0] + 84600 > vzloggerTime);

                    this.MyLogger.debug("Time series after update:\n" + JSON.stringify(localTimeSeries));

                    await this.databaseService.updateOne(Ids[0], {localTimeSeries: localTimeSeries}, databases.labeledConsumerAggregationDB);
                } else {
                    this.MyLogger.error('More entries than anticipated in labeledConsumerAggregationSchema.');
                }

            } catch (err) {
                this.MyLogger.error("Error when processing VZLogger data: " + err.toString());
            }

            this.MyLogger.info("Setting timeout for supplementing labeling data later on");

            const timeout = 10 * 60 * 1000; //needs to be a bit higher than 5 minutes
            setTimeout(async () => {
                this.MyLogger.log("Fetching labeling proof after " + timeout / 1000 + " seconds");
                await this.ConsumerService.updateLoggedDataWithLabelingProof(id)
                    .catch(error => {this.MyLogger.error(error.toString())});
                //kein Await soll nur async triggern
                // TODO nur wenn erfolgreich => return werte /errors von updateLoggedDataWithLabelingProof anpassen
                this.createConsumerCompilation(id);
                this.cacheOriginData();
            }, timeout);

        } catch (err) {
            this.MyLogger.error("Error while updating consumption data: " + err.toString());
        }

        //kein Await soll nur async triggern
        this.createAggregationData();

        return 'Updated consumption';
    }

    /**
     * @returns the cached data from ConsumerAggregationDB. If no entry exists an object with null values is returned.
     */
    async getPreparedConsumptionData(): Promise<{_id: string, totalConsumption: number, timestamp: number, averageConsumption: number, historicConsumption: [], currentConsumption: { consumption: number }}> {

        const consumptionData = {
            _id: null,
            totalConsumption: null,
            timestamp: null,
            averageConsumption: null,
            historicConsumption: null,
            currentConsumption: null,
        };

        const result = await this.databaseService
            .findByID(
                '507f191e810c19729de860ea',
                databases.ConsumerAggregationDB,
            )
            .then(this.returnData);

        this.MyLogger.debug("Prepare Data");

        consumptionData._id = result._id;
        consumptionData.totalConsumption = result.totalConsumption;
        consumptionData.timestamp = result.timestamp;
        consumptionData.averageConsumption =  result.averageConsumption;
        consumptionData.historicConsumption = await this.queryDB(
            { timestamp: { $lt: consumptionData.timestamp } },
            databases.ConsumerConsumptionDB,
        ).then(this.returnData);
        consumptionData.currentConsumption =
            consumptionData.historicConsumption.sort(
                (a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp),
            )[0];
        if(consumptionData.currentConsumption == undefined)
            consumptionData.currentConsumption = {consumption:0};
        return consumptionData;
    }

    /**
     * @returns the cached LTS from labeledConsumerAggregationDB.
     */
    async getPreparedLocalConsumptionData(): Promise<Array<[number, number, number]> | null> {
        const localConsumptionData = {
            localTimeSeries: null,
        };

        try {
            const ids = await this.databaseService.getAllIDs(databases.labeledConsumerAggregationDB)
                .catch(err => {
                    this.MyLogger.error(err);
                    return [];
                });

            const result = await this.databaseService.findByID(ids[0], databases.labeledConsumerAggregationDB,)
                .then(this.returnData)
                .catch(err => {this.MyLogger.error("Could not query data of id " + ids[0] + ": " + err)});

            if(result) {
                localConsumptionData.localTimeSeries = result.localTimeSeries;

                localConsumptionData.localTimeSeries = await this.queryDB({ timestamp: { $lt: localConsumptionData.localTimeSeries.timestamp } }, databases.labeledConsumerAggregationDB)
                    .then(this.returnData)
                    .catch(err => {this.MyLogger.error("Get data from localTimeSeries failed: " + err);});
                localConsumptionData.localTimeSeries = localConsumptionData.localTimeSeries.sort((a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp),)[0];
            }
        } catch (error) {
            this.MyLogger.error('getPreparedLocalConsumptionData: ' + error.toString())
        }
        return localConsumptionData.localTimeSeries;
    }

    /**
     * Assembles an object consisting of arrays for timestamps and consumptions from source types from the entries of
     * ConsumerCompilationDB. The values of the arrays are related to each other through the index.
     *
     * @param query object that contains the number of queried data points
     * @returns object containing arrays
     */

    formatCompilationData(value){
        return Math.floor(value / 100)/10 ; // to 1 digit
    }

    async getPreparedCompilationData(query): Promise<{timestamp: Array<number>, wasser: Array<number>, pv: Array<number>, graustrom:Array<number>}> {  //Promise<{timestamp: Array<number>, wind: Array<number>, wasser: Array<number>, pv: Array<number>, biogas:Array<number>, geothermie:Array<number>, graustrom:Array<number>}> {
        let numberOfTxnCompilation = parseInt(query.numberOfTxnCompilation);
        if(!(numberOfTxnCompilation > 0)) numberOfTxnCompilation = 0;
        const compilation = {
            timestamp: [],
            // wind: [],
            wasser: [],
            pv: [],
            // biogas: [],
            // geothermie: [],
            graustrom: [],
        };

        const res = await this.queryDBWithSortAndLimit(
            {},
            databases.ConsumerCompilationDB,
            { timestamp: -1 },
            numberOfTxnCompilation,
        ).then(this.returnData);
        res.forEach((element) => {
            compilation.timestamp.push(element.timestamp);
            // compilation.wind.push(this.formatCompilationData(element.wind));
            compilation.wasser.push(this.formatCompilationData(element.wasser));
            compilation.pv.push(this.formatCompilationData(element.pv  ));
            // compilation.biogas.push(this.formatCompilationData(element.biogas ));
            // compilation.geothermie.push(this.formatCompilationData(element.geothermie ));
            compilation.graustrom.push(this.formatCompilationData(element.graustrom ));
        });
        return compilation;
    }

    /**
     * @returns the cached data from ConsumerCompilationAggregationDB.
     */
    async getPreparedAverageCompilationData() {
        return await this.databaseService.findByID('507f191e810c19729de860ea', databases.ConsumerCompilationAggregationDB).then(this.returnData);
    }

    /**
     * Updates the master data of the consumer with new prioritization settings.
     * @param completeBody
     * @returns the status and status text of the PUT /masterData/completeBody request.
     */
    async sendPrioritizationData(completeBody): Promise<object> {
        /* TODO: Building the response is a little bit messy
         * If you don't cast the response to a promise and extract the necessary data,
         * the controller will fail trying to build the next Http response out of this response.
         * Using @Res() from NestJS may solve this, since importing masterData.service results in a cyclic dependencies.
         */
        let response = await this.httpService.get('http://nestjs-ubt:8105/masterData/byKey' + this.pKey[0], {headers: {'api_key': this.config.ApiKey}}).toPromise();
        response.data[0].preference = completeBody.preference
        const result = await this.httpService.put('http://nestjs-ubt:8105/masterData/completeBody', response.data[0], {headers: {'api_key': this.config.ApiKey}}).toPromise();
        return {status: result.status, statusText: result.statusText }
    }

    /**
     * Returns the prioritization settings from the consumers master data.
     *
     * @returns object containing the prio settings
     */
    async getPrioritizationData(): Promise<object> {
        /* TODO: Building the response is a little bit messy
         * If you don't cast the response to a promise and extract the necessary data,
         * the controller will fail trying to build the next Http response out of this response.
         * Using @Res() from NestJS may solve this, since importing masterData.service results in a cyclic dependencies.
         */
        const response = await this.httpService.get('http://nestjs-ubt:8105/masterData/byKey' + this.pKey[0], {headers: {'api_key': this.config.ApiKey}}).toPromise()
        return response.data[0].preference; // only return the preference
    }

    /**
     * @returns the cached data from ConsumerForecastDB.
     */
    async getForecastData() {
        if(!await this.databaseService.entryExist('507f191e810c19729de860ea', databases.ConsumerForecastDB))
            await this.startForecast();

        return await this.databaseService.findByID('507f191e810c19729de860ea', databases.ConsumerForecastDB).then(this.returnData);
    }

    /**
     * Computes the CO2 footprint of the consumer for the last month, week and day based on the entries of ConsumerConsumptionDB.
     * As a side effect this function updates the footprintParam, if isn't set yet.
     *
     * @returns an object containing the footprints
     */
    async getFootprintData(): Promise<{timestamp: number, days: {'1d': number, '7d': number, '30d': number}}> {

        if(this.footprintParam == null){
            //TODO: update all 24h
            await this.updateFootprintParam();
            if(this.footprintParam == null)
                return  {
                    timestamp: Math.round(Date.now()/1000),
                    days: {
                        "1d": 0,
                        "7d": 0,
                        "30d": 0,
                    }};
        }

        const cutoff_month = Math.round(Date.now()/1000) - 60*60*24*14;
        const cutoff_week = Math.round(Date.now()/1000) - 60*60*24*7;
        const cutoff_day = Math.round(Date.now()/1000) - 60*60*24;

        const res = await this.getPreparedCompilationData({'numberOfTxnCompilation':8640})
            .catch(error => this.MyLogger.error(error))

        if(!res || !res.timestamp || res.timestamp.length == 0) //exit if no data is recorded
            return {
                timestamp: Math.round(Date.now()/1000),
                days: {
                    "1d": 0,
                    "7d": 0,
                    "30d":0,
                }};

        let paramIndex = this.footprintParam.data.length-730;
        const lastIndex = this.footprintParam.data.length-1;

        let month = 0;
        let week = 0;
        let day =0;
        this.MyLogger.warn(JSON.stringify(res.timestamp));

        let i = 0
        for(; i < res.timestamp.length; i++) {
            while( paramIndex < lastIndex && this.footprintParam.data[paramIndex].epoch < res.timestamp[i]){
                paramIndex++;
            }
            if (res.timestamp[i] > cutoff_week) break;
            month += res.graustrom[i] * this.footprintParam.data[paramIndex].data.value ;
        }
        for(; i < res.timestamp.length; i++) {
            while( paramIndex < lastIndex && this.footprintParam.data[paramIndex].epoch < res.timestamp[i]){
                paramIndex++;
            }
            if (res.timestamp[i] > cutoff_day) break;
            const t = res.graustrom[i] * this.footprintParam.data[paramIndex].data.value ;
            month += t;
            week += t;
        }

        for(; i < res.timestamp.length; i++) {
            while( paramIndex < lastIndex && this.footprintParam.data[paramIndex].epoch < res.timestamp[i]){
                paramIndex++;
            }
            const t = res.graustrom[i] * this.footprintParam.data[paramIndex].data.value ;
            month += t;
            week += t;
            day += t;
        }

        return {
            timestamp: Math.round(Date.now()/1000),
            days: {
                "1d": Math.round(day),
                "7d": Math.round(week),
                "30d": Math.round(month),
            }};
    }

    /**
     * Function to init the service by fetching the keypair and master data from the secret vault and the UBT backend
     * @private
     */
    private async initialize(): Promise<void> {
        const name = this.config.prosumer_name;
        const keyPairID = name + 'keyPair';

        this.MyLogger.warn('Initializing frontend for ' + name + '...');
        //kein await soll async anlaufen
        this.updateFootprintParam();
        //TODO: keine Annahmen über die Zeit... !
        this.MyLogger.info("Waiting for 10 seconds until UBT backend has started");

        setTimeout(async() => {

            try {
                this.MyLogger.info('Get keypair from secret-vault...');
                const keyPair: keyPairDto = await this.authService.readSecret(keyPairID);
                this.sKey = keyPair.sKey;
                this.pKey = keyPair.pKey;
            } catch (e) {
                this.MyLogger.error('Reading the Keypair from secret-vault failed with ' + e.toString());
                // keys and master data is created by the logged data controllers, no handling possible
            }

            // TODO: Relevanz überprüfen? Kommt doppelt vor oder?
            try {
                this.MyLogger.info('Get master data...');
                const res = await firstValueFrom(
                    await this.httpService.get('http://nestjs-ubt:8105/masterData/byKey' + this.pKey[0],
                        {headers: {'api_key': this.config.ApiKey}})
                );
                if (!res.data) throw new Error('MasterData returned null');
            } catch (e) {
                 this.MyLogger.error('Reading master data failed with ' + e.toString());
                // keys and master data is created by the logged data controllers, no handling possible
            }

        }, 10000);
    }

    /**
     * This funktion is triggered by the Consumer service every time after receiving a new labeling proof.
     * It filters the transactions of the last labeling proof and stores all transactions (and the related source)
     * linked to the consumer in originData. Later on this is used to draw the map.
     */
    async cacheOriginData(): Promise<void> {
        this.originData = {transactions: []}
        // get latest labeled Consumption data
        const data = await this.databaseService.findWithSortAndLimit({labelingProof: { $ne: null}},
            databases.ConsumerConsumptionDB, {timestamp: -1}, 1).then(this.returnData);
        this.MyLogger.debug(JSON.stringify(data));
        if (!data|| data.length == 0 || !data[0].transactions) return; // result could be undefined

        // Get the transactions and filter them for this consumer
        const transactions = data[0].transactions.filter(t => t.consumerID === this.pKey[0]);

        // for each transaction create a return object with the source and position of the producer
        for (const transaction of transactions) {
            /* Http call to MasterData because it lives in a different docker container */
            const producer_data = await this.httpService.get('http://nestjs-ubt:8105/masterData/byKey' + transaction.producerID, {headers: {'api_key': this.config.ApiKey}}).toPromise();
            this.originData.transactions.push({
                location: producer_data.data[0].location,
                asset_type: producer_data.data[0].source,
                // the value is devided by 1000 because it's stored in [W], but it's displayed as [kW] on the website
                // round(x * 100) / 100 returns a rounded number with two decimal places
                consumption: Math.round((transaction.value / 1000) * 100) / 100
            })
        }
    }

    /**
     * Returns the cached transaction data. In case no data is cached it triggers cacheOriginData().
     * @returns originData
     */
    async getOriginData(): Promise<{ transactions: Array<[locationDto, string, number]> }> {
        if(!this.originData) await this.cacheOriginData();
        return this.originData;
    }

    /**
     * @returns the location of the consumer stored in his master data
     */
    async getLocation(): Promise<locationDto> {
        try {
            const master_data = await this.httpService.get('http://nestjs-ubt:8105/masterData/byKey' + this.pKey[0], {headers: {'api_key': this.config.ApiKey}}).toPromise();
            return master_data.data[0].location;
        } catch (error) {
            this.MyLogger.error('Something went wrong trying to get Location: ' + error.toString());
        }
    }
}
