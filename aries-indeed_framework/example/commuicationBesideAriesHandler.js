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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommuicationBesideAriesHandler = exports.CommunicationType = void 0;
var express = require("express");
var bodyParser = require("body-parser");
var log4js = require("log4js");
var rxjs_1 = require("rxjs");
var needle = require("needle");
var EventEmitter = require('events').EventEmitter;
var config_example = require('./config_example.json');
var indeedAriesClient_1 = require("../indeedAriesClient");
var CommunicationType;
(function (CommunicationType) {
    CommunicationType["NYM_REGISTER_REQUEST"] = "nym_register_request";
    CommunicationType["NYM_REGISTER_RESPONSE"] = "nym_register_response";
    CommunicationType["CONN_INVITATION"] = "connection_invitation";
    CommunicationType["CREDENTIAL_DEFINITION_REQUEST"] = "credential_definition_request";
    CommunicationType["CREDENTIAL_DEFINITION_RESPONSE"] = "credential_definition_response";
    CommunicationType["ISSUE_ATTRIBUTES"] = "issue_attributes";
})(CommunicationType = exports.CommunicationType || (exports.CommunicationType = {}));
var CommuicationBesideAriesHandler = /** @class */ (function () {
    function CommuicationBesideAriesHandler(nodeType, logLevel) {
        if (logLevel === void 0) { logLevel = "info"; }
        this.logger = log4js.getLogger();
        this.logger.level = logLevel;
        this.node = nodeType;
        this.logger.info(this.node);
        this.port = config_example[nodeType].communication_port;
        this.app = express();
        this.communicationSubject = new rxjs_1.Subject();
        this.communicationEvent = new EventEmitter();
        this.initializeExpressApp();
    }
    /**
     * Starts aries handler so it can receive webhooks.
     */
    CommuicationBesideAriesHandler.prototype.startExpressApp = function () {
        // Start express on the defined port
        this.server = this.app.listen(this.port);
        this.logger.info("\uD83D\uDE80 Communication Server running on port " + this.port);
    };
    CommuicationBesideAriesHandler.prototype.stopExpressApp = function () {
        // Stop express application
        this.server.close();
        this.logger.info("\uD83D\uDEECCommunication Server stopped.");
    };
    CommuicationBesideAriesHandler.prototype.initializeExpressApp = function () {
        var _this = this;
        this.app.use(bodyParser.json());
        this.app.post("/communication/", function (req, res) {
            var topic = req.query.topic;
            var sender = indeedAriesClient_1.IndeedNodeType[req.query.node];
            _this.logger.info("Got new Post:" + JSON.stringify(req.query));
            if (Object.values(CommunicationType).includes(topic)) {
                _this.communicationEvent.emit(topic, req.body, sender);
                _this.communicationSubject.next({
                    topic: topic,
                    body: req.body,
                    sender: sender
                });
                _this.logger.info(topic);
                res.status(200).end(); // Responding is important
            }
            else {
                _this.logger.error("Unknown topic");
                res.status(504).end();
            }
        });
    };
    CommuicationBesideAriesHandler.prototype._post = function (url, body) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.logger.debug("URL for _post: " + url);
                this.logger.debug("Body for _post: " + JSON.stringify(body));
                // Call agent.
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        needle.post(url, body, { json: true, headers: {} }, function (err, res) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                if (res.statusCode == 200 || res.statusCode == 201) {
                                    //console.log(res.body)
                                    resolve(res.body);
                                }
                                else {
                                    _this.logger.error(res.statusCode);
                                    reject(res.body);
                                }
                            }
                        });
                    })];
            });
        });
    };
    CommuicationBesideAriesHandler.prototype.sendMessage = function (node, topic, body) {
        if (body === void 0) { body = ""; }
        return __awaiter(this, void 0, void 0, function () {
            var path;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = config_example[node].url + ":" + config_example[node].communication_port + "/communication/?topic=" + topic + "&node=" + this.node;
                        this.logger.info(path);
                        return [4 /*yield*/, this._post(path, body)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    CommuicationBesideAriesHandler.prototype.waitTillEventEmitted = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.communicationEvent.once(event, function (body, sender) {
                            _this.logger.info("Caught event: " + event);
                            _this.communicationEvent.setMaxListeners(Math.max(_this.communicationEvent.getMaxListeners() - 1, 0));
                            _this.logger.debug(body);
                            resolve({
                                "body": body,
                                "sender": sender
                            });
                        });
                    })];
            });
        });
    };
    return CommuicationBesideAriesHandler;
}());
exports.CommuicationBesideAriesHandler = CommuicationBesideAriesHandler;
