var express = require("express");
var app = express();	
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var request = require("request");
var Firebase = require("firebase");

// Connect to firebase
connection = new Firebase("https://debate-counter.firebaseio.com/");
debateRef = connection.child("debate-" + new Date().getTime());


// Get the presidents we'll be tracking
var candidates = [];
fs.readFile("candidates.json", function(err, data){
	if(err) throw err;
	candidates = JSON.parse(data);
	debateRef.set(candidates);
});


app.use("/", express.static(__dirname + "/public/"));

var userlist = [];

io.on('connection', function(socket){
	
	var thisUser = {};
	
	// Send user the presidential candidates
	io.emit("get_candidates", candidates);
	
	// Say goodbye when they leave and remove them from the list
	socket.on("disconnect", function(){
		userlist.splice(userlist.indexOf(thisUser), 1);
		io.emit('send_list_to_everyone', userlist);
		console.log("user left!")
		console.log(userlist);
	});
	
	socket.on("username_change", function(user){
		// Is user new?
		var index = userlist.map(function(d){ return d.id }).indexOf(user.id);
		if( index == -1 ){
			console.log("new user!")
			// Add user to list and update everybody
			thisUser = user;
			userlist.push(thisUser);
			console.log(userlist)
			
			// Send the  complete user list out;
			io.emit('send_list_to_everyone', userlist);
		}
		else {
			var oldUsername = userlist[index].username;
			userlist[index].username = user.username;
			io.emit('username_changed', {oldUsername: oldUsername, newUsername: user.username});
		}
		

	});
	
});


// Turn on server
var port = process.env.PORT || 3000;
http.listen(port, function(){
	console.log("We're live at port " + port + ".");
});
