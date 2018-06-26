var io = require('socket.io-client');

var socket = io('https://upjv.edt.ovh', {
    allowUpgrades: true,
    transports: ['websocket', 'flashsocket', 'polling'],
    rejectUnauthorized: true
});

socket.on('connect', () => {
    console.log(socket.connected);
});

socket.on('connect_error', (error) => {
    console.log(error);
});

socket.on('connect_timeout', (error) => {
    console.log(error);
});

socket.on('error', (error) => {
    console.log(error);
});
