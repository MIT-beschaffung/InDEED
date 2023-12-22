import * as needle from 'needle'
import * as request from 'request'
import { configure, getLogger, Logger } from "log4js";
import { OutgoingHttpHeaders } from 'http';



export class AriesClient {
    agentURL: string;
    baseURL: string;
    ledgerURL: string;
    headers: OutgoingHttpHeaders;
    walletName: string;
    logLevel: string;
    logger: Logger;

    constructor(agentURL: string, baseURL: string, ledgerURL: string, walletName: string, logLevel: string = 'info') {
        this.agentURL = agentURL
        this.baseURL = baseURL
        this.ledgerURL = ledgerURL
        this.walletName = walletName
        this.headers = {
            'x-api-key': 'eNLsWFkAZP2kd3MxR65kM3WXx7aOoXZ44nGfuCxy',
            'Wallet': this.walletName
        }
        this.logger = getLogger()
        this.logger.level = logLevel
    }

    async _get(path: string) {
        const url = this.agentURL + path
        this.logger.debug("URL for _get: " + url)

        // Call agent.
        return new Promise((resolve, reject) => {
            needle.get(url, {json: true, headers: this.headers}, (err, res) => {
                if (err) { 
                      reject(err)
                } else {
                    resolve(res.body)
                }
            });

        })
    }

    async _post(path: string, body?: object) {
        const url = this.agentURL + path
        this.logger.debug("URL for _post: " + url)
        this.logger.debug("Body for _post: " + JSON.stringify(body))

        // Call agent.
        return new Promise((resolve, reject) => {
            needle.post(url, body, {json: true, headers: this.headers}, (err, res) => {
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

    async get_dids() {
        const resp = await this._get("/wallet/did")
        return resp["results"]
    }

    async create_wallet(walletName: string) {
        let seed= ""
        let n = walletName.length
        for (let i=0; i<32-11-n; i++) {
            seed = seed + "0"
        }
        seed = seed + walletName + "ChainLabBMW"
        //MyLogger.debug("Seed: " + seed)

        const config = {
            wallet_type: "indy",
            wallet_key: "123456",
            wallet_name: walletName,
            seed: seed
        }
        const resp = await this._post(
            "/wallet",
            config
        )
        return resp
    }

    async remove_wallet(walletName: string) {
        const resp = await this._post(
            "/wallet/" + walletName + "/remove",
            null
        )
        return resp
    }

    async create_invitation(auto_accept: boolean = true, multi_use: boolean = false, public_did: boolean= false) {
        try {

            const resp = await this._post(
                "/connections/create-invitation?auto_accept="+auto_accept.toString()+"&multi_use="+multi_use.toString()+"&public="+public_did.toString(),
            null)

            return Promise.resolve(resp)
        } catch (err) {
            MyLogger.debug(err)
            return Promise.reject(-1)
        }
    }

    async receive_invitation(invitation: any,auto_accept?: boolean) {
        try {
            let additional_path = ""
            if(auto_accept !== undefined){
                additional_path = "?auto_accept="+ auto_accept.toString();
            }

            const resp = await this._post(
                "/connections/receive-invitation"+ additional_path,
                invitation
            )
            return Promise.resolve(resp)
        } catch (err) {
            MyLogger.debug(err)
            return Promise.reject(-1)
        }

    }
    async send_basicmessage(conn_id: string, message: string) {
        const path = "/connections/" + conn_id + "/send-message"
        const content = {"content": message}
        return this._post(
            path,
            content
        )
    }

    async accept_invitation(conn_id: string) {
        const path = "/connections/" + conn_id + "/accept-invitation"
        const resp = await this._post(
            path,
            null
        )
        return resp
    }
    
    async accept_request(conn_id: string) {
        const path = "/connections/" + conn_id + "/accept-request"
        const resp = await this._post(
            path,
            null
        )
        return resp
    }

    async send_ping(conn_id: string, message: any) {
        const path = "/connections/" + conn_id + "/send-ping"
        const resp = await this._post(
            path,
            message
        )
        return resp
    }

    async create_did() {
        const resp = await this._post(
            "/wallet/did/create"
        )
        const didInfo = resp['result']
        return didInfo
    }


    async register_nym(did: string, verkey: string, role: string = "ENDORSER") {
        const resp = await this._post(
            `/ledger/register-nym?did=${did}&verkey=${verkey}&role=${role}`,
            {},
        )
        return resp
    }

    async register_did(
                    agentURL: string,
                    baseURL: string,
                    ledgerURL: string,
                    didInfo: any, 
                    role: string = 'ENDORSER', 
                    alias?: string) {
        const did = didInfo['did']
        const verkey = didInfo['verkey']

        // ----- REQUEST ------
        var options = {
            'method': 'POST',
            'url': `${baseURL}:9000/register`,
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"did":did,"verkey":verkey,"role":"ENDORSER"})
        }

        const url = `${ledgerURL}:9000/register`
        const data = JSON.stringify({"did":did,"verkey":verkey,"role":"ENDORSER"})

        return new Promise((resolve, reject) => {
            needle.post(url, data, {json: true, headers: this.headers}, (err, res) => {
                if (err) { 
                      reject(err)
                      this.logger.error(err)
                } else {
                    if (res.statusCode == 200 || res.statusCode == 201) {
                        //MyLogger.debug(res.body)
                        resolve(res.body)
                    } else {
                        reject(res.body)
                    }
                }
            });

        })

    }

    async set_public_did(did: string) {
        const path = `/wallet/did/public?did=${did}`
        const resp = await this._post(path)
        return resp
    }

    async create_schema(schema: object) {
        const resp = await this._post(
            '/schemas',
            schema
        )
        return resp
    }

    async create_cred_def(tag: string, schemaID: string, rev: boolean = false) {
        const resp = await this._post(
            '/credential-definitions',
            {
                tag: tag,
                schema_id: schemaID,
                support_revocation: rev
            }
        )
        return resp
    }

    /**
     * Get schema information by id  (schema_id or  seqNo)
     */
    async get_schema(id: string) {
        const resp = await this._get(
            `/schemas/${id}`
        )
        return resp
    }

    /**
     * Gets credential definition for credential id.
     * @param id Credential id.
     * @returns  Credential Definition Information.
     */
    async get_cred_def(id: string) {
        const resp = await this._get(
            `/credential-definitions/${id}`
        )
        return resp
    }

    /**
     * Sends credential proposal to holder.
     * @param credProp Credential proposal
     * @returns  
     */
    async send_credential(credProp: object) {
        const resp = await this._post(
            `/issue-credential/send`,
            credProp
        )
        return resp
    }

    async send_proof_request(proofReq: object) {
        const resp = await this._post(
            `/present-proof/send-request`,
            proofReq
        )
        return resp
    }

}