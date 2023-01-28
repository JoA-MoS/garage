import {
  Availability,
  AvailabilityObj,
} from '@garage/campsite-watcher/recreation-gov';

export function pickReservationDates(
  obj: AvailabilityObj,
  dates: Date[]
): AvailabilityObj {
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
}
