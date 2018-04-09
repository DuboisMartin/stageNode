var express = require('express'); 
var db = require("./databaseManager");

var hostname = 'localhost'; 
var port = 3000; 

var dbManager = new db();

var app = express(); 

var myRouter = express.Router(); 

myRouter.route('/')
//region Description de cette route
.all(function(req, res){
    res.json({message: "Bienvenue sur l'API de notre station météo.", method: req.method});
});
//endregion

myRouter.route('/temp')
//region Description de cette route
.get(function(req,res){ 
    var c = function(data){
	    res.json({message : data});
    };
    let data = dbManager.recupLast(c);
})

.post(function(req,res){
    var c = function(data){
        res.json({message: data});
    };
    let data = dbManager.save(req.query.temp, c);
})

.put(function(req,res){ 
    res.json({message : "Modifié temp.", methode : req.method});
})

.delete(function(req,res){ 
res.json({message : "Supprimé temp.", methode : req.method});  
}); 
//endregion

myRouter.route('/temp/:id')
//region Description de cette route
.get(function(req, res){
    res.json({message: "Temp demandée : "+ req.params.id});
})
.put(function(req, res){
    res.json({message: "Temp a modifié : " + req.params.id});
})
.delete(function(req, res){
    res.json({message: "Temp a supprimé : " + req.params.id});
});
//endregion



app.use(myRouter);  

app.listen(port, hostname, function(){
	console.log("Mon serveur fonctionne sur http://"+ hostname +":"+port); 
});
 