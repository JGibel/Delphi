angular.module ('delphi.statsFactory', [])
.factory('statsFactory', ['$http', function($http){
		return {
			getTopFantasyPlayers: function(season, positions, numberPlayers, successCallback, errorCallback) {
				query = "?";
				positions.forEach(function(p){
					query += "position=" + p + "&"
				});
				query += "season=" + season + "&";
				query += "numberPlayers=" + numberPlayers;
				$http.get("/topPlayers" + query)
					.then(function(response){
						response.data.forEach(function(val){
							val.visible = true;
						});
						successCallback(response.data);
					}, function(response){
						errorCallback(response.data);
					});
			},
			getSeasonStats: function(season, playerId, successCallback, errorCallback){
				var query = "?";
				if(typeof playerId === 'string'){
					query += "playerId=" + playerId;
				} else {
					playerId.forEach(function(p){
						query += "playerId=" + p + "&";
					});
				}
				query += "season=" + season;

				$http.get("/weeklyBreakDown" + query)
					.then(function(response){
						successCallback(response.data);
					}, function(response){
						successCallback(response.data);
					});
			},
			getSeasonSchedule: function(season, team, successCallback, errorCallback){
				var query = "?";
				query += "season=" + season;
				query += "&team=" + team;

				$http.get("/schedule" + query)
					.then(function(response){
						successCallback(response.data);
					}, function(response){
						errorCallback(response.data);
					});
			},
            getDefensiveStats: function(season, minimumWeek, successCallback, errorCallback){
				var query = "?";
				query += "season=" + season;
				query += "&minimumWeek=" + minimumWeek;
				$http.get("/defensiveStats" + query)
					.then(function(response){
						successCallback(response.data);
					}, function(response){
						errorCallback(response.data);
					});
			}
		}
	}]);