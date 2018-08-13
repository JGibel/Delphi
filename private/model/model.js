function ScoringRules(){
    this.pointsPerRushingYard = .1;
    this.pointsPerRushingTd = 6;
    this.pointsPerReceivingYard = .1;
    this.pointsPerReceivingTd = 6;
    this.pointsPerReception = .5;
    this.pointsPerPassingYard = .04;
    this.pointsPerPassingTd = 6;
    this.pointsPerInterception = -2;
    this.pointsPerFumbleLost = -2;
    this.pointsPerFumbleRecoveredForTd = 6;
    this.pointsPerExtraPointMade = 1;
    this.pointsPerExtraPointMissed = -1;
    this.pointsPerFieldGoalMade = 3;
    this.pointsPerFieldGoalMissed = -1;
    this.pointsPerPassingTwoPointConversion = 2;
    this.pointsPerReceivingTwoPointConversion = 2;
    this.pointsPerRushingTwoPointConversion = 2;

    return this;
}

function PlayerStats(){
    this.playerId = null;
    this.rushingYards = null;
    this.rushingTouchdowns = null;
    this.receivingYards = null;
    this.receivingTouchdowns = null;
    this.receptions = null;
    this.passingYards = null;
    this.passingTouchdowns = null;
    this.interceptions = null;
    this.touches = null;
    this.targets = null;
    this.fumblesRecoveredForTouchdown = null;
    this.fumblesLost = null;
    this.extraPointsMade = null;
    this.extraPointsMissed = null;
    this.fieldGoalsMade = null;
    this.fieldGoalsMissed = null;
    this.fantasyPoints = null;
    this.totalYards = null;
    this.totalTouchdowns = null;
    this.name = null;
    this.number = null;
    this.position = null;
    this.team = null;
    this.week = null;
    this.season = null;

    return this;
}

function DefensiveStats(){
    this.receivingYardsAllowed = null;
    this.rushingYardsAllowed = null;
    this.passingYardsAllowed = null;
    this.totalYardsAllowed = null;
    this.receivingTouchdownsAllowed = null;
    this.rushingTouchdownsAllowed = null;
    this.passingTouchdownsAllowed = null;
    this.totalTouchdownsAllowed = null;
    this.interceptions = null;
    this.fumblesForced = null;
    this.team = null;

    return this;
}

function SeasonWeek(){
    this.week = null;
    this.season = null;
    this.awayTeam = null;
    this.homeTeam = null;

    return this;
}