var express = require('express');
var app = express();
var mongoose = require('mongoose');
var AWS = require('aws-sdk');
var Users = require("./models/user_model.js");
var Files = require('./models/files.js');

var s3 = new AWS.S3();

var port = process.env.port || '3000';

mongoose.connect("mongodb://localhost/restful_R3", function(err) {
	if (err) console.log(err);
	else console.log("Connection complete");
});

var apiRouter = express.Router();
require('./routes/Users.js')(apiRouter);

app.use('/api', apiRouter);


app.listen(port, function() {
	console.log('listening on port' + port);
});

 