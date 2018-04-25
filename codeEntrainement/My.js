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

    con.query("SELECT * from test;", function(err, result) {
        if(err) throw err;
        console.log();
    });

});