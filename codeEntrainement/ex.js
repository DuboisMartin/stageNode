var express = require('express');
var app = express();


app.get('/',function(req, res){
    console.log("Main needed");
    res.sendFile(__dirname+'/static/index.html')
});

app.get('/favicon.png', function(req, res){
    console.log("fav needed");
    res.sendFile(__dirname+'/static/favicon.png')
});

app.get('/style.css', function(req, res){
    console.log("css needed");
    res.sendFile(__dirname+'/static/style.css');
});

app.get('/script.js', function(req, res){
    console.log("js needed");
    res.sendFile(__dirname+'/static/script.js');
})

app.listen(80, function(){
    console.log("Express serveur run on port 80")
});