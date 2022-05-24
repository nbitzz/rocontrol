export class EventConnection {
    private _disconnected:boolean = false // Internal
    readonly Once:boolean = false
    readonly Signal:EventSignal
    readonly Callback:(...a:any[]) => void
    get Disconnected():boolean {
        return this._disconnected
    }
    Disconnect():void {
        this._disconnected = true
        this.Signal._GC()
    }
    constructor(signal:EventSignal,callback:(...a:any[]) => void,once:boolean=false) {
        this.Signal = signal
        this.Callback = callback
        this.Once = once
    }
}

export class EventSignal {
    private _connections:EventConnection[]=[]
    get Connections():EventConnection[] {
        return this._connections
    }
    Connect(callback:(...a:any[]) => void):EventConnection {
        let ev = new EventConnection(this,callback)
        this._connections.push(ev)
        return ev
    }
    Once(callback:(...a:any[]) => void):EventConnection {
        let ev = new EventConnection(this,callback,true)
        this._connections.push(ev)
        return ev
    }
    _GC():void { // remove all disconnected EventConnections from Connections
        this._connections.filter(e => e.Disconnected == true).forEach((v,x) => {
            this._connections.splice(
                this._connections.findIndex(e => e == v),
                1
            )
        })
    }
    // Connect aliases
    then = this.Connect // promise-like
    connect = this.Connect // lowercase
    once = this.Once // Once port

    constructor() {
        return this
    }
}

export class BaseEvent {
    readonly Event:EventSignal
    constructor() {
        this.Event = new EventSignal()
    }
    Fire(...a:any[]):void {
        let toDisconnect:EventConnection[] = []
        this.Event.Connections.filter(e => e.Disconnected == false).forEach((v,x) => {
            v.Callback(...Array.from(arguments))
            if (v.Once) {
                toDisconnect.push(v)
            }
        })
        toDisconnect.forEach(v => v.Disconnect())
    }
}

export class Event extends BaseEvent {
    readonly Connect:(...a:any[])=>EventConnection = this.Event.Connect
    readonly connect:(...a:any[])=>EventConnection = this.Event.Connect
    readonly then:(...a:any[])=>EventConnection = this.Event.Connect
    readonly fire:(...a:any[])=>void=this.Fire
}