const config = require('./config.json');
const { configure, getLogger } = require ("log4js");
const { MerkleTree } = require('merkletreejs');
const SHA256 = require('crypto-js/sha256');

const LOGGER = getLogger()
LOGGER.level = config.log_level

export class MerkleTrees {

    constructor(name:string){
            }



    async hashLeavesArray(leavesArray){

        var hashedArray = leavesArray.map(x => SHA256(x));
        LOGGER.info("Hashed Array " + hashedArray);

        return hashedArray;
    }


    async createMerkleTree(leavesArray) {

        var hashedArray = leavesArray.map(x => SHA256(x));

        const merkleTree = new MerkleTree(hashedArray, SHA256);
        const root = merkleTree.getRoot().toString('hex');
        LOGGER.info("Root: ", root);
        MerkleTree.print(merkleTree);

        return merkleTree;
    }


    //getProof global, sodass ohne tree aufrufbar
    async getProof(tree, leaf) {

        const proof = await tree.getProof(leaf);
        MyLogger.debug("Proof: " + proof);

        return proof;
       }



    async verifyProof(proof, leaf, root){
        var emptyArray = ['a'];
        var hashedArray = emptyArray.map(SHA256);
        const emptyTree = new MerkleTree(hashedArray, SHA256);

        var verification = new Boolean(await emptyTree.verify(proof, leaf, root));
        MyLogger.debug("Verification in MerkleTreeLogic:" + verification)

        return verification;

    }



}



async function main() {

    var merkletree = new MerkleTrees("test");

    var leafBD1 = JSON.stringify({ name: "Asset 1", kwH: 50, location: "Bayreuth"});
    var leafBD2 = JSON.stringify({ name: "Asset 2", kwH: 20, location: "München"});
    var leafBD3 = JSON.stringify({ name: "Asset 3", kwH: 100, location: "Nürnberg"});

    var leavesArray = [leafBD1, leafBD2, leafBD3];
    LOGGER.info("Leavesarray" + leavesArray);

    var createdmerkletree = await merkletree.createMerkleTree(leavesArray)
        LOGGER.info("hashed leaves.")

    const buf = await leavesArray.map(x => SHA256(x))[0];

    var SHAleaf1 = SHA256(leafBD1)
    var  SHAleaf2 = SHA256(leafBD2)


    LOGGER.info("this is one " + SHAleaf1 + " and this two: " + SHAleaf2);


    var proof = await merkletree.getProof(createdmerkletree, buf);
    LOGGER.info("this is the proof:" + proof)
    LOGGER.info("this is the buf:" + buf)
    proof.forEach(p=>LOGGER.info(p));

    const root = createdmerkletree.getRoot().toString('hex');

    var verify = merkletree.verifyProof(proof, leafBD1, root);
    LOGGER.info("verification" + verify)
}

main();

