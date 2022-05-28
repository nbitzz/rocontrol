local Players = game:GetService("Players")
-- Modules

local Optipost = require(script.Optipost)

-- Config

local DefaultConfig = {
    -- Target URL
    URL = "http://127.0.0.1:3000/rocontrol",
}

-- Code

local ut = {}

ut.ChatService = require(
    game:GetService("ServerScriptService")
        :WaitForChild("ChatServiceRunner")
        :WaitForChild("ChatService")
)

ut.Speaker = ut.ChatService:AddSpeaker("RoControl")
ut.Speaker:JoinChannel("All")

-- ut commands

ut.commands = {
    commands = {},
    Session = nil
}

function ut.commands:addCommand(id,commandAliases,desc,args_amt,action)
    if not self.Session then error("Cannot addCommand when Session is nil.") end

    ut.commands.commands[id] = action

    self.Session:Send({
        type = "RegisterCommand",
        names = commandAliases,
        id = id,
        args_amt = args_amt,
        desc=desc
    })
end

-- ut.discord

ut.discord = {
    Session = nil
}

function ut.discord:Say(str)
    if not self.Session then error("Cannot say when Session is nil.") end
    self.Session:Send({
        type = "Say",
        data=str
    })
end

-- ut.data

ut.data = {
    Session = nil
}

function ut.data:Set(key,value)
    if not self.Session then error("Cannot Set when Session is nil.") end
    self.Session:Send({
        type = "SetData",
        value=value,
        key=key
    })
end

function ut.data:Get(key)
    -- Bad method of doing this but I don't wanna use promise api for such a simple thing so
    if not self.Session then error("Cannot Get when Session is nil.") end
    local d
    local a = self.Session.onmessage:Connect(function(s)
        if (s.type == "Data") then
            if s.data.type == "UtData" then
                d = s.data.data
            end
        end
    end)
    self.Session:Send({
        type = "GetData",
        key=key
    })
    repeat task.wait() until d

    a:Disconnect()

    return d
end

-- ut.util

ut.util = {
    Session = nil
}

function ut.util.startsWith(target,str)
    return string.sub(target,1,string.len(str)) == str
end

function ut.util.getPlayers(str)
    local players = {}
    for x,v in pairs(Players:GetPlayers()) do
        -- No better alternatives
        -- Or there is but I'm too lazy to find them, this will do
        -- for now

        -- TODO: make this NOT suck!!!
        if (str == tostring(v.UserId)) then
            table.insert(players,v)
        elseif (ut.util.startsWith(string.lower(v.Name),str:lower())) then
            table.insert(players,v)
        elseif (ut.util.startsWith(string.lower(v.DisplayName),str:lower())) then
            table.insert(players,v)
        end
    end
    return players
end
-- ut.chat

function ut._initChat(session,player:Player)
    local c = player.Chatted:Connect(function(msg)
        session:Send({
            type = "Chat",
            data = msg,
            userid = tostring(player.UserId),
            username = player.Name,
            displayname = player.DisplayName
        })
    end)

    session.onclose:Connect(function()
        c:Disconnect()
    end)
end

function ut.chat(session) 
    print("Chat logging ready.")

    for x,v in pairs(Players:GetPlayers()) do
        ut._initChat(session,v)
    end

    local c = Players.PlayerAdded:Connect(function(p)
        ut._initChat(session,p)
    end)

    session.onclose:Connect(function()
        c:Disconnect()
    end)
end

-- ut init

function ut.init(session)
    local x = table.clone(ut)
    x.commands.Session = session
    x.discord.Session = session
    x.data.Session = session
    x.Session = session
    return x
end

local Actions = {
    Ready = function(session,data)
        session:Send({
            type = "GetGameInfo",
            data = game.JobId,
            gameid = tonumber(game.PlaceId)
        })

        -- init packages
        if script:FindFirstChild("packages") then
            for x,v in pairs(script.packages:GetChildren()) do
                if (v:IsA("ModuleScript")) then
                    require(v)(session.api)
                end
            end
        end
    end,
    Chat = function(session,data)
        ut.Speaker:SayMessage(data.data,"All",{Tags={
            {
                TagText = "as "..data.tag,
                TagColor = Color3.fromHex(data.tagColor or "#FFFFFF")
            }
        },NameColor=Color3.new(1,0,0)})
    end,
    Image = function(session,data)
        if #Players:GetPlayers() <= 6 then
            local parentG = Instance.new("ScreenGui")

            for xPos,xVal in pairs(data.data) do
                for yPos,yVal in pairs(xVal) do
                    local _f = Instance.new("Frame")
                    _f.Position = UDim2.new(0.01*(xPos-1),0,0.01*(yPos-1),0)
                    _f.BorderSizePixel = 0
                    _f.Size = UDim2.new(0.01,0,0.01,0)
                    _f.BackgroundColor3 = Color3.fromRGB(yVal.r,yVal.g,yVal.b)
                    _f.BackgroundTransparency = (255-yVal.a)/255
                    _f.Parent = parentG
                end
            end

            local toCleanup = {
                parentG
            }

            for x,v in pairs(Players:GetPlayers()) do
                local _g = parentG:Clone()
                _g.Parent = v.PlayerGui
                table.insert(toCleanup,_g)
            end

            session:Send({
                type = "Say",
                data="Image sent."
            })

            task.wait(5)

            for x,v in pairs(toCleanup) do
                if v then
                    v:Destroy()
                end
            end
        else
            session:Send({
                type = "Say",
                data="Too many players! Since we don't want to crash the server, I have not sent the image to screens."
            })
        end
    end,
    ExecuteCommand = function(session,data)
        if (session.api.commands.commands[data.commandId]) then
            session.api.commands.commands[data.commandId](data.args)
        end
    end
}

function StartSession(config)
    local Config = config or DefaultConfig

    local OptipostSession = Optipost.new(Config.URL)

    OptipostSession.api = ut.init(OptipostSession)

    OptipostSession.onmessage:Connect(function(data)
        if (Actions[data.type or ""]) then
            Actions[data.type or ""](OptipostSession,data)
        end
    end)

    OptipostSession.onopen:Connect(function(data)
        print("Connected to RoControl. Waiting for server to send back Ready...")
    end)

    OptipostSession:Open()

    ut.chat(OptipostSession)

    return OptipostSession
end

return StartSession