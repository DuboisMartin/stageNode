var express = require('express');
var app = express();
 
app.get('/', function (req, res) {
  res.send(req.ip);
});
app.listen(3000);