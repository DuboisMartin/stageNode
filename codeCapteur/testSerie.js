if(process.argv.length < 3){
    console.log("Use : 'node "+ process.argv[1]+" IpAPI'");
    return 0;
}else{
    console.log("IP : "+process.argv[2]);
}
var ip = "138.68.79.177"
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var moment = require('moment');
const Manager = require('./ManagerPostReal.js');
var Main = new Manager(String(process.argv[2]));

var port = new serialport("COM3", {
    baudRate: Number(9600),
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
    console.log(moment().format('hh:mm:ss')+"   "+data);
    Main.addData(data);
});