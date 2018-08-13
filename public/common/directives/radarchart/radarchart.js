angular.module('radarchart', [])
.directive('radarchart', ['$timeout', function ($timeout) {
	return {
		restrict: "EA",
		transclude: false,
		replase: true,
		templateUrl: "common/directives/radarchart/radarchart.tpl.html",
		scope: { data: '=data', axisValues: '=axisValues'},
		link: function (scope, element, attrs) {
			var allAxis = [];
			var dataArray = [];
			scope.$watch("data", function(newVal){
				if(newVal != null){
					refreshData(scope.data, scope.axisValues);
				}
			}, true);
			scope.$watch("axisValues", function(newVal){
				if(newVal != null){
					refreshData(scope.data, scope.axisValues);
				}
			}, true);


			var refreshData = function(data, axisValues){
				if(axisValues != null && data != null) {
					dataArray = [];
					allAxis = axisValues;
//						allAxis = $.map(axisValues, function (value, index) {
//							return [value];
//						});
					allAxis.forEach(function (d) {
						if(data[d.value] == null){return;}
						if(d.minValue == undefined || d.maxValue == undefined){
							return;
						}
						dataArray.push({axis: d.value, value: data[d.value]});
					});
					if(allAxis.length == dataArray.length) {
						drawData(dataArray);
					}
				}
			};
			var margin = {top: 25, right: 25, bottom: 25, left: 25};
			var width = 300 - margin.left - margin.right;
			var height = 300 - margin.top - margin.bottom;
			var circleRadius = 5;

			var radians = 2 * Math.PI;
			var opacity = 0.5;
			var radius = Math.min(width/2, height/2);

			d3.select("#chart").select("svg").remove();

			var g = d3.select("#chart")
				.append("svg")
				// .attr("width", width + margin.right + margin.left)
				// .attr("height", height + margin.top + margin.bottom)
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "0 0 300 300")
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			var tooltip = g.append('text')
				.attr("class", "tooltip")
				.style('opacity', 0);
			var getAxisValue = function(axis){
				for(var i = 0; i < allAxis.length; i++){
					if(allAxis[i].value === axis){
						return allAxis[i];
					}
				}
			};

			var x = function(j, i){
				if(getAxisValue(j.axis).maxValue === 0 && getAxisValue(j.axis).minValue === 0){
                    return width/2*(1-(.5)*Math.sin(i*radians/allAxis.length));
				}
				return width/2*(1-(parseFloat(Math.max(j.value, 0) - getAxisValue(j.axis).minValue) / (getAxisValue(j.axis).maxValue - getAxisValue(j.axis).minValue))*Math.sin(i*radians/allAxis.length));
			};

			var y = function(j,i){
                if(getAxisValue(j.axis).maxValue === 0 && getAxisValue(j.axis).minValue === 0){
                    return height/2*(1-(.5)*Math.cos(i*radians/allAxis.length))
                }
				return height/2*(1-(parseFloat(Math.max(j.value, 0) - getAxisValue(j.axis).minValue) / (getAxisValue(j.axis).maxValue - getAxisValue(j.axis).minValue))*Math.cos(i*radians/allAxis.length))
			};

			var drawData = function(dataArr){
				var numLevels = 3;
				for(var i=0; i < numLevels; i++){ //draw pentagons
					var levelFactor = radius*((i+1)/numLevels);
					var levels = g.selectAll(".levels" + i)
						.data(allAxis, function(d) { return (d && d.value) || d3.select(this).attr("id");});
					levels.exit().remove();
					var transLevels = levels.transition().duration(750);
					transLevels
						.attr("x1", function(d, i){return levelFactor*(1-Math.sin(i*radians/allAxis.length));})
						.attr("y1", function(d, i){return levelFactor*(1-Math.cos(i*radians/allAxis.length));})
						.attr("x2", function(d, i){return levelFactor*(1-Math.sin((i+1)*radians/allAxis.length));})
						.attr("y2", function(d, i){return levelFactor*(1-Math.cos((i+1)*radians/allAxis.length));});

					levels.enter()
						.append("svg:line")
						.attr("x1", function(d, i){
							return levelFactor*(1-Math.sin(i*radians/allAxis.length));
						})
						.attr("y1", function(d, i){
							return levelFactor*(1-Math.cos(i*radians/allAxis.length));
						})
						.attr("x2", function(d, i){
							return levelFactor*(1-Math.sin((i+1)*radians/allAxis.length));
						})
						.attr("y2", function(d, i){
							return levelFactor*(1-Math.cos((i+1)*radians/allAxis.length));
						})
						.attr("id", function(d,i){return "level" + i + "axis" + d.value;})
						.attr("class", "line levels" + i)
						.attr("transform", "translate(" + (width/2-levelFactor) + ", " + (height/2-levelFactor) + ")");
				}

				var axis = g.selectAll(".axis")
					.data(allAxis, function(d) { return (d && d.value) || d3.select(this).attr("id");});
				axis.exit().remove();
				var transAxis = axis.transition().duration(750);
				transAxis.select("line")
					.attr("x2", function(d, i){return width/2*(1-Math.sin(i*radians/allAxis.length));})
					.attr("y2", function(d, i){return height/2*(1-Math.cos(i*radians/allAxis.length));});
				transAxis.select("text")
					.text(function(d){return d.display})
					.attr("x", function(d, i){return width/2*(1-Math.sin(i*radians/allAxis.length)) - 10*Math.sin(i*radians/allAxis.length);})
					.attr("y", function(d, i){return height/2*(1-Math.cos(i*radians/allAxis.length)) - 20*Math.cos(i*radians/allAxis.length);});
				var enter = axis.enter()
					.append("g")
					.attr("class", "axis")
					.attr("id", function(d,i){return "axis" + d.value;});

				enter.append("line")
					.attr("x1", width/2)
					.attr("y1", height/2)
					.attr("x2", function(d, i){return width/2*(1-Math.sin(i*radians/allAxis.length));})
					.attr("y2", function(d, i){return height/2*(1-Math.cos(i*radians/allAxis.length));})
					.attr("class", "line class");

				enter.append("text")
					.attr("class", "legend")
					.text(function(d){return d.display})
					.attr("text-anchor", "middle")
					.attr("dy", "1.5em")
					.attr("transform", function(d, i){
						if(i === 0){
                            return "translate(0, -10)";
						}
						return "translate(0, -15)";})//TODO: remove and figure out what's going on here
					.attr("x", function(d, i){return width/2*(1-Math.sin(i*radians/allAxis.length)) - 10*Math.sin(i*radians/allAxis.length);})
					.attr("y", function(d, i){return height/2*(1-Math.cos(i*radians/allAxis.length)) - 20*Math.cos(i*radians/allAxis.length);});

				var dataValues = [];
				dataArr.forEach(function(j, i){
					dataValues.push([
						x(j,i), y(j,i)
					]);
				});
				dataValues.push(dataValues[0]); //complete the polygon

				var area = g.selectAll(".area")
					.data([dataValues]);
				area.exit().remove();
				var transArea = area.transition().duration(750);
				transArea.attr("points", function (d) {
					var str = "";
					for (var pti = 0; pti < d.length; pti++) {
						str = str + d[pti][0] + "," + d[pti][1] + " ";
					}
					return str;
				});
				area.enter()
					.append("polygon")
					.attr("class", "area")
					.attr("points", function (d) {
						var str = "";
						for (var pti = 0; pti < d.length; pti++) {
							str = str + d[pti][0] + "," + d[pti][1] + " ";
						}
						return str;
					});
				var nodes = g.selectAll(".nodes").data(dataArr, function(d) { return (d && d.axis) || d3.select(this).attr("id");}); //TODO: do data function to check on axisValue
				nodes.exit().remove();
				var transNodes = nodes.transition().duration(750);
				transNodes.attr("alt", function (j) {
						return Math.max(j.value, 0)
					})
					.attr("cx", function (j, i) {
						return x(j,i);
					})
					.attr("cy", function (j, i) {
						return y(j,i);
					})
					.select("title")
					.text(function (j) {
						return Math.max(j.value, 0)
					});
				nodes.enter()
					.append("svg:circle")
					.attr("class", "nodes")
					.attr('r', circleRadius)
					.attr("alt", function (j) {
						return Math.max(j.value, 0)
					})
					.attr("cx", function (j, i) {
						return x(j,i);
					})
					.attr("cy", function (j, i) {
						return y(j,i);
					})
					.attr("data-id", function (j) {
						return j.axis
					})
					.attr("id", function(j,i){
						return "circle" + j.axis;
					})
					.on('mouseover', function (d) {
						tooltip.attr('x', parseFloat(d3.select(this).attr('cx')) - 10)
							.attr('y', parseFloat(d3.select(this).attr('cy')) - 5)
							.text(d.value)
							.transition(200)
							.style('opacity', 1);
					})
					.on('mouseout', function () {
						tooltip
							.transition(200)
							.style('opacity', 0);
					})
					.append("svg:title")
					.text(function (j) {
						return Math.max(j.value, 0)
					});
			};
		}
	}
}]);