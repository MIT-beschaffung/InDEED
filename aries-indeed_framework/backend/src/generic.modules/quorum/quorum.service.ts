import { Injectable } from '@nestjs/common';

import { ConfigService } from 'src/config.service';
import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { HighlightSpanKind } from 'typescript';
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
//import Web3 from 'web3';

const stdio = require('stdio');

const Web3 = require('web3');
const TruffleContract = require('@truffle/contract');

@Injectable()
export class QuorumService {
    constructor(
        private readonly config: ConfigService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    async writeData(dataHash: String) {
        this.MyLogger.debug('Quorum node URL: ' + this.config.quorumUrl);
        const provider = new Web3.providers.HttpProvider(this.config.quorumUrl);
        const web3 = new Web3(provider);

        const artifact = require('/usr/src/app/contracts/LoggingRegistry.json');
        //MyLogger.debug("Smart Contract JSON (including ABI and address): ");
        //MyLogger.debug(JSON.stringify(artifact));
        const instance = new web3.eth.Contract(
            artifact.abi,
            artifact.networks['10'].address,
        );

        //TODO: Check that the String starts with 0x and that its length is shorter than 64 (?)
        let adminAccount = await web3.eth.getAccounts().catch((err) => {
            this.MyLogger.debug(err);
        });
        this.MyLogger.debug('Admin account: ' + adminAccount);

        let transactionReceipt = await instance.methods
            .register(dataHash)
            .send({
                from: adminAccount[0].toString(),
                gas: 300000,
            })
            .catch((err) => {
                return Promise.reject(err);
            });
        this.MyLogger.debug(
            'transactionReceipt: ' + JSON.stringify(transactionReceipt),
        );
        //MyLogger.debug(returnValue.events.Registered)

        let transactionHash = transactionReceipt.transactionHash;
        this.MyLogger.debug('Registered transaction hash: ' + transactionHash);
        return transactionHash;
    }

   async getBlockTimestamp(blockNumber: Number) {
       this.MyLogger.debug('Getting timestamp for block ' + blockNumber);
       this.MyLogger.debug("Block number in hex: 0x" + blockNumber.toString(16));
       this.MyLogger.debug("Getting " + "curl -s -X POST -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBlockByNumber\",\"params\":[\"0x" + blockNumber.toString(16) + "\", false],\"id\":1}' http://quorum_quorum-node1_1:8545 -H 'accept: */*' -H 'Content-Type: application/json' | jq .\"result\".\"timestamp\" | sed -e 's/\"//g'");
       let timestampReadable = "";
       let timestamp = 0;
       try {
           let {
               stdout,
               stderr
           } = await exec("curl -s -X POST -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBlockByNumber\",\"params\":[\"0x" + blockNumber.toString(16) + "\", false],\"id\":1}' http://quorum_quorum-node1_1:8545 -H 'accept: */*' -H 'Content-Type: application/json' | jq .\"result\".\"timestamp\" | sed -e 's/\"//g'");
           timestamp = parseInt(stdout, 16);
           timestampReadable = new Date(timestamp / 1000000).toUTCString();
           this.MyLogger.debug('stdout: ' + JSON.stringify(stdout));
           this.MyLogger.debug(`stderr: ${stderr}`);
           this.MyLogger.debug("Block date : " + timestampReadable);

           let result = {
               timestamp: timestamp / 1000000,
               timestampReadable: timestampReadable
           };
           this.MyLogger.debug("Timestamps: " + JSON.stringify(result));
           return result
       } catch (err) {
           console.log(err);
           this.MyLogger.error(err);
           this.MyLogger.error('Could not find event corresponding to the blockNumber provided');
           throw ("Could not find event corresponding to the blockNumber provided")
       }
   }

    async verifyHash(dataHash: String, transactionHash: String) {
        const provider = new Web3.providers.HttpProvider(this.config.quorumUrl);
        const web3 = new Web3(provider);

        let event = await web3.eth
            .getTransactionReceipt(transactionHash)
            .catch((err) => {
                this.MyLogger.debug(err);
                this.MyLogger.debug(
                    'Error when looking for event corresponding to the transactionHash provided',
                );
                return {
                    "blockNumber": -1
                }
            });
        
            let timestampData = await this.getBlockTimestamp(event.blockNumber);

        this.MyLogger.debug('dataHash: ' + dataHash);
        let zeroString = '';
        for (let i = 0; i < 66 - dataHash.length; i++) {
            zeroString = zeroString + '0';
        }
        this.MyLogger.debug('0x' + zeroString + dataHash.substring(2));
        this.MyLogger.log(JSON.stringify(event.logs));
        this.MyLogger.log(event.logs[0].data.substring(0, 66));

        if (
            '0x' + zeroString + dataHash.substring(2) ==
            event.logs[0].data.substring(0, 66)
        ) {
            let returnValue = {
                "blockNumber": event.blockNumber,
                "timestamp": timestampData.timestamp,
                "timestampReadable": timestampData.timestampReadable
            };
            this.MyLogger.info("Returning " + JSON.stringify(returnValue, null, 4));
            return returnValue;
        } else {
            return {
                "blockNumber": -1,
                "timestamp": 0,
                "timestampReadable": ""
            };
        }
    }
}
