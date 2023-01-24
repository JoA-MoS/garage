import { Quantities } from '.';
import {
  Availability,
  CampsiteReserveType,
  CampsiteType,
  Loop,
  TypeOfUse,
} from '../enums';

export interface Campsite {
  availabilities: AvailabilityObj;
  campsite_id: string;
  campsite_reserve_type: CampsiteReserveType | string;
  campsite_rules: unknown;
  campsite_type: CampsiteType | string;
  capacity_rating: string;
  loop: Loop | string;
  max_num_people: number;
  min_num_people: number;
  quantities: Quantities;
  site: string;
  type_of_use: TypeOfUse | string;
}

export type AvailabilityObj = { [key: string]: Availability };
