const Manager = require('./ManagerPost.js');

require('dotenv').config({path: '../config.env'});

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var Main = new Manager();

var port = new serialport(process.env.SERIAL_PATH, {
    baudRate: Number(process.env.SERIAL_BAUDRATE),
    autoOpen: false
});

port.on('open', function() {
    console.log("Port ouvert");
});

port.open(function (err) {
    if (err){
        return console.log("Erreur a l'ouverture : " + err.message);
    }
});

port.on('data', function(data){
    Main.addData(data);
});

