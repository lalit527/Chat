var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema({
	userName 			: {type:String,default:'',required:true},
	group    			: {type:String,default:''},
	message  			: {type:String,default:''},
	createdOn           : {type:Date}

});

mongoose.model('Chat', chatSchema);