"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const optipost_1 = require("../optipost");
let opti = new optipost_1.Optipost();
opti.connection.then((connection) => {
    console.log("Connection");
    connection.message.then((data) => {
        console.log(data);
        connection.Send(data);
    });
});
