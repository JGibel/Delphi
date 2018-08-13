function rest(app, dao){
	app.get("/topPlayers", function(req, res){
		var season = req.query.season || 2016;
		var positions = req.query.position == null ? ['RB','TE','WR'] : req.query.position;
		var numberPlayers = req.query.numberPlayers || 20;
		dao.getTopFantasyPlayers(season, positions, numberPlayers, function(data){
            res.send(JSON.stringify(data));
		}, function(error){
            res.status(500).send(JSON.stringify({errorMessage: "Error calculating request"}));
		});
	});

	app.get("/weeklyBreakdown", function(req, res){
		var playerId = req.query.playerId;
		var season = req.query.season || 2016;
		if(playerId == null){
			res.status(400).send(JSON.stringify({errorMessage: "Player Id required"}));
		}
		dao.getWeekByWeekPoints(season, playerId, function(data){
            res.send(JSON.stringify(data));
		}, function(error){
            res.status(500).send(JSON.stringify({errorMessage: "Error calculating request"}));
		});
	});

	app.get("/defensiveStats", function(req, res){
		var season = req.query.season || 2016;
		var minimumWeek = req.query.minimumWeek || 1;
		dao.getDefenseStats(season, minimumWeek, function(data){
			res.send(JSON.stringify(data));
		}, function(error){
			res.status(500).send(JSON.stringify({errorMessage: "Error calculating request"}));
		});
	});

	app.get("/schedule", function(req, res){
		var season = req.query.saeson || 2016;
		var team = req.query.team || 'ATL';

		dao.getSchedule(season, team, function(data){
			res.send(JSON.stringify(data));
			//TODO: Format the data in a way that's usable
		}, function(error){
            res.status(500).send(JSON.stringify({errorMessage: "Error calculating request"}));
        })
	})
}

module.exports = rest;

var getDefenseYardageStats = function(db, season, minimumWeek, minimumYards, maximumYards, successCallback, errorCallback){
	db.any("WITH agg_stats AS (" +
		"SELECT " +
		"pp.gsis_id, pp.team, (sum(pp.receiving_yds)) as rec_yds, (sum(pp.receiving_rec)) as rec_recs, (sum(pp.receiving_tds)) as rec_tds " +
		"FROM play_player AS pp " +
		"INNER JOIN game as g ON pp.gsis_id = g.gsis_id " +
		"WHERE g.season_type = 'Regular' and g.season_year=" + season + " " +
		"and pp.receiving_yds >= " + minimumYards + " and pp.receiving_yds < " + maximumYards + " " +
		"and g.week >= " + minimumWeek + " " +
		"GROUP BY pp.gsis_id, pp.team)" +
		"SELECT g.season_year, " +
		"(CASE WHEN agg_stats.team = g.home_team THEN g.away_team ELSE g.home_team END) as def_team, " +
		"sum(agg_stats.rec_yds) as rec_yds_allowed, sum(agg_stats.rec_recs) as rec_recs_allowed, sum(agg_stats.rec_tds) as rec_tds_allowed " +
		"FROM agg_stats " +
		"INNER JOIN game as g ON agg_stats.gsis_id = g.gsis_id " +
		"GROUP BY season_year, def_team " +
		"ORDER BY rec_yds_allowed DESC; ")
		.then(function(data){
			successCallback(data);
		}).catch(function(error){
			console.log("Error getting defense short yardage stats");
			console.log(error);
		});
};

var getWeekByWeekPoints = function(db, season, playerId, successCallback, errorCallback){
	db.any(
			"SELECT DISTINCT ON (game.week, pp.player_id) " +
			"pp.player_id AS player_id, " +
			"game.week as game_week, " +
			"SUM(pp.rushing_yds) AS rus_yds, " +
			"SUM(pp.rushing_tds) AS rus_tds, " +
			"(SUM(pp.rushing_tds) + SUM(pp.receiving_tds)) AS tot_tds, " +
			"(SUM(pp.rushing_yds) + SUM(pp.receiving_yds)) AS tot_yds, " +
			"SUM(pp.receiving_yds) AS rec_yds, " +
			"SUM(pp.receiving_tds) AS rec_tds, " +
			"SUM(pp.receiving_rec) AS recs, " +
			"SUM(pp.receiving_tar) AS targets, " +
			"SUM(pp.rushing_att) AS touches, " +
			"(SUM(pp.rushing_yds)) AS off_yds, " +
				"(SUM(pp.passing_yds) / 25) + (SUM(pp.passing_tds) * 6) + (SUM(pp.passing_int) * -2) + " +
				"(SUM(pp.rushing_yds) / 10) + (SUM(pp.rushing_tds) * 6) + " +
				"(SUM(pp.receiving_rec) / 2) + (SUM(pp.receiving_yds) / 10) + (SUM(pp.receiving_tds) * 6) + " +
				"(SUM(pp.fumbles_rec_tds) * 6) + (SUM(pp.fumbles_lost) * -2) + " +
				"(SUM(pp.kicking_xpmade) * 1) + (SUM(pp.kicking_fgm) * 3) + " +
				"(SUM(pp.passing_twoptm) * 2) + (SUM(pp.receiving_twoptm) * 2) + (SUM(pp.rushing_twoptm) * 2) " + "AS off_fantasy_points " +
			"FROM play_player AS pp " +
			"LEFT JOIN game AS game " +
			"ON (pp.gsis_id) = (game.gsis_id) " +
			"WHERE (game.season_type = 'Regular') AND (game.season_year = " + season + ") " +
			(typeof playerId === 'string' ? "AND (pp.player_id = '" + playerId + "') " : "AND (pp.player_id IN (" + playerIdsToString(playerId) + ")) ") +
			"GROUP BY game.week, pp.player_id " +
			"HAVING true " +
			"ORDER BY game.week DESC, pp.player_id;")
		.then(function(data) {
			var combinedResults = {};
			data.forEach(function(d){
				if(combinedResults.hasOwnProperty(d.player_id)){
					combinedResults[d.player_id].push(d);
				} else {
					combinedResults[d.player_id] = [d];
				}
			});
			var arrayForm = [];
			for (var property in combinedResults) {
				if (combinedResults.hasOwnProperty(property)) {
					var temp = {};
					temp[property] = combinedResults[property];
					arrayForm.push(temp);
				}
			}
			successCallback(combinedResults);
		})
		.catch(function (error) {
			console.log("Error getting player info: ");
			console.log(error);
			return null;
		});
};

var playerIdsToString = function(playerIds){
	var s = '';
	playerIds.forEach(function(d){
		s += "'" + d + "'" + ",";
	});
	s = s.slice(0, -1);
	return s;
};

var getTopFantasyPlayers = function(db, season, position, numberPlayers, successCallback, errorCallback){
	db.any(
	"SELECT pp.player_id AS player_id, " +
	"SUM(pp.rushing_yds) AS rus_yds, " +
	"SUM(pp.rushing_tds) AS rus_tds, " +
	"(SUM(pp.rushing_tds) + SUM(pp.receiving_tds)) AS tot_tds, " +
	"(SUM(pp.rushing_yds) + SUM(pp.receiving_yds)) AS tot_yds, " +
	"SUM(pp.receiving_yds) AS rec_yds, " +
	"SUM(pp.receiving_tds) AS rec_tds, " +
	"SUM(pp.receiving_rec) AS recs, " +
	"SUM(pp.receiving_tar) AS targets, " +
	"SUM(pp.rushing_att) AS touches, " +
	"(SUM(pp.passing_yds) / 25) + (SUM(pp.passing_tds) * 6) + (SUM(pp.passing_int) * -2) + " +
		"(SUM(pp.rushing_yds) / 10) + (SUM(pp.rushing_tds) * 6) + " +
		"(SUM(pp.receiving_rec) / 2) + (SUM(pp.receiving_yds) / 10) + (SUM(pp.receiving_tds) * 6) + " +
		"(SUM(pp.fumbles_rec_tds) * 6) + (SUM(pp.fumbles_lost) * -2) + " +
		"(SUM(pp.kicking_xpmade) * 1) + (SUM(pp.kicking_fgm) * 3) + " +
		"(SUM(pp.passing_twoptm) * 2) + (SUM(pp.receiving_twoptm) * 2) + (SUM(pp.rushing_twoptm) * 2) " + "AS off_fantasy_points, " +
	"player.full_name AS full_name, " +
	"player.uniform_number AS number, " +
	"player.position AS position, " +
	"player.team AS team " +
	"FROM play_player AS pp " +
	"LEFT JOIN game AS game " +
	"ON (pp.gsis_id) = (game.gsis_id) " +
	"LEFT OUTER JOIN player AS player " +
	"ON (pp.player_id = player.player_id) " +
	"WHERE (game.season_type = 'Regular') AND (game.season_year = " + season + ") " +
	(position == null ? "" : position === "FLEX" ? "AND (player.position IN ('WR', 'TE', 'RB')) " : "AND (player.position = '" + position + "') ") +
	"GROUP BY pp.player_id, player.full_name, player.uniform_number, player.position, player.team " +
	"HAVING true " +
	"ORDER BY off_fantasy_points DESC LIMIT " + numberPlayers + ";")
		.then(function(data) {
			successCallback(data);
		})
		.catch(function (error) {
			console.log("Error getting season info: ");
			console.log(error);
			return null;
		});
};

var getSchedule = function(db, season, team, successCallback, errorCallback){
	db.any("SELECT g.week, g.season_year, " +
		"g.away_team, " +
		"g.home_team " +
		"FROM game AS g " +
		"WHERE g.season_year =" + season + " AND g.season_type = 'Regular' AND (g.home_team='" + team + "' OR g.away_team ='" + team + "') " +
		"GROUP BY g.season_year, g.week, g.home_team, g.away_team " +
		"ORDER BY g.week ASC; ")
		.then(function(data){
			successCallback(data);
		}).catch(function(error){
			console.log("Error getting defense short yardage stats");
			console.log(error);
		});
};