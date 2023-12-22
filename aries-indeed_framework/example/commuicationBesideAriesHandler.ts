import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as log4js from 'log4js'
import { Subject } from 'rxjs';
import * as needle from 'needle'
const { EventEmitter } = require('events');
const config_example = require('./config_example.json');
import {IndeedNodeType} from '../indeedAriesClient'


export enum CommunicationType {
    NYM_REGISTER_REQUEST = "nym_register_request",
    NYM_REGISTER_RESPONSE = "nym_register_response",
    CONN_INVITATION = "connection_invitation",
    CREDENTIAL_DEFINITION_REQUEST = "credential_definition_request",
    CREDENTIAL_DEFINITION_RESPONSE = "credential_definition_response",
    ISSUE_ATTRIBUTES = "issue_attributes",

}



interface CommunicationRequest {
    topic: string,
    body: any,
    sender: IndeedNodeType
}


export class CommuicationBesideAriesHandler{
    port: number;

    server:any;

    app: any;

    logger: any;

    communicationSubject: Subject<CommunicationRequest>;

    communicationEvent;

    node;

    connectionStates;
    credentialXchangeStates;
    presentationStates;



    constructor(nodeType: IndeedNodeType, logLevel="info") {
        this.logger = log4js.getLogger();
        this.logger.level = logLevel;
        this.node =nodeType;
        this.logger.info(this.node)
        this.port = config_example[nodeType].communication_port;
        this.app = express();
        this.communicationSubject = new Subject<CommunicationRequest>();
        this.communicationEvent = new EventEmitter();
        this.initializeExpressApp();
    }
    /**
     * Starts aries handler so it can receive webhooks.
     */
    startExpressApp() {
        // Start express on the defined port
        this.server = this.app.listen(this.port)
        this.logger.info(`🚀 Communication Server running on port ${this.port}`)

    }

    stopExpressApp() {
        // Stop express application
        this.server.close()
        this.logger.info(`🛬Communication Server stopped.`)
    }


    private initializeExpressApp(){
        this.app.use(bodyParser.json())
        this.app.post("/communication/", (req, res) => {
            const topic = req.query.topic;
            const sender = IndeedNodeType[req.query.node];
            this.logger.info("Got new Post:" + JSON.stringify(req.query));
            if(Object.values(CommunicationType).includes(topic)){
                this.communicationEvent.emit(topic, req.body, sender);
                this.communicationSubject.next({
                    topic: topic,
                    body: req.body,
                    sender: sender
                });
                this.logger.info(topic);
                res.status(200).end() // Responding is important
            }
            else{
                this.logger.error("Unknown topic")
                res.status(504).end();
            }

          })
    }

    async _post(url: string,  body?: object) {
        this.logger.debug("URL for _post: " + url)
        this.logger.debug("Body for _post: " + JSON.stringify(body))

        // Call agent.
        return new Promise((resolve, reject) => {
            needle.post(url, body, {json: true, headers: {}}, (err, res) => {
                if (err) {
                      reject(err)
                } else {
                    if (res.statusCode == 200 || res.statusCode == 201) {
                        //MyLogger.debug(res.body)
                        resolve(res.body)
                    } else {
                        this.logger.error(res.statusCode)
                        reject(res.body)
                    }
                }
            });

        })
    }

    async sendMessage(node: IndeedNodeType, topic: CommunicationType, body: any = ""){
        const path = config_example[node].url + ":" + config_example[node].communication_port+ "/communication/?topic="+topic+"&node="+this.node;
        this.logger.info(path);
        return await this._post(path, body);
    }

    async waitTillEventEmitted(event: string){
        return new Promise((resolve, reject) =>{
            this.communicationEvent.once(event, (body, sender) => {
                this.logger.info(`Caught event: ${event}`);
                this.communicationEvent.setMaxListeners(Math.max(this.communicationEvent.getMaxListeners() - 1, 0));
                this.logger.debug(body);
                resolve({
                    "body":body,
                    "sender": sender
                });
            });
        })
    }



}