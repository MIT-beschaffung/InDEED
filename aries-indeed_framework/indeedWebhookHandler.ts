import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as log4js from 'log4js'
import { Subject } from 'rxjs';
const http = require("http");
const router = express.Router();

enum State {
    init = "init",
    invitation = "invitation",
    request = "request",
    response = "response",
    active = "active",
    proposal_send = "proposal_send",
    proposal_received = "proposal_received",
    offer_sent = "offer_sent",
    offer_received = "offer_received",
    request_sent = "request_sent",
    request_received = "request_received",
    credential_issued = "credential_issued",
    credential_received = "credential_received",
    credential_acked = "credential_acked",
    presentation_sent = "presentation_sent",
    presentation_received = "presentation_received",
    verified = "verified",
    presentation_acked = "presentation_acked",
    received = "received",
    inactive = "inactive",
    error = "error"

}

export class IndeedWebhookHandler {
    port: number;

    server: any;

    app: any;

    logger: any;

    messagingSubject = new Subject();

    connectionSubject = new Subject();

    presentionSubject = new Subject();


    issueCredentialSubject = new Subject();

    name: string;

    react: boolean;

    connectionStates;
    credentialXchangeStates;
    presentationStates;



    constructor(name: string, port: number, logLevel = "info", react: boolean = false) {
        this.react = react;
        this.port = port;
        this.app = express();
        this.logger = log4js.getLogger();
        this.logger.level = logLevel;
        this.name = name;
        this.connectionStates = [State.init, State.invitation, State.request, State.response, State.active, State.inactive, State.error];
        this.credentialXchangeStates = [State.proposal_send, State.proposal_received, State.proposal_received, State.offer_sent, State.offer_received, State.request_sent, State.request_received, State.credential_issued, State.credential_received, State.credential_acked]
        this.presentationStates = [State.request_sent, State.request_received, State.presentation_sent, State.presentation_received, State.verified, State.presentation_acked]
    }
    /**
     * Starts aries handler so it can receive webhooks.
     */
    startExpressApp() {
        // Start express on the defined port
        this.server = this.app.listen(this.port);
        this.logger.info(`🚀 Server running on port ${this.port}`);

    }

    stopExpressApp() {
        // Stop express application
        this.server.close()
        this.logger.info(`🛬 Server stopped.`)
    }


    initializeExpressApp() {
        this.app.use(bodyParser.json())
        this.app.post("/topic/:topic/", (req, res) => {
            const topic = req.params.topic
            if (topic == 'connections') {
                this.handle_connection_webhook(topic, req.body).then((res) => {
                    const state = res
                }).catch((err) => {
                    this.logger.error(err)
                })
                res.status(200).end() // Responding is important
            }
            else if (topic == 'basicmessages') {
                this.handle_basic_messaging_webhook(topic, req.body).then((res) => {
                    const state = res
                }).catch((err) => {
                    this.logger.error(err)
                })
                res.status(200).end() // Responding is important
            } else if (topic == 'issue_credential') {
                this.handle_issue_credential_webhook(topic, req.body).then((res) => {
                    const state = res
                }).catch((err) => {
                    this.logger.error(err)
                })
                res.status(200).end() // Responding is important

            } else if (topic == 'present_proof') {
                this.handle_present_proof_webhook(topic, req.body).then((res) => {
                    const state = res
                }).catch((err) => {
                    this.logger.error(err)
                })
                res.status(200).end() // Responding is important
            }
        })


    }


    async handle_connection_webhook(topic: string, body: object) {
        let state = body["state"]
        this.logger.debug(` ${this.name} Webhook: Connection: ${JSON.stringify(state)}`);
        this.logger.debug(` ${this.name} Webhook: Connection: ${JSON.stringify(body)}`);
        if (this.connectionStates.indexOf(state) === -1) {
            this.logger.error(`Wrong message type send to webhook handler`);
            return;
        }
        this.connectionSubject.next(body);
    }

    async handle_basic_messaging_webhook(topic: string, body: object) {
        const connID = body['connection_id']
        this.logger.debug(`${this.name} Webhook Message received from connection ${connID}: ${JSON.stringify(body)}`)
        this.messagingSubject.next(body);
    }

    async handle_issue_credential_webhook(topic: string, body: any) {
        const connID = body['connection_id']
        const xChangeID = body['credential_exchange_id']
        const threadID = body['thread_id']
        const state = body['state']
        if (this.credentialXchangeStates.indexOf(state) === -1) {
            this.logger.error(`Wrong message type send to webhook issue credential handler: ${state}`);
            return;
        }

        this.logger.debug(`${this.name} Webhook Issue Credential ${connID} State ${body["state"]} ThreadID ${body["thread_id"]}`)
        //this.logger.debug(`Issue Credential ${connID} \nResponse Body: ${JSON.stringify(body)}`)
        this.issueCredentialSubject.next(body);
    }

    async handle_present_proof_webhook(topic: string, body: any) {
        const connID = body['connection_id']
        const state = body['state']
        const threadID = body['thread_id']
        if (this.presentationStates.indexOf(state) === -1) {
            this.logger.error(`${this.name}: Wrong message type ${state} send to webhook handler`);
            return;
        }
        if (state == State.request_sent || state == State.request_received) {
            this.logger.debug(`${this.name} Webhook: ${state} send to webhook handler`);
            return;
        }
        this.presentionSubject.next(body);

        return

    }
}

var fnName = function () {
    var wh = new IndeedWebhookHandler("EVU", 8101, "debug", true);
    wh.startExpressApp();
    wh.initializeExpressApp();
}

if (require.main === module) {
    fnName();
}