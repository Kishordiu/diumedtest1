# DIUMED

![Cinematic hero](https://capsule-render.vercel.app/api?type=rect&color=0:07120E,100:17342A&height=230&text=DIUMED&fontColor=F3F3EE&fontSize=40&fontAlignY=38&desc=HEALTH-TECH%20%2F%20PRIVATE%20COMPUTATION&descColor=999991&descSize=12&descAlignY=66&animation=scaleIn)

> **Health-tech / privacy-aware smartphone prototype.**

DiuMed explores whether everyday smartphone capabilities can support preliminary wellness signals and symptom guidance without requiring dedicated hardware.

## THE EXPERIENCE

- Mobile-first flows for camera-based signal experiments and guided triage
- Local-first interaction concepts with explicit data-boundary considerations
- Optional Supabase integration for application data

Review the current source for the exact implementation. Browser-based measurements and prototype scores must not be interpreted as clinically validated readings.

## STACK

React · TypeScript · Vite · Capacitor · MediaPipe · Supabase · Vitest · Playwright

## RUN LOCALLY

Requirements: Node.js and npm.

```bash
npm ci
cp .env.example .env.local
```

Fill in the Supabase URL and publishable/anon key in `.env.local`, then start the web app:

```bash
npm run dev
```

For a production build and type check:

```bash
npm run build
npm run typecheck
```

Unit and browser tests:

```bash
npm run test:unit
npm run test:e2e
```

For Android packaging, follow the Capacitor Android project instructions in the `android/` directory and build with the Android toolchain. The committed debug APK is a generated artifact, not the source of truth; verify its version before distributing it.

## ENVIRONMENT AND PRIVACY

The `.env.example` file contains placeholders. Never commit local `.env` files, service-role keys or provider secrets. Any key prefixed with `VITE_` is bundled for browser access and must be limited to intended public credentials. Enforce access through backend authorization and Supabase Row Level Security.

## PROJECT STATUS

**Experimental health-tech prototype. Not a medical device and not a substitute for professional care.**

---
Maintained by [K. Kishor Kumar](https://github.com/Kishordiu).
