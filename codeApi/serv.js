var express = require('express'); 
var db = require("./databaseManager");
const fs = require('fs');
var stat = require('../codeEntrainement/stat.js');
stat.skewness = require('compute-skewness');
const server = require('http').createServer();

var socket_client;
const io = require('socket.io').listen(server);

var config = require('config.json')('../config.json');

var hostname = 'localhost'; 
var port = 80; 

var dbManager = new db();
var moment_timezone = require('moment-timezone');
var moment = require('moment');

var app = express(); 

const pug = require('pug');
const compiledFunction = pug.compileFile('template.pug');
app.set('view engine', 'pug');

var reqNumber = 0;
var intervalID = setInterval(function(){console.log("Nombre de requêtes reçu : " + reqNumber);}, Number(config.server.req_timer));

var myRouter = express.Router();



//Fonction 

function makelist(){
    var list = new Array();
    for(var i = 0; i< config.capteurs.length; i++){
        if(config.capteurs[i].id != undefined){
            list.push(config.capteurs[i].id);
        }
    }
    return list;
}

function isIn(tab, data){
    for(var i = 0; i< tab.length; i++){
        if(tab[i].toString() == data.toString()){
            return true;
        }
    }
    return false;
}

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

dbManager.updateList(makelist());

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

app.get('/contenuStat.html', function(req, res) {
    res.render('../template', {tab: dbManager.availableCapteurs});
});

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
        let data = dbManager.save(req.query.raw_data, req.params.capt.toString(), c);
    }else{
        newCapteurs(req.params.capt.toString());
        res.json({data: '0', error: "Ce capteur n'existe pas."});
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

myRouter.route('/api/:capt/average/:freq/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No records"});
            }else{
                console.log(data);
                var moyenne = 0;
                for(var i = 0; i < data.length; i++){
                    moyenne += Number(data[i].data);
                }
                moyenne = moyenne/data.length;
                res.json({data: moyenne});
                
            }
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', month: '', year: ''}) || !(req.params.freq in {day:'', month:'', year:''})){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data, timestamp FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
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

myRouter.route('/api/:capt/variance/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No data."});
            }else{
                var tab = new Array();
                for(var i = 0; i < data.length; i++){
                    tab.push(Number(data[i].data));
                }
                var variance = stat.variance(tab);
                console.log(tab);
                res.json({data: variance});
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

myRouter.route('/api/:capt/ecart/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No data."});
            }else{
                var tab = new Array();
                for(var i = 0; i < data.length; i++){
                    tab.push(Number(data[i].data));
                }
                var ecart = stat.standardDeviation(tab);
                console.log(tab);
                res.json({data: ecart});
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

myRouter.route('/api/:capt/skewness/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No data."});
            }else{
                var tab = new Array();
                for(var i = 0; i < data.length; i++){
                    tab.push(Number(data[i].data));
                }
                var ecart = stat.skewness(tab);
                console.log(tab);
                res.json({data: ecart});
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
    dbManager.justExec(c, "SELECT id, hash, timestamp, used FROM test;");
});

myRouter.route('/api/util/config/current')
.get(function(req, res) {
    var c = function(data) {
        if(data.length == 0){
            res.json({data: '0', error: "No data."});
        }else{
            res.json(data);
        }
    };
    reqNumber++;
    dbManager.justExec(c, "SELECT * FROM test WHERE used = true;");
});

myRouter.route('/api/util/config/:id')
.get(function(req, res) {
    var c = function(data){
        console.timeEnd('dbneed');
        if(data.length == 0){
            res.json({data: '0', error: "No data."});
        }else{
            res.json(data);
        }
    }
    console.log(Date.now());
    reqNumber++;
    console.time('dbneed');
    dbManager.justExec(c, "SELECT id, raw_data, used FROM test where id = '"+req.params.id+"' ;");

});

myRouter.route('/api/util/config/:id/delete')
.get(function(req, res) {
    var c = function(data){
        console.timeEnd('dbdelete');
        if(data.length == 0){
            res.json({data: '0', error: "No data."});
        }else{
            console.log(data);
            res.json(data);
        }
    }
    console.log(Date.now());
    reqNumber++;
    console.time('dbdelete');
    dbManager.justExec(c, "DELETE FROM test WHERE id ='"+req.params.id+"' ;");
})

myRouter.route('/api/util/config/:id/use')
.get(function(req, res) {
    var save = function(data){
        if(data.length == 0){
            res.json({data: '0', error: "Not in database."});
        }else{
            var raw_data = String(data[0].raw_data).split(',');
            fs.writeFile('../config.json', raw_data, (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
                config = require('config.json')('../config.json');
                dbManager.updateConfig();
                dbManager.updateList(makelist());
                res.json({data: '0', good: "Done"});
            });
        }
    }
    reqNumber++;
    dbManager.justExec(save, "SELECT raw_data FROM test WHERE id='"+req.params.id+"' ;");
})

myRouter.route('/api/util/config/new')
.post(function(req, res) {
    reqNumber++;
    var old = require('../config.json')
    old.capteurs[old.capteurs.length] = {
        "id": req.query.raw_data.split(':')[0],
        "alias": req.query.raw_data.split(':')[1],
        "description": req.query.raw_data.split(':')[2],
        "unit": req.query.raw_data.split(':')[3],
        "etc": req.query.raw_data.split(':')[4]
    }
    fs.writeFile('../config.json', JSON.stringify(old, null, '\t'), 'utf-8', function callback(err){
        if (err) throw err;
        config = require('config.json')('../config.json');
        dbManager.updateConfig();
        dbManager.updateList(makelist());
        res.json({message: 'OK.'})
    });

});
//

function newCapteurs(capt) {
    console.log("Nouveaux capteurs : "+capt);
    if(socket_client != undefined){
        socket_client.emit('New-Capteurs', capt);
    }
};

app.use(myRouter);

var https = require('https');
https.createServer({
    key : fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app).listen(443);

io.sockets.on('connection', function (socket) {
    socket_client = socket;
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