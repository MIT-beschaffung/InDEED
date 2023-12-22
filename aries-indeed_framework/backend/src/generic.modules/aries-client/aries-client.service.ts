import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ApiGatewayTimeoutResponse } from '@nestjs/swagger';
import { BaseDto } from 'src/generic.modules/base/base.dto';
import { ConfigService } from 'src/config.service';
import { AriesClientOptions } from './aries-client.module';
import {MyLogger} from "../logger/logger.service";


@Injectable()
export class AriesClientService {
    // private readonly basePath: string;
    // private readonly walletName: string;
    //private readonly httpService: HttpService;
    private readonly apiKey: string =
        'eNLsWFkAZP2kd3MxR65kM3WXx7aOoXZ44nGfuCxy';

    constructor(
        private readonly httpService: HttpService,
        private readonly config: ConfigService,
        private readonly MyLogger: MyLogger
    ) {
        this.MyLogger.setContext(this.constructor.name.toString())
    }

    private readonly basePath = `${this.config.socketEndpointURI}:${this.config.agentPort}`;

    private readonly walletName = this.config.name;

    headers = {
        'x-api-key': this.apiKey,
        Wallet: this.walletName,
    };
    // sendRequest: any;

    private async get(subPath: string): Promise<object> {
        const url = `${this.basePath}/${subPath}`;
        return await this.httpService
            .get(url, { headers: this.headers })
            .toPromise();
    }

    private async post(subPath: string, body?: object): Promise<object> {
        const url = `${this.basePath}/${subPath}`;
        this.MyLogger.debug('Here comes the URL: ' + url);
        return await this.httpService
            .post(url, body, { headers: this.headers })
            .toPromise();
    }

    //Call agent.
    // return new Promise((resolve, reject) => {
    // this.post(url, body, {json: true, headers: this.headers}, (err, res) => {
    //     if (err) {
    //                reject(err)
    //          } else {
    //           if (res.statusCode == 200 || res.statusCode == 201) {
    //                 //MyLogger.debug(res.body)
    //                  resolve(res.body)
    //             } else {
    //                 this.logger.error(res.statusCode)
    //                reject(res.body)
    //             }
    //  }
    // });

    public async getDids() {
        return this.get('/wallet/did');
    }

    public async createWallet(walletName: string) {
        let seed = '';
        let n = walletName.length;
        for (let i = 0; i < 32 - 11 - n; i++) {
            seed = seed + '0';
        }
        seed = seed + walletName + 'ChainLabBMW';

        const config = {
            wallet_type: 'indy',
            wallet_key: '12345',
            wallet_name: walletName,
            seed: seed,
        };

        return this.post('/wallet');
    }

    public async removeWallet(walletName: string) {
        return this.post('/wallet/' + walletName + '/remove');
    }

    public async createInvitation(
        autoAccept: boolean = true,
        multiUse: boolean = false,
        publicDid: boolean = false,
    ) {
        try {
            const resp = this.post(
                '/connections/create-invitation?autoAccept=' +
                    autoAccept.toString() +
                    '&multi_use=' +
                    multiUse.toString() +
                    '&public=' +
                    publicDid.toString(),
                null,
            );

            return Promise.resolve(resp);
        } catch (err) {
            this.MyLogger.debug(err);
            return Promise.reject(-1);
        }
    }

    public async receiveInvitation(invitation: any, autoAccept?: boolean) {
        try {
            let additionalPath = '';
            if (autoAccept != undefined) {
                additionalPath = '?autoAccept=' + autoAccept.toString();
            }
            const resp = this.post(
                '/connections/receive-invitation' + additionalPath,
                invitation,
            );

            return Promise.resolve(resp);
        } catch (err) {
            this.MyLogger.debug(err);
            return Promise.reject(-1);
        }
    }

    public async sendMessage(connID: string, b: {}) {
        const path = `connections/${connID}/send-message`;
        const URL = `http://${this.config.socketEndpointURI}:${this.config.agentPort}/${path}`;

        const payload = {
            content: JSON.stringify(b),
        };
        const job = await this.httpService
            .post(URL, payload, { headers: this.headers })
            .toPromise();

        return;

        //TODO at the moment nothing is returned. Is this fine or do we need to return sthing?
    }

    public async acceptInvitation(b: BaseDto) {
        const path = `connections/${b.connectionId}/accept-invitation`;
        return await this.post(path);
    }

    public async acceptRequest(b: BaseDto) {
        const path = `connections/${b.connectionId}/accept-request`;
        return await this.post(path);
    }

    public async sendPing(b: BaseDto) {
        const path = `connections/${b.connectionId}/send_ping`;
        return await this.post(path);
    }

    public async createDid() {
        const resp = this.post('/wallet/did/create');
        const didInfo = resp['result'];
        return await didInfo;
    }

    public async registerNym(
        did: string,
        verkey: string,
        role: string = 'ENDORSER',
    ) {
        const resp = await this.post(
            `/ledger/register-nym?did=${did}&verkey=${verkey}&role=${role}`,
            {},
        );
        return resp;
    }

    public async registerDid(
        agentURL: string,
        baseURL: string,
        ledgerURL: string,
        didInfo: any,
        role: string = 'ENDORSER',
        alias?: string,
    ) {
        const did = didInfo['did'];
        const verkey = didInfo['verkey'];

        // ----- REQUEST ------
        var options = {
            method: 'POST',
            url: `${baseURL}:9000/register`,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                did: did,
                verkey: verkey,
                role: 'ENDORSER',
            }),
        };

        const url = `${ledgerURL}:9000/register`;
        const data = { did: did, verkey: verkey, role: 'ENDORSER' };

        return this.post(url, data);
    }

    public async setPublicDid(did: string) {
        const path = `/wallet/did/public?did=${did}`;
        return await this.post(path);
    }

    public async createSchema(schema: object) {
        const resp = await this.post('/schemas', schema);
        return resp;
    }

    public async createCredDef(
        tag: string,
        schemaID: string,
        rev: boolean = false,
    ) {
        const resp = await this.post('/credential-definitions', {
            tag: tag,
            schema_id: schemaID,
            support_revocation: rev,
        });
        return resp;
    }

    //Get schema information by id  (schema_id or  seqNo)

    async getSchema(id: string) {
        const resp = await this.get(`/schemas/${id}`);
        return resp;
    }

    //  Gets credential definition for credential id.
    //  @param id Credential id.
    //  @returns  Credential Definition Information.
    //
    async getCredDef(id: string) {
        const resp = await this.get(`/credential-definitions/${id}`);
        return resp;
    }

    //  Sends credential proposal to holder.
    //  @param credProp Credential proposal
    //  @returns

    async sendCredential(credProp: object) {
        const resp = await this.post(`/issue-credential/send`, credProp);
        return resp;
    }

    async sendProofRequest(proofReq: object) {
        const resp = await this.post(`/present-proof/send-request`, proofReq);
        return resp;
    }
}
