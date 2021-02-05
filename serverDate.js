/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const fetchSampleImplementation = async () => {
  const requestDate = new Date();

  return fetch(window.location, {
    cache: `no-store`,
    method: `HEAD`,
  })
    .then( result => {
      const { headers, ok, statusText } = result
      
      if (!ok) {
        throw new Error(`Bad date sample from server: ${statusText}`);
      }

      return {
        requestDate,
        responseDate: new Date(),
        serverDate: new Date(headers.get(`Date`)),
      };
    })
    .catch((error) => console.error(error))
};

export const getServerDate = async (
  { fetchSample } = { fetchSample: fetchSampleImplementation }
) => {
  let best = { uncertainty: Number.MAX_VALUE };

  // Fetch 10 samples to increase the chance of getting one with low
  // uncertainty.
  for (let index = 0; index < 10; index++) {
    try {
      const { requestDate, responseDate, serverDate } = await fetchSample();

      // We don't get milliseconds back from the Date header so there's
      // uncertainty of at least half a second in either direction.
      const uncertainty = (responseDate - requestDate) / 2 + 500;

      if (uncertainty < best.uncertainty) {
        const date = new Date(serverDate.getTime() + 500);

        best = {
          date,
          offset: date - responseDate,
          uncertainty,
        };
      }
    } catch (exception) {
      console.warn(exception);
    }
  }

  return best;
};


/**
 * creates a promise that delays a set  number of milliseconds
 * 
 * @param {*} delayTime  the number of milliseconds to delay
 */
const createDelay = (delayTime) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delayTime);
  })
}


/**
 * create a promise that delays, and then makes a new request as a sample
 *
 * @param {*} delayTime how long to delay in milliseconds
 * @param {*} samplePromise a promise that executes the collection of a sample
 * @returns a promise that waits the specified time and then fetches a new sample
 */
const createSample = (delayTime, samplePromise) => {
  return createDelay(delayTime)
    .then(samplePromise)
}


/**
 * Reppeatedly collect samples until a change in server date is detected
 *
 * @param {*} delayTime how long to wait in milliseconds between samples. higher values create fewer requests, but also decrease the precision of estimates made from them
 * @param {*} samplePromise a promise that executes the collection of a sample
 * @param {*} sampleList a array to push samples onto
 * @returns a promise that repeatedly collects samples until the server time changes
 */
const repeatedSample = (delayTime, sampleList, samplePromise) => {
  return createSample(delayTime, samplePromise)
    //store the sample
    .then((sample) => {
      sampleList.push(sample)
    })
    //conditionally schedule a new 
    .then((sample) => {

      const { requestDate, responseDate, serverDate } = sample
      //if the server dates of the last 2 samples dont match, then we captured a request before and after the servers time ticked to the next second and we can stop making requests
  
      if (!hasCapturedTick(
        sampleList[sampleList.lastIndexOf() - 1],
        sampleList[sampleList.lastIndexOf()]
        )) {
        return repeatedSample(delayTime, sampleList)
      }
    })

}


/**
 * Determine whether two samples capture a change in the server's Datetime
 *
 * @param {*} lastSample the older sample
 * @param {*} thisSamplethe newer sample
 * @returns boolean indicating whether the server's date value changed between these requests
 */
const hasCapturedTick = (lastSample, thisSample) => {
  return lastSample.serverDate.getTime() !== thisSample.serverDate.getTime()
}


/**
 * Calculates an estimate for server based on two samples, one from before the server time changed, and one after
 * 
 * this function does not account for latency because that calculation often assumes too many things about the users network environment. Even this method is not perfect in this regard.
 *
 * @param {*} sampleBefore an object containing the requestDate, responseDate, and server date value from before the serevr date value changed
 * @param {*} sampleAfter an object containing the requestDate, responseDate, and server date value from after the serevr date value changed
 * @returns an object with an estimate of the servers date along with an offset from the current time and an uncertainty value to denote the precision of the estimate
 */
const estimateServerTime = (sampleBefore, sampleAfter) => {

  let offset = 0;
  //the date in seconds is most accurate the moment it ticks (or very soon after)
  let date = sampleAfter.serverDate;
  //this is treates as +/-, so its half of the total width of possibility
  let uncertainty = 500;


  if (!hasCapturedTick(sampleBefore, sampleAfter)) {
    console.error(`A tick was not captured in the samples provided. cannot calculate a more accurate server time. falling back to the server-provided date.`);

    return { date, offset, uncertainty }
  }

  //otherwise, without making assumptions, the moment at which the server ticked to the next second must have happened anywhere between the sending of the previous sample and the receiving of the sample that detected the change
  //see: https://github.com/NodeGuy/server-date/issues/41

  // get an upper limit for time duration in which the time could have changed on the server and produced this result
  const tickWindow = sampleBefore.requestDate.getTime() - sampleAfter.responseDate.getTime()

  //divide by 2 because uncertainty is in a single direction
  uncertainty = tickWindow / 2;
  //because we dont know the relationship between server time and local time precisely, we must guess, and placing it in the middle of the uncertainty tickWindow seems reasonable.
  date = new Date(sampleBefore.requestDate.getTime() + uncertainty)

  //the responseDate is the soonest possible time we could have known about the new server time. and thus the most accurate, so the difference between that and our estimated server time is the offset that needs to be applied to the localtime to approximate the server time to within +/- the uncertainty value.
  offset = date - responseDate

  return { date, offset, uncertainty }

}
