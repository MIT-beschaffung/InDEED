import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { ConfigService } from 'src/config.service';
import { MerkleTreeService} from 'src/generic.modules/merkletree/merkletree.service';
import { DatabaseService } from 'src/generic.modules/database/database.service';
import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { databases } from 'src/generic.modules/database/db.enum';


@Injectable()
export class LoggeddataService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly config: ConfigService,
        private readonly Event: EventEmitter2,
        private readonly MerkleTreeService: MerkleTreeService,
        private MyLogger: MyLogger
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Creates a document and saves it in the loggedDataDB and the assigned DB. 
     * @param data The document you want to save 
     * @param database Optional: An additional database, were you want to save the input
     * @param Owner Optional: String, replace with verifiable user credentials 
     * @returns the saved mongoose document
     */
    async createOne(data: {}, database?: databases, Owner?: string) {
        const timestamp = Date.now();
        const timestampReadable = new Date(timestamp).toString();
        let owner = 'root';
        if(Owner){
            owner = Owner
        }

        const result_hashed: string = this.MerkleTreeService.hashObject(data, "SHA256");
        this.MyLogger.debug('Hash of data: ' + result_hashed);

        const newLogData = {
            data,
            timestampReadable,
            timestamp,
            dataHash: result_hashed,
            owner
        };
        try {
            const result = await this.databaseService.saveOne(newLogData, databases.LoggedDataDB,);
            if (database) {
                await this.databaseService.saveOne(newLogData, database);
            }
            return result;
        } catch (error) {
            this.MyLogger.error('This error occurred while saving to LoggedDatabase: ' + error);
            return error;
        }
    }
}
