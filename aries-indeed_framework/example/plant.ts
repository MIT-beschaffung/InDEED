const config = require('../config.json');
const config_example = require('./config_example.json');
import {getLogger} from "log4js";
import {IndeedAriesClient, IndeedNodeType} from "../indeedAriesClient";
import {CommuicationBesideAriesHandler, CommunicationType} from "./commuicationBesideAriesHandler";

const { once, on, EventEmitter } = require('events');


const LOGGER = getLogger()
LOGGER.level = config.log_level

const nodeType = IndeedNodeType.PLANT


async function test() {
    //_execShellCommand("cd ~/.indy_client/wallet && rm -rf "+nodeType);
    const communicationHandler = new CommuicationBesideAriesHandler(nodeType);
    const indeedAriesClient = new IndeedAriesClient(nodeType, `http://${config.agent_url}:8006`, `http://${config.base_url}`, `http://${config.ledger_url}`, 8101, nodeType, config.log_level)
    try{
        communicationHandler.startExpressApp();

        await indeedAriesClient.startGethClient(8545);

        const didInfo  = await indeedAriesClient.create_did();
        LOGGER.info(`PLANT: DID Info: ${JSON.stringify(didInfo)}`);

        await communicationHandler.sendMessage(IndeedNodeType.BNA, CommunicationType.NYM_REGISTER_REQUEST, {
            "didInfo": didInfo,
            "node": nodeType
        });


        let resp_nym_register  = await communicationHandler.waitTillEventEmitted(CommunicationType.NYM_REGISTER_RESPONSE);

        let resp_public_did = await indeedAriesClient.set_public_did(didInfo['did']);
        LOGGER.info(`PLANT: DID public: ${JSON.stringify(resp_public_did)}`);


        //Connection Tuev

        const invitation_tuev  = await communicationHandler.waitTillEventEmitted(CommunicationType.CONN_INVITATION);

        const resp_receive_tuev_invitation = await indeedAriesClient.receive_invitation(invitation_tuev["body"], true);
        LOGGER.info(`PLANT: Receive Invitation ${JSON.stringify(resp_receive_tuev_invitation)}`);

        const tuevConnectionID = resp_receive_tuev_invitation["connection_id"];

        await indeedAriesClient.waitTillConnectionActive(tuevConnectionID);
        LOGGER.info(`Connection Tuev Plant established`);

        //Connection established

        //Issue Request

        const issue_attributes = indeedAriesClient.create_issue_attributes();

        await communicationHandler.sendMessage(IndeedNodeType.TUEV, CommunicationType.ISSUE_ATTRIBUTES, issue_attributes);

        await indeedAriesClient.waitTillCredentialXchangeAckedWithConnectionID(tuevConnectionID);
        LOGGER.info(`Credential issued to plant`);

        //Issue fullfilled

        //Connection EVU


        const resp_invitation_creation = await indeedAriesClient.create_invitation(true, false,false);
        LOGGER.info(`PLANT: Created Invitation`);
        const invitation_evu = resp_invitation_creation["invitation"];
        const evuConnectionID = resp_invitation_creation["connection_id"];

        await communicationHandler.sendMessage(IndeedNodeType.EVU, CommunicationType.CONN_INVITATION, invitation_evu )

        await indeedAriesClient.waitTillConnectionActive(evuConnectionID);
        LOGGER.info(`Connection EVU Plant established`);

        //Connection established

        //Proof Request

        await indeedAriesClient.waitTillPresentationVerifiedWithConnectionID(evuConnectionID);
        LOGGER.info(`Credential verified`);

        //Proof finished

        //Basic Message
        await indeedAriesClient.sendIndeedMesssage(evuConnectionID, "Hey EVU Whaats uuuuup");
        LOGGER.info("Message sending successful");


    } catch (err) {

        LOGGER.error(err)

    } finally {
        indeedAriesClient.stop();
        communicationHandler.stopExpressApp();
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