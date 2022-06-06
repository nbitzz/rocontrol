# Lua API docs

Set of APIs used to add commands to RoControl

## Table of Contents

[ut](#ut)

[Commands](#commands)

[Discord](#discord)

[Util](#util)

[Server](#server)

[Session](#session)

## ut

### ut.chat(session)

Do not use (this is only used internally)

Sets up Roblox to Discord chat

### ut._initChat(session)

Do not use (this is only used internally)

Used by ut.chat (listener)

### ut.init(session)
Do not use (this is only used internally)

Creates a new ut api for the session

## Commands

### Array ut.commands.commands

Contains all the commands

### void ut.commands:addCommand(id,commandAliases,desc,args_amt,action)

Adds a command
```lua
ut.commands:addCommand("testapp.test",{"test"},"Test command",1,function(args) 
    ut.discord:Say("You passed in: "..args[1])
end)
```

## Data

### void ut.data:Set(key,value)

Sets data

### YIELDS any ut.data:Get(key)

Returns data

## Discord

### void ut.discord:Say(data)

Sends a message in the connected Discord channel
```lua
ut.discord:Say("Hello world!")
```

### YIELDS string ut.discord:Send(data)

Sends a message in the connected Discord channel. Returns the ID.
```lua
ut.discord:Send("Hello world!")
```

### void ut.discord:Edit(id,data)

Edits a message in the connected Discord channel
```lua
ut.discord:Edit(id,"Hello world!")
```

### void ut.discord:Delete(id)

Deletes a message in the connected Discord channel
```lua
ut.discord:Delete(id)
```

### void ut.discord:ViaWebhook(data)

Sends a message in the connected Discord channel using the webhook used for chat messages
```lua
ut.discord:ViaWebhook({
    content="Hello world!",
    avatar_url="http://loremflickr.com/64/64/cat",
    username="Hello"
})
```

### YIELDS boolean ut.discord:GetChatEnabled()
Returns whether or not Discord to Roblox chat is enabled.

### void ut.discord:SetChatEnabled(enabled)

Disable/enable Discord to Roblox chat.
```lua
ut.commands:addCommand("testapp.vanish",{"vanish"},"Disable/enable Discord to Roblox chat",1,function(args) 
    local enabled = not ut.discord:GetChatEnabled()
    ut.discord:Say(enabled and "Discord to Roblox chat enabled" or "Discord to Roblox chat disabled")
    ut.discord:SetChatEnabled(enabled)
end)
```

## Util

### boolean ut.util.startsWith(target,str)

Checks if a string starts with another string

### Array<Player> ut.util.getPlayers(search:string)

Search for players. Returns array.
```lua
ut.commands:addCommand("mod.kick",{"kick","k"},"Kick plr",2,function(args) 
    local players = ut.util.getPlayers(args[1] or "")
    if (players[1]) then
        players[1]:Kick(args[2] or "No reason specified")
        ut.discord:Say(string.format("Successfully kicked ``%s``.",players[1].name))
    else
        ut.discord:Say(string.format("No players matching ``%s``.",args[1]))
    end
end)
```

## Server

### void ut.server:Eval(str)
Runs eval() on the RoControl server. **It is recommended to either disable this function using config.json's api-disable, or wait for a way to add passwords to RoControl in the future.**

### YIELDS string ut.server:Glot(name,data)
Creates a snippet on glot.io. Returns the snippet URL.
```lua
ut.commands:addCommand("mod.getOutput",{"getoutput","output","o"},"Post output logs to glot.io",0,function() 
    local logs = game:GetService("LogService"):GetLogHistory()
    local mappedLogs = {}
    table.foreach(logs,function(index,log) 
        local messagetypes = {
            [Enum.MessageType.MessageInfo] = "INFO",
            [Enum.MessageType.MessageOutput] = "PRNT",
            [Enum.MessageType.MessageError] = "ERR!",
            [Enum.MessageType.MessageWarning] = "WARN"
        }
        table.insert(
            mappedLogs,
            string.format(
                "%s %s   %s",
                messagetypes[log.messageType],
                os.date("%X",log.timestamp),
                log.message
            )
        )
    end)

    local url = ut.server:Glot("Roblox Output - RoControl",table.concat(mappedLogs,"\n"))

    ut.discord:Say("Output dumped at "..url)
end)
```

### YIELDS string[] ut.server:GetFeatures(all)
Returns array of all available features. If `all` is true, disabled features will be included.

### string ut.server:Log(data)
Adds to the glot.io logs

### YIELDS {data: {[key: string]: any}, headers:{[key: string]: any}, error:boolean} ut.server:Get(url)
Uses the server to send a GET request.

### YIELDS {r:number,g:number,b:number,a:number}[][] ut.server:ProcessImage(url)
Resizes and crops image to 100x100 and converts it to pixels. 

```lua
local cat = ut.server:ProcessImage("https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg")
local testPart = Instance.new("Part")
local pSG = Instance.new("SurfaceGui",testPart)
testPart.Size = Vector3.new(3,3,1)
testPart.Position = Vector3.new(0,50,0)

for xPos,column in pairs(cat) do
    local csK = {}
    for yPos,color in pairs(column) do
        table.insert(csK,ColorSequenceKeypoint.new((((yPos-1)%20)*0.05)/0.95,Color3.fromRGB(color.r,color.g,color.b)))
    end
    for i = 0, 4 do
        local realCSK = {}
        local l = (20*i)+1
        table.move(csK,l,20*(i+1),1,realCSK)
        local f = Instance.new("Frame",pSG)
        f.Position = UDim2.new((xPos-1)*0.01,0,i*0.2,0)
        f.Size = UDim2.new(0.01,0,0.2,0)
        f.BorderSizePixel = 0
        f.BackgroundColor3 = Color3.new(1,1,1)
        local g = Instance.new("UIGradient",f)
        g.Rotation = 90
        g.Color = ColorSequence.new(realCSK)
        g.Parent = f
    end
end
testPart.Parent = workspace
```

## Session

This section documents Optipost. **ONLY** use this if you're trying to manipulate Optipost.

### void ut.Session:Open()

Opens session. Do not use.

### void ut.Session:Send(data,isPing)

Sends data. isPing is only used internally. If it is true, the data will not be processed.

### void ut.Session:Close()

Closes the session.

### ()=>void ut.Session:Once(filter,callback)

Listens for new requests that match the filter, then calls the callback function. The connection is automatically disconnected after a request meets the filter. Calling the returned function will disconnect the event.

### ()=>void ut.Session:On(filter,callback)

Listens for new requests that match the filter, then calls the callback function. Calling the returned function will disconnect the event.