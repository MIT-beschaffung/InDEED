var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var config = require('./config.json');
var _a = require("log4js"), configure = _a.configure, getLogger = _a.getLogger;
var MerkleTree = require('merkletreejs').MerkleTree;
var SHA256 = require('crypto-js/sha256');
var LOGGER = getLogger();
LOGGER.level = config.log_level;
var MerkleTrees = /** @class */ (function () {
    function MerkleTrees(name) {
        this.name = name;
    }
    MerkleTrees.prototype.hashLeavesArray = function (leavesArray) {
        return __awaiter(this, void 0, void 0, function () {
            var hashedArray;
            return __generator(this, function (_a) {
                hashedArray = leavesArray.map(SHA256);
                LOGGER.info("Hashed Array " + hashedArray);
                return [2 /*return*/, hashedArray];
            });
        });
    };
    return MerkleTrees;
}());
function createMerkleTree(leavesArray) {
    return __awaiter(this, void 0, void 0, function () {
        var hashedArray, merkleTree, root;
        return __generator(this, function (_a) {
            hashedArray = leavesArray.map(SHA256);
            merkleTree = new MerkleTree(hashedArray, SHA256);
            root = merkleTree.getRoot().toString('hex');
            LOGGER.info("Root: ", root);
            MerkleTree.print(merkleTree);
            return [2 /*return*/, merkleTree];
        });
    });
}
//getProof global, sodass ohne tree aufrufbar
function getProof(tree, leaf) {
    return __awaiter(this, void 0, void 0, function () {
        var proof;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tree.getProof(leaf)];
                case 1:
                    proof = _a.sent();
                    MyLogger.debug("Proof: " + proof);
                    return [2 /*return*/, proof];
            }
        });
    });
}
function verifyProof(proof, leaf, root) {
    return __awaiter(this, void 0, void 0, function () {
        var emptyArray, hashedArray, emptyTree, verification;
        return __generator(this, function (_a) {
            emptyArray = ['a'];
            hashedArray = emptyArray.map(SHA256);
            emptyTree = new MerkleTree(hashedArray, SHA256);
            verification = new Boolean(emptyTree.verify(proof, leaf, root));
            MyLogger.debug("Verification:" + verification);
            return [2 /*return*/, verification];
        });
    });
}
function test() {
    return __awaiter(this, void 0, void 0, function () {
        var leafBD1, leafBD2, leafBD3, BDHash, leavesArray, merkleTree, leaf, root, proof, verification;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    leafBD1 = { name: "Asset 1", kwH: 50, location: "Bayreuth" };
                    leafBD2 = { name: "Asset 2", kwH: 20, location: "München" };
                    leafBD3 = { name: "Asset 3", kwH: 100, location: "Nürnberg" };
                    BDHash = SHA256(leafBD1);
                    LOGGER.info("BD Hash " + BDHash);
                    leavesArray = [leafBD1, leafBD2, leafBD3];
                    return [4 /*yield*/, createMerkleTree(leavesArray)];
                case 1:
                    merkleTree = _a.sent();
                    LOGGER.info("Creation of Merkle Tree done.");
                    leaf = SHA256('a');
                    LOGGER.info("Leaf " + leaf);
                    return [4 /*yield*/, merkleTree.getRoot().toString('hex')];
                case 2:
                    root = _a.sent();
                    return [4 /*yield*/, getProof(merkleTree, leaf)];
                case 3:
                    proof = _a.sent();
                    LOGGER.info("Creation of Proof done.");
                    verification = new Boolean(verifyProof(proof, leaf, root));
                    MyLogger.debug("Verification:" + verification);
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            test().then(function () {
                LOGGER.info("Done.");
            })["catch"](function (err) {
                LOGGER.error(err);
            });
            return [2 /*return*/];
        });
    });
}
