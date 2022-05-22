import express from "express"
import bodyparser from "body-parser"
import { BaseEvent,EventSignal } from "./events"

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
    readonly Dead:boolean=false

    constructor(req:express.Request,res:express.Response) {
        this.request = req
        this.response = res
        this.KillTimestamp = Date.now()+15000
        this.Autostop = setTimeout(() => {
            
        },15000)
    }
    Kill() {
        this.Reply({
            type:"Kill",
            data:{}
        })
    }
    Reply(data:BasicReply) {
        this.response.send(JSON.stringify(data))
    }
}

export class Optipost {
    readonly app:express.Application
    readonly port:number
    readonly url:string
    constructor(port:number=3000,url:string="opti") {
        this.app = express()
        this.port = port
        this.url = url
        this.app.use(bodyparser.json())
        this.app.post("/"+url,(res,req) => {
            
        })
        this.app.listen(3000,() => {
            console.log(`Optipost server now running on localhost:${port}/${url}`)
        })
    }
}