import express from "express"
import bodyparser from "body-parser"
import { BaseEvent,EventSignal } from "./events"

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