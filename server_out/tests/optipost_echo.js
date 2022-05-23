"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const optipost_1 = require("../optipost");
let opti = new optipost_1.Optipost();
opti.connection.then((connection) => {
    connection.message.then((data) => {
        connection.Send(data);
    });
});
