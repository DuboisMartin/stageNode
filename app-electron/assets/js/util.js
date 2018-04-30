var ipcRenderer = require('electron').ipcRenderer; 
ipcRenderer.on('loaded-return', function(arg, data) {
    console.log(arg);
    console.log("recv");
    document.getElementById('bod').insertAdjacentHTML('beforeend', data);
});

ipcRenderer.on('event-return', function(arg, data) {
    console.log('event-return');
    document.getElementById("print")
    var dec = new TextDecoder("ASCII");
    var raw_data = String(JSON.parse(data.substring(1, data.length-1)).raw_data.data).split(',');

    var size = raw_data.length;

    var buffer = new ArrayBuffer(size);

    for(var i = 0; i < size; i++){
        buffer[i] = Number(raw_data[i]).toString(16);
    }
    document.getElementById("print").insertAdjacentText('afterbegin', dec.decode(buffer));
})

window.onload= function(){
    ipcRenderer.send('loaded');
}

document.addEventListener('click', function(event) {
    console.log(event.target.id);
    ipcRenderer.send('event', event.target.id);
});