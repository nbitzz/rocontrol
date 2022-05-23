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
        this.KillTimestamp = Date.now() + 15000;
        this.Autostop = setTimeout(() => {
            this.Kill();
        }, 15000);
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
            type: "Kill",
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
    }
    get Dead() { return this._Dead; }
    ForceKill() {
        if (!this.Dead) {
            this._Dead = true;
            this._death.Fire();
        }
    }
}
exports.OptipostSession = OptipostSession;
class Optipost {
    constructor(port = 3000, url = "opti") {
        this._connection = new events_1.BaseEvent();
        this.connection = this._connection.Event;
        this.app = (0, express_1.default)();
        this.port = port;
        this.url = url;
        this.app.use(body_parser_1.default.json());
        this.app.post("/" + url, (req, res) => {
            let body = req.body;
            if (body.type && typeof body.data == typeof {}) {
            }
            else {
            }
        });
        this.app.listen(port, () => {
            console.log(`Optipost server now running on localhost:${port}/${url}`);
        });
    }
}
exports.Optipost = Optipost;
