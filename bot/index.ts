import Discord, { Intents } from "discord.js"
import { send } from "process"
import { Optipost, OptipostSession } from "./optipost"
require("dotenv").config()

let client = new Discord.Client({ intents: [
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING
] })

let channels:{
    Static:{targetGuild:Discord.Guild|null,category:Discord.CategoryChannel|null},
    Dynamic:{[key:string]:Discord.TextChannel}
} = {
    Static: {
        targetGuild:null,
        category:null 
    },
    Dynamic: {}
}

// Set up server (http://127.0.0.1:4545/rocontrol)
let OptipostServer = new Optipost(4545,"rocontrol")


// On connection to Optipost
OptipostServer.connection.then((Session:OptipostSession) => {
    let guild = channels.Static.targetGuild
    if (!guild) {return}
    guild.channels.create(`${Session.id}`).then((channel:Discord.TextChannel) => {
        channels.Dynamic[Session.id] = channel
        channel.setParent(channels.Static.category)
        Session.Send({type:"Ready"})
    })

    Session.message.then((data) => {
        
    })

    Session.death.then(() => {
        channels.Dynamic[Session.id].delete()
    })

})

// TODO: make this code not suck (or at least clean it up)

client.on("ready",() => {
    console.log(`RoConnect is online.`)
    if (!process.env.TARGET_GUILD) {console.log("no process.env.TARGET_GUILD");process.exit(2)}
    client.guilds.fetch(process.env.TARGET_GUILD.toString()).then((guild) => {
        channels.Static.targetGuild = guild
        if (!process.env.CATEGORY) {console.log("no process.env.CATEGORY");process.exit(2)}
        guild.channels.fetch(process.env.CATEGORY).then((cat) => {
            if (!cat) {console.log("no category");process.exit(2)}
            if (cat.isText() || cat.isVoice()) {console.log("not category");process.exit(2)}
            //@ts-ignore | TODO: Find way to not use a @ts-ignore call for this!
            channels.Static.category = cat
        }).catch(() => {
            console.log("Could not get category")
            process.exit(1)
        })
    }).catch(() => {
        console.log("Could not get target guild")
        process.exit(1)
    })
})

client.login(process.env.TOKEN)