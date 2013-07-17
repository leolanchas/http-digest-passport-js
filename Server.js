var express = require('express');
var app = express();

app.all('/', function(req, res) { res.sendfile('digest.html'); } );

app.listen(2563);