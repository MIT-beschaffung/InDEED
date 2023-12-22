import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import * as process from "process";

@Module({
    providers: [
        {
            provide: ConfigService,
            useValue: new ConfigService(
                process.env.NAME,
                process.env.LATITUDE,
                process.env.LONGITUDE,
                process.env.PREFERENCE,
                process.env.PROSUMER_NAME,
                process.env.SOCKET_ENDPOINT_URL,
                process.env.SOCKET_ENDPOINT_PORT,
                process.env.WEBHOOK_PORT,
                process.env.AGENT_PORT,
                process.env.HTTP_CUSTODIAL_PORT,
                process.env.LOCAL_DB_URI,
                process.env.QUORUM_NODE_URL,
                process.env.ROLE,
                process.env.ACCURL,
                process.env.MERKLEROOT_DB_URI,
                process.env.API_KEY,
                process.env.SECURITY_LEVEL,
                process.env.LOG_LEVEL,
                process.env.QUORUM_SERVICE_URL,
                process.env.CENTRAL_BACKEND_URL,
                process.env.VAULT_KEYS,
                process.env.VAULT_TOKEN,
                process.env.ROLE_ID,
                process.env.SECRET_ID,
                process.env.APP_ROLE
            ),
        },
    ],
    exports: [ConfigService],
})
export class ConfigModule {}
