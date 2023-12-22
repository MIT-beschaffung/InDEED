const config = require('./config.json');
const { configure, getLogger } = require ("log4js");
const { MerkleTree } = require('merkletreejs');
const SHA256 = require('crypto-js/sha256');
import {MerkleTrees} from "./MerkleTreeLogic";
import {Signatures} from "./Signatures";

const LOGGER = getLogger()
LOGGER.level = config.log_level

var leafBD1 = { name: "Asset 1", kwH: 50, location: "Bayreuth"};
var leafBD2 = { name: "Asset 2", kwH: 20, location: "München"};
var leafBD3 = { name: "Asset 3", kwH: 100, location: "Nürnberg"};

async function test(){

    const merkleLogic = new MerkleTrees("BasicMerkleTree");

        var leavesArray = [leafBD1, leafBD2, leafBD3];
        LOGGER.info("Leavesarray" + leavesArray);

        //signing every Data of the array --> should usually be, before we get the data
        var signedArray = await createSignedArray(leavesArray);
        LOGGER.info("Signed Array: " + signedArray);

        //creation of a merkle tree with signed data
        const merkleTree = await merkleLogic.createMerkleTree(signedArray);
        LOGGER.info("Creation of Merkle Tree done.");

        //checking for the existence of a leaf
        const leaf = SHA256(signedArray[0]);
        LOGGER.info("Checking for this leaf: " + leaf);

        const root = await merkleTree.getRoot().toString('hex');
        const proof = await merkleLogic.getProof(merkleTree, leaf);
        LOGGER.info("Creation of Proof done.");

        var verification = new Boolean(await merkleLogic.verifyProof(proof, leaf, root));
        MyLogger.debug("Verification:" + verification)

    }

    async function createSignature(objectToSign) {

            const signature = new Signatures("BasicSignatures", 8546);

            var JSONMessage = JSON.stringify(objectToSign);
            MyLogger.debug(JSONMessage);

            var ethAccount = await signature.createAccount();
            var ethAddress = (ethAccount["address"]).toLowerCase();
            var ethPrivKey = ethAccount["privateKey"];

            LOGGER.info(JSON.stringify(ethAccount));

            var signedMessage = await signature.createSignedJSON(JSONMessage, ethAddress);

            var verified = await signature.verifyJSON(signedMessage, ethAddress);
            MyLogger.debug(verified);

            return signedMessage;


    }

    async function createSignedArray(arrayToSign) {
            var signedArray = new Array();

            for (var i = 0; i < arrayToSign.length; i++){
            MyLogger.debug("Elements in array: " + arrayToSign[i]);

            signedArray.push(await createSignature(arrayToSign[i]));
            }

            MyLogger.debug("Array with signed elements: " + signedArray);
            return signedArray;
    }


async function main() {
        test().then(function() {
            LOGGER.info("Done.")
        }).catch(function(err) {
            LOGGER.error(err)
        })
    }

main();