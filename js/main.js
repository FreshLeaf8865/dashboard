var sessions = [];
var sessionNames = [];
var sessionStatus = {
	"SUCCEEDED" : "bar",
	"FAILED" : "bar-failed",
	"RUNNING" : "bar-running",
	"KILLED" : "bar-killed"
};
var format = "%H:%M";
var today = new Date();

d3.csv("/csv/data.csv", function(data) {
	sessions = data;

	var flags = [];

	for (var i = 0; i < data.length; i++) {
		sessions[i].startDate = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + data[i]["Start Time"]);
		sessions[i].endDate = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + data[i]["End Time"]);
		sessions[i].status = "SUCCEEDED";
		sessions[i].sessionName = data[i].Usage;

		if (flags[data[i].Usage]) continue;
		flags[data[i].Usage] = true;
		sessionNames.push(data[i].Usage);
	}

	var gantt = d3.gantt().sessionTypes(sessionNames).sessionStatus(sessionStatus).tickFormat(format);
	gantt(sessions);
});