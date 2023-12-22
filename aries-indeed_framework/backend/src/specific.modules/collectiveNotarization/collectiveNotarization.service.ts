import {Injectable} from '@nestjs/common';
import {ConfigService} from "../../config.service";
import { Cron } from '@nestjs/schedule';
import {DatabaseService} from "../../generic.modules/database/database.service";
import {MyLogger} from "src/generic.modules/logger/logger.service";
import {NotarizationService} from "../notarization/notarization.service";
import {LoggeddataService} from "../loggedData/loggeddata.service";
import {databases} from "../../generic.modules/database/db.enum";

@Injectable()
export class CollectiveNotarizationService {

    public readonly ApiKey: string;

    constructor(
        private readonly config: ConfigService,
        private readonly MyLogger: MyLogger,
        private readonly loggeDataService: LoggeddataService,
        private readonly notarizationService: NotarizationService,
        private readonly databaseService: DatabaseService,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Registers an JSON-Object to be collectively notarized later.
     * The data is stored to the CollectiveNotarizationDataDB and the id of this data in the DB is returned.
     *
     * @returns the id of the stored data
     */
    async registerForCollectiveNotarization(data: Object): Promise<string> {
        this.MyLogger.debug("registerForCollectiveNotarization:");
        this.MyLogger.debug(data);
        const registeredObject =
            await this.loggeDataService.createOne(data);
        await this.databaseService.saveOne({'_id' : registeredObject._id},databases.CollectiveNotarizationDataDB);

        return registeredObject._id;
    }

    /**
     * Notarizes all outstanding registered objects.
     * This deletes all affects entries of CollectiveNotarizationDataDB.
     *
     * @returns the proof for the notarized data
     */
    @Cron('0 */5 * * * *')
    async notarizeCollectedObjects(): Promise<Object> {

        const IDs : string[] = await this.databaseService.getAllIDs(databases.CollectiveNotarizationDataDB);

        if(IDs.length <= 0)
            return;

        this.MyLogger.debug("Notarizing " + IDs);


        const proof = await this.notarizationService.notarizeIDs(IDs);


        for(const ID of IDs){
            await this.databaseService.deleteByID(ID,databases.CollectiveNotarizationDataDB);
        }

        return proof;
    }
}