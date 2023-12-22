import { MyLogger } from '../../generic.modules/logger/logger.service';
import {MerkleTreeService} from 'src/generic.modules/merkletree/merkletree.service';
import { HttpException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/generic.modules/database/database.service';
import { databases } from 'src/generic.modules/database/db.enum';
import { merkleProofForObjectDto } from 'src/generic.modules/merkletree/merkleProofForObject.dto';
import { merkleProofDto } from 'src/generic.modules/merkletree/merkleProof.dto';
import { merkleLemmaElementDto } from 'src/generic.modules/merkletree/merkleLemmaElement.dto';

@Injectable()
export class AggregationService {
    constructor(
        private MyLogger: MyLogger,
        private readonly MerkleTreeService: MerkleTreeService,
        private readonly DatabaseService: DatabaseService,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Creates a merkle proof from a given array of objects.
     * @param objects array of objects
     * @throws HttpException on invalid input
     */
    async aggregateObjects(objects: [Object]): Promise<Array<merkleProofForObjectDto> | never> {
        if (typeof objects != 'object') {
            throw new HttpException('Invalid input: no object array', 400);
        }
        try {
            return this.MerkleTreeService.buildMerkleProofsFromObjectArray(objects, 'SHA256');
        } catch (err) {
            this.MyLogger.debug(err);
            throw new HttpException('Some other problem with input values', 400);
        }
    }

    /**
     * Takes an array of IDs of entries from the loggedDataDB, aggregates the documents (adds merkleProofs), saves the updated
     * documents into the AggregatedDataDB and deletes the documents from the LoggedDataDB.
     *
     * @param IDs array of IDs
     * @returns Array of the new documents stored in AggregatedDataDB
     * @throws HttpException on invalid input
     */
    async aggregateIDs(IDs: string[]) {
        try {
            let loggedDataArray = await this.DatabaseService.findManyByID(IDs, databases.LoggedDataDB);
            this.MyLogger.debug('This List of logged Data was found: \n' + loggedDataArray);

            let DataArray = [];
            for (let i = 0; i < loggedDataArray.length; i++) {
                DataArray.push(loggedDataArray[i]['data']);
            }

            this.MyLogger.debug('DataArray with length ' + DataArray.length + ': ' + DataArray + ', ' + JSON.stringify(DataArray),);
            const proofs = this.MerkleTreeService.buildMerkleProofsFromObjectArray(DataArray,'SHA256');
            this.MyLogger.log('The following proof objects were returned from the MerkleTreeService: \n' + JSON.stringify(proofs));
            for (let i = 0; i < loggedDataArray.length; i++) {
                const newObject = loggedDataArray[i];
                newObject['merkleProof'] = proofs[i]['merkleProof'];
                this.MyLogger.log(JSON.stringify(newObject,null, 4));
                try {
                    const temp = await this.DatabaseService.saveOne(newObject, databases.AggregatedDataDB);
                    this.MyLogger.debug('Saved aggregated Data' + JSON.stringify(temp));
                } catch (error) {
                    this.MyLogger.error('This error occurred while trying to save into this DB: ' +
                            databases.AggregatedDataDB + ': \n' + error);
                }
            }
            const res = await this.DatabaseService.findManyByID(IDs, databases.AggregatedDataDB);

            if (res) {
                for (const document of res) {
                    await this.DatabaseService.deleteByID(document['_id'], databases.LoggedDataDB);
                }
            }

            return res;
        } catch (err) {
            this.MyLogger.error(err);
            throw new HttpException('Some other problem with input values', 400);
        }
    }

    /**
     * Takes a merkle proof object and returns a boolean indicating whether the proof is valid or not.
     *
     * @param merkleProofObject
     * @returns true if the given proof is valid, false (or error string) otherwise
     */
    async verifyMerkleProof(merkleProofObject: merkleProofForObjectDto): Promise<boolean | string> {
        try {
            const root: string = merkleProofObject.merkleProof.root;
            const lemma: merkleLemmaElementDto[] = merkleProofObject.merkleProof.lemma;
            const leaf: string = merkleProofObject.merkleProof.leaf;
            const data = merkleProofObject.data;
            const merkleProof: merkleProofDto = new merkleProofDto(root, lemma, leaf);
            const merkleProofForObject: merkleProofForObjectDto = new merkleProofForObjectDto(merkleProof, data);

            return this.MerkleTreeService.verifyMerkleProofForObject(merkleProofForObject, 'SHA256',);
        } catch (err) {
            this.MyLogger.error(err);
            return 'Error occurred'; //TODO: should throw, but check for dependencies!
        }
    }
}
