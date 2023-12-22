import { HttpException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/generic.modules/database/database.service';
import { databases } from 'src/generic.modules/database/db.enum';
import { merkleLemmaElementDto } from 'src/generic.modules/merkletree/merkleLemmaElement.dto';
import { merkleProofDto } from 'src/generic.modules/merkletree/merkleProof.dto';
import { merkleProofForObjectDto } from 'src/generic.modules/merkletree/merkleProofForObject.dto';
import { MerkleTreeService } from 'src/generic.modules/merkletree/merkletree.service';
import { QuorumService } from 'src/generic.modules/quorum/quorum.service';
import { LoggedData } from 'src/generic.modules/schemas/loggedData.schema';
import { ConfigService } from "src/config.service";
import { MyLogger } from "src/generic.modules/logger/logger.service";
import { notarizationProofDto } from './notarizationProof.dto';
import { notarizationProofForObjectDto } from './notarizationProofForObject.dto';

@Injectable()
export class NotarizationService {

    constructor(
        private readonly config: ConfigService,
        private readonly MyLogger: MyLogger,
        private readonly quorumService: QuorumService,
        private readonly merkleTreeService: MerkleTreeService,
        private readonly databaseService: DatabaseService,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Creates notarization proofs for given objects and writes them to the quorum chain.
     * This proofs consists out if a merkleProofDto and the merkle root written to the chain.
     *
     * @param data the objects
     * @returns array of notarization proofs (or error string)
     * @throws string on inconsistent merkle proofs
     */
    async notarizeObjects(data: Object[]): Promise<Array<notarizationProofForObjectDto> | string | never > {
        try {

            const merkleProofs = this.merkleTreeService.buildMerkleProofsFromObjectArray(data, "SHA256");
            const notarizationProofsForObjects: notarizationProofForObjectDto[] = [];

            // check that all roots are the same (plausibility check)
            const root = merkleProofs[0].getMerkleProof().getRoot();

            merkleProofs.forEach((element) => {
                if (element.getMerkleProof().getRoot() != root) {
                    throw 'Inconsistent Merkle proofs!!!';
                }
            });
            this.MyLogger.debug('The Merkle proofs are consistent');

            const txHash = await this.quorumService.writeData('0x' + root);
            this.MyLogger.debug('Wrote hash to transaction with txHash ' + txHash);

            merkleProofs.forEach((element) => {
                this.MyLogger.debug(JSON.stringify(element));
                this.MyLogger.debug(JSON.stringify(element.getMerkleProof()));
                this.MyLogger.debug(JSON.stringify(element.data));
                const notarizationProof: notarizationProofDto = new notarizationProofDto(element.getMerkleProof(), txHash);
                const notarizationProofForObject = new notarizationProofForObjectDto(notarizationProof, element['data']);
                notarizationProofsForObjects.push(notarizationProofForObject);
            });
            this.MyLogger.log('Return these Notarization Proofs: \n' + JSON.stringify(notarizationProofsForObjects) )
            return notarizationProofsForObjects;
        } catch (err) {
            this.MyLogger.debug(err);
            return 'Error occurred';
        }
    }

    /**
     * Creates notarization proofs for data with given ids stored in LoggedDataDB using notarizeObjects().
     * After this the data is deleted from LoggedDataDB and the proofs are stored in NotarizedDataDB.
     *
     * @param IDs the ids
     * @returns array of the stored proofs
     * @throws HttpException on invalid input
     */
    async notarizeIDs(IDs: string[]): Promise<object> | never {
        try {
            const res = []

            const logDataArray = await this.databaseService.findManyByID(IDs, databases.LoggedDataDB)
            let DataArray = []

            for (let i = 0; i < logDataArray.length; i++){
                DataArray.push(logDataArray[i]['data'])
            }

            this.MyLogger.debug('DataArray with length ' + DataArray.length + ': ' + DataArray + ', ' + JSON.stringify(DataArray));
            const proofs = await this.notarizeObjects(DataArray);
            this.MyLogger.debug(JSON.stringify(proofs));

            for (let i = 0; i < logDataArray.length; i++) {
                const newObject: LoggedData = logDataArray[i];

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                newObject['notarizationProof'] = {
                    merkleProof: proofs[i]['notarizationProof']['merkleProof'],
                    txHash: proofs[i]['notarizationProof']['txHash'],
                    data: proofs[i]['data']
                }
                const temp = await this.databaseService.saveOne(newObject, databases.NotarizedDataDB);
                res.push(temp.toObject());
                await this.databaseService.deleteByID(newObject['_id'], databases.LoggedDataDB);
            }

            return res;
        } catch (err) {
            this.MyLogger.error('This error occurred while trying to notarize these ids' + IDs + ': ' + err);
            throw new HttpException('Some other problem with input values', 400);
        }
    }

    /**
     * Verify a notarization proof (using auxiliary functions) by rebuilding the merkle tree and comparing the merkle roots.
     * This returns an object containing the "valid" field, indicating whether the proof is valid or not, together with
     * some extra information.
     *
     * @param Input the proof
     * @returns true if the proof is valid, false (or error string) otherwise
     */
    async verifyNotarizationProof(Input: notarizationProofForObjectDto): Promise<object | string> {
        this.MyLogger.debug(Input);
        // eslint-disable-next-line @typescript-eslint/ban-types
        const data: object = Input.data;
        const lemma: merkleLemmaElementDto[] = Input.notarizationProof.merkleProof.lemma;
        const root: string = Input.notarizationProof.merkleProof.root;
        const leaf: string = Input.notarizationProof.merkleProof.leaf;
        const txHash: string = Input.notarizationProof.txHash;
        const merkleProof: merkleProofDto = new merkleProofDto(root, lemma, leaf);
        const notarizationProof: notarizationProofDto = new notarizationProofDto(merkleProof, txHash);
        const notarizationProofForObject: notarizationProofForObjectDto = new notarizationProofForObjectDto(notarizationProof, data);
        this.MyLogger.debug(JSON.stringify(notarizationProofForObject));

        const merkleProofForObject: merkleProofForObjectDto = new merkleProofForObjectDto(merkleProof, data);
        
        const merkleProofValid: boolean = this.merkleTreeService.verifyMerkleProofForObject(merkleProofForObject, "SHA256");
        if (merkleProofValid) {
            const result = await this.quorumService.verifyHash('0x' + notarizationProof.getMerkleProof().getRoot(), txHash);
            if (parseInt(result.blockNumber) >= 0) {
                return {
                    valid: true,
                    blockNumber: result.blockNumber,
                    timestampReadable: result.timestampReadable
                };
            } else {
                return {valid: false};
            }
        } else {
            return 'Merkle proof invalid';
        }
    }
}

