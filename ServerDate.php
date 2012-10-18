<?php
$now = round(1000 * microtime(true));

if (filter_input(INPUT_GET, 'time'))
{
  header('Content-type: application/json');
  echo $now;
}
else {
  header('Content-type: text/javascript');

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
?>

// Re-assign the existing ServerDate variable to a module while preserving its
// previous value in beforeScriptTime (see the end of this file).
ServerDate = (function(beforeScriptTime)
{

// Remember when the script was loaded.
var scriptLoadTime = Date.now();
  
// Everything is in the global function ServerDate.  Unlike Date, there is no
// need for a constructor because there aren't instances.

/// PUBLIC

// Emulate Date's methods.

function ServerDate()
{
  return ServerDate.toString();
}

ServerDate.parse = Date.parse;
ServerDate.UTC = Date.UTC;

ServerDate.now = function()
{
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
  .forEach(function(method)
  {
    ServerDate[method] = function()
    {
      return new Date(ServerDate.now())[method]();
    };
  });

// Because of network delays we can't be 100% sure of the server's time.  We do
// know the precision in milliseconds and make it available here.
ServerDate.getPrecision = function() // ms
{
  // Take into account the amortization.
  return target.precision + Math.abs(target - offset);
};

// After a synchronization there may be a significant difference between our
// clock and the server's clock.  Rather than make the change abruptly, we
// change our clock by adjusting it once per second by the amortizationRate.
ServerDate.amortizationRate = 25; // ms

// After the initial synchronization the two clocks may drift so we
// automatically synchronize again every synchronizationIntervalDelay.  This is
// the initial value but it can change over time (see below).
ServerDate.synchronizationIntervalDelay = 60 * 60 * 1000; // ms

// We don't know how often we need to synchronize to keep the clocks in sync.
// Every time we do we measure the drift.  If it's significant then we divide
// the synchronizationIntervalDelay by the value below, otherwise we multiply it
// by the value below.  
ServerDate.synchronizationIntervalChangeRate = 0.5;

/// PRIVATE 

// We need to work with precision as well as offset values, so bundle them
// together conveniently.
function Offset(value, precision)
{
  this.value = value;
  this.precision = precision;
}

Offset.prototype.valueOf = function()
{
  return this.value;
}

Offset.prototype.toString = function()
{
  // The '±' character doesn't look right in Firefox's console for some reason.
  return this.value + " +/- " + this.precision + " ms";
}

// Remember the URL of this script so we can call it again during
// synchronization.
var scripts = document.getElementsByTagName("script");
var URL = scripts[scripts.length - 1].src;

// This is the first time we align with the server's clock by using the time
// this script was generated (serverNow) and noticing the client time before
// and after the script was loaded.  This gives us a good estimation of the
// server's clock right away, which we later refine during synchronization.
var serverNow = parseInt("<?php echo $now ?>"); // ms

if (isNaN(serverNow))
{
  log("Unable to read server's $now; using local time.  Is PHP enabled?");
  serverNow = Date.now();
}

var precision = (scriptLoadTime - beforeScriptTime) / 2;
var offset = serverNow + precision - scriptLoadTime;

var target = null;
var synchronizationInterval;
var previousSync = null;

// The target is the offset we'll get to over time after amortization.
function setTarget(newTarget)
{
  target = newTarget;
  log("Set target to " + String(target) + ".");
}

// setInterval is buggy on Firefox so define our own.
function setInterval(func, delay)
{
  // Values over 2147483647 cause Firefox 14.0.1 to call the func immediately.
  return window.setInterval(func, Math.min(delay, 2147483647));
}

// Synchronize the ServerDate object with the server's clock.
function synchronize()
{
  var iteration = 1;
  var requestTime, responseTime;
  var best;

  // Request a time sample from the server.
  function requestSample()
  {
    var request = new XMLHttpRequest;
    
    // Ask the server for its opinion of the current time (milliseconds).
    request.open("GET", URL + "?time=now");
  
    // At the earliest possible moment of the response, record the time at which
    // we received it.
    request.onreadystatechange = function()
    {
      // If we got the headers and everything's OK
      if ((this.readyState == this.HEADERS_RECEIVED) && (this.status == 200))
        responseTime = Date.now();
    };
    
    // Process the server's response.
    request.onload = function()
    {
      // If OK
      if (this.status == 200)
      {
        try
        {
          // Process the server's version of Date.now().
          processSample(JSON.parse(this.response));
        }
        catch (exception)
        {
          log("Unable to read the server's response.  Is PHP enabled?");
        }
      }
    };
  
    // Remember the time at which we sent the request to the server.    
    requestTime = Date.now();
    
    // Send the request.
    request.send();
  }

  // Process the time sample received from the server.
  function processSample(serverNow)
  {
    var precision = (responseTime - requestTime) / 2;           
    var sample = new Offset(serverNow + precision - responseTime, precision);

    log("sample: " + iteration + ", offset: " + String(sample));
      
    // Remember the best sample so far.
    if ((iteration == 1) || (precision <= best.precision))
      best = sample;
    
    // Take 10 samples so we get a good chance of at least one sample with
    // low latency.
    if (iteration < 10)
    {
      iteration++;
      requestSample();
    }
    else
      complete();
  }
  
  // We got enough samples, let's complete the synchronization process.
  function complete()
  {
    // Set the offset target to the best sample collected.
    setTarget(best);
  
    // Automatic discovery of the best synchronization interval delay to keep
    // the server and client's clocks from drifting:
    
    // If we've synchronized before,
    if (previousSync != null)
    {
      // Notice the drift between the server's and client's clocks.
      var drift = new Offset(Math.abs(target - previousSync),
        previousSync.precision + target.precision);
        
      log("Synchronization drift: " + drift + ".");
    
      // If the drift is measurable (more than the precision) then
      // synchronize earlier next time, otherwise synchronize later.
      ServerDate.synchronizationIntervalDelay *= drift.value > drift.precision
        ? 1 - ServerDate.synchronizationIntervalChangeRate
        : 1 + ServerDate.synchronizationIntervalChangeRate;
    }
    
    // Clear the synchronization interval so we can change it.
    clearInterval(synchronizationInterval);
    
    // Change the interval.
    synchronizationInterval = setInterval(
      synchronize, ServerDate.synchronizationIntervalDelay);
  
    log("Next synchronization in " 
      + Math.round(ServerDate.synchronizationIntervalDelay / 1000 / 60)
      + " minutes.");
  
    // Remember this target so we can calculate the drift next time.
    previousSync = target;
  }

  // Request the first sample.
  requestSample();
}

// Tag logged messages for better readability.
function log(message)
{
  console.log("[ServerDate] " + message);
}

// Set the target to the initial offset.
setTarget(new Offset(offset, precision));

// Amortization process.  Every second, adjust the offset toward the target by
// a small amount.
setInterval(function()
{
  // Don't let me the delta be greater than the amortizationRate in either
  // direction.
  var delta = Math.max(-ServerDate.amortizationRate, 
    Math.min(ServerDate.amortizationRate, target - offset));
    
  offset += delta;

  if (delta)
    log("Offset adjusted by " + delta + " ms to " + offset + " ms (target: "
      + target.value + " ms).");
}, 1000);

// Start our first synchronization.
synchronize();

// Return the newly defined module.
return ServerDate;

// Grab the beforeScriptTime that we temporarily called ServerDate.
})(ServerDate.getTime());
<?php } ?>
