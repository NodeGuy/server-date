'use strict';

var
	fs = require("fs"),
	express = require('express'),
	app = express(),
	server;

app.get("/ServerDate.js", function(req, res) {
	fs.readFile('../lib/ServerDate.js', 'utf8', function (err, data) {
		var now = Date.now();

		if (err)
			res.status(500);
		else {
			res.set("Cache-Control", "no-store");
			
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

app.get("/", function(req, res) {
	res.sendfile("index.html");
});

server = app.listen();
console.log("Open http://localhost:" + server.address().port + " in a browser.");
