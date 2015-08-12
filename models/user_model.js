var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	userName: {type: String, unique: true},
	bucketName: String,
	files:[String]
})

module.exports = mongoose.model('User', userSchema);