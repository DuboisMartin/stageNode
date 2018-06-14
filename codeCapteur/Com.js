var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var moment = require('moment');

var port = new serialport("COM3", {
    baudRate: Number(9600),
    autoOpen: false
});

port.on('open', function(){
    console.log("Port ouvert");
    var buf = Buffer.from('A1I\r');
    port.write(buf);
});

port.on('data', function(data) {
    console.log(moment().format('hh:mm:ss')+"... "+data);
})

port.open(function(err) {
    if(err) throw err;
})