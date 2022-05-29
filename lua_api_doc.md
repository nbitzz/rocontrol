# Lua API docs

Set of APIs used to add commands to RoControl

## Table of Contents

[ut](#ut)

[Commands](#commands)

[Discord](#discord)

[Util](#util)

[Server](#server)

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
ut.commands:AddCommand("testapp.test",{"test"},"Test command",1,function(args) 
    ut.discord:Say("You passed in: "..args[1])
end)
```

## Data

### void ut.data:Set(key,value)

Sets data

### YIELDS any ut.data:Get(key)

Returns data

## Discord

### void ut.discord:Say(str)

Sends a message in the connected Discord channel
```lua
ut.discord:Say("Hello world!")
```

### void ut.discord:Say(str)

Sends a message in the connected Discord channel
```lua
ut.discord:Say("Hello world!")
```

### YIELDS string ut.discord:Send(str)

Sends a message in the connected Discord channel. Returns the ID.
```lua
ut.discord:Send("Hello world!")
```

### void ut.discord:Edit(id,str)

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

### {r:number,g:number,b:number,a:number}[][] ut.server:ProcessImage(url)
Resizes and crops image to 100x100 and converts it to pixels. 

```lua
local cat = ut.server:ProcessImage("https://loremflickr.com/cache/resized/65535_51914473002_70ae3d8ae0_q_100_100_nofilter.jpg")
local testPart = Instance.new("Part")
local pSG = Instance.new("SurfaceGui",testPart)
testPart.Size = Vector3.new(3,3,1)
testPart.Position = Vector3.new(0,50,0)

for xPos,column in pairs(cat) do
    local csK = {}
    for yPos,color in pairs(column) do
        table.insert(csK,ColorSequenceKeypoint.new(yPos*0.01,Color3.fromRGB(color.r,color.g,color.b)))
    end
    local f = Instance.new("Frame",pSG)
    f.Position = UDim2.new(xPos*0.01,0,0,0)
    f.Size = UDim2.new(0.01,0,1,0)
    f.BorderSizePixel = 0
    f.BackgroundColor3 = Color3.new(1,1,1)
    local g = Instance.new("UIGradient",f)
    g.Rotation = 90
    g.Color = ColorSequence.new(csK)
    g.Parent = f
end
```