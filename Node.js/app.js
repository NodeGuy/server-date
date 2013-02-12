var fs = require("fs"),
    express = require('express'),
    app = express();

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

app.listen(3000);
console.log('Listening on port 3000');
