<?php header('Content-type: text/javascript'); ?>

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

 const fetchSampleImplementation = async () => {
  const requestDate = new Date();

  const { serverDate } = await import(
    `./serverDate.js.php?nocache=${Math.random()}`
  );

  return {
    requestDate,
    responseDate: new Date(),
    serverDate,
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
      const uncertainty = (responseDate - requestDate) / 2;

      if (uncertainty < best.uncertainty) {
        best = {
          date: serverDate,
          offset: serverDate - responseDate,
          uncertainty,
        };
      }
    } catch (exception) {
      console.warn(exception);
    }
  }

  return best;
};

export const serverDate = new Date(
  <?php
    $comps = explode(' ', microtime());
    echo sprintf('%d%03d', $comps[1], $comps[0] * 1000);
  ?>
);
