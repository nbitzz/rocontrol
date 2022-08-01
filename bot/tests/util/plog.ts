// UNUSED (for now?)

type Color = "Black" | "Red" | "Green" | "Yellow" | "Blue" | "Magenta" | "Cyan" | "White" | "Gray" | "Grey"
type BackgroundColor = `bg${Color}`

export let ColorCodes = {
    Black: [30, 39],
    Red: [31, 39],
    Green: [32, 39],
    Yellow: [33, 39],
    Blue: [34, 39],
    Magenta: [35, 39],
    Cyan: [36, 39],
    White: [37, 39],
    Gray: [90, 39],
    Grey: [90, 39],
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
}

export class Log {
    readonly log:string
    readonly descriptors?:string[]
    readonly timestamp:number
    readonly color:Color="White"
    constructor(log:string,descriptors?:string[],color?:Color) {
        this.log = log
        this.descriptors = descriptors
        this.timestamp = Date.now()
        if (color) {
            this.color = color
        }

        // log

        console.log(
            '\u001b[' + ColorCodes[this.color][0] + 'm'
            + this.log
            + this.descriptors?.join("\n")
            +'\u001b[' + ColorCodes[this.color][1] + 'm'
        )
    }
}

export class Logger {
    private logs:Log[]=[]
    Log(log:string,descriptors?:string[]) {
        this.logs.push(
            new Log(log,descriptors)
        )
    }
}