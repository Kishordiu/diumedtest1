# DiuMed

DiuMed is a mobile-first health-tech prototype exploring camera-based wellness signals, symptom guidance and privacy-aware flows using a phone's built-in capabilities.

> **Safety note:** DiuMed is an experimental prototype, not a medical device or diagnostic service. Do not use its outputs to diagnose a condition or delay professional care.

## Project scope

- Mobile-friendly progressive web app
- Camera-based signal-estimation experiments
- Guided symptom and wellness flows
- Local-first interaction concepts and emergency-contact handoff
- Supabase integration boundary for configured data workflows
- Capacitor Android project

Features may be at different stages of implementation; use the source and tests for the current behaviour rather than interpreting the project description as clinical validation.

## Run locally

**Requirements:** Node.js 20+ and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set your own values in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon/publishable client key |

Vite variables are visible in the browser bundle. Do not place service-role keys or other private credentials in `VITE_*` values, and ensure Supabase Row Level Security (RLS) is configured for exposed data.

## Quality checks

```bash
npm run build
npm run typecheck
npm run test:unit
```

Playwright end-to-end tests are configured separately. Install the required browser before running them:

```bash
npx playwright install
npm run test:e2e
```

## Android

The `android/` directory contains the Capacitor Android project. Follow the project's installed Capacitor/Android tooling to sync and build from source; a previously generated debug APK is not treated as a production release artifact.

## Stack

React · TypeScript · Vite · Capacitor · Supabase · MediaPipe Tasks Vision · Dexie · Vitest · Playwright

---
Maintained by [K. Kishor Kumar](https://github.com/Kishordiu).
