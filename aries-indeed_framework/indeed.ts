const config = require('./config.json');
import { configure, getLogger } from "log4js";
import {IndeedAriesClient} from "./indeedAriesClient";

const LOGGER = getLogger()
LOGGER.level = config.log_level

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
    const tuev = new IndeedAriesClient("TUEV",`http://${config.agent_url}:8001`, `http://${config.base_url}`,`http://${config.ledger_url}`, 8100,"tuev_wallet", config.log_level)
    const plant = new IndeedAriesClient("PLANT", `http://${config.agent_url}:8006`, `http://${config.base_url}`, `http://${config.ledger_url}`, 8101, "plant_wallet", config.log_level)
    const bna = new IndeedAriesClient("BNA", `http://${config.agent_url}:8011`, `http://${config.base_url}`, `http://${config.ledger_url}`, 8102,"bna_wallet",  config.log_level)
    const evu = new IndeedAriesClient("EVU", `http://${config.agent_url}:8016`, `http://${config.base_url}`, `http://${config.ledger_url}`, 8103,"evu_wallet",  config.log_level)
    try {
        var resp;

        await plant.startGethClient(8545);


         //Init Plant: New DID with Endorser rights on ledger
        const didInfoPlant  = await plant.create_did();
        LOGGER.info(`PLANT: DID Info: ${JSON.stringify(didInfoPlant)}`);

        resp = await bna.register_nym(
            didInfoPlant['did'],
            didInfoPlant['verkey'],
            "ENDORSER"
        )
        LOGGER.info(`BNA: Nym PLANT to Endorser: ${JSON.stringify(resp)}`);

        resp = await plant.set_public_did(didInfoPlant['did']);
        LOGGER.info(`PLANT: DID public: ${JSON.stringify(resp)}`);

        //Init Tuev: New DID with Endorser rights on ledger
        const didInfoTuev  = await tuev.create_did();
        LOGGER.info(`TUEV: DID Info: ${JSON.stringify(didInfoTuev)}`);

        resp = await bna.register_nym(
            didInfoTuev['did'],
            didInfoTuev['verkey'],
            "ENDORSER"
        )
        LOGGER.info(`BNA: Nym PLANT Endorser: ${JSON.stringify(resp)}`);

        resp = await tuev.set_public_did(didInfoTuev['did']);
        LOGGER.info(`TUEV: DID public: ${JSON.stringify(resp)}`);

        //resp = await tuev.get_dids();
        //LOGGER.info(`TUEV: Get DIDs: ${JSON.stringify(resp)}`);

        //Init Evu: New DID with Endorser rights on ledger
        const didInfoEvu  = await evu.create_did();
        LOGGER.info(`EVU: DID Info: ${JSON.stringify(didInfoEvu)}`);

        resp = await bna.register_nym(
            didInfoEvu['did'],
            didInfoEvu['verkey'],
            "ENDORSER"
        )
        LOGGER.info(`BNA: Nym EVU Endorser: ${JSON.stringify(resp)}`);

        resp = await evu.set_public_did(didInfoEvu['did']);
        LOGGER.info(`EVU: DID public: ${JSON.stringify(resp)}`);


        //Tuev creates Schema
        resp = await tuev.create_schema(PLANT_SCHEMA);
        LOGGER.info(`TUEV: Published schema ${JSON.stringify(resp)}`)
        var schemaID = resp["schema_id"];

        //await new Promise(resolve => setTimeout(resolve, 5000))

        //Issue Credential Definition
        resp = await tuev.create_cred_def("default", schemaID)
        const credDefID = resp['credential_definition_id']
        LOGGER.info(`TUEV: Created Credential Definition ${JSON.stringify(resp)}`)

        //Issue Credential Process

        //Establish connection
        resp = await tuev.create_invitation(true, false,false);
        LOGGER.info(`TUEV: Created Invitation ${JSON.stringify(resp)}`);
        const invitationTuevPlant = resp["invitation"];
        const tuevPlantConnectionID = resp["connection_id"];
        resp = await plant.receive_invitation(invitationTuevPlant, true);
        LOGGER.info(`PLANT: Receive Invitation ${JSON.stringify(resp)}`);
        const plantTuevConnectionID = resp["connection_id"];
        //Wait till connection established

        await Promise.all([
            plant.waitTillConnectionActive(plantTuevConnectionID),
            tuev.waitTillConnectionActive(tuevPlantConnectionID)]);
        LOGGER.info(`Connection Tuev Plant established`);

        //Issue Credential
        let issue_attributes = plant.create_issue_attributes();
        //Kommunikation attributes über basic message? Evtl schon Methode um attributes zu verschicken
        resp = await tuev.issueCredential(tuevPlantConnectionID, credDefID, issue_attributes);
        const credentialIssueThreadID = resp["thread_id"]
        await Promise.all([
            plant.waitTillCredentialXchangeAcked(credentialIssueThreadID),
            tuev.waitTillCredentialXchangeAcked(credentialIssueThreadID)]);
         LOGGER.info(`Credential issued to plant`);

         //Establish connection Plant Bna
        /*resp = await bna.create_invitation(true, false,false);
        LOGGER.info(`BNA: Created Invitation ${JSON.stringify(resp)}`);
        const invitationBnaPlant = resp["invitation"];
        const bnaPlantConnectionID = resp["connection_id"];
        resp = await plant.receive_invitation(invitationBnaPlant, true);
        LOGGER.info(`PLANT: Receive Invitation ${JSON.stringify(resp)}`);
        const plantBnaConnectionID = resp["connection_id"];
        //Wait till connection established
        await Promise.all([
            plant.waitTillConnectionActive(plantBnaConnectionID),
            bna.waitTillConnectionActive(bnaPlantConnectionID)]);
        LOGGER.info(`Connection Bna Plant established`);*/

        //Establish connection Plant EVU
        LOGGER.info(`Starting Connection between Plant and Evu`);
        resp = await evu.create_invitation(true,true,false);
        LOGGER.info(`EVU: Created Invitation ${JSON.stringify(resp)}`);
        const invitationEvuPlant = resp["invitation"];
        const evuPlantConnectionID = resp["connection_id"];
        resp = await plant.receive_invitation(invitationEvuPlant, true);
        LOGGER.info(`PLANT: Receive Invitation ${JSON.stringify(resp)}`);
        const plantEvuConnectionID = resp["connection_id"];
        //Wait till connection established

        await Promise.all([
            plant.waitTillConnectionActive(plantEvuConnectionID),
            evu.waitTillConnectionActive(evuPlantConnectionID)]);
        LOGGER.info(`Connection Evu Plant established`);
        //Presentation request and presentation
        resp = await evu.sendPlantCredentialProofRequest(credDefID, evuPlantConnectionID, REQ_PRED, REQ_ATTR);
        LOGGER.info(JSON.stringify(resp));
        const credentialPresentationThreadID = resp["thread_id"]
         await Promise.all([
            plant.waitTillPresentationVerified(credentialPresentationThreadID),
            evu.waitTillPresentationVerified(credentialPresentationThreadID)]);
        LOGGER.info(`Credential verified`);

        //Basic Message
        await plant.sendIndeedMesssage(plantEvuConnectionID, "Hey EVU Whaats uuuuup");
        LOGGER.info("Message sending successful");


        //Basicmessage
        //web3 client --> Public key
        //Anlage sagt Tüv welches Zertifikat (Bash)
        //bekanntgabe did (Bash)
        //vierter agent (EVU)
        //eventuell presentation autoflags entfernen





        // var resp = await invitor.set_public_did(didInfo['did'])
        //LOGGER.info(`📰 Published did ${didInfo['did']} for invitor.`) */
/*

        const connID1 = handler.establish_connection("invitor", "invitee")
        const connID2 = handler.establish_connection("invitor", "invitee")

        resp = await Promise.all([connID1, connID2]).catch(err => {
            MyLogger.debug(err)
        })
        MyLogger.debug(resp)

        //LOGGER.info(` Created connection ${connID} `)

        const xChangeID = await handler.issue_credential("invitor", "invitee", credDefID, ATTR)

        const preds = []
        preds.push(REQ_PRED)

        const attrs = []
        attrs.push(REQ_ATTR)

        const verified = await handler.exchange_presentation("invitor", "invitee", credDefID, preds, attrs) */


    } catch (err) {

        LOGGER.error(err)
        
    } finally {
        /*var resp = await client.remove_wallet("invitor")
        LOGGER.info(`🗑 Wallet ${invitor.walletName}`)
        LOGGER.info(resp)
        resp = await client.remove_wallet("invitee")
        LOGGER.info(`🗑 Wallet ${invitee.walletName}`)
        LOGGER.info(resp)*/
        /*await tuev.remove_wallet("tuev_wallet");
        await plant.remove_wallet("plant_wallet");
        await bna.remove_wallet("bna_wallet")*/
        tuev.stop();
        plant.stop();

    }


    return

}

function main() {

    test().then(function() {
        LOGGER.info("Done.")
    }).catch(function(err) {
        LOGGER.error(err)
    })

}


main();