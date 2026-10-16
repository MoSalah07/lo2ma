// Lighthouse on the production build: starts `next start`, audits the main pages as a phone, prints the
// scores and fails when performance or accessibility is under 90. Run `npm run build` first.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const PAGES = ['/ar', '/en', '/ar/chat', '/ar/plan', '/ar/onboarding', '/ar/sign-in'];
const TARGET = 90;
const GATED = ['performance', 'accessibility'];

/** A free port, so the audit never collides with a dev server. */
const freePort = () =>
  new Promise((resolve) => {
    const server = createServer().listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

async function waitFor(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`The server at ${url} did not start`);
}

const port = await freePort();
const base = `http://localhost:${port}`;
const next = spawn(
  process.execPath,
  ['../../node_modules/next/dist/bin/next', 'start', '-p', String(port)],
  {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: 'ignore',
  },
);

let failed = false;
let chrome;
try {
  // Inside the try, so the server never outlives a Chrome that fails to start.
  chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
  await waitFor(`${base}/ar`);
  // One request per page first: a freshly started server loads each route on its first visit, and that cold
  // start isn't what a user of the deployed app sees.
  for (const page of PAGES) await fetch(`${base}${page}`);
  // The same for the browser: in a Chrome that just started, the first page paints late, and Lighthouse then
  // counts every script that began loading before that paint. One audit is thrown away first.
  await lighthouse(`${base}${PAGES[0]}`, {
    port: chrome.port,
    logLevel: 'error',
    onlyCategories: ['performance'],
  });
  for (const page of PAGES) {
    const { lhr } = await lighthouse(`${base}${page}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    const scores = Object.fromEntries(
      Object.entries(lhr.categories).map(([name, category]) => [
        name,
        Math.round(category.score * 100),
      ]),
    );
    const low = GATED.filter((name) => scores[name] < TARGET);
    if (low.length > 0) failed = true;
    const tbt = Math.round(lhr.audits['total-blocking-time'].numericValue);
    const lcp = (lhr.audits['largest-contentful-paint'].numericValue / 1000).toFixed(1);
    console.log(
      `${low.length ? '✗' : '✓'} ${page.padEnd(16)} ${Object.entries(scores)
        .map(([name, score]) => `${name} ${score}`)
        .join(' · ')} · LCP ${lcp}s · TBT ${tbt}ms`,
    );
  }
} finally {
  await chrome?.kill();
  next.kill();
}

if (failed) {
  console.error(`\nSome pages are under ${TARGET} in ${GATED.join(' or ')}.`);
  process.exit(1);
}
