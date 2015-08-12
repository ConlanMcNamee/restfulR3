var mongoose = require('mongoose');

var fileSchema = mongoose.Schema({
	ownerID: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	fileName: String,
	body: String,
	URI: String,
})

module.exports = mongoose.model('File', fileSchema);