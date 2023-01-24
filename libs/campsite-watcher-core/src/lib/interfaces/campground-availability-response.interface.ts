import { Campsite } from '.';

export interface CampgroundAvailabilityResponse {
  campsites: { [key: string]: Campsite };
  count: number;
}
