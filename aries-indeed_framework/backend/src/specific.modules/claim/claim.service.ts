import { Injectable } from '@nestjs/common';
import { AriesClientService } from 'src/generic.modules/aries-client/aries-client.service';
import { BaseService } from 'src/generic.modules/base/base.service';
import { BaseStore } from 'src/generic.modules/base/base.store';
import { MessageState } from 'src/generic.modules/base/messageState';
import { MessageType } from 'src/generic.modules/base/messageType';
import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { ProofDto } from 'src/legacy.modules/proof/proof.dto';
import { MerkleProofService } from 'src/legacy.modules/proof/proof.service';
import { WebsocketGateway } from 'src/websocket.gateway';
import { ClaimDto } from './claim.dto';
import { ClaimStore } from './claim.store';

@Injectable()
export class ClaimService extends BaseService {
    private readonly claimStore: ClaimStore[] = [];

    constructor(
        private readonly ariesClient: AriesClientService,
        private readonly websocketGateway: WebsocketGateway,
        private readonly merkleProofService: MerkleProofService,
        private readonly MyLogger: MyLogger,
    ) {
        
        super(MyLogger);
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    findAll(): ClaimStore[] {
        this.MyLogger.debug(this.claimStore);
        this.websocketGateway.server.emit('test', 'message');
        return this.claimStore;
    }

    create(claim: ClaimDto) {
        //this.ariesClientService.sendMessage(claim);
        this.MyLogger.debug(claim.type);
        claim.state = MessageState.RequestData;
        this.addToStore(this.claimStore, claim);
        try {
            //Send the message to the agent with the agent module
            this.ariesClient.sendMessage(claim['connectionId'], claim);
            this.MyLogger.log(claim);
        } catch (error) {
            this.MyLogger.error(
                `Error while sending message to Connection ${claim['connectionId']}`,
            );
            claim['state'] = MessageState.ERROR;
        }
        //MyLogger.debug(this.claimStore);
        //this.websocketGateway.server.emit('newClaim', claim);
        return claim;
    }

    update(claim: ClaimDto) {
        const updateCondition = (c: ClaimDto) =>
            c.assetlogId === claim.assetlogId;
        this.updateInStore(this.claimStore, claim, updateCondition);
    }

    delete(claim: ClaimDto) {
        const deleteCondition = (c: ClaimDto) =>
            c.assetlogId === claim.assetlogId;
        this.deleteFromStore(this.claimStore, claim, deleteCondition);
    }

    newClaimReceived(claim: ClaimDto) {
        this.addToStore(this.claimStore, claim);
        const job = this.merkleProofService.proofHandler(claim);
        this.MyLogger.log(job);
    }

    async newProofReceived(merkleProof: ProofDto) {
        const claim = merkleProof['claim'];
        let assetlog = merkleProof['assetlog'];
        let proof: Object[] = [];

        //Handle incoming proof object. In MongoDB no Buffer can be safed, so the object is split and new Buffers are created.
        const input_proof = Object.values(assetlog['proof']);
        for (let i = 0; i < input_proof.length; i++) {
            const input_split = input_proof[i];

            const temp_position = input_split['position'];
            const temp_data = Buffer.from(input_split['data']['data']);
            const temp_node: {} = {
                position: temp_position,
                data: temp_data,
            };
            proof.push(temp_node);
        }
        this.MyLogger.debug(proof);
        assetlog['proof'] = proof;

        const connID = proof['connectionId'];
        const rootDB = proof['rootDB'];
        const merkleroot = await this.merkleProofService.findMerklerootbyID(
            assetlog['root_id'],
        );

        const verify = this.merkleProofService.verifyproof(
            assetlog,
            merkleroot,
        );
        this.MyLogger.log(verify);

        return verify;
    }
}
