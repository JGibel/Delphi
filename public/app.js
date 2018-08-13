var delphi = angular.module('delphi', ['ngRoute', 'ui.router', 'delphi.consistency', 'delphi.playerList', 'delphi.configuration', 'delphi.schedule']);
delphi.config(function($routeProvider, $httpProvider, $urlRouterProvider, $stateProvider){
	$urlRouterProvider.otherwise("/playerList");
	$stateProvider
		.state('playerList', {
			url: '/playerList',
			templateUrl: 'app/playerList/playerList.tpl.html',
			controller: 'playerListCtrl'
		})
		.state('configuration', {
			url: '/configuration',
			templateUrl: 'app/configuration/configuration.tpl.html',
			controller: 'configurationCtrl'
		});

});
delphi.controller("appCtrl", function($scope, $http){

});