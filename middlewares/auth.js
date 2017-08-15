var mongoose = require('mongoose');
var userModel = mongoose.model('User');
var supplierModel = mongoose.model('Supplier');

exports.setLoogedInUser = function(req, res, next){
    if(req.session && req.session.user){
       userModel.findOne({'email': req.session.user.email}, function(err, user){
            if(user){
				req.user = user;
				delete req.user.password; 
				req.session.user = user;
				next()
			}
			else{
				// do nothing , because this is just to set the values
			}
       });
    }else{
    	next();
    }
}

exports.setLoogedInSupplier = function(req, res, next){
    if(req.session && req.session.supplier){
       supplierModel.findOne({'email': req.session.user.email}, function(err, supplier){
            if(supplier){
				req.supplier = supplier;
				delete req.supplier.password; 
				req.session.supplier = supplier;
				next()
			}
			else{
				// do nothing , because this is just to set the values
			}
       });
    }else{
    	next();
    }
}

exports.checkLogin = function(req,res,next){

	if(!req.user && !req.session.user){
		res.redirect('/user/login/screen');
	}
	else{

		next();
	}

}// end checkLogin

exports.checkSupplierLogin = function(req,res,next){

	if(!req.supplier && !req.session.supplier){
		res.redirect('/supplier/login/screen');
	}
	else{

		next();
	}

}// end checkLogin