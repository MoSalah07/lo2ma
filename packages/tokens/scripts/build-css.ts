import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildTokensCss } from '../src/css.ts';

const target = fileURLToPath(new URL('../tokens.css', import.meta.url));
const css = buildTokensCss();

if (process.argv.includes('--check')) {
  const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (current !== css) {
    console.error('tokens.css is out of date. Run: npm run build -w @lo2ma/tokens');
    process.exit(1);
  }
  console.log('tokens.css is up to date.');
} else {
  writeFileSync(target, css);
  console.log('Wrote tokens.css');
}
