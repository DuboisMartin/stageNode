const server = require('http').createServer();

const io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    console.log("Un client est connecté !");
    socket.on('log', function(msg) {
        console.log(msg);
        if(msg == "Martin:Dubois"){
            socket.emit('log-rep', "OK");
        }else{
            socket.emit('log-rep', "NOP");
        }
    });
});

server.listen(3000);