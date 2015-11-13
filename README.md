# Introduction

ServerDate is used in web pages to make the server's clock available to the
client's browser via Javascript.

You can use it when you want to display the current time but don't trust the
browser's clock to be accurate, or to synchronize events for different users of
your web site by synching them all to the server's clock.

Usage is simple.  Add one `<SCRIPT>` element to your web page and then you can
use the `ServerDate` object in Javascript just like you use the built-in `Date`
object, except that it reflects the server's time instead of the client's.

# Requirements

ServerDate has been tested in the following browsers:

* Chrome 23.0.1271.64
* Firefox 16.0.2
* Safari 6.0.1 (7536.26.14)
* Internet Explorer 11.0.9600.18015

# Installation

Include the following `<SCRIPT>` element in your web page:

```html
<SCRIPT>
  window.ServerDate = {
    // Show debug information in console
    debug: false,
    // After a synchronization there may be a significant difference between our
    // clock and the server's clock.  Rather than make the change abruptly, we
    // change our clock by adjusting it once per second by the amortizationRate.
    amortizationRate: 25, // ms
    // The exception to the above is if the difference between the clock and
    // server's clock is too great (threshold set below).  If that's the case then
    // we skip amortization and set the clock to match the server's clock
    // immediately.
    amortizationThreshold: 2000, // ms
    // After the initial synchronization the two clocks may drift so we
    // automatically synchronize again every synchronizationIntervalDelay.
    synchronizationIntervalDelay: 60 * 60 * 1000 // ms
  };
</SCRIPT>
<SCRIPT src="ServerDate.js"></SCRIPT>
```

## Usage

You may then use `ServerDate` as you would use the `Date` object or one of its
instances, e.g.:

```javascript
> ServerDate()
"Mon Aug 13 2012 20:26:34 GMT-0300 (ART)"

> ServerDate.now()
1344900478753

> ServerDate.getMilliseconds()
22
```

There is also a new method to get the precision of ServerDate's estimate of the
server's clock (in milliseconds):

```javascript
> ServerDate.toLocaleString() + " ± " + ServerDate.getPrecision() + " ms"
"Tue Aug 14 01:01:49 2012 ± 108 ms"
```

You can see the difference between the server's clock and the browsers clock,
in milliseconds:

```javascript
> ServerDate - new Date()
39
```

There is no constructor because it doesn't make sense to create more than one
instance of `ServerDate`.

Methods from `Date` to change the time, such as `setMinutes`, are not defined:

```javascript
> ServerDate.setMinutes
undefined
```

`ServerDate` is synchronized with the server's clock when it is first loaded and
then re-synchronizes itself from time to time to keep the two clocks from
drifting apart.

# References

* "Probabilistic clock synchronization" by Flaviu Cristian
Cristian, F. (1989), "Probabilistic clock synchronization", Distributed
Computing (Springer) 3 (3): 146–158, DOI:10.1007/BF01784024
* MikeWyatt's answer and Willem Mulder's comment in [Sync JS time between
multiple devices](http://stackoverflow.com/questions/10585910/sync-js-time-between-multiple-devices)
* Rob W's answer to [How to synchronise a client webpage timer with the server](http://stackoverflow.com/questions/9350928/how-to-synchronise-a-client-webpage-timer-with-the-server)

# Copyright

Copyright 2012 David Braun

This file is part of ServerDate.

ServerDate is free software: you can redistribute it and/or modify it under the
terms of the GNU Lesser General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

ServerDate is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along
with ServerDate.  If not, see <http://www.gnu.org/licenses/>.
