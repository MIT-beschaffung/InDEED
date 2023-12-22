var ethClient;
const IndeedEthClient = require('./indeedEthClient').IndeedEthClient;
const { configure, getLogger } = require ("log4js");
const config = require('./config.json');


const LOGGER = getLogger()
LOGGER.level = config.log_level

async function startGethClient(rpc_port){

        //this.web3 = new Web3(new Web3.providers.IpcProvider("~/.ethereum/plant/geth.ipc", net);
        LOGGER.info("EthClient:" + ethClient);
        if(ethClient === undefined)
            ethClient = new IndeedEthClient(rpc_port);
            LOGGER.info("EthClient:" + ethClient);

       // var ethereumAccount = await ethClient.getAccounts();

        var ethAccount = await ethClient.createAccount();
//        LOGGER.info("This are the accounts " + ethAccount);
        return ethAccount;
        this.logger.info(await this.ethClient.getAccounts());
    }


async function createSignedJSON(JSONMessage, ethAddress) {

    var returnSignature = await ethClient.signMessage(ethAddress, JSONMessage);
    MyLogger.debug("This is the return signature" + returnSignature);
    var signedObject = {message: JSONMessage, signature: returnSignature};

    MyLogger.debug(signedObject);
    return signedObject;

}

async function verifyJSON(signedJSON, ethAddress) {

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
async function main() {


    var obj = { name: "Asset", kwH: 50, location: "Bayreuth"};
    var JSONMessage = JSON.stringify(obj);
    MyLogger.debug(JSONMessage);

    var ethAccount = await startGethClient(8545);
    var ethAddress = (ethAccount["address"]).toLowerCase();
    var ethPrivKey = ethAccount["privateKey"];

    LOGGER.info(JSON.stringify(ethAccount));


    var signedMessage = await createSignedJSON(JSONMessage, ethAddress);

    var verified = await verifyJSON(signedMessage, ethAddress);

    MyLogger.debug(verified);
}
main();
