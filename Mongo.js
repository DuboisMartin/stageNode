var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/test"

mongo.connect(url, function(err, db) {
    if(err) throw err;
    console.log("Database created!");
    db.close();
});

