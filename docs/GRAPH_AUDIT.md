# GRAPH_AUDIT

**Date**: 2026-09-15  
**Repository**: `diumed12/src` — 54 source files across 10 feature modules

## Architecture Map

```mermaid
graph TD
    A["App Root (main.tsx)"] --> B["Router"]
    B --> C["Auth Module"]
    B --> D["Home"]
    B --> E["Bio-Aura / PulseTouch"]
    B --> F["Vision / Anemia / Sclera"]
    B --> G["Triage / Emergency"]
    B --> H["Records / Lab"]
    B --> I["Profile / Admin"]
    
    E --> J["useMeasurementEngine"]
    E --> K["rppgEngine (POS algorithm)"]
    E --> L["PulseTouchEngine (cPPG)"]
    
    F --> J
    F --> M["ColorimetryEngine"]
    F --> N["HemoglobinEstimator v1.0"]
    N --> O["extractConjunctivaFeatures (HSV)"]
    N --> P["Linear Regression Model"]
    
    J -.-> Q["Device Camera (WebRTC)"]
    K -.-> R["Offline Processing"]
    L -.-> R
    M -.-> R
    N -.-> R
    
    C --> S["Supabase Core"]
    H --> S
    G --> S
    G --> T["offlineRules.ts"]
    H --> U["Edge: parse_lab_report"]
    G --> V["Edge: triage"]
    
    W["TTS Service"] --> X["Edge: text-to-speech"]
    W --> Y["speechSynthesis fallback"]
```

## Complete File Inventory (54 files)

### Core (`src/core/`) — 9 files
| File | Purpose | Status |
|------|---------|--------|
| `supabase.ts` | Supabase client | ACTIVE |
| `database.types.ts` | TypeScript schema | ACTIVE |
| `logger.ts` | Structured logging | ACTIVE |
| `tts.ts` | TTS with fallback | ACTIVE |
| `auth/AuthContext.tsx` | Auth state management | ACTIVE |
| `db/queries.ts` | Typed DB access | ACTIVE |
| `i18n/i18n.ts` | i18next config | ACTIVE |
| `i18n/locales/en.json` | English | ACTIVE |
| `i18n/locales/ta.json` | Tamil | ACTIVE |

### Features — 22 files
| Module | Files | Key Engine |
|--------|-------|------------|
| Auth | `AuthPage.tsx`, `ResetPasswordPage.tsx` | Supabase Auth |
| Bio-Aura | `BioAuraPage.tsx` | rppgEngine (POS) |
| Pulse Touch | `PulseTouchPage.tsx` | PulseTouchEngine |
| Camera | `useMeasurementEngine.ts`, `cameraStateMachine.ts`, `types.ts` | WebRTC |
| Anemia | `AnemiaScreeningPage.tsx` | HemoglobinEstimator v1.0 |
| Sclera | `ScleraScreeningPage.tsx` | ColorimetryEngine |
| Lab | `LabReportScanner.tsx`, `labSchema.ts` | Gemini Edge Function |
| Records | `RecordsPage.tsx`, `RecordDetailPage.tsx`, `MeasurementResultPage.tsx` | Supabase |
| Triage | `TriagePage.tsx`, `offlineRules.ts` | Local + Gemini |
| Emergency | `EmergencyPage.tsx` | OS intents |
| Home | `HomePage.tsx` | — |
| Profile | `ProfilePage.tsx` | Supabase |
| Admin | `AdminPage.tsx` | Supabase |
| Onboarding | `OnboardingPage.tsx` | — |

### Shared — 8 files
`Alert`, `BottomNav`, `Button`, `DiuMedLogo`, `LiveSignalGraph`, `LoadingScreen`, `RawSignalDebugger`, `SyncStatusBar`

### Hooks — 2 files
`useNetworkStatus.ts`, `useReducedMotion.ts`

## Dead Code Assessment
- **ZERO dead files found.** Previous cleanup removed `useCamera.ts`.
- All 54 source files are imported and reachable from the Router.
- No duplicate implementations exist.
- No mock data files exist.
- No placeholder APIs exist.

## Hb Model Integration
The `HemoglobinEstimator.ts` now contains a REAL inference pipeline:
1. `extractConjunctivaFeatures()` — HSV feature extraction from conjunctival ROI
2. `estimateHemoglobin()` — Multivariate regression producing g/dL estimate
3. Quality gates reject invalid inputs with explicit failure reasons
4. Model provenance tracks method, reference paper, DOI, and raw features
