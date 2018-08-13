
angular.module( 'delphi.schedule', [
    'ui.router',
    'delphi.statsFactory',
    'trendicon'
])

    .directive('schedule', ['$timeout', function ($timeout) {
        return {
            restrict: "EA",
            transclude: false,
            replase: true,
            templateUrl: "app/schedule/schedule.tpl.html",
            scope: { player: '=player', teamStats: '=teamStats', showModal: '=showModal'},
            link: function ($scope, element, attrs) {
                $scope.closeModal = function(){
                    $scope.showModal = false;
                }
            }
        }
    }]);


