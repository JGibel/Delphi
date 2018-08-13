angular.module( 'delphi.configuration', [
	'ui.router',
	'delphi.statsFactory'
]).controller( 'configurationCtrl', [ '$scope','statsFactory', '$rootScope', '$state', function configurationCtrl( $scope, statsFactory, $rootScope, $state) {
		$scope.positions = ["QB", "WR", "RB", "TE", "K"];
		$scope.positionCheckbox = {
			"QB": {selected: false},
			"WR": {selected: false},
			"RB": {selected: false},
			"TE": {selected: false},
			"K": {selected: false}};

//	$scope.teams = ["BAL", "CIN", "CLE", "PIT",
//		"CHI", "DET", "GB", "MIN",
//		"HOU", "IND", "JAC", "TEN",
//		"CAR", "NO", "TB", "ATL",
//		"BUF", "NE", "NYJ", "MIA",
//		"DAL", "NYG", "PHI", "WAS",
//		"DEN", "KC", "LAC", "OAK",
//		"ARI", "LAR", "SF", "SEA"
//	];

	$scope.selectedStatistics = angular.copy($rootScope.selectedStats) || [];
	$scope.selectedRadarStatistics = angular.copy($rootScope.selectedRadarStatistics) || [];
	$scope.selectedPositions = $rootScope.selectedPositions || [];
	$scope.season = $rootScope.season;
	$scope.numberOfConsistencyGames = $rootScope.numberOfConsistencyGames;
	$scope.playerLimit = $rootScope.playerLimit;

	$scope.statistics = [
		{display: "Rec. Yards", value: "receivingYards"},
		{display: "Rus. Yards", value: "rushingYards"},
		{display: "Pass Yards", value: "passingYards"},
		{display: "Tot. Yards", value: "totalYards"},
		{display: "Rec. TDs", value: "receivingTouchdowns"},
		{display: "Rus. TDs", value: "rushingTouchdowns"},
		{display: "Pass TDs", value: "passingTouchdowns"},
		{display: "Tot. TDs", value: "totalTouchdowns"},
		{display: "Recs", value: "receptions"},
		{display: "Targets", value: "targets"},
		{display: "Touches", value: "touches"},
		{display: "Cons. Score", value: "consistencyScore"},
		{display: "Fan. Points", value: "fantasyPoints"}
	];

	$scope.hasItem = function(array, item){
		for(var i = 0; i < array.length; i++){
			if(item.value === array[i].value){
				return i;
			}
		}
		return -1;
	};

	$scope.addBasicItemToArray = function(array, item){
		var index = array.indexOf(item);
		if(index === -1){
			array.push(item);
		} else {
			array.splice(index, 1);
		}
	};

	$scope.addItemToArray = function(array, item){
		var index = $scope.hasItem(array, item);
		if(index === -1){
			array.push(item);
		} else {
			array.splice(index, 1);
		}
	};

	$scope.saveConfiguration = function(){
		$rootScope.selectedRadarStatistics = $scope.selectedRadarStatistics;
		$rootScope.selectedStats = $scope.selectedStatistics;
		$rootScope.selectedPositions = $scope.selectedPositions;
		$rootScope.season = $scope.season;
		$rootScope.numberOfConsistencyGames = $scope.numberOfConsistencyGames;
		$rootScope.playerLimit = $scope.playerLimit;
		//change page
		$state.go("playerList");
	};

	$scope.cancelConfiguration = function(){
		//change page
		$state.go("playerList");
	}
	}]);

