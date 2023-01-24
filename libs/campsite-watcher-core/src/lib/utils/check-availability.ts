import { CampsiteType } from '../enums/campsite-type.enum';
import { Campsite, WatchOptions } from '../interfaces';
import { getCampgroundsMonthAvailability } from '../services/recreation-gov.service';
import { getReservationMonths } from './date-range-utils';
import { formatSites } from './format-sites';
import { pickReservationDates } from './pick-reservation-dates';

// load all watcher configurations for campground then get the required months
// load all that into a store to then run the availiblity check. This way if
// multiple watchers need the same month we are not over querying the endpoint
// we could also consider something like rest data source if we decide to go that way
export async function checkAvailability(watchConfig: WatchOptions) {
  const months = getReservationMonths(watchConfig.dates);
  console.log(watchConfig);

  const requests = months.map((v) =>
    getCampgroundsMonthAvailability(watchConfig.campgroundId, v)
  );

  const dataArr = await Promise.all(requests);
  if (dataArr?.length === 0) {
    return undefined;
  }
  const totalSites = dataArr[0].count || 0;
  const campsitesArr = dataArr.map((v) => v.campsites);
  const mergedCampsites: { [key: string]: Campsite } = Object.assign(
    {},
    ...campsitesArr
  );

  const campsites = Object.values(mergedCampsites).filter(
    ({ loop, campsite_type }) =>
      campsite_type !== CampsiteType.Management &&
      (watchConfig?.loops?.includes(loop) || !watchConfig.loops)
  );

  for (const site of campsites) {
    site.availabilities = pickReservationDates(
      site.availabilities,
      watchConfig.dates
    );
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
