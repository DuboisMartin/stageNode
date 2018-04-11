var express = require('express'); 
var db = require("./databaseManager");

var hostname = 'localhost'; 
var port = 80; 

var dbManager = new db();
var moment_timezone = require('moment-timezone');
var moment = require('moment');

var app = express(); 

var reqNumber = 0;
var intervalID = setInterval(function(){console.log("Nombre de requêtes reçu : " + reqNumber);}, 60000);

var myRouter = express.Router(); 

//region Description de la route statique
myRouter.route('/').get(function(req, res){ res.sendFile(__dirname+'/static/index.html');});
myRouter.route('/favicon.png').get(function(req, res){ res.sendFile(__dirname+'/static/favicon.png');});
myRouter.route('/style.css').get(function(req, res){ res.sendFile(__dirname+'/static/style.css');});
myRouter.route('/script.js').get(function(req, res){ res.sendFile(__dirname+'/static/script.js');});
myRouter.route('/c.html').get(function(req, res){ res.sendFile(__dirname+'/static/contenuHome.html')});
myRouter.route('/temp.html').get(function(req, res){ res.sendFile(__dirname+'/static/contenuTemp.html')});
myRouter.route('/temp.js').get(function(req, res) { res.sendFile(__dirname+'/static/temp.js')});
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
    if(typeof parseInt(req.params.idD) != "number" || typeof parseInt(req.params.idF) != "number"){
        res.json({data: "Error"});
    }else{
        dbManager.recupSome(c, parseInt(req.params.idD), parseInt(req.params.idF));
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
    if(typeof parseInt(req.params.number) != "number"){
        res.json({data: "Error"});
    }else{
        dbManager.recupLast(c, parseInt(req.params.number))
    }
});

myRouter.route('/api/temp/from/:number-:e')
.get(function(req, res){
    var c = function(data){
        res.json(data);
    };
    reqNumber++;
    if( typeof parseInt(req.params.number) != "number" || !(req.params.e in {hour: '', day: '', month: ''}) ){
        res.json({data: "error"});
    }else{
        //On doit faire une requête entre maintenant (var now)
        res.json({data : "SELECT * FROM t1 WHERE date BETWEEN '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").subtract(parseInt(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"';"});
    }

});


app.use(myRouter);  

app.listen(port, hostname, function(){
	console.log("Mon serveur fonctionne sur http://"+ hostname +":"+port); 
});
 