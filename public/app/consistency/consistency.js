
angular.module( 'delphi.consistency', [
	'ui.router',
	'delphi.statsFactory',
	'scatterplot'
])
	.directive('consistencyView', ['$timeout', function ($timeout) {
		return {
			restrict: "EA",
			transclude: false,
			replase: true,
			templateUrl: "app/consistency/consistency.tpl.html",
			scope: { playerList: '=playerList', graphAttr1: '=graphAttr1', graphAttr2: '=graphAttr2'},
			link: function (scope, element, attrs) {

			}
		}
	}]);

