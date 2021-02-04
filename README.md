# Changes

This version has been rewritten and breaks compatibility with the previous API.

# Introduction

server-date makes the server's clock available to the client's web browser in
JavaScript.

You can use it when you want to display the current time but don't trust the
browser's clock to be accurate or to synchronize events for different users of
your web site by syncing them all to the server's clock.

`serverDate.js`, gets the time
from the server on which the library is hosted by reading the
[Date](https://tools.ietf.org/html/rfc7231#section-7.1.1.2) HTTP response
header. You don't need to make any changes on the server if you use this version
but its precision is limited to seconds because that's what's available in the
header.

## Usage

```JavaScript
import { getServerDate } from "./serverDate.js";

const { date, offset, uncertainty } = await getServerDate();

console.log(`The server's date is ${date} +/- ${uncertainty} milliseconds.`);

// some time in the future

const serverDate = new Date(Date.now() + offset);
```

See `example.html` for a complete example.

# References

- Cristian, Flaviu (1989), "Probabilistic clock synchronization", Distributed
  Computing (Springer) 3 (3): 146–158, DOI:10.1007/BF01784024
- MikeWyatt's answer and Willem Mulder's comment in [Sync JS time between
  multiple devices](http://stackoverflow.com/questions/10585910/sync-js-time-between-multiple-devices)
- Rob W's answer to [How to synchronise a client webpage timer with the server](http://stackoverflow.com/questions/9350928/how-to-synchronise-a-client-webpage-timer-with-the-server)

# Copyright

Copyright 2012 David Braun
