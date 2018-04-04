var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

//Get Register
router.get('/register', function(req, res){
	res.render('register');
});

//Get Logon
router.get('/login', function(req, res){
	res.render('login');
});

//Post Register
router.post('/register', function(req, res){

	var email = req.body.email;
	var username = req.body.username;
	var password1 = req.body.password1;
	var password2 = req.body.password2;

	//validation
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();//notEmpty();
	req.checkBody('password1', 'password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password1);//notEmpty();

	var	checkuser;
	var errors = req.validationErrors();
	if(errors){
		console.log("YES");
		res.render('register',{
			errors: errors
		});
	} else {

		User.getUserByUsername(username, function(err, user){
	    	if(err){
	   			throw err;
	    	}
	    	if(!user){
				var newUser = new User({
					username: username,
					password: password1,
					email: email
				})
				User.createUser(newUser, function(err, user){
					if(err) throw err;
					//console.log(user);
				});

				req.flash('success_msg', 'You are registered and can now log in');

				res.redirect('/users/login');

			} else {
				//return done(null, false, {message: 'Invalid password'});
				req.flash('success_msg', 'Username already exist, choose another');
				res.redirect('/users/register');
			}

		});
	}
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user){
    	if(err){
   			throw err;
    	}
    	if(!user){
    		return done(null, false,  {message: 'Unknown User'});
    	}

    	User.comparePassword(password, user.password, function(err, isMatch){
    		if(err) throw err;
    		if(isMatch){

    			return done(null, user);

    		} else {
    			return done(null, false, {message: 'Invalid password'});
    		}
    	});
    });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

//post Login
router.post('/login',
	passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login', failureFlash: true}),
	function(req, res){
		res.redirect('/');
});

//post Logout
router.get('/logout', function (req, res) {
	req.logOut(); // remove all session data
	res.redirect('/users/login');
    res.send(401);

});

module.exports = router;
