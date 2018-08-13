angular.module('scatterplot', [])

	.directive('scatterplot', ['$timeout', function ($timeout) {
		return {
			restrict: "EA",
			transclude: false,
			replase: true,
			templateUrl: "common/directives/scatterplot/scatterplot.tpl.html",
			scope: { data: '=data', attr1: '=attr1', attr2: '=attr2'},
			link: function (scope, element, attrs) {
				var margin = {top: 20, right: 100, bottom: 30, left: 40}; //TODO: Add legend
				var width = 600 - margin.left - margin.right;
				var height = 400 - margin.top - margin.bottom;

				var x = d3.scaleLinear().range([0, width]);

				var y = d3.scaleLinear().range([height, 0]);

				var color = d3.scaleOrdinal(d3.schemeCategory10);

				scope.$watch("data", function(newVal){
					if(newVal != null){
						refreshData();
					}
				}, true);

				scope.$watchGroup(["attr1", "attr2"], function(newVal){
					if(newVal != null){
						refreshData();
					}
				}, true);

				function refreshData(){
					var ready = true;
					if(scope.data != null && scope.attr1 != null && scope.attr2 != null) {
						var dataCopy = angular.copy(scope.data);
						dataCopy.forEach(function (item, index, array) {
							if (item.visible != null && !item.visible) {
								array.splice(index, 1);
							}
							if (!item.hasOwnProperty(scope.attr1) || !item.hasOwnProperty(scope.attr2)) {
								ready = false;
							}
						});
						if(ready) {
							dataCopy.reverse();
							drawData(dataCopy);
						}

					}
				}
				var svg;

				var drawData = function(data){
					x.domain(d3.extent(data, function(d){return parseFloat(d[scope.attr1]);}));
					y.domain(d3.extent(data, function(d){return parseFloat(d[scope.attr2]);}));

					if(d3.select(".scatterplot").select("svg").select("g").empty()){
						svg = d3.select(".scatterplot").append("svg")
							// .attr("width", width + margin.left + margin.right)
							// .attr("height", height + margin.top + margin.bottom)
                            .attr("preserveAspectRatio", "xMinYMin meet")
                            .attr("viewBox", "0 0 600 400")
							.append("g")
							.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

						svg.append("g")
							.attr("class", "x axis")
							.attr("transform", "translate(0," + (height / 2) + ")")
							.call(d3.axisBottom(x))
							.append("text")
							.attr("class", "label")
							.attr("x", width)
							.attr("y", -6)
							.style("text-anchor", "end")
							.text(scope.attr1);

						svg.append("g")
							.attr("class", "y axis")
							.attr("transform", "translate(" + (width / 2) + ",0)")
							.call(d3.axisRight(y))
							.append("text")
							.attr("class", "label")
							.attr("transform", "rotate(-90)")
							.attr("y", 6)
							.attr("dy", ".71em")
							.style("text-anchor", "end")
							.text(scope.attr2);
					} else {
						svg = d3.select(".scatterplot").select("svg").select("g").transition();
						svg.select(".y.axis").duration(750).call(d3.axisRight(y));
						svg.select(".x.axis").duration(750).call(d3.axisBottom(x));
						svg = d3.select(".scatterplot").select("svg").select("g");
					}
					var points = svg.selectAll(".point")
						.data(data, function(d) { return (d && d.playerId) || d3.select(this).attr("id"); });
					points.exit().remove();
					var trans = points.transition().duration(750);
					trans.select("circle").attr("cx", function(d){
							return x(parseFloat(d[scope.attr1]));
						}).attr("cy", function(d){
							return y(parseFloat(d[scope.attr2]));
						})
						.style("fill", function(d){
							return color(d.position);
						});
					trans.select("#text-shadow")
						.attr("x", function(d){
							return x(parseFloat(d[scope.attr1])) + 5;
						})
						.attr("y", function(d){
							return y(parseFloat(d[scope.attr2])) - 1;
						})
						.text(function(d){return d.name;});
					trans.select("#text-base")
						.attr("x", function(d){
							return x(parseFloat(d[scope.attr1])) + 5;
						})
						.attr("y", function(d){
							return y(parseFloat(d[scope.attr2])) - 1;
						})
						.text(function(d){return d.name;});
					var enter = points.enter()
						.append("g")
						.attr("class", "point")
						.attr("id", function(d){
							return d.playerId;
						});

					enter.append("circle")
						.attr("class", "dot")
						.attr("r", 3.5)
						.attr("cx", function(d){
							return x(parseFloat(d[scope.attr1]));
						})
						.attr("cy", function(d){
							return y(parseFloat(d[scope.attr2]));
						})
						.style("fill", function(d){
							return color(d.position);
						})
						.on("mouseover", function(d,i) {
							scope.highlightedPlayer = d.playerId;
						})
						.on("mouseout", function(d) {
							scope.highlightedPlayer = null;
						});

					enter.append("text")
						.attr("x", function(d){
							return x(parseFloat(d[scope.attr1])) + 5;
						})
						.attr("y", function(d){
							return y(parseFloat(d[scope.attr2])) - 1;
						})
						.attr("id", "text-shadow")
						.attr("class", "scatter-label scatter-shadow")
						.text(function(d){return d.name;});
					//We append two texts so that we can have the shadow effect
					enter.append("text")
						.attr("x", function(d){
							return x(parseFloat(d[scope.attr1])) + 5;
						})
						.attr("y", function(d){
							return y(parseFloat(d[scope.attr2])) - 1;
						})
						.attr("class", "scatter-label")
						.attr("id", "text-base")
						.text(function(d){return d.name;});
				};
			}
		}
	}]);