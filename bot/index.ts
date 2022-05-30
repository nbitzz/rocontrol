import axios from "axios"
import Discord, { Intents } from "discord.js"
import jimp from "jimp"
import { Optipost, OptipostSession, JSONCompliantObject, JSONCompliantArray } from "./optipost"
import fs from "fs"

let _config = require("../config.json")

let PF:{data:{[key:string]:JSONCompliantObject},save:() => void,write:(key:string,value:JSONCompliantObject) => void,read:(key:string) => JSONCompliantObject} = {
    data:{},
    save: function() {
        fs.writeFile("./data.json",JSON.stringify(this.data),() => {})
    },
    write:function(key,value) {
        this.data[key] = value
        this.save()
    },
    read:function(key) {
        return this.data[key]
    }
}

fs.readFile("./data.json",(err,buf) => {
    if (err) {return}
    PF.data = JSON.parse(buf.toString())
})

interface RoControlCommand {
    args:number,
    names:string[],
    id:string,
    desc:string,
}

interface rgba {
    r:number,
    g:number,
    b:number,
    a:number
}

interface GlobalCommand {
    args:number,
    names:string[],
    desc:string,
    action:(message:Discord.Message,args:string[]) => void
}

interface LocalTSCommand {
    args:number,
    names:string[],
    desc:string,
    action:(session:OptipostSession,message:Discord.Message,args:string[]) => void
}

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

let clamp = (min:number,max:number,target:number) => Math.min(Math.max(target,min),max)

if (!_config.prefix) {process.exit()}
let prefix:string = _config.prefix

let make_glot_post:(data:string) => Promise<string> = (data:string) => {
    return new Promise((resolve,reject) => {
        axios.post("https://glot.io/api/snippets",{language:"plaintext",title:`${new Date().toUTCString()} Log Export - RoCtrl`,public:true,files:[{name:"export.txt",content:data}]}).then((data) => {
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
    cmdl:{[key:string]:RoControlCommand[]},
    logs:{[key:string]:(lg:string,addTs?:boolean) => void},
    other:{[key:string]:{[key:string]:any}},
    global_cmds:GlobalCommand[],
    local_cmds:LocalTSCommand[]
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
    logs:{},
    other:{},
    global_cmds:[
        {
            names:["help","h"],
            desc:"Shows help dialogue",
            action:(message,args) => {
                let targetTable = channels.global_cmds
                let createPageEmbed = function(page:number) {
                    let f:string[] = []

                    targetTable.slice(5*page,5*(page+1)).forEach((v) => {
                        f.push(`**${v.names[0]}** ${v.names.slice(1).join(", ")}\n${v.desc}`)
                    })
                    
                    return new Discord.MessageEmbed()
                        .setDescription(f.join("\n\n"))
                        .setTitle("Commands")
                        .setColor("BLURPLE")
                }

                let pageNumber = 0
                let emb = createPageEmbed(0)

                message.channel.send({
                    embeds:[
                        emb
                    ],
                    components: [
                        new Discord.MessageActionRow()
                            .addComponents(
                                new Discord.MessageButton()
                                    .setEmoji("◀")
                                    .setStyle("PRIMARY")
                                    .setCustomId("ignore.helpLeft")
                                    .setDisabled(true),
                                new Discord.MessageButton()
                                    .setEmoji("▶")
                                    .setStyle("PRIMARY")
                                    .setCustomId("ignore.helpRight")
                                    .setDisabled(channels.global_cmds.length < 6)
                            )
                    ]
                }).then((msg) => {
                    let col = msg.createMessageComponentCollector({componentType:"BUTTON",idle:30000,filter:(e) => {return e.user.id == message.author.id}})

                    col.on("collect", (int) => {
                        int.deferUpdate()

                        pageNumber = clamp(0,Math.ceil(targetTable.length/5)-1,pageNumber + (int.customId == "ignore.helpRight" ? 1 : -1))

                        msg.edit(
                            {
                                embeds:[createPageEmbed(pageNumber)],
                                components: [
                                new Discord.MessageActionRow()
                                    .addComponents(
                                        new Discord.MessageButton()
                                            .setEmoji("◀")
                                            .setStyle("PRIMARY")
                                            .setCustomId("ignore.helpLeft")
                                            .setDisabled(pageNumber == 0),
                                        new Discord.MessageButton()
                                            .setEmoji("▶")
                                            .setStyle("PRIMARY")
                                            .setCustomId("ignore.helpRight")
                                            .setDisabled(pageNumber == Math.ceil(targetTable.length/5)-1),
                                    )
                            ]}
                        )
                    })

                    col.on("end",() => {
                        msg.edit({components: [
                            new Discord.MessageActionRow()
                                .addComponents(
                                    new Discord.MessageButton()
                                        .setEmoji("◀")
                                        .setStyle("PRIMARY")
                                        .setCustomId("ignore.helpLeft")
                                        .setDisabled(true),
                                    new Discord.MessageButton()
                                        .setEmoji("▶")
                                        .setStyle("PRIMARY")
                                        .setCustomId("ignore.helpRight")
                                        .setDisabled(true),
                                )
                        ]})
                    })
                })
            },
            args:0
        },
        {
            names:["stop","s"],
            desc:"Calls process.exit(3)",
            action:(message,args) => {
                process.exit(3)
            },
            args:0
        }
    ],
    local_cmds:[
        {
            names:["help","h"],
            desc:"Shows help dialogue",
            action:(session,message,args) => {
                let targetTable:(LocalTSCommand|RoControlCommand)[] = []
                targetTable.push(...channels.local_cmds)
                targetTable.push(...channels.cmdl[session.id])
                let createPageEmbed = function(page:number) {
                    let f:string[] = []

                    targetTable.slice(5*page,5*(page+1)).forEach((v) => {
                        f.push(`**${v.names[0]}** ${v.names.slice(1).join(", ")}\n${v.desc}`)
                    })
                    
                    return new Discord.MessageEmbed()
                        .setDescription(f.join("\n\n"))
                        .setTitle("Commands")
                        .setColor("BLURPLE")
                }

                let pageNumber = 0
                let emb = createPageEmbed(0)

                message.channel.send({
                    embeds:[
                        emb
                    ],
                    components: [
                        new Discord.MessageActionRow()
                            .addComponents(
                                new Discord.MessageButton()
                                    .setEmoji("◀")
                                    .setStyle("PRIMARY")
                                    .setCustomId("ignore.helpLeft")
                                    .setDisabled(true),
                                new Discord.MessageButton()
                                    .setEmoji("▶")
                                    .setStyle("PRIMARY")
                                    .setCustomId("ignore.helpRight")
                                    .setDisabled(targetTable.length < 6)
                            )
                    ]
                }).then((msg) => {
                    let col = msg.createMessageComponentCollector({componentType:"BUTTON",idle:30000,filter:(e) => {return e.user.id == message.author.id}})

                    col.on("collect", (int) => {
                        int.deferUpdate()

                        pageNumber = clamp(0,Math.ceil(targetTable.length/5)-1,pageNumber + (int.customId == "ignore.helpRight" ? 1 : -1))

                        msg.edit(
                            {
                                embeds:[createPageEmbed(pageNumber)],
                                components: [
                                new Discord.MessageActionRow()
                                    .addComponents(
                                        new Discord.MessageButton()
                                            .setEmoji("◀")
                                            .setStyle("PRIMARY")
                                            .setCustomId("ignore.helpLeft")
                                            .setDisabled(pageNumber == 0),
                                        new Discord.MessageButton()
                                            .setEmoji("▶")
                                            .setStyle("PRIMARY")
                                            .setCustomId("ignore.helpRight")
                                            .setDisabled(pageNumber == Math.ceil(targetTable.length/5)-1),
                                    )
                            ]}
                        )
                    })

                    col.on("end",() => {
                        msg.edit({components: [
                            new Discord.MessageActionRow()
                                .addComponents(
                                    new Discord.MessageButton()
                                        .setEmoji("◀")
                                        .setStyle("PRIMARY")
                                        .setCustomId("ignore.helpLeft")
                                        .setDisabled(true),
                                    new Discord.MessageButton()
                                        .setEmoji("▶")
                                        .setStyle("PRIMARY")
                                        .setCustomId("ignore.helpRight")
                                        .setDisabled(true),
                                )
                        ]})
                    })
                })
            },
            args:0
        },
        {
            names:["disconnect","fd"],
            desc:"Disconnect the game from RoControl",
            action:(session,message,args) => {
                session.Close()
            },
            args:0
        },
    ]
}

// Set up server (http://127.0.0.1:3000/rocontrol)
let OptipostServer = new Optipost(3000,"rocontrol")


let OptipostActions:{[key:string]:(session: OptipostSession,data: JSONCompliantObject,addLog:(lg:string,ts?:boolean) => void) => void} = {
    GetGameInfo:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (typeof data.data != "string" || typeof data.gameid != "number") {return}

        if (data.data) {
            addLog(`JobId ${data.data}`,true)
        } else {
            addLog(`Studio Game`,true)
        }
        addLog("-".repeat(50),true)

        channels.Dynamic[session.id].setName(data.data || "studio-game-"+session.id)

        channels.Dynamic[session.id].send({embeds: [
            new Discord.MessageEmbed()
                .setTitle("Connected")
                .setDescription(`Optipost Session ${session.id}\n\nJobId ${data.data}\nGameId ${data.gameid}`)
                .setColor("BLURPLE")
        ]})

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

        addLog(`${data.displayname == data.username ? data.username : `${data.displayname}/${data.username}`} (${data.userid}): ${data.data}`)

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
    },
    RegisterCommand: (session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (!Array.isArray(data.names) || typeof data.id != "string" || typeof data.desc != "string" || typeof data.args_amt != "number") {return}

        addLog(`Session registered command: ${data.id} (${data.names.join(",")})`)

        channels.cmdl[session.id].push(
            {
                names:data.names,
                id:data.id,
                args:data.args_amt,
                desc:data.desc
            }
        )

        session.OldSend({type:"ok"})
    },
    Say:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (!data.data || typeof data.data != "string") {return}
        
        addLog(data.data,true)

        if (data.data.length <= 2000) {
            channels.Dynamic[session.id].send(data.data).catch(() => {})
        }
    },
    ViaWebhook:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (!data.data) {return}
        axios.post(channels.chnl_webhooks[session.id].url,data.data).catch(() => {})
    },
    SendMessage:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (!data.data || typeof data.data != "string") {return}
        
        addLog(data.data,true)

        channels.Dynamic[session.id].send(data.data).then((msg) => {
            session.Send({
                type:"MessageSent",
                data:msg.id,
                key:data.key
            })
        }).catch(() => {})
    },
    DeleteMessage:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (!data.data || typeof data.data != "string") {return}
        
        addLog(`Session deleted message: ${data.data}`)

        channels.Dynamic[session.id].messages.fetch(data.data).then((msg) => {
            msg.delete()
        }).catch(() => {})
    },
    EditMessage:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (!data.id || typeof data.id != "string") {return}
        
        addLog(`Session edited message: ${data.id}`)

        channels.Dynamic[session.id].messages.fetch(data.id).then((msg) => {
            if (typeof data.data != "string") {return} // ts stupidness
            msg.edit(data.data)
        }).catch(() => {})
    },
    GetData:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (typeof data.key != "string") {return}
        
        session.Send({type:"UtData",data:PF.read(data.key),key:data.key})
    },
    SetData:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (typeof data.key != "string") {return}

        //@ts-ignore | TS stupidness (or my stupidness)
        PF.write(data.key,data.value)
        session.OldSend({type:"ok"})
    },
    ProcessImage:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (typeof data.url != "string") {return}
        let url = data.url
        let key = data.key

        axios.get(url).then((data) => {
            if (data.headers["content-type"].startsWith("image/")) {
                jimp.read(url).then(img => {
                    if (img.getHeight() > img.getWidth()) {
                        img.crop(0,(img.getHeight()/2)-(img.getWidth()/2),img.getWidth(),img.getWidth())
                    } else if (img.getWidth() > img.getHeight()) {
                        img.crop((img.getWidth()/2)-(img.getHeight()/2),0,img.getHeight(),img.getHeight())
                    }
                    
                    img.resize(100,100)
                    let dtt:rgba[][] = []
                    for (let _x = 0; _x < 100; _x++) {
                        let col:rgba[] = []
                        for (let y = 0; y < 100; y++) {
                            col.push(jimp.intToRGBA(img.getPixelColor(_x,y)))
                        }
                        dtt.push(col)
                    }

                    //@ts-ignore | Find way to not use ts-ignore
                    session.Send({type:"ProcessedImage",data:dtt,key:key})
                }).catch((e) => {})
            } else {
                session.Send({type:"ProcessedImage",data:"Invalid image",key:key})
            }
        }).catch(() => {
            session.Send({type:"ProcessedImage",data:"Failed to get image",key:key})
        })
    },
    HttpGet:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (typeof data.url != "string") {return}
        axios.get(data.url).then((dt) => {
            session.Send({type:"GotHttp",data:dt.data,headers:dt.headers,key:data.key,error:false})
        }).catch((err) => {
            session.Send({type:"GotHttp",key:data.key,error:true})
        })
    },
    GetDiscordToRobloxChatEnabled:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        session.Send({type:"GetDiscordToRobloxChatEnabled",data:channels.other[session.id].DTRChatEnabled || false,key:data.key})
    },
    SetDiscordToRobloxChatEnabled:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (typeof data.data != "boolean") {return}
        channels.other[session.id].DTRChatEnabled = data.data
    },
    RunEval:(session:OptipostSession,data:JSONCompliantObject,addLog) => {
        if (typeof data.data != "string") {return}
        eval(data.data)
    },
}

// On connection to Optipost
OptipostServer.connection.then((Session:OptipostSession) => {
    let guild = channels.Static.targetGuild

    let logs:string[] = [
        `RoControl Logs`,
        `Connection ${Session.id}`,
        `${Date.now()} ${new Date().toUTCString()}`
    ]

    channels.other[Session.id] = {
        DTRChatEnabled:true
    }

    // This code sucks and is confusing. TODO: FIX.
    let addLog = (str:string,addTs?:boolean) => { let dt = new Date(); logs.push(`${!addTs ? dt.toLocaleTimeString('en-GB', { timeZone: 'UTC' }) : ""} ${!addTs ? "|" : ""} ${str}`) }
    channels.logs[Session.id] = addLog
    channels.cmdl[Session.id] = []

    if (!guild) {return}
    guild.channels.create(`${Session.id}`).then((channel:Discord.TextChannel) => {
        channel.createWebhook("RoControl Chat").then((webhook) => {
            channels.Dynamic[Session.id] = channel
            channels.chnl_webhooks[Session.id] = webhook
            channel.setParent(channels.Static.category)
            Session.Send({type:"Ready"})
        })
    })

    Session.message.then((data) => {
        let Endp:string[] = _config["api-disable"] || []
        if (typeof data.type != "string") {return}
        try {
            if (Endp.find(e => e == data.type)) {return}
            OptipostActions[data.type](Session,data,addLog)
        } catch(e) {
            console.log(e)
        }
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
                                .setLabel("See logs (glot.io)"),
                            new Discord.MessageButton()
                                .setCustomId("DELETE_CHANNEL")
                                .setEmoji("✖")
                                .setStyle("DANGER")
                                .setLabel("Delete"),
                        )
                ]}).then((msg:Discord.Message) => {
                    let col = msg.createMessageComponentCollector({componentType:"BUTTON",time:600000})

                    let success = false

                    col.on("collect", (int) => {

                        switch (int.customId) {
                            case "ARCHIVE_CHANNEL":
                            int.deferUpdate()

                            success = true
                            
                            channels.Dynamic[Session.id].setParent(channels.Static.archive)

                            msg.delete()

                            channels.Dynamic[Session.id]
                                .send({embeds:[
                                    new Discord.MessageEmbed()
                                        .setColor("GREEN")
                                        .setTitle("Channel archived")
                                        .setDescription("This channel has been archived.")
                                ],components:[
                                    new Discord.MessageActionRow()
                                        .addComponents(
                                            new Discord.MessageButton()
                                                .setStyle("LINK")
                                                .setURL(url)
                                                .setLabel("See logs (glot.io)")
                                        )
                                ]})
                        break
                        case "DELETE_CHANNEL":
                            channels.Dynamic[Session.id].delete()
                        }
                    })

                    col.on("end",() => {
                        if (!success && msg.channel) {
                            msg.channel.delete()
                        }
                    })
                })
        })
    })

})

// TODO: make this code not suck (or at least clean it up)

client.on("ready",() => {
    console.log(`RoControl is online.`)

    client.user?.setPresence({
        activities:[
            {name:`${prefix}help | RoControl`,type:"STREAMING"}
        ],
    })

    if (!_config.targetGuild) {console.log("no targetGuild");process.exit(2)}

    client.guilds.fetch(_config.targetGuild.toString()).then((guild) => {

        channels.Static.targetGuild = guild
        if (!_config.serverCategory) {console.log("no serverCategory");process.exit(2)}
        
        guild.channels.fetch(_config.serverCategory).then((cat) => {
            if (!cat) {console.log("no category");process.exit(2)}
            if (cat.isText() || cat.isVoice()) {console.log("not category");process.exit(2)}
            if (!_config.archiveCategory) {console.log("no process.env.ARCHIVE_CATEGORY");process.exit(2)}
            guild.channels.fetch(_config.archiveCategory).then((acat) => {
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
    if (_config.role) {
        if (!message.member?.roles.cache.has(_config.role)) {
            return
        }
    }
    if (message.content.startsWith(prefix)) {
        let _args = message.content.slice(prefix.length).split(" ")
        let cmd = _args.splice(0,1)[0].toLowerCase()

        if (Object.values(channels.Dynamic).find(e => e == message.channel)) {
            // Sure there's a better way to do this but too lazy to find it

            for (let [x,v] of Object.entries(channels.Dynamic)) {
                if (v == message.channel) {
                    let foundSession = OptipostServer._connections.find(e => e.id == x)
                    if (!foundSession) {return}
                    
                    // First, try to find a local TS command

                    let ltscmd = channels.local_cmds.find(e => e.names.find(a => a == cmd))
            
                    if (ltscmd) {
                        let args =_args.splice(0,ltscmd.args-1)
                        let lastParameter = _args.join(" ")
                        if (lastParameter) {args.push(lastParameter)}

                        channels.logs[foundSession.id](`${message.author.tag} executed a TS command: ${message.content}`)

                        try {
                            ltscmd.action(foundSession,message,args)
                        } catch {
                            message.reply(`An error occured while running this command. Please try again.`)
                        }
                    } else {
                        // if not, try to find a lua cmd
                        
                        let lcmd = channels.cmdl[foundSession.id].find(e => e.names.find(a => a == cmd))
                        if (lcmd) {
                            let args =_args.splice(0,lcmd.args-1)
                            let lastParameter = _args.join(" ")
                            if (lastParameter) {args.push(lastParameter)}

                            channels.logs[foundSession.id](`${message.author.tag} ExecuteCommand: ${lcmd.id} (${message.content})`)

                            foundSession.Send({
                                type:"ExecuteCommand",
                                commandId:lcmd.id,
                                args:args
                            })
                        }
                    }

                }
            }

        } else {
            // Look for a global cmd

            let globalCmd = channels.global_cmds.find(e => e.names.find(a => a == cmd))
            
            if (globalCmd) {
                let args =_args.splice(0,globalCmd.args-1)
                let lastParameter = _args.join(" ")
                if (lastParameter) {args.push(lastParameter)}

                try {
                    globalCmd.action(message,args)
                } catch {
                    message.reply(`An error occured while running this command. Please try again.`)
                }
            }
        }

    } else {
        // I'm sure there's a much better way to do this,
        // I'm just too lazy to find it right now
        
        if (!message.author.bot) {
            for (let [x,v] of Object.entries(channels.Dynamic)) {
                if (v == message.channel) {
                    let foundSession = OptipostServer._connections.find(e => e.id == x)
                    if (!foundSession) {return}
                    if (!channels.other[foundSession.id].DTRChatEnabled) {return}
                    if (message.content) {
                        foundSession.Send({type:"Chat",data:message.content,tag:message.author.tag,tagColor:message.member?.displayHexColor || "ffefcd"})
                        channels.logs[foundSession.id](`${message.author.tag}: ${message.content}`)
                    }

                    if (Array.from(message.attachments.values())[0]) {
                        channels.logs[foundSession.id](`${message.author.tag} uploaded an image: ${Array.from(message.attachments.values())[0].proxyURL}`)
                        let att = Array.from(message.attachments.values())[0]
                        axios.get(att.proxyURL).then((data) => {
                            if (data.headers["content-type"].startsWith("image/")) {
                                if (foundSession) {
                                    jimp.read(att.proxyURL).then(img => {
                                        if (img.getHeight() > img.getWidth()) {
                                            img.crop(0,(img.getHeight()/2)-(img.getWidth()/2),img.getWidth(),img.getWidth())
                                        } else if (img.getWidth() > img.getHeight()) {
                                            img.crop((img.getWidth()/2)-(img.getHeight()/2),0,img.getHeight(),img.getHeight())
                                        }
                                        
                                        img.resize(100,100)
                                        let dtt:rgba[][] = []
                                        for (let _x = 0; _x < 100; _x++) {
                                            let col:rgba[] = []
                                            for (let y = 0; y < 100; y++) {
                                                col.push(jimp.intToRGBA(img.getPixelColor(_x,y)))
                                            }
                                            dtt.push(col)
                                        }

                                        //@ts-ignore | Find way to not use ts-ignore
                                        foundSession.Send({type:"Image",data:dtt})
                                    })
                                }
                            }
                        }).catch(() => {})
                    }
                }
            }
        }
    }
})

client.login(_config.token)