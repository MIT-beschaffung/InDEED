/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Assetlog } from 'src/legacy.modules/assetlogs/assetlog.model';
import { Merkleroot } from './proof.model';
import { HttpService } from '@nestjs/axios';
import { ClaimDto } from 'src/specific.modules/claim/claim.dto';
import { AriesClientService } from 'src/generic.modules/aries-client/aries-client.service';
import { ConfigService } from 'src/config.service';
import { MessageState } from 'src/generic.modules/base/messageState';
import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { ProofDto } from './proof.dto';
import { MessageType } from 'src/generic.modules/base/messageType';
import { ProducerLogData } from 'src/generic.modules/schemas/legacy/producer.model';

const SHA256 = require('crypto-js/sha256');
const { MerkleTree } = require('merkletreejs');

@Injectable()
export class MerkleProofService {
    constructor(
        // private httpService: HttpService,
        @Inject('MerkletreeModel')
        private readonly MerklerootModel: Model<Merkleroot>,
        @Inject('ProducerModel')
        private readonly AssetlogModel: Model<ProducerLogData>,
        private readonly ariesClientService: AriesClientService,
        private readonly config: ConfigService,
        private readonly myLogger: MyLogger,
    ) {}
    /*Checks what the get Request contains (id, timestamp etc.).
    Collects the relevant data (proof, root, plain assetlog) and verifies the proof.
    Checks if the proof is correct and sends the object (with proof, root_id, hashedAssetlog and plain assetlog) back*/
    async proofHandler(claim: ClaimDto) {
        const request = claim;

        

        if (request['assetlogId']) {
            const connID = request['connectionId'];
            let assetlog = await this.findAssetlogbyID(request['assetlogId']);
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
            this.myLogger.debug(proof);
            assetlog['proof'] = proof;

            const merkleroot = await this.findMerklerootbyID(assetlog.root_id);
            const verify = await this.verifyproof(assetlog, merkleroot);
            if (verify) {
                this.sendProof(connID, assetlog, claim);
                return assetlog;
            } else {
                throw new NotFoundException(
                    'Could not verify the claim request',
                );
            }
        }
    }
    // Checks, if the proof is correct
    async verifyproof(assetlog: ProducerLogData, merkleroot: Merkleroot) {
        const root = merkleroot['root'];
        const proof = assetlog['proof'];

        const temp: {} = {
            timestamp: assetlog['timestamp'],
            assetlog: assetlog['assetlog'],
        };
        const leaf = SHA256(JSON.stringify(temp));

        // Generates the Dummy tree
        const dummy_leaves = ['a', 'b', 'c'].map((x) => SHA256(x));
        const dummy_tree = new MerkleTree(dummy_leaves, SHA256);
        const verify: boolean = dummy_tree.verify(proof, leaf, root);
        

        if (verify) {
            this.myLogger.debug(`Successfully verified assetlog ${assetlog['_id']}`);
            return verify;
        } else {
            throw new NotFoundException('Could not verify the claim request');
        }
    }

    // Sends the the object back
    private async sendProof(
        connID: string,
        assetlog: ProducerLogData,
        claim: ClaimDto,
    ) {
        //Aktuell wird die gleiche URL mitgeschickt, die auch das Backend verwendet, um die Merkleroot zu lesen.
        const rootDB = this.config.merkletreedb;
        const Message: ProofDto = {
            connectionId: connID,
            claim: claim,
            rootDB: rootDB,
            type: MessageType.Proof,
            state: MessageState.Sending,
            assetlog: assetlog,
        };
        try {
            this.ariesClientService.sendMessage(connID, Message);
        } catch (error) {
            this.myLogger.error(
                `Error while sending ${MessageType.Proof} to Connection ${Message['connectionId']}`,
            );
            Message['state'] = MessageState.ERROR;
        }
    }

    // Gets the assetlog from the assetlog database
    private async findAssetlogbyID(id: string): Promise<ProducerLogData> {
        let assetlog: ProducerLogData;
        try {
            assetlog = await this.AssetlogModel.findById(id);
        } catch (error) {
            throw new NotFoundException('could not find LogData');
        }

        if (!assetlog) {
            throw new NotFoundException('Could not find LogData');
        }
        return assetlog;
    }
    //Gets the Merkleroot fom the database (for the moment MongoDB)
    async findMerklerootbyID(id: string): Promise<Merkleroot> {
        let merkleroot;
        try {
            merkleroot = await this.MerklerootModel.findById(id);
        } catch (error) {
            throw new NotFoundException('could not find merkleroot');
        }
        if (!merkleroot) {
            throw new NotFoundException('could not find merkleroot');
        }
        return merkleroot;
    }
}
