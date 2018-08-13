var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));
app.use('/scripts', express.static(__dirname + '/node_modules'));
var http = require('http').Server(app);
var fs = require("fs");
var pgp = require('pg-promise')();
var dbConfig = {
	host: 'localhost',
	port: 5432,
	database: 'nfldb',
	user: 'nfldb',
	password: 'nfldb'
};
var db = pgp(dbConfig);
var dao = require(__dirname + '/private/dao/dao.js')(db);

var rest = require(__dirname + '/private/rest/rest.js')(app, dao);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');

});

http.listen(3000, function(){
	console.log('listening on *:3000');
});