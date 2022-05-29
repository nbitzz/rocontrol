# RoControl
A simple Discord bot that connects to a Roblox game.

Requires discord.js v13, express, jimp, axios, dotenv, and body-parser. HTTP must be enabled.

**RoControl is not designed for usage in script builders.** If you see RoControl running in a script builder, it is most likely with a custom loader and package.

## License

RoControl is licensed under the GNU GPL v2 license. [View it here.](https://github.com/nbitzz/rocontrol/blob/main/LICENSE)

## Setup

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