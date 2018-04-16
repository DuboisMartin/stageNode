var mysql = require('mysql');

var config = require('config.json')('../config.json');

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
        this.con = mysql.createConnection({ host: config.bdd.sql_host, user: config.bdd.sql_user, password: config.bdd.sql_password })
        this.con.connect(function(err){
            if(err){
                throw err;
            }
        });
        this.con.query("USE "+config.bdd.bdd_name+";", function(err, res){if(err)throw err;});
        this.availableCapteurs = [];
        this.makeList();
        var that = this;
        setInterval(function(){ that.makeList(); }, 60000);
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
        var req = "INSERT INTO "+config.bdd.table_name+" VALUES(0, '"+data+"','"+idCapteur+"', '', '', CURRENT_TIMESTAMP);";
        this.con.query(req, function(err, result){
            if(err){
                return err;
            }else{
                callback(result);
            }
        });
    }

    recupSome(callback, idD, idF, idCapteur){
        var req = "SELECT id, data FROM "+config.bdd.table_name+" WHERE id BETWEEN '"+idD+"' and '"+idF+"';";
        this.con.query(req, function(err, result){
            if(err){
                return err;
            }else{ 
                callback(result);
            }
        });
    }

    recup(callback, id, idCapteur){
        var req = "SELECT id, data FROM "+config.bdd.table_name+" WHERE id = "+id;
        this.con.query(req, function(err, result){
            if(err) throw err;
            else callback(result[0].texte, id);
        });
    }

    recupLast(callback , idCapteur, number = 1){
        var req = "SELECT id, data FROM "+config.bdd.table_name+" ORDER BY id DESC LIMIT "+number+";";
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