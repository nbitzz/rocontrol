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

    private readonly _death:BaseEvent = new BaseEvent();
    readonly death:EventSignal = this._death.Event

    get Dead():boolean {return this._Dead}

    get dataType():string {
        return (this.request.body || {}).type
    }

    get data():string {
        return (this.request.body || {}).data || {}
    }

    constructor(req:express.Request,res:express.Response) {
        this.request = req
        this.response = res
        this.KillTimestamp = Date.now()+30000
        this.Autostop = setTimeout(() => {
            this.Kill()
        },30000)
    }
    
    Kill() {
        this.Reply({
            type:"RequestKilled",
            data:{}
        })
    }

    Reply(data:BasicReply) {
        if (this._Dead) {throw new Error("Request already dead");}
        this.response.send(JSON.stringify(data))
        clearTimeout(this.Autostop)
        this._Dead = true        
        this._death.Fire()
    }
}

export class OptipostSession {
    readonly id:string
    private _Dead:boolean=false
    get Dead() {return this._Dead}
    Requests:OptipostRequest[]=[]
    private autoDisconnect?:NodeJS.Timeout

    private readonly _message:BaseEvent=new BaseEvent()
    private readonly _death:BaseEvent=new BaseEvent()
    readonly message:EventSignal=this._message.Event
    readonly death:EventSignal=this._death.Event
    constructor() {
        this.id = crypto
            .randomBytes(10)
            .toString('hex')
        this.SetupAutoDisconnect()
    }

    /**
     * @description Closes the connection
     */

    Close() {
        console.log(`Connection ${this.id} closed`)
        if (!this.Dead) {
            this._Dead = true
            this._death.Fire()
        }
    }

    /**
     * 
     * @description Sends a message to the connected client.
     * @returns {boolean} True if data sent, false if there were no open requests to send it to
     * 
     */
    _Send(reply:BasicReply):boolean {
        if (this.Requests[0]) {
            this.Requests[0].Reply(reply)
            return true
        } else {
            console.warn(`WARN! DATA DROPPED AT ${Date.now()}`)
            return false
        }
    }

    Send(reply:JSONCompliantObject) {
        this._Send({type:"Data",data:reply})
    }

    private SetupAutoDisconnect() {
        if (!this.autoDisconnect) {
            this.autoDisconnect = setTimeout(() => {
                this.Close()
            },15000)
        }
    }

    InterpretNewRequest(req:express.Request,res:express.Response) {
        // Clear autoDisconnect timeout
        if (this.autoDisconnect) {
            clearTimeout(this.autoDisconnect)
            this.autoDisconnect = undefined
        }
        
        let newRequest = new OptipostRequest(req,res)

        this.Requests.push(newRequest)

        // Basic but should work

        if (newRequest.dataType == "Close") {
            this.Close()   
        } else if (newRequest.dataType == "Data") {
            this._message.Fire(newRequest.data)
        }

        // On death, find index and splice
        newRequest.death.then(() => {
            if (this.Requests.findIndex(e => e == newRequest) != -1) {
                this.Requests.splice(this.Requests.findIndex(e => e == newRequest),1)
            }

            // Setup auto disconnect if requests is 0
            if (this.Requests.length == 0) {
                this.SetupAutoDisconnect()
            }
        })
    }
}

export class Optipost {
    readonly app:express.Application
    readonly port:number
    readonly url:string
    private readonly _connection:BaseEvent=new BaseEvent()
    readonly connection:EventSignal
    private connections:OptipostSession[]=[]
    constructor(port:number=3000,url:string="opti") {
        this.connection = this._connection.Event

        this.app = express()
        this.port = port
        this.url = url
        this.app.use(bodyparser.json())

        this.app.get("/"+url,(req,res) => {
            res.send(`Optipost online`)
        })

        this.app.post("/"+url,(req,res) => {
            let body = req.body
            
            // TODO: make this code not suck

            if (body.type && typeof body.data == typeof {}) {
                if (body.id) {
                    let Connection = this.connections.find(e => e.id == body.id)
                    // If connection is not dead
                    if (Connection) {
                        if (!Connection.Dead) {
                            Connection.InterpretNewRequest(req,res)
                        } else {
                            res.send(JSON.stringify(
                                {
                                    type:"InvalidSessionId",
                                    data:{}
                                }
                            ))
                        }
                    } else {
                        res.send(JSON.stringify(
                            {
                                type:"InvalidSessionId",
                                data:{}
                            }
                        ))
                    }
                } else if (body.type == "EstablishConnection") {
                    let session = new OptipostSession()
                    
                    this._connection.Fire(session)

                    console.log(`Connection established ${session.id}`)

                    this.connections.push(session)

                    res.send(JSON.stringify(
                        {
                            type:"ConnectionEstablished",
                            data:{id:session.id}
                        }
                    ))
                }
            } else {
                res.send(JSON.stringify(
                    {
                        type:"InvalidObject",
                        data:{}
                    }
                ))    
            }
        })

        this.app.listen(port,() => {
            console.log(`Optipost server now running on localhost:${port}/${url}`)
        })
    }
}