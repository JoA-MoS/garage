import {
  CampsiteType,
  Campsite as RecreationGovCampsite,
  getCampgroundsMonthAvailability,
} from '@garage/campsite-watcher/recreation-gov';
import dayjs from 'dayjs';
import _merge from 'lodash/merge';

import { WatchOptions } from '../interfaces';

import { getReservationMonths } from './date-range-utils';
import { formatSites } from './format-sites';
import { pickReservationDates } from './pick-reservation-dates';

// load all watcher configurations for campground then get the required months
// load all that into a store to then run the availiblity check. This way if
// multiple watchers need the same month we are not over querying the endpoint
// we could also consider something like rest data source if we decide to go that way
export async function checkAvailability(watchConfig: WatchOptions) {
  const minConsecutiveDays = watchConfig.minConsecutiveDays ?? 1;
  const months = getReservationMonths(watchConfig.dates);
  const requests = months.map((v) =>
    getCampgroundsMonthAvailability(watchConfig.campgroundId, v)
  );
  const dataArr = await Promise.all(requests);
  if (dataArr?.length === 0) {
    return undefined;
  }

  const campsitesArr = dataArr.map((v) => v.campsites);
  const mergedCampsites: { [key: string]: RecreationGovCampsite } = _merge(
    {},
    ...campsitesArr
  );

  const campsites = Object.values(mergedCampsites).filter(
    ({ loop, campsite_type }) =>
      campsite_type !== CampsiteType.Management &&
      (watchConfig?.loops?.includes(loop) || !watchConfig.loops)
  );

  for (const site of campsites) {
    const matchingAvailability = pickReservationDates(
      site.availabilities,
      watchConfig.dates
    );
    site.availabilities = matchingAvailability;
  }

  let availableSites = campsites.filter(
    (site) => Object.keys(site.availabilities).length > 0
  );
  if (minConsecutiveDays > 1) {
    // console.log('MIN CONSECUTIVE', availableSites);
    availableSites = availableSites.filter((campSite) => {
      let concurrentDays = 0;
      let maxConcurrentDays = 0;
      let prevDate = undefined;
      // TODO: remove dates that don't meet min Concurrent
      for (const dateKey in campSite.availabilities) {
        const date = new Date(dateKey);
        if (prevDate) {
          const nextDate = dayjs(prevDate).add(1, 'day').toDate();

          if (dayjs(nextDate).isSame(date, 'day')) {
            concurrentDays++;
            maxConcurrentDays = Math.max(concurrentDays, maxConcurrentDays);
          } else {
            concurrentDays = 0;
          }
        }
        prevDate = date;
      }
      return maxConcurrentDays >= minConsecutiveDays;
    });
    // Object.keys(matchingAvailability);
  }

  return {
    watchConfig,
    summary: `Found ${availableSites.length} sites at ${watchConfig.campgroundName} that match your criteria`,
    details: formatSites(availableSites),
  };
}
