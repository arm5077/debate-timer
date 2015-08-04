angular.module("debateApp", [])
.controller("debateController", ["$scope", function($scope){
	var socket = io();

	$scope.user = {
		id: chance.string(),
		username: chance.name()
	};

	$scope.users = [];
	username_change();
	
	$scope.$watch("user.username", username_change);
	
	socket.on("get_candidates", function(candidates){
		$scope.candidates = candidates
	});
	
	socket.on("add_user", function(user){
		$scope.users.push(user);
		console.log("user addeeddddd");
	});
	
	socket.on("username_changed", function(user){
		console.log(user.newUsername);
		$scope.users[$scope.users.map(function(d){ return d.username }).indexOf(user.oldUsername)].username = user.newUsername;
		$scope.$apply();
	});

	socket.on("send_list_to_everyone", function(userlist){
		$scope.users = userlist;
		$scope.$apply();
	});

	function username_change(){
		socket.emit('username_change', $scope.user);
	}

}]);	
