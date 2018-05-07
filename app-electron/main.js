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
		maxWidth: 1200,
		maxHeight: 800,
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

socket.on('New-Capteurs', function(data) {
	mainWindow.webContents.executeJavaScript("let myNotification = new Notification('Nouveaux capteur !', {body: 'Un nouveaux capteurs a était détecter!'}); if(document.getElementById('idSelect').options.length){document.getElementById('idSelect').insertAdjacentHTML('beforeend','<option>"+data+"</option>')}");
});

function createMainWindow() {
	mainWindow = new BrowserWindow({
		x: 400,
		y: 200,
		width: 1200, 
		height: 800,
		maxWidth: 1200,
		maxHeight: 800,
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
					if(JSON.parse(data)[i].used == true){
						event.sender.send("loaded-return", "<tr class='table-active' id='id"+ JSON.parse(data)[i].id +"'><td scope=\"row\">"+JSON.parse(data)[i].id+"</td><td scope=\"row\">"+JSON.parse(data)[i].hash.substring(0,10)+"..</td><td scope=\"row\">"+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(11, 19)+' '+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(2, 10)+"</td><td scope=\"row\"> <input type=\"image\" id=\"See:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-eye-open.png\" /> <input type=\"image\" id=\""+"Save:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-disk-saved.png\" /> <input type=\"image\" id=\""+"Delete:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-remove.png\" /> </td></tr>");
					}else{
						event.sender.send("loaded-return", "<tr id='id"+ JSON.parse(data)[i].id +"'><td scope=\"row\">"+JSON.parse(data)[i].id+"</td><td scope=\"row\">"+JSON.parse(data)[i].hash.substring(0,10)+"..</td><td scope=\"row\">"+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(11, 19)+' '+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(2, 10)+"</td><td scope=\"row\"> <input type=\"image\" id=\"See:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-eye-open.png\" /> <input type=\"image\" id=\""+"Save:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-disk-saved.png\" /> <input type=\"image\" id=\""+"Delete:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-remove.png\" /> </td></tr>");
					}
				}
				mainWindow.webContents.executeJavaScript("var a = document.querySelectorAll('[id^=\"id\"]');for(i = 0; i < a.length; i++){a[i].addEventListener('click', function(event) {ipcRenderer.send('event', event.target.id);})}");
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
			https.get("https://127.0.0.1/api/util/config/"+num+"/use/", function(resp) {
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

	function ab2str(buf) {
		return String.fromCharCode.apply(null, new Uint16Array(buf));
	}
	
	ipcMain.on('SeeCapteurs', function(event, arg) {
		console.log(":");
		https.get("https://127.0.0.1/api/util/config/current", function(resp) {
			let data = '';
			resp.on('data', function(chunk) {
				data += chunk;
			});
			resp.on('end', function() {
				var raw_data = String(JSON.parse(data.substring(1, data.length-1)).raw_data.data).split(',');
				var capteurs = JSON.parse(ab2str(raw_data)).capteurs;
				for(var i = 0; i<JSON.parse(ab2str(raw_data)).capteurs.length; i++){
					if(capteurs[i].id != undefined){	
						event.sender.send("SeeCapteurs-return", "<tr><td scope='row'>"+capteurs[i].id+"</td><td scope='row'>"+capteurs[i].alias+"</td><td scope='row'>"+capteurs[i].description+"</td><td scope='row'>"+capteurs[i].unit+"</td><td scope='row'>"+capteurs[i].etc+"</td></tr>");
					}
				}
			});
		}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	});
}