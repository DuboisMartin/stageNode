const Manager = require('./ManagerPost.js');

var config = require('config.json')('../config.json');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var Main = new Manager();

var port = new serialport("COM3", {
    baudRate: Number(9600),
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

