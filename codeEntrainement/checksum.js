function CHECKSUM(hexstring) {

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

var str = "12.1;25.71;23.93;58.9;23.96;0.0;118.;1.;0.;";
var end = "[A9]"


var ck = str[0].charCodeAt(0);
for(let i = 0; i < str.length; i++){
    ck = ck ^ str[i].charCodeAt(0);
}
console.log(ck.toString(16));

console.log(CHECKSUM(Buffer(str).toString('hex')));