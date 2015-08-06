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

// Initialize list of users 
var userlist = [];

// Initialize list of chats
var chats = [];

io.on('connection', function(socket){
	
	var thisUser = {};
	
	// Send user the presidential candidates
	
	socket.on("new_user", function(packet){
		io.emit("get_candidates", candidates, packet.user);
		thisUser = packet.user;
	});
	
	// Say goodbye when they leave and remove them from the list
	socket.on("disconnect", function(){
		chats.push({user: {username: "debatebot"}, chatText: thisUser.username + " has left :-(", priority: "low" });
		io.emit("receive_chats", chats);
		
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
			console.log(userlist);
			
			// Greet them in the chat
			chats.push({user: {username: "debatebot"}, chatText: thisUser.username + " has joined! Welcome!", priority: "low" });
			io.emit("receive_chats", chats);
			
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
		// Get 
		candidate = candidates[candidates.map(function(d){return d.name}).indexOf(keymark.candidate)];
		var current = moment.tz(keymark.timestamp, "America/New_York");
		if(keymark.action == "add"){
			if( !candidate.records)
				candidate.records = [];
			candidate.records.push({ start: current.valueOf(), 
					start_formatted: current.format("HH:mm:ss"), 
					user: keymark.user });
			
			// Send chat notification
			chats.push({user: {username: "debatebot"}, chatText: keymark.user.username + " says " + candidate.name + " is talking.", priority: "low" });
			
		} else {
			console.log("remoooooove it");
			candidate.records.forEach(function(record){
				if(record.user.username == keymark.user.username && !record.end){
					record.end = moment.tz(keymark.timestamp, "America/New_York").valueOf();
					record.end_formatted = moment.tz(keymark.timestamp, "America/New_York").format("HH:mm:ss");
					
					// Send chat notification
					chats.push({user: {username: "debatebot"}, chatText: keymark.user.username + " says " + candidate.name + " has stopped talking.", priority: "low" });
				}
			});
		}
		io.emit("update_record", candidate.name, candidate.records);
		io.emit("receive_chats", chats);
		debateRef.set(candidates);
	});
	
	socket.on("new_chat", function(chat){
		chats.push(chat);
		io.emit("receive_chats", chats);
	});
	
});


// Turn on server
var port = process.env.PORT || 3000;
http.listen(port, function(){
	console.log("We're live at port " + port + ".");
});
