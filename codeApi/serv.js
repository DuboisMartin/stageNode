//Lecture argument, si on veut utilisé les vrais certificats on met un argument aléatoire sinon on utilise les certificats auto-signés.
var cert = false;
if(process.argv.length > 2){
    console.log("Arg detected, real cert will be used");
    cert = true;
}

//Importation de tout les modules.
var express = require('express'); 
var db = require("./databaseManager");
const fs = require('fs');
var stat = require('./stat.js');
stat.skewness = require('compute-skewness');

//Importation de la configuration, les premières parenthèses sont pour le modules et les seconds pour le fichier de config.
var config = require('config.json')('config.json');

var dbManager = new db();
var moment_timezone = require('moment-timezone');
var moment = require('moment');
moment.locale('fr');

//Création de l'application express.
var app = express(); 

const pug = require('pug');
//Préparation du template pug.
const compiledFunction = pug.compileFile('static/template.pug');
app.set('view engine', 'pug');

var reqNumber = 0;
//A intervalle régulier, on affiche le nombre total de requêtes traitées.
var intervalID = setInterval(function(){console.log("Nombre de requêtes reçu : " + reqNumber);}, Number(config.server.req_timer));

//Initialisation du gestionnaire de routes.
var myRouter = express.Router();

//Fonction 
//Cette fonction créer un tableau contenant l'id de tout les capteurs actuellement enregistrées, associés a l'alias de ce capteur.
function makelist(){
    var list = new Array();
    for(var i = 0; i< config.capteurs.length; i++){
        if(config.capteurs[i].id != undefined){
            list.push(config.capteurs[i].id+':'+config.capteurs[i].alias);
        }
    }
    return list;
}

//Fonction qui renvois un boolean indiquant si l'ip demandé est actuellement enregistrée dans la liste des ip autorisées.
function isAuth(ip){
    for (var valeur of listIpConnected.values()){
        if(valeur = ip){
            return true;
        }
    }
    return false;
}

//Prend en paramètre un tableau et un élément et renvois un boolean signifiant si cet élément est dans le tableau
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

//On initialise la liste de capteurs autorisées une première fois.
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

//On lit tout le dossier static et on créer automatiquement pour chaque élément qu'il contient, une route.
fs.readdir('static/', (err, files) => {
    files.forEach(file => {
        //Pour le fichier index.html on créer la route racine ('/')
        if(file == "index.html"){
            myRouter.route('/').get(function(req, res){ res.sendFile(__dirname+'/static/'+file);});
        }else{
            myRouter.route('/'+file).get(function(req, res){ res.sendFile(__dirname+'/static/'+file);});
        }
    });
})

//Création d'une route spécial qui ne renvois pas un des fichiers statique mais qui exécute un template avec tout les capteurs
//actuellement enregistrés.
app.get('/contenuStat.html', function(req, res) {
    res.render(__dirname+'/static/template', {tab: dbManager.availableCapteurs, tabAlias: dbManager.availableCapteursAlias});
});

//Route servant a vérifier le bon fonctionnement de l'api, qui affiche juste hello world.
myRouter.route('/api').get(function(req, res){ console.log(req.ip); reqNumber ++; res.json({data : "Hello world!"}); });


//Définition de la route principale, elle sert a obtenir la dernière valeur enregistrée d'un capteur
//Et surtout d'enregistrée une nouvelle valeur pour un capteur.
myRouter.route('/api/:capt/last')
//region
.get(function(req,res){ 
    //Si le type de la requête est get, on sait que l'utilisateur souhaite obtenir des données.
    //Req contient tout les détails de la requête
    //Res permet d'envoyer une réponse.
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        //Si le capteur demandé est dans la liste des capteurs enregistrées.
        reqNumber++;
        //On incrémente le compteur de requête.
        var c = function(data){
            //On définit une fonction de callback très simple qui renvois juste les données brutes.
            res.json({data : data});
        };
        //On appel la fonction spécialisée dans le manager de base de données avec en paramètres, la fonction de callback et l'identifiant du capteur.
        let data = dbManager.recupLast( c, req.params.capt);
    }else{
        //Si le capteur n'est pas référencé, on renvois une erreur.
        res.json({data: '0', error: "Ce capteur n'existe pas."})
    }
})

.post(function(req,res){
    //Si le type de la requête est post, on sait que l'utilisateur souhaite stockée des données.
    console.log("Adresse ip : "+req.ip);
    console.log("::ffff:"+config.server.IpCapteur);
    if(req.ip != "::ffff:"+config.server.IpCapteur){
        //La sécurité actuellement utilisé consiste a vérifié si l'ip de la requête est l'ip autorisée dans la configuration.
        //Si elle ne correspond pas, on renvois une erreur.
        res.json({data: '0', error: "Adresse ip non autorisée"})
    }else{
        if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
            //Si le capteurs est dans la liste des capteurs autorisés.
            reqNumber++;
            //On incrémente le compteur de requête.
            var c = function(data){
                //On définit une fonction de callback très simple qui renvois juste les données brutes.
                res.json({message: data});
            };
            //On appel la fonction spécialisée dans le manager de base de données avec
            //Les données a enregistrées, le capteur et la fonction de callback a rappelé ensuite.
            let data = dbManager.save(req.query.raw_data, req.params.capt.toString(), c);
        }else{
            //Si le capteurs n'est pas dans la liste des capteurs répertoriés, c'est qu'il y a un nouveau capteur.
            //Dans ce cas, on appel la fonction correspondante.
            newCapteurs(req.params.capt.toString());
            //Mais on signal quand même que ce capteur n'existe pas.
            res.json({data: '0', error: "Ce capteur n'existe pas."});
        }
    }
})
//endregion

//Cette route renvoie toutes les données d'un capteur où l'ID dans la base de données se situe entre idD et idF
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
    }else{
        res.json({data: '0', error: "Ce capteur n'existe pas."});
    }
});

//Cette route renvoie les ':number' dernières données contenu dans la base de donnée pour un capteur.
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

//Cette route renvoie toutes les données enregistrées pour un capteur depuis ':number'(nombre) d'intervalle de temps(':e')
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

//Cette routes renvois la moyenne des valeurs des données d'un capteur enregistrées pour un intervalles de temps.
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

//Cette route renvoie la valeur minimale de toutes les données d'un capteur enregistrées sur un intervalle de temps.
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

//Cette route renvoie la valeur maximale de toutes les données d'un capteur enregistrées sur un intervalle de temps.
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

//Cette route renvoie la variance de toutes les données d'un capteur enregistrées sur un intervalle de temps.
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

//Cette route renvoie l'écart type de toutes les données d'un capteur enregistrées sur un intervalle de temps.
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

//Cette route renvoie le coefficient d'asymétrie de toutes les données d'un capteur enregistrées sur un intervalle de temps.
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
//Cette route renvoie la liste des configuration contenu dans la base de données.
myRouter.route('/api/util/config')
.get(function(req, res) {
    //On vérifie si l'IP source de la requête est autorisée a ce connectée.
    if(isAuth(req.ip)){
        var c = function(data){
            if(data.length == 0){
                res.json({data: '0', error: "No data."});
            }else{
                res.json(data);
            }
        };
        reqNumber++;
        //NOTE: On ne renvois pas les données brutes(la configuration), seulement les informations.
        dbManager.justExec(c, "SELECT id, hash, timestamp, used FROM test;");
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }
});

//Cette route renvoie la configuration actuellement active.
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
        //NOTE: Ici on renvois tout, y compris les données brutes.
        dbManager.justExec(c, "SELECT * FROM test WHERE used = true;");
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }
});

//Cette route renvoie toutes les informations sur une configurations précises, la configurations demandée est précisée par la variable ':id'
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

//Cette route supprime la configuration demandée.(Irréversible)
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

//Cette route permet de réactivé une configuration de la base de donnée.
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

//Cette route permet de supprimé un capteur dans la configuration et de la rechargé.
myRouter.route('/api/util/config/delete')
.post(function(req, res) {
    if(isAuth(req.ip)){
        reqNumber++;
        var old = require('./config.json')
        for(var i = 0; i < old.capteurs.length; i++){
            if(old.capteurs[i].id == req.query.raw_data){
                console.log("Deleted at i = "+i+": "+old.capteurs[i].id)
                old.capteurs.splice(i,1);
            }
        }

        fs.writeFile('./config.json', JSON.stringify(old, null, '\t'), 'utf-8', function callback(err){
            if (err) throw err;
            config = require('config.json')('./config.json');
            dbManager.updateConfig();
            dbManager.updateList(makelist());
            res.json({message: 'OK.'})
        });
    }else{
        res.json({message: 'error',error: 'Adresse ip non autorisée'})
    }

});


//Cette route permet d'ajouté un nouveau capteur dans la configuration.
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
//Cette fonction renvoie un tableau contenant les données(parmis celle fournis dans 'data') qui ont étaient enregistrées entre moment1 et moment2
function done(data, moment1, moment2){
    var tab = new Array();
    for(var i = 0; i<data.length; i++){
        if(moment(data[i].timestamp)<moment2 && moment(data[i].timestamp)>moment1){
            tab.push(data[i].data);
        }
    }
    return tab;
}

//Cette fonction renvoie la moyenne de toutes les données passées en paramètre.
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

//Cette fonction renvoie le minimum de toutes les données passées en paramètre.
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

//Cette fonction renvoie le maximum de toutes les données passées en paramètre.
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

//Cette fonction renvoie la variance de toutes les données passées en paramètre.
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

//Cette fonction renvoie l'écart type de toutes les données passées en paramètre.
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

//Cette fonction renvoie le coefficient d'asymétrie de toutes les données passées en paramètre.
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
//Cette fonction renvois le nombre de 'freq' dans 'duree'
//Par exemple : combien de 'week' dans 'month'
function num(freq, duree){
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

//Cette route renvoie, pour un capteur, la moyenne des donnée par intervalles de temps, sur un autres intervalles de temps.
//Par exemple "/api/010/average/day/1-month" renverra la moyenne des données par jours sur 1 mois.
myRouter.route('/api/:capt/average/:freq/:number-:e')
.get(function(req, res){
    //On vérifie d'abord que le capteur ce situe dans la base de données.
    if(isIn(dbManager.availableCapteurs, req.params.capt.toString())){
        //Définition de la fonction de callback
        var c = function(data){
            //On créer le tableau qui contiendra toutes les valeurs a renvoyées.
            var taba = new Array();
            //On créer la variable qui définit le moment actuel(timestamp);
            var now = moment();
            for( var i = 0; i < Number( num( req.params.freq, req.params.e ) ); i++ ){
                //On créer deux nouvelles variables qui serviront a faire les recherches par intervalles de temps.
                let momentOne = moment( now );
                let momentTwo = moment( now );

                //On définit le format pour la donnée de temp qui sera dans le tableau et qui servira pour être affichée sous le graphique sur le site web.
                //Voir la documentation du module "moment-timezone" pour les autres formats.
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

                //Ici, plusieurs fonctions sont empilées, on envois dans la fonctions calculant la moyenne(average), les données(parmi toutes les données dans la variable data) qui ont étaient
                //enregistrées entre le debut de l'intervalle de temps(startOf(freq)) et la fin de l'intervalle de temps(endOf(freq)) et y ajoute le timestamp formatée.
                taba.push( [average( done( data, momentOne.startOf( req.params.freq ), momentTwo.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
                //On soustrait ensuite un intervalle de temp pour revenir dans le temps et continué la boucle.
                now = now.subtract( 1, req.params.freq );
            }
            //On envois le tableau obtenu en réponse.
            res.json({data: taba});
            
        };
        reqNumber++;
        //Ici, on vérifie que les valeurs des variables sont corrects.
        //Le nombre d'intervalles de temp doit être un nombre et l'intervalle de temp lui même doit être dans la liste.
        if( isNaN(Number(req.params.number)) || !(req.params.e in {hour: '', day: '', week: '', month: '', year: ''}) || !(req.params.freq in {hour: '', day: '', week: '', month: '', year: ''})){
            //On signal si il y a des erreurs dans les paramètres envoyés.
            res.json({data: "Error in params sended."});
        }else{
            //Ici on récupère toutes les données du capteurs, elles seront triées par la suite.
            dbManager.justExec(c, "SELECT id, data, timestamp FROM "+config.bdd.table_name+" WHERE id_capteur ='"+ req.params.capt +"' AND timestamp BETWEEN '"+moment_timezone().tz("Europe/Paris").subtract(Number(req.params.number), req.params.e).format("YYYY-MM-DD HH:mm:ss")+"' AND '"+moment_timezone().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss")+"';");
        }
    }else{
        //Si le capteur demandé n'existe pas, on le signale.
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
                let momentOne = moment( now );
                let momentTwo = moment( now );

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

                taba.push( [min( done( data, momentOne.startOf( req.params.freq ), momentTwo.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
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
                let momentOne = moment( now );
                let momentTwo = moment( now );

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

                taba.push( [max( done( data, momentOne.startOf( req.params.freq ), momentTwo.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
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
                let momentOne = moment( now );
                let momentTwo = moment( now );

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

                taba.push( [variance( done( data, momentOne.startOf( req.params.freq ), momentTwo.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
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
                let momentOne = moment( now );
                let momentTwo = moment( now );

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

                taba.push( [ecart( done( data, momentOne.startOf( req.params.freq ), momentTwo.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
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
                let momentOne = moment( now );
                let momentTwo = moment( now );

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

                taba.push( [skewness( done( data, momentOne.startOf( req.params.freq ), momentTwo.endOf( req.params.freq ) ) ), req.params.freq, now.format(format) ]);
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

//Cette fonction permet de signalé dans la console et au socket client qu'un nouveau capteur a était détecté.
function newCapteurs(capt) {
    console.log("Nouveaux capteurs : "+capt);
    if(socket_client != undefined){
        socket_client.emit('New-Capteurs', capt);
    }
};

app.use(myRouter);

//Ici on créer le serveur en lui même.
var https = require('https');
if(cert){
    //Si un argument a était entré au début du programme, on charge les certificats pour le domaine "upjv.edt.ovh"
    var serv = https.createServer({
        key : fs.readFileSync('realKey.pem'),
        cert: fs.readFileSync('realCert.pem'),
        ca: [
            fs.readFileSync('root.pem', 'utf8'),
            fs.readFileSync('chain.pem', 'utf8')
        ]
    }, app);
}else{
    //Sinon on charge les certificats auto-signé pour les tests.
    var serv = https.createServer({
        key : fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    }, app);
}

const io = require('socket.io').listen(serv, {
    //On créer le 'serveur' socket.io pour la connexion provenant de l'utilitaire.
    allowUpgrades: true,
    transports: ['websocket', 'flashsocket', 'polling'],
    'log level': 1,
    pingTimeout: '300000',
    pingInterval: '1000'
});

//On créer la liste qui contiendra la les ip autorisées a utilisée les fonctions de gestion de configuration de l'api.
var listIpConnected = new Map()

//On gére les connexion ici.
io.sockets.on('connection', function (socket) {
    console.log("Un client est connecté !");
    socket.on('log', function(msg) {
        //On reçois forcément une demande de connexion.
        console.log("LOG NEEDED");
        if(msg == "Martin:Dubois"){
            //Si les logins correspondent, on informe l'utiltiaire.
            socket.emit('log-rep', "OK");
            //Et on ajoute l'ip de provenance dans la liste des ip autorisées.
            listIpConnected.set(socket.id, socket.handshake.address.split(':')[3]);
            console.log("ADDED : "+socket.handshake.address.split(':')[3]+" AT ID : "+socket.id);
        }else{ 
            //Si les logins ne correspondent pas, on informe l'utilisateur.
            socket.emit('log-rep', "NOP");
        }
    });
    socket.on('disconnect', function(){
        //Lorsque l'utilisateur se déconnecte, on supprime son ip de la liste en utilisant l'id du socket comme référence.
        listIpConnected.delete(socket.id);
        console.log("REMOVE : "+socket.id)
    });
});

//Finalement on lance l'écoute sur le port 443.
serv.listen(443)
