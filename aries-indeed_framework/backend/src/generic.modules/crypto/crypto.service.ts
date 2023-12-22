import { Injectable } from '@nestjs/common';
import { MyLogger } from 'src/generic.modules/logger/logger.service'
import { keyPairDto } from 'src/specific.modules/labeling/keyPair.dto';
import {PoseidonMerkleUtils} from "../merkletree/poseidonMerkleUtils";
import { entities, facilities, roles } from './keyListArgs.enum';

const { newKey , getPublicKey } = require("./key");
//const { checkAscendingKeys, checkConsumers, checkProducers } = require("./checkInput");
const { signPoseidon, verifyPoseidon } = require("./eddsaUtils");

const poseidonMerkleUtils = new PoseidonMerkleUtils();

const ppMax = BigInt(Math.pow(2, 252) - 1);
const maxCons = BigInt(Math.pow(2, 50));


@Injectable()
export class CryptoService {

    constructor(
        private globalKeyList = {},
        private MyLogger: MyLogger
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
        this.initialize();
    }

    // create entity keys in globalKeyList
    async initialize () {
        this.MyLogger.warn('Initialize globalKeyList ...');

        this.globalKeyList['FfE']         = {'HQ': {'consumers': [], 'producers': []}};
        this.globalKeyList['Rheinenergie']= {'ZE01 AG06': {'consumers': [], 'producers': []},
                                             'ZE02 AG06': {'consumers': [], 'producers': []},
                                             'ZE03 AG06': {'consumers': [], 'producers': []},
                                             'ZE04 AG06': {'consumers': [], 'producers': []},
                                             'ZE05 AG06': {'consumers': [], 'producers': []},
                                             'ZE06 AG06': {'consumers': [], 'producers': []}};
        this.globalKeyList['Schweiger']   = {'EWS1': {'consumers': [], 'producers': []},
                                             'EWS2': {'consumers': [], 'producers': []},
                                             'EWS3': {'consumers': [], 'producers': []},
                                             'EWS4': {'consumers': [], 'producers': []},
                                             'EWS5': {'consumers': [], 'producers': []}};
        this.globalKeyList['SMA']         = {'Germany|04600': {'consumers': [], 'producers': []},
                                             'Germany|04603': {'consumers': [], 'producers': []},
                                             'Germany|08301': {'consumers': [], 'producers': []},
                                             'Germany|08309': {'consumers': [], 'producers': []},
                                             'Germany|25917': {'consumers': [], 'producers': []},
                                             'Germany|59609': {'consumers': [], 'producers': []},
                                             'Germany|71154': {'consumers': [], 'producers': []},
                                             'Germany|85567': {'consumers': [], 'producers': []},
                                             'Germany|85656': {'consumers': [], 'producers': []},
                                             'Germany|91177': {'consumers': [], 'producers': []}};
        this.globalKeyList['SMA Probanden']={'425710900': {'consumers': [], 'producers': []},
                                             '440743500': {'consumers': [], 'producers': []},
                                             '306603400': {'consumers': [], 'producers': []},
                                             '622216400': {'consumers': [], 'producers': []},
                                             '205858500': {'consumers': [], 'producers': []},
                                             '571190700': {'consumers': [], 'producers': []},
                                             '559421200': {'consumers': [], 'producers': []},
                                             '526103400': {'consumers': [], 'producers': []},
                                             '541360200': {'consumers': [], 'producers': []},
                                             '522700200': {'consumers': [], 'producers': []},
                                             '609687200': {'consumers': [], 'producers': []},
                                             '563550000': {'consumers': [], 'producers': []},
                                             '398940500': {'consumers': [], 'producers': []},
                                             '597847700': {'consumers': [], 'producers': []},
                                             '311377700': {'consumers': [], 'producers': []},
                                             '217379700': {'consumers': [], 'producers': []}};

        // this.MyLogger.error(JSON.stringify(this.globalKeyList, null, 4));
        // this.MyLogger.warn('... done');
    }

    public checkConsumers(consumers, starttime) {
        try {
            for (let i = 0; i < consumers.length; i++) {
                // this.MyLogger.warn('### consumer[' + i + ']: ' + JSON.stringify(consumers[i]))
                if (!this.checkConsumer(consumers[i], starttime)) {
                    this.MyLogger.warn("Invalid consumer on position " + i);
                    return false;
                } else {
                    //this.MyLogger.log("Valid consumer on position" + i);
                }
            }
            return true;
        } catch (err) {
            this.MyLogger.error(err);
            return false;
        }
    }

    public checkConsumer(consumer, starttime) {
        try {
            //this.MyLogger.log('Checking consumer');
            //this.MyLogger.log(consumer);
            //this.MyLogger.log('starttime');
            //this.MyLogger.log(starttime);
            if (
                Number(consumer[0]) > 0 &&
                //Number(consumer[0]) < ppMax &&
                Number(consumer[1]) >= 0 &&                 //check green
                Number(consumer[1]) <= maxCons &&
                Number(consumer[2]) >= 0 &&                 //check grey
                Number(consumer[3]) >= Number(starttime) &&         //check timestamp
                Number(consumer[3]) < (Number(starttime) + 450)) {

                return true;
            } else {
                this.MyLogger.debug('consumer: ' + consumer);
                this.MyLogger.debug((Number(consumer[0]) > 0)                         + ' : pKey > 0');
                //this.MyLogger.debug(BigInt(consumer[0]) < ppMax);
                //this.MyLogger.debug(BigInt(consumer[0]));
                //this.MyLogger.debug(ppMax);
                this.MyLogger.debug((Number(consumer[1]) >= 0)                        + ' : greenShare >= 0');
                this.MyLogger.debug((Number(consumer[1]) <= maxCons)                  + ' : cons <= maxCons');
                this.MyLogger.debug((Number(consumer[2]) >= 0)                        + ' : cons >= 0');
                this.MyLogger.debug((Number(consumer[3]) >= Number(starttime))        + ' : tstmp >= starttime');
                this.MyLogger.debug((Number(consumer[3]) < (Number(starttime) + 450)) + ' : tstmp < starttime + 450');

                this.MyLogger.debug("Consumer input invalid");
                return false;
                //throw "Consumer input invalid";
            }
        } catch (err) {
            this.MyLogger.warn("Error during checkConsumer");
            this.MyLogger.error(err);
        }
    }

    public checkProducers(producers, starttime) {  //, producer_names) {
        try {
            for (let i = 0; i < producers.length; i++) {
                if (!this.checkProducer(producers[i], starttime)) {  //, producer_names[i])) {
                    this.MyLogger.warn("Invalid producer on position " + i);
                    return false;
                } else {
                    //this.MyLogger.log("Valid producer on position" + i);
                }
            }
            return true;
        } catch (err) {
            this.MyLogger.warn("Error during checkProducers");
            this.MyLogger.error(err);
            return false;
        }
    }

//checkinput([Single Producer-Array]) (Werte größer 0, time in Range, signed Values > 0)
//input: {Array}
    public checkProducer(producer, starttime) {  //, name) {

        if (
            
            // (name == 'dummy')?true:
            this.checkProducerSignature(producer) &&
            Number(producer[0]) > 0 &&
            Number(producer[0]) < ppMax &&
            //check key-values
            Number(producer[1]) > 0 &&
            Number(producer[2]) >= 0 &&                 //check green
            Number(producer[3]) >= 0 &&                 //check grey
            Number(producer[4]) >= Number(starttime) &&         //check timestamp
            Number(producer[4]) < (Number(starttime) + 450) &&
            Number(producer[5]) > 0 &&    //check signed data
            Number(producer[6]) > 0 &&
            Number(producer[7]) > 0) {

            return true;

        } else {
            this.MyLogger.debug(producer);
            this.MyLogger.debug(this.checkProducerSignature(producer)             + ' : signature');
            this.MyLogger.debug((Number(producer[0]) > 0)                         + ' : pKey_x > 0');
            this.MyLogger.debug((Number(producer[0]) < ppMax)                     + ' : pKey_x < ppMax');
            this.MyLogger.debug(BigInt(producer[0])                               + ' : BigInt');
            this.MyLogger.debug(ppMax                                             + ' : ppMax');
            this.MyLogger.debug((Number(producer[1]) > 0)                         + ' : pKey_y');
            this.MyLogger.debug((Number(producer[2]) >= 0)                        + ' : greenShare >= 0');
            this.MyLogger.debug((Number(producer[3]) >= 0)                        + ' : grayShare  >= 0');
            this.MyLogger.debug((Number(producer[4]) >= Number(starttime))        + ' : tstmp >= starttime');
            this.MyLogger.debug((Number(producer[4]) < (Number(starttime) + 450)) + ' : tstmp < starttime + 450');
            this.MyLogger.debug((Number(producer[5]) > 0)                         + ' : sgn msg ');
            this.MyLogger.debug(Number(producer[6]) > 0                                          );
            this.MyLogger.debug(Number(producer[7]) > 0                                          );

            this.MyLogger.warn("Producer input invalid");
            return false;
        }
    }

    public checkProducerSignature(producer) {
        try {
            //this.MyLogger.log("Checking signature");
            let msghashed = poseidonMerkleUtils.poseidonHashFunction(producer.slice(2, 5));
            //this.MyLogger.log(msg);
            let msgbuff = Buffer.from(msghashed.toString(), 'utf8');
            //this.MyLogger.log(msgbuff);
            //this.MyLogger.log([BigInt(producer[0]), BigInt(producer[1])]);
            let pk = [BigInt(producer[0]), BigInt(producer[1])];
            //this.MyLogger.log(pk);
            let signature = {
                R8: [BigInt(producer[5]), BigInt(producer[6])],
                S: BigInt(producer[7]),
            }
            //this.MyLogger.log(signature);

            return verifyPoseidon(msgbuff, signature, pk);

        } catch (err) {
            this.MyLogger.warn("Error during signature check");
            this.MyLogger.error(err);
            return false
        }
    }

//Check order of first coordinate of private key
//input: {input.json}
    public checkAscendingKeys(input) {
        this.MyLogger.debug("Checking whether keys are ascending");
        try {
            for (let i = 0; i < (input.consumers.length - 1); i++) {
                if (Number(input.consumers[i][0]) >= Number(input.consumers[i + 1][0])) {
                    this.MyLogger.warn("Consumers not sorted by publickey[0] ascending");
                    return false;
                }
            }
            for (let i = 0; i < (input.producers.length - 1); i++) {
                if (Number(input.producers[i][0]) >= Number(input.producers[i + 1][0])) {
                    this.MyLogger.warn("Producers not sorted by publickey[0] ascending");
                    return false;
                }
            }
            this.MyLogger.debug("Largest key cons: " + input.consumers[input.consumers.length - 1][0].toString());
            this.MyLogger.debug("Largest key prod: " + input.producers[input.producers.length - 1][0].toString());
            this.MyLogger.debug("Largest num supp: " + ppMax.toString());
            return true;

        } catch (err) {
            this.MyLogger.error("An error occurred during checking whether keys are ascending: " + JSON.stringify(err));
            this.MyLogger.info("Inputs: " + JSON.stringify(input));
            return false;
        }
    }

    public generateSecretKey(): string {
        return newKey();
    }

    public getPublicKey(privateKey): string[] {
        let pKey = getPublicKey(privateKey);
        return [pKey[0].toString(), pKey[1].toString()];
    }

    public signMessageWithPoseidon(sKey, message) {
        return signPoseidon(sKey, message);
    }

    public verifyPoseidonSignatureOnMessage(message, signature, publicKey) {
        return verifyPoseidon(message, signature, publicKey);
    }

    public checkInputs(input) {  //, producer_names) {
        try {
            let ascendingKeys = this.checkAscendingKeys(input);
            this.MyLogger.debug('Keys ascending: ' + ascendingKeys);
            // this.MyLogger.warn('Consumers starttime: ' + input.starttime)
            let consumersValid = this.checkConsumers(input.consumers, input.starttime)
            this.MyLogger.debug('Consumers valid: ' + consumersValid);
            let producersValid = this.checkProducers(input.producers, input.starttime);  //, producer_names);
            this.MyLogger.debug('Producers valid: ' + producersValid);
            return ascendingKeys && consumersValid && producersValid;
        } catch (err) {
            this.MyLogger.error("An error occurred during checking the optimized inputs: " + JSON.stringify(err));
            this.MyLogger.info("Inputs: " + JSON.stringify(input));
            return false;
        }
    }

    // TODO: API tags
    // @Get('globalKeyList')
    getGlobalKeyList() {
        return JSON.stringify(this.globalKeyList, null, 4);
    }
    
    getGlobalKeys(facility) {
        return JSON.stringify(this.globalKeyList[facility]);
    }

    // not working yet:
    // getAll_pKeys() {
    //     for( var ent in entities ) {
    //         console.log('### ent: ' + ent + ':');
    //         for( var fac in facilities) {
    //             console.log('### fac: ' + fac + ':');
    //             for ( var rol in roles) {
    //                 console.log('### rol: ' + rol + ':');
    //                 for (let count=0; count < this.globalKeyList[ent][fac][rol].length; count++) {
    //                     console.log('### count: ' + count + ':');
    //                     console.log(this.globalKeyList[ent][fac][rol][count].pKey[0]);
    //                 }
    //             }
    //         }
    //     }
    // }
 
    // storeKeyInList(entity: string, keys: keyPairDto) {
    /**
     * @deprecated The method should not be used since key pairs are stored in the secret-vault
     */
    storeKeyInList(entity: entities, fac: facilities, role: roles, keys: keyPairDto) {
        try {
            // TODO Check whether keyPair already exists
            this.globalKeyList[entity][fac][role].push(keys);
        } catch (error) {
            this.MyLogger.error('Could not store key in list: ' + error + '\n........Check also whether entity exists!');
        }
    }

    /**
     * @deprecated The method should not be used since key pairs are stored in the secret-vault
     */
    getGlobalKeyListElement(entity: entities, fac: facilities, role: roles, index: number) {
        try {
            if(index === -1) {
                index = (this.globalKeyList[entity][fac][role]).length-1;
            }
            // this.MyLogger.warn('going to get:' + JSON.stringify(this.globalKeyList[entity][fac][role][index], null, 4) + '\n...........length = ' + (this.globalKeyList[entity][fac][role]).length + '\n...........index = ' + index);
            return this.globalKeyList[entity][fac][role][index];
        } catch (error) {
            this.MyLogger.error('Could not get keyPair element for [' + entity +', ' + index + '(' + role + ')], error: ' + error);
            this.MyLogger.error('Lengths are: ' + this.globalKeyList[entity][0].length + ' (producer) and ' + this.globalKeyList[entity][1].length + ' (consumer)')
        }
    }

}
