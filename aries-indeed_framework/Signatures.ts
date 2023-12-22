const IndeedEthClient = require('./indeedEthClient').IndeedEthClient;
const { configure, getLogger } = require ("log4js");
const config = require('./config.json');

const LOGGER = getLogger()
LOGGER.level = config.log_level
var ethClient;


export class Signatures{

        ethClient: any;
        constructor(name:string, rpc_port: any){

        this.ethClient = new IndeedEthClient(rpc_port);
        }

        async startGethClient(rpc_port){
                //this.web3 = new Web3(new Web3.providers.IpcProvider("~/.ethereum/plant/geth.ipc", net);
                LOGGER.info("EthClient:" + this.ethClient);
                if(ethClient === undefined)
                    ethClient = new IndeedEthClient(rpc_port);
                    LOGGER.info("EthClient:" + this.ethClient);

               // var ethereumAccount = await ethClient.getAccounts();

               /* var ethAccount = await this.ethClient.createAccount();
        //      LOGGER.info("This are the accounts " + ethAccount);
                return ethAccount;
                LOGGER.info(await this.ethClient.getAccounts());
            */}

            async createAccount(){
                LOGGER.info("EthClient before undefined" + this.ethClient);
                if(ethClient === undefined)
                    ethClient = new IndeedEthClient(8545);
                LOGGER.info("EthClient:" + this.ethClient);

                var ethAccount = await this.ethClient.createAccount();
                //      LOGGER.info("This are the accounts " + ethAccount);
                return ethAccount;
                LOGGER.info(await this.ethClient.getAccounts());
            }


        async createSignedJSON(JSONMessage, ethAddress) {

            var returnSignature = await this.ethClient.signMessage(ethAddress, JSONMessage);
            MyLogger.debug("This is the return signature" + returnSignature);
            var signedObject = {message: JSONMessage, signature: returnSignature};

            MyLogger.debug(signedObject);
            return signedObject;

        }

        async verifyJSON(signedJSON, ethAddress) {

            var verification = await ethClient.verifyMessage(signedJSON.message, signedJSON.signature);
            MyLogger.debug(verification);
            MyLogger.debug(ethAddress);

            var verified = new Boolean(false)

            if(verification == ethAddress) {
                verified = true;
            }

            MyLogger.debug("Signature is valid: " + verified);

            return verified;

        }
        /*
        async main() {


            var obj = { name: "Asset", kwH: 50, location: "Bayreuth"};
            var JSONMessage = JSON.stringify(obj);
            MyLogger.debug(JSONMessage);

            var ethAccount = await this.startGethClient(8545);
            var ethAddress = (ethAccount["address"]).toLowerCase();
            var ethPrivKey = ethAccount["privateKey"];

            LOGGER.info(JSON.stringify(ethAccount));


            var signedMessage = await this.createSignedJSON(JSONMessage, ethAddress);

            var verified = await this.verifyJSON(signedMessage, ethAddress);

            MyLogger.debug(verified);
        }*/



}
