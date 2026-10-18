// The mock's demo data, written as the backend's seed (backend/seed/*.json), so the real API answers with the same
// places as the mock and the end-to-end tests pass on both. `--check` fails while a file is out of date; the web
// app's `npm test` runs it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { districts, places, suggestedPlaces } from '../src/mocks/data/places.ts';

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

const outputs = {
  'places.json': seedPlaces,
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
