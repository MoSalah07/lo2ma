# Lo2ma mobile app

> **Status: planned (phase 7).** Nothing here is built yet. The app comes after the web app and the backend are
> working end to end.

A native app for Android and iOS with the same screens and rules as the web app: the chat, the weekly plan,
voice, checkout, tracking and the account, in Arabic and English, light and dark.

## Planned stack

| Concern    | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Framework  | React Native with Expo                                             |
| Navigation | Expo Router (file-based, like the web app's App Router)            |
| Styling    | NativeWind, fed by the same design tokens as the web app           |
| Data       | TanStack Query and Zustand, as on the web                          |
| API        | `packages/api-client`, generated from the backend's OpenAPI schema |

## What it shares with the web app

The monorepo's packages were written for this from the start: plain TypeScript, no browser or Node globals.

- `packages/tokens`: colors, radii, spacing, type and shadows, so both apps look the same.
- `packages/i18n`: every string in Arabic and English, with the same ICU messages and plurals.
- `packages/core`: the zod schemas, money, calorie and time formatting, and every business rule, including the
  minimum order.
- `packages/api-client`: one typed client for the same API.

## Things that differ on mobile

- **Right to left.** React Native switches layout direction with `I18nManager`, which needs an app reload when
  the language changes. The web app switches instantly.
- **Voice** uses the native microphone and audio session, against the same transcription endpoint and, later,
  the same voice-call pipeline.
- **Payments** stay a button the user presses; the agent can't confirm or pay on mobile either.

## Release

Builds with EAS, then the Play Store and the App Store.
