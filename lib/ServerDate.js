/*

COPYRIGHT

Copyright 2012 David Braun

This file is part of ServerDate.

ServerDate is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ServerDate is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with ServerDate.  If not, see <http://www.gnu.org/licenses/>.

*/

'use strict';

var ServerDate = (function(serverNow) {
// This is the first time we align with the server's clock by using the time
// this script was generated (serverNow) and noticing the client time before
// and after the script was loaded.  This gives us a good estimation of the
// server's clock right away, which we later refine during synchronization.

var
  // Remember when the script was loaded.
  scriptLoadTime = Date.now(),

  // Remember the URL of this script so we can call it again during
  // synchronization.
  scripts = document.getElementsByTagName("script"),
  URL = scripts[scripts.length - 1].src,

  synchronizationIntervalDelay,
  synchronizationInterval,
  precision,
  offset,
  target = null,
  listeners = [],
  synchronizing = false;

// Everything is in the global function ServerDate.  Unlike Date, there is no
// need for a constructor because there aren't instances.

/// PUBLIC

// Emulate Date's methods.

function ServerDate() {
  // See http://stackoverflow.com/a/18543216/1330099.
  return this
    ? ServerDate
    : ServerDate.toString();
}

ServerDate.parse = Date.parse;
ServerDate.UTC = Date.UTC;

ServerDate.now = function() {
  return Date.now() + offset;
};

// Populate ServerDate with the methods of Date's instances that don't change
// state.

["toString", "toDateString", "toTimeString", "toLocaleString",
  "toLocaleDateString", "toLocaleTimeString", "valueOf", "getTime",
  "getFullYear", "getUTCFullYear", "getMonth", "getUTCMonth", "getDate",
  "getUTCDate", "getDay", "getUTCDay", "getHours", "getUTCHours",
  "getMinutes", "getUTCMinutes", "getSeconds", "getUTCSeconds",
  "getMilliseconds", "getUTCMilliseconds", "getTimezoneOffset", "toUTCString",
  "toISOString", "toJSON"]
  .forEach(function(method) {
    ServerDate[method] = function() {
      return new Date(ServerDate.now())[method]();
    };
  });

// Because of network delays we can't be 100% sure of the server's time.  We do
// know the precision in milliseconds and make it available here.
ServerDate.getPrecision = function() // ms
{
  if (typeof target.precision != "undefined")
    // Take into account the amortization.
    return target.precision + Math.abs(target - offset);
};

// Manually synchronize, and fire an optional callback when completed
ServerDate.sync = function(cb) {
  synchronize(cb);
};

// Bind a callback that fires whenever synchronization is complete
ServerDate.on = function(cb) {
  if (typeof cb === 'function') {
    listeners.push(cb);
  }
};

// Remove a bound listener, or all listeners if no argument is provided
ServerDate.off = function(cb) {
  if (!cb) {
    listeners = [];
  } else {
    if (typeof cb === 'function') {
      listeners = listeners.filter(function(v) {
        if (v === cb) {
          return false;
        }
        return true;
      });
    }
  }
};

// After a synchronization there may be a significant difference between our
// clock and the server's clock.  Rather than make the change abruptly, we
// change our clock by adjusting it once per second by the amortizationRate.
ServerDate.amortizationRate = 25; // ms

// The exception to the above is if the difference between the clock and
// server's clock is too great (threshold set below).  If that's the case then
// we skip amortization and set the clock to match the server's clock
// immediately.
ServerDate.amortizationThreshold = 2000; // ms

Object.defineProperty(ServerDate, "synchronizationIntervalDelay", {
  get: function() { return synchronizationIntervalDelay; },

  set: function(value) {
  synchronizationIntervalDelay = value;
  clearInterval(synchronizationInterval);

  synchronizationInterval = setInterval(synchronize,
    ServerDate.synchronizationIntervalDelay);

  log("Set synchronizationIntervalDelay to " + value + " ms.");
}});

// After the initial synchronization the two clocks may drift so we
// automatically synchronize again every synchronizationIntervalDelay.
ServerDate.synchronizationIntervalDelay = 60 * 60 * 1000; // ms

/// PRIVATE

// We need to work with precision as well as offset values, so bundle them
// together conveniently.
function Offset(value, precision) {
  this.value = value;
  this.precision = precision;
}

Offset.prototype.valueOf = function() {
  return this.value;
};

Offset.prototype.toString = function() {
  // The '±' character doesn't look right in Firefox's console for some
  // reason.
  return this.value + (typeof this.precision != "undefined"
    ? " +/- " + this.precision
    : "") + " ms";
};

// The target is the offset we'll get to over time after amortization.
function setTarget(newTarget) {
  var message = "Set target to " + String(newTarget),
    delta;

  if (target)
    message += " (" + (newTarget > target ? "+" : "-") + " "
      + Math.abs(newTarget - target) + " ms)";

  target = newTarget;
  log(message + ".");

  // If the target is too far off from the current offset (more than the
  // amortization threshold) then skip amortization.

  delta = Math.abs(target - offset);

  if (delta > ServerDate.amortizationThreshold) {
    log("Difference between target and offset too high (" + delta
      + " ms); skipping amortization.");

    offset = target;
  }
}

// Synchronize the ServerDate object with the server's clock.
function synchronize(cb) {
  var iteration = 1,
    completed = false,
    pendingCallback = cb,
    requestTime, responseTime, best;

  // Request a time sample from the server.
  function requestSample() {
    var request = new XMLHttpRequest();

    // Ask the server for another copy of ServerDate.js but specify a unique number on the URL querystring
    // so that we don't get the browser cached Javascript file
    request.open("GET", URL + "?noCache=" + Date.now());

    // At the earliest possible moment of the response, record the time at
    // which we received it.
    request.onreadystatechange = function() {
      // If we got the headers and everything's OK
      if ((this.readyState == this.HEADERS_RECEIVED)
        && (this.status == 200))
        responseTime = Date.now();
    };

    // Process the server's response.
    request.onload = function() {
      // If OK
      if (this.status == 200) {
        try {
          // Process the server's Date from the response header
          processSample((new Date(this.getResponseHeader("Date"))).getTime());
        }
        catch (exception) {
          log("Unable to read the server's response.");
        }
      }
    };

    // Remember the time at which we sent the request to the server.
    requestTime = Date.now();

    // Send the request.
    request.send();
  }

  // Process the time sample received from the server.
  function processSample(serverNow) {
    var oldTarget;
    var precision = (responseTime - requestTime) / 2,
      sample = new Offset(serverNow + precision - responseTime,
        precision);

    log("sample: " + iteration + ", offset: " + String(sample));

    // Remember the best sample so far.
    if ((iteration == 1) || (precision <= best.precision))
      best = sample;

    // Take 10 samples so we get a good chance of at least one sample with
    // low latency.
    if (iteration < 10) {
      iteration++;
      requestSample();
    } else {
      // Set the offset target to the best sample collected.
      oldTarget = target;
      setTarget(best);
      finishSync(true, target, oldTarget);
    }
  }

  // Fire any listeners, including the optional callback, after synchronization has either completed or timed out
  function finishSync(success, newTarget, oldTarget) {
    synchronizing = false;
    if (!completed) {
      listeners.concat(pendingCallback).forEach(function(v) {
        if (typeof v === 'function') {
          v(success, newTarget, oldTarget)
        }
      });
      completed = true;
    }
  }

  // Set a timer to stop synchronizing just in case there's a problem.
  setTimeout(function () {
    finishSync(false, target, target);
  },
  10 * 1000);

  // Request the first sample.
  synchronizing = true;
  requestSample(cb);
}

// Tag logged messages for better readability.
function log(message) {
    if (console && console.log) { console.log("[ServerDate] " + message); }
}

offset = serverNow - scriptLoadTime;

// Not yet supported by all browsers (including Safari).  Calculate the
// precision based on when the HTML page has finished loading and begins to load
// this script from the server.
if (typeof performance != "undefined") {
  precision = (scriptLoadTime - performance.timing.domLoading) / 2;
  offset += precision;
}

// Set the target to the initial offset.
setTarget(new Offset(offset, precision));

// Amortization process.  Every second, adjust the offset toward the target by
// a small amount.
setInterval(function()
{
  // Don't let the delta be greater than the amortizationRate in either
  // direction.
  var delta = Math.max(-ServerDate.amortizationRate,
    Math.min(ServerDate.amortizationRate, target - offset));

  offset += delta;

  if (delta)
    log("Offset adjusted by " + delta + " ms to " + offset + " ms (target: "
      + target.value + " ms).");
}, 1000);

// Synchronize whenever the page is shown again after losing focus.
window.addEventListener('pageshow', synchronize);

// Start our first synchronization.
synchronize();

// Return the newly defined module.
return ServerDate;
})(Date.now());
