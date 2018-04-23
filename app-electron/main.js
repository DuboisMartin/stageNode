const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
var ipcMain = require('electron').ipcMain;
const socket = require('socket.io-client')('http://127.0.0.1:3000');


let mainWindow

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200, 
		height: 800,
		icon: 'mis.png',
		title:'Utilitaire API',
		maximizable: false
	});

	mainWindow.loadURL('file:'+__dirname+'/index.html');

	mainWindow.on('closed', () => {
		mainWindow = null
	});

	const tray = new Tray('mis.png');
	tray.setToolTip('Utilitaire API');

	ipcMain.on('send', function(event, arg) {
		console.log(arg);
		socket.open();
		socket.emit('log', arg);		
	});
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if(process.platform !== 'darwin'){
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow === null){
		createWindow();
	}
});

socket.on('log-rep', function(rep){
	console.log(rep);
});