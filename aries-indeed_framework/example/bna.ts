const config = require('../config.json');
const config_example = require('./config_example.json');
import {getLogger} from "log4js";
import {IndeedAriesClient, IndeedNodeType} from "../indeedAriesClient";
import {CommuicationBesideAriesHandler, CommunicationType} from "./commuicationBesideAriesHandler";
const { once, on, EventEmitter } = require('events');


const LOGGER = getLogger()
LOGGER.level = config.log_level

const nodeType = IndeedNodeType.BNA


async function test() {
    //_execShellCommand("cd ~/.indy_client/wallet && rm -rf "+nodeType);
    const communicationHandler = new CommuicationBesideAriesHandler(nodeType);
    const indeedAriesClient = new IndeedAriesClient(nodeType, `http://${config.agent_url}:8011`, `http://${config.base_url}`, `http://${config.ledger_url}`, 8102, nodeType, config.log_level)
    try{
        communicationHandler.startExpressApp();

        await new Promise((resolve, reject) => {
            let count_nodes = 0;
            communicationHandler.communicationEvent.on(CommunicationType.NYM_REGISTER_REQUEST, async (json, sender) => {
                const resp_register = await indeedAriesClient.register_nym(
                    json["didInfo"]['did'],
                    json["didInfo"]['verkey'],
                    "ENDORSER"
                );
                LOGGER.info(`BNA: Nym Endorser: ${JSON.stringify(resp_register)}`);
                await communicationHandler.sendMessage(json["node"], CommunicationType.NYM_REGISTER_RESPONSE);
                count_nodes++;
                if(count_nodes >= 3){
                    resolve();
                }
            });
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