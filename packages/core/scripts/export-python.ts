/**
 * Shares packages/core with the Python backend:
 * - backend/app/domain/rules.py: the constants the server enforces, so no number is typed twice.
 * - backend/tests/vectors/*.json: inputs with the TypeScript functions' answers. The Python ports of those
 *   functions must give the same answers (backend/tests/domain).
 *
 * `--check` fails when either is out of date, and `npm test -w @lo2ma/core` runs it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { distanceMeters, isInServiceArea } from '../src/geo.ts';
import { normalizeEgyptMobile } from '../src/phone.ts';
import { foldForSearch, searchWords } from '../src/search.ts';
import {
  ARRIVAL_BUFFER_MINUTES,
  arrivalTimeFor,
  BREAK_TIMES,
  canChangePlanDay,
  MIN_ORDER,
  PLAN_CHANGE_CUTOFF,
  PLAN_SEND_LEAD_MINUTES,
  planChangeDeadline,
  planSendTimeFor,
  SERVICE_AREA,
  SERVICE_FEE,
  SHARED_DELIVERY_FEE,
  VOICE_MAX_BYTES,
  WORKPLACE_DETAILS_MAX,
} from '../src/rules.ts';
import { OTP_LENGTH } from '../src/schemas/auth.ts';
import { FIT_LUNCH_LIMITS } from '../src/schemas/fit.ts';
import type { GeoPoint } from '../src/schemas/location.ts';
import { addMinutes } from '../src/time.ts';

// The server decides by Cairo's clock, so answers that depend on the time of day are worked out there.
process.env.TZ = 'Africa/Cairo';

type Rule = number | string | { readonly [key: string]: Rule };

/** The constants the server enforces, by the file they come from. Add one when the backend needs it. */
const RULES: Record<string, Record<string, Rule>> = {
  'rules.ts': {
    MIN_ORDER,
    SERVICE_FEE,
    SHARED_DELIVERY_FEE,
    ARRIVAL_BUFFER_MINUTES,
    PLAN_CHANGE_CUTOFF,
    PLAN_SEND_LEAD_MINUTES,
    VOICE_MAX_BYTES,
    SERVICE_AREA,
    WORKPLACE_DETAILS_MAX,
  },
  'schemas/fit.ts': { FIT_LUNCH_LIMITS },
  'schemas/auth.ts': { OTP_LENGTH },
};

const upperSnake = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

/** SERVICE_AREA.center.lat → SERVICE_AREA_CENTER_LAT. */
function flatten(name: string, value: Rule): [string, number | string][] {
  return typeof value === 'object'
    ? Object.entries(value).flatMap(([key, inner]) => flatten(`${name}_${upperSnake(key)}`, inner))
    : [[name, value]];
}

function renderRules(): string {
  const sections = Object.entries(RULES).map(([source, rules]) => {
    const lines = Object.entries(rules)
      .flatMap(([name, value]) => flatten(name, value))
      .map(([name, value]) => `${name}: Final = ${JSON.stringify(value)}`);
    return [`# packages/core/src/${source}`, ...lines].join('\n');
  });
  return [
    '"""The rules the server shares with the apps, generated from packages/core.',
    '',
    "Don't edit this file: change packages/core, then run `npm run export:python -w @lo2ma/core`. Its",
    'tests fail while this file is out of date.',
    '"""',
    '',
    'from typing import Final',
    '',
    sections.join('\n\n'),
    '',
  ].join('\n');
}

const at = (lat: number, lng: number): GeoPoint => ({ lat, lng });
const TAHRIR = at(30.0444, 31.2357);
const SMART_VILLAGE = at(30.0712, 31.0175);
const ZAMALEK = at(30.065, 31.225);
const NEW_CAPITAL = at(30.011, 31.74);
const ALEXANDRIA = at(31.2001, 29.9187);
const SIXTH_OF_OCTOBER = at(29.9381, 30.9135);

type Vectors = Record<string, readonly (readonly unknown[])[]>;

/** Each case is [...arguments, answer], so pytest can take them as parameters in order. */
function vectors(): Record<string, Vectors> {
  return {
    clock: {
      add_minutes: (
        [
          ['13:30', -15],
          ['00:10', -30],
          ['23:50', 20],
          ['12:00', 0],
          ['11:59', 1],
          ['00:00', -1441],
        ] as const
      ).map(([time, minutes]) => [time, minutes, addMinutes(time, minutes)]),
    },
    timing: {
      arrival_time_for: [...BREAK_TIMES, '00:05'].map((time) => [time, arrivalTimeFor(time)]),
      plan_send_time_for: ['12:15', '13:15', '11:00', '00:30'].map((time) => [
        time,
        planSendTimeFor(time),
      ]),
      plan_change_deadline: (
        [
          ['12:30', PLAN_CHANGE_CUTOFF],
          ['11:00', PLAN_CHANGE_CUTOFF],
          ['11:30', PLAN_CHANGE_CUTOFF],
          ['10:15', '10:45'],
        ] as const
      ).map(([send, cutoff]) => [send, cutoff, planChangeDeadline(send, cutoff)]),
      // [day, now (UTC), deadline]. Cairo is UTC+3 until 29 October 2026 and UTC+2 after.
      can_change_plan_day: (
        [
          ['2026-10-21', '2026-10-20T09:00:00Z', '11:30'], // a later day
          ['2026-10-20', '2026-10-20T08:20:00Z', '11:30'], // 11:20 in Cairo
          ['2026-10-20', '2026-10-20T08:30:00Z', '11:30'], // 11:30: the deadline itself is too late
          ['2026-10-20', '2026-10-20T08:45:00Z', '11:30'], // still before 11:30 in UTC, not in Cairo
          ['2026-10-19', '2026-10-20T06:00:00Z', '11:30'], // an earlier day
          ['2026-10-20', '2026-10-19T21:30:00Z', '11:30'], // 00:30 on the 20th in Cairo
          ['2026-11-02', '2026-11-02T09:15:00Z', '11:30'], // 11:15 in winter time
          ['2026-11-02', '2026-11-02T08:50:00Z', '10:45'], // an order that goes out before the cutoff
        ] as const
      ).map(([day, now, deadline]) => [
        day,
        now,
        deadline,
        canChangePlanDay(day, new Date(now), deadline),
      ]),
    },
    geo: {
      distance_meters: (
        [
          [TAHRIR, SMART_VILLAGE],
          [TAHRIR, NEW_CAPITAL],
          [TAHRIR, ALEXANDRIA],
          [ZAMALEK, ZAMALEK],
        ] as const
      ).map(([a, b]) => [a.lat, a.lng, b.lat, b.lng, distanceMeters(a, b)]),
      is_in_service_area: [
        TAHRIR,
        SMART_VILLAGE,
        ZAMALEK,
        SIXTH_OF_OCTOBER,
        NEW_CAPITAL,
        ALEXANDRIA,
      ].map((point) => [point.lat, point.lng, isInServiceArea(point)]),
    },
    search: {
      fold_for_search: [
        'القرية الذكية',
        'القريه الذكيه',
        'أحمد إبراهيم آمال ٱلقاهرة',
        'مُحَمَّد',
        'مـــصـر',
        'مستشفى',
        'Smart VILLAGE · Building B7',
        'كايرو فستيفال سيتي · بيزنس بارك',
      ].map((text) => [text, foldForSearch(text)]),
      search_words: ['  القريه   B7 ', 'smart village', '   ', ''].map((query) => [
        query,
        searchWords(query),
      ]),
    },
    phone: {
      normalize_egypt_mobile: [
        '010 1234 5678',
        '+20 10 1234 5678',
        '0020 10 1234 5678',
        '201012345678',
        '1012345678',
        '٠١٠١٢٣٤٥٦٧٨',
        '۰۱۱۵۵۵۵۱۲۳۴',
        '0121-234-5678',
        '0151234 5678',
        '01312345678',
        '0101234567',
        '12345',
        '',
      ].map((input) => [input, normalizeEgyptMobile(input)]),
    },
  };
}

/** JSON with one case per line, so a diff shows which answer changed. */
function renderVectors(functions: Vectors): string {
  const entries = Object.entries(functions).map(([name, cases]) => {
    const lines = cases.map((args) => `    ${JSON.stringify(args)}`).join(',\n');
    return `  ${JSON.stringify(name)}: [\n${lines}\n  ]`;
  });
  return `{\n${entries.join(',\n')}\n}\n`;
}

const backend = (path: string) =>
  fileURLToPath(new URL(`../../../backend/${path}`, import.meta.url));

const outputs: Record<string, string> = {
  [backend('app/domain/rules.py')]: renderRules(),
  ...Object.fromEntries(
    Object.entries(vectors()).map(([module, functions]) => [
      backend(`tests/vectors/${module}.json`),
      renderVectors(functions),
    ]),
  ),
};

if (process.argv.includes('--check')) {
  const stale = Object.entries(outputs).filter(
    ([path, content]) => !existsSync(path) || readFileSync(path, 'utf8') !== content,
  );
  if (stale.length) {
    console.error(
      `Out of date:\n${stale.map(([path]) => `  ${path}`).join('\n')}\nRun: npm run export:python -w @lo2ma/core`,
    );
    process.exit(1);
  }
  console.log('The backend has the current rules and test vectors.');
} else {
  for (const [path, content] of Object.entries(outputs)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    console.log(`Wrote ${path}`);
  }
}
