//Inclusion de tout les modules nécessaires.

var mysql = require('mysql');

//Importation de la configuration.
var config = require('config.json')('config.json');
var that;



class databaseManager{

    //Fonction qui ce charge de rechargé la configuration.
    updateConfig(){
        this.checkConfig('./config.json', that);
        config = require('config.json')('config.json');
    }

    //Fonction qui se charge de vérifié la configuration.
    checkConfig(config_path, t){
        let that = t;
        //On importe les librairies nécessaires
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
                //On récupère la taille du fichier et on créer un buffer de la même taille
                var fileSize = getFilesizeInBytes(config_path);
                var buffer = new Buffer(fileSize);
        
                //On lit le fichier
                fs.read(fd, buffer, 0, fileSize, 0, function (err, num) {
                    //On calcul son hash
                    hash.update(buffer);
                    let file_hash = hash.digest('hex');
                    
                    //On récupère le dernier hash dans la base
                    var req= "SELECT hash FROM test ORDER BY id;"
                    t.con.query(req, function(e, d){
                        if(d.length > 0){
                            if(e)throw e;
                            //On compare les hash
                            var bool = false;
                            for(var i = 0; i < d.length; i++){
                                if(d[i].hash == file_hash){
                                    //Si le hash est présent dans la base, on la marque comme utilisé
                                    bool = true;
                                    t.con.query("UPDATE test SET used = FALSE WHERE 1;")
                                    t.con.query("UPDATE test SET used = TRUE WHERE hash = '"+file_hash+"';")
                                }
                            }
                            if(!bool){
                                //Si le hash n'est pas dans la base, on lance la fonction de sauvegarde pour cette configuration
                                t.saveConfig(config_path, t);
                            }
                        }else{
                            //Si aucune configuration n'est présente dans la base de donnée, on enregistre forcément cette configuration.
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
                //On enregistre cette config dans la base, en indiquant bien qu'elle est utilisée.
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
        //Cette fonction met a jour la liste des capteurs enregistrés dans la base de données.
        var listeID = new Array();
        var listeAlias = new Array();

        //Pour chaque élément dans la liste passé en paramètre
        list.forEach(element => {
            //On découpe chaque élément et les places dans les deux listes distinctes.
           listeID.push(element.split(':')[0]); 
           //La liste contenant les ids
           listeAlias.push(element.split(':')[1]);
           //La liste contenant les alias  
        });

        this.availableCapteurs = listeID;
        this.availableCapteursAlias = listeAlias
        //On actualise nos listes.
        console.log(listeID); 
    }

    save(data, idCapteur, callback){
        //Fonction qui permet d'enregistré une données dans la table(indiquée dans le fichier de configuration) avec les valeurs passées en paramètres.
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

    //Fonction qui permet de récupérer les données pour un capteurs dont l'id est 'idCapteur' et d'ont l'id dans données se situe
    //Entre idD et idF
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

    //Fonction qui permet de récupérer les 'number' dernières données du capteur passé en argument.
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

    //Fonction générique qui permet d'exécuter une commande et qui renvoie le résultat dans la fonction de callback.
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
        //Constructeur du manager de base de données
        //Ici on utilise les données dans le fichier de configuration pour ouvrir la connexion avec la base.
        this.con = mysql.createConnection({ host: config.bdd.sql_host, user: config.bdd.sql_user, password: config.bdd.sql_password })
        //Ici on ce connecte et on renvois les éventuelles erreurs.
        this.con.connect(function(err){
            if(err){
                throw err;
            }
        });
        //On indique la base de données que l'ont va utiliser par la suite.
        this.con.query("USE "+config.bdd.bdd_name+";", function(err, res){if(err)throw err;});
        //On initialise la liste des capteurs.
        this.availableCapteurs = [];
        that = this;
        this.checkConfig('config.json', that)
    }


};
module.exports = databaseManager;
