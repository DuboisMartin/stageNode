var mysql = require('mysql');

class databaseManager{
    constructor(){
        this.con = mysql.createConnection({host: "localhost", user: "test", password: ""})
        this.con.connect(function(err){
            if(err) throw err;
        });
        this.con.query("USE test;", function(err, res){if(err)throw err;});
    }

    save(data, callback){
        var req = "INSERT INTO t1 VALUES(0, \'"+data+"\');";
        this.con.query(req, function(err, result){
            if(err) return err;
            else callback(result);
        });
    }

    recup(id){
        var req = "SELECT * FROM t1 WHERE id = "+id;
        this.con.query(req, function(err, result){
            if(err) return err;
            else return result;
        });
    }

    recupLast(callback){
        var req = "SELECT * FROM t1 ORDER BY id DESC LIMIT 1;";
        var res;
        this.con.query(req, function(err, result){
            if(err){
                throw err;
            }
            else{
                callback(result[0].texte);
            }
        });
    }


};
module.exports = databaseManager;