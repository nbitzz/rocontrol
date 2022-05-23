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