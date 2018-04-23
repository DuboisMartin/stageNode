function isIn(tab, data){
    for(var i = 0; i< tab.length; i++){
        if(tab[i].toString() == data.toString()){
            return true;
        }
    }
    return false;
}

function checkConfig(config_path, mysql_con){
    this.config_path = config_path;
    this.mysql_con = mysql_con;
    var that = this;

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
        fs.open(that.config_path, 'r', function (status, fd) {
            if (status) {
                console.log(status.message);
                return ;
            }
            //On recupere la taille du fichier et on creer un buffer de la même taille
            var fileSize = getFilesizeInBytes(that.config_path);
            var buffer = new Buffer(fileSize);
    
            //On lit le fichier
            fs.read(fd, buffer, 0, fileSize, 0, function (err, num) {
                //On calcul son hash
                hash.update(buffer);
                let file_hash = hash.digest('hex');
                
                //On recupére le dernier hash dans la base;
                var req= "SELECT hash FROM test ORDER BY id DESC LIMIT 1;"
                mysql_con.query(req, function(e, d){
                    if(d.length > 0){
                        if(e)throw e;
                        //On compare les hash
                        if(d[0].hash == file_hash){
                            //Pas de save
                            console.log("not saving");
                            console.log(d[0].hash);
                        }else{
                            console.log("saving");
                            saveConfig(that.config_path, that.mysql_con);
                        }
                    }else{
                        console.log("saving");
                        saveConfig(that.config_path, that.mysql_con);
                    }
                })
        
            });
        });
}

function saveConfig(config_path, mysql_con){
    this.config_path = config_path;
    this.mysql_con = mysql_con;
    var that = this;

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
            //Si le hash est différent on sauvegarde la nouvelle config
            var query = "INSERT INTO test SET ?",
                values = {
                    id: 0,
                    raw_data: buffer,
                    hash: file_hash
                };
            mysql_con.query(query, values, function (er, da) {
                if(er)throw er;
            });
        })

    });


}

function newCapteur(config_path, id_capteur, mysql_con){
    let fs = require('fs');
    fs.readFile(config_path, function(err, data){
        if(err)throw err;
        jsonConfig = JSON.parse(data);
        if(!isIn(jsonConfig.capteurs, id_capteur)){
            jsonConfig.capteurs[jsonConfig.capteurs.length] = id_capteur;
            fs.writeFile(config_path, JSON.stringify(jsonConfig, null, '\t'), 'utf-8');
            saveConfig('config.json', mysql_con);
        }
    });
}

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "test",
    password: ""
});

con.connect(function(err) {
    if(err) throw err;
    
    con.query("USE test", function(err, result) {
        if(err) throw err;
    });
});

newCapteur('config.json', '001', con);
