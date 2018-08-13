var fs = require('fs');
eval(fs.readFileSync('private/model/model.js')+'');
function dao(db){
    return {
        getDefenseStats : function(season, minimumWeek, successCallback, errorCallback){
            db.any(`
            WITH agg_stats AS (
                SELECT pp.gsis_id, pp.team, 
                SUM(pp.receiving_yds) as rec_yds, 
                SUM(pp.receiving_rec) as rec_recs, 
                SUM(pp.receiving_tds) as rec_tds,
                SUM(pp.rushing_yds) as rus_yds,
                SUM(pp.rushing_tds) as rus_tds,
                SUM(pp.passing_yds) as pass_yds,
                SUM(pp.passing_tds) as pass_tds,
                SUM(pp.passing_int) as interceptions,
                SUM(pp.fumbles_lost) as fumbles
                FROM play_player AS pp
                INNER JOIN game AS g ON pp.gsis_id = g.gsis_id
                WHERE g.season_type = 'Regular' AND g.season_year=$1
                AND g.week >= $2
                GROUP BY pp.gsis_id, pp.team)
            SELECT g.season_year, 
            (CASE WHEN agg_stats.team = g.home_team THEN g.away_team ELSE g.home_team END) AS def_team,
            SUM(agg_stats.rec_yds) AS rec_yds_allowed, 
            SUM(agg_stats.rec_recs) AS rec_recs_allowed, 
            SUM(agg_stats.rec_tds) AS rec_tds_allowed,
            SUM(agg_stats.rus_yds) AS rus_yds_allowed,
            SUM(agg_stats.rus_tds) AS rus_tds_allowed,
            SUM(agg_stats.pass_yds) AS pass_yds_allowed,
            SUM(agg_stats.pass_tds) AS pass_tds_allowed,
            SUM(agg_stats.interceptions) AS interceptions,
            SUM(agg_stats.fumbles) AS fumbles_forced
            FROM agg_stats
            INNER JOIN game AS g ON agg_stats.gsis_id = g.gsis_id
            GROUP BY season_year, def_team
            ORDER BY rec_yds_allowed DESC
        `, [season, minimumWeek])
                .then(function(data){
                    let defensiveStats  = [];
                    data.forEach(function(d){
                        defensiveStats.push(convertResultSetToDefensiveStats(d));
                    });
                    let d = {};
                    defensiveStats.forEach(function(e){
                        d[e.team] = e;
                    });
                    successCallback(d)
                }).catch(function(error){
                    console.log("Error getting defense short yardage stats");
                    console.log(error);
                    errorCallback(error)
            })
        },
        getWeekByWeekPoints : function(season, playerIds, successCallback, errorCallback) {
            let scoringRules = new ScoringRules(); //TODO: pass through via configuration?
            db.any(`
            SELECT DISTINCT ON (game.week, pp.player_id)
            pp.player_id AS player_id,
            game.week AS game_week,
            SUM(pp.rushing_yds) AS rus_yds,
            SUM(pp.rushing_tds) AS rus_tds,
            SUM(pp.receiving_yds) AS rec_yds,
            SUM(pp.receiving_tds) AS rec_tds,
            SUM(pp.receiving_rec) AS recs,
            SUM(pp.receiving_tar) AS targets,
            SUM(pp.rushing_att) AS touches,
            SUM(pp.passing_yds) AS pass_yds,
            SUM(pp.passing_tds) AS pass_tds,
            SUM(pp.passing_int) AS interceptions,
            SUM(pp.fumbles_rec_tds) AS fumbles_rec_tds,
            SUM(pp.fumbles_lost) AS fumbles_lost,
            SUM(pp.kicking_fgm) AS fg_made,
            SUM(pp.kicking_xpmade) AS xp_made,
                ((SUM(pp.passing_yds) * $1) + (SUM(pp.passing_tds) * $2) + (SUM(pp.passing_int) * $3) +
				(SUM(pp.rushing_yds) * $4) + (SUM(pp.rushing_tds) * $5) +
				(SUM(pp.receiving_rec) * $6) + (SUM(pp.receiving_yds) * $7) + (SUM(pp.receiving_tds) * $8) +
				(SUM(pp.fumbles_rec_tds) * $9) + (SUM(pp.fumbles_lost) * $10) +
				(SUM(pp.kicking_xpmade) * $11) + (SUM(pp.kicking_fgm) * $12) +
				(SUM(pp.passing_twoptm) * $13) + (SUM(pp.receiving_twoptm) * $14) + (SUM(pp.rushing_twoptm) * $14)) AS off_fantasy_points 
			FROM play_player as pp
			LEFT JOIN game AS game ON pp.gsis_id = game.gsis_id
			WHERE game.season_type = 'Regular' AND game.season_year = $16
			AND pp.player_id IN ($17:csv)
			GROUP BY game.week, pp.player_id
			ORDER BY game.week DESC, pp.player_id
            `, [scoringRules.pointsPerPassingYard, scoringRules.pointsPerPassingTd, scoringRules.pointsPerInterception,
                scoringRules.pointsPerRushingYard, scoringRules.pointsPerRushingTd,
                scoringRules.pointsPerReception, scoringRules.pointsPerReceivingYard, scoringRules.pointsPerReceivingTd,
                scoringRules.pointsPerFumbleRecoveredForTd, scoringRules.pointsPerFumbleLost,
                scoringRules.pointsPerExtraPointMade, scoringRules.pointsPerFieldGoalMade,
                scoringRules.pointsPerPassingTwoPointConversion, scoringRules.pointsPerReceivingTwoPointConversion, scoringRules.pointsPerRushingTwoPointConversion,
                season, playerIds])
                .then(function (data) {
                    let playerStats = [];
                    data.forEach(function(d){
                       playerStats.push(convertResultSetToPlayerStats(d));
                    });
                    var combinedResults = {};
                    playerStats.forEach(function(d){
                        if(combinedResults.hasOwnProperty(d.playerId)){
                            combinedResults[d.playerId].push(d);
                        } else {
                            combinedResults[d.playerId] = [d];
                        }
                    });
                    successCallback(combinedResults)
                }).catch(function (error) {
                    console.log("Error getting Week by week stats");
                    console.log(error);
                    errorCallback(error)
            });
        },
        getTopFantasyPlayers: function(season, positions, limit, successCallback, errorCallback){
            let scoringRules = new ScoringRules();
            db.any(`
            SELECT pp.player_id AS player_id,
            SUM(pp.rushing_yds) AS rus_yds,
            SUM(pp.rushing_tds) AS rus_tds,
            SUM(pp.receiving_yds) AS rec_yds,
            SUM(pp.receiving_tds) AS rec_tds,
            SUM(pp.receiving_rec) AS recs,
            SUM(pp.receiving_tar) AS targets,
            SUM(pp.rushing_att) AS touches,
            SUM(pp.passing_yds) AS pass_yds,
            SUM(pp.passing_tds) AS pass_tds,
            SUM(pp.passing_int) AS interceptions,
            SUM(pp.fumbles_rec_tds) AS fumbles_rec_tds,
            SUM(pp.fumbles_lost) AS fumbles_lost,
            SUM(pp.kicking_fgm) AS fg_made,
            SUM(pp.kicking_xpmade) AS xp_made,
                ((SUM(pp.passing_yds) * $1) + (SUM(pp.passing_tds) * $2) + (SUM(pp.passing_int) * $3) +
				(SUM(pp.rushing_yds) * $4) + (SUM(pp.rushing_tds) * $5) +
				(SUM(pp.receiving_rec) * $6) + (SUM(pp.receiving_yds) * $7) + (SUM(pp.receiving_tds) * $8) +
				(SUM(pp.fumbles_rec_tds) * $9) + (SUM(pp.fumbles_lost) * $10) +
				(SUM(pp.kicking_xpmade) * $11) + (SUM(pp.kicking_fgm) * $12) +
				(SUM(pp.passing_twoptm) * $13) + (SUM(pp.receiving_twoptm) * $14) + (SUM(pp.rushing_twoptm) * $14)) AS off_fantasy_points, 
		    player.full_name AS full_name,
		    player.uniform_number AS number,
		    player.position AS position,
		    player.team AS team
			FROM play_player as pp
			LEFT JOIN game AS game ON pp.gsis_id = game.gsis_id
			LEFT OUTER JOIN player AS player ON pp.player_id = player.player_id
			WHERE game.season_type = 'Regular' AND game.season_year = $16
			AND player.position IN ($17:csv)
			GROUP BY pp.player_id, player.full_name, player.uniform_number, player.position, player.team
			ORDER BY off_fantasy_points DESC LIMIT $18
            `, [scoringRules.pointsPerPassingYard, scoringRules.pointsPerPassingTd, scoringRules.pointsPerInterception,
                scoringRules.pointsPerRushingYard, scoringRules.pointsPerRushingTd,
                scoringRules.pointsPerReception, scoringRules.pointsPerReceivingYard, scoringRules.pointsPerReceivingTd,
                scoringRules.pointsPerFumbleRecoveredForTd, scoringRules.pointsPerFumbleLost,
                scoringRules.pointsPerExtraPointMade, scoringRules.pointsPerFieldGoalMade,
                scoringRules.pointsPerPassingTwoPointConversion, scoringRules.pointsPerReceivingTwoPointConversion, scoringRules.pointsPerRushingTwoPointConversion,
                season, positions, limit])
                .then(function (data) {
                    let playerStats = [];
                    data.forEach(function(d){
                        playerStats.push(convertResultSetToPlayerStats(d));
                    });
                    successCallback(playerStats)
                }).catch(function (error) {
                    console.log("Error getting top players stats");
                    console.log(error);
                    errorCallback(error)
            });
        },
        getSchedule: function(season, team, successCallback, errorCallback){
            db.any(`
            SELECT g.week, g.season_year, g.away_team, g.home_team
            FROM game AS g
            WHERE g.season_year = $1 AND g.season_type = 'Regular' AND (g.home_team=$2 OR g.away_team=$2)
            GROUP BY g.season_year, g.week, g.home_team, g.away_team
            ORDER BY g.week ASC
            `, [season, team]).then(function(data){
                let schedule = [];
                data.forEach(function(d){
                    let seasonWeek = new SeasonWeek();
                    seasonWeek.week = d.week;
                    seasonWeek.season = d.season_year;
                    seasonWeek.awayTeam = d.away_team;
                    seasonWeek.homeTeam = d.home_team;
                    schedule.push(seasonWeek);
                });
                successCallback(schedule)
            }).catch(function(error){
                console.log("Error getting schedule");
                console.log(error);
                errorCallback(error);
            });
        }
    }

}

module.exports = dao;

function convertResultSetToDefensiveStats(data){
    let defensiveStats = new DefensiveStats();
    defensiveStats.receivingYardsAllowed = data.rec_yds_allowed;
    defensiveStats.rushingYardsAllowed = data.rus_yds_allowed;
    defensiveStats.passingYardsAllowed = data.pass_yds_allowed;
    defensiveStats.receivingTouchdownsAllowed = data.rec_tds_allowed;
    defensiveStats.rushingTouchdownsAllowed = data.rus_tds_allowed;
    defensiveStats.passingTouchdownsAllowed = data.pass_tds_allowed;
    defensiveStats.interceptions = data.interceptions;
    defensiveStats.fumblesForced = data.fumbles_forced;
    /**
     * Don't include passing tds/yds because that value should be the same as receiving yds/tds
     */
    defensiveStats.totalYardsAllowed = parseNumeric(defensiveStats.receivingYardsAllowed) + parseNumeric(defensiveStats.rushingYardsAllowed);
    defensiveStats.totalTouchdownsAllowed = parseNumeric(defensiveStats.receivingTouchdownsAllowed) + parseNumeric(defensiveStats.rushingTouchdownsAllowed);
    defensiveStats.team = data.def_team;

    return defensiveStats;
}

function convertResultSetToPlayerStats(data){
    let playerStats = new PlayerStats();
    playerStats.rushingYards = data.rus_yds;
    playerStats.rushingTouchdowns = data.rus_tds;
    playerStats.receivingYards = data.rec_yds;
    playerStats.receivingTouchdowns = data.rec_tds;
    playerStats.receptions = data.recs;
    playerStats.passingYards = data.pass_yds;
    playerStats.passingTouchdowns = data.pass_tds;
    playerStats.touches = data.touches;
    playerStats.targets = data.targets;
    playerStats.fumblesRecoveredForTouchdown = data.fumbles_rec_tds;
    playerStats.fumblesLost = data.fumbles_lost;
    playerStats.extraPointsMade = data.xp_made;
    playerStats.fieldGoalsMade = data.fg_made;
    playerStats.fantasyPoints = data.off_fantasy_points;
    playerStats.totalYards = parseNumeric(playerStats.rushingYards) + parseNumeric(playerStats.receivingYards) + parseNumeric(playerStats.passingYards);
    playerStats.totalTouchdowns = parseNumeric(playerStats.rushingTouchdowns) + parseNumeric(playerStats.receivingTouchdowns) + parseNumeric(playerStats.passingTouchdowns);
    playerStats.name = data.full_name;
    playerStats.number = data.number;
    playerStats.position = data.position;
    playerStats.team = data.team;
    playerStats.week = data.game_week;
    playerStats.playerId = data.player_id;

    return playerStats;
}

function parseNumeric(number){
    var parsed = parseInt(number, 10);
    if (isNaN(parsed)) { return 0 }
    return parsed
}