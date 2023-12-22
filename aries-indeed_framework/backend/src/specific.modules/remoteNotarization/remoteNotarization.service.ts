import {HttpException, HttpService, Injectable} from '@nestjs/common';
import {SchedulerRegistry} from '@nestjs/schedule';
import {ConfigService} from "../../config.service";
import {MerkleTreeService} from "../../generic.modules/merkletree/merkletree.service";
import {DatabaseService} from "../../generic.modules/database/database.service";
import {MyLogger} from "src/generic.modules/logger/logger.service";
import {databases} from "../../generic.modules/database/db.enum";
import {LoggedData} from "../../generic.modules/schemas/loggedData.schema";
import {AggregationService} from "../aggregation/aggregation.service";
import {RemoteNotarizationProofDto} from "./remoteNotarizationProof.dto";
import {merkleProofForObjectDto} from "../../generic.modules/merkletree/merkleProofForObject.dto";
import {merkleProofDto} from "../../generic.modules/merkletree/merkleProof.dto";

@Injectable()
export class RemoteNotarizationService {

    public readonly ApiKey: string;

    constructor(
        private readonly config: ConfigService,
        private readonly MyLogger: MyLogger,
        private readonly merkleTreeService: MerkleTreeService,
        private readonly databaseService: DatabaseService,
        private readonly aggregationService: AggregationService,
        private readonly httpService: HttpService,
        private readonly schedulerRegistry: SchedulerRegistry
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Registers IDs in the central backend for notarization and schedules a job to retrieve the proof.
     * The involved data is deleted from LoggedDataDB, the notarization proofs are stored in RemoteNotarizationDataDB
     *
     * @param IDs the ids
     * @returns the notarization proofs or void on error
     * @throws HttpException on invalid input
     */
    async registerIDSForRemoteNotarization(IDs: string[]): Promise<Array<object> | void> | never {
        if(IDs.length == 0) return;

        const loggedData: LoggedData[] = await this.databaseService.findManyByID(IDs,databases.LoggedDataDB);

        let data = [];

        for(const ld of loggedData){
            data.push(ld['data']);
        }

        const merkleProofs = this.merkleTreeService.buildMerkleProofsFromObjectArray(data, "SHA256");

        if(merkleProofs.length == 0){
            this.MyLogger.error('Aggregation of following IDs failed: '+IDs+': ');
            throw new HttpException('Some other problem with input values', 400);
        }

        const root = merkleProofs[0].getMerkleProof().getRoot();
        this.MyLogger.debug('Merkle Proof generated:' + root);

        const headersRequest = {'api_key' : this.config.ApiKey};

        let response;
        try {
            const data = { "root": root};
            response = await this.httpService.post(this.config.centralBackendURL + "collectiveNotarize/registerForCollectiveNotarization",
                data, {headers: headersRequest}).toPromise();
        } catch (err) {
            this.MyLogger.error(JSON.stringify(err));
            this.MyLogger.error(this.config.centralBackendURL);
            return;
        }

        const remoteID = response.data;
        await this.MyLogger.debug("remoteID:"+remoteID);

        let remoteNotarizationProofs= [];
        merkleProofs.forEach((element, index) => {
            const remoteNotarizationProof = {
                '_id' : loggedData[index]['_id'],
                'localMerkleProof' : element.getMerkleProof(),
                'data': element.data,
                'remoteID': remoteID
            };
            remoteNotarizationProofs.push(remoteNotarizationProof);
        });

        try {
            // @ts-ignore
            await this.databaseService.saveMany(remoteNotarizationProofs, databases.RemoteNotarizationDataDB);

            for(let ID of IDs){
                await this.databaseService.deleteByID(ID,databases.LoggedDataDB);
            }
        }catch (e) {
            this.MyLogger.error(e);
        }

        this.scheduleCentralProofRetrieval(IDs,360000);
        return remoteNotarizationProofs;
    }

    /**
     * Retrieves the central notarization proof and updates the entry in RemoteNotarizationDataDB.
     *
     * @param IDs ID of the remote notarization proof to be completed
     * @returns the updated object or void on error
     */
    async getCentralNotarizationProof(IDs: string[]): Promise<object | void> { //TODO: string[] or string?
        if(IDs.length < 1) return;

        let remoteNotarizationProof = await this.databaseService.findByID(IDs[0], databases.RemoteNotarizationDataDB);

        this.MyLogger.debug("Centralized ID: " +IDs);
        this.MyLogger.debug(remoteNotarizationProof);

        if(remoteNotarizationProof['notarizationProof'] != null){
            this.MyLogger.debug("Already has a proof");
            return;
        }
        const headersRequest = {'api_key' : this.config.ApiKey};
        let response;
        try {
            response = await this.httpService.get(this.config.centralBackendURL + "notarize/"+remoteNotarizationProof['remoteID'],
                {headers: headersRequest}).toPromise();

        } catch (err) {
            this.MyLogger.error(JSON.stringify(err));
            this.MyLogger.error(this.config.centralBackendURL);
            return;
        }

        const centralNotarizationProof = response.data;
        this.MyLogger.debug(JSON.stringify(centralNotarizationProof));
        for(let ID of IDs) {
            remoteNotarizationProof = await this.databaseService.updateOne(ID,
                {"notarizationProof": centralNotarizationProof['notarizationProof']}, databases.RemoteNotarizationDataDB);
        }

        return remoteNotarizationProof;
    }

    /**
     * Verifies a remote Notarization proof, local and central component needed.
     *
     * @param completeBody remoteNotarization proof to be verified
     * @returns true if the poof is valid, false (or void on error) otherwise
     */
    async verifyRemoteNotarizationProof(completeBody: RemoteNotarizationProofDto): Promise<boolean| void> {

        this.MyLogger.debug("Verifying "+completeBody._id);

        if(completeBody.notarizationProof == null){
            this.MyLogger.warn("central notarization proof missing");
            return false;
        }

        //verifying local merkel proof and connection merkle proof to object
        let localMerkleProofForObject = new merkleProofForObjectDto(
                new merkleProofDto(
                    completeBody.localMerkleProof.root,
                    completeBody.localMerkleProof.lemma,completeBody.localMerkleProof.leaf
                ),
                completeBody.data);

        const localMerkleProofCorrect = this.merkleTreeService.verifyMerkleProofForObject(localMerkleProofForObject,"SHA256");

        if(!localMerkleProofCorrect) {
            this.MyLogger.warn("local merkle proof not correct");
            return false;
        }

        //verifying the connection between the localMerkleProof and the remoteNotarizationProof
        if(completeBody.notarizationProof.data["root"] != completeBody.localMerkleProof.root) {
            this.MyLogger.warn("connection between local merkle proof und central notarization proof not correct");
            return false;
        }

        const headersRequest = {'api_key' : this.config.ApiKey};

        //verifying the central notarization
        let response;
        try {
            response = await this.httpService.post(this.config.centralBackendURL + "notarize/verifyNotarizationProof",
                {"notarizationProof" : completeBody.notarizationProof, "data" : completeBody.notarizationProof.data},
                {headers: headersRequest}).toPromise();

        } catch (err) {
            this.MyLogger.error(JSON.stringify(err));
            this.MyLogger.error(this.config.centralBackendURL);
            return;
        }

        if(response.data.valid != true) {
            this.MyLogger.warn("central notarization proof not correct");
            this.MyLogger.debug(JSON.stringify(response.data));
            return false;
        }

        return true;

    }

    /**
     * schedules the retrieval of the central notarization-proof
     * @param IDs IDS of remoteNotarization Proofs with same remoteID
     * @param time in milliseconds
     */
    scheduleCentralProofRetrieval(IDs: string[], time: number): Promise<void> {
        if(IDs.length == 0) return;

        this.MyLogger.debug("Scheduled retrieval of central proofs for "+ IDs);
        const CentralProofRetrievalCallback = () => {
            this.MyLogger.debug("Retrieving central proofs "  + IDs);
            this.getCentralNotarizationProof(IDs);
        };

        const CentralProofRetrievalTimeout = setTimeout(CentralProofRetrievalCallback,time);
        this.schedulerRegistry.addTimeout('CentralProofRetrieval' + IDs[0],CentralProofRetrievalTimeout);
    }
}
