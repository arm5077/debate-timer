var express = require("express");
var app = express();	
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var request = require("request");
var Firebase = require("firebase");
var moment = require("moment-timezone");

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
	
	socket.on("update_records", function(keymark){
		candidate = candidates[candidates.map(function(d){return d.name}).indexOf(keymark.candidate)];
		var current = moment.tz(new Date().getTime(), "America/New_York");
		if(keymark.action == "add"){
			if( !candidate.records)
				candidate.records = [];
			candidate.records.push({ start: current.valueOf(), 
					start_formatted: current.format("HH:mm:ss"), 
					user: keymark.user });
		} else {
			console.log("remoooooove it");
			candidate.records.forEach(function(record){
				if(record.user.id == keymark.user.id && !record.end){
					record.end = moment.tz(new Date, "America/New_York").valueOf();
					record.end_formatted = moment.tz(new Date, "America/New_York").format("HH:mm:ss");
				}
					
			});
		}
		io.emit("update_record", candidate.name, candidate.records);
		debateRef.set(candidates);
	});
	
});


// Turn on server
var port = process.env.PORT || 3000;
http.listen(port, function(){
	console.log("We're live at port " + port + ".");
});
