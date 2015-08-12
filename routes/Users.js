var Users = require('../models/user_model.js');
var Files = require('../models/files.js');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var AWS = require('aws-sdk');

var s3 = new AWS.S3();
AWS.config.update({"region":"Oregon"})

var Users = require("../models/user_model.js");
var Files = require('../models/files.js');



module.exports = function(router) {
	router.use(bodyParser.json());
	router.route('/users')
				.get(function (req,res) {
					Users.find({}, function (err, data) {
						if(err) {
							res.status(404);
							res.json({msg: "err"});
						} else {
							res.status(200);
							res.json(data);
						}
					})
				})
				.post(function (req,res) {
					var user = new Users(req.body)
					console.log(user);
					user.save(function (err, data) {
						if(err) {
							res.status(500)
							res.json({msg:"user save failed"})
						} else {
							res.status(200)
							var params = { Bucket: "lulwat", Key: req.body.userName + '/'}
							console.log(params);
							s3.putObject(params, function (err, data) {
								if(err) {
									console.log(err)
								} else {
									console.log(data);
								}
							})
							res.send(user);
						}
					})
				})
				/*                    above works                         */
	router.route('/users/:user')
				.get(function (req,res) {
					var user = req.params.user;
					Users.findOne({userName: user}, function(err, data) {
						if (err) {
							res.status(500);
							res.send({msg:"User not found"});
						} 
						if (data) {
							res.status(200);
							res.json(data);
						}
					})
				})
				.put(function(req,res) {
					var user = req.params.user;
					Users.update({_id: user}, function (){
					res.json({msg:"User updated!"});
					})
				})
				.delete(function (req,res) {
					var user = req.params.user;
					Users.findOne({_id: req.params.user}, function (err, data) {
						if(err) {
							res.status(500);
							res.json({msg: "Opps there seems to have been an error on the server"});
						} if (data) {
							data.remove();
							res.status(200);
							res.json({msg: "User " + user + " deleted"});
						} else {
							res.status(404);
							res.json({msg: "User " + user + " was not found"})
						}
					})

					var params = { Bucket: 'lulwat', Prefix: user};
					s3.listObjects(params, function (err, data) {
						//all required for the deleteObjects function
						params = {Bucker: 'lulwat'};
						params.Delete = {};
						params.Delete.Objects = [];
					
					//data.Contents is an array
						data.Contents.forEach(function (file) {
							//Key is also required for a successful deleteObjects function
							params.Delete.Objects.push({Key: file.Key});
						})
						s3.deleteObjects(params, function (err, data) {
							if(err) {
								return console.log(err);
							} else {
								return console.log(data);
							}
						})
					})
				})
	router.route('/users/:user/files')
				.get(function (req,res) {
					var userId = req.params.user;
					var files = [];
					Users.findOne({_id: userId}, function (err, data) {
						if(err) {
							console.log(err)
						} else {
						files.push(data.files);
						res.send(files);
						}
					});
				})
				.post(function (req,res) {
					var userId = req.params.user;
					var file = new Files(req.body);

					console.log(userId);
					console.log(req.body);

					var params = {Bucket: 'lulwat', 
												Key: userId + '/' + 
												req.body.fileName};

					var url = s3.getSignedUrl('getObject', params, function (err, url) {
						if (err) {
							return console.log(err)
						} else {
							file.URI = url;
						}
					});
					console.log('url is', url);
					

					s3.putObject(params, function (err, data) {
						if(err) return console.log(err);
						console.log(data);
					})
					file.save(function (err,file) {
						if(err) {
							console.log(err);
						} else {
							console.log(file);
						}
					})
					Users.findOne({_id: userId}, function (err, user) {
          	user.files.push(file);
          	user.save();
          	console.log(user);
        	});
					res.json({msg:"it happened"});
				})
				/*   the get and the post work how i want them too now! you can see the url to your file!   */
	router.route('/users/:user/files/:file')
				.get(function(req,res) {
					var user = req.params.user;
					console.log(user);
					var file = req.params.file;
					console.log(file);
					Users.findOne({_id: user}, function(err, data) {
						if (err) {
							return console.log(err);
						} 
						console.log(data);
						console.log(data.files);
						

						if (data.files.length > 0) {
							console.log(data.files[2].URI);
							for(var i = 2; i < data.files.length;i++) {
								if(data.files[i].toString().split(',')[2] === file) {
									console.log('we managed to get in here!');
									res.send(data.files[i].toString().split(',')[1]);
								}
							}
							console.log('were in here!');
						}
					})
				})
				.put(function(req,res) {
					var userId = req.params.user;
			    var currFile = req.params.file;
			    var newFileContents = req.body.body;

			    if (req.body.fileName || !newFileContents) {
			      return res.status(400).json({msg: 'Input does not match schema'});
			    } else {
		        User.findOne({username: userId}, function(err, user) {
		          if (err) {
		            return console.log(err);
		          }
		          var matchFound = false;
		          for (var i = 0; i < user.files.length; i++) {
		            (function(i) {
		              var fileId = user.files[i];
		              File.findById(fileId, function(err, file) {
		                if (file.fileName === currFile) {
		                  matchFound = true;
		                  var params = {
		                    Bucket: ourBucket,
		                    Key: userId + '/' + currFile,
		                    Body: newFileContents
		                  }
		                  file.update({$set: {"content": newFileContents}}, function(err, data) {
		                    if (err) {
		                      console.log(err);
		                    } else {
		                      var url = s3.getSignedUrl('getObject', params, function(err, url) {
		                        if (err) return console.log(err);
		                        file.url = url;
		                      });

		                      s3.putObject(params, function(err, data) {
		                        if (err) {
		                          return console.log(err);
		                        }
		                      });
		                      return console.log('it happened');
		                    }
		                  });
		                } else if ((i === user.files.length - 1) && (matchFound === false)) {
		                  return console.log('it didnt happened');
		                }
		              });
		            })(i);
		          }
		        });
		      }
				})
				.delete(function(req,res) {
					var params = {
						Bucket: 'lulwat',
						Delete: {
							Objects: [{Key: req.params.user + '/' + req.params.file}]
						}
					};
					s3.deleteObjects(params, function(err, data) {
						if(err) {
							return console.log(err);
						}
						console.log(data.Deleted);
					});

					Users.findOne({_id: req.params.user}, function(err, user) {
						if (err)  {
							return console.log(err);
						} else {
							if(user.files.length > 0) {
								for (var i = 0; i < user.files.length; i++) {
									(function(i) {
										var field = user.files[i];
										File.findById(fileId, function(err, file) {
											if(file.fileName === req.params.file) {
												file.remove();
												user.update({$pull: {files: fileId}}, function(err, data) {
													if (err) return console.log(err);
													console.log(file);
												})
											} else {
												return console.log(err);
											}
										})
									})
								}
							} else {
								return console.log(err);
							}
						}
					})
				})
}