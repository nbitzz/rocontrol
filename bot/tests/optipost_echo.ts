import { Optipost, OptipostSession } from "../optipost"

let opti = new Optipost()

opti.connection.then((connection:OptipostSession) => {
    console.log("Connection")
    connection.message.then((data) => {
        console.log(data)
        connection.Send(data)
    })
})