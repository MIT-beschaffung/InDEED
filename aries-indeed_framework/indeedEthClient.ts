var Web3 = require('web3');
var net = require('net');
const util = require('ethjs-util');
import * as log4js from 'log4js'



/**
 * module description
 * @module IndeedEthClient
 */
export class IndeedEthClient {

    web3: any;
    logger;

    /**
     * Always launch after instantiating
     */
    constructor (rpc_port: number, logLevel = "info") {
        this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:'+rpc_port));
        this.logger = log4js.getLogger();
        this.logger.level = logLevel;
        this.logger.info("Started Eth Client");
    }

    /**
     * Always launch after completion
     */
    async close(){}


    async getAccounts()  {
       return await this.web3.eth.getAccounts();
    };

    async createAccount(){
        this.logger.info("In createAccount");
        var account= await this.web3.eth.personal.newAccount("passwort");


        return {address: account,
            privateKey: null
        }
    };

    async signMessage(account, message){
       /*var localAccount = await this.web3.eth.getAccounts();
       this.logger.info("Local account: " + JSON.stringify(localAccount));*/
        var sig = await this.web3.eth.personal.sign(message, account, "passwort");
        this.logger.info("This is the signature2: " + sig);

        return sig;
    };

    async verifyMessage(message, signature){

    const signer = await this.web3.eth.personal.ecRecover(message, signature);
    this.logger.info("This is the signer's address: " + signer);
    return signer;

    };

}
