import { Availability, CampsiteType } from './app/enums';
import { AvailabilityObj, Campsite } from './app/interfaces';
import { WatchOptions } from './app/interfaces/watch-options.interface';
import { getCampgroundsMonthAvailability } from './app/services/recreation-gov.service';
import { getReservationMonths } from './app/utils/date-range-utils';
import { notify } from './app/utils/notify';
import { getWatcherConfig } from './app/utils/read-config';

// pass the watcher list via config param
(async () => {
  // reload watcher list every interval
  let watchers = await getWatcherConfig();
  await checkAllWatchers(watchers);
  setInterval(async () => {
    watchers = await getWatcherConfig();
    await checkAllWatchers(watchers);
  }, 15 * 60 * 1000);
})().catch((err) => console.error(err));

async function checkAllWatchers(watchConfigs: WatchOptions[]) {
  try {
    const result = await Promise.all(
      watchConfigs.map((v) => checkAvailability(v))
    );
    result.forEach((r) => {
      console.log(new Date().toISOString());
      console.log(r.summary);
      if (r.details.length > 0) {
        console.table(r.details);
        notify(r);
      }
    });
  } catch (err) {
    console.log(new Date().toISOString());
    console.error(err);
  }
}

// load all watcher configurations for campground then get the required months
// load all that into a store to then run the availiblity check. This way if
// multiple watchers need the same month we are not over querying the endpoint
// we could also consider something like rest data source if we decide to go that way
async function checkAvailability(watchConfig: WatchOptions) {
  const months = getReservationMonths(watchConfig.dates);
  console.log(watchConfig);

  try {
    const requests = months.map((v) =>
      getCampgroundsMonthAvailability(watchConfig.campgroundId, v)
    );

    const dataArr = await Promise.all(requests);
    const totalSites = dataArr[0].count;
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
  } catch (err) {
    console.error(err);
  }
}

function formatSites(sites: Campsite[]) {
  return sites.map(
    ({ site, campsite_id, loop, campsite_type, availabilities }) => ({
      site,
      campsite_id,
      loop,
      campsite_type,
      dates: Object.keys(availabilities)
        .sort((a, b) => Date.parse(a) - Date.parse(b))
        .map((v) => v.split('T')[0])
        .join(', '),
    })
  );
}

const pickReservationDates = (obj: AvailabilityObj, dates: Date[]) => {
  const dateKeys = dates.map(
    (v) => new Date(v).toISOString().split('.')[0] + 'Z'
  );
  return Object.fromEntries(
    dateKeys
      .filter((d) => d in obj)
      .map((k) => [k, obj[k]])
      .filter(
        ([, v]) => v === Availability.Available || v === Availability.Open
      )
  );
};
