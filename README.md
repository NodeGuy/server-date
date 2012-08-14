# Introduction

ServerDate is used in web pages to make the server's clock available to the
client's browser via Javascript.

You can use it when you want to display the current time but don't trust the
browser's clock to be accurate, or to synchronize events for different users of
your web site by synching them all to the server's clock.

Usage is simple.  Add two lines to the `<HEAD>` section of your web page and then
you can use the `ServerDate` object in Javascript just like you use the built-in
`Date` object, except that it reflects the server's time instead of the client's.

# Requirements

You need PHP running on your web server.

ServerDate has been tested in the following browsers:

Chrome 20.0.1132.57  
Firefox 14.0.1  
Safari 5.1.7 (7534.57.2)  

# Usage

Upload `ServerDate.php` to your web server and include the following two lines in
the `<HEAD>` section of your web page:

```html
<script type="text/javascript">var ServerDate = new Date</script>
<script type="text/javascript" src="ServerDate.php"></script>
```

You may then use `ServerDate` as you would use the `Date` function or its instances,
e.g.:

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

See the included file [example.html](https://github.com/BallBearing/ServerDate/blob/master/example.html) for an example of usage.
    
# References

* "Probabilistic clock synchronization" by Flaviu Cristian
Cristian, F. (1989), "Probabilistic clock synchronization", Distributed
Computing (Springer) 3 (3): 146–158, DOI:10.1007/BF01784024
* MikeWyatt's answer and Willem Mulder's comment in [Sync JS time between multiple
devices](http://stackoverflow.com/questions/10585910/sync-js-time-between-multiple-devices)
* Rob W's answer to [How to synchronise a client webpage timer with the server](http://stackoverflow.com/questions/9350928/how-to-synchronise-a-client-webpage-timer-with-the-server)

# Copyright

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
