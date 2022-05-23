"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Optipost = exports.OptipostSession = exports.OptipostRequest = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const events_1 = require("./events");
const crypto_1 = __importDefault(require("crypto"));
class OptipostRequest {
    constructor(req, res) {
        this._Dead = false;
        this._death = new events_1.BaseEvent();
        this.death = this._death.Event;
        this.request = req;
        this.response = res;
        this.KillTimestamp = Date.now() + 30000;
        this.Autostop = setTimeout(() => {
            this.Kill();
        }, 30000);
    }
    get Dead() { return this._Dead; }
    get dataType() {
        return (this.request.body || {}).type;
    }
    get data() {
        return (this.request.body || {}).data || {};
    }
    Kill() {
        this.Reply({
            type: "RequestKilled",
            data: {}
        });
    }
    Reply(data) {
        if (this._Dead) {
            throw new Error("Request already dead");
        }
        this.response.send(JSON.stringify(data));
        clearTimeout(this.Autostop);
        this._Dead = true;
    }
}
exports.OptipostRequest = OptipostRequest;
class OptipostSession {
    constructor() {
        this._Dead = false;
        this.Requests = [];
        this._message = new events_1.BaseEvent();
        this._death = new events_1.BaseEvent();
        this.message = this._message.Event;
        this.death = this._death.Event;
        this.id = crypto_1.default
            .randomBytes(10)
            .toString('hex');
        this.SetupAutoDisconnect();
    }
    get Dead() { return this._Dead; }
    /**
     * @description Closes the connection
     */
    Close() {
        if (!this.Dead) {
            this._Dead = true;
            this._death.Fire();
        }
    }
    /**
     *
     * @description Sends a message to the connected client.
     * @returns {boolean} True if data sent, false if there were no open requests to send it to
     *
     */
    Send(reply) {
        if (this.Requests[0]) {
            this.Requests[0].Reply(reply);
            return true;
        }
        else {
            console.warn(`WARN! DATA DROPPED AT ${Date.now()}`);
            return false;
        }
    }
    SetupAutoDisconnect() {
        if (!this.autoDisconnect) {
            this.autoDisconnect = setTimeout(() => {
                this.Close();
            }, 15000);
        }
    }
    InterpretNewRequest(req, res) {
        // Clear autoDisconnect timeout
        if (this.autoDisconnect) {
            clearTimeout(this.autoDisconnect);
        }
        let newRequest = new OptipostRequest(req, res);
        this.Requests.push(newRequest);
        // On death, find index and splice
        newRequest.death.then(() => {
            if (this.Requests.findIndex(e => e == newRequest) != -1) {
                this.Requests.splice(this.Requests.findIndex(e => e == newRequest), 1);
            }
            // Setup auto disconnect if requests is 0
            if (this.Requests.length == 0) {
                this.SetupAutoDisconnect();
            }
        });
    }
}
exports.OptipostSession = OptipostSession;
class Optipost {
    constructor(port = 3000, url = "opti") {
        this._connection = new events_1.BaseEvent();
        this.connections = [];
        this.connection = this._connection.Event;
        this.app = (0, express_1.default)();
        this.port = port;
        this.url = url;
        this.app.use(body_parser_1.default.json());
        this.app.get("/" + url, (req, res) => {
            res.send(`Optipost online`);
        });
        this.app.post("/" + url, (req, res) => {
            let body = req.body;
            // TODO: make this code not suck
            if (body.type && typeof body.data == typeof {}) {
                if (body.id) {
                    let Connection = this.connections.find(e => e.id == body.id);
                    // If connection is not dead
                    if (!(Connection === null || Connection === void 0 ? void 0 : Connection.Dead)) {
                        Connection === null || Connection === void 0 ? void 0 : Connection.InterpretNewRequest(req, res);
                    }
                    else {
                        res.send(JSON.stringify({
                            type: "InvalidSessionId",
                            data: {}
                        }));
                    }
                }
                else if (body.type == "EstablishConnection") {
                    let session = new OptipostSession();
                    this._connection.Fire(session);
                    res.send(JSON.stringify({
                        type: "ConnectionEstablished",
                        data: { id: session.id }
                    }));
                }
            }
            else {
                res.send(JSON.stringify({
                    type: "InvalidObject",
                    data: {}
                }));
            }
        });
        this.app.listen(port, () => {
            console.log(`Optipost server now running on localhost:${port}/${url}`);
        });
    }
}
exports.Optipost = Optipost;
