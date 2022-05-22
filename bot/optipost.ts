import express from "express"
import bodyparser from "body-parser"
import { BaseEvent,EventSignal } from "./events"
import crypto from "crypto"

interface JSONCompliantArray {
    [key:number]:string|number|boolean|JSONCompliantObject|JSONCompliantArray|null
}

interface JSONCompliantObject {
    [key:string]:string|number|boolean|JSONCompliantObject|JSONCompliantArray|null
}

interface BasicReply {
    type:string
    data:JSONCompliantObject
}

export class OptipostRequest {
    readonly request:express.Request
    readonly response:express.Response
    private readonly Autostop:NodeJS.Timeout
    readonly KillTimestamp:number
    private _Dead:boolean=false
    get Dead():boolean {return this._Dead}

    constructor(req:express.Request,res:express.Response) {
        this.request = req
        this.response = res
        this.KillTimestamp = Date.now()+15000
        this.Autostop = setTimeout(() => {
            this.Kill()
        },15000)
    }
    
    Kill() {
        this.Reply({
            type:"Kill",
            data:{}
        })
    }

    Reply(data:BasicReply) {
        if (this._Dead) {throw new Error("Request already dead");}
        this.response.send(JSON.stringify(data))
        clearTimeout(this.Autostop)
        this._Dead = true        
    }
}

export class OptipostSession {
    readonly id:string
    Dead:boolean=false
    Requests:OptipostRequest[]=[]
    constructor() {
        this.id = crypto
            .randomBytes(10)
            .toString('hex')

        
    }
}

export class Optipost {
    readonly app:express.Application
    readonly port:number
    readonly url:string
    private readonly _connection:BaseEvent=new BaseEvent()
    readonly connection:EventSignal
    constructor(port:number=3000,url:string="opti") {
        this.connection = this._connection.Event

        this.app = express()
        this.port = port
        this.url = url
        this.app.use(bodyparser.json())

        this.app.post("/"+url,(res,req) => {
            
        })

        this.app.listen(port,() => {
            console.log(`Optipost server now running on localhost:${port}/${url}`)
        })
    }
}