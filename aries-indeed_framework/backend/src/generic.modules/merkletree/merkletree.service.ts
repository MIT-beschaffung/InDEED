import { merkleProofDto } from './merkleProof.dto';
import { merkleProofForObjectDto } from './merkleProofForObject.dto';
import { merkleLemmaElementDto } from './merkleLemmaElement.dto';

import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { Injectable } from '@nestjs/common';

import {merkleTreeVerificationResult, PoseidonMerkleUtils} from './poseidonMerkleUtils'
import { poseidonInputTypes } from "./poseidonInputTypes.enum";

// importing Merkle and hashing libraries
const SHA256 = require('crypto-js/sha256');
const { poseidonHash } = require("./poseidonHash");
import { MerkleTree } from 'merkletreejs';
const { canonicalize } = require('json-canonicalize');


//TODO Use this instead of manually specifying the hash string
export enum hashingAlgorithms {
    SHA256 = 'SHA256',
    POSEIDON = 'POSEIDON'
}

/*
console.log(new PoseidonMerkleUtils().generateTree(["0", "1", "2", "3", "4", "5", "6", "7"], "Number"));
let tree = new PoseidonMerkleUtils();
tree.generateTree(["0", "1", "2", "3", "4", "5", "6", "7"], "Number");
console.log(tree.getProof(1));
console.log(tree.getProof(1).getLemma());
 */

class MerkleTreeDto {

    private root: string;
    private leaves: string[];
    private data: string[];

     constructor(
         root: string,
         leaves: string[],
         data: string[]
     ){
         this.root = root;
         this.leaves = leaves;
         this.data = data;
     }

     public getRoot(): string {
         return this.root;
     }

     public setRoot(root: string) {
         this.root = root;
     }

     public getLeaves(): string[] {
         return this.leaves;
     }

     public setLeaves(leaves: string[]) {
         this.leaves = leaves;
     }

    public getData(): string[] {
        return this.data;
    }

    public setData(data: string[]) {
        this.data = data;
    }

}

@Injectable()
/**
 * A class that can be used to create Merkle trees and Merkle proofs and to verify Merkle proofs
 * Currently there is support for SHA256 and Poseidon as hashing algorithms
 */
export class MerkleTreeService {

    constructor(
        private MyLogger: MyLogger
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * Hashes the given JSON object with the assigned hashing algorithm
     * Set the hashing algorithm with 'setHashingAlgorithm'
     * @param jsonObject The JSON you want to hash
     * @returns the hash
     */
    public hashObject(jsonObject: object, hashingAlgorithm: string): string {
        const canonicalizedObject = canonicalize(jsonObject);
        //this.MyLogger.debug("Canonicalized object: " + canonicalizedObject);

        if (hashingAlgorithm == "SHA256") {

            const output = SHA256(canonicalizedObject);
            //this.MyLogger.debug("Hash of canonicalization: " + output);

            return output;

        } else if (hashingAlgorithm == "POSEIDON") {

            this.MyLogger.error("hashObject not yet supported for Poseidon")

        }
    }

    public hashArray(input: string[], hashingAlgorithm: string): string {

        if (hashingAlgorithm == "POSEIDON") {

            try {
                const output = poseidonHash(input);
                this.MyLogger.debug("Hash of " + input + ": " + output);

                return output
            } catch (err) {
                this.MyLogger.error("Maybe too long?");
                this.MyLogger.error(err);
            }

        }

    }

    /**
     * Takes array of hashes as input and builds the merkleTree (which it returns)
     * @param hashArray: string[] with valid hashes (SHA256 at the moment)
     * @returns the merkleTreeObject
     */
    public buildMerkleTreeFromHashArray(hashArray: string[], hashingAlgorithm: string): MerkleTreeDto {

        if (hashingAlgorithm == "SHA256") {

            //this.MyLogger.debug("Using SHA256 as hashing algorithm");
            const merkleTree = new MerkleTree(hashArray, SHA256);

            //this.MyLogger.debug('Built Merkle tree: ');
            //this.MyLogger.debug(merkleTree.toString());

            return new MerkleTreeDto(merkleTree.getHexRoot(), merkleTree.getHexLeaves(), merkleTree.getHexLayers());

        } else if (hashingAlgorithm == "POSEIDON") {

            //this.MyLogger.debug("Using Poseidon as hashing algorithm")
            const merkleTree = new PoseidonMerkleUtils();
            merkleTree.generateTree(hashArray, "Number");
            //this.MyLogger.debug("Built Merkle tree: ");
            //this.MyLogger.debug(JSON.stringify(merkleTree));

            return new MerkleTreeDto(merkleTree.getRoot(), merkleTree.getLeaves(), merkleTree.getData());

        } else {
            this.MyLogger.error("Unknown Hashing Algorithm");
            throw Error("Unknown hashing algorithm")
        }
    }

    /**
     * Takes array of objects as input and returns corresponding Merkle tree
     * @param objectArray from which you want to build the Merkletree
     * @returns  the merkleTreeObject
     */
    private buildMerkleTreeFromObjectArray(objectArray: object[], hashingAlgorithm: string): object {
        const hashArray: string[] = [];

        objectArray.forEach((object) => {
            hashArray.push(this.hashObject(object, hashingAlgorithm));
        });

        return this.buildMerkleTreeFromHashArray(hashArray, hashingAlgorithm);
    }

    /**
     * returns an array of Merkle proofs corresponding to an array of hashes
     * @param hashArray Array of valid SHA256 hashes
     * @returns an array of proofObjects
     */
    public buildMerkleProofsFromHashArray(
        hashArray: string[],
        hashingAlgorithm: string
    ): merkleProofDto[] {

        this.MyLogger.debug("Getting Merkle proofs for data with " + hashingAlgorithm + " as hashing algorithm");

        if (hashingAlgorithm == "SHA256") {
            const merkleTree = new MerkleTree(hashArray, SHA256);
            const bufferedLeaves = merkleTree.getLeaves();
            const leaves: string[] = [];
            bufferedLeaves.forEach((element) => {
                leaves.push(element.toString('hex'));
            });

            const root = merkleTree.getRoot().toString('hex');

            this.MyLogger.debug(
                'Created Merkle tree from JSON array with root ' +
                root +
                ' and leaves ' +
                leaves.toString()
            );
            //logger.debug("Checking if leaves coincide with the hash array: " + (JSON.stringify(leaves) == JSON.stringify(hashArray)));

            const merkleProofs: merkleProofDto[] = [];

            leaves.forEach((leaf) => {
                const lemma = merkleTree.getProof(leaf);
                const merkleLemma: merkleLemmaElementDto[] = [];

                lemma.forEach((element) => {
                    const merkleLemmaElement: merkleLemmaElementDto = new merkleLemmaElementDto(
                        '',
                        '',
                    );
                    merkleLemmaElement.setPosition(element.position);
                    merkleLemmaElement.setData(element.data.toString('hex'));
                    merkleLemma.push(merkleLemmaElement);
                });

                const proof: merkleProofDto = new merkleProofDto(
                    root,
                    merkleLemma,
                    leaf,
                );

                merkleProofs.push(proof);
            });
            this.MyLogger.debug(
                'Created Merkle proofs for every leaf: ' +
                JSON.stringify(merkleProofs),
            );

            return merkleProofs;

        } else if (hashingAlgorithm == "POSEIDON") {

            const merkleTree = new PoseidonMerkleUtils();
            merkleTree.generateTree(hashArray, "Number");

            const merkleProofs: merkleProofDto[] = [];

            for (let index = 0; index < hashArray.length; index++) {
                merkleProofs.push(merkleTree.getProof(index));
                //console.log(JSON.stringify(merkleProofs[index]));
            }

            return merkleProofs
        }
    }


    /**
     * returns an array of Merkle proofs corresponding to an array of objects
     * @param objects: Object array for which you want to build a merkleTree and get the corresponding proofs|lemmas
     * @returns
     */
    public buildMerkleProofsFromObjectArray(
        objects: object[],
        hashingAlgorithm: string
    ): merkleProofForObjectDto[] {

        if (hashingAlgorithm == "SHA256") {
            const hashArray: string[] = [];
            objects.forEach((element) => {
                this.MyLogger.debug('hashing this object: ' + element);
                hashArray.push(this.hashObject(element, hashingAlgorithm).toString());
            });
            this.MyLogger.debug(
                'Created hash array from JSON array: ' + JSON.stringify(hashArray),
            );

            const merkleProofs: merkleProofDto[] = this.buildMerkleProofsFromHashArray(
                hashArray,
                hashingAlgorithm
            );
            const merkleProofsForObjects: merkleProofForObjectDto[] = [];

            this.MyLogger.debug(JSON.stringify(objects));
            for (let i = 0; i < objects.length; i++) {
                this.MyLogger.debug(JSON.stringify(objects[i]));
                this.MyLogger.debug(JSON.stringify(merkleProofs[i]));
                merkleProofsForObjects.push(
                    new merkleProofForObjectDto(merkleProofs[i], objects[i]),
                );
            }

            return merkleProofsForObjects;

        } else {

            this.MyLogger.error("Hashing objects is not supported currently with Poseidon");
            throw "Not supported"
        }
    }

    /**
     * verifies a Merkle proof
     * @param merkleProof
     * @returns
     */
    public verifyMerkleProof(merkleProof: merkleProofDto, hashingAlgorithm: string): boolean {

        if (hashingAlgorithm == "SHA256") {

            this.MyLogger.debug("Verifying Merkle proof with SHA256")

            const root: string = merkleProof.getRoot();
            const leaf: string = merkleProof.getLeaf();
            const lemma: merkleLemmaElementDto[] = merkleProof.getLemma();

            const lem = [];

            lemma.forEach((element) => {
                lem.push({
                    position: element.position,
                    data: Buffer.from(element.data, 'hex'),
                });
            });

            this.MyLogger.debug('Converted lemma: ' + JSON.stringify(lem));
            this.MyLogger.debug('Original lemma: ' + JSON.stringify(lemma));

            const merkleTree = new MerkleTree([], SHA256);
            return merkleTree.verify(lemma, leaf, root);

        } else if (hashingAlgorithm == "POSEIDON") {

            this.MyLogger.debug("Verifying Merkle proof with Poseidon");

            const merkleTree = new PoseidonMerkleUtils();
            let res: merkleTreeVerificationResult = merkleTree.verifyProof(merkleProof);

            if (res.getStatus() == true) {
                this.MyLogger.debug("Merkle proof is valid");
                return true;
            } else {
                this.MyLogger.debug("Merkle proof is invalid");
                this.MyLogger.debug(res.getReason());
                return false;
            }

        } else {

            this.MyLogger.error("Unknown hashing algorithm");
            throw "Unknown hashing algorithm";

        }
    }

    /**
     * verifies a Merkle proof for an object
     * @param merkleProofForObject
     * @param hashingAlgorithm
     * @returns
     */
    public verifyMerkleProofForObject(
        merkleProofForObject: merkleProofForObjectDto,
        hashingAlgorithm: string
    ): boolean {

        if (hashingAlgorithm == "SHA256") {

            this.MyLogger.debug('Merkle proof: ');
            this.MyLogger.debug(JSON.stringify(merkleProofForObject.getMerkleProof()));
            const merkleProofValid = this.verifyMerkleProof(
                merkleProofForObject.getMerkleProof(),
                hashingAlgorithm
            );
            this.MyLogger.debug('Merkle proof is ' + merkleProofValid);

            const connectionValid =
                merkleProofForObject.getMerkleProof().getLeaf() ==
                this.hashObject(merkleProofForObject.getData(), hashingAlgorithm);
            this.MyLogger.debug(
                'Connection between object and leaf is ' + connectionValid,
            );

            return merkleProofValid && connectionValid;

        } else if (hashingAlgorithm == "POSEIDON") {

            this.MyLogger.error("verifyMerkleProofForObject not yet supported with Poseidon");
        }
    }


    /*
  // Intermediate function for testing only
  public createObjectArray():object[] {

    let leafArray: object[] = [{
    name: 'Alex',
    age: 20
    },
    {
    name: 'Bob',
    age: 21
    },
    {
    name: 'Charlie',
    age: 20
    },
    {
    name: 'Charles',
    age: 20
    }];

    return leafArray;
  }
  */

    /*
  // Hier können wir mMn einfach die default-Functions der library nehmen
  // genauso wie für verify-Funktionen?
  public getMerkleProofForHash(hashValue:string,merkleTree:object):object {

    let givenMerkleTree:object = merkleTree;

    let lemma:object = MerkleTree.getProof(hashValue,givenMerkleTree);

    MyLogger.debug(lemma.toString());

    return lemma;
  }

  // Intermediate function for testing only
  public createHashArray():string[] {

    let leafArray: string[] = [];
    let i = 0;

    while (i < 16) {
      let intermediateVar = canonicalize("someString" + i);
      leafArray[i] = SHA256(intermediateVar);
      // MyLogger.debug(leafArray[i]);
      i++;
    }

    return leafArray;
  }
  */
}

