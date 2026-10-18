# Lo2ma web app

The customer app, the landing page and the admin dashboard, in one Next.js App Router project. Arabic (right to
left) is the default at `/ar`, English is at `/en`, and both come in light and dark.

Until the backend exists, every `/api/*` request is answered in the browser by a mock API (MSW). The mock is also
the contract: its handlers are what the FastAPI service has to implement, and their tests pin it.

- [Screens](#screens)
- [Folder structure](#folder-structure)
- [How data flows](#how-data-flows)
- [Text, languages and right to left](#text-languages-and-right-to-left)
- [Design system and layout](#design-system-and-layout)
- [Voice](#voice)
- [Choosing a location](#choosing-a-location)
- [3D](#3d)
- [Conventions](#conventions)
- [Testing](#testing)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [Deploying to Vercel](#deploying-to-vercel)

## Screens

Every path below lives under the locale, for example `/ar/chat` or `/en/chat`.

| Path                      | Screen                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `/`                       | Landing page: a koshari photo with real ingredients floating around it in 3D              |
| `/onboarding`             | First run: workplace on a map, break time, daily budget, calorie limit and foods to avoid |
| `/chat`                   | The chat: replies stream in word by word, then the meal cards with their bills            |
| `/voice`                  | A voice call with live captions; the meal is picked with a button                         |
| `/meals/[id]`             | A suggestion in detail: the dishes, the bill, the calories and their source               |
| `/checkout/[id]`          | The bill, the delivery time before the break, the payment method and «confirm and pay»    |
| `/orders`, `/orders/[id]` | Past orders, and one order's timeline as it moves along                                   |
| `/plan`                   | Next week's plan (swap any day, confirm and pay once), then the confirmed week day by day |
| `/account`                | Preferences, language, theme and sign-out                                                 |
| `/sign-in`                | One-time code by phone or email; guests meet it as a sheet when they pay                  |
| `/admin/sign-in`          | The admin's own sign-in: password, then an authenticator code                             |
| `/admin`                  | Overview: orders, revenue, on-time rate, AI cost per order, charts and the latest orders  |
| `/admin/orders`           | Orders with filters kept in the URL, paging and CSV export                                |
| `/admin/coupons`          | Coupons, with the minimum order enforced                                                  |
| `/admin/agent`            | The agent log: every step of every conversation, and who confirmed the order              |

Any other path shows a localized 404 page: an empty copper pot, in 3D. After paying or confirming a week, a short
celebration plays before the next screen.

## Folder structure

```text
src/
  app/[locale]/        the root layout (lang and dir on <html>), then the route groups:
    (marketing)/       the landing page
    (app)/             the phone screens; (app)/(tabs) are the ones with the tab bar
    admin/             the desktop dashboard: sign-in, and (dashboard) behind the admin session
  features/<feature>/  one folder per feature: its screen, its pieces and its api.ts (TanStack Query hooks)
                       account · admin · auth · chat · checkout · landing · meal · onboarding · orders · plan ·
                       prefs · tracking · voice
  components/          shared UI used by more than one feature; components/ui is the base kit
                       (Button, IconButton, Chip, Badge, Card, Field, Sheet, Meter…); components/three is the 3D
  lib/                 api() and ApiError, the SSE reader, the mocking switch, audio helpers, small utilities
  mocks/               MSW: seed data (30 fictional restaurants), a mock "agent", and handlers = the API contract
  i18n/                next-intl routing, request config and locale-aware navigation
  proxy.ts             next-intl proxy (Next 16's name for middleware): / goes to /ar
e2e/                   Playwright journeys and axe accessibility scans
scripts/               Lighthouse and README screenshots
```

## How data flows

- **One way to call the API.** Every request goes through `api()` in `src/lib/api.ts`. It validates the response
  with the zod schema from `@lo2ma/core` and turns any non-2xx response into an `ApiError` carrying the server's
  `code` (`day_locked`, `no_speech`…), which the screens turn into a message the user understands.
- **Server data lives in TanStack Query**, one `api.ts` per feature. Local UI state stays in React state.
  Zustand holds only what must outlive a screen: the chat conversation, which the voice call shares.
- **The chat streams.** `POST /api/chat` answers with server-sent events (`token`, then `suggestions`, then
  `done`, or `error`), validated event by event.
- **Money is in piasters** everywhere and only becomes «150 ج» / «EGP 150» through `formatMoney`.
- **The mock API runs in the browser.** Its code is loaded on the first request, and its data sits in local
  storage so it survives a reload. Set `NEXT_PUBLIC_API_MOCKING=disabled` to call the real backend instead:
  `next.config.ts` then forwards `/api/*` to it (`API_URL`), so the browser still talks to this origin only (the
  session cookie stays first-party, and there is no CORS). Nothing else changes.

## Text, languages and right to left

- All user-facing text lives in `packages/i18n` (`ar.json` is the source of truth; `en.json` must have the same
  keys, which a test and the type checker enforce). ICU syntax handles values, rich text and Arabic plurals.
- Text is read in Server Components. Messages are not sent to the browser as a whole: a client component gets
  its strings as props, and a large client island (the chat, the call) gets only its own namespaces.
- `lang` and `dir` are set once, on `<html>`, from the locale. Components use only logical CSS (`ms-`, `pe-`,
  `start-`, `text-start`), directional icons flip with `rtl:rotate-180`, and names that may mix directions sit in
  `<bdi>`.
- Digits are 0–9 in both languages, times are 12-hour without a suffix («1:30»), and the week runs Sunday to
  Thursday. Month names come from `Intl`; the Egyptian weekday names are in the messages.

## Design system and layout

- Colors, radii, spacing, type and shadows come from `packages/tokens`, which generates the Tailwind theme.
  Tailwind's default colors, radii, font sizes and shadows are turned off, so only the semantic utilities exist:
  `bg-surface`, `text-ink`, `text-body-md`, `rounded-26`, `shadow-card`.
- **Text comes in roles**, named after Material 3's type scale (`packages/tokens/src/typography.ts`): `display-*`
  for the landing's main heading, `headline-*` for screen titles and big numbers, `title-*` for sheets, sections
  and cards, `body-*`, `label-*` and `caption`. One class sets the size, the line height and the weight
  (`text-title-lg`); a screen can still change the weight or the line height on top. Changing a role in that file
  changes every screen, and ESLint refuses a raw size like `text-15`.
- **Corners are roles** (`packages/tokens/src/radius.ts`): `rounded-tag` (6, badges), `rounded-control` (12,
  buttons, fields, chips), `rounded-card` (16, cards, notices, bubbles) and `rounded-panel` (24, sheets, dialogs,
  floating bars). Circles use `rounded-full`. ESLint refuses a raw radius like `rounded-26`.
- **Controls have three heights** (`h-control-sm/md/lg`: 36, 44, 48). One smaller than a fingertip adds `hit`, an
  invisible 44 px tap area around it.
- **Elevation is one hairline plus a soft shadow** (`shadow-card`, `shadow-float`, `shadow-glass`, `shadow-sheet`).
  A filled button is raised by `shadow-button` and glows with `shadow-glow` under the pointer; a field shows a
  brand-colored border and halo while you type.
- **Wider than the app's column** (the `app:` breakpoint, 480 px), a full-screen panel becomes a card in the middle,
  at most `h-dialog` (640 px) tall: the location picker does this.
- Layout is tokens too. Widths: `max-w-app` (480, the app screens, bars and sheets), `max-w-site` (1280, the
  landing page), `max-w-admin` (1440) and `max-w-form` (440, a lone form card). Every screen uses one side gutter
  (`px-gutter`, 20) through `<Screen>` and `<ScreenHeader>` (`src/components/screen.tsx`), so no page sets its own
  padding or width.
- Light and dark switch through `next-themes`; contrast is at least 4.5:1 in both, which a test checks.

## Voice

- **Dictation** (the mic in the message box): the browser records with `MediaRecorder`, the waveform follows the
  loudness, and `POST /api/chat/transcribe` (multipart `audio` + `locale`) writes it down. The text lands in the
  box for the user to check; nothing is sent until they press send. Recordings under a second never leave the
  browser, and recording stops on its own at a minute.
- **The call** (`/voice`): a turn ends after 1.2 seconds of quiet or a tap on the orb, its words go to the agent,
  and the reply is read out with the browser's own voice for now. Muting turns the microphone's tracks off and
  throws the current turn away, so nothing said while muted is ever sent. The real pipeline (Egyptian
  speech-to-text, the agent, Egyptian text-to-speech) replaces the browser's voice later; the screen only sees a
  small state machine (`src/features/voice/session.ts`), so it stays the same.
- Neither can confirm or pay.

## Choosing a location

The workplace is picked on a real map, the way delivery apps do it (`src/features/location`):

- **The map moves under a fixed pin.** When it stops, `GET /places/reverse` names what is under the pin (a
  building, or else the district) and says whether Lo2ma delivers there; outside the service area the confirm
  button stays off. A search over the map finds buildings and districts in either language, and «my location»
  asks the browser, only when tapped. The user can add notes for the courier.
- **MapLibre GL JS with OpenFreeMap**: free OpenStreetMap vector tiles, no key, no limits. The style is our own
  (`map-style.ts`), built from the map colors in `packages/tokens`, so the map changes with the theme and names
  places in the page's language. MapLibre shapes Arabic itself.
- **Loaded only when the picker opens** (`next/dynamic`), and preloaded when the field is hovered or focused, so
  onboarding stays light. MapLibre's web worker is copied into `public/vendor/` before `dev` and `build`
  (`scripts/vendor.mjs`), under its version, so it loads from our own origin.
- **No map, no dead end.** Without WebGL the picker says so, and the search and «my location» still choose the
  point. The end-to-end tests serve empty tiles, so they never depend on the network.

## 3D

The landing page, the 404 page and the celebration after paying use React Three Fiber scenes of real, scanned food
from Poly Haven (CC0), compressed with gltf-transform (`npm run models`). `SceneCanvas` lights them like a food
shoot and renders them with Khronos PBR Neutral tone mapping, which keeps their colors as scanned. The landing's
pieces are sized and placed from what the camera sees at their depth (`visibleHalf`), so none is cut off on any
screen. `LazyScene` (`src/components/three/lazy-scene.tsx`) decides where the scenes run:

- The library is loaded with `next/dynamic` and `ssr: false`, so it never enters the chat or checkout bundles.
- A still picture shows on the server, with reduced motion, on devices without WebGL 2 or with little memory, and
  when `PerformanceMonitor` reports a falling frame rate. `AdaptiveDpr` lowers the resolution first.
- The landing scene waits until the page has settled (the first interaction, or a few quiet seconds), and every
  scene stops drawing while it is scrolled out of view.
- The scenes are decorative: they are hidden from screen readers and all the important text stays in HTML.

## Search engines and AI assistants

Everything lives in `src/lib/seo/` and is built from the same messages and tokens as the pages, so it never drifts
from what people read.

- **Only the landing page is listed**, in Arabic and English (`publicPaths` in `site.ts`). Every other screen is
  the app itself and gets `noindex` from the locale layout, so a new screen stays out of search results unless it
  asks. The sitemap lists exactly `publicPaths`, and a page can use `publicPageMetadata` only for one of them.
- **Every listed page** has a canonical address, the same page in the other language by region (`ar-EG`, `en-EG`,
  and `x-default` to Arabic), a large link preview per language (`public/og/<locale>.jpg`), and Google's large
  image and full snippet.
- **Structured data** (JSON-LD, typed with `schema-dts`): the organization, the website and the web app as one
  linked graph, written from the landing page's own text (`homeGraph`, `<JsonLd>`).
- **AI assistants.** `robots.txt` welcomes the AI crawlers by name, both the ones that search for an answer
  (OAI-SearchBot, Claude-SearchBot, PerplexityBot) and the ones that train models (GPTBot, ClaudeBot,
  Google-Extended, CCBot). `/llms.txt` gives the site in plain Markdown, in English and Arabic, from the same
  messages as the page. ChatGPT search and Copilot draw on Bing's index and Gemini on Google's, so being listed
  in both (see the deployment steps) matters most.
- **Previews never compete with production.** Canonical links always point to the production domain, and a
  Vercel preview answers `Disallow: /` in `robots.txt`.
- **Lighthouse's SEO score** is 100 on the landing page. The app screens lose its "blocked from indexing" check on
  purpose: they are `noindex`.
- **The pictures** (the preview cards and the app icons) are drawn by Chrome from the tokens, the messages and
  the brand mark: `npm run images`. Chrome shapes Arabic correctly, which `next/og` does not fully do yet.

## Conventions

ESLint enforces most of these, with zero warnings allowed.

1. **Reuse without over-abstraction.** Anything that repeats becomes a shared component, hook or function;
   nothing is abstracted for a single use.
2. **One source of truth.** No color value and no user-facing string inside a component; even unit words (ج,
   EGP, kcal) are messages, and `packages/core` fills in the numbers. Money, calorie and time math and every
   business rule live in `packages/core`.
3. **Small files, one job each,** grouped by feature.
4. **Performance.** Server Components by default, `"use client"` only on interactive leaves. The React Compiler
   memoizes, so there is no manual `useMemo`, `useCallback` or `memo`. `next/font`, `next/image` and
   `next/dynamic` for anything heavy.
5. **Right to left.** Logical utilities only; physical ones (`ml-`, `pl-`, `left-`, `text-left`…) fail the lint.
6. **Accessibility.** Semantic HTML, a label for every input, an `aria-label` for every icon-only button, hit
   targets of at least 44 px, 4.5:1 contrast and `prefers-reduced-motion` respected.
7. **Types.** TypeScript strict and no `any`. Shared packages use only erasable TypeScript and no browser or Node
   globals, because they will also run on mobile.
8. **Navigation** uses `Link`, `redirect`, `usePathname` and `useRouter` from `@/i18n/navigation`, so the locale
   is never lost.

## Testing

- **Unit tests** (Vitest + Testing Library, jsdom): the shared components, the hooks with fake microphones and
  timers, the voice call's state machine, the SSE reader, and the mock API contract (`handlers.test.ts`).
- **End to end** (Playwright, the installed Chrome): the main journeys (onboarding, chat, guest sign-in at
  checkout, paying, tracking; the weekly plan through a fixed clock; dictation and the call through Chrome's fake
  microphone; the admin dashboard; the 404 page) run in four projects: Arabic and English, light and dark. Every
  screen also gets an axe scan, and serious issues fail the run. So does any error in the browser console: an
  uncaught exception, a hydration mismatch, anything React reports.
- **Lighthouse** as a phone on the production build, after warming up the server and the browser. It fails under
  90 for performance or accessibility.

## Scripts

Run from the repo root.

| Command                             | What it does                                                          |
| ----------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                       | development server                                                    |
| `npm run build`                     | production build                                                      |
| `npm run check`                     | typecheck, lint, unit tests and format check for the whole repo       |
| `npm run e2e -w @lo2ma/web`         | Playwright on the production build (run `npm run build` first)        |
| `npm run lighthouse -w @lo2ma/web`  | Lighthouse on the production build                                    |
| `npm run screenshots -w @lo2ma/web` | retakes `docs/screenshots/` from the production build                 |
| `npm run models -w @lo2ma/web`      | downloads the 3D food models and compresses them into `public/models` |
| `npm run images -w @lo2ma/web`      | redraws the link preview cards and the app icons                      |
| `npm run export:seed -w @lo2ma/web` | writes the mock's places into `backend/seed/` for the real API        |

### Environment variables

| Variable                   | Default                      | Effect                                                                |
| -------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_MOCKING`  | (mocks on)                   | `disabled` sends `/api/*` to a real backend instead of the mock API   |
| `API_URL`                  | `http://127.0.0.1:8000`      | where `/api/*` goes when the mocks are off                            |
| `SITE_URL`                 | the Vercel production domain | the site's address for canonical links, the sitemap and link previews |
| `GOOGLE_SITE_VERIFICATION` | (none)                       | the code Google Search Console gives, as a meta tag                   |
| `BING_SITE_VERIFICATION`   | (none)                       | the code Bing Webmaster Tools gives, as a meta tag                    |

## Troubleshooting

**A hydration error in development.** Check your browser extensions first. Some insert their own elements into
the page before React hydrates it (a translator that puts its tooltip first in `<body>` is a common one), so React
finds HTML it didn't render and rebuilds the page in the browser. Open the app in a private window or a profile
without extensions. The theme's script is marked as data when React rebuilds the page, so it never adds a second
warning. The end-to-end tests run in a clean browser and fail on any console error, so a mismatch that comes
from our own code doesn't get past them.

## Deploying to Vercel

The demo needs no backend and no environment variables: the mock API runs in the visitor's browser.

1. Import the repository in Vercel.
2. Set **Root Directory** to `apps/web`. Vercel detects Next.js.
3. Keep **Include files outside the root directory in the Build Step** on, because the shared packages live in
   `packages/`.
4. Leave the install and build commands on their defaults; Vercel installs the npm workspace from the lockfile at
   the repository root. If the build can't find `@lo2ma/*`, set the install command to `cd ../.. && npm install`.
5. Use Node.js 22 or newer.

Each push to `main` then deploys again.

To be found once it is live:

1. If the site has its own domain, set `SITE_URL` to it. Without it, the Vercel production domain is
   used.
2. Add the site to [Google Search Console](https://search.google.com/search-console) and
   [Bing Webmaster Tools](https://www.bing.com/webmasters), put their codes in `GOOGLE_SITE_VERIFICATION` and
   `BING_SITE_VERIFICATION`, redeploy, verify, and submit `/sitemap.xml` in both. Bing's index feeds ChatGPT
   search and Copilot, and Google's feeds Gemini and AI Overviews.
