angular.module('trendicon', [])

    .directive('trendicon', ['$timeout', function ($timeout) {
        return {
            restrict: "EA",
            transclude: false,
            replase: true,
            templateUrl: "common/directives/trendicon/trendicon.tpl.html",
            scope: { diff: '=diff'},
            link: function (scope, element, attrs) {

            }
        }
    }]);