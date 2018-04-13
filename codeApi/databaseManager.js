//COMMENTAIRE
//Le code ne fonctionne pas sur le site mais fonctionne sur postman, il faut finir d'adapté le code pour la nouvelle base.

var mysql = require('mysql');

require('dotenv').config({path: '../config.env'});

function isIn(tab, data){
    for(var i = 0; i< tab.length; i++){
        if(tab[i].toString() == data.toString()){
            return true;
        }
    }
    return false;
}

class databaseManager{
    constructor(){
        this.con = mysql.createConnection({ host: process.env.SQL_HOST, user: process.env.SQL_USER, password: process.env.SQL_PASSWORD })
        this.con.connect(function(err){
            if(err){
                throw err;
            }
        });
        this.con.query("USE "+process.env.BDD_NAME+";", function(err, res){if(err)throw err;});
        this.availableCapteurs = [];
        this.makeList();
        var that = this;
        setInterval(function(){ that.makeList();}, 10000);
    }


    makeList(){
        var req = "SELECT id_capteur FROM capteurs;"
        var c = function(data){
            for(var i = 0; i < data.length; i++){
                if(!isIn(this.availableCapteurs, data[i].id_capteur)){
                    this.availableCapteurs.push(data[i].id_capteur);
                }
            }
        }.bind(this);
        this.con.query(req, function(err, result){
            if(err){
                return err;
            }else{
                c(result);
            }
        });
    }

    save(data, idCapteur, callback){
        var req = "INSERT INTO "+process.env.TABLE_USE+" VALUES(0, '"+data+"','"+idCapteur+"', '', '', CURRENT_TIMESTAMP);";
        this.con.query(req, function(err, result){
            if(err){
                return err;
            }else{
                callback(result);
            }
        });
    }

    recupSome(callback, idD, idF, idCapteur){
        var req = "SELECT id, data FROM "+process.env.TABLE_USE+" WHERE id BETWEEN '"+idD+"' and '"+idF+"';";
        this.con.query(req, function(err, result){
            if(err){
                return err;
            }else{ 
                callback(result);
            }
        });
    }

    recup(callback, id, idCapteur){
        var req = "SELECT id, data FROM "+process.env.TABLE_USE+" WHERE id = "+id;
        this.con.query(req, function(err, result){
            if(err) throw err;
            else callback(result[0].texte, id);
        });
    }

    recupLast(callback , idCapteur, number = 1){
        var req = "SELECT id, data FROM "+process.env.TABLE_USE+" ORDER BY id DESC LIMIT "+number+";";
        this.con.query(req, function(err, result){
            if(err){
                throw err;
            }else{
                callback(result);
            }
        });
    }

    justExec(callback, command){
        this.con.query(command, function(err, result){
            if(err){
                throw err;
            }else{
                callback(result);
            }
        });
    }


};
module.exports = databaseManager;