var express = require('express'); 
var db = require("./databaseManager");
const fs = require('fs');

var config = require('config.json')('../config.json');

var hostname = 'localhost'; 
var port = 80; 

var dbManager = new db();
var moment_timezone = require('moment-timezone');
var moment = require('moment');

var app = express(); 

var reqNumber = 0;
var intervalID = setInterval(function(){console.log("Nombre de requêtes reçu : " + reqNumber);}, Number(config.server.req_timer));

var myRouter = express.Router(); 

dbManager.updateList(config.capteurs);

//Fonction 
function isIn(tab, data){
    for(var i = 0; i< tab.length; i++){
        if(tab[i].toString() == data.toString()){
            return true;
        }
    }
    return false;
}

/*//region Description de la route statique
myRouter.route('/').get(function(req, res){ res.sendFile(__dirname+'/static/index.html');});
myRouter.route('/favicon.png').get(function(req, res){ res.sendFile(__dirname+'/static/favicon.png');});
myRouter.route('/style.css').get(function(req, res){ res.sendFile(__dirname+'/static/style.css');});
myRouter.route('/script.js').get(function(req, res){ res.sendFile(__dirname+'/static/script.js');});
myRouter.route('/contenuHome.html').get(function(req, res){ res.sendFile(__dirname+'/static/contenuHome.html')});
myRouter.route('/contenuTemp.html').get(function(req, res){ res.sendFile(__dirname+'/static/contenuTemp.html')});
myRouter.route('/temp.js').get(function(req, res) { res.sendFile(__dirname+'/static/temp.js')});
myRouter.route('/home.js').get(function(req, res){ res.sendFile(__dirname+'/static/home.js')});
//endregion*/
fs.readdir('static/', (err, files) => {
    files.forEach(file => {
        if(file == "index.html"){
            myRouter.route('/').get(function(req, res){ res.sendFile(__dirname+'/static/'+file);});
        }else{
            myRouter.route('/'+file).get(function(req, res){ res.sendFile(__dirname+'/static/'+file);});
        }
    });
})

myRouter.route('/api').get(function(req, res){ reqNumber ++; res.json({data : "Hello world!"}); });

myRouter.route('/api/:capt/last')
//region
.get(function(req,res){ 
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        reqNumber++;
        var c = function(data){
            res.json({data : data});
        };
        let data = dbManager.recupLast( c, req.params.capt);
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."})
    }
})

.post(function(req,res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        reqNumber++;
        var c = function(data){
            res.json({message: data});
        };
        let data = dbManager.save(req.query.raw_data, req.query.id_capteur, c);
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
        //Ici envoyé alerte.
    }
})
//endregion

myRouter.route('/api/:capt/:idD-:idF')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString()))
    {
        let json = [{}]; 
        var c = function(data){
            res.json(data);
        };
        reqNumber++;
        if( isNaN(Number(req.params.idD)) || typeof Number(req.params.idF) != "number"){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.recupSome(c, req.params.idD, req.params.idF, req.params.capt.toString());
        }
    }else if(req.params.capt == 'humi'){
        res.json({data: '0', error: "Not implemented yet."});
    }
});

myRouter.route('/api/:capt/tail/:number')

.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            res.json(data);
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) ){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.recupLast(c, req.params.capt, req.params.number)
        }
    }else{
        res.json({data: "0", error: "Ce capteur n'existe pas."});
    }
});

myRouter.route('/api/:capt/from/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            res.json(data);
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) ){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }

});

myRouter.route('/api/:capt/average/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No records"});
            }else{
                var moyenne = 0;
                for(var i = 0; i < data.length; i++){
                    moyenne += Number(data[i].data);
                }
                moyenne = moyenne/data.length;
                res.json({data: moyenne});
            }
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) ){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

myRouter.route('/api/:capt/min/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No records"});
            }else{
                var min = Number(data[0].data);
                for(var i = 1; i < data.length; i++){
                    if(Number(data[i].data) < min) min = Number(data[i].data);
                }
                res.json({data: min});
            }
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || typeof Number(req.params.number) != "number" || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) ){
            res.json({data: '0', error: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

myRouter.route('/api/:capt/max/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No data."});
            }else{
                var max = Number(data[0].data);
                for(var i = 1; i < data.length; i++){
                    if(Number(data[i].data) > max) max = Number(data[i].data);
                }
                res.json({data: max});
            }
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) ){
            res.json({data: '0', error: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

//Routes utilisées pour l'utilitaire
myRouter.route('/api/util/config')
.get(function(req, res) {
    var c = function(data){
        if(data.length == 0){
            res.json({data: '0', error: "No data."});
        }else{
            res.json(data);
        }
    };
    reqNumber++;
    dbManager.justExec(c, "SELECT id, hash, timestamp FROM test;");
});

myRouter.route('/api/util/config/:id')
.get(function(req, res) {
    var c = function(data){
        if(data.length == 0){
            res.json({data: '0', error: "No data."});
        }else{
            res.json(data);
        }
    }
    reqNumber++;
    dbManager.justExec(c, "SELECT raw_data FROM test where id = '"+req.params.id+"' ;");
});
//


app.use(myRouter);

var https = require('https');
https.createServer({
    key : fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app).listen(443);

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