const config = require('../config.json');
const config_example = require('./config_example.json');
import {getLogger} from "log4js";
import {IndeedAriesClient, IndeedNodeType} from "../indeedAriesClient";
import {CommuicationBesideAriesHandler, CommunicationType} from "./commuicationBesideAriesHandler";

const { once, on, EventEmitter } = require('events');


const LOGGER = getLogger()
LOGGER.level = config.log_level

const nodeType = IndeedNodeType.TUEV

const PLANT_SCHEMA = {
    schema_name: "Indeed_Data_Verification",
    schema_version: Math.round(Math.random() * 100).toString() + "." + Math.round(Math.random() * 100).toString(),
    attributes: [
        "plant_type",
        "plant_id",
        "plant_attributes",
        "power",
        "eth_key",
    ]
}


async function test() {
    //_execShellCommand("cd ~/.indy_client/wallet && rm -rf "+nodeType);
    const communicationHandler = new CommuicationBesideAriesHandler(nodeType);
    const indeedAriesClient = new IndeedAriesClient(nodeType, `http://${config.agent_url}:8001`, `http://${config.base_url}`, `http://${config.ledger_url}`, 8100, nodeType, config.log_level)
    try{
        communicationHandler.startExpressApp();

        const didInfo  = await indeedAriesClient.create_did();
        LOGGER.info(`TUEV: DID Info: ${JSON.stringify(didInfo)}`);

        await communicationHandler.sendMessage(IndeedNodeType.BNA, CommunicationType.NYM_REGISTER_REQUEST,{
            "didInfo": didInfo,
            "node": nodeType
        });

        let resp_nym_register  = await communicationHandler.waitTillEventEmitted(CommunicationType.NYM_REGISTER_RESPONSE);

        let resp_public_did = await indeedAriesClient.set_public_did(didInfo['did']);
        LOGGER.info(`TUEV: DID public: ${JSON.stringify(resp_public_did)}`);

        //Publish Schema

        const resp_schema_creation = await indeedAriesClient.create_schema(PLANT_SCHEMA);
        LOGGER.info(`TUEV: Published schema ${JSON.stringify(resp_schema_creation)}`)

        const schemaID = resp_schema_creation["schema_id"];

        //Issue Credential Definition

        const resp_credential_def = await indeedAriesClient.create_cred_def("default", schemaID)
        const credDefID = resp_credential_def['credential_definition_id']
        LOGGER.info(`TUEV: Created Credential Definition ${JSON.stringify(resp_credential_def)}`)

        //Credential Definition successfull

        //Connection Tuev Plant
        const resp_invitation_creation = await indeedAriesClient.create_invitation(true, false,false);
        LOGGER.info(`TUEV: Created Invitation ${JSON.stringify(resp_invitation_creation)}`);

        const invitation_plant = resp_invitation_creation["invitation"];
        const plantConnectionID = resp_invitation_creation["connection_id"];

        await communicationHandler.sendMessage(IndeedNodeType.PLANT, CommunicationType.CONN_INVITATION, invitation_plant )

        await indeedAriesClient.waitTillConnectionActive(plantConnectionID)
        LOGGER.info(`Connection Tuev Plant established`);

        //Connection established

        //Issue Credential
        const issue_attributes = await communicationHandler.waitTillEventEmitted(CommunicationType.ISSUE_ATTRIBUTES);
        const resp_credential_issue = await indeedAriesClient.issueCredential(plantConnectionID, credDefID, issue_attributes["body"]);
        const credentialIssueThreadID = resp_credential_issue["thread_id"]

        await indeedAriesClient.waitTillCredentialXchangeAcked(credentialIssueThreadID);
        LOGGER.info(`Credential issued to plant`);

        //Issue successfull

        const node_type_credential_request = await communicationHandler.waitTillEventEmitted(CommunicationType.CREDENTIAL_DEFINITION_REQUEST);
        LOGGER.info(node_type_credential_request)
        await communicationHandler.sendMessage(IndeedNodeType[node_type_credential_request["sender"]], CommunicationType.CREDENTIAL_DEFINITION_RESPONSE, {
            "credential_definition_id": credDefID
        });



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