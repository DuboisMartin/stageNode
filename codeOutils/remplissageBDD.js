var mysql  = require('mysql');

var con = mysql.createConnection({host: "localhost", user: "test", password: ""});
con.connect(function(err){
    if(err)throw err;
    else console.log("Connected");
});

con.query("USE test;", function(err, res){if(err)throw err;});

//Strucuture de la base : id, data, id_capteur, unitée, commentaire, date

var capteurs = ['001', '002','003', '004', '005'];
var valeurs = ['50', '125', '75', '200', '50', '150']
var nbrCapteurs = capteurs.length;
var nbrValeurs = valeurs.length;

for(var i = 0; i < nbrCapteurs; i++){
    for(var j = 0; j < nbrValeurs; j++){
        con.query("INSERT INTO capteurs VALUES(0, '"+valeurs[j]+"', '"+capteurs[i]+"', '', '',  CURRENT_TIMESTAMP);");
    }
}
