angular.module( 'delphi.playerList', [
	'ui.router',
	'delphi.statsFactory',
	'delphi.consistency',
	'delphi.playerView'
]).controller( 'playerListCtrl', [ '$scope','statsFactory', '$rootScope', '$state', function playerListCtrl( $scope, statsFactory, $rootScope, $state) {
	//default settings
	$scope.season = '2017';
	$scope.playerLimit = 20;
	$scope.numberOfGamesThreshold = 3;
	$scope.position = 'FLEX';

	$scope.currentWeek=16;

	$scope.gamesBack = 3;
	$scope.graphAttrs = ['consistencyScore', 'fantasyPoints'];

	$scope.defaultTableAttributes = [
		{display: "Rec. Yards", value: "receivingYards"},
		{display: "Rus. Yards", value: "rushingYards"},
		{display: "Tot. Yards", value: "totalYards"},
		{display: "Rec. TDs", value: "receivingTouchdowns"},
		{display: "Rus. TDs", value: "rushingTouchdowns"},
		{display: "Tot. TDs", value: "totalTouchdowns"},
		{display: "Recs", value: "receptions"},
		{display: "Targets", value: "targets"},
		{display: "Touches", value: "touches"},
		{display: "Cons. Score", value: "consistencyScore"},
		{display: "Fan. Points", value: "fantasyPoints"}
	];

	$scope.defaultAxisValues = [
		{value: "totalYards", maxValue: "0", minValue: "999", display: "Yards"},
		{value: "totalTouchdowns", maxValue: "0", minValue: "999", display: "TDs"},
//		{value: "consistencyScore", maxValue: "0", minValue: "99999", display: "consistency"},
		{value: "fantasyPoints", maxValue: "999", minValue: "0", display: "FP"},
		{value: "receptions", maxValue: "0", minValue: "999", display: "Recs"}
	];

	$scope.playerLimit = $rootScope.playerLimit || 20;
	$scope.numberOfGamesThreshold = $rootScope.numberOfConsistencyGames || 3;
	$scope.season = $rootScope.season || '2017';
	$scope.selectedPositions = $rootScope.selectedPositions || ['WR', 'TE', 'RB'];
	$scope.tableAttributes = angular.copy($rootScope.selectedStats || $scope.defaultTableAttributes);
	$scope.axisValues = angular.copy($rootScope.selectedRadarStatistics || $scope.defaultAxisValues);

	$rootScope.selectedRadarStatistics = $scope.axisValues;//default axis values
	$rootScope.selectedStats = $scope.tableAttributes; //default table attributes
	$rootScope.selectedPositions = $scope.selectedPositions;
	$rootScope.season = $scope.season; //above
	$rootScope.numberOfConsistencyGames = $scope.numberOfGamesThreshold; //numberOfGamesThreshold
	$rootScope.playerLimit = $scope.playerLimit; //above

	$scope.refreshStats = function(){
		statsFactory.getTopFantasyPlayers($scope.season, $scope.selectedPositions, $scope.playerLimit, function(data){
			$scope.playerList = data;
			$scope.playerList.sort(function(p1,p2){
				return p2.fantasyPoints - p1.fantasyPoints;
			});
			getWeeklyBreakDownFromTopPlayers(data);
			$scope.selectPlayer($scope.playerList[0]);
		});
	};

	$scope.refreshStats();

	$scope.selectCol = function(value){
		var i = $scope.graphAttrs.indexOf(value);
		if(i !== -1){
			$scope.graphAttrs.splice(i, 1);
		} else {
			$scope.graphAttrs.push(value);
		}
	};

	$scope.sortCol = function(value){
		//TODO: Sort column in here
	};



	var getWeeklyBreakDownFromTopPlayers = function(data){
		var playerIds = [];
		data.forEach(function(p){
			playerIds.push(p.playerId);
		});
		statsFactory.getSeasonStats($scope.season, playerIds, function(data){
			$scope.weeklyBreakDown = data;

			$scope.playerList.forEach(function(d, j){
				$scope.axisValues.forEach(function(a, i){
					if(j === 0){
						$scope.axisValues[i].maxValue = parseFloat(d[a.value]);
						$scope.axisValues[i].minValue = parseFloat(d[a.value]);
					} else {
						$scope.axisValues[i].maxValue = parseFloat(Math.max($scope.axisValues[i].maxValue, d[a.value]));
						$scope.axisValues[i].minValue = parseFloat(Math.min($scope.axisValues[i].minValue, d[a.value]));
					}
				});

				var weeklyStats = $scope.weeklyBreakDown[d.playerId];
				d.num_games = weeklyStats.length;

				$scope.defaultTableAttributes.forEach(function(a){
					d['diff_' + a.value] = 0;
				});

				//TODO: Is there a way to abstract this out? d['diff' + value] = 0
				for(var i = 0; i < $scope.gamesBack; i++){
					$scope.tableAttributes.forEach(function(a){
						d['diff_' + a.value] += parseFloat(weeklyStats[i][a.value]);
					});
				}
			});
			//calculate new consistency list
			calculateConsistency($scope.playerList, $scope.weeklyBreakDown);
		});
	};

	var calculateConsistency = function(playerList, playerWeeklyStats){
		$scope.consistencyScores = [];
		playerList.forEach(function(d){
			var weeklyStats = playerWeeklyStats[d.playerId];

			weeklyStats.sort(function(w1, w2){return w2.fantasyPoints - w1.fantasyPoints});

			var thresholdPoints = 0.0;
			for(var i = 0; i < $scope.numberOfGamesThreshold; i++){
				thresholdPoints += parseFloat(weeklyStats[i].fantasyPoints);
			}

			d.consistencyScore = 1 - (thresholdPoints / d.fantasyPoints);
		});
	};

	$scope.teamStats = {schedule: {}};

	$scope.selectPlayer = function(player){
        $scope.showModal = $scope.selectedPlayer === player;

		$scope.selectedPlayer = player;

		if($scope.teamStats[$scope.selectedPlayer.team] == null){
			$scope.getTeamStats($scope.selectedPlayer.team);
		}
	};

	$scope.toggleDisplay = function(event, player){
		player.visible = !player.visible;
		event.stopPropagation();
	};

	$scope.getTeamStats = function(team){
		$scope.teamStats[team] = {};
		statsFactory.getSeasonSchedule($scope.season, team, function(data){
			var sched = data.filter(function(w){
				return w.week >= $scope.currentWeek;
			});
			var l = sched.length;
			while(l < 4){
				sched.unshift(data[data.length - l - 1]);
				l = sched.length;
			}
			sched.forEach(function(s){
				//TODO: do in rest layer
				if(s.homeTeam === team){
					s.opposingTeam = s.awayTeam;
				} else {
					s.opposingTeam = s.homeTeam;
				}
			});

			$scope.teamStats.schedule[team] = sched;
		});

		statsFactory.getDefensiveStats($scope.season, 1, function(data){
			addRankingsToStats(data);
			$scope.teamStats.fullStats = data;

		});
		statsFactory.getDefensiveStats($scope.season, $scope.currentWeek - 3, function(data){
			addRankingsToStats(data);
			$scope.teamStats.diffStats = data;
		});
	};


	var addRankingsToStats = function(data){
		if(data == null){
			return;
		}
		for(var property in data[Object.keys(data)[0]]){
			if(data[Object.keys(data)[0]].hasOwnProperty(property)){
				if(property === 'team'){
					continue;
				}
				let teams = Object.keys(data);
                teams.sort(function(a,b){
					return data[b][property] - data[a][property];
				});
				if(property !== 'interceptions' && property !== 'fumbles'){
					teams = teams.slice().reverse();
				}
                teams.forEach(function(d, i){
                	data[d][property + "Ranking"] = i + 1;
				})
			}
		}
		return data;
	};

	$scope.goToConfiguration = function(){
		$state.go("configuration");
	}




	}])

;

