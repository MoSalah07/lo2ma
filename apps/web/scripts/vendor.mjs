// Files the browser must load from our own origin, copied out of node_modules into public/vendor/ and named with
// their version, so a new release never mixes with a cached old one. Today that is MapLibre's web worker, which
// the map starts on its own and a bundler can't inline. It runs before `dev` and `build`; git ignores the folder.
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const out = fileURLToPath(new URL('../public/vendor/', import.meta.url));
const maplibre = path.dirname(require.resolve('maplibre-gl/package.json'));
const { version } = JSON.parse(readFileSync(path.join(maplibre, 'package.json'), 'utf8'));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyFileSync(
  path.join(maplibre, 'dist', 'maplibre-gl-worker.mjs'),
  path.join(out, `maplibre-gl-worker-${version}.mjs`),
);
console.log(`✓ public/vendor/maplibre-gl-worker-${version}.mjs`);
