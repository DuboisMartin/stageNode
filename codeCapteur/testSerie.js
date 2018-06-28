if(process.argv.length < 3){
    console.log("Use : 'node "+ process.argv[1]+" IpAPI'");
    return 0;
}else{
    console.log("IP : "+process.argv[2]);
}


var serialport = require("serialport");
var config = require('config.json')('../config.json');
var SerialPort = serialport.SerialPort;
var moment = require('moment');
const Manager = require('./ManagerPostReal.js');

var Main = new Manager(String(process.argv[2]));

var port = new serialport(config.serial.serial_path, {
    baudRate: Number(config.serial.serial_baudrate),
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
    console.log(moment().format('hh:mm:ss')+"   "+data);
    Main.addData(data);
});