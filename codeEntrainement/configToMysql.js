var path = "config.json";

var mysql = require('mysql');

var con = mysql.createConnection({ host: "127.0.0.1", user: "test", password: "" });
con.connect(function(err){
    if(err){
        throw err;
    }
});
con.query("USE test;", function(err, res){if(err)throw err;});

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
                return 0;
            });
        })

    });


}

saveConfig(path, con);