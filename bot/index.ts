import Discord, { Intents } from "discord.js"
import { Optipost, OptipostSession } from "./optipost"

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

// Set up server (http://127.0.0.1:4545/rocontrol)
let OptipostServer = new Optipost(4545,"rocontrol")

client.on("ready",() => {
    console.log(`RoConnect is online.`)
})

client.login(process.env.TOKEN)