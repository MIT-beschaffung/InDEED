const config = require('./config.json');
const node_config = require('./web_app/src/node_config.json');
import { getLogger } from "log4js";
import { IndeedAriesClient } from "./indeedAriesClient";
import * as express from 'express'
import * as log4js from 'log4js'
const http = require("http");
import { Server, Socket } from "socket.io";


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

class ReactBackend {
    logger;
    port: number;
    app = express();
    indeedAriesClient: IndeedAriesClient;
    server;
    io;
    name;
    nodeConf;

    constructor(name: string) {
        this.name = name;
        this.nodeConf = node_config.find((e) => e.name == name);
        this.port = this.nodeConf.socket_endpoint_port;
        this.logger = getLogger();
        this.logger.level = config.log_level;
        this.startExpressApp();
        this.startIndeedAriesClient();
    }

    startExpressApp() {
        // Start express on the defined port
        this.server = this.app.listen(this.port);
        this.logger.info(`🚀 Websocket Server running on port ${this.port}`);
        this.io = new Server(this.server);
        this.handleSocket();

    }
    stopExpressApp() {
        // Stop express application
        this.server.close()
        this.logger.info(`🛬 Server stopped.`)
    }




    handleSocket() {

        //Object wird zurück gegeben, Payload = inhalt der Message
        function answer(callback, success: boolean = true, payload: any = null) {
            callback({
                success: success,
                payload: payload
            })
        }
        this.io.on("connection", (socket: Socket) => {
            this.logger.info("Websocket: New client connected");
            this.indeedAriesClient.eeForReact.removeAllListeners();
            socket.removeAllListeners();
            socket.on("disconnect", () => {
                socket.removeAllListeners();
                this.indeedAriesClient.eeForReact.removeAllListeners();
                this.logger.info("Websocket: Client disconnected");
            });
            socket.on('message', data => {
                MyLogger.debug(data);
            });

            //Connection
            socket.on("create_invitation", async (payload, ans) => {
                const resp = await this.indeedAriesClient.create_invitation(true, false, false);
                this.logger.debug(resp);
                if (resp["invitation"] !== undefined) {
                    answer(ans, true, resp["invitation"]);
                }
                else {
                    answer(ans, false);
                }

            });
            socket.on("invitation_received", async (payload, ans) => {
                this.logger.debug("received invitation");
                try {

                    const invitation = JSON.parse(payload);
                    const resp = await this.indeedAriesClient.receive_invitation(invitation, true);

                    answer(ans, true);
                }
                catch (e) {
                    answer(ans, false);
                }
            })
            socket.on("get_connections", (payload, ans) => {
                this.logger.debug(this.indeedAriesClient.connections.length);
                answer(ans, true, this.indeedAriesClient.connections);
            });
            this.indeedAriesClient.eeForReact.on("connection", (connection) => {
                this.logger.debug("new connection");
                socket.emit("connection_process_finished", connection);
            })
            this.indeedAriesClient.eeForReact.on("new_didinfo", (did) => {
                socket.emit("didinfo", did);
            })

            //register

            socket.on("get_didinfo", (payload, ans) => {
                this.logger.debug("getDidInfo");
                this.logger.debug(this.indeedAriesClient.didInfos[this.indeedAriesClient.didInfos.length - 1]);
                answer(ans, true, this.indeedAriesClient.didInfos[this.indeedAriesClient.didInfos.length - 1]);
            });
            socket.on("get_ethinfo", (payload, ans) => {
                try {
                    const ethKey = this.indeedAriesClient.getEthPublicKey();
                    answer(ans, true, ethKey);
                }
                catch (e) {
                    answer(ans, false);
                }


            });
            socket.on("register_nym", async (payload, ans) => {
                const didInfo = JSON.parse(payload)
                try {
                    const resp = await this.indeedAriesClient.register_nym(didInfo.did, didInfo.verkey, "ENDORSER");
                    this.logger.debug(resp);
                    answer(ans, true, resp);
                } catch (e) {
                    answer(ans, false);
                };

            });
            socket.on("make_did_public", async (payload, ans) => {
                try {
                    const resp = await this.indeedAriesClient.set_public_did(payload);
                    const didInfo = resp["result"]
                    this.logger.debug(didInfo);
                    this.indeedAriesClient.didInfos[this.indeedAriesClient.didInfos.length - 1] = didInfo;
                    answer(ans, true, didInfo);
                }
                catch (e) {
                    answer(ans, false);
                }

            });
            //cred def
            socket.on("create_schema_def", async (payload, ans) => {
                try {
                    const resp_schema_creation = await this.indeedAriesClient.create_schema(PLANT_SCHEMA);
                    this.logger.info(`TUEV: Published schema ${JSON.stringify(resp_schema_creation)}`)

                    const schemaID = resp_schema_creation["schema_id"];

                    //Issue Credential Definition
                    const resp_credential_def = await this.indeedAriesClient.create_cred_def("default", schemaID)
                    const credDefID = resp_credential_def['credential_definition_id']
                    this.logger.info(`TUEV: Created Credential Definition ${JSON.stringify(resp_credential_def)}`)
                    answer(ans, true, {
                        schemaID: schemaID,
                        credDefID: credDefID
                    });
                }
                catch (e) {
                    answer(ans, false);
                }


            });

            //issue
            socket.on("make_cred_params", async (payload, ans) => {
                try {
                    const issue_attributes = this.indeedAriesClient.create_issue_attributes();
                    answer(ans, true, issue_attributes);
                }
                catch (e) {
                    answer(ans, false);
                }

            });
            socket.on("issue_credential", async (payload, ans) => {
                try {
                    this.logger.debug(payload);
                    const issue_attributes = JSON.parse(payload["cred_params"]);
                    const connectionID = payload["connection_id"];
                    const credDefID = payload["cred_def_id"];
                    const resp_credential_issue = await this.indeedAriesClient.issueCredential(connectionID, credDefID, issue_attributes);
                    answer(ans, true, issue_attributes);
                }
                catch (e) {
                    answer(ans, false);
                }

            });
            this.indeedAriesClient.eeForReact.on("credential_acked", (credential) => {
                socket.emit("new_credential", credential);
            })
            socket.on("get_credentials", async (payload, ans) => {

                const credentials = this.indeedAriesClient.credentialXchange;
                this.logger.debug(credentials);
                answer(ans, true, credentials);
            })

            //presentation

            socket.on("credential_presentation_request", async (payload, ans) => {
                try {
                    const connectionID = payload["connection_id"];
                    const credDefID = payload["cred_def_id"];

                    const resp_proof_request = await this.indeedAriesClient.sendPlantCredentialProofRequest(credDefID, connectionID, REQ_PRED, REQ_ATTR);
                    this.logger.debug(JSON.stringify(resp_proof_request));
                    answer(ans, true);
                }
                catch (e) {
                    answer(ans, false);
                }
            })
            socket.on("get_presentations", async (payload, ans) => {
                const presentations = this.indeedAriesClient.presentations;
                answer(ans, true, presentations);
            })

            this.indeedAriesClient.eeForReact.on("presentation_finished", (presentation) => {
                socket.emit("presentation_finished", presentation);
            })

            //messaging --> Message wird im Backend verarbeitet
            //messsages von ariesclient in Answerfunktion
            socket.on("get_messages", async (payload, ans) => {
                const presentations = this.indeedAriesClient.messages;
                answer(ans, true, presentations);
            });

            this.indeedAriesClient.eeForReact.on("new_chat_message", (message) => {
                this.logger.debug("New Message: " + JSON.stringify(message));
                socket.emit("new_message", message);
            });

            socket.on("send_message", async (payload, ans) => {
                try {
                    const connectionID = payload["connection_id"];
                    const message = payload["message"];
                    await this.indeedAriesClient.sendIndeedMesssage(connectionID, message);
                    answer(ans, true);
                }
                catch (e) {
                    answer(ans, false);
                }
            });

            socket.on("get_claims", async (payload, ans) => {
                const claims = this.indeedAriesClient.claims;
                answer(ans, true, claims);
            });

            this.indeedAriesClient.eeForReact.on("new_claim", (message) => {
                this.logger.debug("New Claim: " + JSON.stringify(message));
                socket.emit("new_claim", message);
            });
  
            socket.on("send_claim", async (payload, ans) => {
                try {
                    const connectionId = payload["connection_id"];
                    const assetDid = payload["asset_did"];
                    const timestamp = payload["timestamp"];
                    await this.indeedAriesClient.sendIndeedClaim(connectionId, assetDid, timestamp);
                    answer(ans, true);
                }
                catch (e) { 
                    answer(ans, false);
                }
            });

            socket.on("update_claim", async (payload, ans) => {
                try {
                    const connectionId = payload["connection_id"];
                    const assetDid = payload["asset_did"];
                    const state = payload["state"]
                    await this.indeedAriesClient.updateIndeedClaim(connectionId, assetDid, state);
                    answer(ans, true);
                }
                catch (e) {
                    answer(ans, false);
                }
            });

            this.indeedAriesClient.eeForReact.on("updated_claims", (message) => {
                this.logger.debug("Updated Claims: " + JSON.stringify(message));
                socket.emit("new_claim", message);
            });


        });
    }

    async startIndeedAriesClient() {
        //_execShellCommand("cd ~/.indy_client/wallet && rm -rf "+nodeType);
        this.indeedAriesClient = new IndeedAriesClient(this.nodeConf.name, `http://${config.agent_url}:${this.nodeConf.agent_port}`, `http://${config.base_url}`, `http://${config.ledger_url}`, this.nodeConf.webhook_port, this.nodeConf.name, config.log_level, true)
        if (this.nodeConf.name == "PLANT") {
            await this.indeedAriesClient.startGethClient(8545);
        }
        const didInfo = await this.indeedAriesClient.createNewDid();
        //let resp_public_did = await this.indeedAriesClient.set_public_did(didInfo['did']);
        this.logger.debug("Aries Client started");

    }
}



function main() {
    MyLogger.debug(process.argv.slice(2));
    let b = new ReactBackend(process.argv.slice(2)[0]);
}


main();