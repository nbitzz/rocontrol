local Players = game:GetService("Players")
-- Modules

local Optipost = require(script.Optipost)

-- Config

local DefaultConfig = {
    -- Target URL
    URL = "http://127.0.0.1:4545/rocontrol"
}

-- Code

local ut = {}

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

    for x,v in pairs(game:GetService("Players"):GetPlayers()) do
        ut._initChat(session,v)
    end

    local c = game:GetService("Players").PlayerAdded:Connect(function(p)
        ut._initChat(session,p)
    end)

    session.onclose:Connect(function()
        c:Disconnect()
    end)
end

local Actions = {
    Ready = function(session,data)
        session:Send({
            type = "GetGameInfo",
            data = game.JobId,
            gameid = tonumber(game.PlaceId)
        })
    end
}

function StartSession(config)
    local Config = config or DefaultConfig

    local OptipostSession = Optipost.new(Config.URL)

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