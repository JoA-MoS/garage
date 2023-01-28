import { Campsite as RecreationGovCampsite } from '@garage/campsite-watcher/recreation-gov';

import { Campsite } from '../interfaces';

export function formatSites(sites: RecreationGovCampsite[]) {
  return sites.map(formatSite);
}

export function formatSite(campSite: RecreationGovCampsite): Campsite {
  const { site, campsite_id, loop, campsite_type, availabilities } = campSite;
  return {
    site,
    id: campsite_id,
    loop,
    type: campsite_type,
    dates: Object.keys(availabilities).map((v) => new Date(v)),
  };
}
