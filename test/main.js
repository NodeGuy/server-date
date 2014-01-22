'use strict';

var
	fs = require("fs"),
	express = require('express'),
	app = express(),
	server;

app.use(express.static(__dirname + '/jasmine-standalone-2.0.0'));

app.get("/ServerDate.js", function(req, res) {
	fs.readFile(__dirname + '/../lib/ServerDate.js', 'utf8', function (err, data) {
		var now = Date.now();

		if (err)
			res.status(500);
		else {
			if (req.query.time) {
				res.set("Content-Type", "application/json");
				res.json(now);
			}
			else {
				res.set("Content-Type", "text/javascript");
				res.send(data + "(" + now + ");\n");
			}
		}
	});
});

server = app.listen();
console.log("Open http://localhost:" + server.address().port + " in a browser.");
