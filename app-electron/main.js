const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
var ipcMain = require('electron').ipcMain;
const socket = require('socket.io-client')('http://127.0.0.1:3000');
const https = require('https');
var tmp = require('tmp');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let logWindow;
let mainWindow;

function createLogWindow() {
	logWindow = new BrowserWindow({
		width: 1200, 
		height: 800,
		icon: 'mis.png',
		title:'Utilitaire API',
		maximizable: false
	});

	logWindow.loadURL('file:'+__dirname+'/assets/html/index.html');

	logWindow.on('closed', () => {
		logWindow = null
	});

	ipcMain.on('send', function(event, arg) {
		console.log(arg);
		socket.open();
		socket.emit('log', arg);		
	});
}

app.on('ready', createLogWindow);

app.on('window-all-closed', () => {
	if(process.platform !== 'darwin'){
		app.quit();
	}
});

app.on('activate', () => {
	if (logWindow === null){
		createWindow();
	}
});

socket.on('log-rep', function(rep){
	console.log(rep);
	if(rep == 'OK'){
		logWindow.hide();
		createMainWindow();
		logWindow.close();
	}
});

function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 1200, 
		height: 800,
		icon: 'mis.png',
		title:'Utilitaire API',
		fullscreenable: true,
		resizable: true,
		focusable: true
	});

	mainWindow.loadURL('file:'+__dirname+'/assets/html/utilitaire.html');

	mainWindow.on('closed', () => {
		mainWindow = null
	});

	ipcMain.on('loaded', function(event, arg) {
		https.get("https://127.0.0.1/api/util/config", function(resp) {
			let data = '';
			resp.on('data', function(chunk) {
				data += chunk;
			});
			resp.on('end', function(){
				for(var i = 0; i<JSON.parse(data).length; i++){
					event.sender.send("loaded-return", "<tr><td scope=\"row\">"+JSON.parse(data)[i].id+"</td><td scope=\"row\">"+JSON.parse(data)[i].hash.substring(0,10)+"..</td><td scope=\"row\">"+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(11, 19)+' '+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(2, 10)+"</td><td scope=\"row\"><input type=\"image\" id=\""+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-eye-open.png\" /><input type=\"image\" id=\""+"buttonSave"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-remove.png\" /></td></tr>");
				}
			});
		}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	});

	ipcMain.on('event', function(event, arg) {
		console.log(arg);
		if(!isNaN(Number(arg))){
			console.time("dbneed");
			console.log(Date.now());
			https.get("https://127.0.0.1/api/util/config/"+arg, function(resp) {
				let data = '';
				resp.on('data', function(chunk) {
					console.log('+');
					data += chunk;
				});
				resp.on('end', function(){
					console.timeEnd("dbneed");
					event.sender.send('event-return',data);
				});
			}).on("error", (err) => {
				console.log("Error: " + err.message);
			});
		} 
	});
}