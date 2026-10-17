import { z } from 'zod';
import { localizedTextSchema } from './common.ts';

/** A point on the earth, in degrees (WGS 84, what GPS and every map use). */
export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof geoPointSchema>;

/** A place the location search knows: an office building, a business park or a district. */
export const placeSchema = z.object({
  id: z.string(),
  name: localizedTextSchema,
  /** The district and city under the name: «أبو رواش، الجيزة». */
  area: localizedTextSchema,
  point: geoPointSchema,
});
export type Place = z.infer<typeof placeSchema>;

/** What is at a point on the map: the nearest named place, and whether Lo2ma delivers there. */
export const pointLookupSchema = z.object({
  name: localizedTextSchema,
  area: localizedTextSchema,
  inServiceArea: z.boolean(),
});
export type PointLookup = z.infer<typeof pointLookupSchema>;
