import {merkleProofDto} from "./merkleProof.dto";
import {merkleLemmaElementDto} from "./merkleLemmaElement.dto";
import {merkleProofForObjectDto} from "./merkleProofForObject.dto";

const { poseidonHash, poseidonCircomlibPass } = require("./poseidonHash");

export class merkleTreeVerificationResult {

    private status: boolean;
    private reason: string;

    constructor(status: boolean, reason: string) {
        this.status = status;
        this.reason = reason;
    }

    public getStatus(): boolean {
        return this.status;
    }

    public getReason(): string {
        return this.reason;
    }

}

/**
 * Simple Merkle tree utils implementation using the Poseidon hash
 */
export class PoseidonMerkleUtils {

    private leaves: string[];
    private depth: number;
    private data: string[];
    private root: string;

    constructor () {}

    /**
     * Checks whether the input is a power of two
     * Returns true if the input is a power of two
     * @param n
     */
    isPowerOfTwo(n: number): boolean {
        if(n == 0) return false;
        while(n % 2 == 0){
            n = n/2
        }
        return n === 1
    };

    /**
     * Builds a Merkle tree from the inputs with the Poseidon hashing algorithm
     * @param inputs
     */
    generateTree(inputs: string[], inputType: string): object {

        //console.log("Generating tree from inputs");
        let leaves: string[] = [];
        let data: string[] = [];

        if (inputs.length < 1 || ! this.isPowerOfTwo(inputs.length)) throw "Number of leaves must be a power of two";
        //console.log("Input type: " + inputType);
        if (inputType == "String") {
            //console.log("Hashing the leaves initially");
            inputs.forEach(input => {
                leaves.push(this.leafHash(input));
            });
        } else if (inputType == "Number") {
            //console.log("Skipping leaf hashing as they already represent numbers");
            inputs.forEach(input => {
                leaves.push(input);
            });
        } else {
            throw "Unknown input type for Poseidon Merkle tree construction"
        }

        //console.log("Leaves: " + leaves);

        leaves.forEach(leaf => {
            data.push(leaf);
        });

        let width = leaves.length;
        width >>= 1;
        let offset = 0;
        while (width > 0) {
            for (let i = 0; i < width; i++) {
                let j = 2 * i + offset;
                //console.log("Hashing " + data[j] + " and " + data[j+1]);
                data.push(this.nodeHash(data[j], data[j + 1]));
            }
            offset += width * 2;
            width >>= 1;
        }

        this.depth = leaves.length.toString(2).length + 1;
        //console.log("Depth: " + this.depth);
        this.leaves = leaves;
        this.data = data;
        this.root = data[data.length-1];

        //console.log(this.data);
        return data
    }

    /**
     * Hashes a pair of values with the Poseidon hash
     * @param left
     * @param right
     */
    nodeHash(left: string, right: string): string {
        return poseidonHash([left, right]);
    }

    /**
     * Hashes a leaf initially
     * @param leaf
     */
    leafHash(leaf: string): string {
        return poseidonHash([leaf]);
    }

    /**
     * Returns the Merkle tree
     */
    getTree(): string[] {
        return this.data;
    }

    /**
     * Returns the root corresponding to the Merkle tree
     */
    getRoot(): string {
        return this.root;
    }

    /**
     * Returns the leaf with index @param index
     * @param index
     */
    getLeaf(index: number): string {
        return this.data[index];
    }

    /**
     * Returns all reaves
     */
    getLeaves(): string[] {
        return this.leaves;
    }

    /**
     * Returns all tree data
     */
    getData(): string[] {
        return this.data;
    }

    /**
     * Builds a merkle proof
     * @param index {Number}
     * @returns {Proof}
     */
    getProof(index: number): merkleProofDto {

        if (this.leaves.length <= index) throw "No valid index";

        let path = new Array(this.depth).fill(0);
        let base2 = (index).toString(2);
        for (let i = 0; i < base2.length; i++) {
            path[i] = Number(base2[base2.length - i - 1]);
        }
        let lem = [this.data[index]];
        let offset = 0;
        let pos = index;
        let width = this.leaves.length;
        for (let i = 0; i < this.depth-2; i++) {
            if (path[i] == 1) {
                lem.push(this.data[offset + pos - 1]);
            } else if (path[i] == 0) {
                lem.push(this.data[offset + pos + 1]);
            } else if (typeof(path[i] == undefined)) {
                path[i] = -1;
            }
            pos >>= 1;
            offset += width;
            width >>= 1;
        }
        let lemma: merkleLemmaElementDto[] = [];
        let leaf = this.data[index];
        for (let i = 0; i < lem.length; i++) {
            let temp = new merkleLemmaElementDto(path[i], lem[i]);
            lemma.push(temp);
        }

        return new merkleProofDto(this.root, lemma, leaf);

    }

    /**
     * Verifies a Merkle proof with the Poseidon hashing algorithm
     * @param proof
     */
    verifyProof(proof: merkleProofDto): merkleTreeVerificationResult {

        let path = this.extractPath(proof.getLemma());
        let data = this.extractData(proof.getLemma(), proof.getRoot());
        let hash = data[0];
        if (proof.getLeaf() !== data[0]) {
            //console.log("leaf does not match lemma");
            return new merkleTreeVerificationResult(false, "Leaf is not consistent with lemma");
        }
        for (let i = 0; i < path.length; i++) {
            let oldHash = hash;
            if (path[i]) {
                hash = this.nodeHash(data[i + 1], hash);
                //console.log("Hashing " + data[i+1] + " and " + oldHash + " => " + hash);
            } else {
                hash = this.nodeHash(hash, data[i + 1]);
                //console.log("Hashing " + oldHash + " and " + data[i+1] + " => " + hash);
            }
        }
        //console.log("Final hash: " + hash);
        let status = (hash === proof.getRoot());
        if (status) {
            return new merkleTreeVerificationResult(status, "All fine");
        } else
            return new merkleTreeVerificationResult(status, "Lemma is not consistent with root")
    }

    /**
     * Extracts the sequence of hashes from merkleLemmaElementDto
     * @param lemma
     * @param root
     */
    extractData(lemma: merkleLemmaElementDto[], root: string): string[] {
        let lem: string[] = [];
        for (let i = 0; i < lemma.length; i++){
            lem.push(lemma[i].data);
        }
        lem.push(root);
        return lem;
    }

    /**
     * Extracts the sequence of positions from merkleLemmaElementDto
     * @param lemma
     */
    extractPath(lemma: merkleLemmaElementDto[]): string[] {
        let path = [];
        for (let i = 0; i < lemma.length - 1; i++){
            path.push(Number(lemma[i].position));
        }
        return path;
    }

    poseidonHashFunction(input: string[]): string {
        return poseidonHash(input);
    }

    poseidonCircomlibFunction(input: any[]): bigint {
        return poseidonCircomlibPass(input);
    }

}