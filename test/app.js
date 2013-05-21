'use strict';

var assert = require('assert'),
    fs = require('fs'),
    http = require('http'),
    express = require('express'),
    webdriverjs = require('webdriverjs'),
    app = express(),
    client, server, query;

function testAccuracy(error, result) {
    var client, delta;

    assert.ifError(error);
    client = result.value;
    delta = Math.abs(Date.now() - client.now);

    console.log("Client's date differs from server's by " + delta
        + " ms (should be within " + client.precision + " ms).");

    assert(delta <= client.precision);
}

function close() {
    client.end();
    server.close();
}

app.get("/ServerDate.js", function(req, res){
    fs.readFile('../lib/ServerDate.js', 'utf8', function (err, data) {
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

app.get("/", function(req, res){
    res.sendfile("example.html");
});

server = http.createServer(app).listen(3000);
client = webdriverjs.remote();

query = [
    'return {',
    '    now: ServerDate.now(),',
    '    precision: ServerDate.getPrecision()',
    '};'
].join('\n');

client
    .init()
    .url('http://localhost:3000/')
    .execute(query, null, testAccuracy)
    .call(close);
