import {Module} from '@nestjs/common';
import {AuthService} from "./auth.service";
import {AuthController} from "./auth.controller";
import {PassportModule} from "@nestjs/passport";
import {JwtModule, JwtSecretRequestType} from "@nestjs/jwt";
import {ConfigModule} from "../../config.module";
import {MyLoggerModule} from "../../generic.modules/logger/logger.module";
import {LocalStrategy} from "./strategies/local.strategy";
import {JwtStrategy} from "./strategies/jwt.strategy";
import {HeaderApiKeyStrategy} from "./strategies/apikey-auth.strategy";
import {DatabaseModule} from "../../generic.modules/database/database.module";
import {NestVaultModule} from 'nest-vault';
import {HttpModule} from '@nestjs/axios'

@Module({
    imports: [
        PassportModule,
        MyLoggerModule,
        ConfigModule,
        DatabaseModule,
        JwtModule.register({
            signOptions: {expiresIn: '7d'},
            verifyOptions: {ignoreExpiration: false},
            secretOrKeyProvider: (requestType, tokenOrPayload, options) => {
                switch (requestType) {
                    /*
                     * Only SIGN should occur.
                     * The VERIFY case is not passed to the Module, but to the jwt-strategy.
                     */
                    case JwtSecretRequestType.SIGN:
                        // @ts-ignore
                        return options.secret;
                    case JwtSecretRequestType.VERIFY:
                        return 'static secret';
                    default:
                        return 'static secret';
                }
            }
        }),
        NestVaultModule.register({
            baseUrl: 'http://secret-vault:8200/v1/',
            rootPath: 'secret',
        }),
        HttpModule.register({
            baseURL: 'http://secret-vault:8200/v1/'
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy, HeaderApiKeyStrategy],
    controllers: [AuthController],
    exports: [AuthService, JwtModule, PassportModule]
})

export class AuthModule {}