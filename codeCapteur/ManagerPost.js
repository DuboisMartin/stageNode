var request = require('request');
const { StringDecoder } = require('string_decoder');

class Manager{
    constructor(){
        this.buf = Buffer.alloc(6, 0);
        this.length = 0;
        this.status;
        this.tryJoin();
        this.decoder = new StringDecoder('utf-8');

    }
    
    get getdata(){
        let data = this.decoder.write(this.buf);
        var str = ""
        Array.from(data).forEach(function(element){
            if(element != '\0'){
                str += element;
            }
        });
        return str;
    }

    //Pour le code ascii d'un caractére : String.fromCharCode(data[i]).charCodeAt(0);

    tryJoin(){
        request.get('http://localhost:3000').on('response', function(response){ if(response.statusCode == 200) console.log("Api joignable."); else console.log("Api error"); }).on('error', function(err){ console.log("Api error") })
    }

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
        var options = {
            uri: 'http://localhost:3000/temp?temp='+this.getdata,
            method: 'POST'
        };

        request(options, function(error, response, body) {
            if(!error && response.statusCode == 200){
                console.log("temp sended.");
            }
        });
    }
}
module.exports = Manager;