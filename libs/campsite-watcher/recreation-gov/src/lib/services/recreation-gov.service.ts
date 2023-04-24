import axios from 'axios';
import { stringify } from 'qs';

import { CampgroundAvailabilityResponse } from '../interfaces';

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
      paramsSerializer: { serialize: (params) => stringify(params) },
    }
  );
  // console.log(JSON.stringify(res.data, null, 2));
  // console.log(res.status);
  return res.data;
}

// const example = {
//   '2874': {
//     availabilities: {
//       '2023-07-01T00:00:00Z': 'Reserved',
//       '2023-07-02T00:00:00Z': 'Reserved',
//       '2023-07-03T00:00:00Z': 'Reserved',
//       '2023-07-04T00:00:00Z': 'Reserved',
//       '2023-07-05T00:00:00Z': 'Reserved',
//       '2023-07-06T00:00:00Z': 'Reserved',
//       '2023-07-07T00:00:00Z': 'Reserved',
//       '2023-07-08T00:00:00Z': 'Reserved',
//       '2023-07-09T00:00:00Z': 'Reserved',
//       '2023-07-10T00:00:00Z': 'Reserved',
//       '2023-07-11T00:00:00Z': 'Reserved',
//       '2023-07-12T00:00:00Z': 'Reserved',
//       '2023-07-13T00:00:00Z': 'Reserved',
//       '2023-07-14T00:00:00Z': 'Reserved',
//       '2023-07-15T00:00:00Z': 'Reserved',
//       '2023-07-16T00:00:00Z': 'Reserved',
//       '2023-07-17T00:00:00Z': 'Reserved',
//       '2023-07-18T00:00:00Z': 'Reserved',
//       '2023-07-19T00:00:00Z': 'Reserved',
//       '2023-07-20T00:00:00Z': 'Reserved',
//       '2023-07-21T00:00:00Z': 'Reserved',
//       '2023-07-22T00:00:00Z': 'Reserved',
//       '2023-07-23T00:00:00Z': 'Reserved',
//       '2023-07-24T00:00:00Z': 'Reserved',
//       '2023-07-25T00:00:00Z': 'Reserved',
//       '2023-07-26T00:00:00Z': 'Reserved',
//       '2023-07-27T00:00:00Z': 'Reserved',
//       '2023-07-28T00:00:00Z': 'Reserved',
//       '2023-07-29T00:00:00Z': 'Reserved',
//       '2023-07-30T00:00:00Z': 'Reserved',
//       '2023-07-31T00:00:00Z': 'Reserved',
//     },
//     campsite_id: '2874',
//     campsite_reserve_type: 'Site-Specific',
//     campsite_rules: null,
//     campsite_type: 'TENT ONLY NONELECTRIC',
//     capacity_rating: '',
//     loop: 'LOOP C',
//     max_num_people: 6,
//     min_num_people: 1,
//     quantities: {},
//     site: 'C025',
//     supplemental_camping: null,
//     type_of_use: 'Overnight',
//   },
//   '2875': {
//     availabilities: {
//       '2023-07-01T00:00:00Z': 'Reserved',
//       '2023-07-02T00:00:00Z': 'Reserved',
//       '2023-07-03T00:00:00Z': 'Reserved',
//       '2023-07-04T00:00:00Z': 'Reserved',
//       '2023-07-05T00:00:00Z': 'Reserved',
//       '2023-07-06T00:00:00Z': 'Reserved',
//       '2023-07-07T00:00:00Z': 'Reserved',
//       '2023-07-08T00:00:00Z': 'Reserved',
//       '2023-07-09T00:00:00Z': 'Reserved',
//       '2023-07-10T00:00:00Z': 'Reserved',
//       '2023-07-11T00:00:00Z': 'Reserved',
//       '2023-07-12T00:00:00Z': 'Reserved',
//       '2023-07-13T00:00:00Z': 'Reserved',
//       '2023-07-14T00:00:00Z': 'Reserved',
//       '2023-07-15T00:00:00Z': 'Reserved',
//       '2023-07-16T00:00:00Z': 'Reserved',
//       '2023-07-17T00:00:00Z': 'Reserved',
//       '2023-07-18T00:00:00Z': 'Reserved',
//       '2023-07-19T00:00:00Z': 'Reserved',
//       '2023-07-20T00:00:00Z': 'Reserved',
//       '2023-07-21T00:00:00Z': 'Reserved',
//       '2023-07-22T00:00:00Z': 'Reserved',
//       '2023-07-23T00:00:00Z': 'Reserved',
//       '2023-07-24T00:00:00Z': 'Reserved',
//       '2023-07-25T00:00:00Z': 'Reserved',
//       '2023-07-26T00:00:00Z': 'Reserved',
//       '2023-07-27T00:00:00Z': 'Reserved',
//       '2023-07-28T00:00:00Z': 'Reserved',
//       '2023-07-29T00:00:00Z': 'Reserved',
//       '2023-07-30T00:00:00Z': 'Reserved',
//       '2023-07-31T00:00:00Z': 'Reserved',
//     },
//     campsite_id: '2875',
//     campsite_reserve_type: 'Site-Specific',
//     campsite_rules: null,
//     campsite_type: 'STANDARD NONELECTRIC',
//     capacity_rating: '',
//     loop: 'LOOP C',
//     max_num_people: 6,
//     min_num_people: 1,
//     quantities: {},
//     site: 'C033',
//     supplemental_camping: null,
//     type_of_use: 'Overnight',
//   },
//   '2914': {
//     availabilities: {
//       '2023-07-01T00:00:00Z': 'Reserved',
//       '2023-07-02T00:00:00Z': 'Reserved',
//       '2023-07-03T00:00:00Z': 'Reserved',
//       '2023-07-04T00:00:00Z': 'Reserved',
//       '2023-07-05T00:00:00Z': 'Reserved',
//       '2023-07-06T00:00:00Z': 'Reserved',
//       '2023-07-07T00:00:00Z': 'Reserved',
//       '2023-07-08T00:00:00Z': 'Reserved',
//       '2023-07-09T00:00:00Z': 'Reserved',
//       '2023-07-10T00:00:00Z': 'Reserved',
//       '2023-07-11T00:00:00Z': 'Reserved',
//       '2023-07-12T00:00:00Z': 'Reserved',
//       '2023-07-13T00:00:00Z': 'Reserved',
//       '2023-07-14T00:00:00Z': 'Reserved',
//       '2023-07-15T00:00:00Z': 'Reserved',
//       '2023-07-16T00:00:00Z': 'Reserved',
//       '2023-07-17T00:00:00Z': 'Reserved',
//       '2023-07-18T00:00:00Z': 'Reserved',
//       '2023-07-19T00:00:00Z': 'Reserved',
//       '2023-07-20T00:00:00Z': 'Reserved',
//       '2023-07-21T00:00:00Z': 'Reserved',
//       '2023-07-22T00:00:00Z': 'Reserved',
//       '2023-07-23T00:00:00Z': 'Reserved',
//       '2023-07-24T00:00:00Z': 'Reserved',
//       '2023-07-25T00:00:00Z': 'Reserved',
//       '2023-07-26T00:00:00Z': 'Reserved',
//       '2023-07-27T00:00:00Z': 'Reserved',
//       '2023-07-28T00:00:00Z': 'Open',
//       '2023-07-29T00:00:00Z': 'Open',
//       '2023-07-30T00:00:00Z': 'Open',
//       '2023-07-31T00:00:00Z': 'Open',
//     },
//     campsite_id: '2914',
//     campsite_reserve_type: 'Site-Specific',
//     campsite_rules: null,
//     campsite_type: 'STANDARD NONELECTRIC',
//     capacity_rating: '',
//     loop: 'LOOP E',
//     max_num_people: 6,
//     min_num_people: 1,
//     quantities: {},
//     site: 'E021',
//     supplemental_camping: null,
//     type_of_use: 'Overnight',
//   },
//   '2876': {
//     availabilities: {
//       '2023-07-01T00:00:00Z': 'Reserved',
//       '2023-07-02T00:00:00Z': 'Reserved',
//       '2023-07-03T00:00:00Z': 'Reserved',
//       '2023-07-04T00:00:00Z': 'Reserved',
//       '2023-07-05T00:00:00Z': 'NYR',
//       '2023-07-06T00:00:00Z': 'NYR',
//       '2023-07-07T00:00:00Z': 'NYR',
//       '2023-07-08T00:00:00Z': 'NYR',
//       '2023-07-09T00:00:00Z': 'NYR',
//       '2023-07-10T00:00:00Z': 'NYR',
//       '2023-07-11T00:00:00Z': 'NYR',
//       '2023-07-12T00:00:00Z': 'NYR',
//       '2023-07-13T00:00:00Z': 'NYR',
//       '2023-07-14T00:00:00Z': 'NYR',
//       '2023-07-15T00:00:00Z': 'NYR',
//       '2023-07-16T00:00:00Z': 'NYR',
//       '2023-07-17T00:00:00Z': 'NYR',
//       '2023-07-18T00:00:00Z': 'NYR',
//       '2023-07-19T00:00:00Z': 'NYR',
//       '2023-07-20T00:00:00Z': 'NYR',
//       '2023-07-21T00:00:00Z': 'NYR',
//       '2023-07-22T00:00:00Z': 'NYR',
//       '2023-07-23T00:00:00Z': 'NYR',
//       '2023-07-24T00:00:00Z': 'NYR',
//       '2023-07-25T00:00:00Z': 'NYR',
//       '2023-07-26T00:00:00Z': 'NYR',
//       '2023-07-27T00:00:00Z': 'NYR',
//       '2023-07-28T00:00:00Z': 'NYR',
//       '2023-07-29T00:00:00Z': 'NYR',
//       '2023-07-30T00:00:00Z': 'NYR',
//       '2023-07-31T00:00:00Z': 'NYR',
//     },
//     campsite_id: '2876',
//     campsite_reserve_type: 'Site-Specific',
//     campsite_rules: {
//       reservationWindow: {
//         description: '',
//         end_date: '0001-01-01T00:00:00Z',
//         secondary_value: '',
//         start_date: '0001-01-01T00:00:00Z',
//         units: 'Days',
//         value: 7,
//       },
//     },
//     campsite_type: 'STANDARD NONELECTRIC',
//     capacity_rating: '',
//     loop: 'LOOP D',
//     max_num_people: 6,
//     min_num_people: 1,
//     quantities: {},
//     site: 'D002',
//     supplemental_camping: null,
//     type_of_use: 'Overnight',
//   },
//   '2877': {
//     availabilities: {
//       '2023-07-01T00:00:00Z': 'Reserved',
//       '2023-07-02T00:00:00Z': 'Reserved',
//       '2023-07-03T00:00:00Z': 'Reserved',
//       '2023-07-04T00:00:00Z': 'NYR',
//       '2023-07-05T00:00:00Z': 'NYR',
//       '2023-07-06T00:00:00Z': 'NYR',
//       '2023-07-07T00:00:00Z': 'NYR',
//       '2023-07-08T00:00:00Z': 'NYR',
//       '2023-07-09T00:00:00Z': 'NYR',
//       '2023-07-10T00:00:00Z': 'NYR',
//       '2023-07-11T00:00:00Z': 'NYR',
//       '2023-07-12T00:00:00Z': 'NYR',
//       '2023-07-13T00:00:00Z': 'NYR',
//       '2023-07-14T00:00:00Z': 'NYR',
//       '2023-07-15T00:00:00Z': 'NYR',
//       '2023-07-16T00:00:00Z': 'NYR',
//       '2023-07-17T00:00:00Z': 'NYR',
//       '2023-07-18T00:00:00Z': 'NYR',
//       '2023-07-19T00:00:00Z': 'NYR',
//       '2023-07-20T00:00:00Z': 'NYR',
//       '2023-07-21T00:00:00Z': 'NYR',
//       '2023-07-22T00:00:00Z': 'NYR',
//       '2023-07-23T00:00:00Z': 'NYR',
//       '2023-07-24T00:00:00Z': 'NYR',
//       '2023-07-25T00:00:00Z': 'NYR',
//       '2023-07-26T00:00:00Z': 'NYR',
//       '2023-07-27T00:00:00Z': 'NYR',
//       '2023-07-28T00:00:00Z': 'NYR',
//       '2023-07-29T00:00:00Z': 'NYR',
//       '2023-07-30T00:00:00Z': 'NYR',
//       '2023-07-31T00:00:00Z': 'NYR',
//     },
//     campsite_id: '2877',
//     campsite_reserve_type: 'Site-Specific',
//     campsite_rules: {
//       reservationWindow: {
//         description: '',
//         end_date: '0001-01-01T00:00:00Z',
//         secondary_value: '',
//         start_date: '0001-01-01T00:00:00Z',
//         units: 'Days',
//         value: 7,
//       },
//     },
//     campsite_type: 'STANDARD NONELECTRIC',
//     capacity_rating: '',
//     loop: 'LOOP D',
//     max_num_people: 6,
//     min_num_people: 1,
//     quantities: {},
//     site: 'D003',
//     supplemental_camping: null,
//     type_of_use: 'Overnight',
//   },
//   '2878': {
//     availabilities: {
//       '2023-07-01T00:00:00Z': 'Reserved',
//       '2023-07-02T00:00:00Z': 'Reserved',
//       '2023-07-03T00:00:00Z': 'Reserved',
//       '2023-07-04T00:00:00Z': 'NYR',
//       '2023-07-05T00:00:00Z': 'NYR',
//       '2023-07-06T00:00:00Z': 'NYR',
//       '2023-07-07T00:00:00Z': 'NYR',
//       '2023-07-08T00:00:00Z': 'NYR',
//       '2023-07-09T00:00:00Z': 'NYR',
//       '2023-07-10T00:00:00Z': 'NYR',
//       '2023-07-11T00:00:00Z': 'NYR',
//       '2023-07-12T00:00:00Z': 'NYR',
//       '2023-07-13T00:00:00Z': 'NYR',
//       '2023-07-14T00:00:00Z': 'NYR',
//       '2023-07-15T00:00:00Z': 'NYR',
//       '2023-07-16T00:00:00Z': 'NYR',
//       '2023-07-17T00:00:00Z': 'NYR',
//       '2023-07-18T00:00:00Z': 'NYR',
//       '2023-07-19T00:00:00Z': 'NYR',
//       '2023-07-20T00:00:00Z': 'NYR',
//       '2023-07-21T00:00:00Z': 'NYR',
//       '2023-07-22T00:00:00Z': 'NYR',
//       '2023-07-23T00:00:00Z': 'NYR',
//       '2023-07-24T00:00:00Z': 'NYR',
//       '2023-07-25T00:00:00Z': 'NYR',
//       '2023-07-26T00:00:00Z': 'NYR',
//       '2023-07-27T00:00:00Z': 'NYR',
//       '2023-07-28T00:00:00Z': 'NYR',
//       '2023-07-29T00:00:00Z': 'NYR',
//       '2023-07-30T00:00:00Z': 'NYR',
//       '2023-07-31T00:00:00Z': 'NYR',
//     },
//     campsite_id: '2878',
//     campsite_reserve_type: 'Site-Specific',
//     campsite_rules: {
//       reservationWindow: {
//         description: '',
//         end_date: '0001-01-01T00:00:00Z',
//         secondary_value: '',
//         start_date: '0001-01-01T00:00:00Z',
//         units: 'Days',
//         value: 7,
//       },
//     },
//     campsite_type: 'STANDARD NONELECTRIC',
//     capacity_rating: '',
//     loop: 'LOOP D',
//     max_num_people: 6,
//     min_num_people: 1,
//     quantities: {},
//     site: 'D004',
//     supplemental_camping: null,
//     type_of_use: 'Overnight',
//   },
//   '2879': {
//     availabilities: {
//       '2023-07-01T00:00:00Z': 'Reserved',
//       '2023-07-02T00:00:00Z': 'Reserved',
//       '2023-07-03T00:00:00Z': 'Reserved',
//       '2023-07-04T00:00:00Z': 'Reserved',
//       '2023-07-05T00:00:00Z': 'NYR',
//       '2023-07-06T00:00:00Z': 'NYR',
//       '2023-07-07T00:00:00Z': 'NYR',
//       '2023-07-08T00:00:00Z': 'NYR',
//       '2023-07-09T00:00:00Z': 'NYR',
//       '2023-07-10T00:00:00Z': 'NYR',
//       '2023-07-11T00:00:00Z': 'NYR',
//       '2023-07-12T00:00:00Z': 'NYR',
//       '2023-07-13T00:00:00Z': 'NYR',
//       '2023-07-14T00:00:00Z': 'NYR',
//       '2023-07-15T00:00:00Z': 'NYR',
//       '2023-07-16T00:00:00Z': 'NYR',
//       '2023-07-17T00:00:00Z': 'NYR',
//       '2023-07-18T00:00:00Z': 'NYR',
//       '2023-07-19T00:00:00Z': 'NYR',
//       '2023-07-20T00:00:00Z': 'NYR',
//       '2023-07-21T00:00:00Z': 'NYR',
//       '2023-07-22T00:00:00Z': 'NYR',
//       '2023-07-23T00:00:00Z': 'NYR',
//       '2023-07-24T00:00:00Z': 'NYR',
//       '2023-07-25T00:00:00Z': 'NYR',
//       '2023-07-26T00:00:00Z': 'NYR',
//       '2023-07-27T00:00:00Z': 'NYR',
//       '2023-07-28T00:00:00Z': 'NYR',
//       '2023-07-29T00:00:00Z': 'NYR',
//       '2023-07-30T00:00:00Z': 'NYR',
//       '2023-07-31T00:00:00Z': 'NYR',
//     },
//     campsite_id: '2879',
//     campsite_reserve_type: 'Site-Specific',
//     campsite_rules: {
//       reservationWindow: {
//         description: '',
//         end_date: '0001-01-01T00:00:00Z',
//         secondary_value: '',
//         start_date: '0001-01-01T00:00:00Z',
//         units: 'Days',
//         value: 7,
//       },
//     },
//     campsite_type: 'STANDARD NONELECTRIC',
//     capacity_rating: '',
//     loop: 'LOOP D',
//     max_num_people: 6,
//     min_num_people: 1,
//     quantities: {},
//     site: 'D005',
//     supplemental_camping: null,
//     type_of_use: 'Overnight',
//   },
//   '2880': {
//     availabilities: {
//       '2023-07-01T00:00:00Z': 'Reserved',
//       '2023-07-02T00:00:00Z': 'Reserved',
//       '2023-07-03T00:00:00Z': 'Reserved',
//       '2023-07-04T00:00:00Z': 'Reserved',
//       '2023-07-05T00:00:00Z': 'Reserved',
//       '2023-07-06T00:00:00Z': 'Reserved',
//       '2023-07-07T00:00:00Z': 'Reserved',
//       '2023-07-08T00:00:00Z': 'Reserved',
//       '2023-07-09T00:00:00Z': 'Reserved',
//       '2023-07-10T00:00:00Z': 'Reserved',
//       '2023-07-11T00:00:00Z': 'NYR',
//       '2023-07-12T00:00:00Z': 'NYR',
//       '2023-07-13T00:00:00Z': 'NYR',
//       '2023-07-14T00:00:00Z': 'NYR',
//       '2023-07-15T00:00:00Z': 'NYR',
//       '2023-07-16T00:00:00Z': 'NYR',
//       '2023-07-17T00:00:00Z': 'NYR',
//       '2023-07-18T00:00:00Z': 'NYR',
//       '2023-07-19T00:00:00Z': 'NYR',
//       '2023-07-20T00:00:00Z': 'NYR',
//       '2023-07-21T00:00:00Z': 'NYR',
//       '2023-07-22T00:00:00Z': 'NYR',
//       '2023-07-23T00:00:00Z': 'NYR',
//       '2023-07-24T00:00:00Z': 'NYR',
//       '2023-07-25T00:00:00Z': 'NYR',
//       '2023-07-26T00:00:00Z': 'NYR',
//       '2023-07-27T00:00:00Z': 'NYR',
//       '2023-07-28T00:00:00Z': 'NYR',
//       '2023-07-29T00:00:00Z': 'NYR',
//       '2023-07-30T00:00:00Z': 'NYR',
//       '2023-07-31T00:00:00Z': 'NYR',
//     },
//     campsite_id: '2880',
//     campsite_reserve_type: 'Site-Specific',
//     campsite_rules: {
//       reservationWindow: {
//         description: '',
//         end_date: '0001-01-01T00:00:00Z',
//         secondary_value: '',
//         start_date: '0001-01-01T00:00:00Z',
//         units: 'Days',
//         value: 7,
//       },
//     },
//     campsite_type: 'STANDARD NONELECTRIC',
//     capacity_rating: '',
//     loop: 'LOOP D',
//     max_num_people: 6,
//     min_num_people: 1,
//     quantities: {},
//     site: 'D006',
//     supplemental_camping: null,
//     type_of_use: 'Overnight',
//   },
//   '2881': {
//     availabilities: {
//       '2023-07-01T00:00:00Z': 'Reserved',
//       '2023-07-02T00:00:00Z': 'Reserved',
//       '2023-07-03T00:00:00Z': 'Reserved',
//       '2023-07-04T00:00:00Z': 'Reserved',
//       '2023-07-05T00:00:00Z': 'NYR',
//       '2023-07-06T00:00:00Z': 'NYR',
//       '2023-07-07T00:00:00Z': 'NYR',
//       '2023-07-08T00:00:00Z': 'NYR',
//       '2023-07-09T00:00:00Z': 'NYR',
//       '2023-07-10T00:00:00Z': 'NYR',
//       '2023-07-11T00:00:00Z': 'NYR',
//       '2023-07-12T00:00:00Z': 'NYR',
//       '2023-07-13T00:00:00Z': 'NYR',
//       '2023-07-14T00:00:00Z': 'NYR',
//       '2023-07-15T00:00:00Z': 'NYR',
//       '2023-07-16T00:00:00Z': 'NYR',
//       '2023-07-17T00:00:00Z': 'NYR',
//       '2023-07-18T00:00:00Z': 'NYR',
//       '2023-07-19T00:00:00Z': 'NYR',
//       '2023-07-20T00:00:00Z': 'NYR',
//       '2023-07-21T00:00:00Z': 'NYR',
//       '2023-07-22T00:00:00Z': 'NYR',
//       '2023-07-23T00:00:00Z': 'NYR',
//       '2023-07-24T00:00:00Z': 'NYR',
//       '2023-07-25T00:00:00Z': 'NYR',
//       '2023-07-26T00:00:00Z': 'NYR',
//       '2023-07-27T00:00:00Z': 'NYR',
//       '2023-07-28T00:00:00Z': 'NYR',
//       '2023-07-29T00:00:00Z': 'NYR',
//       '2023-07-30T00:00:00Z': 'NYR',
//       '2023-07-31T00:00:00Z': 'NYR',
//     },
//     campsite_id: '2881',
//     campsite_reserve_type: 'Site-Specific',
//     campsite_rules: {
//       reservationWindow: {
//         description: '',
//         end_date: '0001-01-01T00:00:00Z',
//         secondary_value: '',
//         start_date: '0001-01-01T00:00:00Z',
//         units: 'Days',
//         value: 7,
//       },
//     },
//     campsite_type: 'STANDARD NONELECTRIC',
//     capacity_rating: '',
//     loop: 'LOOP D',
//     max_num_people: 6,
//     min_num_people: 1,
//     quantities: {},
//     site: 'D007',
//     supplemental_camping: null,
//     type_of_use: 'Overnight',
//   },
//   count: 192,
// };