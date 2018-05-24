var mysql  = require('mysql');
var moment = require('moment');
var con = mysql.createConnection({host: "localhost", user: "test", password: ""});
con.connect(function(err){
    if(err)throw err;
    else console.log("Connected");
});

con.query("USE test;", function(err, res){if(err)throw err;});

//Strucuture de la base : id, data, id_capteur, unitée, commentaire, date

var capteurs = ['001'];
var valeurs = ['50', '100', '150'];
for(var a = 0; a < 5; a++){
    console.log("INSERT INTO temp VALUES(0, '"+valeurs[0]+"', '"+capteurs[0]+"', '', '', '"+moment().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss')+"');");
    console.log("INSERT INTO temp VALUES(0, '"+valeurs[1]+"', '"+capteurs[0]+"', '', '', '"+moment().format('YYYY-MM-DD HH:mm:ss')+"');");
    console.log("INSERT INTO temp VALUES(0, '"+valeurs[2]+"', '"+capteurs[0]+"', '', '', '"+moment().add(1, 'month').format('YYYY-MM-DD HH:mm:ss')+"');");

    con.query("INSERT INTO temp VALUES(0, '"+valeurs[0]+"', '"+capteurs[0]+"', '', '', '"+moment().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss')+"');");
    con.query("INSERT INTO temp VALUES(0, '"+valeurs[1]+"', '"+capteurs[0]+"', '', '', '"+moment().format('YYYY-MM-DD HH:mm:ss')+"');");
    con.query("INSERT INTO temp VALUES(0, '"+valeurs[2]+"', '"+capteurs[0]+"', '', '', '"+moment().add(1, 'month').format('YYYY-MM-DD HH:mm:ss')+"');");
}