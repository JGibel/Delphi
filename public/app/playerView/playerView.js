
angular.module( 'delphi.playerView', [
	'ui.router',
	'delphi.statsFactory',
	'trendicon',
	'radarchart'
])

	.directive('playerView', ['$timeout', function ($timeout) {
		return {
			restrict: "EA",
			transclude: false,
			replase: true,
			templateUrl: "app/playerView/playerView.tpl.html",
			scope: { player: '=player', teamStats: '=teamStats', axisValues: '=axisValues', showModal: '=showModal'},
			link: function ($scope, element, attrs) {
				$scope.closeModal = function(){
					$scope.showModal = false;
				}
			}
		}
	}]);


