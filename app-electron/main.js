const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
var ipcMain = require('electron').ipcMain;
const socket = require('socket.io-client')('http://127.0.0.1:3000');
const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let logWindow;
let mainWindow;

function createLogWindow() {
	logWindow = new BrowserWindow({
		x: 400,
		y: 200,
		width: 1200, 
		height: 800,
		icon: 'mis.png',
		title:'Utilitaire API',
		maximizable: false,
		fullscreenable: false,
		resizable: false
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
		x: 400,
		y: 200,
		width: 1200, 
		height: 800,
		icon: 'mis.png',
		title:'Utilitaire API',
		maximizable: false,
		fullscreenable: false,
		resizable: false
	});

	mainWindow.loadURL('file:'+__dirname+'/assets/html/utilitaire.html');

	mainWindow.on('closed', () => {
		mainWindow = null
	});

	function loadPage(event){
		https.get("https://127.0.0.1/api/util/config", function(resp) {
			let data = '';
			resp.on('data', function(chunk) {
				data += chunk;
			});
			resp.on('end', function(){
				for(var i = 0; i<JSON.parse(data).length; i++){
					event.sender.send("loaded-return", "<tr id='id"+ JSON.parse(data)[i].id +"'><td scope=\"row\">"+JSON.parse(data)[i].id+"</td><td scope=\"row\">"+JSON.parse(data)[i].hash.substring(0,10)+"..</td><td scope=\"row\">"+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(11, 19)+' '+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(2, 10)+"</td><td scope=\"row\"> <input type=\"image\" id=\"See:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-eye-open.png\" /> <input type=\"image\" id=\""+"Save:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-disk-saved.png\" /> <input type=\"image\" id=\""+"Delete:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-remove.png\" /> </td></tr>");
				}
			});
		}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	}

	ipcMain.on('loaded', function(event, arg) {
		loadPage(event);
	});

	ipcMain.on('event', function(event, arg) {
		let action = arg.split(':')[0];
		let num = arg.split(':')[1];

		/*electron.dialog.showMessageBox({
			type: 'warning',
			title: 'Suppression',
			message: 'Etes-vous sur de vouloir supprimé cette configuration définitivement ?',
			buttons: ['Oui', 'Non']
		}, function(index){
			console.log(index);
		});*/

		if(action == "See") {
			console.time("dbneed");
			console.log(Date.now());
			https.get("https://127.0.0.1/api/util/config/"+num, function(resp) {
				let data = '';
				resp.on('data', function(chunk) {
					console.log('+');
					data += chunk;
				});
				resp.on('end', function(){
					console.timeEnd("dbneed");
					event.sender.send('event-return', data, "See");
				});
			}).on("error", (err) => {
				console.log("Error: " + err.message);
			});
		}else if(action == "Save") {
			console.time("dbSave");
			console.log(Date.now());
			https.get("https://127.0.0.1/api/util/config/"+num+"/save/", function(resp) {
				let data= '';
				resp.on('data', function(chunk) {
					data += chunk;
				}),
				resp.on('end', function() {
					console.timeEnd("dbSave");
					event.sender.send('event-return', data, "Save")
				});
			}).on("error", (err) => {
				console.log("Error: " + err.message);
			});
		}else if(action == "Delete") {
			console.time("dbDelete");
			console.log(Date.now());
			https.get("https://127.0.0.1/api/util/config/"+num+"/delete/", function(resp) {
				let data = '';
				resp.on('data', function(chunk) {
					data += chunk;
				}),
				resp.on('end', function() {
					console.timeEnd("dbDelete");
					event.sender.send('event-return', data, "Delete");
					mainWindow.webContents.executeJavaScript("document.getElementById(\"id"+num+"\").remove()");
				});
			}).on("error", (err) => {
				console.log("Error: " + err.message);
			});
		}
	});
}