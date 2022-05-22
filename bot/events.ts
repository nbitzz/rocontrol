export class EventConnection {
    private _disconnected:boolean = false // Internal
    readonly Signal:EventSignal
    readonly Callback:(...a:any[]) => void
    get Disconnected():boolean {
        return this._disconnected
    }
    Disconnect():void {
        this._disconnected = true
        this.Signal._GC()
    }
    constructor(signal:EventSignal,callback:(...a:any[]) => void) {
        this.Signal = signal
        this.Callback = callback
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
        this.Event.Connections.filter(e => e.Disconnected == false).forEach((v,x) => {
            v.Callback(...Array.from(arguments))
        })
    }
}

export class Event extends BaseEvent {
    readonly Connect:(...a:any[])=>EventConnection = this.Event.Connect
    readonly connect:(...a:any[])=>EventConnection = this.Event.Connect
    readonly then:(...a:any[])=>EventConnection = this.Event.Connect
    readonly fire:(...a:any[])=>void=this.Fire
}