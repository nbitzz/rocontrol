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

## Discord

### void ut.discord:Say(str)

Sends a message in the connected Discord channel
```lua
ut.discord:Say("Hello world!")
```

## Util

### ut.util.startsWith(target,str)

Checks if a string starts with another string

### ut.util.getPlayers(search:string)

Search for players. Returns array.
```lua
ut.commands:AddCommand("mod.kick",{"kick","k"},"Kick plr",2,function(args) 
    local players = ut.util.getPlayers(args[1] or "")
    if (players[1]) then
        players[1]:Kick(args[2] or "No reason specified")
        ut.discord:Say(string.format("Successfully kicked ``%s``.",players[1].name))
    else
        ut.discord:Say(string.format("No players matching ``%s``.",args[1]))
    end
end)
```