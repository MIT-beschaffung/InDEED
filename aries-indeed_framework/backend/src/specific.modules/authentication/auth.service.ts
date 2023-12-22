import {BadRequestException, HttpStatus, Injectable, InternalServerErrorException} from '@nestjs/common';
import {JwtService} from "@nestjs/jwt";
import {CreateUserDto} from "../users/dto/create-user.dto";
import {compare, hash} from "bcrypt";
import {MyLogger} from "../../generic.modules/logger/logger.service";
import {DatabaseService} from "../../generic.modules/database/database.service";
import {User} from "../users/schemas/user.schema";
import {ChangeUserPwdDto} from "../users/dto/change-user-pwd.dto";
import {NestVaultService} from 'nest-vault';
import {ConfigService} from "../../config.service";
import {HttpService} from "@nestjs/axios";
import {firstValueFrom} from "rxjs";
import {ServerRole} from '../../serverRoles.enum'
import {AxiosResponse} from "axios";
import {PatchUserDto} from "../users/dto/patch-user.dto";

const Crypto = require('crypto');

@Injectable()
export class AuthService {

    private readonly saltRounds = 10;
    private readonly vault;
    private readonly APP_ROLE: string;
    private readonly VAULT_KEYS: string[];
    private VAULT_TOKEN: string;
    private readonly ROLE_ID: string;
    private readonly SECRET_ID: string;

    /**
     * @constructor
     */
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService,
        private readonly MyLogger: MyLogger,
        private readonly vaultService: NestVaultService,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());

        this.VAULT_KEYS = this.configService.VaultKeys;
        this.VAULT_TOKEN = this.configService.VaultToken;
        this.APP_ROLE = this.configService.AppRole;
        this.ROLE_ID = this.configService.RoleID;
        this.SECRET_ID = this.configService.SecretID;

        this.vault = this.vaultService.getVault();
        this.initVaultClient(this.VAULT_KEYS, this.VAULT_TOKEN, this.ROLE_ID, this.SECRET_ID)
            .then(res => {
                this.VAULT_TOKEN = res
                this.vault.healthCheck()
                    .then(res => this.MyLogger.warn('Vault status: ' + JSON.stringify(res)))
                    .catch(err => {
                        switch (err.response.status) {
                            case HttpStatus.NOT_IMPLEMENTED:
                                this.MyLogger.error("The vault isn't initialized. " + err);
                                break;
                            case HttpStatus.SERVICE_UNAVAILABLE:
                                this.MyLogger.error('The vault is sealed. ' + err);
                                break;
                            case HttpStatus.TOO_MANY_REQUESTS:
                            case 473:
                                this.MyLogger.error('The vault is in a standby mode. ' + err);
                                break;
                            case 472:
                                this.MyLogger.error('The vault is in recovery mode. ' + err);
                                break;
                            default:
                                this.MyLogger.error('Error while checking the status of secret vault: ' + err)
                        }
                    });
            })
            .catch(err => this.MyLogger.error('Error on service construction: ' + err.toString()))
            .finally(() => this.initAdminUser());
    }

    /**
     * Function to initialize the vault client in the constructor,
     * what means it will log in via AppRole using the provided ids and returns the user token what can be used to
     * performe operations on the vault.
     * If it's necessary, for example after a reboot, the function will unseal the Vault with the provided keys.
     * And If the vault is not initialized already, which is only the case with a completely new vault,
     * the function will take care of this as well.
     *
     * @param keys the unseal keys of the vault
     * @param root_token the root token of the vault
     * @param role_id the role id of the backend AppRole
     * @param secret_id a secret id for the AppRole
     * @returns the user token as string
     * @throws on http error
     */
    async initVaultClient(keys: string[], root_token: string, role_id: string, secret_id: string): Promise<string> | never {
        this.MyLogger.info('init secret vault client ...');
        try {
            /*
             * only the auth container should init and unseal the vault,
             * the other container just need the token to verify the JWTs
             */
            if(this.configService.role === ServerRole.AUTH) {
                if (!await this.vaultInitStatus()) {
                    const env = await this.onFirstVaultStart();
                    keys = env.keys;
                    root_token = env.root_token;
                    role_id = env.role_id;
                    secret_id = env.secret_id;
                }
                else await this.unsealVault(keys, root_token);
            }
            return await this.loginVault(role_id, secret_id);
        } catch (e) {
            this.MyLogger.error('Error during vault client initialization: ' + e);
            throw e;
        }
    }

    /**
     * Called by initVaultClient() if the vault is not initialized jet.
     * The function will initialize:
     *  - the vaults file system
     *  - the vaults secret engine
     *  - an AppRole for this packend
     * After this it will return the unseal keys, the root token and the AppRole ids.
     *
     * @return a object containing keys, keys_base64, root_toke, role_id, secret_id, everything as string or string array
     * @throws on http error
     */
    async onFirstVaultStart(): Promise<{ keys: string[], keys_base64: string[], root_token: string, role_id: string, secret_id: string }> | never {
        this.MyLogger.info('init secret vault server ...');
        try {
            const res = await this.vaultSysInit();
            this.MyLogger.warn('The following information is absolutely vital and must be stored securely! ' +
                'Please pass the following Variables as ENV-Variables to all containers, and rebuild them.')
            this.MyLogger.warn('Unseal Keys: ' + res.keys);
            this.MyLogger.warn('Root token: ' + res.root_token);

            await this.unsealVault(res.keys, res.root_token);

            // Vault needs some time to get ready after unsealing
            await this.sleep(2000);

            this.MyLogger.info('activating secret engine ...');
            await this.vaultActivateKVEngine(res.root_token);
            this.MyLogger.info('activating AppRoles ...');
            await this.vaultActivateAppRole(res.root_token);
            this.MyLogger.info('creating AppRole policy ...');
            await this.vaultCreateACLPolicy(res.root_token, this.APP_ROLE, 'secret/*', ["create", "read", "update", "patch", "delete", "list"]);
            this.MyLogger.info('creating AppRole ...');
            await this.vaultCreateAppRole(res.root_token, this.APP_ROLE, ['default', this.APP_ROLE]);

            const role_id = await this.vaultGetAppRoleId(res.root_token, this.APP_ROLE);
            const secret_id = await this.vaultGenerateAppRoleSecretId(res.root_token, this.APP_ROLE);

            this.MyLogger.warn('Role ID: ' + role_id);
            this.MyLogger.warn('Secret-ID: ' + secret_id);

            return {...res, role_id: role_id, secret_id: secret_id};
        } catch (e) {
            this.MyLogger.error('Error during first vault initialization: ' + e);
            throw e;
        }
    }

    /**
     * Function to initialize the auth server with an admin user.
     */
    async initAdminUser(): Promise<void> {
        try {
            if(!await this.databaseService.userExist('Admin') && this.configService.role === ServerRole.AUTH) {
                this.MyLogger.warn('Admin user was initialized with password: "test". Change this password asap!');
                await this.create({
                    name: 'Admin',
                    roles: ['ADMIN', 'USER'],
                    url: new URL('https://auth.indeed-energy.de/'),
                    pwd_hash: 'test'
                });
            }
            else if (this.configService.role === ServerRole.AUTH)
                this.MyLogger.debug('The Admin user already exist.');
        } catch (e) {
            this.MyLogger.error('Error while creating the admin user: ' + e.toString());
        }

    }

    /**
     * Function to unseal the secret vault, used by initVaultClient() if the vault is not unsealed.
     *
     * @param keys the unseal keys
     * @param root_token the root token
     *
     * @return the vault response as object
     * @throws on http error
     */
    async unsealVault(keys: string[], root_token: string): Promise<any> | never {
        this.MyLogger.info('unsealing secret vault ...');
        try {
            let status = await this.vault.sealStatus();
            for(let i=0; status.sealed && i < keys.length; i++){
                status = await this.vaultSysUnseal(keys[i]);
            }
            if (status.sealed) throw new Error("Can't unseal vault with given keys!");
            return status
        } catch (e) {
            this.MyLogger.error('Error during vault unsealing: ' + e);
            throw e;
        }
    }

    /**
     * Function to log in to the secret vault using an AppRole.
     *
     * @param roleID the id of the AppRole
     * @param secretID a for this specific AppRole generated secret id to perform the login
     *
     * @return the user token as string
     * @throws on http error
     */
    async loginVault(roleID: string, secretID: string): Promise<string> | never {
        this.MyLogger.info('login to secret vault ...');
        try {
            return await this.vaultLoginWithAppRole(roleID, secretID);
        } catch (e) {
            this.MyLogger.error('Error on vault login: ' + e );
            throw e;
        }
    }

    /**
     * Pseudo "middleware" function to validate a user login based on the username and the corresponding password.
     * This function is called by local-strategy.
     *
     * @param username the username from the login form
     * @param pwd the password from the login form in plain text
     * @returns the user if the validation was successful, null otherwise
     */
    async validateUser(username: string, pwd: string): Promise<User> | null {
        const user = await this.databaseService.findUserByName(username);
        if (user && await compare(pwd, user.pwd_hash)){
            // this is returned to the guard
            return user;
        }
        this.MyLogger.warn("Couldn't validate the user because of password mismatch.");
        // local-guard will throw an exception if no user is returned
        return null;
    }

    /**
     * Service function that creates a cookie that contains a JWT
     * after successfully validation of the user based on a password.
     *
     * @param user object with user id, name and url
     * @returns the cookie as string
     * @throws InternalServerErrorException if no user with this id exists
     */
    async login(user: User): Promise<string> {
        // don't use the pwd hash for token payload!
        // passing a secret to the sign function overwrites the secret defined in the module
         try {
            const secret = await this.readSecret(user._id);
            return this.jwtService.sign({
                _id: user._id,
                name: user.name,
                url: user.url,
                roles: user.roles
            }, {secret: secret});
        } catch (e) {
             this.MyLogger.error('Login failed: ' + e.toString());
             throw new InternalServerErrorException("Couldn't sign JTW");
         }
    }

    /**
     * Function to log out.
     * The function will update the users jwt secret to invalidate all old tokens.
     *
     * @param id the id of the user
     * @returns true on success, false otherwise
     */
    async logout(id: string): Promise<boolean> {
        return await this.updateSecret(id);
    }

    /**
     * Function to create a new user.
     * The password will be hashed and then a new user will be created and stored in the DB by the UserService.
     *
     * @param createUserDto Objekt according to CreateUserDto, that contains all needed information about the new user
     * @returns the new user instance
     */
    async create(createUserDto: CreateUserDto): Promise<User> | never {
        try {
            createUserDto.url = new URL(createUserDto.url.toString()); // workaround, since the URL from the JSON is just a string.
            createUserDto.pwd_hash = await hash(createUserDto.pwd_hash, this.saltRounds);
            const user = await this.databaseService.createUser(createUserDto);
            const secret = this.generateSecret();
            await this.writeSecret(user._id, secret);
            return user;
        } catch (e) {
            const user = await this.databaseService.findUserByName(createUserDto.name);
            if (user) await this.databaseService.deleteUser(user._id);
            this.MyLogger.error('Creating the user failed: ' + e.toString());
            throw new BadRequestException(e.toString());
        }
    }

    /**
     * Function to delete a user.
     *
     * @param id the id of the user that is to be deleted
     * @returns the deleted user instance
     */
    async delete(id: string): Promise<object> {
        this.MyLogger.info('delete user ' + id);
        await this.deleteSecret(id);
        return await this.databaseService.deleteUser(id);
    }

    /**
     * Function to update a user with a new password.
     * The password will be hashed and then stored in the DB by the UserService
     *
     * @param id the id of the user
     * @param changeUserPwdDto an object containing the users old and the new password
     * @returns the new user instance
     * @throws BadRequestException if the old password doesn't match
     * @throws InternalServerErrorException if db query fail
     */
    async changePwd(id: string, changeUserPwdDto: ChangeUserPwdDto): Promise<User> | never {
        try {
            const user = await this.databaseService.findUserById(id);
            if(! await this.validateUser(user.name, changeUserPwdDto.old_pwd)) {
                throw new BadRequestException("Couldn't update user password because of password mismatch.");
            }
            await this.updateSecret(id);
            const new_pwd_hash = await hash(changeUserPwdDto.new_pwd, this.saltRounds);
            return this.databaseService.updateUser(id, new PatchUserDto(null, new_pwd_hash))
        } catch (e) {
            this.MyLogger.error('Changing the password failed: ' + e.toString());
            if (e instanceof BadRequestException) throw e;
            throw new InternalServerErrorException(e.toString());
        }
    }

    /**
     * Function to update user data.
     * @param id the users id
     * @param patchUserDto an object containing the updates
     * @returns the new user instance
     * @throws InternalServerErrorException ond db error
     */
    async patchUser(id: string, patchUserDto: PatchUserDto): Promise<User> | never {
        try {
            await this.updateSecret(id);
            if (patchUserDto.url) patchUserDto.url = new URL(patchUserDto.url.toString()); // workaround, since the URL from the JSON is just a string.
            if (patchUserDto.pwd_hash) patchUserDto.pwd_hash = await hash(patchUserDto.pwd_hash, this.saltRounds);
            return this.databaseService.updateUser(id, patchUserDto);
        } catch (e) {
            this.MyLogger.error('Updating the user data failed: ' + e.toString());
            throw new InternalServerErrorException(e.toString());
        }
    }

    /**
     * Function to fetch all stored user in the DB.
     *
     * @returns array of all stored user
     */
    async getAllUser(): Promise<Array<User>> {
        return await this.databaseService.getAllUser();
    }


    /**
     * Function that returns user data for a given user id.
     * It's used to get the users data for a valid JWT, to display them in the frontend.
     *
     * @param id the user id
     * @returns the user entity
     * @throws InternalServerErrorException if no user can be found with this id
     */
    async getUserCredentials(id): Promise<User> | never {
        try {
            return await this.databaseService.findUserById(id);
        } catch (e) {
            this.MyLogger.error('Error while fetching for user data: ' + e.toString());
            throw new InternalServerErrorException(e.toString());
        }
    }

    /**
     * Function to write a new secret (or even update an old one) in the secret vault.
     *
     * @param id the user id the secret belongs to
     * @param secret the secret
     * @returns
     * @throws
     */
    async writeSecret(id: string, secret: any): Promise<boolean> | never {
        this.MyLogger.info('write secret for user ' + id);
        let retry = true;
        do {
            try {
                const res = await this.vault.createKVSecret(this.VAULT_TOKEN, id, {secret: JSON.stringify(secret)});
                return !!res.created_time;
            } catch (e) {
                if (retry) {
                    if (e.response && e.response.status) {
                        switch (e.response.status) {
                            case HttpStatus.FORBIDDEN:
                                this.MyLogger.warn('Writing a secret to the vault failed with: ' + e);
                                this.MyLogger.warn('Trying to write the secret after re-login ...');
                                this.VAULT_TOKEN = await this.loginVault(this.ROLE_ID, this.SECRET_ID);
                                break;
                            case HttpStatus.REQUEST_TIMEOUT:
                                this.MyLogger.warn('Request to vault timed out. Retrying after a second ...');
                                await this.sleep(1000);
                                break;
                            case HttpStatus.INTERNAL_SERVER_ERROR:
                                this.MyLogger.warn('Received internal server error from Vault. Retrying after a second ...');
                                await this.sleep(1000);
                                break;
                            default:
                                this.MyLogger.error('Error while secret was written to the vault: ' + e.toString());
                                throw e;
                        }
                        retry = false;
                    } else {
                        this.MyLogger.error('Error while secret was written to the vault: ' + e.toString());
                        throw e;
                    }
                } else {
                    this.MyLogger.error('Error while secret was written to the vault: ' + e.toString());
                    throw e;
                }
            }
        } while (true);
    }

    /**
     * Function to get a secret from the secret vault.
     *
     * @param id the id of the user the secret was assigned to
     * @returns the secret as string
     * @throws
     */
    async readSecret(id: string): Promise<any> | never {
        this.MyLogger.info('get secret for user ' + id);
        let retry = true;
        do {
            try {
                const res = await this.vault.readKVSecret(this.VAULT_TOKEN, id);
                return JSON.parse(res.data.secret);
            } catch (e) {
                if (retry) {
                    if(e.response && e.response.status) {
                        const res = e.response;
                        switch (res.status) {
                            case HttpStatus.FORBIDDEN:
                                this.MyLogger.warn('Reading a secret to the vault failed with: ' + e);
                                this.MyLogger.warn('Trying to read the secret after re-login ...');
                                this.VAULT_TOKEN = await this.loginVault(this.ROLE_ID, this.SECRET_ID);
                                break;
                            case HttpStatus.REQUEST_TIMEOUT:
                                this.MyLogger.warn('Request to vault timed out. Retrying after a second ...');
                                await this.sleep(1000);
                                break;
                            case HttpStatus.INTERNAL_SERVER_ERROR:
                                this.MyLogger.warn('Received internal server error from Vault. Retrying after a second ...');
                                await this.sleep(1000);
                                break;
                            default:
                                this.MyLogger.error('Error while secret was read from the vault: ' + e.toString());
                                throw e;
                        }
                        retry = false;
                    } else {
                        this.MyLogger.error('Error while secret was read from the vault: ' + e.toString());
                        throw e;
                    }
                } else {
                    this.MyLogger.error('Error while secret was read from the vault: ' + e.toString());
                    throw e;
                }
            }
        } while (true);
    }

    /**
     * Generates a new jwt secret for a user and updates the DB entry of the user.
     * @param id the id of the user
     * @returns the new user instance
     * @throws Error if secret update fails
     */
    async updateSecret(id: string): Promise<boolean> | never {
        this.MyLogger.info('update secret for user ' + id);
        let retry = true;
        const secret = this.generateSecret();
        do {
            try {
                const res = await this.vault.updateKVSecret(this.VAULT_TOKEN, id, {secret: JSON.stringify(secret)});
                return !!res.created_time;
            } catch (e) {
                if (retry) {
                    if(e.response&& e.response.status) {
                        switch (e.response.status) {
                            case HttpStatus.FORBIDDEN:
                                this.MyLogger.warn('Updating a secret to the vault failed with: ' + e);
                                this.MyLogger.warn('Trying to update the secret after re-login ...');
                                this.VAULT_TOKEN = await this.loginVault(this.ROLE_ID, this.SECRET_ID);
                                break;
                            case HttpStatus.REQUEST_TIMEOUT:
                                this.MyLogger.warn('Request to vault timed out. Retrying after a second ...');
                                await this.sleep(1000);
                                break;
                            case HttpStatus.INTERNAL_SERVER_ERROR:
                                this.MyLogger.warn('Received internal server error from Vault. Retrying after a second ...');
                                await this.sleep(1000);
                                break;
                            default:
                                this.MyLogger.error('Updating the secret failed: ' + e.toString());
                                throw e;
                        }
                        retry = false;
                    } else {
                        this.MyLogger.error('Updating the secret failed: ' + e.toString());
                        throw e;
                    }
                } else {
                    this.MyLogger.error('Updating the secret failed: ' + e.toString());
                    throw e;
                }
            }
        } while (true);
    }

    /**
     * Function to delete a secret from the secret vault permanently.
     * To destroy a secret the vault is required to run secret engine version 2.
     *
     * @param id the id of the user the secret was assigned to
     * @returns true if the secret was destroyed
     * @throws
     */
    async deleteSecret(id: string): Promise<boolean> | never {
        this.MyLogger.info('delete secret for user ' + id);
        let retry = true;
        do {
            try {
                const secret = await this.vault.readKVSecret(this.VAULT_TOKEN, id);
                const versions = Array.from({length: secret.metadata.version}, (_, i) => i + 1);
                const res = await this.vault.destroyVersionsKVSecret(this.VAULT_TOKEN, id, versions);
                return res.status === 204;
            } catch (e) {
                if (retry) {
                    if(e.response.status) {
                        switch (e.response.status) {
                            case HttpStatus.FORBIDDEN:
                                this.MyLogger.warn('Deleting a secret to the vault failed with: ' + e);
                                this.MyLogger.warn('Trying to delete the secret after re-login ...');
                                this.VAULT_TOKEN = await this.loginVault(this.ROLE_ID, this.SECRET_ID);
                                break;
                            case HttpStatus.REQUEST_TIMEOUT:
                                this.MyLogger.warn('Request to vault timed out. Retrying after a second ...');
                                await this.sleep(1000);
                                break;
                            case HttpStatus.INTERNAL_SERVER_ERROR:
                                this.MyLogger.warn('Received internal server error from Vault. Retrying after a second ...');
                                await this.sleep(1000);
                                break;
                            default:
                                this.MyLogger.error('Deleting the secret failed: ' + e.toString());
                                throw e;
                        }
                        retry = false;
                    } else {
                        this.MyLogger.error('Deleting the secret failed: ' + e.toString());
                        throw e;
                    }
                } else {
                    this.MyLogger.error('Deleting the secret failed: ' + e.toString());
                    throw e;
                }
            }
        } while (true);
    }

    /**
     * Auxiliary function to generate a random string out of 64 hex encoded bytes.
     *
     * @returns the random string
     */
    generateSecret(): string {
        return Crypto.randomBytes(64).toString('hex');
    }

    /* ************************************************************************************************
     * Die folgenden Funktionen sind nötig, weil sie vom hashi-vault-js Package nicht oder fehlerhaft
     * implementiert sind. Für die Zukunft evtl. eigener vault Service:
     *  -> Funktionen in this.vault
     *  -> kein nest-vault package (als wrapper für hashi-vault-js)
     *      -> keine dependency errors
     * ************************************************************************************************/

    /**
     * Wrapper function to get the initialization status of the secret vault via http request.
     *
     * @returns true if the fault is initialized, false otherwise
     * @throws on http error
     */
    async vaultInitStatus(): Promise<boolean> | never {
        try {
            // cast the observable returned from the http service to a promise
            const res = await firstValueFrom(await this.httpService.get('sys/init'));
            return res.data.initialized;
        } catch(e) {
            this.MyLogger.error('Http error during the check of the vault initialization staus: ' + e);
            throw e;
        }
    }

    /**
     * Wrapper function to send to initialize the secret vault via http request.
     *
     * @returns a object containing the unseal keys and the root token
     * @throws on http error
     */
    async vaultSysInit(): Promise<{ keys: string[], keys_base64: string[], root_token: string }> | never {
        try {
            const res = await firstValueFrom(
                await this.httpService.post('sys/init', {secret_shares: 5, secret_threshold: 3})
            );
            return res.data;
        } catch(e) {
            this.MyLogger.error('Http error during vault initialization: ' + e);
            throw e;
        }
    }

    /**
     * Wrapper function to send the http request to initialize the file system of the secret vault.
     *
     * @returns a boolean that indicates the success of the initialization
     * @throws on http error
     */
    async vaultInitStorage(): Promise<boolean> | never {
        try {
            const res = await firstValueFrom(
                await this.httpService.post(
                    'sys/storage/raft/bootstrap',
                    null
                )
            );
            return this.wasSuccessful(res);
        } catch (e) {
            this.MyLogger.error('Http error during vault storage initialization: ' + e);
            throw e;
        }
    }

    /**
     * Wrapper function to activate the AppRole auth method on the secret vault via http request.
     *
     * @param rootToken the root token of the vault, that will be attached as header to the request for authentication
     * @returns a boolean that indicates the success of the request
     * @throws on http error
     */
    async vaultActivateAppRole(rootToken: string): Promise<boolean> | never {
        try {
            const res = await firstValueFrom(
                await this.httpService.post(
                    'sys/auth/approle',
                    {type: 'approle'},
                    {headers: {'X-Vault-Token': rootToken}}
                )
            );
            return this.wasSuccessful(res);
        } catch (e) {
            this.MyLogger.error('Http error during activation of AppRoles: ' + e);
            throw e;
        }
    }

    /**
     * Wrapper function to create an AppRole on the secret vault via http request.
     *
     * @param rootToken the root token of the vault, that will be attached as header to the request for authentication
     * @param roleName the name of the AppRole, that is to be created
     * @param polices the polices that should be used for the AppRole
     * @returns a boolean that indicates the success of the request
     * @throws on http error
     */
    async  vaultCreateAppRole(rootToken: string, roleName: string, polices: string[]): Promise<boolean> | never {
        try {
            const res = await firstValueFrom(
                await this.httpService.post(
                    'auth/approle/role/' + roleName,
                    {token_policies: polices},
                    {headers: {'X-Vault-Token': rootToken}}
                ));
            return this.wasSuccessful(res);
        } catch (e) {
            this.MyLogger.error('Http error during creation of an AppRole: ' + e);
            throw e;
        }
    }

    /**
     * Wrapper function to get the ID of an already created AppRole.
     *
     * @param rootToken the root token of the vault, that will be attached as header to the request for authentication
     * @param roleName the name of the AppRole
     * @returns the ID of the AppRole as string
     * @throws on http error
     */
    async vaultGetAppRoleId(rootToken: string, roleName: string): Promise<string> | never {
        try {
            const res = await firstValueFrom(
                await this.httpService.get(
                    'auth/approle/role/' + roleName + '/role-id',
                    {headers: {'X-Vault-Token': rootToken}}
                )
            );
            return res.data.data.role_id;
        } catch (e) {
            this.MyLogger.error("Http error during the query of an AppRole's id: " + e);
            throw e;
        }
    }

    /**
     * Wrapper function to activate a Key-Value secret engine on the secret vault via http request.
     *
     * @param rootToken the root token of the vault, that will be attached as header to the request for authentication
     * @returns a boolean that indicates the success of the request
     * @throws on http error
     */
    async vaultActivateKVEngine(rootToken: string): Promise<boolean> | never {
        try {
            const res = await firstValueFrom(
                await this.httpService.post(
                    'sys/mounts/secret',
                    {type: "kv", options:{version: "2"}},
                    {headers: {'X-Vault-Token': rootToken}}
                )
            );
            return this.wasSuccessful(res);
        } catch (e) {
            this.MyLogger.error('Http error during activation of an KV secret engine: ' + e);
            throw e;
        }
    }

    /**
     * Wrapper function to send an unseal request to the vault.
     * This function is also included in hashi-vault-js but does not work...
     *
     * @param key an unseal key
     * @return server response as object
     * @throws on http error
     */
    async vaultSysUnseal(key: string): Promise<Object> | never {
        try {
            const res = await firstValueFrom(
                await this.httpService.post('sys/unseal', {key: key})
            )
            return res.data;
        } catch (e) {
            this.MyLogger.error('Http error while unsealing the vault: ' + e);
            throw e;
        }
    }

    /**
     * Wrapper function to generate a secret ID for an AppRole via http request.
     * This function is already included in hashi-vault-js but does not work...
     *
     * @param rootToken the root token of the vault, that will be attached as header to the request for authentication
     * @param roleName the name of the AppRole
     * @return the secret id as string
     * @throws on http error
     */
    async vaultGenerateAppRoleSecretId(rootToken: string, roleName: string): Promise<string> | never {
        try {
            const res = await firstValueFrom(
                await this.httpService.post(
                    'auth/approle/role/' + roleName + '/secret-id',
                    {},
                    {headers: {'X-Vault-Token': rootToken}}
                )
            );
            return res.data.data.secret_id;
        } catch (e) {
            this.MyLogger.error("Http error during the generation of an AppRole's secret id: " + e);
            throw e;
        }
    }

    /**
     * Wrapper function to log in to the vault via AppRole.
     * This function is already included in hashi-vault-js but does not work...
     *
     * @param roleId the AppRole ID
     * @param secretId a secret ID for the AppRole
     * @returns user token as string
     * @throws on http error
     */
    async vaultLoginWithAppRole(roleId: string, secretId: string): Promise<string> | never {
        try{
            const res = await firstValueFrom(
                await this.httpService.post('auth/approle/login',{role_id: roleId, secret_id: secretId})
            );
            // @ts-ignore
            return res.data.auth.client_token;
        } catch (e) {
            this.MyLogger.error("Http error during login using AppRole: " + e);
            throw e;
        }
    }

    /**
     * Wrapper function to create an ACL policy via http call.
     *
     * @param rootToken the root token of the vault, that will be attached as header to the request for authentication
     * @param name the name of the policy
     * @param path the filepath the policy defines rules for
     * @param rules set of allowed requests on path
     * @return a boolean that indicates whether the request was successful or not
     * @throws on http error
     */
    async vaultCreateACLPolicy(rootToken: string, name: string , path: string, rules: string[]): Promise<boolean> | never {
        try{
            // @ts-ignore
            const policy = `path "${path}" {\n\tcapabilities = ["${rules.toString().replaceAll(' ','').replaceAll(',', '", "')}"]\n}`;
            const res = await firstValueFrom(
                await this.httpService.post(
                    'sys/policies/acl/' + name,
                    {policy: policy},
                    {headers: {'X-Vault-Token': rootToken}}
                )
            );
            return this.wasSuccessful(res);
        } catch (e) {
            this.MyLogger.error("Http error while creating a ACL Policy: " + e);
            throw e;
        }
    }

    /**
     * Auxiliary function to determine whether a http response signals success or not.
     *
     * @param res a http response (AxiosResponse)
     * @returns true if the response statuscode is between 200 and 300, false otherwise
     */
    wasSuccessful(res: AxiosResponse): boolean {
        return res.status >= 200 && res.status < 300;
    }

    /**
     * Auxiliary function to wait for a certain amount if milliseconds.
     *
     * @param milliseconds the milliseconds to wait
     */
    async sleep(milliseconds) {
        await new Promise(r => setTimeout(r,milliseconds));
    }
}