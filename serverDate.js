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
 * @returns a promise that waits the specified time and then fetches a new sample
 */
const createSample = (delayTime) => {
  return createDelay(delayTime)
    .then(fetchSampleImplementation)
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
