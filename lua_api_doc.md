# Lua API docs

Set of APIs used to add commands to RoControl

## Table of Contents

[ut](#ut)
[Commands](#commands)
[Discord](#discord)

## ut

### ut.chat(session)

Do not use (this is only used internally)

### ut.chat(session)

Do not use (this is only used internally)

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
