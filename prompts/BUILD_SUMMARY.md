# DiuMed — Complete Build Summary
**Project:** DiuMed — Zero-Hardware, Zero-Trust Edge Health OS  
**Team:** DiuFounders | Team Leader: K. Kishor Kumar  
**Repository:** https://github.com/Kishordiu/diumedtest1  
**Date:** 15–16 September 2026  

---

## 🏗️ What Was Built

DiuMed is a mobile health application that uses only a smartphone's camera and sensors to perform non-invasive medical screening — no external hardware needed.

### Core Features
1. **BioAura (rPPG Engine)** — Real-time heart rate, SpO2, and stress estimation using facial video analysis via remote photoplethysmography (rPPG)
2. **PulseTouch** — Fingertip-based heart rate measurement using the phone's camera + flashlight
3. **Anemia Screening** — Conjunctiva/eye image analysis to estimate hemoglobin levels and screen for anemia
4. **Sclera (Jaundice) Screening** — Eye sclera yellowness analysis for bilirubin estimation
5. **AI Triage** — Symptom-based health triage powered by a Featherless AI LLM (Qwen 32B)
6. **Emergency SOS** — One-tap emergency calling with GPS location sharing
7. **Health Records** — Full measurement history with Supabase cloud storage
8. **Multi-Language Support** — English, Tamil (தமிழ்), and Hindi (हिंदी) — 239 keys each
9. **Dual Theme Engine** — "Dark Mineral" and "Warm Pearl" themes with semantic CSS tokens

---

## 🔬 ML / Deep Learning Work

### Hemoglobin Estimation Model
- Trained a regression model on research datasets from Kaggle and IEEE:
  - `eyes-defy-anemia` (Kaggle)
  - `palpebral-conjunctiva-to-detect-anaemia` (Kaggle)
  - `anemiadataset` (Kaggle)
  - `anemia-image-dataset` (Kaggle)
- Feature extraction: RGB channel means, standard deviations, color ratios (R/G, R/B, G/B), and HSV histogram features from conjunctiva regions
- Model: Linear regression with standardized features
- Exported coefficients directly into TypeScript for edge inference (no server needed)

### rPPG Signal Processing Pipeline
- Implemented POS (Plane-Orthogonal-to-Skin) algorithm for pulse signal extraction from facial video
- Bandpass Butterworth filter (0.7–4.0 Hz) for heart rate isolation
- FFT-based dominant frequency detection for BPM estimation
- Signal quality scoring based on SNR (Signal-to-Noise Ratio)
- SpO2 estimation via AC/DC ratio analysis of red and blue channels

### Sclera Analysis
- YCbCr color space conversion for sclera region isolation
- Yellowness index calculation from Cr/Cb channel ratios
- Multi-threshold classification: Normal → Mild → Moderate → Severe

---

## 🎨 UI/UX Design

### Design Philosophy
- Inspired by: nordpixel.ch, demophorius.com, Dribbble health app concepts
- Glassmorphism + material depth layering
- Premium instrument-grade typography (Instrument Sans + DM Mono)
- Micro-animations via Framer Motion

### Theme Architecture
- **Dark Mineral** (default): Deep graphite backgrounds (#0D1012), warm pearl text (#F4F0E7), teal signal accents
- **Warm Pearl**: Light cream backgrounds (#F4F0E7), dark text (#1B1D1D), adjusted signal colors
- 100% semantic CSS variables — no hardcoded colors anywhere
- Smooth 0.4s transition between themes

### Pages Built
1. Auth / Login Page (Supabase email auth)
2. Home Dashboard (health metrics cards, quick actions)
3. BioAura (face scanning with real-time vitals overlay)
4. PulseTouch (fingertip measurement with waveform display)
5. Anemia Screening (camera capture + image upload)
6. Sclera/Jaundice Screening (eye photo analysis)
7. AI Triage (conversational symptom checker)
8. Emergency SOS Page
9. Health Records (measurement history timeline)
10. Measurement Result Detail Page
11. Lab Report Scanner
12. Profile & Settings (language, theme, units)
13. Onboarding Flow
14. Developer/Signal Lab (debug tools)

---

## 📱 Android APK Build

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Semantic CSS Variables
- **Animation:** Framer Motion
- **i18n:** i18next (EN / TA / HI)
- **Backend:** Supabase (Auth + Database)
- **AI:** Featherless API (Qwen 2.5 32B)
- **Native Bridge:** Capacitor 7
- **Build:** Gradle (Android SDK 35, JDK 21)

### APK Pipeline
```
npm run build → npx cap sync → gradlew assembleDebug
```

### Critical Android Fixes
1. **Camera Permissions** — Added `CAMERA`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION` to AndroidManifest.xml with runtime permission requests
2. **TTS Audio Unlock** — Android WebView blocks AudioContext until user gesture; implemented automatic unlock on first touch
3. **WebView Configuration** — Enabled JavaScript, DOM storage, media playback without gesture, mixed content mode
4. **File Access** — Configured file provider for camera image capture

---

## 🌐 Internationalization (i18n)

### Coverage: 239 translation keys per language

| Category | Examples |
|---|---|
| Navigation | Home, Records, Profile, Settings |
| BioAura | Heart rate, SpO2, Stress, Signal quality labels |
| PulseTouch | Place finger, Measuring, Results |
| Anemia | Hemoglobin estimate, Severity levels |
| Sclera | Bilirubin screening, Yellowness index |
| Triage | Symptom input, AI response, Severity levels |
| Emergency | SOS button, Call ambulance, Share location |
| Profile | Language selector, Theme toggle, Units |
| Common | Loading, Error, Cancel, Save, Delete |

---

## 🔧 Architecture

```
src/
├── app/              # App shell, routing, error boundary
├── core/
│   ├── i18n/         # Translations (en.json, ta.json, hi.json)
│   ├── theme/        # ThemeContext + toggle
│   ├── tts.ts        # Text-to-speech engine
│   ├── logger.ts     # Structured logging
│   └── supabase.ts   # Supabase client
├── features/
│   ├── auth/         # Login, registration, password reset
│   ├── home/         # Dashboard
│   ├── bio-aura/     # rPPG engine, face mesh, camera
│   ├── triage/       # AI symptom checker
│   ├── vision/       # Anemia + Sclera screening
│   ├── records/      # Health record history
│   ├── profile/      # User settings
│   ├── emergency/    # SOS
│   └── onboarding/   # First-run experience
├── shared/
│   └── components/   # Button, Alert, BottomNav, Camera, etc.
├── index.css         # Global theme variables
└── tailwind.config.js
android/              # Capacitor Android project
research/             # ML training scripts & datasets
docs/                 # Technical documentation
prompts/              # All prompts used in development
```

---

## 📦 Final Deliverables

| Deliverable | Status |
|---|---|
| Full React + TypeScript codebase | ✅ Complete |
| Android APK (debug) | ✅ Built |
| rPPG heart rate engine | ✅ Working |
| Hemoglobin estimation model | ✅ Trained & deployed |
| Sclera/jaundice analysis | ✅ Working |
| AI Triage (Featherless) | ✅ Connected |
| 3-language support (EN/TA/HI) | ✅ 239 keys each |
| Dual theme (Dark/Warm) | ✅ Semantic tokens |
| TTS voice guidance | ✅ WebView-safe |
| GitHub push | ✅ github.com/Kishordiu/diumedtest1 |
| Prompt history log | ✅ prompts/ALL_PROMPTS.md |

---

*Built by DiuFounders with AI-assisted development*
