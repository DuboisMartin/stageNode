//Importation de tout les modules nécessaire. 
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
var ipcMain = require('electron').ipcMain;
const https = require('https');
const querystring = require('querystring');
const Config = require('electron-config');
const config = new Config();
const io = require( 'socket.io-client' )

//Pour les tests ou le certificat ssl est auto-signé.
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let logWindow;
let mainWindow;

//Fonction qui créer et s'occupe de la fenêtre de login?
function createLogWindow() {
	//On instancie la fenêtre en elle même avec les options obligatoire.
	logWindow = new BrowserWindow({
		x: 400,
		y: 200,
		width: 1200, 
		height: 800,
		maxWidth: 1200,
		maxHeight: 800,
		icon: 'mis.png',
		title: 'Utilitaire API'
	});

	//On importe l'apparence de cette page depuis les fichiers d'assets.
	console.log(app.getPath("appData"));
	logWindow.loadURL('file:'+__dirname+'/assets/html/index.html');

	//On gère le cas ou le fenêtre serait fermée.
	logWindow.on('closed', () => {
		logWindow = null
	});

	//Le module ipc permet de communiqué entre les différente page de rendu(fenêtres) et le processus maître.
	ipcMain.on('askHost', function(event, arg) {
		//Lorsque la page demande l'hôte
		//Si un hôte est enregistré dans la configuration on envois la valeur pour l'afficher dans l'endroit correspondant.
		//Sinon on signal qu'il n'y est pas et qu'il faut donc que l'utilisateur le renseigne.
		if(config.has('host'))
			event.sender.send('host', config.get('host'));
		else
			event.sender.send('host', 'NOP');
	});

	//Lorsque l'utilisateur appuis sur le bouton de connexion.
	ipcMain.on('send', function(event, arg) {
		console.log(arg);
		//On reçois le nom d'utilisateur et le mdp séparés par ':'
		config.set('host',arg.split(':')[2]);
		//On créer donc un socket avec l'adresse hôte et le port 443 pour https.
		var socket = io( 'https://'+config.get('host')+':443', { rejectUnauthorized: false } );
		//On ouvre la connexion.
		socket.open();
		//On envois les identifiants et on attend la réponse plus bas.
		socket.emit('log', arg.split(':')[0]+':'+arg.split(':')[1]);
		
		//Lorsque l'on reçoit la réponse.
		socket.on('log-rep', function(rep){
			console.log("REP : "+rep);
			//Si on la réponse est positive
			if(rep == 'OK'){
				//On cache la première fenêtre puis on créer la fenêtre principale avant de la fermée.
				//Si on supprime la fenêtre de connexion avant d'avoir créer la fenêtre principale, le programme considére
				//que n'ayants plus de fenêtre active, il doit ce terminé.
				logWindow.hide();
				createMainWindow();
				logWindow.close();
			}
		});
		//Lorsque qu'on reçoit un message signalant qu'un nouveaux capteurs est disponible, on créer une notification.
		socket.on('New-Capteurs', function(data) {
			console.log("New capteurs.")
			mainWindow.webContents.executeJavaScript("new Notification('Nouveaux capteur !', {body: 'Un nouveaux capteurs a était détecter!'});var x = document.getElementById('idSelect'); var bool = false;for(var i = 0; i<x.options.length; i++){if(x.options[i].value == '"+data+"'){bool = true;}}if(!bool){var y = document.createElement('option');y.text = '"+data+"';y.selected='selected';x.add(y);}");
		});
	});
}


//Lorsque le programme en arrière plan est prêt, on créer la fenêtre de login.
app.on('ready', createLogWindow);

//Si toutes les fenêtres sont fermées, on ferme le programme.
app.on('window-all-closed', () => {
	if(process.platform !== 'darwin'){
		app.quit();
	}
});

//Pour les macs uniquement, si le programme est réactivé, on recréer une fenêtre de login.
app.on('activate', () => {
	if (logWindow === null){
		createWindow();
	}
});

//Fonction qui créer la fenêtre principale.
function createMainWindow() {
	//Initialisation de la fenêtre principal avec les paramètres nécèssaires.
	mainWindow = new BrowserWindow({
		x: 400,
		y: 200,
		width: 1200, 
		height: 800,
		icon: 'mis.png',
		title:'Utilitaire API',
		fullscreen: true,
		resizable: true,
		maximizable: true
	});

	//On charge le fichier html définissant l'apparence de la page depuis les assets.
	mainWindow.loadURL('file:'+__dirname+'/assets/html/utilitaire.html');

	mainWindow.on('closed', () => {
		mainWindow = null
	});

	//Fonction qui charge les éléments de la page depuis l'api distante.
	function loadPage(event){
		//On fabrique la requête avec l'adresse indiquée.
		https.get("https://"+config.get('host')+"/api/util/config", function(resp) {
			let data = '';
			resp.on('data', function(chunk) {
				data += chunk;
			});
			//Lorsque toutes les données sont reçues.
			resp.on('end', function(){
				//On les traites comme des données au format json.
				for(var i = 0; i<JSON.parse(data).length; i++){
					//On créer chaque ligne du tableau en renseignant chaque champs ainsi que les boutons.
					//Si la ligne que l'ont va afficher correspond a la configuration actuelle, on l'affiche d'une manière différente.
					if(JSON.parse(data)[i].used == true){
						event.sender.send("loaded-return", "<tr class='table-active' id='id"+ JSON.parse(data)[i].id +"'><td scope=\"row\">"+JSON.parse(data)[i].id+"</td><td scope=\"row\">"+JSON.parse(data)[i].hash.substring(0,10)+"..</td><td scope=\"row\">"+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(11, 19)+' '+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(2, 10)+"</td><td scope=\"row\"> <input type=\"image\" id=\"See:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-eye-open.png\" /> <input type=\"image\" id=\""+"Save:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-disk-saved.png\" /> <input type=\"image\" id=\""+"Delete:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-remove.png\" /> </td></tr>");
					}else{						
						event.sender.send("loaded-return", "<tr id='id"+ JSON.parse(data)[i].id +"'><td scope=\"row\">"+JSON.parse(data)[i].id+"</td><td scope=\"row\">"+JSON.parse(data)[i].hash.substring(0,10)+"..</td><td scope=\"row\">"+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(11, 19)+' '+new Date(JSON.parse(data)[i].timestamp).toISOString().substring(2, 10)+"</td><td scope=\"row\"> <input type=\"image\" id=\"See:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-eye-open.png\" /> <input type=\"image\" id=\""+"Save:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-disk-saved.png\" /> <input type=\"image\" id=\""+"Delete:"+JSON.parse(data)[i].id+"\" class=\"btn btn-default\" src=\"../img/glyphicons-remove.png\" /> </td></tr>");
					}
				}
				//On créer la fonction qui enverra un message vers le processus maître si un bouton est activé.
				mainWindow.webContents.executeJavaScript("var a = document.querySelectorAll('[id^=\"id\"]');for(i = 0; i < a.length; i++){a[i].addEventListener('click', function(event) {ipcRenderer.send('event', event.target.id);})}");
			});
		}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	}

	//Lorsque la page a finie de chargée.
	ipcMain.on('loaded', function(event, arg) {
		loadPage(event);
	});

	//Lorsque que l'event 'event' ce produit(il s'agit d'un appuis sur un des boutons de fonctions.)
	ipcMain.on('event', function(event, arg) {
		//On récupère les détails de l'événement.
		//Action étant le bouton appuyer
		let action = arg.split(':')[0];
		//Num le numéro du bouton
		let num = arg.split(':')[1];

		if(action == "See") {
			//L'utilisateur a demandé a voir une configuration particulière.
			console.time("dbneed");
			console.log(Date.now());
			//On exécute la requête avec les paramètres nécessaires.
			//Host est l'adresse de l'api et num, l'id de la configuration a chargé.
			https.get("https://"+config.get('host')+"/api/util/config/"+num, function(resp) {
				let data = '';
				resp.on('data', function(chunk) {
					console.log('+');
					data += chunk;
				});
				//Lorsque l'ont a une réponse, on renvois un event vers le processus de rendu avec les données pour êtres affichées.
				resp.on('end', function(){
					console.timeEnd("dbneed");
					event.sender.send('event-return', data, "See");
				});
			}).on("error", (err) => {
				console.log("Error: " + err.message);
			});
		}else if(action == "Save") {
			//L'utilisateur a demandé a activée une autre configuration parmi celles qui sont proposées.
			console.time("dbSave");
			console.log(Date.now());
			//On exécute la requête avec l'id de la configuration a activée.
			https.get("https://"+config.get('host')+"/api/util/config/"+num+"/use/", function(resp) {
				let data= '';
				resp.on('data', function(chunk) {
					data += chunk;
				}),
				resp.on('end', function() {
					console.timeEnd("dbSave");
					//On renvois un message vers la page pour signifié que la configuration a bien était activée.
					event.sender.send('event-return', data, "Save")
				});
			}).on("error", (err) => {
				console.log("Error: " + err.message);
			});
		}else if(action == "Delete") {
			//L'utilisateur a demandé a supprimé une configuration de la base de donnée.
			console.time("dbDelete");
			console.log(Date.now());
			var choice = electron.dialog.showMessageBox(mainWindow, {
				//On demande confirmation a l'utilisateur pour supprimé cette configuration.
				type: 'question',
				buttons: ['Oui', 'Non'],
				title: 'Confirm',
				message: 'Voulez vous vraiment supprimé cette configuration ?'
			});
			console.log(choice);
			if(choice == 0){
				//On exécute la requête avec l'id de la configuration a supprimée.
				https.get("https://"+config.get('host')+"/api/util/config/"+num+"/delete/", function(resp) {
					let data = '';
					resp.on('data', function(chunk) {
						data += chunk;
					}),
					resp.on('end', function() {
						console.timeEnd("dbDelete");
						//On renvois un message vers la page.
						event.sender.send('event-return', data, "Delete");
						//On supprime cette configuration de la liste a l'écran.
						mainWindow.webContents.executeJavaScript("document.getElementById(\"id"+num+"\").remove()");
					});
				}).on("error", (err) => {
					console.log("Error: " + err.message);
				});
			}
		}
	});

	//Fonction pour transformées les données brutes contenu dans la base en caractères a affichés.
	function ab2str(buf) {
		return String.fromCharCode.apply(null, new Uint16Array(buf));
	}
	
	//Pour affichés les capteurs actuellement dans la configuration.
	ipcMain.on('SeeCapteurs', function(event, arg) {
		//On exécute la requête pour recevoir la configuration actuelle.
		https.get("https://"+config.get('host')+"/api/util/config/current", function(resp) {
			let data = '';
			resp.on('data', function(chunk) {
				data += chunk;
			});
			resp.on('end', function() {
				//Lorsque toutes les données sont reçues, on récupère le buffer de données (raw_data)
				var raw_data = String(JSON.parse(data.substring(1, data.length-1)).raw_data.data).split(',');
				//On transforme les données brutes en json.
				var capteurs = JSON.parse(ab2str(raw_data)).capteurs;
				for(var i = 0; i<JSON.parse(ab2str(raw_data)).capteurs.length; i++){
					if(capteurs[i].id != undefined){	
						//On affiche tout les capteurs contenus dans ce json dans le tableau des capteurs.
						event.sender.send("SeeCapteurs-return", "<tr><td scope='row'>"+capteurs[i].id+"</td><td scope='row'>"+capteurs[i].alias+"</td><td scope='row'>"+capteurs[i].description+"</td><td scope='row'>"+capteurs[i].unit+"</td><td scope='row'>"+capteurs[i].etc+"</td></tr>");
					}
				}
			});
		}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	});

	ipcMain.on('validCapteur', function(event, arg) {
		//Lorsqu'un nouveau capteur doit être validé, on envois le contenu de chaque champs dans l'api qui va ajouté le capteur
		//dans la configuration et la rechargée.
		var options = {
			hostname: config.get('host'),
			path: 443,
			path: '/api/util/config/new?raw_data='+arg,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': 0
			}
		};
		var req = https.request(options, (res) => {
			
			res.on('data', (d) => {
				console.log(d);
			});
			res.on('error', (e) => {
				console.log("https error: "+e);
			});
		})
		req.end();
	})
}