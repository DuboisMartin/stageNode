var mysql = require('mysql');

require('dotenv').config({path: '../config.env'});

class databaseManager{
    constructor(){
        this.con = mysql.createConnection({ host: process.env.SQL_HOST, user: process.env.SQL_USER, password: process.env.SQL_PASSWORD })
        this.con.connect(function(err){
            if(err){
                throw err;
            }
        });
        this.con.query("USE "+process.env.BDD_NAME+";", function(err, res){if(err)throw err;});
    }

    save(data, callback){
        var req = "INSERT INTO "+process.env.TABLE_USE+" VALUES(0, \'"+data+"\', CURRENT_TIMESTAMP);";
        this.con.query(req, function(err, result){
            if(err){
                return err;
            }else{
                callback(result);
            }
        });
    }

    recupSome(callback, idD, idF){
        var req = "SELECT id, texte FROM "+process.env.TABLE_USE+" WHERE id BETWEEN '"+idD+"' and '"+idF+"';";
        this.con.query(req, function(err, result){
            if(err){
                return err;
            }else{ 
                callback(result);
            }
        });
    }

    recup(callback, id){
        var req = "SELECT id, texte FROM "+process.env.TABLE_USE+" WHERE id = "+id;
        this.con.query(req, function(err, result){
            if(err) throw err;
            else callback(result[0].texte, id);
        });
    }

    recupLast(callback ,number = 1){
        var req = "SELECT id, texte FROM "+process.env.TABLE_USE+" ORDER BY id DESC LIMIT "+number+";";
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