// Downloads the 3D food models from Poly Haven (CC0) and compresses them for the web: meshopt geometry, which
// three.js decodes without fetching anything else, and WebP textures at 512 px, plenty for a model a few hundred
// pixels wide. The results go to public/models/; the downloads are cached in .models-cache/, which git ignores.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Our name → the Poly Haven asset. */
const MODELS = {
  lime: 'food_lime_01',
  pomegranate: 'food_pomegranate_01',
  onion: 'yellow_onion',
  bread: 'hamburger_buns',
  croissant: 'croissant',
  lemon: 'lemon',
  bowl: 'wooden_bowl_02',
};
const RESOLUTION = '1k';
const TEXTURE_SIZE = 512;

const app = fileURLToPath(new URL('..', import.meta.url));
const cache = path.join(app, '.models-cache');
const out = path.join(app, 'public', 'models');

/** The CLI's own entry file: the package exports only its API, so it is found from there. */
function cliPath() {
  let dir = path.dirname(createRequire(import.meta.url).resolve('@gltf-transform/cli'));
  while (!existsSync(path.join(dir, 'bin', 'cli.js'))) dir = path.dirname(dir);
  return path.join(dir, 'bin', 'cli.js');
}

async function download(url, file) {
  if (existsSync(file)) return;
  const response = await fetch(url, { headers: { 'User-Agent': 'lo2ma-models-script' } });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
}

const cli = cliPath();
mkdirSync(out, { recursive: true });

for (const [name, asset] of Object.entries(MODELS)) {
  const response = await fetch(`https://api.polyhaven.com/files/${asset}`);
  if (!response.ok) throw new Error(`${response.status} for ${asset}`);
  const { gltf } = (await response.json()).gltf[RESOLUTION];
  const dir = path.join(cache, asset);
  const source = path.join(dir, path.basename(new URL(gltf.url).pathname));
  await download(gltf.url, source);
  for (const [relative, file] of Object.entries(gltf.include)) {
    await download(file.url, path.join(dir, relative));
  }

  const target = path.join(out, `${name}.glb`);
  const result = spawnSync(
    process.execPath,
    [
      cli,
      'optimize',
      source,
      target,
      '--compress',
      'meshopt',
      '--texture-compress',
      'webp',
      '--texture-size',
      String(TEXTURE_SIZE),
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  const before = [source, ...Object.keys(gltf.include).map((relative) => path.join(dir, relative))]
    .map((file) => statSync(file).size)
    .reduce((sum, size) => sum + size, 0);
  console.log(
    `✓ ${name.padEnd(12)} ${Math.round(before / 1024)} KB → ${Math.round(statSync(target).size / 1024)} KB`,
  );
}

// Poly Haven asks nothing in return (CC0), but credits are kept with the files.
writeFileSync(
  path.join(out, 'CREDITS.md'),
  `# 3D models\n\nFrom [Poly Haven](https://polyhaven.com), CC0. Regenerate with \`npm run models -w @lo2ma/web\`.\n\n${Object.entries(
    MODELS,
  )
    .map(([name, asset]) => `- \`${name}.glb\`: [${asset}](https://polyhaven.com/a/${asset})`)
    .join('\n')}\n`,
);
