-- Modules

local Optipost = require(script.Optipost)

-- Config

local DefaultConfig = {
    -- Target URL
    URL = "http://127.0.0.1:4545/rocontrol"
}

-- Code

local Actions = {
    Ready = function(session,data)
        session:Send({
            type = "GetJobId",
            data = game.JobId
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

    return OptipostSession
end

return StartSession