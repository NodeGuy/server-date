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

/**
 * create an estimate for the server's time by analyzing the moment when the `Date` HTTP header ticks to the next second. This allows for the possibility of a substantial improvement over the 1-second accuracy of HTTP Date
 *
 * @returns an object with an estimate of the servers date along with an offset from the current time and an uncertainty value to denote the precision of the estimate
 */
export const getServerDate = async (
  { fetchSample } = { fetchSample: fetchSampleImplementation }
) => {

  let samples = [];
  //100 milliseconds seems like a reasonable delay between samples. Higher numbers mean less calls to the server, but also lower precision
  await repeatedSample(100, samples, fetchSample);

  //estimate the time based on the last two samples
  return estimateServerTime(
    reverseIndex(samples, 1),
    reverseIndex(samples, 0)
    )
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
    .then(() => {

      //if the server dates of the last 2 samples dont match, then we captured a request before and after the servers time ticked to the next second and we can stop making requests
  
      if (!hasCapturedTick(
        reverseIndex(sampleList, 1),
        reverseIndex(sampleList, 0)
        )) {
        return repeatedSample(delayTime, sampleList, samplePromise)
      }
    })

}

/**
 * A function that enables elements to be retrieved from the end of an array
 *
 * @param {*} array the array to retrieve elements from
 * @param {*} indexFromEnd the index of the position to fetch, starting from the end of the array
 * @returns
 */
const reverseIndex = (array, indexFromEnd) => {
  return array[array.length - 1 - indexFromEnd]
}

/**
 * Determine whether two samples capture a change in the server's Datetime
 *
 * @param {*} lastSample the older sample
 * @param {*} thisSamplethe newer sample
 * @returns boolean indicating whether the server's date value changed between these requests
 */
const hasCapturedTick = (lastSample, thisSample) => {
  if (!lastSample) return false;
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
 
  //the responseDate is the soonest possible time we could have known about the new server time. and thus the most accurate, so the difference between that and our estimated server time is the offset that needs to be applied to the localtime to approximate the server time to within +/- the uncertainty value.
  offset = date - sampleAfter.responseDate

  return { date, offset, uncertainty }

}
