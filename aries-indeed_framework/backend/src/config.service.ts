import {Injectable} from '@nestjs/common';

@Injectable()
export class ConfigService {
    public readonly name: string;
    public readonly latitude: string;
    public readonly longitude: string;
    public readonly preference: string;
    public readonly prosumer_name: string;
    public readonly socketEndpointURI: string;
    public readonly socketEndpointPort: string;
    public readonly webhookPort: string;
    public readonly agentPort: string;
    public readonly httpCustodialPort: string;
    public readonly localDbURI: string;
    public readonly quorumUrl: string;
    public readonly role: string;
    public readonly AccumulatorURL: string;
    public readonly merkletreedb: string;
    public readonly ApiKey: string;
    public readonly securityLevel: string;
    public readonly quorumApiUrl: string;
    public readonly centralBackendURL: string;
    public readonly logLevel: string;
    private readonly keys: string;
    public readonly VaultToken: string;
    public readonly RoleID: string;
    public readonly SecretID: string;

    public readonly AppRole: string;

    constructor(
        name: string,
        latitude: string,
        longitude: string,
        preference: string,
        prosumer_name: string,
        socketEndpointURI: string,
        socketEndpointPORT: string,
        WebhookPort: string,
        AgentPort: string,
        HTTP_CUSTODIAL_PORT: string,
        LOCAL_DB_URI: string,
        QUORUM_NODE_URL: string,
        ROLE: string,
        ACCURL: string,
        MERKLEROOT_DB_URI: string,
        API_KEY,
        SECURITY_LEVEL,
        LOG_LEVEL: string,
        QUORUM_SERVICE_URL : string,
        CENTRAL_BACKEND_URL : string,
        VAULT_KEYS: string,
        VAULT_TOKEN: string,
        ROLE_ID: string,
        SECRET_ID: string,
        APP_ROLE: string
    ) {
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.preference = preference;
        this.prosumer_name = prosumer_name;
        this.socketEndpointURI = socketEndpointURI;
        this.socketEndpointPort = socketEndpointPORT;
        this.webhookPort = WebhookPort;
        this.agentPort = AgentPort;
        this.httpCustodialPort = HTTP_CUSTODIAL_PORT;
        this.localDbURI = LOCAL_DB_URI;
        this.quorumUrl = QUORUM_NODE_URL;
        this.role = ROLE;
        this.AccumulatorURL = ACCURL;
        this.merkletreedb = MERKLEROOT_DB_URI;
        this.ApiKey = API_KEY;
        this.securityLevel = SECURITY_LEVEL;
        this.logLevel = LOG_LEVEL;
        this.quorumApiUrl = QUORUM_SERVICE_URL;
        this.centralBackendURL = CENTRAL_BACKEND_URL;
        this.keys = VAULT_KEYS;
        this.VaultToken = VAULT_TOKEN;
        this.RoleID = ROLE_ID;
        this.SecretID = SECRET_ID;
        this.AppRole = APP_ROLE;
    }

    get VaultKeys(): string[] | null {
        if (this.keys) return this.keys.split(',');
        else return null;
    }
}
