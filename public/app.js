angular.module("debateApp", [])
.controller("debateController", ["$scope", function($scope){
	var socket = io();

	$scope.user = {
		id: chance.string(),
		username: chance.name()
	};

	$scope.users = [];
	username_change();
	
	$scope.$watch("user", username_change);
	
	socket.on("get_candidates", function(candidates){


		$scope.candidates = candidates;
		$scope.$apply();
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

	
	$scope.handleTalking = function(candidate){
		if( !candidate.talking ){
			console.log("making the candidate talk!");
			candidate.talking = true;
			socket.emit("update_records", {candidate: candidate.name, user: $scope.user, action: "add" });
		}
		else {
			socket.emit("update_records", {candidate: candidate.name, user: $scope.user, action: "remove"});
			candidate.talking = false;
		}
			
		
	}

	function username_change(){
		socket.emit('username_change', $scope.user);
	}

}]);	
