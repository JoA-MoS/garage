import {
  getCampgroundsMonthAvailability,
  Campsite as RecreationGovCampsite,
  CampsiteType,
} from '@garage/campsite-watcher/recreation-gov';
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
  const months = getReservationMonths(watchConfig.dates);
  const requests = months.map((v) =>
    getCampgroundsMonthAvailability(watchConfig.campgroundId, v)
  );

  const dataArr = await Promise.all(requests);
  if (dataArr?.length === 0) {
    return undefined;
  }
  const totalSites = dataArr[0].count || 0;
  console.log(dataArr);
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
    // get first consecutive reservable date before reservation
    // if (Object.keys(matchingAvailability).length > 0) {

    // }
    site.availabilities = matchingAvailability;
  }

  const availableSites = campsites.filter(
    (site) => Object.keys(site.availabilities).length > 0
  );

  return {
    watchConfig,
    summary: `Searched campground ${watchConfig.campgroundName}'s ${totalSites} sites and found ${availableSites.length} that match your criteria`,
    details: formatSites(availableSites),
  };
}
