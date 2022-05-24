import Discord, { Intents } from "discord.js"
import { Optipost, OptipostSession, JSONCompliantObject } from "./optipost"
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
    Static:{targetGuild:Discord.Guild|null,category:Discord.CategoryChannel|null,archive:Discord.CategoryChannel|null},
    Dynamic:{[key:string]:Discord.TextChannel},
    chnl_webhooks:{[key:string]:Discord.Webhook}
} = {
    Static: {
        targetGuild:null,
        category:null,
        archive:null
    },
    Dynamic: {},
    chnl_webhooks:{},
}

// Set up server (http://127.0.0.1:4545/rocontrol)
let OptipostServer = new Optipost(4545,"rocontrol")


let OptipostActions:{[key:string]:(session: OptipostSession,data: JSONCompliantObject) => void} = {
    GetGameInfo:(session:OptipostSession,data:JSONCompliantObject) => {
        if (typeof data.data != "string" || typeof data.gameid != "string") {return}
        channels.Dynamic[session.id].setName(data.data || "studio-game-"+session.id)

        channels.Dynamic[session.id].send({embeds: [
            new Discord.MessageEmbed()
                .setTitle("Connected")
                .setDescription(`${channels.Dynamic[session.id].name}\n\nGameId ${data.gameid}`)
                .setColor("BLURPLE")
        ]})
    }
}

// On connection to Optipost
OptipostServer.connection.then((Session:OptipostSession) => {
    let guild = channels.Static.targetGuild
    if (!guild) {return}
    guild.channels.create(`${Session.id}`).then((channel:Discord.TextChannel) => {
        channel.createWebhook("RoConnect Chat").then((webhook) => {
            channels.Dynamic[Session.id] = channel
            channels.chnl_webhooks[Session.id] = webhook
            channel.setParent(channels.Static.category)
            Session.Send({type:"Ready"})
        })
    })

    Session.message.then((data) => {
        if (typeof data.type != "string") {return}
        OptipostActions[data.type](Session,data)
    })

    Session.death.then(() => {
        channels.chnl_webhooks[Session.id].delete()

        channels.Dynamic[Session.id]
            .send({embeds:[
                new Discord.MessageEmbed()
                    .setColor("RED")
                    .setTitle("Session ended")
                    .setDescription("This channel will be automatically deleted in 10 minutes. Click the Archive button to move it to the Archive category.")
            ],components:[
                new Discord.MessageActionRow()
                    .addComponents(
                        new Discord.MessageButton()
                            .setCustomId("ARCHIVE_CHANNEL")
                            .setEmoji("🗃")
                            .setStyle("SUCCESS")
                            .setLabel("Archive"),
                        new Discord.MessageButton()
                            .setStyle("LINK")
                            .setURL("https://google.co.ck")
                            .setLabel("See logs (glot.io)")
                    )
            ]})
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
            if (!process.env.ARCHIVE_CATEGORY) {console.log("no process.env.ARCHIVE_CATEGORY");process.exit(2)}
            guild.channels.fetch(process.env.ARCHIVE_CATEGORY).then((acat) => {
                if (!acat) {console.log("no category");process.exit(2)}
                if (acat.isText() || acat.isVoice()) {console.log("not category");process.exit(2)}
                //@ts-ignore | TODO: Find way to not use a @ts-ignore call for this!
                channels.Static.category = cat
                //@ts-ignore | TODO: Find way to not use a @ts-ignore call for this!
                channels.Static.archive = acat
                
                if (channels.Static.category) {
                    channels.Static.category.children.forEach((v) => {
                        v.delete()
                    })
                }
            })
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