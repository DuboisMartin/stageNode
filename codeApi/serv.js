var express = require('express'); 

var hostname = 'localhost'; 
var port = 3000; 


var app = express(); 

var myRouter = express.Router(); 

myRouter.route('/')
//region Description de cette route
.all(function(req, res){
    res.json({message: "Bienvenue sur notre API de station météo.", method: req.method});
});
//endregion

myRouter.route('/temp')
//region Description de cette route
.get(function(req,res){ 
	  res.json({message : "Vous avez demandé la temperature ?", method: req.method});
})

.post(function(req,res){
      res.json({message : "Vous voulez modifié la temperature ?", methode : req.method});
})

.put(function(req,res){ 
      res.json({message : "Vous voulez ENCORE modifié la temperature ?", methode : req.method});
})

.delete(function(req,res){ 
res.json({message : "Vous voulez supprimer la temprature ?", methode : req.method});  
}); 
//endregion

myRouter.route('/temp/:date')
//region Description de cette route
.get(function(req, res){
    res.json({message: "Date demander : "+ req.params.date});
})
.put(function(req, res){
    res.json({message: "Date que vous voulez modifié : " + req.params.date});
})
.delete(function(req, res){
    res.json({message: "Date a supprimer : " + req.params.date});
});
//endregion



app.use(myRouter);  

app.listen(port, hostname, function(){
	console.log("Mon serveur fonctionne sur http://"+ hostname +":"+port); 
});
 