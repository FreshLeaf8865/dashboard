function checkUnique(arr) {
	var hash = {}, result = [];
	for (let i = 0, l = arr.length; i < l; ++i) {
		if (!hash.hasOwnProperty(arr[i])) {
			hash[ arr[i] ] = true;
			result.push(arr[i]);
		}
	}
	return result;
}

function getCounts(arr) {
	var i = arr.length, obj = {};
	while (i) obj[arr[--i]] = (obj[arr[i]] || 0) + 1;
	return obj;
}

function getCount(word, arr) {
	return getCounts(arr)[word] || 0;
}

// sort json array by key
function sortByKey(array, key) {
	return array.sort(function(a, b) {
		var x = a[key];
		var y = b[key];
		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	});
}

var getRooms = function(data) {
	let tempRooms = [], rooms = []
	
	let opnumber = 0
	let eventCode = ''
	const roomSep = ['INPR', 'INAN', 'INTH', 'RECA', 'REC1', 'REC2']
	
	for (let i in data) {
		if (opnumber !== data[i].OPNumber) {
			opnumber = data[i].OPNumber
	
			tempRooms[opnumber] = {
				INPR: [], // 'INPR'
				INAN: [], // 'INAN'
				INTH: [],	// 'INTH'
				RECA: [], // 'RECA'
				REC1: [], // 'REC1'
				REC2: [] // 'REC2'
			}

			eventCode = ''
		}

		if (roomSep.includes(data[i].EVENTCODE)) {
			eventCode = data[i].EVENTCODE
		}

		if (eventCode !== '') {
			tempRooms[opnumber][eventCode].push(data[i])
		}
	}

	for (let i in tempRooms) {
		rooms[i] = []

		for (let j in roomSep) {
			if (tempRooms[i][roomSep[j]].length != 0) {
				rooms[i].push({roomCode: roomSep[j], events: tempRooms[i][roomSep[j]]})
			}
		}
	}
	
	return rooms
}

var margin = {
	top : 40,
	right : 40,
	bottom : 20,
	left : 40
}

d3.csv("/csv/operations.csv", function(operations) {
	d3.csv("/csv/events.csv", function(events) {
		var w = document.body.clientWidth - margin.left - margin.right
		var h = operations.length * 24 + 180

		var svg = d3.selectAll(".svg")
								.append("svg")
								.attr("width", w)
								.attr("height", h)

		// operations = sortByKey(operations, 'USAGE');
		var today = new Date();

		var timeDomainStart = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 07:48:00");
		var timeDomainEnd = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 21:48:00");
		var x = d3.time.scale().domain([timeDomainStart, timeDomainEnd]).range([0, w]).clamp(true);
		var usages = [];

		for (let i = 0; i < operations.length; i++) {
			usages.push(operations[i].USAGE);
		}

		var usagesUnfiltered = usages;

		usages = checkUnique(usages);

		let rooms = getRooms(events)

		makeGant(operations, rooms, w, h);

		var title = svg.append("text")
									.text("Real-Time Theatre Dashboard")
									.attr("x", w / 2)
									.attr("y", 25)
									.attr("text-anchor", "middle")
									.attr("font-size", 18)
									.attr("fill", "#009FFC");

		function makeGant(operations, rooms, pageWidth, pageHeight) {
			var barHeight = 20;
			var gap = barHeight + 4;
			var topPadding = 75;
			var sidePadding = 65;

			var colorScale = d3.scale.linear()
												.domain([0, usages.length])
												.range(["#00B9FA", "#F95002"])
												.interpolate(d3.interpolateHcl);

			makeGrid(sidePadding, topPadding, pageWidth, pageHeight);
			drawRects(operations, rooms, gap, topPadding, sidePadding, barHeight, colorScale, pageWidth, pageHeight);
			vertLabels(gap, topPadding, sidePadding, barHeight, colorScale);
		}

		function drawRects(operations, rooms, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w, h) {
			var bigRects = svg.append("g")
												.selectAll("rect")
											 	.data(operations)
											 	.enter()
											 	.append("rect")
											 	.attr("x", 0)
											 	.attr("y", function(d, i) {
													return i * theGap + theTopPad - 2;
												})
											 	.attr("width", function(d) {
													return w;
											 	})
											 	.attr("height", theGap)
											 	.attr("stroke", "none")
											 	.attr("fill", function(d){
													for (let i = 0; i < usages.length; i++) {
														if (d.USAGE == usages[i]) {
															return d3.rgb(theColorScale(i % 2));
														}
													}
											 	})
											 	.attr("opacity", 0.2);

			var rectRooms = svg.append('g').selectAll("rect")

			for (let i in operations) {
				if (typeof rooms[operations[i].OPNUMBER] !== 'undefined') {
					var yPosition = i * theGap + theTopPad

					var rectRoom = rectRooms.data(rooms[operations[i].OPNUMBER]).enter()
																	.append("rect")
																	.attr("rx", 3)
																	.attr("ry", 3)
																	.attr("x", function(d) {
																		var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
																		return x(barStartTime) + theSidePad
																	})
																	.attr("y", yPosition)
																	.attr("width", function(d) {
																		var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
																		var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[d.events.length - 1].EVENTTIME)
																		return x(barEndTime) - x(barStartTime)
																	})
																	.attr("height", theBarHeight)
																	.attr("stroke", "none")
																	.attr("class", function(d) {
																		return d.roomCode
																	})

					var output = document.getElementById("tooltip")

					rectRoom.on('mouseover', function(d) {
						var	tooltip = "<p>OPNumber: " + operations[i].OPNUMBER + '</p><p style="margin-top: 10px;">Events</p><br>'

						for (let i in d.events) {
							tooltip += '<p>' + d.events[i].EVENTCODE + ': ' + d.events[i].EVENTTIME + '</p>'
						}

						output.innerHTML = tooltip;
						output.style.display = "block";
					})
					.on('mousemove', function(d) {
						output.style.top = (d3.event.layerY + 10) + 'px'
						output.style.left = (d3.event.layerX - 25) + 'px'
					})
					.on('mouseout', function() {
						output.style.display = "none";
					});
				}
			}

			svg.append('g').append("line")
										.attr("x1", function() {
											return x(today) + theSidePad
										})
										.attr("x2", function() {
											return x(today) + theSidePad
										})
										.attr("y1", 45)
										.attr("y2", h - 50)
										.attr("style", "stroke:rgb(255,0,0);stroke-width:1")

			// var rectangles = svg.append('g')
			// 										.selectAll("rect")
			// 										.data(operations)
			// 										.enter();

			// var innerRects = rectangles.append("rect")
			// 													.attr("rx", 3)
			// 													.attr("ry", 3)
			// 													.attr("x", function(d) {
			// 														return x(d.STARTTIME) + theSidePad;
			// 													})
			// 													.attr("y", function(d, i) {
			// 														return i * theGap + theTopPad;
			// 													})
			// 													.attr("width", function(d) {
			// 														return (x(d.ENDTIME) - x(d.STARTTIME));
			// 													})
			// 													.attr("height", theBarHeight)
			// 													.attr("stroke", "none")
			// 													.attr("fill", function(d) {
			// 														for (let i = 0; i < usages.length; i++) {
			// 															if (d.USAGE == usages[i]) {
			// 																return d3.rgb(theColorScale(i));
			// 															}
			// 														}
			// 													});

			// var rectText = rectangles.append("text")
			// 												.text(function(d) {
			// 													return d.OPNUMBER;
			// 												})
			// 												.attr("x", function(d) {
			// 													return (x(d.ENDTIME) - x(d.STARTTIME)) / 2 + x(d.STARTTIME) + theSidePad;
			// 												})
			// 												.attr("y", function(d, i) {
			// 													return i * theGap + 14 + theTopPad;
			// 												})
			// 												.attr("font-size", 11)
			// 												.attr("text-anchor", "middle")
			// 												.attr("text-height", theBarHeight)
			// 												.attr("fill", "#fff");

			// rectText.on('mouseover', function(e) {
			// 	var tag = "";

			// 	if (d3.select(this).data()[0].details != undefined) {
			// 		tag = "OPNUMBER: " + d3.select(this).data()[0].OPNUMBER + "<br/>" + 
			// 					"USAGE: " + d3.select(this).data()[0].USAGE + "<br/>" + 
			// 					"Starts: " + d3.select(this).data()[0].STARTTIME + "<br/>" + 
			// 					"Ends: " + d3.select(this).data()[0].ENDTIME + "<br/>" + 
			// 					"Details: " + d3.select(this).data()[0].details;
			// 	} else {
			// 		tag = "OPNUMBER: " + d3.select(this).data()[0].OPNUMBER + "<br/>" + 
			// 					"USAGE: " + d3.select(this).data()[0].USAGE + "<br/>" + 
			// 					"Starts: " + d3.select(this).data()[0].STARTTIME + "<br/>" + 
			// 					"Ends: " + d3.select(this).data()[0].ENDTIME;
			// 	}

			// 	var output = document.getElementById("tag");
			// 	var x = this.x.animVal.getItem(this) + "px";
			// 	var y = this.y.animVal.getItem(this) + 25 + "px";

			// 	output.innerHTML = tag;
			// 	output.style.top = y;
			// 	output.style.left = x;
			// 	output.style.display = "block";
			// })
			// .on('mouseout', function() {
			// 	var output = document.getElementById("tag");
			// 	output.style.display = "none";
			// });

			// innerRects.on('mouseover', function(e) {
			// 	var tag = "";

			// 	if (d3.select(this).data()[0].details != undefined) {
			// 		tag = "OPNUMBER: " + d3.select(this).data()[0].OPNUMBER + "<br/>" + 
			// 					"USAGE: " + d3.select(this).data()[0].USAGE + "<br/>" + 
			// 					"Starts: " + d3.select(this).data()[0].STARTTIME + "<br/>" + 
			// 					"Ends: " + d3.select(this).data()[0].ENDTIME + "<br/>" + 
			// 					"Details: " + d3.select(this).data()[0].details;
			// 	} else {
			// 		tag = "OPNUMBER: " + d3.select(this).data()[0].OPNUMBER + "<br/>" + 
			// 					"USAGE: " + d3.select(this).data()[0].USAGE + "<br/>" + 
			// 					"Starts: " + d3.select(this).data()[0].STARTTIME + "<br/>" + 
			// 					"Ends: " + d3.select(this).data()[0].ENDTIME;
			// 	}

			// 	var output = document.getElementById("tag");
			// 	var x = (this.x.animVal.value + this.width.animVal.value / 2) + "px";
			// 	var y = this.y.animVal.value + 25 + "px";

			// 	output.innerHTML = tag;
			// 	output.style.top = y;
			// 	output.style.left = x;
			// 	output.style.display = "block";
			// })
			// .on('mouseout', function() {
			// 	var output = document.getElementById("tag");
			// 	output.style.display = "none";
			// });
		}

		function makeGrid(theSidePad, theTopPad, w, h) {
			var xAxis = d3.svg.axis()
										.scale(x)
										.orient('bottom')
										.tickSize(-h + theTopPad + 20, 0, 0)
										.tickFormat(d3.time.format('%H:%M'));

			var grid = svg.append('g')
										.attr('class', 'grid')
										.attr('transform', 'translate(' + theSidePad + ', ' + (h - 50) + ')')
										.call(xAxis)
										.selectAll("text")
										.style("text-anchor", "middle")
										.attr("fill", "#000")
										.attr("stroke", "none")
										.attr("font-size", 10)
										.attr("dy", "1em");
		}

		function vertLabels(theGap, theTopPad, theSidePad, theBarHeight, theColorScale) {
			var numOccurances = [];
			var prevGap = 0;

			for (let i = 0; i < usages.length; i++) {
				numOccurances[i] = [usages[i], getCount(usages[i], usagesUnfiltered)];
			}

			var axisText = svg.append("g")
												.selectAll("text")
												.data(numOccurances)
												.enter()
												.append("text")
												.text(function(d) {
													return d[0];
												})
												.attr("x", 10)
												.attr("y", function(d, i) {
													if (i > 0) {
														for (let j = 0; j < i; j++) {
															prevGap += numOccurances[i - 1][1];
															return d[1] * theGap / 2 + prevGap * theGap + theTopPad;
														}
													} else {
														return d[1] * theGap / 2 + theTopPad;
													}
												})
												.attr("font-size", 11)
												.attr("text-anchor", "start")
												.attr("text-height", 14)
												.attr("fill", function(d) {
													for (let i = 0; i < usages.length; i++) {
														if (d[0] == usages[i]) {
															return d3.rgb(theColorScale(i)).darker();
														}
													}
												});

		}
	});
});

timer = setInterval(function() {
	d3.csv("/csv/operations.csv", function(operations) {
		d3.csv("/csv/events.csv", function(events) {
			var w = document.body.clientWidth - margin.left - margin.right
			var h = operations.length * 24 + 180

			d3.select("svg").remove()

			var svg = d3.selectAll(".svg")
									.append("svg")
									.attr("width", w)
									.attr("height", h)

			var today = new Date();

			var timeDomainStart = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 07:48:00");
			var timeDomainEnd = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 21:48:00");
			var x = d3.time.scale().domain([timeDomainStart, timeDomainEnd]).range([0, w]).clamp(true);
			var usages = [];

			for (let i = 0; i < operations.length; i++) {
				usages.push(operations[i].USAGE);
			}

			var usagesUnfiltered = usages;

			usages = checkUnique(usages);

			let rooms = getRooms(events)

			makeGant(operations, rooms, w, h);

			var title = svg.append("text")
										.text("Real-Time Theatre Dashboard")
										.attr("x", w / 2)
										.attr("y", 25)
										.attr("text-anchor", "middle")
										.attr("font-size", 18)
										.attr("fill", "#009FFC");

			function makeGant(operations, rooms, pageWidth, pageHeight) {
				var barHeight = 20;
				var gap = barHeight + 4;
				var topPadding = 75;
				var sidePadding = 65;

				var colorScale = d3.scale.linear()
													.domain([0, usages.length])
													.range(["#00B9FA", "#F95002"])
													.interpolate(d3.interpolateHcl);

				makeGrid(sidePadding, topPadding, pageWidth, pageHeight);
				drawRects(operations, rooms, gap, topPadding, sidePadding, barHeight, colorScale, pageWidth, pageHeight);
				vertLabels(gap, topPadding, sidePadding, barHeight, colorScale);
			}

			function drawRects(operations, rooms, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w, h) {
				var bigRects = svg.append("g")
													.selectAll("rect")
												 	.data(operations)
												 	.enter()
												 	.append("rect")
												 	.attr("x", 0)
												 	.attr("y", function(d, i) {
														return i * theGap + theTopPad - 2;
													})
												 	.attr("width", function(d) {
														return w;
												 	})
												 	.attr("height", theGap)
												 	.attr("stroke", "none")
												 	.attr("fill", function(d){
														for (let i = 0; i < usages.length; i++) {
															if (d.USAGE == usages[i]) {
																return d3.rgb(theColorScale(i % 2));
															}
														}
												 	})
												 	.attr("opacity", 0.2);

				var rectRooms = svg.append('g').selectAll("rect")

				for (let i in operations) {
					if (typeof rooms[operations[i].OPNUMBER] !== 'undefined') {
						var yPosition = i * theGap + theTopPad

						var rectRoom = rectRooms.data(rooms[operations[i].OPNUMBER]).enter()
																		.append("rect")
																		.attr("rx", 3)
																		.attr("ry", 3)
																		.attr("x", function(d) {
																			var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
																			return x(barStartTime) + theSidePad
																		})
																		.attr("y", yPosition)
																		.attr("width", function(d) {
																			var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
																			var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[d.events.length - 1].EVENTTIME)
																			return x(barEndTime) - x(barStartTime)
																		})
																		.attr("height", theBarHeight)
																		.attr("stroke", "none")
																		.attr("class", function(d) {
																			return d.roomCode
																		})

						var output = document.getElementById("tooltip")

						rectRoom.on('mouseover', function(d) {
							var	tooltip = "<p>OPNumber: " + operations[i].OPNUMBER + '</p><p style="margin-top: 10px;">Events</p><br>'

							for (let i in d.events) {
								tooltip += '<p>' + d.events[i].EVENTCODE + ': ' + d.events[i].EVENTTIME + '</p>'
							}

							output.innerHTML = tooltip;
							output.style.display = "block";
						})
						.on('mousemove', function(d) {
							output.style.top = (d3.event.layerY + 10) + 'px'
							output.style.left = (d3.event.layerX - 25) + 'px'
						})
						.on('mouseout', function() {
							output.style.display = "none";
						});
					}
				}

				svg.append('g').append("line")
											.attr("x1", function() {
												return x(today) + theSidePad
											})
											.attr("x2", function() {
												return x(today) + theSidePad
											})
											.attr("y1", 45)
											.attr("y2", h - 50)
											.attr("style", "stroke:rgb(255,0,0);stroke-width:1")
			}

			function makeGrid(theSidePad, theTopPad, w, h) {
				var xAxis = d3.svg.axis()
											.scale(x)
											.orient('bottom')
											.tickSize(-h + theTopPad + 20, 0, 0)
											.tickFormat(d3.time.format('%H:%M'));

				var grid = svg.append('g')
											.attr('class', 'grid')
											.attr('transform', 'translate(' + theSidePad + ', ' + (h - 50) + ')')
											.call(xAxis)
											.selectAll("text")
											.style("text-anchor", "middle")
											.attr("fill", "#000")
											.attr("stroke", "none")
											.attr("font-size", 10)
											.attr("dy", "1em");
			}

			function vertLabels(theGap, theTopPad, theSidePad, theBarHeight, theColorScale) {
				var numOccurances = [];
				var prevGap = 0;

				for (let i = 0; i < usages.length; i++) {
					numOccurances[i] = [usages[i], getCount(usages[i], usagesUnfiltered)];
				}

				var axisText = svg.append("g")
													.selectAll("text")
													.data(numOccurances)
													.enter()
													.append("text")
													.text(function(d) {
														return d[0];
													})
													.attr("x", 10)
													.attr("y", function(d, i) {
														if (i > 0) {
															for (let j = 0; j < i; j++) {
																prevGap += numOccurances[i - 1][1];
																return d[1] * theGap / 2 + prevGap * theGap + theTopPad;
															}
														} else {
															return d[1] * theGap / 2 + theTopPad;
														}
													})
													.attr("font-size", 11)
													.attr("text-anchor", "start")
													.attr("text-height", 14)
													.attr("fill", function(d) {
														for (let i = 0; i < usages.length; i++) {
															if (d[0] == usages[i]) {
																return d3.rgb(theColorScale(i)).darker();
															}
														}
													});

			}
		});
	});
}, 30000)