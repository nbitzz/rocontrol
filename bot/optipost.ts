import express from "express"
import bodyparser from "body-parser"
import { BaseEvent,EventSignal } from "./events"
import crypto from "crypto"

// Forgot to add a null here. TODO: add null without breaking everything
export type JSONCompliantArray = Array<string|number|boolean|JSONCompliantArray|JSONCompliantObject>

export interface JSONCompliantObject {
    [key:string]:string|number|boolean|JSONCompliantObject|JSONCompliantArray|null
}

export interface BasicReply {
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
        this.KillTimestamp = Date.now()+500
        this.Autostop = setTimeout(() => {
            this.Kill()
        },500)
    }
    
    Kill() {
        this.Reply({
            type:"RequestKilled",
            data:{}
        })
    }

    Reply(data:BasicReply) {
        if (this._Dead) {
            //throw new Error("Request already dead");
            console.warn("WARN! Request already dead")
            return
        }
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
    private readonly _newRequest:BaseEvent = new BaseEvent()
    readonly message:EventSignal=this._message.Event
    readonly death:EventSignal=this._death.Event
    readonly newRequest:EventSignal=this._newRequest.Event
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
     * @deprecated Use _Send instead.
     */
    _OldSend(reply:BasicReply):boolean {
        if (this.Requests[0]) {
            this.Requests[0].Reply(reply)
            return true
        } else {
            console.warn(`WARN! DATA DROPPED AT ${Date.now()}`)
            return false
        }
    }

    /**
     * 
     * @description Sends a message to the connected client.
     */

    _Send(reply:BasicReply,timesSoFar:number=0):void {
        if (timesSoFar == 5) {console.warn(`WARN! DATA DROPPED AT ${Date.now()}`);}
        
        this.Requests = this.Requests.filter(e => !e.Dead)
        
        if (this.Requests[0]) {
            this.Requests[0].Reply(reply)
        } else {
            console.log("WARN! Could not find an open request. Waiting for a new one to come in...")
            let a:NodeJS.Timeout|null = null
            let x = this.newRequest.Once(() => {
                console.log("Retrying...")
                if (a) {
                    clearTimeout(a)
                }
                this._Send(reply,timesSoFar+1)
            })

            a = setTimeout(() => {
                x.Disconnect()
                console.warn("WARN! Timeout")
            },10000)
            
        }
    }

    Send(reply:JSONCompliantObject) {
        this._Send({type:"Data",data:reply})
    }

    /**
     * 
     * @deprecated Use Send() instead.
     * @returns {boolean} Whether or not the data was successfully sent
     */

    OldSend(reply:JSONCompliantObject) {
        return this._OldSend({type:"Data",data:reply})
    }

    private SetupAutoDisconnect() {
        if (!this.autoDisconnect) {
            this.autoDisconnect = setTimeout(() => {
                this.Close()
            },15000)
        }
    }

    InterpretNewRequest(req:express.Request,res:express.Response) {
        // Cleanup

        this.Requests = this.Requests.filter(e => !e.Dead)

        // Clear autoDisconnect timeout
        if (this.autoDisconnect) {
            clearTimeout(this.autoDisconnect)
            this.autoDisconnect = undefined
        }
        
        let newRequest = new OptipostRequest(req,res)

        this.Requests.push(newRequest)

        // Basic but should work

        this._newRequest.Fire()
        console.log(`new request ${newRequest.dataType}`)
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
    readonly verbose:boolean
    private readonly _connection:BaseEvent=new BaseEvent()
    readonly connection:EventSignal
    private connections:OptipostSession[]=[]
    get _connections():OptipostSession[] {return this.connections}
    constructor(port:number=3000,url:string="opti",options?:{limit:string|number,verbose:boolean}) {
        this.connection = this._connection.Event

        this.app = express()
        this.port = port
        this.url = url
        this.verbose = options?.verbose || false
        this.app.use(bodyparser.json({limit:options?.limit || "100kb"}))
    
        this.app.get("/"+url,(req:express.Request,res:express.Response) => {
            res.send(`Optipost online`)
        })

        this.app.post("/"+url,(req:express.Request,res:express.Response) => {
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