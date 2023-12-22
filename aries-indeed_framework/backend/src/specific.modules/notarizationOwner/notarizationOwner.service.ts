import {HttpException, Injectable} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";
import {ConfigService} from "../../config.service";
import {MerkleTreeService} from "../../generic.modules/merkletree/merkletree.service";
import {DatabaseService} from "../../generic.modules/database/database.service";
import {MyLogger} from "src/generic.modules/logger/logger.service";
import {databases} from "../../generic.modules/database/db.enum";
import {LoggedData} from "../../generic.modules/schemas/loggedData.schema";
import {AggregationService} from "../aggregation/aggregation.service";
import {AggregatedData} from "../../generic.modules/schemas/aggregatedData.schema";
import {notarizationOwnerProofForObjectDto} from "./notarizationOwnerProofForObject.dto";
import {merkleProofDto} from "../../generic.modules/merkletree/merkleProof.dto";
import {merkleProofForObjectDto} from "../../generic.modules/merkletree/merkleProofForObject.dto";

@Injectable()
export class NotarizationOwnerService{

    public readonly ApiKey: string;

    constructor(
        private readonly config: ConfigService,
        private readonly MyLogger: MyLogger,
        private readonly merkleTreeService: MerkleTreeService,
        private readonly databaseService: DatabaseService,
        private readonly aggregationService: AggregationService,
        private readonly httpService: HttpService,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Creates merkle proofs for data with given ids stored in the LoggedDataDB and writes them to the quorum chain.
     * The involved data is deleted from the AggregatedDataDB and moved to the NotarizedOwnerDataDB.
     * After writing on the chain the entries of NotarizedOwnerDataDB are updated.
     * If an error occurred the data is written back to the LoggedDataDB and removed from the NotarizedOwnerDataDB.
     *
     * @param IDs the ids
     * @returns the stored data to NotarizedOwnerDataDB if successful
     * @throws HttpException on invalid inputs
     */
    async notarizeIDs(IDs: string[]): Promise<Array<object> | void> | never {
        try {
            if(IDs.length == 0) return;

            const loggedData: LoggedData[] = await this.databaseService.findManyByID(IDs,databases.LoggedDataDB);

            //aggregates Objects, they are moved from loggedDataDB to aggregatedDataDB
            const aggregatedObjects :AggregatedData[] = await this.aggregationService.aggregateIDs(IDs);

            if(aggregatedObjects.length == 0){
                this.MyLogger.error('Aggregation of following IDs failed: '+IDs+': ');
                throw new HttpException('Some other problem with input values', 400);
            }

            //moves the aggregated Objects from AggregatedDataDB to dOwnerDataDB
            for(const aggregatedObject of aggregatedObjects){
                await this.databaseService.saveOne(aggregatedObject,databases.NotarizedOwnerDataDB);
                await this.databaseService.deleteByID(aggregatedObject._id,databases.AggregatedDataDB);
            }

            const root = aggregatedObjects[0].merkleProof["root"];

            this.MyLogger.info("Posting to chain");

            const headersRequest = {'api_key' : this.config.ApiKey};

            //sends request to quorumAPI to write merkle root to the chain
            let response;
            try {
                response = await this.httpService.post(this.config.quorumApiUrl + "writeData/" + root, "", {headers: headersRequest}).toPromise();
            } catch (err) {
                // @ts-ignore
                await  this.databaseService.saveMany(loggedData,databases.LoggedDataDB);
                for(const id of IDs){
                    await this.databaseService.deleteByID(id,databases.NotarizedOwnerDataDB);
                }

                this.MyLogger.error(JSON.stringify(err));
                this.MyLogger.error(this.config.quorumApiUrl);
                return;
            }

            const txHash: string = response.data;

            for(const id of IDs){
                await this.databaseService.updateOne(id, {"txHash": txHash}, databases.NotarizedOwnerDataDB);
            }

            this.MyLogger.info("Data on Chain with txHash: "+ txHash);

            return this.databaseService.findManyByID(IDs,databases.NotarizedOwnerDataDB);
        } catch (err) {
            this.MyLogger.error('This error occurred while trying to notarize these ids'+IDs+': '+err);
            throw new HttpException('Some other problem with input values', 400);
        }
    }

    /**
     * Verify a notarization proof (using auxiliary functions) by rebuilding the merkle tree and comparing the merkle roots.
     * This returns an object containing the "valid" field, indicating whether the proof is valid or not, together with
     * some extra information.
     *
     * @param notarizationOwnerProof the proof
     * @returns true if the proof is valid, false (or error string) otherwise
     */
    async verifyNotarizationOwnerProof(notarizationOwnerProof: notarizationOwnerProofForObjectDto){
        this.MyLogger.debug(notarizationOwnerProof);
        // eslint-disable-next-line @typescript-eslint/ban-types

        const merkleProof = new merkleProofDto(
            notarizationOwnerProof.merkleProof.root,
            notarizationOwnerProof.merkleProof.lemma,
            notarizationOwnerProof.merkleProof.leaf,
        );

        const merkleProofForObject: merkleProofForObjectDto = new merkleProofForObjectDto(merkleProof, notarizationOwnerProof.data);

        const merkleProofValid = this.merkleTreeService.verifyMerkleProofForObject(merkleProofForObject, "SHA256");
        if (merkleProofValid) {
            const headersRequest = {'api_key' : this.config.ApiKey};
            let result = null;
            try {
                result = await this.httpService.post(this.config.quorumApiUrl + "verifyData/" + notarizationOwnerProof.merkleProof.root + "&" + notarizationOwnerProof.txHash,
                    "", {headers: headersRequest}).toPromise();
            }catch(e){
                this.MyLogger.error("An error occurred while verifying the block:");
                this.MyLogger.error(e);
            }

            if(result == null || result.data == null ||result.data.valid != true){
                return {valid:false}
            }else {
                return {
                    valid:true,
                    blockNumber: result.data.blockNumber,
                    timestampReadable: result.data.timestampReadable,
                }
            }
        } else {
            return {valid:false}
        }
    }
}