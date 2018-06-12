if(process.argv.length < 4){
    console.log("Use : '" + process.argv[0] +" "+ process.argv[1]+" baudrate IpAPI'");
    return 0;
}

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var moment = require('moment');
const Manager = require('./ManagerPostReal.js');
var Main = new Manager(process.argv[3]);

var port = new serialport("COM3", {
    baudRate: Number(process.argv[2]),
    autoOpen: false
});

port.on('open', function() {
    console.log("Port ouvert");
    //setTimeout(function(){port.write('A1D\r\n');console.log('command sended');}, 1500);
});

port.open(function (err) {
    if (err){
        return console.log("Erreur a l'ouverture : " + err.message);
    }
});

port.on('data', function(data){
    console.log(moment().format('hh:mm:ss')+"   "+data.length);
    Main.addData(data);
});