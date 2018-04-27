
d3.gantt = function() {
	var FIT_TIME_DOMAIN_MODE = "fit";
	var FIXED_TIME_DOMAIN_MODE = "fixed";
	
	var margin = {
		top : 40,
		right : 40,
		bottom : 20,
		left : 150
	};
	var timeDomainStart = d3.time.day.offset(new Date(), -3);
	var timeDomainEnd = d3.time.hour.offset(new Date(), +3);
	var timeDomainMode = FIT_TIME_DOMAIN_MODE;// fixed or fit
	var sessionTypes = [];
	var sessionStatus = [];
	var height = document.body.clientHeight - margin.top - margin.bottom - 5;
	var width = document.body.clientWidth - margin.right - margin.left - 5;
	var today = new Date();

	var tickFormat = "%H:%M";

	var keyFunction = function(d) {
		return d.startDate + d.sessionName + d.endDate;
	};

	var rectTransform = function(d) {
		return "translate(" + x(d.startDate) + "," + y(d.sessionName) + ")";
	};

	var x = d3.time.scale().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);

	var y = d3.scale.ordinal().domain(sessionTypes).rangeRoundBands([ 0, height - margin.top - margin.bottom ], .1);
	
	var xAxis = d3.svg.axis().scale(x).orient("top").tickFormat(d3.time.format(tickFormat)).tickSubdivide(true).tickSize(4).tickPadding(8);

	var yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0).tickPadding(12);

	var initTimeDomain = function() {
		if (timeDomainMode === FIT_TIME_DOMAIN_MODE) {
			if (sessions === undefined || sessions.length < 1) {
				timeDomainStart = d3.time.day.offset(new Date(), -3);
				timeDomainEnd = d3.time.hour.offset(new Date(), +3);
				return;
			}
			// sessions.sort(function(a, b) {
			// 	return a.endDate - b.endDate;
			// });
			// timeDomainEnd = sessions[sessions.length - 1].endDate;
			// sessions.sort(function(a, b) {
			// 	return a.startDate - b.startDate;
			// });
			// timeDomainStart = sessions[0].startDate;

			timeDomainStart = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 07:48:00");
			timeDomainEnd = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 21:48:00");
		}
	};

	var initAxis = function() {
		x = d3.time.scale().domain([timeDomainStart, timeDomainEnd]).range([0, width]).clamp(true);
		y = d3.scale.ordinal().domain(sessionTypes).rangeRoundBands([0, height - margin.top - margin.bottom], .5);
		xAxis = d3.svg.axis().scale(x).orient("top").tickFormat(d3.time.format(tickFormat)).tickSubdivide(true).tickSize(4).tickPadding(8);
		yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0).tickPadding(12);
	};
	
	function gantt(sessions) {

		initTimeDomain();
		initAxis();
		
		var svg = d3.select("body")
								.append("svg")
								.attr("class", "chart")
								.attr("width", width + margin.left + margin.right)
								.attr("height", height + margin.top + margin.bottom)
								.append("g")
								.attr("class", "gantt-chart")
								.attr("width", width + margin.left + margin.right)
								.attr("height", height + margin.top + margin.bottom)
								.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
		
		svg.selectAll(".chart")
			 .data(sessions, keyFunction).enter()
			 .append("rect")
			 .attr("rx", 3)
			 .attr("ry", 3)
			 .attr("class", function(d) { 
				 if (sessionStatus[d.status] == null){ return "bar";}
				 return sessionStatus[d.status];
			 })
			 .attr("y", 0)
			 .attr("transform", rectTransform)
			 .attr("height", function(d) { return y.rangeBand(); })
			 .attr("width", function(d) {
			 		return (x(d.endDate) - x(d.startDate));
			 });

		var slider = svg.append("rect")
			 .attr("class", "extent")
			 .attr("y", -5)
			 .attr("transform", function() {
			 		return "translate(" + x(today) + ", 0)";
			 })
			 .attr("height", "100%")
			 .attr("width", "1");

		timer = setInterval(step, 1000);

		function step() {
			slider.attr("transform", function() {
		 		return "translate(" + x(new Date()) + ", 0)";
		 	});
		}
 
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0, 0)")
			.transition()
			.call(xAxis);

		svg.append("g").attr("class", "y axis").transition().call(yAxis);

		// Lines
    // var line = svg.append("g")
    // 	.selectAll("line")
	   //  .data(x.ticks(10))
	  	// .enter().append("line")
	   //  .attr("x1", x)
	   //  .attr("x2", x)
	   //  .attr("y1", 500 + 30)
	   //  .attr("y2", 200-50)
	   //  .style("stroke", "#ccc");

		return gantt;
	};
	
	gantt.redraw = function(sessions) {

		initTimeDomain();
		initAxis();

		var svg = d3.select("svg");

		var ganttChartGroup = svg.select(".gantt-chart");
		var rect = ganttChartGroup.selectAll("rect").data(sessions, keyFunction);
		
		rect.enter()
				.insert("rect",":first-child")
				.attr("rx", 3)
				.attr("ry", 3)
				.attr("class", function(d) {
					if(sessionStatus[d.status] == null) { return "bar";}
					return sessionStatus[d.status];
				})
				.transition()
				.attr("y", 0)
				.attr("transform", rectTransform)
				.attr("height", function(d) { return y.rangeBand(); })
				.attr("width", function(d) {
					return (x(d.endDate) - x(d.startDate));
				});

		rect.transition()
				.attr("transform", rectTransform)
				.attr("height", function(d) { return y.rangeBand(); })
				.attr("width", function(d) {
					return (x(d.endDate) - x(d.startDate));
				});
			
		rect.exit().remove();

		svg.select(".x").transition().call(xAxis);
		svg.select(".y").transition().call(yAxis);

		return gantt;
	};

	gantt.margin = function(value) {
		if (!arguments.length)
			return margin;
		margin = value;
		return gantt;
	};

	gantt.timeDomain = function(value) {
		if (!arguments.length)
			return [ timeDomainStart, timeDomainEnd ];
		timeDomainStart = +value[0], timeDomainEnd = +value[1];
		return gantt;
	};

	/**
	 * @param {string}
	 *	vale The value can be "fit" - the domain fits the data or
	 *	"fixed" - fixed domain.
	 */
	gantt.timeDomainMode = function(value) {
		if (!arguments.length)
			return timeDomainMode;
		timeDomainMode = value;
		return gantt;
	};

	gantt.sessionTypes = function(value) {
		if (!arguments.length)
			return sessionTypes;
		sessionTypes = value;
		return gantt;
	};
	
	gantt.sessionStatus = function(value) {
		if (!arguments.length)
			return sessionStatus;
		sessionStatus = value;
		return gantt;
	};

	gantt.width = function(value) {
		if (!arguments.length)
			return width;
		width = +value;
		return gantt;
	};

	gantt.height = function(value) {
		if (!arguments.length)
			return height;
		height = +value;
		return gantt;
	};

	gantt.tickFormat = function(value) {
		if (!arguments.length)
			return tickFormat;
		tickFormat = value;
		return gantt;
	};
	
	return gantt;
};