/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const fetchSampleImplementation = async () => {
  const requestDate = new Date();

  const { headers, ok, statusText } = await fetch(window.location, {
    cache: `no-store`,
    method: `HEAD`,
  });

  if (!ok) {
    throw new Error(`Bad date sample from server: ${statusText}`);
  }

  return {
    requestDate,
    responseDate: new Date(),
    serverDate: new Date(headers.get(`Date`)),
  };
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
