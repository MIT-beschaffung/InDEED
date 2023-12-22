import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from 'src/config.service';
import Strategy from 'passport-headerapikey';

@Injectable()
export class HeaderApiKeyStrategy extends PassportStrategy(Strategy, 'api_key') {
    constructor(
        private readonly configService: ConfigService
    ) {
        super({ header: 'api_key', prefix: '' },
        true,
        async (apiKey, done) => {
            return this.validate(apiKey, done);
        });
    }

    public validate = (apiKey: string, done: (error: Error, data) => {}) => {
        if (this.configService.ApiKey === apiKey || this.configService.securityLevel === "noSecurity") {
            done(null, true);
        } else {
            done(new UnauthorizedException('API-Key konnte nicht verifiziert werden.'), null);
        }
    }
}