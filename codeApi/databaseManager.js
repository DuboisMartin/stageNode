var mysql = require('mysql');

class databaseManager{
    constructor(){
        this.con = mysql.createConnection({host: "localhost", user: "test", password: ""})
        this.con.connect(function(err){
            if(err){
                throw err;
            }
        });
        this.con.query("USE test;", function(err, res){if(err)throw err;});
    }

    save(data, callback){
        var req = "INSERT INTO t1 VALUES(0, \'"+data+"\', CURRENT_TIMESTAMP);";
        this.con.query(req, function(err, result){
            if(err){
                return err;
            }else{
                callback(result);
            }
        });
    }

    recupSome(callback, idD, idF){
        var req = "SELECT id, texte FROM t1 WHERE id BETWEEN '"+idD+"' and '"+idF+"';";
        this.con.query(req, function(err, result){
            if(err){
                return err;
            }else{ 
                callback(result);
            }
        });
    }

    recup(callback, id){
        var req = "SELECT id, texte FROM t1 WHERE id = "+id;
        this.con.query(req, function(err, result){
            if(err) throw err;
            else callback(result[0].texte, id);
        });
    }

    recupLast(callback ,number = 1){
        var req = "SELECT id, texte FROM t1 ORDER BY id DESC LIMIT "+number+";";
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