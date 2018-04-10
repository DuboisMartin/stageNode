var mysql = require('mysql');


class Manager{
    constructor(){
        this.buf = Buffer.alloc(6, 0);
        this.length = 0;
        this.con = mysql.createConnection({host: "localhost", user: "test", password: ""})
        this.con.connect(function(err){
            if(err) throw err;
            console.log("Connected");
        });
        this.con.query("USE test;", function(err, res){if(err)throw err;});

    }
    
    get getdata(){
        return this.buf.toString('utf-8');
    }

    //Pour le code ascii d'un caractére : String.fromCharCode(data[i]).charCodeAt(0);

    addData(data){
        for(let i = 0; i < data.length; i++){
            if(String.fromCharCode(data[i]).charCodeAt(0) != 13 && String.fromCharCode(data[i]).charCodeAt(0) != 10){
                this.buf += String.fromCharCode(data[i]);
                this.length++;
            }else{
                if(this.length != 0){
                    this.send();
                }
                this.buf = null;
                this.buf = Buffer.alloc(6, 0);
                this.length = 0;
            }
        }
    }

    send(){
        var req = "INSERT INTO t1 VALUES(0, \'"+this.getdata+"\');";
        console.log(req);
        this.con.query(req, function(err, result){
            if(err) throw err;
            console.log("Row sended");
        });
    }
}
module.exports = Manager;