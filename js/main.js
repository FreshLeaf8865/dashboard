var checkUnique = function(arr) {
	var hash = {}, result = []
	for (let i = 0, l = arr.length; i < l; ++i) {
		if (!hash.hasOwnProperty(arr[i])) {
			hash[ arr[i] ] = true
			result.push(arr[i])
		}
	}
	return result
}

var getCounts = function(arr) {
	var i = arr.length, obj = {}
	while (i) obj[arr[--i]] = (obj[arr[i]] || 0) + 1
	return obj
}

var getCount = function(word, arr) {
	return getCounts(arr)[word] || 0
}

// sort json array by key
var sortByKey = function(array, key) {
	return array.sort(function(a, b) {
		var x = a[key]
		var y = b[key]
		return ((x < y) ? -1 : ((x > y) ? 1 : 0))
	})
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

var groupName = {
	Main: 'Main Theatres',
	DSU: 'Day Surgery Theatres',
	Manfield: 'Mansfield Theatres',
	Gynae: 'Gynae Theatres',
	Eyes: 'Eye Theatres',
	Sturtridge: 'Sturtridge Theatres',
	Endo: 'Endo Proc Theatres'
}

var margin = {
	top : 40,
	right : 40,
	bottom : 20,
	left : 40
}

var dashboard = function() {
	d3.csv("/csv/operations.csv", function(operations) {
		d3.csv("/csv/events.csv", function(events) {
			var barHeight = 20
			var gap = barHeight + 4
			var topPadding = 100
			var sidePadding = 75

			operations = sortByKey(operations, 'USAGE')

			let rooms = getRooms(events)

			var tempRooms = [], tempOperations = []

			for (let i in operations) {
				if (typeof rooms[operations[i].OPNUMBER] !== 'undefined' && rooms[operations[i].OPNUMBER].length != 0) {
					for (let j in rooms[operations[i].OPNUMBER]) {
						var room = rooms[operations[i].OPNUMBER][j]

						room.opNumber = operations[i].OPNUMBER
						room.usage = operations[i].USAGE

						tempRooms.push(room)
					}

					tempOperations.push(operations[i])
				}
			}

			rooms = tempRooms
			operations = tempOperations

			var operationusages = []
			var roomusages = []

			for (let i = 0; i < operations.length; i++) {
				operationusages.push(operations[i].USAGE)
			}

			for (let i = 0; i < rooms.length; i++) {
				roomusages.push(rooms[i].usage)
			}

			var operationusagesUnfiltered = operationusages
			var roomusagesUnfiltered = roomusages

			operationusages = checkUnique(operationusages)
			roomusages = checkUnique(roomusages)

			/******************************************************** Grouping ********************************************************************/

			var numOpOccurances = []
			var numRoomOccurances = []
			var prevGap = 0

			for (let i = 0; i < operationusages.length; i++) {
				numOpOccurances[i] = [operationusages[i], getCount(operationusages[i], operationusagesUnfiltered)]
			}

			for (let i = 0; i < roomusages.length; i++) {
				numRoomOccurances[i] = [roomusages[i], getCount(roomusages[i], roomusagesUnfiltered)]
			}

			var keysOfGroupName = Object.keys(groupName)
			var group = []
			var tempGroup = []

			for (let i in numOpOccurances) {
				for (let j in keysOfGroupName) {
					if (numOpOccurances[i][0].indexOf(keysOfGroupName[j]) !== -1) {
						group.push([keysOfGroupName[j], numOpOccurances[i][1], numRoomOccurances[i][1]])
						break
					}
				}
			}

			for (let i in group) {
				if (typeof tempGroup[group[i][0]] !== 'undefined') {
					tempGroup[group[i][0]][0] += group[i][1]
					tempGroup[group[i][0]][1] += group[i][2]
				} else {
					tempGroup[group[i][0]] = [group[i][1], group[i][2]]
				}
			}

			group = []

			var keysOfTempGroup = Object.keys(tempGroup)

			for (let i in keysOfTempGroup) {
				group[i] = [keysOfTempGroup[i], tempGroup[keysOfTempGroup[i]][0], tempGroup[keysOfTempGroup[i]][1]]
			}

			console.log(group)

			/*********************************************************************************************************************************************/

			/******************************************** Add empty record to operations for group title *************************************************/
			operations = []

			var currentKey = 0

			for (let i in group) {
				operations[parseInt(currentKey) + parseInt(i)] = {groupTitle: groupName[group[i][0]], USAGE: group[i][0]}

				for (let j = currentKey; j < currentKey + group[i][1]; j++) {
					operations[parseInt(j) + parseInt(i) + 1] = tempOperations[j]
				}

				currentKey += group[i][1]
			}

			console.log(operations)
			/*********************************************************************************************************************************************/

			/******************************************** Add empty record to rooms for group title *************************************************/
			rooms = []

			var currentKey = 0

			for (let i in group) {
				rooms[parseInt(currentKey) + parseInt(i)] = {groupTitle: groupName[group[i][0]], opNumber: 1}

				for (let j = currentKey; j < currentKey + group[i][2]; j++) {
					rooms[parseInt(j) + parseInt(i) + 1] = tempRooms[j]
				}

				currentKey += group[i][2]
			}

			console.log(rooms)
			/*********************************************************************************************************************************************/

			/******************************************** get numOpOccurances from operations including group title ***************************************/
			var operationusages = []

			for (let i = 0; i < operations.length; i++) {
				operationusages.push(operations[i].USAGE)
			}

			var operationusagesUnfiltered = operationusages

			operationusages = checkUnique(operationusages)

			var numOpOccurances = []

			for (let i = 0; i < operationusages.length; i++) {
				numOpOccurances[i] = [operationusages[i], getCount(operationusages[i], operationusagesUnfiltered)]
			}
			/*********************************************************************************************************************************************/

			var w = document.body.clientWidth - margin.left - margin.right
			var h = (operations.length) * gap + 180

			var today = new Date()

			var timeDomainStart = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 08:00:00")
			var timeDomainEnd = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 17:59:59")
			var timeDomainStart2 = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 00:00:00")
			var timeDomainEnd2 = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 23:59:59")
			var x = d3.time.scale().domain([timeDomainStart, timeDomainEnd]).range([0, w - sidePadding]).clamp(true)
			var x2 = d3.time.scale().domain([timeDomainStart2, timeDomainEnd2]).range([0, w - sidePadding]).clamp(true)

			d3.select("svg").remove()

			var svg = d3.selectAll(".svg")
									.append("svg")
									.attr("width", w)
									.attr("height", h + 100)

			/***************************************************************** title **********************************************************************/

			var title = svg.append("text")
										.text("Real-Time Theatre Dashboard")
										.attr("x", w / 2)
										.attr("y", 25)
										.attr("text-anchor", "middle")
										.attr("font-size", 18)
										.attr("fill", "#009FFC")

			/********************************************************************************************************************************************/

			/****************************************************************** vertlabels **************************************************************/
			var axisText = svg.append("g")
												.selectAll("text")
												.data(numOpOccurances)
												.enter()
												.append("text")
												.text(function(d) {
													if (groupName.hasOwnProperty(d[0])) {
														return groupName[d[0]]
													}
													return d[0]
												})
												.attr("x", 4)
												.attr("y", function(d, i) {
													if (i > 0) {
														for (let j = 0; j < i; j++) {
															prevGap += numOpOccurances[i - 1][1]
															return prevGap * gap + topPadding + 12
														}
													} else {
														return topPadding + 12
													}
												})
												.attr("font-size", function(d) {
													if (groupName.hasOwnProperty(d[0])) {
														return 12
													}
													return 11
												})
												.attr("text-anchor", "start")
												.attr("text-height", 14)
												.attr("font-weight", function(d) {
													if (groupName.hasOwnProperty(d[0])) {
														return "bold"
													}
												})

			/************************************************************************************************************************************************/

			/********************************************************************** make grids **************************************************************/
			var xAxisBottom = d3.svg.axis()
													.scale(x)
													.orient('bottom')
													.tickSize(-h + topPadding + 20, 0, 0)
													.tickFormat(d3.time.format('%H:%M'))

			var xAxisTop = d3.svg.axis()
											.scale(x)
											.orient('top')
											.tickSize(0, 0, 0)
											.tickFormat(d3.time.format('%H:%M'))
			
			svg.append('g')
				.attr('class', 'grid bottom')
				.attr('transform', 'translate(' + sidePadding + ', ' + (h - 50) + ')')
				.call(xAxisBottom)
				.selectAll("text")
				.style("text-anchor", "middle")
				.attr("fill", "#000")
				.attr("stroke", "none")
				.attr("font-size", 10)
				.attr("dy", "1em")

			svg.append('g')
				.attr('class', 'grid top')
				.attr('transform', 'translate(' + sidePadding + ', ' + (topPadding - 42) + ')')
				.call(xAxisTop)
				.selectAll("text")
				.style("text-anchor", "middle")
				.attr("fill", "#000")
				.attr("stroke", "none")
				.attr("font-size", 10)
				.attr("dy", "1em")

			/*********************************************************************************************************************************************/

			/*************************************************************** Draw Rects *****************************************************************/
			var bigRect = svg.append("g")
											.append("rect")
											.attr("x", 0)
											.attr("y", function(d) {
												return topPadding - 2
											})
											.attr("width", function(d) {
												return w
											})
											.attr("height", function(d) {
												return gap * (operations.length)
											})
											.attr("stroke", "#000")
											.attr("fill", "none")

			var numOpsOfPrevGrp = 0	// number of operations of previous group

			var groupRects = svg.append("g")
													.selectAll("rect")
													.data(group).enter()
													.append("rect")
													.attr("x", 0)
													.attr("y", function(d) {
														var y = numOpsOfPrevGrp * gap + topPadding - 2
														numOpsOfPrevGrp += d[1] + 1
														return y
													})
													.attr("width", function(d) {
														return w
													})
													.attr("height", function(d) {
														return gap * (d[1] + 1)
													})
													.attr("stroke", "#000")
													.attr("fill", "none")

			var rectOperations = svg.append("g")
															.attr("class", "operations")

			rectOperations.selectAll("rect")
										.data(operations)
										.enter()
										.append("rect")
										.attr("rx", 3)
										.attr("ry", 3)
										.attr("x", function(d) {
											if (typeof d.STARTTIME !== 'undefined') {
												var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
												return x(barStartTime) + sidePadding
											} else {
												return 0
											}
										})
										.attr("y", function(d, i) {
											return i * gap + topPadding
										})
										.attr("width", function(d) {
											if (typeof d.STARTTIME !== 'undefined') {
												var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
												var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.ENDTIME)
												return x(barEndTime) - x(barStartTime)
											} else {
												return 0
											}
										})
										.attr("height", barHeight)
										.attr("stroke", "none")
										.attr("fill", "red")
										.attr("opacity", 0.1)

			var rectRooms = svg.append('g').attr("class", "rooms")

			var i = -1, currentOpNumber = 0

			var rectRoom = rectRooms.selectAll("rect")
															.data(rooms).enter()
															.append("rect")
															.attr("rx", 3)
															.attr("ry", 3)
															.attr("x", function(d) {
																if (typeof d.roomCode !== 'undefined') {
																	var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
																	return x(barStartTime) + sidePadding
																} else {
																	return 0
																}
															})
															.attr("y", function(d) {
																if (currentOpNumber != d.opNumber) {
																	currentOpNumber = d.opNumber
																	i++
																}
																return i * gap + topPadding
															})
															.attr("width", function(d) {
																if (typeof d.roomCode !== 'undefined') {
																	var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
																	var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[d.events.length - 1].EVENTTIME)
																	return x(barEndTime) - x(barStartTime)
																} else {
																	return 0
																}
															})
															.attr("height", barHeight)
															.attr("stroke", "none")
															.attr("class", function(d) {
																if (typeof d.roomCode !== 'undefined') {
																	return d.roomCode
																}
															})

			var output = document.getElementById("tooltip")

			rectRoom.on('mouseover', function(d) {
				var	tooltip = "<p>Theatre-Operation ID: " + d.opNumber + ' - Consultant: ' + d.events[0].CONSULTANT + '</p><br>'

				for (let i in d.events) {
					tooltip += '<p>' + d.events[i].EVENTTIME + ' ' + d.events[i].EVENTDESC + ' (' + d.events[i].EVENTCODE + ')</p>'
				}

				output.innerHTML = tooltip
				output.style.display = "block"
				output.classList.add(d.roomCode)
			})
			.on('mousemove', function(d) {
				output.style.top = (d3.event.layerY + 10) + 'px'
				output.style.left = (d3.event.layerX - 25) + 'px'
			})
			.on('mouseout', function(d) {
				output.style.display = "none"
				output.classList.remove(d.roomCode)
			})

			var operationText = svg.append("g").attr("class", "operation-text")

			operationText.selectAll("text")
									.data(operations)
									.enter()
									.append("text")
									.text(function(d) {
										if (typeof d.STARTTIME !== 'undefined') {
											return d.STARTTIME + " - " + d.ENDTIME
										} else {
											return ''
										}
									})
									.attr("x", function(d) {
										if (typeof d.STARTTIME !== 'undefined') {
											var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
											var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.ENDTIME)
											return (x(barEndTime) - x(barStartTime)) / 2 + x(barStartTime) + sidePadding
										} else {
											return 0
										}
									})
									.attr("y", function(d, i) {
										return i * gap + 14 + topPadding
									})
									.attr("font-size", 11)
									.attr("text-anchor", "middle")
									.attr("text-height", barHeight)
									.attr("fill", "#000")

			var timeline = svg.append('g').append("line")
										.attr("x1", function() {
											return x(today) + sidePadding
										})
										.attr("x2", function() {
											return x(today) + sidePadding
										})
										.attr("y1", 70)
										.attr("y2", h - 50)
										.attr("style", "stroke:rgb(255,0,0);stroke-width:1")

			/*********************************************************************************************************************************************/

			/*************************************************************** draw slider context *********************************************************/
				var context = svg.append("g")
												.attr("class", "context")
												.attr("transform", "translate(" + 0 + "," + h + ")")

				var xAxis2 = d3.svg.axis()
													.scale(x2)
													.orient('bottom')
													.tickSize(3)
													.tickPadding(8)
													.tickFormat(d3.time.format('%H:%M'))

				var extentStartTime = new Date()
				var extentEndTime = new Date()

				extentStartTime.setHours(extentStartTime.getHours() - 4)
				extentEndTime.setHours(extentEndTime.getHours() + 4)

				var brush = d3.svg.brush().x(x2).extent([extentStartTime, extentEndTime]).on("brush", brushed)

				function brushed() {
					currentRange = (brush.empty()? undefined : brush.extent())
					x.domain(brush.empty() ? x2.domain() : brush.extent())

					svg.select(".grid.bottom")
						.call(xAxisBottom)
						.selectAll("text")
						.style("text-anchor", "middle")
						.attr("fill", "#000")
						.attr("stroke", "none")
						.attr("font-size", 10)
						.attr("dy", "1em")

					svg.select(".grid.top")
						.call(xAxisTop)
						.selectAll("text")
						.style("text-anchor", "middle")
						.attr("fill", "#000")
						.attr("stroke", "none")
						.attr("font-size", 10)
						.attr("dy", "1em")

					timeline.attr("x1", function() {
										return x(today) + sidePadding
									})
									.attr("x2", function() {
										return x(today) + sidePadding
									})

					rectOperations.selectAll("rect")
												.data(operations)
												.attr("x", function(d) {
													if (typeof d.STARTTIME !== 'undefined') {
														var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
														return x(barStartTime) + sidePadding
													} else {
														return 0
													}
												})
												.attr("width", function(d) {
													if (typeof d.STARTTIME !== 'undefined') {
														var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
														var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.ENDTIME)
														return x(barEndTime) - x(barStartTime)
													} else {
														return 0
													}
												})

					rectRooms.selectAll("rect")
									.data(rooms)
									.attr("x", function(d) {
										if (typeof d.roomCode !== 'undefined') {
											var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
											return x(barStartTime) + sidePadding
										} else {
											return 0
										}
									})
									.attr("width", function(d) {
										if (typeof d.roomCode !== 'undefined') {
											var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
											var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[d.events.length - 1].EVENTTIME)
											return x(barEndTime) - x(barStartTime)
										} else {
											return 0
										}
									})

					operationText.selectAll("text")
											.data(operations)
											.attr("x", function(d) {
												if (typeof d.STARTTIME !== 'undefined') {
													var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
													var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.ENDTIME)

													if ((x(barEndTime) - x(barStartTime)) / 2 + x(barStartTime) < 40) {
														return -1000
													}
													return (x(barEndTime) - x(barStartTime)) / 2 + x(barStartTime) + sidePadding
												} else {
													return 0
												}
											})
				}

				context.append("g")
							.attr("class", "axis axis--x")
							.attr("transform", "translate(" + sidePadding + "," + 30 + ")")
							.call(xAxis2)

				context.append("g")
							.attr("transform", "translate(" + sidePadding + "," + 0 + ")")
							.attr("class", "brush")
							.call(brush)
							.call(brush.event)
							.selectAll("rect")
							.attr("height", 60)

			/*********************************************************************************************************************************************/
		})
	})
}

dashboard()

setInterval(dashboard, 30000)