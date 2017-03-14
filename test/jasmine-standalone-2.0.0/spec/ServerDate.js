describe("ServerDate", function () {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 12000;

	describe("constructor", function () {
		it("returns a string when called without new", function () {
			expect(typeof(ServerDate())).toBe('string');
		});

		it("returns itself when called with new", function () {
		  expect(new ServerDate()).toBe(ServerDate);
		});

		it("parse is the same as Date.parse", function () {
			expect(ServerDate.parse).toBe(Date.parse);
		});

		it("UTC is the same as Date.UTC", function () {
			expect(ServerDate.UTC).toBe(Date.UTC);
		});

		it("now returns a number", function () {
			expect(typeof(ServerDate.now())).toBe('number');
		});
	});

	describe("immutable methods return the same type as their Date counterparts",
	  function () {
	  var
	    date;

	  date = new Date();

    ['toString', 'toDateString', 'toTimeString', 'toLocaleString',
      'toLocaleDateString', 'toLocaleTimeString', 'valueOf', 'getTime',
      'getFullYear', 'getUTCFullYear', 'getMonth', 'getUTCMonth', 'getDate',
      'getUTCDate', 'getDay', 'getUTCDay', 'getHours', 'getUTCHours',
      'getMinutes', 'getUTCMinutes', 'getSeconds', 'getUTCSeconds',
      'getMilliseconds', 'getUTCMilliseconds', 'getTimezoneOffset', 'toUTCString',
      'toISOString', 'toJSON']
      .forEach(function (method) {
        it(method, function () {
          expect(typeof(ServerDate[method]())).toBe(typeof(date[method]()));
        });
      });
  });

  describe("mutable Date methods are undefined", function () {
    ['setDate', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes',
      'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear',
      'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth',
      'setUTCSeconds', 'setYear']
      .forEach(function (method) {
        it(method, function () {
          expect(ServerDate[method]).toBe(undefined);
        });
      });
  });

  describe("additional methods not found in Date", function () {
    it("sync() manually triggers a synchronization which fires a callback when completed", function (done) {
      ServerDate.sync(function(success, newTarget, oldTarget) {
        expect(typeof success).toBe('boolean');
        expect(typeof newTarget).toBe('object');
        expect(typeof newTarget.precision).toBe('number');
        expect(typeof newTarget.value).toBe('number');
        expect(typeof oldTarget).toBe('object');
        expect(typeof oldTarget.precision).toBe('number');
        expect(typeof oldTarget.value).toBe('number');
        done();
      });
    });

    it("on() binds a synchronization callback listener", function (done) {
      ServerDate.on(function(success, newTarget, oldTarget) {
        expect(success).toBe(true);
        ServerDate.off();
        done();
      });
      ServerDate.sync();
    });

    it("off() removes the synchronization callback listener", function (done) {
      var cb = function(success, newTarget, oldTarget) {
        //If this fires, we auto-fail
        if (cb) {
          console.log(cb);
          cb = undefined;
          expect(1).toBe(2);
          done();
        }
      };
      ServerDate.on(cb);
      ServerDate.off(cb);
      ServerDate.sync();
      setTimeout(function() {
        if (cb) {
          cb = undefined;
          expect(1).toBe(1);
          done();
        }
      }, 10000);
    });

    it("getPrecision() returns a number", function () {
      expect(typeof(ServerDate.getPrecision())).toBe('number');
    });
  });

  describe("additional properties not found in Date", function () {
    it("amortizationRate default is 25 ms", function () {
      expect(ServerDate.amortizationRate).toBe(25);
    });

    it("amortizationThreshold default is 2000 ms", function () {
      expect(ServerDate.amortizationThreshold).toBe(2000);
    });

    it("synchronizationIntervalDelay default is 1 hour", function () {
      expect(ServerDate.synchronizationIntervalDelay).toBe(60 * 60 * 1000);
    });
  });
});
