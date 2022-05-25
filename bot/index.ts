import axios from "axios"
import Discord, { Intents } from "discord.js"
import { response } from "express"
import { Session } from "inspector"
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

if (!process.env.RC_PFX) {process.exit()}
let prefix:string = process.env.RC_PFX

let make_glot_post:(data:string) => Promise<string> = (data:string) => {
    return new Promise((resolve,reject) => {
        axios.post("https://glot.io/api/snippets",{language:"plaintext",title:`${new Date().toUTCString()} Log Export - RoConnect`,public:true,files:[{name:"export.txt",content:data}]}).then((data) => {
            resolve(`https://glot.io/snippets/${data.data.id}`)
        }).catch(() => {
            resolve("https://google.co.ck/search?q=error")
        })
    })
}

let channels:{
    Static:{targetGuild:Discord.Guild|null,category:Discord.CategoryChannel|null,archive:Discord.CategoryChannel|null},
    Dynamic:{[key:string]:Discord.TextChannel},
    chnl_webhooks:{[key:string]:Discord.Webhook},
    imgcache:{[key:string]:string},
    cmdl:{[key:string]:string[]},
    logs:{[key:string]:(lg:string) => void},
} = {
    Static: {
        targetGuild:null,
        category:null,
        archive:null
    },
    Dynamic: {},
    chnl_webhooks:{},
    imgcache:{},
    cmdl:{},
    logs:{}
}

// Set up server (http://127.0.0.1:4545/rocontrol)
let OptipostServer = new Optipost(4545,"rocontrol")


let OptipostActions:{[key:string]:(session: OptipostSession,data: JSONCompliantObject,addLog:(lg:string) => void) => void} = {
    GetGameInfo:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (typeof data.data != "string" || typeof data.gameid != "number") {return}
        channels.Dynamic[session.id].setName(data.data || "studio-game-"+session.id)

        if (data.data) {
            addLog(`JobId ${data.data}`)
        } else {
            addLog(`Studio Game`)
        }

        channels.Dynamic[session.id].send({embeds: [
            new Discord.MessageEmbed()
                .setTitle("Connected")
                .setDescription(`Optipost Session ${session.id}\n\nJobId ${data.data}\nGameId ${data.gameid}`)
                .setColor("BLURPLE")
        ]})

        addLog("-".repeat(50))

        session.OldSend({type:"ok"})
    },
    Chat:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (typeof data.data != "string" || typeof data.userid != "string" || typeof data.username != "string") {return}

        let webhookURL = channels.chnl_webhooks[session.id].url

        let showMessage = function() {
            if (!data.userid) {return}
            axios.post(webhookURL,{
                content:data.data,
                avatar_url:channels.imgcache[data.userid.toString()],
                username:`${data.username} (${data.userid})`,
                allowed_mentions: {
                    parse: []
                }
            }).catch(() => {})
        }

        addLog(`${data.displayname == data.username ? data.username : `${data.displayname}/${data.username}`} ${data.username} (${data.userid}): ${data.data}`)

        // Roblox deleted the old image endpoint so i have to do this stupidness

        if (!channels.imgcache[data.userid.toString()]) {
            axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${data.userid}&size=48x48&format=Png&isCircular=false`).then((dt) => {
                if (!data.userid) {return}
                channels.imgcache[data.userid.toString()] = dt.data.data[0].imageUrl 
                showMessage()
            }).catch(() => {
                showMessage()
            })
        } else {
            showMessage()
        }
        
        session.OldSend({type:"ok"})
    }
}

// On connection to Optipost
OptipostServer.connection.then((Session:OptipostSession) => {
    let guild = channels.Static.targetGuild

    let logs:string[] = [
        `RoConnect Logs`,
        `Connection ${Session.id}`
    ]

    let addLog = (str:string) => logs.push(str)
    channels.logs[Session.id] = addLog

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
        OptipostActions[data.type](Session,data,addLog)
    })

    Session.death.then(() => {
        channels.chnl_webhooks[Session.id].delete()
        make_glot_post(logs.join("\n")).then((url:string) => {
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
                                .setURL(url)
                                .setLabel("See logs (glot.io)")
                        )
                ]})
        })
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

client.on("messageCreate",(message) => {
    if (message.content.startsWith(prefix)) {
        
    } else {
        // I'm sure there's a much better way to do this,
        // I'm just too lazy to find it right now
        
        if (!message.author.bot) {
            for (let [x,v] of Object.entries(channels.Dynamic)) {
                if (v == message.channel) {
                    let foundSession = OptipostServer._connections.find(e => e.id == x)
                    if (!foundSession) {return}
                    foundSession.Send({type:"Chat",data:message.content,tag:message.author.tag,tagColor:message.member?.displayHexColor || null})
                    channels.logs[foundSession.id](`${message.author.tag}: ${message.content}`)
                }
            }
        }
    }
})

client.login(process.env.TOKEN)