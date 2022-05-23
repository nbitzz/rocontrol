import { Optipost, OptipostSession } from "../optipost"

let opti = new Optipost()

opti.connection.then((connection:OptipostSession) => {
    connection.message.then((data) => {
        connection.Send(data)
    })
})