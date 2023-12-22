import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import {Injectable, UnauthorizedException} from "@nestjs/common";
import {DatabaseService} from "../../../generic.modules/database/database.service";
import {ConfigService} from "../../../config.service";
import * as jwt from 'jsonwebtoken';
import {ServerRole} from "../../../serverRoles.enum";
import {AuthService} from "../auth.service";
import rolesEnum from "../../users/roles.enum";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly authService : AuthService,
        private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                JwtStrategy.extractJWTFromCookie
            ]),
            secretOrKeyProvider: (request, rawJwtToken, done) => {
                const user = jwt.decode(rawJwtToken);
                // @ts-ignore
                const userHostname = user.url.hostname.split('.').filter(e => e !== 'www')[0];
                // @ts-ignore
                if (this.configService.role === ServerRole.AUTH || userHostname === this.configService.name.toLowerCase() || user.roles.includes(rolesEnum.ADMIN)) {
                    // since we don't use the secrets as payload we need to fetch the jwt secret from the secret vault
                    // @ts-ignore
                    this.authService.readSecret(user._id)
                        .then(secret => done(null, secret));
                }
                else done(new UnauthorizedException('Wrong Backend.'), null);
            },
        });
    }

    /**
     * Function to extract a JWT from the InDEED_JWT cookie generated on login.
     * @param req the client request that contains the cookie
     * @returns the JWT as string, null if no token could be extracted
     * @private
     */
    private static extractJWTFromCookie(req): string | null {
        if (req.cookies && 'InDEED_JWT' in req.cookies) {
            return req.cookies.InDEED_JWT
        }
        return null;
    }

    async validate(payload: any): Promise<string> {
        return payload; // returns to the called endpoint
    }
}