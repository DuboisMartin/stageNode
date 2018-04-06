var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "test",
    password: ""
});



con.connect(function(err) {
    if(err) throw err;
    console.log("Connected");
    
    con.query("USE test", function(err, result) {
        if(err) throw err;
        console.log(result);
    });    

    con.query("SELECT * from t1;", function(err, result) {
        if(err) throw err;
        console.log(result);
    });

});