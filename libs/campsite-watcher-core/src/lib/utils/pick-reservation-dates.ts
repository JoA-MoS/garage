import { Availability } from '../enums';
import { AvailabilityObj } from '../interfaces';

export function pickReservationDates(obj: AvailabilityObj, dates: Date[]) {
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
