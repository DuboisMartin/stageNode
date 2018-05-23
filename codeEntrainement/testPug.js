var express = require('express');
var app = express();
const pug = require('pug');
const compiledFunction = pug.compileFile('template.pug');
app.set('view engine', 'pug');

app.get('/', function(req, res) {
    res.render('../template', {tab: ["One", "Two"]});
});

app.listen(3050);