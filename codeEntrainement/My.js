var mysql = require('mysql');
var moment = require('moment');

var con = mysql.createConnection({
    host: "localhost",
    user: "test",
    password: ""
});

var now = moment();
var duree = "month";
var frequence = "year";
if(duree == "month"){
    var intervalHigh = moment().startOf("month");
    var intervalLow = moment().startOf("month");
}else if(duree == "day"){
    var intervalHigh = moment().startOf("day");
    var intervalLow = moment().startOf("day");
}else if(duree == "year"){
    var intervalHigh = moment().startOf("year");
    var intervalLow = moment().startOf("year");
}

function done(data, moment1, moment2){
    var tab = new Array();
    for(var i = 0; i<data.length; i++){
        if(moment(data[i].timestamp)<moment2 && moment(data[i].timestamp)>moment1){
            tab.add(data[i])
            console.log(moment(data[i].timestamp)<moment2 && moment(data[i].timestamp)>moment1 == moment(data[i].timestamp).isBetween(moment1, moment2));
        }
    }
    return tab;
}

function average(data){
    var sum;
    for(var i = 0; i < data.length; i++){
        sum += data[i].data;
    }
    return sum/data.length;
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
        return 29;
    }else if(duree == "week" && freq == "day"){
        return 7;
    }
}

con.connect(function(err) {
    moment.locale('fr');
    if(err) throw err;
    
    con.query("USE test", function(err, result) {
        if(err) throw err;
    });    

    con.query("SELECT * from test;", function(err, result) {
        if(err) throw err;
        console.log();
    });

    con.query('SELECT id, timestamp from temp where id_capteur = 001 ;', function(err, result) {
        if(err) throw err;
        if()  
    })

});