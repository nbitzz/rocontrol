# RoControl
A simple Discord bot that connects to a Roblox game.

Requires discord.js v13, express, dotenv, and body-parser.

## License

RoControl is licensed under the GNU GPL v2 license. [View it here.](https://github.com/nbitzz/rocontrol/blob/main/LICENSE)

## Setup

Press CTRL + SHIFT + B in Visual Studio Code (or run `npx tsc`), then create a .env file, and set the TOKEN variable to your bot's token. Run the `./server_out/index.js` script using Node.js.

### Hosting on Glitch
Import this project (in the TOOLS section), build the TS files, and then set the TOKEN .env variable.

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