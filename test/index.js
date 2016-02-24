'use strict';

var
  assert = require('assert'),
	fs = require('fs'),
	express = require('express'),
  webdriverio = require('webdriverio');

describe("ServerDate", function () {
  var
    app, server, client;

  before(function (done) {
    app = express();
    app.use(express.static(__dirname + '/jasmine-standalone-2.0.0'));

    server = app.listen(8000, function () {
      client = webdriverio.remote({
        host: 'serverdate_client',
        desiredCapabilities: {browserName: 'chrome'}
      });

      client.init().then(function () {
        done();
      });
    });
  });

  after(function () {
    return client.end().then(function () {
      server.close();
    });
  });

  it("passes the client-side tests", function () {
    return client
      .url('http://serverdate_server:8000')
      .waitForVisible('//*[contains(@class, "bar")]')
      .getText('//*[@class="bar passed"]').then(function (text) {
        assert(/specs, 0 failures/.test(text));
      });
  });
});
