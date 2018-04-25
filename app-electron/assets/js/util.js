var ipcRenderer = require('electron').ipcRenderer; 
ipcRenderer.on('loaded-return', function(arg, data) {
    console.log(arg);
    console.log("recv");
    document.getElementById('bod').insertAdjacentHTML('beforeend', data);
});

ipcRenderer.on('event-return', function(arg, data) {
    console.log('event-return');
    document.getElementById("print").insertAdjacentText(data);
})

window.onload= function(){
    ipcRenderer.send('loaded');
}

document.addEventListener('click', function(event) {
    console.log(event.target.id);
    ipcRenderer.send('event', event.target.id);
});