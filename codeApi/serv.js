var express = require('express'); 
var db = require("./databaseManager");

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

//Fonction qui va êtres utile apres 
function isIn(tab, data){
    for(var i = 0; i< tab.length; i++){
        if(tab[i].toString() == data.toString()){
            return true;
        }
    }
    return false;
}

//region Description de la route statique
myRouter.route('/').get(function(req, res){ res.sendFile(__dirname+'/static/index.html');});
myRouter.route('/favicon.png').get(function(req, res){ res.sendFile(__dirname+'/static/favicon.png');});
myRouter.route('/style.css').get(function(req, res){ res.sendFile(__dirname+'/static/style.css');});
myRouter.route('/script.js').get(function(req, res){ res.sendFile(__dirname+'/static/script.js');});
myRouter.route('/home.html').get(function(req, res){ res.sendFile(__dirname+'/static/contenuHome.html')});
myRouter.route('/temp.html').get(function(req, res){ res.sendFile(__dirname+'/static/contenuTemp.html')});
myRouter.route('/temp.js').get(function(req, res) { res.sendFile(__dirname+'/static/temp.js')});
myRouter.route('/home.js').get(function(req, res){ res.sendFile(__dirname+'/static/home.js')});
//endregion

myRouter.route('/api').get(function(req, res){ reqNumber ++; res.json({data : "Hello world!"}); });

myRouter.route('/api/:type/last')
//region Description de cette route
.get(function(req,res){ 
    if(req.params.type == 'temp'){
        reqNumber++;
        var c = function(data){
            res.json({data : data});
        };
        let data = dbManager.recupLast( c, config.capteurs.id_capteur_temp);
    }else if(req.params.type == 'humi'){
        res.json({data: '0', error: "Not implemented yet."});
    }else if(isIn(dbManager.availableCapteurs, req.params.type.toString())){
        res.json({data:"Ce capteur existe."});
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."})
    }
})

.post(function(req,res){
    if(req.params.type == 'temp'){
        reqNumber++;
        var c = function(data){
            res.json({message: data});
        };
        let data = dbManager.save(req.query.data, req.query.idCapteur, config.capteurs.id_capteur_temp, c);
    }else if(req.params.type == 'humi'){
        res.json({data: '0', error: "Not implemented yet."});
    }
})
//endregion

myRouter.route('/api/:type/:idD-:idF')
.get(function(req, res){
    if(req.params.type == 'temp')
    {
        let json = [{}]; 
        var c = function(data){
            res.json(data);
        };
        reqNumber++;
        if( isNaN(Number(req.params.idD)) || typeof Number(req.params.idF) != "number"){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.recupSome(c, req.params.idD, req.params.idF, config.capteurs.id_capteur_temp);
        }
    }else if(req.params.type == 'humi'){
        res.json({data: '0', error: "Not implemented yet."});
    }
});

myRouter.route('/api/:type/tail/:number')

.get(function(req, res){
    if(req.params.type == 'temp'){
        var c = function(data){
            res.json(data);
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) ){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.recupLast(c, req.params.number)
        }
    }else if(req.params.type == 'humi'){
        res.json({data: '0', error: "Not implemented yet."});
    }
});

myRouter.route('/api/:type/from/:number-:e')
.get(function(req, res){
    if(req.params.type == 'temp'){
        var c = function(data){
            res.json(data);
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) ){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else if(req.params.type == 'humi'){
        res.json({data: '0', error: "Not implemented yet."});
    }

});

myRouter.route('/api/:type/average/:number-:e')
.get(function(req, res){
    if(req.params.type == 'temp'){
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
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else if(req.params.type == 'humi'){
        res.json({data: '0', error: "Not implemented yet."});
    }
});

myRouter.route('/api/:type/min/:number-:e')
.get(function(req, res){
    if(req.params.type == 'temp'){
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
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else if(req.params.type == 'humi'){
        res.json({data: '0', error: "Not implemented yet."});
    }
});

myRouter.route('/api/:type/max/:number-:e')
.get(function(req, res){
    if(req.params.type == 'temp'){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No records"});
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
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else if(req.params.type == 'humi'){
        res.json({data: '0', error: "Not implemented yet."});
    }
});

app.use(myRouter);  

app.listen(Number(config.server.server_port), config.server.server_host, function(){
	console.log("Mon serveur fonctionne sur http://"+ config.server.server_host +":"+config.server.server_port); 
});
 