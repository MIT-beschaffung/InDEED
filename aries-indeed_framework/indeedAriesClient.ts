import { AriesClient } from './ariesClient';
import { IndeedWebhookHandler } from './indeedWebhookHandler';
import { IndeedEthClient } from './indeedEthClient';
const { once, EventEmitter } = require('events');

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
    error = "error",
};

export enum IndeedNodeType {
    TUEV = "TUEV",
    BNA = "BNA",
    PLANT = "PLANT",
    EVU = "EVU",
}

enum MessageType {
    Chat = "chat",
    Claim = "claim",
}

enum ClaimState {
    Sent = "sent",
    Received = "received",
    RequestData = "request_data",
}

interface IndeedNode {
    NodeType: IndeedNodeType,
    dic: string,
    connectionID: string,
    issueThreadID: string,
    proofThreadID: string
}

class Proof {
    comment: string;
    connection_id: string;
    trace: boolean;
    proof_request: {
        name: string,
        requested_attributes: object,
        requested_predicates: object,
        version: string,
        nonce: string
    }


    constructor(credDefID: string, predicates: any[], attributes: any[], connID: string) {
        this.comment = "string"
        this.connection_id = connID
        this.trace = false
        var requested_attributes = {}
        var requested_predictes = {}
        var i = 0
        predicates.forEach(element => {
            var reqPred = {
                name: element['name'],
                p_value: element['value'],
                p_type: element['type'],
                restrictions: [
                    { cred_def_id: credDefID }
                ]
            }
            requested_predictes[String(i)] = reqPred
            i = i + 1
        });
        var i = 0
        attributes.forEach(element => {
            var reqAttr = {
                name: element
            }
            requested_attributes[String(i)] = reqAttr
            i = i + 1
        });
        this.proof_request = {
            name: "Indeed Plant Credential Proof Request",
            requested_attributes: requested_attributes,
            requested_predicates: requested_predictes,
            version: "1.0",
            nonce: "123456789"
        }
    }
}

export class IndeedAriesClient extends AriesClient {

    didInfos = [];

    name: string;

    webhookHandler: any;

    ethClient: any;

    messageSubscription: any;

    connectionSubscription: any;

    presentationSubscription: any;

    issueCredentialSubscription: any;

    connections: object[] = [];

    ee: any;

    eeForReact: any;

    credentialXchange: object[] = [];

    presentations: object[] = [];

    messages: object[] = [];

    claims: object[] = [];

    my_node_type: IndeedNodeType;

    ethAccount: object;

    id = "XX:XX:XX:XX:XX:XX".replace(/X/g, function () {
        return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16))
    });


    constructor(name: string, agentURL: string, baseURL: string, ledgerURL: string, webhook_port: number, walletName: string, logLevel: string = 'info', react: boolean = false) {
        super(agentURL, baseURL, ledgerURL, walletName, logLevel);
        this.webhookHandler = new IndeedWebhookHandler(name, webhook_port, logLevel, react);
        this.webhookHandler.initializeExpressApp();
        this.webhookHandler.startExpressApp();
        this.startWebhookSubscription();
        this.name = name;
        this.my_node_type = IndeedNodeType[name];
        this.ee = new EventEmitter();
        this.eeForReact = new EventEmitter();
    }

    startWebhookSubscription() {
        this.messageSubscription = this.webhookHandler.messagingSubject.subscribe(data => {
            this.handleBasicMessage(data);
        })
        this.connectionSubscription = this.webhookHandler.connectionSubject.subscribe(data => {
            this.handleConnection(data);
        })
        this.issueCredentialSubscription = this.webhookHandler.issueCredentialSubject.subscribe(data => {
            this.handleCredentialXChange(data);
        })
        this.presentationSubscription = this.webhookHandler.presentionSubject.subscribe(data => {
            this.handlePresentation(data);
        })
    }
    stop() {
        this.messageSubscription.unsubscribe();
        this.connectionSubscription.unsubscribe();
        this.issueCredentialSubscription.unsubscribe();
        this.webhookHandler.stopExpressApp();
        if (this.ethClient != undefined) {
            this.ethClient.close();
        }

    }

    async startGethClient(rpc_port: number) {
        //this.web3 = new Web3(new Web3.providers.IpcProvider("~/.ethereum/plant/geth.ipc", net);
        if (this.ethClient === undefined)
            this.ethClient = new IndeedEthClient(rpc_port);
        this.ethAccount = await this.ethClient.createAccount();
        this.logger.info(this.ethAccount);
        //this.logger.info(await this.ethClient.getAccounts());
    }

    getEthPublicKey() {
        if (this.ethClient && this.ethAccount) {
            return this.ethAccount["address"];
        }
    }
    async createNewDid() {
        const didInfo = await this.create_did();
        this.didInfos.push(didInfo);
        this.eeForReact.emit("new_didinfo", didInfo);
        return didInfo;
    }

    create_issue_attributes() {
        let issue_attr = [
            {
                "name": "plant_type",
                "value": "SmartMeter"
            }, {
                "name": "plant_id",
                "value": this.id
            }, {
                "name": "plant_attributes",
                "value": "[]"
            },
            {
                "name": "power",
                "value": "150"
            },
            {
                "name": "eth_key",
                "value": this.getEthPublicKey()
            }]
        this.logger.info(`${this.name} Client: Created Attributes for Issue with Eth Key: ${this.getEthPublicKey()}`)
        return issue_attr
    }

    handleConnection(data) {
        let state = data["state"];
        this.logger.debug(`Connection state ${state}`);
        let index = this.connections.findIndex(c => { return c["connection_id"] === data["connection_id"] });
        if (state === State.invitation || state === State.init) {
            this.logger.debug(`${this.name} Test2`);
            if (index === -1) {
                this.connections.push(data);
                this.logger.debug(`Added Connection`);
            }
            else {
                this.connections[index] = data;
                this.logger.info(`Invitation already exists`);
            }

        }
        else if (state === State.request || state === State.response || state === State.active || state === State.inactive || state === State.error) {
            this.logger.debug(`${this.name} Test`);
            if (index === -1) {
                this.logger.info(`${this.name} Client: There is no invitation for this connection`);
                return;
            }
            else {
                this.connections[index] = data;
                this.eeForReact.emit("connection", data);
                if (state === State.error) {
                    this.logger.error(`${this.name} Client: Connection Error`);
                }
                if (state === State.inactive) {
                    this.logger.info(`${this.name} Client: Connection Inactive`);
                }
                if (state === State.active) {
                    this.logger.info(`${this.name} Client: Connection Active`);
                    this.ee.emit(data["connection_id"]);
                }

            }
        }
    }

    handleCredentialXChange(data) {
        let state = data["state"];
        let index = this.credentialXchange.findIndex(c => { return c["credential_exchange_id"] === data["credential_exchange_id"] });
        if (state === State.offer_sent || state === State.offer_received || state === State.proposal_send || state === State.proposal_received) {
            if (index === -1) {
                let indexConnection = this.connections.findIndex(c => { return c["connection_id"] === data["connection_id"] });
                if (indexConnection === -1 || this.connections[indexConnection]["state"] !== State.active) {
                    this.logger.error(`${this.name} Client: Couldnt find a valid Connection for data exchange.`);
                    return;
                }
                this.credentialXchange.push(data);
                this.ee.emit("new_credential");
                this.logger.debug(`Added CredentialExchange`);
            }
            else {
                this.credentialXchange[index] = data;
            }

        }
        else {
            if (index === -1) {
                this.logger.info(`${this.name} Client: There is no Offer/Proposal for this CredentialExchange`);
                return;
            }
            else {
                this.credentialXchange[index] = data;
                if (state === State.credential_acked) {
                    this.logger.info(`${this.name} Client: CredentialExchange acked`);
                    this.eeForReact.emit("credential_acked", data);
                    this.ee.emit(data["thread_id"]);
                }

            }
        }
    }
    handlePresentation(data) {
        let state = data["state"];
        let threadID = data["thread_id"]
        let index = this.presentations.findIndex(p => { return p["thread_id"] === threadID });
        if (state === State.presentation_sent || state === State.presentation_received) {
            if (index === -1) {
                let indexConnection = this.connections.findIndex(c => { return c["connection_id"] === data["connection_id"] });
                if (indexConnection === -1 || this.connections[indexConnection]["state"] !== State.active) {
                    this.logger.error(`${this.name} Client: Couldnt find a valid Connection for data presentation.`);
                    return;
                }
                this.presentations.push(data);
                this.ee.emit("new_presentation");
                this.logger.debug(`Added Presentation`);
            }
            else {
                this.presentations[index] = data;
            }

        }
        else {
            if (index === -1) {
                this.logger.info(`${this.name} Client: No Presentation found for this further step`);
                return;
            }
            else {
                this.presentations[index] = data;
                if (state === State.verified || State.presentation_acked) {
                    this.eeForReact.emit("presentation_finished", data);
                    this.logger.info(`${this.name} Client: CredentialExchange acked`);
                    this.ee.emit(data["thread_id"]);
                }

            }
        }
    }

    async sendIndeedMesssage(connectionId: string, message: string) {
        const type = MessageType.Chat;
        const messageFull = JSON.stringify({ message, type });
        await this.send_basicmessage(connectionId, messageFull);
        this.logger.debug(this.name + " Client: Message sent: " + messageFull);
        await this.waitTillMessageSuccess(connectionId);
        this.addToChatMessages(connectionId, message, "send");
    }

    async sendIndeedClaim(connectionId: string, assetDid: string, timestamp: string) {
        const type = MessageType.Claim;
        const state = ClaimState.Received;
        const message = { assetDid, timestamp, state };
        const messageFull = JSON.stringify({ message, type })
        await this.send_basicmessage(connectionId, messageFull);
        this.logger.debug(this.name + " Client: Claim sent: " + messageFull);
        this.addToClaims(connectionId, message, ClaimState.Sent);
    }

    async updateIndeedClaim(connectionId: string, assetDid: string, state: string) {
        const type = MessageType.Claim;
        const message = { assetDid, state };
        const messageFull = JSON.stringify({ message, type });
        await this.send_basicmessage(connectionId, messageFull);
        this.updateClaim(connectionId, assetDid, state);
    }

    async waitTillMessageSuccess(connectionID) {
        return new Promise<void>(resolve => {
            this.ee.once("message_success_" + connectionID, () => {
                this.ee.setMaxListeners(Math.max(this.ee.getMaxListeners() - 1, 0));
                resolve();
            });
        })
    }

    handleBasicMessage(data) {
        this.logger.debug(data);
        const rec_message = "-Agent received your message";
        let content = data["content"];
        let connectionID = data["connection_id"];
        this.logger.debug("Handle Basic Message")
        let index_valid_con = this.connections.findIndex(c => c["connection_id"] === connectionID);
        if (index_valid_con === -1 || this.connections[index_valid_con]["state"] !== State.active) {
            this.logger.error(`${this.name} Client: Couldnt find a valid Connection for messaging.`);
            return;
        }
        if (data["content"].includes(rec_message)) {
            this.logger.debug("Success Message");
            this.ee.emit("message_success_" + connectionID);
            return;
        }

        const contentObject = JSON.parse(content);
        if (contentObject.type === MessageType.Chat) {
            this.addToChatMessages(connectionID, contentObject.message, "received");
        } else {
            this.handleClaim(connectionID, contentObject.message);
            // this.addToClaims(connectionID, contentObject.message, "received");
        }
    }

    handleClaim(connectionId, claim) {
        MyLogger.debug("---CLAIM CONTENT ---");
        MyLogger.debug(claim);
        const state = claim.state;
        MyLogger.debug("Claim STATE");
        MyLogger.debug(state);
        switch (state) {
            case ClaimState.Received:
                this.addToClaims(connectionId, claim, state);
                break;
            case ClaimState.RequestData:
                this.updateClaim(connectionId, claim.assetDid, state); 
                break;
        }
    }

    addToChatMessages(connectionID, message, state) {
        this.logger.debug("add to message")
        let index_con = this.messages.findIndex(p => p["connection_id"] === connectionID);
        if (index_con === -1) {
            const data = {
                "connection_id": connectionID,
                "messages": [{
                    "content": message,
                    "state": state
                }],

            }
            this.messages.push(data);
            this.eeForReact.emit("new_chat_message", data)
            this.logger.debug("new message ee")
            this.ee.emit("new_message");
            this.logger.debug(`Added Message New`);
        }
        else {
            this.messages[index_con]["messages"].push({
                "content": message,
                "state": state
            });
            this.eeForReact.emit("new_chat_message", this.messages[index_con])
            this.logger.debug(`Added Message Index`);
            this.ee.emit("new_message");
        }
    }

    addToClaims(connectionId, message, state) {
        this.logger.debug("add to claims")
        const connectionIndex = this.claims.findIndex(p => p["connection_id"] === connectionId);
        if (connectionIndex === -1) {
            const data = {
                "connection_id": connectionId,
                "claims": [{
                    "content": message,
                    "state": state
                }],
            }
            this.claims.push(data);
            this.eeForReact.emit("new_claim", data)
            this.ee.emit("new_claim");
            this.logger.debug(`Added Claim New`);
        }
        else {
            this.claims[connectionIndex]["claims"].push({
                "content": message,
                "state": state
            });
            this.eeForReact.emit("new_claim", this.claims[connectionIndex])
            this.logger.debug(`Added Claim Index`);
            this.ee.emit("new_claim");
        }
    }

    updateClaim(connectionId: string, assetDid: string, state: string) {
        this.logger.debug("update claim")
        this.logger.debug(connectionId)
        this.logger.debug(assetDid)
        this.logger.debug(JSON.stringify(this.claims))
        const connectionIndex = this.claims.findIndex(c => c["connection_id"] === connectionId);
        if (connectionIndex !== -1) {
            const claimIndex = this.claims[connectionIndex]["claims"].findIndex(c => c["content"]["assetDid"] === assetDid);
            if (claimIndex !== -1) {
                this.claims[connectionIndex]["claims"][claimIndex]["state"] = state;
                // ToDo: Muss ConnectionID auch mitgeben zum Finden --> alle claims einer Connection mitgeben -->  this.claims[connectionIndex]
                this.eeForReact.emit("updated_claims", this.claims[connectionIndex]);
            }     
        }
    }


    async waitTillConnectionActive(connectionID: string) {
        return new Promise<void>((resolve, reject) => {
            this.logger.debug(`Start waitTillConnectionActive`);
            let index = this.connections.findIndex(c => c["connection_id"] === connectionID);
            if (index == -1) {
                this.logger.debug(`Couldnt find connection`);
                reject();
            } else if (this.connections["state"] === State.active) {
                this.logger.debug(`Connection already active`);
                resolve();
            }


            this.ee.once(connectionID, () => {
                this.logger.debug(`Connection state changed to active`);
                this.ee.setMaxListeners(Math.max(this.ee.getMaxListeners() - 1, 0));
                resolve();
            });
        });

    }

    async waitTillCredentialXchangeAcked(threadID: string) {
        return new Promise<void>((resolve, reject) => {
            this.logger.debug(`${this.name} Client: Start  waitTillCredentialXchangeAcked: ${threadID}`);
            let index = this.credentialXchange.findIndex(c => c["thread_id"] === threadID);
            if (index === -1) {
                new Promise<void>((resolve) => {
                    this.ee.once("new_credential", () => {
                        resolve();
                    });
                }).then(() => {
                    this.waitTillCredentialXchangeAcked(threadID).then(() => {
                        resolve();
                    });
                });
            }
            else {
                if (this.credentialXchange[index]["state"] === State.credential_acked) {
                    this.logger.debug(`${this.name} Client: Credential already active`);
                    resolve();
                }
                this.ee.once(threadID, () => {
                    this.logger.debug(`${this.name} Client: Credential state changed to acked`);
                    this.ee.setMaxListeners(Math.max(this.ee.getMaxListeners() - 1, 0));
                    resolve();
                });
            }
        });

    }

    async waitTillCredentialXchangeAckedWithConnectionID(connectionID: string) {
        return new Promise<void>((resolve, reject) => {
            this.logger.debug(`${this.name} Client: Start  waitTillCredentialXchangeAcked Connection: ${connectionID}`);
            //TODO sort Array with Timestamp new to old & check Timestamp new
            let index = this.credentialXchange.findIndex(c => c["connection_id"] === connectionID);
            if (index === -1) {
                new Promise<void>((resolve) => {
                    this.ee.once("new_credential", () => {
                        resolve();
                    });
                }).then(() => {
                    this.waitTillCredentialXchangeAckedWithConnectionID(connectionID).then(() => {
                        resolve();
                    });
                });
            }
            else {
                if (this.credentialXchange[index]["state"] === State.credential_acked) {
                    this.logger.debug(`${this.name} Client: Credential already active`);
                    resolve();
                }
                this.ee.once(this.credentialXchange[index]["thread_id"], () => {
                    this.logger.debug(`${this.name} Client: Credential state changed to acked`);
                    this.ee.setMaxListeners(Math.max(this.ee.getMaxListeners() - 1, 0));
                    resolve();
                });
            }
        });

    }


    async waitTillPresentationVerified(threadID: string) {
        return new Promise<void>((resolve, reject) => {
            this.logger.debug(`${this.name} Client: Start  waitTillPresentationVerified: ${threadID}`);
            let index = this.presentations.findIndex(c => c["thread_id"] === threadID);
            if (index === -1) {
                new Promise<void>((resolve) => {
                    this.ee.once("new_presentation", () => {
                        resolve();
                    });
                }).then(() => {
                    this.waitTillPresentationVerified(threadID).then(() => {
                        resolve();
                    });
                });
            }
            else {
                if (this.presentations[index]["state"] === State.presentation_acked || this.presentations[index]["state"] == State.verified) {
                    this.logger.debug(`${this.name} Client: Presentation already finished`);

                    resolve();
                }
                if (this.presentations[index]["state"] === State.verified) {
                    if (this.presentations[index]["verified"] === "false" || this.presentations[index]["verified"] === false) {
                        this.logger.info(`${this.name} Client: Presentation not verified. Stop`);
                        reject();
                    }
                }
                this.ee.once(threadID, () => {
                    this.logger.debug(`${this.name} Client: Presentation state changed to verified/acked`);
                    this.ee.setMaxListeners(Math.max(this.ee.getMaxListeners() - 1, 0));
                    resolve();
                });
            }
        });

    }

    async waitTillPresentationVerifiedWithConnectionID(connectionID: string) {
        return new Promise<void>((resolve, reject) => {
            this.logger.debug(`${this.name} Client: Start  waitTillPresentationVerified Connection: ${connectionID}`);
            //TODO sort Array with Timestamp new to old & check Timestamp new
            let index = this.presentations.findIndex(c => c["connection_id"] === connectionID);
            if (index === -1) {
                new Promise<void>((resolve) => {
                    this.ee.once("new_presentation", () => {
                        resolve();
                    });
                }).then(() => {
                    this.waitTillPresentationVerifiedWithConnectionID(connectionID).then(() => {
                        resolve();
                    });
                });
            }
            else {
                if (this.presentations[index]["state"] === State.presentation_acked || this.presentations[index]["state"] == State.verified) {
                    this.logger.debug(`${this.name} Client: Presentation already finished`);

                    resolve();
                }
                if (this.presentations[index]["state"] === State.verified) {
                    if (this.presentations[index]["verified"] === "false" || this.presentations[index]["verified"] === false) {
                        this.logger.info(`${this.name} Client: Presentation not verified. Stop`);
                        reject();
                    }
                }
                this.ee.once(this.presentations[index]["thread_id"], () => {
                    this.logger.debug(`${this.name} Client: Presentation state changed to verified/acked`);
                    this.ee.setMaxListeners(Math.max(this.ee.getMaxListeners() - 1, 0));
                    resolve();
                });
            }
        });

    }

    async issueCredential(connID: string, credDefID: string, attributes: object) {
        const credDef = await this.get_cred_def(credDefID)

        const schemaSeqNum = credDef['credential_definition']['schemaId']

        const schema = await this.get_schema(schemaSeqNum)

        const issuerDid = credDefID.split(":", 1)[0]

        var credentialProposal = {
            schema_version: schema['version'],
            issuer_did: issuerDid,
            schema_issuer_did: issuerDid,
            schema_name: schema['name'],
            auto_remove: true,
            schema_id: schema['id'],
            cred_def_id: credDefID,
            connection_id: connID,
            comment: "Indeed credential",
            credential_proposal: {
                '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview',
                attributes: attributes
            }
        }

        const resp = await this.send_credential(credentialProposal)
        return Promise.resolve(resp)
    }
    async sendPlantCredentialProofRequest(credDefId: string, connID: string, predicates: any[], attributes: any[]) {
        const proofRequest = new Proof(credDefId, predicates, attributes, connID)
        this.logger.debug(JSON.stringify(proofRequest.proof_request))
        const resp = await this.send_proof_request(proofRequest);
        this.logger.debug(`${this.name} Client: Proof request resp: ${resp}`);
        return resp["thread_id"];
    }


}

