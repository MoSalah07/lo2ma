// The mock's demo data, written as the backend's seed (backend/seed/*.json), so the real API answers with the same
// places and menus as the mock, and the end-to-end tests pass on both. `--check` fails while a file is out of
// date; the web app's `npm test` runs it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// The app imports its own files without an extension; this lets Node find them.
register('./resolve-ts.mjs', import.meta.url);
const { districts, places, suggestedPlaces } = await import('../src/mocks/data/places.ts');
const { menu, restaurants } = await import('../src/mocks/data/restaurants.ts');
const { foods } = await import('../src/mocks/data/foods.ts');
const { estimateDish } = await import('../src/mocks/engine/estimate.ts');
const { companies, seedCoupons } = await import('../src/mocks/data/admin.ts');

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const seedPlaces = [
  ...places.map(({ id, name, area, point }) => {
    const rank = suggestedPlaces.findIndex((place) => place.id === id);
    return {
      id,
      kind: 'building',
      name,
      area,
      point,
      ...(rank >= 0 && { suggestedRank: rank + 1 }),
    };
  }),
  ...districts.map(({ name, area, point }) => ({
    id: `district-${slug(name.en)}`,
    kind: 'district',
    name,
    area,
    point,
  })),
];

// The mock's restaurants only say how far they are from the Smart Village. The backend measures from each user's
// workplace, so each one gets a point that far from the village, every one in another direction (the golden angle
// keeps them apart), rounded to about a meter.
const ANCHOR = districts.find((district) => district.name.en === 'Smart Village').point;
const EARTH_RADIUS_METERS = 6_371_000;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians * 180) / Math.PI;
const round5 = (value) => Math.round(value * 1e5) / 1e5;

function pointAway(from, meters, bearing) {
  const distance = meters / EARTH_RADIUS_METERS;
  const lat = toRadians(from.lat);
  const lng = toRadians(from.lng);
  const toLat = Math.asin(
    Math.sin(lat) * Math.cos(distance) + Math.cos(lat) * Math.sin(distance) * Math.cos(bearing),
  );
  const toLng =
    lng +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
      Math.cos(distance) - Math.sin(lat) * Math.sin(toLat),
    );
  return { lat: round5(toDegrees(toLat)), lng: round5(toDegrees(toLng)) };
}

const seedRestaurants = restaurants.map(
  ({ id, name, distanceKm, etaMinutes, deliveryFee }, index) => ({
    id,
    name,
    point: pointAway(ANCHOR, distanceKm * 1000, index * GOLDEN_ANGLE),
    etaMinutes,
    deliveryFee,
  }),
);

const positions = new Map();
const seedDishes = menu.map((dish) => {
  const position = (positions.get(dish.restaurantId) ?? 0) + 1;
  positions.set(dish.restaurantId, position);
  return {
    id: dish.id,
    restaurantId: dish.restaurantId,
    position,
    name: dish.name,
    role: dish.role,
    price: dish.price,
    kcal: dish.kcal,
    kcalSource: dish.kcalSource,
    ...(dish.kcalRange && { kcalRange: dish.kcalRange }),
    macros: dish.macros,
    contains: dish.contains,
    // «حسبناها ازاي»: the foods of an estimated dish. A dish the restaurant published has none.
    lines: dish.kcalSource === 'ai' ? estimateDish(dish.recipe, dish.kcal).lines : [],
  };
});

const seedFoods = Object.entries(foods).map(
  ([id, { name, kcal, protein, carbs, fat, spread }]) => ({
    id,
    name,
    kcal,
    protein,
    carbs,
    fat,
    spread,
  }),
);

// A coupon names its company by id, as the admin form sends it. Its status is worked out on the server from the
// date and the uses; only a pause is kept.
const coupons = seedCoupons.map(({ audience, used, status, ...terms }) => ({
  ...terms,
  audience:
    audience.type === 'company' ? { type: 'company', companyId: audience.company.id } : audience,
  used,
  paused: status === 'paused',
}));

const outputs = {
  'places.json': seedPlaces,
  'foods.json': seedFoods,
  'restaurants.json': seedRestaurants,
  'dishes.json': seedDishes,
  'companies.json': companies,
  'coupons.json': coupons,
};

const target = (file) => fileURLToPath(new URL(`../../../backend/seed/${file}`, import.meta.url));
const render = (data) => `${JSON.stringify(data, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const stale = Object.entries(outputs).filter(([file, data]) => {
    const path = target(file);
    return !existsSync(path) || readFileSync(path, 'utf8') !== render(data);
  });
  if (stale.length) {
    console.error(
      `backend/seed is out of date (${stale.map(([file]) => file).join(', ')}). Run: npm run export:seed -w @lo2ma/web`,
    );
    process.exit(1);
  }
  console.log('backend/seed matches the mock data.');
} else {
  for (const [file, data] of Object.entries(outputs)) {
    mkdirSync(dirname(target(file)), { recursive: true });
    writeFileSync(target(file), render(data));
    console.log(`✓ backend/seed/${file}`);
  }
}
