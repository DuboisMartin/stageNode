var express = require('express'); 
var db = require("./databaseManager");

require('dotenv').config({path: '../config.env'});

var hostname = 'localhost'; 
var port = 80; 

var dbManager = new db();
var moment_timezone = require('moment-timezone');
var moment = require('moment');

var app = express(); 

var reqNumber = 0;
var intervalID = setInterval(function(){console.log("Nombre de requêtes reçu : " + reqNumber);}, Number(process.env.REQ_TIMER));

var myRouter = express.Router(); 

//region Description de la route statique
myRouter.route('/').get(function(req, res){ res.sendFile(__dirname+'/static/index.html');});
myRouter.route('/favicon.png').get(function(req, res){ res.sendFile(__dirname+'/static/favicon.png');});
myRouter.route('/style.css').get(function(req, res){ res.sendFile(__dirname+'/static/style.css');});
myRouter.route('/script.js').get(function(req, res){ res.sendFile(__dirname+'/static/script.js');});
myRouter.route('/c.html').get(function(req, res){ res.sendFile(__dirname+'/static/contenuHome.html')});
myRouter.route('/temp.html').get(function(req, res){ res.sendFile(__dirname+'/static/contenuTemp.html')});
myRouter.route('/temp.js').get(function(req, res) { res.sendFile(__dirname+'/static/temp.js')});
myRouter.route('/home.js').get(function(req, res){ res.sendFile(__dirname+'/static/home.js')});
//endregion

myRouter.route('/api').get(function(req, res){ reqNumber ++; res.json({data : "Hello world!"}); });

myRouter.route('/api/temp/last')
//region Description de cette route
.get(function(req,res){ 
    reqNumber++;
    var c = function(data){
	    res.json({data : data});
    };
    let data = dbManager.recupLast(c);
})

.post(function(req,res){
    reqNumber++;
    var c = function(data){
        res.json({message: data});
    };
    let data = dbManager.save(req.query.temp, c);
})

.put(function(req,res){ 
    reqNumber++;
    res.json({data : "Modifié temp.", methode : req.method});
})

.delete(function(req,res){ 
    reqNumber++;
    res.json({data : "Supprimé temp.", methode : req.method});  
}); 
//endregion

myRouter.route('/api/temp/:idD-:idF')
//region Description de cette route
.get(function(req, res){
    let json = [{}]; 
    var c = function(data){
        res.json(data);
    };
    reqNumber++;
    if( isNaN(Number(req.params.idD)) || typeof Number(req.params.idF) != "number"){
        res.json({data: "Error"});
    }else{
        dbManager.recupSome(c, Number(req.params.idD), Number(req.params.idF));
    }
})

.delete(function(req, res){
    reqNumber++;
    res.json({message: "Temp a supprimé : " + req.params.id});
});
//endregion

myRouter.route('/api/temp/tail/:number')

.get(function(req, res){
    var c = function(data){
        res.json(data);
    };
    reqNumber++;
    if( isNaN(Number(req.params.number)) ){
        res.json({data: "Error in params sended."});
    }else{
        dbManager.recupLast(c, Number(req.params.number))
    }
});

myRouter.route('/api/temp/from/:number-:e')
.get(function(req, res){
    var c = function(data){
        res.json(data);
    };
    reqNumber++;
    if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) ){
        res.json({data: "error"});
    }else{
        dbManager.justExec(c, "SELECT id, texte FROM "+process.env.TABLE_USE+" WHERE date BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
    }

});

myRouter.route('/api/temp/average/:number-:e')
.get(function(req, res){
    var c = function(data){
        if(data.length == 0){
            res.json({data: '0', error: "No records"});
        }else{
            var moyenne = 0;
            for(var i = 0; i < data.length; i++){
                moyenne += Number(data[i].texte);
            }
            moyenne = moyenne/data.length;
            res.json({data: moyenne});
        }
    };
    reqNumber++;
    if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) ){
        res.json({data: "error"});
    }else{
        dbManager.justExec(c, "SELECT id, texte FROM "+process.env.TABLE_USE+" WHERE date BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
    }

});

myRouter.route('/api/temp/min/:number-:e')
.get(function(req, res){
    var c = function(data){
        if(data.length == 0){
            res.json({data: '0', error: "No records"});
        }else{
            var min = Number(data[0].texte);
            for(var i = 1; i < data.length; i++){
                if(Number(data[i].texte) < min) min = Number(data[i].texte);
            }
            res.json({data: min});
        }
    };
    reqNumber++;
    if( isNaN(Number(req.params.number)) || typeof Number(req.params.number) != "number" || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) ){
        res.json({data: '0', error: "Error in params sended."});
    }else{
        dbManager.justExec(c, "SELECT id, texte FROM "+process.env.TABLE_USE+" WHERE date BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
    }

});

myRouter.route('/api/temp/max/:number-:e')
.get(function(req, res){
    var c = function(data){
        if(data.length == 0){
            res.json({data: '0', error: "No records"});
        }else{
            var max = Number(data[0].texte);
            for(var i = 1; i < data.length; i++){
                if(Number(data[i].texte) > max) max = Number(data[i].texte);
            }
            res.json({data: max});
        }
    };
    reqNumber++;
    if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) ){
        res.json({data: '0', error: "Error in params sended."});
    }else{
        dbManager.justExec(c, "SELECT id, texte FROM "+process.env.TABLE_USE+" WHERE date BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
    }

});

app.use(myRouter);  

app.listen(Number(process.env.SERV_PORT), process.env.SERV_HOST, function(){
	console.log("Mon serveur fonctionne sur http://"+ process.env.SERV_HOST +":"+process.env.SERV_PORT); 
});
 