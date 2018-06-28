var cert = false;
if(process.argv.length > 2){
    console.log("Arg detected, real cert will be used");
    cert = true;
}

var express = require('express'); 
var db = require("./databaseManager");
const fs = require('fs');
var stat = require('../codeEntrainement/stat.js');
stat.skewness = require('compute-skewness');

var config = require('config.json')('../config.json');

var hostname = 'localhost'; 
var port = 80; 

var dbManager = new db();
var moment_timezone = require('moment-timezone');
var moment = require('moment');
moment.locale('fr');
var app = express(); 

const pug = require('pug');
const compiledFunction = pug.compileFile('static/template.pug');
app.set('view engine', 'pug');

var reqNumber = 0;
var intervalID = setInterval(function(){console.log("Nombre de requêtes reçu : " + reqNumber);}, Number(config.server.req_timer));

var myRouter = express.Router();



//Fonction 

function makelist(){
    var list = new Array();
    for(var i = 0; i< config.capteurs.length; i++){
        if(config.capteurs[i].id != undefined){
            list.push(config.capteurs[i].id+':'+config.capteurs[i].alias);
        }
    }
    return list;
}

function isAuth(ip){
    for (var valeur of listIpConnected.values()){
        if(valeur = ip){
            return true;
        }
    }
    return false;
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
    res.render(__dirname+'/static/template', {tab: dbManager.availableCapteurs, tabAlias: dbManager.availableCapteursAlias});
});

myRouter.route('/api').get(function(req, res){ console.log(req.ip); reqNumber ++; res.json({data : "Hello world!"}); });

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
    console.log("Adresse ip : "+req.ip);
    console.log("::ffff:"+config.serveur.IpCapteur);
    if(req.ip != "::ffff:"+config.server.IpCapteur){
        res.json({data: '0', error: "Adresse ip non autorisée"})
    }else{
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
    }
})
//endregion

myRouter.route('/api/:capt/:idD-:idF')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString()))
    {
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
    if( isIn( dbManager.availableCapteurs, req.params.capt.toString() ) ){
        var c = function(data){
            var taba = new Array();
            data.forEach(function(element) {
                taba.push({0: element.data, 1: element.id})
            })
            res.json({data: taba});
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', week: '',  month: '', year: ''}) ){
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
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', week: '',  month: '', year: ''}) ){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE id_capteur = "+ req.params.capt +" AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
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
        if( isNaN(Number(req.params.number)) || typeof Number(req.params.number) != "number" || !(req.params.e in {sec: '', min: '', hour: '', day: '', week: '',  month: '', year: ''}) ){
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
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', week: '',  month: '', year: ''}) ){
            res.json({data: '0', error: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data FROM "+config.bdd.table_name+" WHERE id_capteur ="+ req.params.capt +" AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
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
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', week: '',  month: '', year: ''}) ){
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
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', week: '',  month: '', year: ''}) ){
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
        if( isNaN(Number(req.params.number)) || !(req.params.e in {sec: '', min: '', hour: '', day: '', week: '',  month: '', year: ''}) ){
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
    if(isAuth(req.ip)){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No data."});
            }else{
                res.json(data);
            }
        };
        reqNumber++;
        dbManager.justExec(c, "SELECT id, hash, timestamp, used FROM test;");
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }
});

myRouter.route('/api/util/config/current')
.get(function(req, res) {
    if(isAuth(req.ip)){
        var c = function(data) {
            if(data.length == 0){
                res.json({data: '0', error: "No data."});
            }else{
                res.json(data);
            }
        };
        reqNumber++;
        dbManager.justExec(c, "SELECT * FROM test WHERE used = true;");
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }
});

myRouter.route('/api/util/config/:id')
.get(function(req, res) {
    if(isAuth(req.ip)){
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
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }
});

myRouter.route('/api/util/config/:id/delete')
.get(function(req, res) {
    if(isAuth(req.ip)){
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
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }
})

myRouter.route('/api/util/config/:id/use')
.get(function(req, res) {
    if(isAuth(req.ip)){
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
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }
})

myRouter.route('/api/util/config/delete')
.post(function(req, res) {
    if(isAuth(req.ip)){
        reqNumber++;
        var old = require('../config.json')
        for(var i = 0; i < old.capteurs.length; i++){
            if(old.capteurs[i].id == req.query.raw_data){
                console.log("Deleted at i = "+i+": "+old.capteurs[i].id)
                old.capteurs.splice(i,1);
            }
        }

        fs.writeFile('../config.json', JSON.stringify(old, null, '\t'), 'utf-8', function callback(err){
            if (err) throw err;
            config = require('config.json')('../config.json');
            dbManager.updateConfig();
            dbManager.updateList(makelist());
            res.json({message: 'OK.'})
        });
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }

});

myRouter.route('/api/util/config/new')
.post(function(req, res) {
    if(isAuth(req.ip)){
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
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }

});
//

//PARTIE STAT

function done(data, moment1, moment2){
    var tab = new Array();
    for(var i = 0; i<data.length; i++){
        if(moment(data[i].timestamp)<moment2 && moment(data[i].timestamp)>moment1){
            tab.push(data[i].data);
        }
    }
    return tab;
}

function average(data){
    if(data.length == 0){
        console.log("data length 0");
        return 0;
    }else{
        var sum = 0;
        for(var i = 0; i < data.length; i++){
            sum += Number(data[i]);
        }
        return sum/data.length;
    }
}

function min(data){
    if(data.length == 0){
        console.log("data length 0");
        return 0;
    }else{
        var min = Number(data[0]);
        for(var i = 1; i < data.length; i++){
            if(Number(data[i]) < min) min = Number(data[i]);
        }
        return min;
    }
}

function max(data){
    if(data.length == 0){
        console.log("data length 0");
        return 0;
    }else{
        var max = Number(data[0]);
        for(var i = 1; i < data.length; i++){
            if(Number(data[i]) > max) max = Number(data[i]);
        }
        return max;
    }
}

function variance(data){
    if(data.length == 0){
        console.log("data length 0");
        return 0;
    }else{
        var tab = new Array();
        for(var i = 0; i < data.length; i++){
            tab.push(Number(data[i]));
        }
        var variance = stat.variance(tab);
        return variance;
    }
    
}

function ecart(data){
    if(data.length == 0){
        console.log("data length 0");
        return 0;
    }else{
        var tab = new Array();
        for(var i = 0; i < data.length; i++){
            tab.push(Number(data[i]));
        }
        var ecart = stat.standardDeviation(tab);
        return ecart;
    }
}

function skewness(data){
    if(data.length == 0){
        console.log("data length 0");
        return 0;
    }else{
        var tab = new Array();
        for(var i = 0; i< data.length; i++){
            tab.push(Number(data[i]));
        }
        var ecart = stat.skewness(tab);
        return ecart;
    }
}

function num(freq, duree){
    //How many 'freq' in 'duree' Ex: How many month in year
    if(duree == "year" && freq == "month"){
        return 12;
    }else if(duree == "year" && freq == "week"){
        return 52;
    }else if(duree == "year" && freq == "day"){
        return 365;
    }else if(duree == "month" && freq == "week"){
        return 4;
    }else if(duree == "month" && freq == "day"){
        return 30;
    }else if(duree == "week" && freq == "day"){
        return 7;
    }else if(duree == "day" && freq == "hour"){
        return 24;
    }else if(duree == "week" && freq == "hour"){
        return 168;
    }else if(duree == "month" && freq == "hour"){
        return 720;
    }else if(duree == "year" && freq == "hour"){
        return 8760; 
    }
}

myRouter.route('/api/:capt/average/:freq/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            var taba = new Array();
            var now = moment();
            for( var i = 0; i < Number( num( req.params.freq, req.params.e ) ); i++ ){
                let fuck1 = moment( now );
                let fuck2 = moment( now );

                if(req.params.freq == "month"){
                    var format = "MMM";
                }else if(req.params.freq == "day"){
                    var format = "d";
                }else if(req.params.freq == "week"){
                    var format = "d/MM";
                }else if(req.params.freq == "year"){
                    var format = "YYYY";
                }else if(req.params.freq == "hour"){
                    var format = "HH:mm";
                }

                taba.push( [average( done( data, fuck1.startOf( req.params.freq ), fuck2.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
                now = now.subtract( 1, req.params.freq );
            }
            res.json({data: taba});
            
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {hour: '', day: '', week: '', month: '', year: ''}) || !(req.params.freq in {hour: '', day: '', week: '', month: '', year: ''})){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data, timestamp FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

myRouter.route('/api/:capt/min/:freq/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            var taba = new Array();
            var now = moment();
            for( var i = 0; i < Number( num( req.params.freq, req.params.e ) ); i++ ){
                let fuck1 = moment( now );
                let fuck2 = moment( now );

                if(req.params.freq == "month"){
                    var format = "MMM";
                }else if(req.params.freq == "day"){
                    var format = "ddd";
                }else if(req.params.freq == "week"){
                    var format = "d/MM";
                }else if(req.params.freq == "year"){
                    var format = "YYYY";
                }else if(req.params.freq == "hour"){
                    var format = "HH:mm";
                }

                taba.push( [min( done( data, fuck1.startOf( req.params.freq ), fuck2.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
                now = now.subtract( 1, req.params.freq );
            }
            res.json({data: taba});
            
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {hour: '', day: '', week: '', month: '', year: ''}) || !(req.params.freq in {hour: '', day: '', week: '', month: '', year: ''})){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data, timestamp FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

myRouter.route('/api/:capt/max/:freq/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            var taba = new Array();
            var now = moment();
            for( var i = 0; i < Number( num( req.params.freq, req.params.e ) ); i++ ){
                let fuck1 = moment( now );
                let fuck2 = moment( now );

                if(req.params.freq == "month"){
                    var format = "MMM";
                }else if(req.params.freq == "day"){
                    var format = "ddd";
                }else if(req.params.freq == "week"){
                    var format = "d/MM";
                }else if(req.params.freq == "year"){
                    var format = "YYYY";
                }else if(req.params.freq == "hour"){
                    var format = "HH:mm";
                }

                taba.push( [max( done( data, fuck1.startOf( req.params.freq ), fuck2.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
                now = now.subtract( 1, req.params.freq );
            }
            res.json({data: taba});
            
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {hour: '', day: '', week: '', month: '', year: ''}) || !(req.params.freq in {hour: '', day: '', week: '', month: '', year: ''})){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data, timestamp FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

myRouter.route('/api/:capt/variance/:freq/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            var taba = new Array();
            var now = moment();
            for( var i = 0; i < Number( num( req.params.freq, req.params.e ) ); i++ ){
                let fuck1 = moment( now );
                let fuck2 = moment( now );

                if(req.params.freq == "month"){
                    var format = "MMM";
                }else if(req.params.freq == "day"){
                    var format = "ddd";
                }else if(req.params.freq == "week"){
                    var format = "d/MM";
                }else if(req.params.freq == "year"){
                    var format = "YYYY";
                }else if(req.params.freq == "hour"){
                    var format = "HH:mm";
                }

                taba.push( [variance( done( data, fuck1.startOf( req.params.freq ), fuck2.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
                now = now.subtract( 1, req.params.freq );
            }
            res.json({data: taba});
            
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {hour: '', day: '', week: '', month: '', year: ''}) || !(req.params.freq in {hour: '', day: '', week: '', month: '', year: ''})){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data, timestamp FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

myRouter.route('/api/:capt/ecart/:freq/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            var taba = new Array();
            var now = moment();
            for( var i = 0; i < Number( num( req.params.freq, req.params.e ) ); i++ ){
                let fuck1 = moment( now );
                let fuck2 = moment( now );

                if(req.params.freq == "month"){
                    var format = "MMM";
                }else if(req.params.freq == "day"){
                    var format = "ddd";
                }else if(req.params.freq == "week"){
                    var format = "d/MM";
                }else if(req.params.freq == "year"){
                    var format = "YYYY";
                }else if(req.params.freq == "hour"){
                    var format = "HH:mm";
                }

                taba.push( [ecart( done( data, fuck1.startOf( req.params.freq ), fuck2.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
                now = now.subtract( 1, req.params.freq );
            }
            res.json({data: taba});
            
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {hour: '', day: '', week: '', month: '', year: ''}) || !(req.params.freq in {hour: '', day: '', week: '', month: '', year: ''})){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data, timestamp FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

myRouter.route('/api/:capt/skewness/:freq/:number-:e')
.get(function(req, res){
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        var c = function(data){
            var taba = new Array();
            var now = moment();
            for( var i = 0; i < Number( num( req.params.freq, req.params.e ) ); i++ ){
                let fuck1 = moment( now );
                let fuck2 = moment( now );

                if(req.params.freq == "month"){
                    var format = "MMM";
                }else if(req.params.freq == "day"){
                    var format = "ddd";
                }else if(req.params.freq == "week"){
                    var format = "d/MM";
                }else if(req.params.freq == "year"){
                    var format = "YYYY";
                }else if(req.params.freq == "hour"){
                    var format = "HH:mm";
                }

                taba.push( [skewness( done( data, fuck1.startOf( req.params.freq ), fuck2.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
                now = now.subtract( 1, req.params.freq );
            }
            res.json({data: taba}); 
            
        };
        reqNumber++;
        if( isNaN(Number(req.params.number)) || !(req.params.e in {hour: '', day: '', week: '', month: '', year: ''}) || !(req.params.freq in {hour: '', day: '', week: '', month: '', year: ''})){
            res.json({data: "Error in params sended."});
        }else{
            dbManager.justExec(c, "SELECT id, data, timestamp FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

//FIN PARTIE STAT

function newCapteurs(capt) {
    console.log("Nouveaux capteurs : "+capt);
    if(socket_client != undefined){
        socket_client.emit('New-Capteurs', capt);
    }
};

app.use(myRouter);

var https = require('https');
if(cert){
    var serv = https.createServer({
        key : fs.readFileSync('realKey.pem'),
        cert: fs.readFileSync('realCert.pem'),
        ca: [
            fs.readFileSync('root.pem', 'utf8'),
            fs.readFileSync('chain.pem', 'utf8')
        ]
    }, app);
}else{
    var serv = https.createServer({
        key : fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    }, app);
}

const io = require('socket.io').listen(serv, {
    allowUpgrades: true,
    transports: ['websocket', 'flashsocket', 'polling'],
    'log level': 1,
    pingTimeout: '300000',
    pingInterval: '1000'
});

var listIpConnected = new Map()

io.sockets.on('connection', function (socket) {
    console.log("Un client est connecté !");
    socket.on('log', function(msg) {
        console.log("LOG NEEDED");
        if(msg == "Martin:Dubois"){
            socket.emit('log-rep', "OK");
            listIpConnected.set(socket.id, socket.handshake.address.split(':')[3]);
            console.log("ADDED : "+socket.handshake.address.split(':')[3]+" AT ID : "+socket.id);
        }else{ 
            socket.emit('log-rep', "NOP");
        }
    });
    socket.on('disconnect', function(){
        listIpConnected.delete(socket.id);
        console.log("REMOVE : "+socket.id)
    });
});

serv.listen(443)