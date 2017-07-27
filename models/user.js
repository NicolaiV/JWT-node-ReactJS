var mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema({ 
    name: {
		type: String,
		unique: true
	}, 
    password: {
		type: String,
		unique: true
	}
}));