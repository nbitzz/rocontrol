<h1 align="center">
<img src="https://github.com/nbitzz/rocontrol/blob/dev/assets/rocontrol-app-icon.png" width="200" height="200"><br>
RoControl<br>
<img src="https://img.shields.io/github/license/nbitzz/rocontrol"></img>
<img src="https://img.shields.io/github/package-json/v/nbitzz/rocontrol/dev"></img>
<img src="https://img.shields.io/github/package-json/v/nbitzz/rocontrol/main"></img><br>
</h1>

<p align="center"><img src="https://uc812c8fd442b566c8f8214c92bf.previews.dropboxusercontent.com/p/thumb/ABk7--VUtbPstbZnlJ5gSjfjuPf43eihcA0irp9aRPjpsFCEyvgJTBwh-Iy7pekSGlsJES_Jk9JAGUL_aoyHIYm9seLPRlxX5YY-qpQT5j6kh7STZfvhJQZuqBdXAWKl5TWiDdYCanddGmGNE9_lF89oYTtqFooBqYwZpx5SWTpRyxYHss6gWIlcprdxO9XPzMpSifuF3o1x44XhHTaUMASnEklUi1JqCVHYVrrl8EDml6721NMxyiaAWQQ6C8kIY7lWMRe8sYNtaJWN3AH-MweAnQwc7LA4O8yK5cSEhRu74I1vfuTa_VfEbF4aG20jVbwnJZTWFk3_-Zaiunm3eLIgILKf-lXWGj8Vs3LuY9ezwUU0xWN0-9-_y6Sv6WTNbT4/p.png" width="200"><br>
<em>Not affiliated with Roblox Corporation</em><br><br><a href="https://github.com/nbitzz/rocontrol/tree/main"><code>main</code></a> <a href="https://github.com/nbitzz/rocontrol/tree/dev"><code>dev</code></a>
</p>

A simple Discord bot that connects to a Roblox game.

Requires discord.js v13, express, jimp, axios, and body-parser. HTTP must be enabled.



**RoControl is not designed for usage in script builders.** If you see RoControl running in a script builder, it is most likely with a custom loader and package.

## License

RoControl is licensed under the GNU GPL v2 license. [View it here.](https://github.com/nbitzz/rocontrol/blob/main/LICENSE)

## Setup (New)

Press CTRL + SHIFT + B in Visual Studio Code (or run `npx tsc`), then create a config.json file. Run the `./server_out/index.js` script using Node.js.
Your config.json file should look like this:
```json
{
    "token":"DEMO.TOKEN",
    "targetGuild":"957424000265506846",
	"serverCategory":"978438656664678410",
	"archiveCategory":"978517203018219561",
	"prefix":">",
	"role":"980692476769734666", // Optional
	"log_channel":"987183903485882408", // Optional
	"api-disable":[ // Add this field to block certain API endpoints from being run on the server
		"RunEval"
	],
	// Adding RunEval to api-disable will prevent ut.server:Eval() from being run. This is recommended. If you don't add this to api-disable, anyone who connects to your RoControl host server can run custom code.
}
```

## Setup (Old)

Press CTRL + SHIFT + B in Visual Studio Code (or run `npx tsc`), then create a .env file, and set the TOKEN variable to your bot's token. Run the `./server_out/index.js` script using Node.js.
Also, in .env, make sure to include the target guild's ID, the category you want to display the active servers, an archive category, and the bot prefix. **WARNING: The bot will automatically clear this category of all of its channels on startup. Please create a new category for RoControl.**
Your .env file should look like this:
```
TOKEN=DEMO.TOKEN
TARGET_GUILD=957424000265506846
CATEGORY=978438656664678410
ARCHIVE_CATEGORY=978517203018219561
RC_PFX=$
```

### Hosting on Glitch
Import this project (in the TOOLS section), build the TS files, and then set the TOKEN .env variable. Also set the other variables listed above.

## Optipost - Examples

### Server

```ts
import { Optipost, OptipostSession } from "../optipost"

let opti = new Optipost()

opti.connection.then((connection:OptipostSession) => {
    console.log("Connection")
    connection.message.then((data) => {
        console.log(data)
        connection.Send(data)
    })
})
```

### Client
```lua
local opti = require(script.Parent.opti)

local op = opti.new("http://127.0.0.1:3000/opti")

op.onopen:Connect(function()
	print("Open!")
	print(op.id)
	while task.wait(3) do
		print("Attempted sending")
		op:Send({Hello="World"})
	end
end)

op.onmessage:Connect(function(data)
	print(data)
end)

op:Open()
```
