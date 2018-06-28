var request = require('request');
const { StringDecoder } = require('string_decoder');

var config = require('config.json')('./config.json');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class Manager{

    CHECKSUM(hexstring) {
    
        var s = hexstring.match(/../g);
        var sum = 0;
        s.forEach(function (hexbyte) {
            var n = 1 * ('0x' + hexbyte); // convert hex to number
            sum += n;
        });
        sum = (sum & 255).toString(16);
        if (sum.length % 2)
            sum = '0' + sum;
        return sum;
    }
    constructor(ip){
        console.log(":::"+ip);
        this.ip = ip;
        this.buf = Buffer.alloc(50, 0);
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
        console.log('https://'+this.ip+'/api');
        request.get('https://'+this.ip+'/api').on('response', function(response){ if(response.statusCode == 200) console.log("Api joignable."); else console.log(response);}).on('error', function(err){ console.log(err) })

        request.get('https://'+this.ip+'/api').on('response', function(response){ if(response.statusCode == 200) console.log("Api joignable."); else console.log("Api error");}).on('error', function(err){ console.log("Api error") })
    }

    addData(data){
        for(let i = 0; i < data.length; i++){
            if(String.fromCharCode(data[i]).charCodeAt(0) != 10){
                this.buf += String.fromCharCode(data[i]);
                this.length++;
            }else{
                if(this.length != 0){
                    this.send();
                }
                this.buf = null;
                this.buf = Buffer.alloc(50, 0);
                this.length = 0;
            }
        }
    }

    send(){
        console.log("asked to send data : "+ this.getdata);

        var cheh = this.getdata;
        console.log(this.CHECKSUM(Buffer(cheh).toString('hex')));
        
        var ck = cheh[0].charCodeAt(0);
        for(let i = 0; i < cheh.length; i++){
            ck = ck ^ cheh[i].charCodeAt(0);
        }
        console.log(ck);

        var tab = new Array();
        tab = this.getdata.substr(2, 100).substr(0, this.getdata.substr(2, 100).length-5).split(';');
        for(var i = 0; i < tab.length-1; i++){
            var options = {
                uri: 'https://'+this.ip+'/api/01'+String(i)+'/last?raw_data='+tab[i],
                method: 'POST'
            };
            console.log("Try sending temp");
            console.log(options.uri)
            request(options, function(error, response, body) {
                if(!error && response.statusCode == 200){
                    console.log("temp sended.");
                }else{
                    console.log(error);
                }
            });

        }
    }
}
module.exports = Manager;