angular.module("debateApp", ['pc035860.scrollWatch'])
.controller("debateController", ["$scope", function($scope){
	
	// Check if they want cool or lame version
	if(!getParameterByName("sega"))
		$scope.lame = true;
		
	// Make socket object
	var socket = io();

	// Make user object
	$scope.user = {};

	// Initialize chat
	$scope.chats = [];

	// See if user has logged in before
	$scope.user.id = Cookies.get('debate_id') || chance.string();
	$scope.user.username = Cookies.get('debate_username') || chance.name();

	Cookies.set('debate_id', $scope.user.id, { expires: 7 });
	Cookies.set('debate_username', $scope.user.username, { expires: 7 });
	
	// Initialize users
	$scope.users = [];
	username_change();
	
	// Send user info to server
	socket.emit("new_user", {user: $scope.user});
	
	$scope.$watch("user.username", username_change);
	
	socket.on("get_candidates", function(candidates, user){
		console.log(user);
		if(user = $scope.user){
			$scope.candidates = candidates;
			$scope.$apply();
		}
			
	});
	
	socket.on("add_user", function(user){
		$scope.users.push(user);
		console.log("user addeeddddd");
	});
	
	socket.on("username_changed", function(user){
		var index = $scope.users.map(function(d){ return d.username }).indexOf(user.oldUsername);
		if( index == -1 )
			$scope.users.push(user);
		else
			$scope.users[index].username = user.newUsername;
		$scope.$apply();
	});

	socket.on("send_list_to_everyone", function(userlist){
		$scope.users = userlist;
		$scope.$apply();
	});
	
	socket.on("update_record", function(name, records){
		$scope.candidates[$scope.candidates.map(function(d){return d.name}).indexOf(name)].records = records;
		$scope.$apply();
	});
	
	socket.on("receive_chats", function(chats){
		$scope.chats = chats;
		$scope.$apply();
	});

	
	$scope.handleTalking = function(candidate){
		if( !candidate.talking ){
			console.log("making the candidate talk!");
			candidate.talking = true;
			socket.emit("update_records", {candidate: candidate.name, user: $scope.user, action: "add", timestamp: new Date() });
		}
		else {
			socket.emit("update_records", {candidate: candidate.name, user: $scope.user, action: "remove", timestamp: new Date() });
			candidate.talking = false;
		}	
	}

	$scope.countTalking = function(candidate){
		if(candidate.records){
			return candidate.records.filter(function(record){ 
				return !record.end 
			}).length;
		}
		
		return 0;
		
	}
	
	$scope.sendChat = function(chatText, priority){
		console.log(chatText);
		socket.emit('new_chat', {user: $scope.user, chatText: chatText, priority: priority});
		$scope.chatText = "";
	}
	
	

	function username_change(){
		Cookies.set('debate_username', $scope.user.username, { expires: 7 });
		socket.emit('username_change', $scope.user);
	}

}])
.directive("pixelate", function() {
	return {
		link: function(scope, element, attr) {
			element.on('load', function(){
				if( !scope.lame ){
					pixel = new ClosePixelation( element[0], [
						{ shape: 'square', resolution: 4, size: 0, offset: 0, alpha: 1 }
					]);
				}
			});
		}
	};	
})
.directive("sizeToSibling", function() {
	return {
		link: function(scope, element, attr) {
			resize();
			window.addEventListener("resize", resize);
			function resize(){
				element.css({
					width: (window.innerWidth - document.getElementById(attr.sibling).offsetWidth - 60) + "px"
				});
			}

		}
	};	

})
.directive("chatPane", function() {
	return {
		link: function(scope, element, attr) {
			resize();
			window.addEventListener("resize", resize);
			function resize(){
				element.css({
					height: window.innerHeight + "px"
				});
			}

		}
	};	
})
.directive("chats", function() {
	return {
		link: function(scope, element, attr) {
			scope.$watch("chats", function(){
				setTimeout(function(){
					element[0].scrollTop = 1000000000000;
				}, 250)

			});
		}
	};	
});


function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}