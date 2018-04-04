var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/fsechat');
var socket = require('socket.io');

var routes = require('./routes/index');
var users = require('./routes/users');

//var server = require('./routes/server');

//Init App
var app = express();

//Fetching list of emojis
data = require('emojibase-data/en/compact.json');
console.log(data)



app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '/public')));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());

//Express Session
app.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
}));

//Passport init
app.use(passport.initialize());
app.use(passport.session());

//Express validator middleware
app.use(expressValidator({
	errorFormatter: function(param, msg, value){
		var namespace = param.split('.')
		, root = namespace.shift()
		, formParam = root;
	while(namespace.length){
		formParam += '[' + namespace.shift() + ']';
	}
	return {
		param : formParam,
		msg : msg,
		value : value
	};
  }
}));

//Connect Flash
app.use(flash());

//Global vars
app.use(function(req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');

	res.locals.error = req.flash('error');

	res.locals.user = req.user || null;
	next();
});

app.use('/', routes);
app.use('/users', users);

//set port

app.set('port', (process.env.PORT || 3000));
var server = app.listen(app.get("port"), function(){
  console.log("Server started: http://localhost:" + app.get("port") + "/");
})

var io = socket(server);

users = [];
connections = [];

io.sockets.on('connection', function(socket){

	connections.push(socket);
	console.log('connected: %s sockets connected', connections.length);


	//Disconnect
	socket.on('disconnect', function(data){
		connections.splice(connections.indexOf(socket), 1);
		console.log('Disconnected: %s sockets connected', connections.length);
	});

	//create function to send status
	sendStatus = function(s){
		socket.emit('status', s);
	}

	/*let chat = db.collection('messages');*/
	Message = require('./models/message');

	socket.on('load', function(data){
		//get chats from mongodb collection

		Message.getMessages({}, function(err, res){

			//emit message
			io.sockets.emit('output', res);

		});
	})

	//handle inputs events from clients
	socket.on('input', function(data){

		let name = data.username;
		let message = data.message;
		let timeStamp = data.time;

		if(message == ''){
			sendStatus('please enter a message');
		} else{
			//insert message

			Message.createMessage({username: name, message: message, time: timeStamp}, function(){
				io.sockets.emit('output', [data]);
				//console.log(data)
				//send status object
				sendStatus({message:'Message sent',
				 clear: true
				});
			});
		}

	});

	//Handle clear
	socket.on('clear', function(data){
		//Remove all chats from collection
			Message.deleteMessages({}, function(){
			//Emit cleared
			io.sockets.emit('cleared');
		});
	});
});
