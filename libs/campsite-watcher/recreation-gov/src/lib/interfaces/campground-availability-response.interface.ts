import { Campsite } from './campsite.interface';

export interface CampgroundAvailabilityResponse {
  campsites: { [key: string]: Campsite };
  count: number;
}
