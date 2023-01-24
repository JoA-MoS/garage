import { Campsite } from '../interfaces';

export function formatSites(sites: Campsite[]) {
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
