# FINAL_SYSTEM_MAP

## Architecture Overview
DiuMed is a Zero-Hardware, Zero-Trust, Edge-First Health OS.

- **Frontend**: React 19 + Vite 8 + Tailwind CSS + Framer Motion
- **Backend / Auth / DB**: Supabase (PostgreSQL + RLS + Edge Functions)
- **Local Inference**: WebRTC + Canvas + HSV Colorimetry + rPPG/cPPG + Offline Rule Engines
- **PWA**: vite-plugin-pwa + Service Worker + Workbox

## Core Subsystems

### 1. Vision Engine (`src/features/vision/`)
- `ColorimetryEngine.ts`: RGB→CIELAB conversion, Erythema Index, ROI analysis, image quality validation
- `HemoglobinEstimator.ts`: HSV feature extraction + multivariate regression Hb model (v1.0)
- `AnemiaScreeningPage.tsx`: Camera → capture → freeze → quality → ROI → Hb inference → result
- `ScleraScreeningPage.tsx`: Experimental scleral color screening

### 2. Biosignal Processing (`src/features/bio-aura/`)
- `rppg/rppgEngine.ts`: POS algorithm for remote PPG heart rate
- `camera/PulseTouchEngine.ts`: Red-channel contact PPG for fingertip heart rate
- `camera/useMeasurementEngine.ts`: Unified camera lifecycle management
- `camera/cameraStateMachine.ts`: State machine for camera states
- `BioAuraPage.tsx`: Facial rPPG measurement UI
- `PulseTouchPage.tsx`: Fingertip cPPG measurement UI

### 3. Triage & Emergency (`src/features/triage/`, `src/features/emergency/`)
- `offlineRules.ts`: Deterministic offline symptom severity classification
- `TriagePage.tsx`: Online Gemini AI + offline fallback
- `EmergencyPage.tsx`: Real OS handoff via `tel:` and `sms:` intents

### 4. Records & Lab (`src/features/records/`)
- `LabReportScanner.tsx`: Document capture → Gemini extraction → user review → save
- `labSchema.ts`: Biomarker reference range parsing
- `RecordsPage.tsx`: Health measurement history with provenance
- `RecordDetailPage.tsx`: Individual measurement detail view
- `MeasurementResultPage.tsx`: Post-measurement result display

### 5. Data Layer (`src/core/`)
- `database.types.ts`: TypeScript schema matching remote PostgreSQL
- `db/queries.ts`: Typed database access with RLS
- `auth/AuthContext.tsx`: Session, roles, profile state, password reset
- `supabase.ts`: Supabase client configuration
- `tts.ts`: Edge Function TTS with speechSynthesis fallback
- `logger.ts`: Structured logging with module prefixes
- `i18n/`: English, Tamil, Hindi translations

### 6. Edge Functions (`supabase/functions/`)
- `text-to-speech/`: ElevenLabs multilingual TTS (en/ta/hi)
- `parse_lab_report/`: Gemini multimodal lab document extraction
- `triage/`: Gemini AI triage assistance

## Component Dependency Graph
```
Auth → Supabase → RLS → PostgreSQL
HomePage → BioAura / PulseTouch / Anemia / Sclera / Triage / Emergency
BioAura → useMeasurementEngine → rppgEngine → Canvas/WebRTC
PulseTouch → useMeasurementEngine → PulseTouchEngine → Canvas/WebRTC
Anemia → ColorimetryEngine → HemoglobinEstimator (HSV regression)
Lab → Edge Function (parse_lab_report) → Gemini API
Triage → offlineRules (local) | Edge Function (online)
TTS → Edge Function → ElevenLabs | window.speechSynthesis (fallback)
```
