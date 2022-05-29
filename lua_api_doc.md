# Lua API docs

Set of APIs used to add commands to RoControl

## Table of Contents

[ut](#ut)

[Commands](#commands)

[Discord](#discord)

[Util](#util)

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