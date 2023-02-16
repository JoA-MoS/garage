import {
  Availability,
  AvailabilityObj,
} from '@garage/campsite-watcher/recreation-gov';

export function pickReservationDates(
  campsiteAvailability: AvailabilityObj,
  requestedDates: Date[]
): AvailabilityObj {
  const dateKeys = requestedDates.map(
    (v) => new Date(v).toISOString().split('.')[0] + 'Z'
  );
  return Object.fromEntries(
    dateKeys
      .filter((requestedDate) => requestedDate in campsiteAvailability)
      .map((date) => [date, campsiteAvailability[date]])
      .filter(
        ([, dateAvailability]) =>
          dateAvailability === Availability.Available ||
          dateAvailability === Availability.Open
      )
  );
}
