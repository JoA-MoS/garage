import axios from 'axios';
import qs from 'qs';
import { CampgroundAvailabilityResponse } from '../interfaces/campground-availability-response.interface';

export async function getCampgroundsMonthAvailability(
  campgroundId: number,
  date: Date
) {
  console.log({ campgroundId, date });
  try {
    const res = await axios.get<CampgroundAvailabilityResponse>(
      `https://www.recreation.gov/api/camps/availability/campground/${campgroundId}/month`,
      {
        params: {
          start_date: date,
        },
        paramsSerializer: {
          encode: (params: Record<string, unknown>) => qs.stringify(params),
        },
      }
    );
    // console.log(JSON.stringify(data, null, 2));
    // console.log(res.status);
    return res.data;
  } catch (err) {
    console.error({ err: err });
  }
}
