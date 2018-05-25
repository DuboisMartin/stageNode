var mysql = require('mysql');
var moment = require('moment');
moment.locale('fr');

var con = mysql.createConnection({
    host: "localhost",
    user: "test",
    password: ""
});

var now = moment();
var duree = "month";
var frequence = "day";

function done(data, moment1, moment2){
    var tab = new Array();
    console.log("    "+moment1.toString()+" ::: "+moment2.toString());
    for(var i = 0; i<data.length; i++){
        if(moment(data[i].timestamp)<moment2 && moment(data[i].timestamp)>moment1){
            tab.push(data[i].data);
            console.log("        "+moment(data[i].timestamp).toString());
        }
    }
    return tab;
}

function average(data){
    if(data.length == 0){
        return 0;
    }else{
        var sum = 0;
        for(var i = 0; i < data.length; i++){
            sum += Number(data[i]);
        }
        return sum/data.length;
    }
}

function num(freq, duree){
    //How many 'freq' in 'how' Ex: How many month in year
    if(duree == "year" && freq == "month"){
        return 12;
    }else if(duree == "year" && freq == "week"){
        return 52;
    }else if(duree == "year" && freq == "day"){
        return 365;
    }else if(duree == "month" && freq == "week"){
        return 4;
    }else if(duree == "month" && freq == "day"){
        return 30;
    }else if(duree == "week" && freq == "day"){
        return 7;
    }
}

con.connect(function(err) {
    if(err) throw err;
    
    con.query("USE test", function(err, result) {
        if(err) throw err;
    });    

    con.query("SELECT * from test;", function(err, result) {
        if(err) throw err;
        console.log();
    });

    con.query('SELECT data, timestamp from capteurs where id_capteur = 004 ;', function( err, result ) {
        if(err) throw err;
        /*for(var i = 0; i < result.length; i++){
            console.log(moment(result[i].timestamp))
        }*/
        var taba = new Array();
        for( var i = 0; i < Number( num( frequence, duree ) ); i++ ){
            let fuck1 = moment( now );
            let fuck2 = moment( now );
            taba.push( [average( done( result, fuck1.startOf( frequence ), fuck2.endOf( frequence ) ) ), frequence, now.toString() ]);
            now = now.subtract( 1, frequence );
            console.log( "\n\n" );
        }
        console.log(taba);
    })

});