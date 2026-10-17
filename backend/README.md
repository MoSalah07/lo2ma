# Lo2ma backend

> **Status: planned (phase 2 onward).** Nothing here is built yet. The web app already runs against a mock of
> this service, and that mock defines the API described below.

The backend will serve the web and mobile apps, run the agent that picks meals, take payments, and send each day
of a weekly plan to the restaurant on time.

- [Planned stack](#planned-stack)
- [The API contract](#the-api-contract)
- [The agent](#the-agent)
- [Weekly plans and scheduling](#weekly-plans-and-scheduling)
- [Payments](#payments)
- [Voice](#voice)
- [Connecting the web app](#connecting-the-web-app)

## Planned stack

| Concern            | Choice                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| API                | FastAPI with Pydantic models                                                                        |
| Database           | PostgreSQL with PostGIS (distance from the office) and pgvector (searching dishes by meaning)       |
| ORM and migrations | SQLAlchemy 2 and Alembic                                                                            |
| Agent              | A hand-written tool loop on an OpenAI-compatible SDK first, then Pydantic AI with a provider switch |
| Local models       | Ollama for development; the cloud model is chosen by evaluation results                             |
| Tooling            | uv, ruff, pytest; PostgreSQL in Docker for local development                                        |

## The API contract

The web app talks to `/api/*` only, and every response is validated by a zod schema in `packages/core`. The
mock handlers in `apps/web/src/mocks/handlers` answer those requests today, and `handlers.test.ts` pins their
behavior, so the FastAPI service has to return the same shapes, statuses and error codes. Once it exists,
`packages/api-client` will be generated from its OpenAPI schema.

**Shared rules**

- Money is an integer number of piasters, everywhere.
- An error is a non-2xx status with a JSON body `{ "code": "…" }`. The apps turn the code into a message.
- The chat reply is a stream of server-sent events: `token` (words), `suggestions` (the meal cards, with the
  budget used), then `done`, or `error` with a code.
- A workplace is a point on the map (`lat`, `lng`), its name and district in both languages, and the user's notes
  for the courier. `PUT /prefs` refuses a point outside the service area (`SERVICE_AREA` in `packages/core`, Greater
  Cairo for now) with `422 outside_service_area`. Search should fold Arabic the way people type it (no diacritics,
  every alef alike, ى as ي, ة as ه); a real geocoder (Photon or Nominatim on OpenStreetMap) can stand behind
  `/places`.
- **The agent never confirms or pays.** It has no tool for either. Orders are created only by the user's own
  request to `POST /orders` or `POST /plan/confirm`.

**Customer endpoints**

| Method and path                 | Purpose                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `POST /auth/otp`                | send a one-time code to a phone number or an email                                  |
| `POST /auth/verify`             | check the code and start a session                                                  |
| `GET /auth/session`             | the signed-in user, if any                                                          |
| `POST /auth/sign-out`           | end the session                                                                     |
| `GET /places/suggested`         | popular workplaces, shown before anything is typed                                  |
| `GET /places/search?q=`         | places whose name or district matches, in Arabic or English                         |
| `GET /places/reverse?lat=&lng=` | what is at a map point (a building or a district), and whether Lo2ma delivers there |
| `GET /prefs`, `PUT /prefs`      | workplace, break time, budget, calorie limit, foods to avoid                        |
| `POST /chat`                    | a message to the agent; the reply streams back as server-sent events                |
| `POST /chat/transcribe`         | multipart `audio` + `locale` → the words that were said                             |
| `GET /suggestions/:id`          | one suggested meal with its dishes, bill and calories                               |
| `GET /payment-methods`          | the ways to pay                                                                     |
| `GET /orders`, `POST /orders`   | the user's orders; create one from a suggestion (the pay button)                    |
| `GET /orders/:id`               | one order and its timeline                                                          |
| `GET /plan`                     | next week's plan, or the confirmed week with each day's status                      |
| `POST /plan/days/:date/swap`    | another meal for one day, before its cut-off                                        |
| `POST /plan/confirm`            | confirm and pay the whole week                                                      |

**Admin endpoints** (a separate session: password, then an authenticator code)

| Method and path                                                        | Purpose                                             |
| ---------------------------------------------------------------------- | --------------------------------------------------- |
| `POST /admin/auth/sign-in`, `POST /admin/auth/verify`                  | the two sign-in steps                               |
| `GET /admin/auth/session`, `POST /admin/auth/sign-out`                 | the admin session                                   |
| `GET /admin/overview`                                                  | the numbers and charts for a day, a week or a month |
| `GET /admin/orders`, `GET /admin/orders/export`                        | orders with filters and paging, and the export      |
| `GET /admin/companies`                                                 | companies, for the order filters                    |
| `GET /admin/coupons`, `POST /admin/coupons`                            | list and create coupons                             |
| `GET /admin/agent/conversations`, `GET /admin/agent/conversations/:id` | the agent log: conversations and their steps        |

**Error codes the apps already handle**

`400` `invalid_request` · `invalid_message` · `invalid_prefs` · `invalid_order` · `invalid_code` ·
`invalid_audio` · `invalid_query` · `invalid_point` · `invalid_coupon` · `invalid_challenge` · `invalid_destination` ·
`unknown_company` · `ends_in_past` — `401` `auth_required` · `signed_out` · `admin_required` ·
`invalid_credentials` — `404` `not_found` · `not_onboarded` · `suggestion_not_found` · `order_not_found` ·
`plan_not_found` · `day_not_found` — `409` `day_locked` · `plan_expired` · `duplicate_code` —
`413` `audio_too_large` — `422` `no_speech` · `outside_service_area`

## The agent

- A tool-calling loop: the model reads the user's message and the saved preferences, then calls tools to search
  meals near the office, build each bill, and check the budget, the calorie limit and the minimum order
  (100 EGP of food before fees). It answers with three suggestions.
- It has no tool that confirms or pays, and the backend refuses to create an order from anything but the user's
  own request.
- Every step is logged, which is what the admin's agent log shows.
- An evaluation set of real-style requests in Egyptian Arabic and English decides which cloud model to use, and
  catches regressions when prompts or tools change.

## Weekly plans and scheduling

Each day of a confirmed week stores the moment its order must go out (`send_at`, 45 minutes before the planned
arrival). A tick every minute picks the orders that are due with `FOR UPDATE SKIP LOCKED`, so two workers never
send the same order. There is no queue service in the first version: PostgreSQL is enough. A restaurant refusing
or running late is handled per day, without touching the rest of the week.

## Payments

A payment sandbox first: the order is drafted, the user confirms and pays, and the provider's webhook settles it.
Every payment request carries an idempotency key, so a retry never charges twice. Coupons are checked against the
minimum order on the server too.

## Voice

- Dictation needs only `POST /chat/transcribe`. The speech-to-text model for Egyptian Arabic will be chosen by
  evaluation, like the language model.
- Real voice calls come later, with LiveKit Agents: speech-to-text, then the same agent loop, then Egyptian
  text-to-speech, with turn detection and interruptions. The web app's call screen is already built for it.

## Connecting the web app

Run the web app with `NEXT_PUBLIC_API_MOCKING=disabled` and it sends every `/api/*` request to the real service
instead of the in-browser mock. Nothing else in the app changes.
