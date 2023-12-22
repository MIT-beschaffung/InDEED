const config = require('../config.json');
const config_example = require('./config_example.json');
import {getLogger} from "log4js";
import {IndeedAriesClient, IndeedNodeType} from "../indeedAriesClient";
import {CommuicationBesideAriesHandler, CommunicationType} from "./commuicationBesideAriesHandler";

const { once, on, EventEmitter } = require('events');


const LOGGER = getLogger()
LOGGER.level = config.log_level

const nodeType = IndeedNodeType.EVU

const REQ_PRED = [{
    name: "power",
    value: 0,
    type: ">="
}]

const REQ_ATTR = [
    "plant_type",
    "plant_id",
    "eth_key"
]


async function test() {
    //_execShellCommand("cd ~/.indy_client/wallet && rm -rf "+nodeType);
    const communicationHandler = new CommuicationBesideAriesHandler(nodeType);
    const indeedAriesClient = new IndeedAriesClient(nodeType, `http://${config.agent_url}:8016`, `http://${config.base_url}`, `http://${config.ledger_url}`, 8103, nodeType, config.log_level)
    try{
        communicationHandler.startExpressApp();

        //await indeedAriesClient.startGethClient(8545);

        const didInfo  = await indeedAriesClient.create_did();
        LOGGER.info(`EVU: DID Info: ${JSON.stringify(didInfo)}`);

        await communicationHandler.sendMessage(IndeedNodeType.BNA, CommunicationType.NYM_REGISTER_REQUEST, {
            "didInfo": didInfo,
            "node": nodeType
        });

        let resp_nym_register  = await communicationHandler.waitTillEventEmitted(CommunicationType.NYM_REGISTER_RESPONSE);

        let resp_public_did = await indeedAriesClient.set_public_did(didInfo['did']);
        LOGGER.info(`EVU: DID public: ${JSON.stringify(resp_public_did)}`);



        //Connection Plant

        const invitation_plant  = await communicationHandler.waitTillEventEmitted(CommunicationType.CONN_INVITATION);

        const resp_receive_evu_invitation = await indeedAriesClient.receive_invitation(invitation_plant["body"], true);
        LOGGER.info(`EVU: Receive Invitation ${JSON.stringify(resp_receive_evu_invitation)}`);

        const plantConnectionID = resp_receive_evu_invitation["connection_id"];

        await indeedAriesClient.waitTillConnectionActive(plantConnectionID);
        LOGGER.info(`Connection EVU Plant established`);

        //Connection established

        //Get CredID

        await communicationHandler.sendMessage(IndeedNodeType.TUEV, CommunicationType.CREDENTIAL_DEFINITION_REQUEST);
        const resp_tuevCredentialDefID = await communicationHandler.waitTillEventEmitted(CommunicationType.CREDENTIAL_DEFINITION_RESPONSE);
        const tuevCredentialDefID = resp_tuevCredentialDefID["body"]["credential_definition_id"];
        //Presentation request and presentation

        let resp_proof_request = await indeedAriesClient.sendPlantCredentialProofRequest(tuevCredentialDefID, plantConnectionID, REQ_PRED, REQ_ATTR);
        LOGGER.info(JSON.stringify(resp_proof_request));

        const credentialPresentationThreadID = resp_proof_request
        await indeedAriesClient.waitTillPresentationVerified(credentialPresentationThreadID);
        LOGGER.info(`Credential verified`);

        //Proof successfull, now Basic Messsaging

    } catch (err) {

        LOGGER.error(err)

    } finally {
        indeedAriesClient.stop();
        communicationHandler.stopExpressApp()
    }

    return
}

function _execShellCommand(cmd) {
 const exec = require('child_process').exec;
 return new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
   if (error) {
    console.warn(error);
   }
   resolve(stdout? stdout : stderr);
  });
 });
}

function main() {

    test().then(function() {
        LOGGER.info("Done.")
    }).catch(function(err) {
        LOGGER.error(err)
    })

}


main();