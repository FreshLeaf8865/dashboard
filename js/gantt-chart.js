
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
		return d['Last Status'] + d.endDate + d.sessionName + d.startDate;
	};

	var iconKeyFunction = function(d) {
		return d.startDate + d.sessionName + d.endDate + d['Last Status'];
	};

	var rectTransform = function(d) {
		return "translate(" + x(d.startDate) + "," + y(d.sessionName) + ")";
	};

	var iconTransform = function(d) {
		return "translate(" + (x(d.startDate) - 10) + "," + y(d.sessionName) + ")";
	};

	var iconImage = function(d) {
		var icon = 'check';

		switch (d['Last Status']) {
			case 'started on time':
				icon = 'check';
				break;
			case 'started late':
				icon = 'clock';
				break;
			case 'expected overrun':
				icon = 'arrow';
				break;
			case 'canceled':
				icon = 'cancel';
				break;
			default:
				break;
		}

		return 'image/' + icon + '.png';
	};

	var x = d3.time.scale().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);

	var y = d3.scale.ordinal().domain(sessionTypes).rangeRoundBands([ 0, height - margin.top - margin.bottom ], .1);
	
	var xAxisTop = d3.svg.axis().scale(x).orient("top").tickFormat(d3.time.format(tickFormat)).tickSubdivide(true).tickSize(4).tickPadding(8);

	var xAxisBottom = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format(tickFormat)).tickSubdivide(true).tickSize(4).tickPadding(8);

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
		xAxisTop = d3.svg.axis().scale(x).orient("top").tickFormat(d3.time.format(tickFormat)).tickSubdivide(true).tickSize(4).tickPadding(8);
		xAxisBottom = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format(tickFormat)).tickSubdivide(true).tickSize(4).tickPadding(8);
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
				 if (sessionStatus[d.status] == null) { return "bar"; }
				 return sessionStatus[d.status];
			 })
			 .attr("y", 0)
			 .attr("transform", rectTransform)
			 .attr("height", function(d) { return y.rangeBand(); })
			 .attr("width", function(d) {
			 		return (x(d.endDate) - x(d.startDate));
			 });

		svg.selectAll(".chart")
			 .data(sessions, iconKeyFunction).enter()
			 .append("image")
			 .attr("xlink:href", iconImage)
			 .attr("y", 0)
			 .attr("transform", iconTransform)
			 .attr("width", "20")
			 .attr("height", function(d) { return y.rangeBand(); });

		var tooltip = d3.select("body")
										.append('div')
										.attr('class', 'tooltip');

		tooltip.append('div').attr('class', 'description');
		tooltip.append('div').attr('class', 'consultant');
		tooltip.append('div').attr('class', 'estimated-time');
		tooltip.append('div').attr('class', 'event-desc');

		svg.selectAll(".bar, .bar-completed, .bar-booked")
			.on('mouseover', function(d) {
				tooltip.select('.description').html(d.Description);
				tooltip.select('.consultant').html(d.consultant);
				tooltip.select('.estimated-time').html(d['Estimated Time']);
				tooltip.select('.event-desc').html(d['Event Desc']);

				tooltip.style('display', 'block');
				tooltip.style('opacity', 2);
			})
			.on('mousemove', function(d) {
				tooltip.style('top', (d3.event.layerY + 10) + 'px')
							.style('left', (d3.event.layerX - 25) + 'px');
			})
			.on('mouseout', function() {
				tooltip.style('display', 'none');
				tooltip.style('opacity', 0);
			});

		// var slider = svg.append("rect")
		// 	 .attr("class", "extent")
		// 	 .attr("y", -5)
		// 	 .attr("transform", function() {
		// 	 		return "translate(" + x(today) + ", 0)";
		// 	 })
		// 	 .attr("width", "0");

		// if (today > timeDomainStart && today < timeDomainEnd) {
		// 	slider.attr("width", "1");
		// }

		// timer = setInterval(step, 1000);

		// function step() {
		// 	var now = new Date();

		// 	if (now > timeDomainStart && now < timeDomainEnd) {
		// 		slider.attr("width", "1");
		// 	} else {
		// 		slider.attr("width", "0");
		// 	}

		// 	slider.attr("transform", function() {
		//  		return "translate(" + x(now) + ", 0)";
		//  	});
		// }
 
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0, 0)")
			.transition()
			.call(xAxisTop);

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0, " + (height - margin.top - margin.bottom) + ")")
			.transition()
			.call(xAxisBottom);

		svg.append("g").attr("class", "y axis").transition().call(yAxis);

		// Lines
		// var line = svg.append("g")
		// 	.selectAll("line")
		 //	.data(x.ticks(20))
			// .enter().append("line")
		 //	.attr("x1", x)
		 //	.attr("x2", x)
		 //	.attr("y1", 500 + 30)
		 //	.attr("y2", 200-50)
		 //	.style("stroke", "blue");

		return gantt;
	};
	
	gantt.redraw = function(sessions) {

		initTimeDomain();
		initAxis();

		var svg = d3.select("svg");

		var ganttChartGroup = svg.select(".gantt-chart");
		var rect = ganttChartGroup.selectAll("rect").data(sessions, keyFunction);
		var icon = ganttChartGroup.selectAll("image").data(sessions, iconKeyFunction);

		icon.enter()
				.insert("image", ":first-child")
				.transition()
				.attr("xlink:href", iconImage)
			 	.attr("y", 0)
			 	.attr("transform", iconTransform)
			 	.attr("width", "20")
			 	.attr("height", function(d) { return y.rangeBand(); });

		rect.enter()
				.insert("rect", ":first-child")
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
			
		rect.exit().remove();
		icon.exit().remove();

		svg.select(".x").transition().call(xAxisTop);
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