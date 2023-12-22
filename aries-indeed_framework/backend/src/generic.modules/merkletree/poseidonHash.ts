import {poseidonInputTypes} from "./poseidonInputTypes.enum";

const { poseidonCircomlib } = require("./poseidonCircomlib");

const POSEIDON_MAX_LENGTH = 6;

/*
console.log("Checking a few Poseidon hashes");
console.log(poseidonCircomlib([0]));
console.log(poseidonCircomlib([1]));
console.log(poseidonCircomlib(["0"]));
*/

/**
 * Hashes input with poseidon hash function. If the input is a string that does not represent a number (including bigint),
 * it converts it to a byte array before
 * @param input {string[]} Stringified inputs
 * @returns {string} Finite field hash as stringified bigint
 */
function poseidonHash(input: string[]): string {
    let convertedInput = [];
    //console.log(input);
    //console.log(input.length);
    if (input.length > POSEIDON_MAX_LENGTH) throw "Max input length of Poseidon hash is 6";

    for (let i = 0; i < input.length; i++) {
        convertedInput = convertedInput.concat(convertInput(input[i], "Number"));
    }
    //console.log("Converted input: " + convertedInput);

    return poseidonCircomlib(convertedInput).toString();



    function convertInput(input: string, inputType: string): any {
        let inputArray;
        if (inputType == "Number") {
            return BigInt(input);
        } else if (inputType == "Number") {
            if (input.length === 0) return "";
            if (/^\d+$/.test(input)) {
                if (input.length > 20) { return BigInt(input); } else { return Number(input); }
            }
            inputArray = [];
            // UTF 16 le
            for (let i = 0; i < input.length; i++) {
                const code = input.charCodeAt(i);
                inputArray.push(code & 255, code >> 8);
            }
            // Thus the max input length of poseidon is a bigint array of 6 the string hashing must be in a chained way
            let firstEl = inputArray[0];
            const POSEIDON_MAX_LENGTH = 6;
            for (let i = 1; i < inputArray.length / POSEIDON_MAX_LENGTH; i++) {
                let input = [firstEl];
                for (let j = 0; j < POSEIDON_MAX_LENGTH - 1; j++) {
                    if (typeof inputArray[i * POSEIDON_MAX_LENGTH + j] != "undefined") {
                        input.push(inputArray[i * POSEIDON_MAX_LENGTH + j]);
                    }
                }
                firstEl = poseidonCircomlib(input);
            }
            return firstEl;
        } else {
            throw "Incorrect input type for Poseidon hash";
        }
    }
}

function poseidonCircomlibPass(inputs: any[]): bigint {
    return poseidonCircomlib(inputs);
}

module.exports = { poseidonHash, poseidonCircomlibPass };