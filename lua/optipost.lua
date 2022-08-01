local module = {}

local Http = game:GetService("HttpService")

function p(url:string,data:string) return Http:PostAsync(url,data) end
function g(url:string,data:string) return Http:GetAsync(url,data) end

local JSON = {
    stringify = function(data) return Http:JSONEncode(data) end,
    parse = function(data) return Http:JSONDecode(data) end
}

function module.new(url:string)
    local clone = table.clone(module)
    
    clone._onopen = Instance.new("BindableEvent")
    clone._onmessage = Instance.new("BindableEvent")
    clone._onclose = Instance.new("BindableEvent")

    clone.onopen = clone._onopen.Event
    clone.onmessage = clone._onmessage.Event
    clone.onclose = clone._onclose.Event

    clone.OpenPosts = 0

    clone.open = false

    clone.url = url

    return clone
end

function module:On(filter,callback)
    if (not filter) then filter = {} end
    local connection = self.onmessage:Connect(function(data) 
        for x,v in pairs(filter) do
            if (v ~= data[x]) then return end -- Filter
        end

        callback(data)
    end)

    return function() connection:Disconnect() end
end

function module:Once(filter,callback)
    if (not filter) then filter = {} end
    local connection
    connection = self.onmessage:Connect(function(data) 
        for x,v in pairs(filter) do
            if (v ~= data[x]) then return end -- Filter
        end

        callback(data)
        connection:Disconnect()
    end)

    return function() connection:Disconnect() end
end

function module:Open()
    if pcall(function() g(self.url) end) then
        self.id = JSON.parse(p(self.url,JSON.stringify({type="EstablishConnection",data={}}))).data.id
        self._onopen:Fire()
        self.open = true
        self:Send({x="x"},true)
    end
end

function module:Send(data,fakePost)
    if (self.open) then
        task.spawn(function()
            self.OpenPosts += 1
            local x = p(self.url,JSON.stringify({type=({[true]="Ping",[false]="Data"})[not not fakePost],data=data,id=self.id}))
            local data = JSON.parse(x)
            self.OpenPosts -= 1
            if (self.OpenPosts == 0) then
                self:Send({x="x"},true)
            end
            if (data.type == "Data") then
                self._onmessage:Fire(data.data)
            end
            if (data.type == "InvalidSessionId") then
                self.Close()
            end
        end)
    end
end

function module:Close()
    p(self.url,JSON.stringify({type="Close",data={x=""},id=self.id}))
    self.open = false
    self._onclose:Fire()
    print("Closed!")
end

return module