/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import assert from "assert";
import { getServerDate } from "./serverDate";

it(`synchronizes the time with the server`, async () => {
  const samples = [
    {
      requestDate: new Date(`2021-02-02T23:43:31.689Z`),
      responseDate: new Date(`2021-02-02T23:43:32.268Z`),
      serverDate: new Date(`2021-02-02T23:43:32.000Z`),
    },
    {
      requestDate: new Date(`2021-02-02T23:43:32.268Z`),
      responseDate: new Date(`2021-02-02T23:43:32.433Z`),
      serverDate: new Date(`2021-02-02T23:43:32.000Z`),
    },
    {
      requestDate: new Date(`2021-02-02T23:43:32.433Z`),
      responseDate: new Date(`2021-02-02T23:43:32.601Z`),
      serverDate: new Date(`2021-02-02T23:43:32.000Z`),
    },
    {
      requestDate: new Date(`2021-02-02T23:43:32.601Z`),
      responseDate: new Date(`2021-02-02T23:43:32.780Z`),
      serverDate: new Date(`2021-02-02T23:43:32.000Z`),
    },
    {
      requestDate: new Date(`2021-02-02T23:43:32.780Z`),
      responseDate: new Date(`2021-02-02T23:43:32.947Z`),
      serverDate: new Date(`2021-02-02T23:43:32.000Z`),
    },
    {
      requestDate: new Date(`2021-02-02T23:43:32.947Z`),
      responseDate: new Date(`2021-02-02T23:43:33.135Z`),
      serverDate: new Date(`2021-02-02T23:43:33.000Z`),
    },
    {
      requestDate: new Date(`2021-02-02T23:43:33.135Z`),
      responseDate: new Date(`2021-02-02T23:43:33.383Z`),
      serverDate: new Date(`2021-02-02T23:43:33.000Z`),
    },
    {
      requestDate: new Date(`2021-02-02T23:43:33.383Z`),
      responseDate: new Date(`2021-02-02T23:43:33.551Z`),
      serverDate: new Date(`2021-02-02T23:43:33.000Z`),
    },
    {
      requestDate: new Date(`2021-02-02T23:43:33.551Z`),
      responseDate: new Date(`2021-02-02T23:43:33.726Z`),
      serverDate: new Date(`2021-02-02T23:43:33.000Z`),
    },
    {
      requestDate: new Date(`2021-02-02T23:43:33.726Z`),
      responseDate: new Date(`2021-02-02T23:43:33.896Z`),
      serverDate: new Date(`2021-02-02T23:43:33.000Z`),
    },
  ];

  let currentSample = -1;

  const fetchSample = async () => {
    currentSample++;

    if (currentSample === 5) {
      throw new Error(`bad sample`);
    }

    return samples[currentSample];
  };

  assert.deepStrictEqual(await getServerDate({ fetchSample }), {
    date: new Date(`2021-02-02T23:43:32.500Z`),
    offset: 67,
    uncertainty: 582.5,
  });
});

it(`returns offset 0 and local Date on error`, async () => {
  const fetchSample = async () => {
    throw new Error(`oh dang`);
  };
  const { date, offset, uncertainty } = await getServerDate({ fetchSample });
  assert(offset === 0);
  assert(uncertainty === Number.MAX_VALUE);
  assert(Date.now() - date < 100);
})

it(`throws errors if you ask it to`, async () => {
  const fetchSample = async () => {
    throw new Error(`oh dang`);
  };
  await assert.rejects(async () => getServerDate({ fetchSample, throwErrors: true }));
})
