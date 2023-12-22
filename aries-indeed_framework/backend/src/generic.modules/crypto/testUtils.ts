export {};

import { PoseidonMerkleUtils } from 'src/generic.modules/merkletree/poseidonMerkleUtils';
import * as inputjson from "./input.json";
const { newKey , getPublicKey } = require("./key");
const { checkAscendingKeys, checkConsumerInputArray, checkProducerInputArray } = require("./checkInput");
const { signPoseidon, verifyPoseidon } = require("./eddsaUtils");
const fs = require('fs');

const merklePoseidonUtils = new PoseidonMerkleUtils();

export class TestUtils {

    constructor() {};

    testrun() {
        console.log("Running a test");
        //console.log(inputjson);
        createInputJson();

        ////////////
        // Check Inputs implementation
        ////////////

        for (let i in inputjson.consumers) {
            console.log(checkConsumerInputArray(inputjson.consumers[i], inputjson.starttime));
        }
        for (let i in inputjson.producers) {
            console.log(checkProducerInputArray(inputjson.producers[i], inputjson.starttime));
        }

        console.log(checkAscendingKeys(inputjson));

        function createInputJson() {
            let consumerArr = [];
            let cmax = 8;
            let producerArr = [];
            let pmax = 8;
            let ppMax = BigInt(Math.pow(2, 253) - 1);
            let starttime = Math.floor((Math.random() * 1642619400) + 1);

            let sKey;
            let pKey;
            let green;
            let grey;
            let time;
            let hashedVals;
            let signedVals;


            for (var i = 0; i < cmax; i++) {
                sKey = newKey();
                pKey = merklePoseidonUtils.poseidonCircomlibFunction(getPublicKey(sKey));
                green = i;
                grey = i * 2;
                time = Math.floor(Math.random() * 900) + starttime;

                consumerArr.push([pKey, green, grey, time]);
            }

            let sortedConsumers = consumerArr.sort((a, b) => {
                if (a[0] > b[0]) {
                    return 1;
                } else if (a[0] < b[0]) {
                    return -1;
                } else {
                    return 0;
                }
            });


            for (var i = 0; i < pmax; i++) {
                do {
                    sKey = newKey();
                    pKey = getPublicKey(sKey);
                } while (pKey[0] >= ppMax);
                green = i;
                grey = i * 2;
                time = Math.floor((Math.random() * 900) + 1) + starttime;
                hashedVals = merklePoseidonUtils.poseidonHashFunction([green, grey, time]);
                signedVals = signPoseidon(sKey, BigInt(hashedVals));

                producerArr.push([pKey[0], pKey[1], green, grey, time, signedVals.R8[0], signedVals.R8[1], signedVals.S]);
            }
            let sortedProducers = producerArr.sort((a, b) => {
                if (a[0] > b[0]) {
                    return 1;
                } else if (a[0] < b[0]) {
                    return -1;
                } else {
                    return 0;
                }
            });

            let input = {
                "starttime": starttime,
                "consumers": sortedConsumers,
                "producers": sortedProducers
            }

            console.log(input);

            try {
                fs.writeFileSync("./input.json", JSON.stringify(input, (_, v) => typeof v === 'bigint' ? v.toString() : v));
            } catch (err) {
                console.error(err);
            }

        }

        //////////
        // experiment with signing
        //////////


        let sKey = BigInt(newKey(1)).toString();
        let pKey = getPublicKey(sKey);
        console.log(pKey);

        let msg = ["7", "14", "3895230"];
        let msghashed = merklePoseidonUtils.poseidonHashFunction(msg);
        console.log(msghashed);
        let msgbuff = Buffer.from(msghashed.toString(), 'utf8');
        let msgsigned = signPoseidon(sKey, BigInt(msghashed));
        console.log(msgsigned);

        let verified = verifyPoseidon(msgbuff, msgsigned, pKey);

        console.log(verified);
    }
}
