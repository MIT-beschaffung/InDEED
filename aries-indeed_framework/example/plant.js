"use strict";
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
exports.__esModule = true;
var config = require('../config.json');
var config_example = require('./config_example.json');
var log4js_1 = require("log4js");
var indeedAriesClient_1 = require("../indeedAriesClient");
var commuicationBesideAriesHandler_1 = require("./commuicationBesideAriesHandler");
var _a = require('events'), once = _a.once, on = _a.on, EventEmitter = _a.EventEmitter;
var LOGGER = log4js_1.getLogger();
LOGGER.level = config.log_level;
var nodeType = indeedAriesClient_1.IndeedNodeType.PLANT;
function test() {
    return __awaiter(this, void 0, void 0, function () {
        var communicationHandler, indeedAriesClient, didInfo, resp_nym_register, resp_public_did, invitation_tuev, resp_receive_tuev_invitation, tuevConnectionID, issue_attributes, resp_invitation_creation, invitation_evu, evuConnectionID, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    communicationHandler = new commuicationBesideAriesHandler_1.CommuicationBesideAriesHandler(nodeType);
                    indeedAriesClient = new indeedAriesClient_1.IndeedAriesClient(nodeType, "http://" + config.agent_url + ":8006", "http://" + config.base_url, "http://" + config.ledger_url, 8101, nodeType, config.log_level);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 17, 18, 19]);
                    communicationHandler.startExpressApp();
                    return [4 /*yield*/, indeedAriesClient.startGethClient(8545)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, indeedAriesClient.create_did()];
                case 3:
                    didInfo = _a.sent();
                    LOGGER.info("PLANT: DID Info: " + JSON.stringify(didInfo));
                    return [4 /*yield*/, communicationHandler.sendMessage(indeedAriesClient_1.IndeedNodeType.BNA, commuicationBesideAriesHandler_1.CommunicationType.NYM_REGISTER_REQUEST, {
                            "didInfo": didInfo,
                            "node": nodeType
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, communicationHandler.waitTillEventEmitted(commuicationBesideAriesHandler_1.CommunicationType.NYM_REGISTER_RESPONSE)];
                case 5:
                    resp_nym_register = _a.sent();
                    return [4 /*yield*/, indeedAriesClient.set_public_did(didInfo['did'])];
                case 6:
                    resp_public_did = _a.sent();
                    LOGGER.info("PLANT: DID public: " + JSON.stringify(resp_public_did));
                    return [4 /*yield*/, communicationHandler.waitTillEventEmitted(commuicationBesideAriesHandler_1.CommunicationType.CONN_INVITATION)];
                case 7:
                    invitation_tuev = _a.sent();
                    return [4 /*yield*/, indeedAriesClient.receive_invitation(invitation_tuev["body"], true)];
                case 8:
                    resp_receive_tuev_invitation = _a.sent();
                    LOGGER.info("PLANT: Receive Invitation " + JSON.stringify(resp_receive_tuev_invitation));
                    tuevConnectionID = resp_receive_tuev_invitation["connection_id"];
                    return [4 /*yield*/, indeedAriesClient.waitTillConnectionActive(tuevConnectionID)];
                case 9:
                    _a.sent();
                    LOGGER.info("Connection Tuev Plant established");
                    issue_attributes = indeedAriesClient.create_issue_attributes();
                    return [4 /*yield*/, communicationHandler.sendMessage(indeedAriesClient_1.IndeedNodeType.TUEV, commuicationBesideAriesHandler_1.CommunicationType.ISSUE_ATTRIBUTES, issue_attributes)];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, indeedAriesClient.waitTillCredentialXchangeAckedWithConnectionID(tuevConnectionID)];
                case 11:
                    _a.sent();
                    LOGGER.info("Credential issued to plant");
                    return [4 /*yield*/, indeedAriesClient.create_invitation(true, false, false)];
                case 12:
                    resp_invitation_creation = _a.sent();
                    LOGGER.info("PLANT: Created Invitation");
                    invitation_evu = resp_invitation_creation["invitation"];
                    evuConnectionID = resp_invitation_creation["connection_id"];
                    return [4 /*yield*/, communicationHandler.sendMessage(indeedAriesClient_1.IndeedNodeType.EVU, commuicationBesideAriesHandler_1.CommunicationType.CONN_INVITATION, invitation_evu)];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, indeedAriesClient.waitTillConnectionActive(evuConnectionID)];
                case 14:
                    _a.sent();
                    LOGGER.info("Connection EVU Plant established");
                    //Connection established
                    //Proof Request
                    return [4 /*yield*/, indeedAriesClient.waitTillPresentationVerifiedWithConnectionID(evuConnectionID)];
                case 15:
                    //Connection established
                    //Proof Request
                    _a.sent();
                    LOGGER.info("Credential verified");
                    //Proof finished
                    //Basic Message
                    return [4 /*yield*/, indeedAriesClient.sendIndeedMesssage(evuConnectionID, "Hey EVU Whaats uuuuup")];
                case 16:
                    //Proof finished
                    //Basic Message
                    _a.sent();
                    LOGGER.info("Message sending successful");
                    return [3 /*break*/, 19];
                case 17:
                    err_1 = _a.sent();
                    LOGGER.error(err_1);
                    return [3 /*break*/, 19];
                case 18:
                    indeedAriesClient.stop();
                    communicationHandler.stopExpressApp();
                    return [7 /*endfinally*/];
                case 19: return [2 /*return*/];
            }
        });
    });
}
function _execShellCommand(cmd) {
    var exec = require('child_process').exec;
    return new Promise(function (resolve, reject) {
        exec(cmd, function (error, stdout, stderr) {
            if (error) {
                console.warn(error);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}
function main() {
    test().then(function () {
        LOGGER.info("Done.");
    })["catch"](function (err) {
        LOGGER.error(err);
    });
}
main();
