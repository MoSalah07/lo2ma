import { distanceMeters, type GeoPoint, type LocalizedText, type Place } from '@lo2ma/core';

// The places the demo's location search knows: real office districts and business parks in and around Cairo, at
// approximate points. The backend will use a real geocoder; these only have to behave like one.

const text = (ar: string, en: string): LocalizedText => ({ ar, en });

const giza = text('الجيزة', 'Giza');
const cairo = text('القاهرة', 'Cairo');
const smartVillage = text('طريق مصر إسكندرية الصحراوي، الجيزة', 'Cairo–Alex Desert Road, Giza');

/** Buildings and business parks: what people search for. The first ones are the suggested workplaces. */
export const places: Place[] = [
  {
    id: 'sv-b2',
    name: text('القرية الذكية · مبنى B2', 'Smart Village · Building B2'),
    area: smartVillage,
    point: { lat: 30.0712, lng: 31.0175 },
  },
  {
    id: 'sv-b7',
    name: text('القرية الذكية · مبنى B7', 'Smart Village · Building B7'),
    area: smartVillage,
    point: { lat: 30.0722, lng: 31.016 },
  },
  {
    id: 'sv-b12',
    name: text('القرية الذكية · مبنى B12', 'Smart Village · Building B12'),
    area: smartVillage,
    point: { lat: 30.073, lng: 31.019 },
  },
  {
    id: 'cfc-business-park',
    name: text('كايرو فستيفال سيتي · بيزنس بارك', 'Cairo Festival City · Business Park'),
    area: text('التجمع الخامس، القاهرة الجديدة', 'Fifth Settlement, New Cairo'),
    point: { lat: 30.0287, lng: 31.4086 },
  },
  {
    id: 'maadi-road-9',
    name: text('المعادي · شارع 9', 'Maadi · Road 9'),
    area: text('المعادي، القاهرة', 'Maadi, Cairo'),
    point: { lat: 29.9602, lng: 31.2569 },
  },
  {
    id: 'zamalek-26-july',
    name: text('الزمالك · شارع 26 يوليو', 'Zamalek · 26th of July Street'),
    area: text('الزمالك، القاهرة', 'Zamalek, Cairo'),
    point: { lat: 30.0618, lng: 31.2201 },
  },
  {
    id: 'downtown-talaat-harb',
    name: text('وسط البلد · ميدان طلعت حرب', 'Downtown · Talaat Harb Square'),
    area: text('وسط البلد، القاهرة', 'Downtown, Cairo'),
    point: { lat: 30.0478, lng: 31.2389 },
  },
  {
    id: 'nasr-city-makram-ebeid',
    name: text('مدينة نصر · شارع مكرم عبيد', 'Nasr City · Makram Ebeid Street'),
    area: text('مدينة نصر، القاهرة', 'Nasr City, Cairo'),
    point: { lat: 30.0566, lng: 31.3456 },
  },
  {
    id: 'mohandessin-arab-league',
    name: text('المهندسين · شارع جامعة الدول العربية', 'Mohandessin · Arab League Street'),
    area: text('المهندسين، الجيزة', 'Mohandessin, Giza'),
    point: { lat: 30.0571, lng: 31.2001 },
  },
  {
    id: 'dokki-mesaha',
    name: text('الدقي · ميدان المساحة', 'Dokki · El Mesaha Square'),
    area: text('الدقي، الجيزة', 'Dokki, Giza'),
    point: { lat: 30.0383, lng: 31.2126 },
  },
  {
    id: 'heliopolis-korba',
    name: text('مصر الجديدة · الكوربة', 'Heliopolis · El Korba'),
    area: text('مصر الجديدة، القاهرة', 'Heliopolis, Cairo'),
    point: { lat: 30.0905, lng: 31.3237 },
  },
  {
    id: 'zayed-arkan',
    name: text('الشيخ زايد · أركان بلازا', 'Sheikh Zayed · Arkan Plaza'),
    area: text('الشيخ زايد، الجيزة', 'Sheikh Zayed, Giza'),
    point: { lat: 30.0207, lng: 30.9813 },
  },
  {
    id: 'october-central-axis',
    name: text('6 أكتوبر · المحور المركزي', '6th of October · Central Axis'),
    area: text('6 أكتوبر، الجيزة', '6th of October, Giza'),
    point: { lat: 29.9725, lng: 30.9445 },
  },
  {
    // Outside the service area on purpose: the demo shows «not yet» here.
    id: 'new-capital-cbd',
    name: text('العاصمة الإدارية · حي المال والأعمال', 'New Capital · Central Business District'),
    area: text('العاصمة الإدارية الجديدة', 'New Administrative Capital'),
    point: { lat: 30.011, lng: 31.74 },
  },
];

/** How many places onboarding suggests before anything is typed. */
const SUGGESTED_COUNT = 6;
export const suggestedPlaces = places.slice(0, SUGGESTED_COUNT);

/** Districts, for naming a pin that isn't on a known building. */
const districts: { name: LocalizedText; area: LocalizedText; point: GeoPoint }[] = [
  {
    name: text('القرية الذكية', 'Smart Village'),
    area: giza,
    point: { lat: 30.0717, lng: 31.0167 },
  },
  { name: text('الشيخ زايد', 'Sheikh Zayed'), area: giza, point: { lat: 30.045, lng: 30.988 } },
  { name: text('6 أكتوبر', '6th of October'), area: giza, point: { lat: 29.96, lng: 30.93 } },
  { name: text('الهرم', 'Haram'), area: giza, point: { lat: 30.0131, lng: 31.2089 } },
  { name: text('المهندسين', 'Mohandessin'), area: giza, point: { lat: 30.0571, lng: 31.2001 } },
  { name: text('الدقي', 'Dokki'), area: giza, point: { lat: 30.0383, lng: 31.2126 } },
  { name: text('الزمالك', 'Zamalek'), area: cairo, point: { lat: 30.0618, lng: 31.2201 } },
  { name: text('وسط البلد', 'Downtown'), area: cairo, point: { lat: 30.0478, lng: 31.2389 } },
  { name: text('جاردن سيتي', 'Garden City'), area: cairo, point: { lat: 30.036, lng: 31.231 } },
  { name: text('المعادي', 'Maadi'), area: cairo, point: { lat: 29.9602, lng: 31.2569 } },
  { name: text('مدينة نصر', 'Nasr City'), area: cairo, point: { lat: 30.0566, lng: 31.3456 } },
  { name: text('مصر الجديدة', 'Heliopolis'), area: cairo, point: { lat: 30.0905, lng: 31.3237 } },
  { name: text('شبرا', 'Shubra'), area: cairo, point: { lat: 30.095, lng: 31.245 } },
  { name: text('المقطم', 'Mokattam'), area: cairo, point: { lat: 30.02, lng: 31.3 } },
  { name: text('القاهرة الجديدة', 'New Cairo'), area: cairo, point: { lat: 30.03, lng: 31.47 } },
  { name: text('حلوان', 'Helwan'), area: cairo, point: { lat: 29.85, lng: 31.334 } },
  {
    name: text('العاصمة الإدارية الجديدة', 'New Administrative Capital'),
    area: text('مصر', 'Egypt'),
    point: { lat: 30.02, lng: 31.76 },
  },
];

/** A pin this close to a building is on that building. */
const ON_A_PLACE_METERS = 150;

/** The building under a pin, or else the nearest district: what a reverse geocoder answers. */
export function nameAt(point: GeoPoint): { name: LocalizedText; area: LocalizedText } {
  const nearest = <T extends { point: GeoPoint }>(items: T[]) =>
    items.reduce((best, item) =>
      distanceMeters(point, item.point) < distanceMeters(point, best.point) ? item : best,
    );
  const place = nearest(places);
  if (distanceMeters(point, place.point) <= ON_A_PLACE_METERS) return place;
  return nearest(districts);
}

/**
 * Arabic and English folded the way people type them: no diacritics or tatweel, every alef the same, ى as ي and
 * ة as ه, and lower case. «القريه الذكيه» finds «القرية الذكية».
 */
export function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

/** Places whose name or area contains every word of the query, in either language. */
export function searchPlaces(query: string, limit = 6): Place[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return places
    .filter((place) => {
      const haystack = fold([place.name.ar, place.name.en, place.area.ar, place.area.en].join(' '));
      return words.every((word) => haystack.includes(word));
    })
    .slice(0, limit);
}
