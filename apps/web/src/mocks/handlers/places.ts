import { geoPointSchema, isInServiceArea, type PointLookup } from '@lo2ma/core';
import { http, HttpResponse } from 'msw';
import { nameAt, searchPlaces, suggestedPlaces } from '../data/places';
import { fail, route } from './respond';

/** The location search: what to suggest, what matches a query, and what is at a point on the map. */
export const placeHandlers = [
  http.get(route('/places/suggested'), () => HttpResponse.json(suggestedPlaces)),

  http.get(route('/places/search'), ({ request }) => {
    const query = new URL(request.url).searchParams.get('q') ?? '';
    return HttpResponse.json(searchPlaces(query));
  }),

  http.get(route('/places/reverse'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const point = geoPointSchema.safeParse({
      lat: Number(params.get('lat')),
      lng: Number(params.get('lng')),
    });
    if (!point.success || !params.has('lat') || !params.has('lng'))
      return fail(400, 'invalid_point');
    const { name, area } = nameAt(point.data);
    const lookup: PointLookup = { name, area, inServiceArea: isInServiceArea(point.data) };
    return HttpResponse.json(lookup);
  }),
];
