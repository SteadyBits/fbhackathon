
//User registration model
var mongoose = require("mongoose");
var bcrypt = require('bcryptjs');

//User Schema
var MessageSchema = mongoose.Schema({
	username: {
		type: String,
		index: true
	},
	message: {
		type: String
	},
	time: {
		type: String
	}
});

var Message = module.exports = mongoose.model('Message', MessageSchema);

module.exports.getMessages = function(message, callback){
	Message.find(message, callback);
}

module.exports.deleteMessages = function(message, callback){
	Message.remove(message, function(err, res){
		//console.log(res);
		if(err){
			throw err;
		}

	});
}

module.exports.createMessage = function(newMessage, callback){

	var msgModel = new Message(newMessage);
	msgModel.save(callback);
  // saved!
}
