import axios from 'axios';
import { stringify } from 'qs';
import { CampgroundAvailabilityResponse } from '../interfaces/campground-availability-response.interface';

export async function getCampgroundsMonthAvailability(
  campgroundId: number,
  date: Date
) {
  const res = await axios.get<CampgroundAvailabilityResponse>(
    `https://www.recreation.gov/api/camps/availability/campground/${campgroundId}/month`,
    {
      params: {
        start_date: date,
      },
      paramsSerializer: (params) => stringify(params),
    }
  );
  // console.log(JSON.stringify(data, null, 2));
  // console.log(res.status);
  return res.data;
}
