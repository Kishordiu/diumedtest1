# DiuMed

> **A privacy-conscious mobile-first health companion exploring camera-based health insights.**

DiuMed explores whether everyday smartphone capabilities can provide useful preliminary health signals and symptom guidance without requiring dedicated hardware.

## What it explores
- Camera-based pulse estimation concepts
- AI-assisted symptom guidance
- Offline-first triage workflows
- Private health-record storage
- Emergency contact handoff
- Responsive PWA experience

## Safety and limitations
DiuMed is an experimental software project. It does **not** diagnose illness, replace professional medical care, or provide clinically validated vital-sign measurements. Camera-based estimates can be affected by lighting, movement and device differences.

## Stack
React · TypeScript · Vite · Tailwind CSS · Framer Motion · Supabase · Workbox PWA

## Local development
~~~bash
npm install
cp .env.example .env.local
npm run dev
~~~

For AI functionality, configure the required Supabase secrets according to the project documentation.

## Status
**Experimental health-tech prototype**

## Author
**K. Kishor Kumar** · [GitHub @Kishordiu](https://github.com/Kishordiu)
