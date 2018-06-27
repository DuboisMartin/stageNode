var mysql = require('mysql');

var config = require('config.json')('../config.json');
var that;
function isIn(tab, data){
    for(var i = 0; i< tab.length; i++){
        if(tab[i].toString() == data.toString()){
            return true;
        }
    }
    return false;
}

class databaseManager{
    updateConfig(){
        this.checkConfig('../config.json', that);
        config = require('config.json')('../config.json');
    }
    checkConfig(config_path, t){
        let that = t;
        //On importe les librairies nécéssaires
        let crypto = require('crypto');
        let fs = require('fs');
        let hash = crypto.createHash('sha512');
    
        //Une fonction qui permet de récupéré la taille d'un fichier
        function getFilesizeInBytes(filename) {
            const stats = fs.statSync(filename)
            const fileSizeInBytes = stats.size
            return fileSizeInBytes
        }
    
            //On lit le fichier
            fs.open(config_path, 'r', function (status, fd) {
                if (status) {
                    console.log(status.message);
                    return ;
                }
                //On recupere la taille du fichier et on creer un buffer de la même taille
                var fileSize = getFilesizeInBytes(config_path);
                var buffer = new Buffer(fileSize);
        
                //On lit le fichier
                fs.read(fd, buffer, 0, fileSize, 0, function (err, num) {
                    //On calcul son hash
                    hash.update(buffer);
                    let file_hash = hash.digest('hex');
                    
                    //On recupére le dernier hash dans la base;
                    var req= "SELECT hash FROM test ORDER BY id;"
                    t.con.query(req, function(e, d){
                        if(d.length > 0){
                            if(e)throw e;
                            //On compare les hash
                            var bool = false;
                            for(var i = 0; i < d.length; i++){
                                if(d[i].hash == file_hash){
                                    bool = true;
                                    t.con.query("UPDATE test SET used = FALSE WHERE 1;")
                                    t.con.query("UPDATE test SET used = TRUE WHERE hash = '"+file_hash+"';")
                                }
                            }
                            if(!bool){
                                t.saveConfig(config_path, t);
                            }
                        }else{
                            t.saveConfig(config_path, t);
                        }
                    })
            
                });
            });
    }
    
    saveConfig(config_path, t){
        let that = t;
    
        //On importe les librairies nécéssaires
        var crypto = require('crypto');
        var fs = require('fs');
        var hash = crypto.createHash('sha512');
    
        //Une fonction qui permet de récupéré la taille d'un fichier
        function getFilesizeInBytes(filename) {
            const stats = fs.statSync(filename)
            const fileSizeInBytes = stats.size
            return fileSizeInBytes
        }
    
        //On ouvre le fichier
        fs.open(config_path, 'r', function (status, fd) {
            if (status) {
                console.log(status.message);
                return ;
            }
            //On recupere la taille du fichier et on creer un buffer de la même taille
            var fileSize = getFilesizeInBytes(config_path);
            var buffer = new Buffer(fileSize);
    
            //On lit le fichier
            fs.read(fd, buffer, 0, fileSize, 0, function (err, num) {
                //On calcul son hash
                hash.update(buffer);
                let file_hash = hash.digest('hex');
                that.con.query("UPDATE test SET used = FALSE WHERE 1;");
                //Si le hash est différent on sauvegarde la nouvelle config
                var query = "INSERT INTO test SET ?",
                    values = {
                        id: 0,
                        raw_data: buffer,
                        hash: file_hash,
                        used: true
                    };
                that.con.query(query, values, function (er, da) {
                    if(er)throw er;
                });
            })
    
        });
    
    
    }

    updateList(list){
        var listeID = new Array();
        var listeAlias = new Array();
        list.forEach(element => {
           listeID.push(element.split(':')[0]); 
           listeAlias.push(element.split(':')[1]); 
        });
        this.availableCapteurs = listeID;
        this.availableCapteursAlias = listeAlias
        console.log(listeID); 
    }

    save(data, idCapteur, callback){
        console.log(data+" :: "+idCapteur);
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
        var req = "SELECT id, data FROM "+config.bdd.table_name+" WHERE id_capteur = "+idCapteur+" AND id BETWEEN '"+idD+"' and '"+idF+"' ;";
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
        var req = "SELECT id, data FROM "+config.bdd.table_name+" WHERE id_capteur = "+idCapteur+" ORDER BY id DESC LIMIT "+number+";";
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

    constructor(){
        this.con = mysql.createConnection({ host: config.bdd.sql_host, user: config.bdd.sql_user, password: config.bdd.sql_password })
        this.con.connect(function(err){
            if(err){
                throw err;
            }
        });
        this.con.query("USE "+config.bdd.bdd_name+";", function(err, res){if(err)throw err;});
        this.availableCapteurs = [];
        that = this;
        this.checkConfig('../config.json', that)
    }


};
module.exports = databaseManager;