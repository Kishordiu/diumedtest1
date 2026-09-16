# DiuMed Development Prompts History

This file contains the sequence of major architectural and directive prompts used to build DiuMed, as recovered from the active context window.

## Prompt 1: Final Polish & Real-World UX
```
# DIUMED — FINAL POLISH + REAL-WORLD UX REFINEMENT
# VISUAL SYSTEM • LANGUAGE VOICE • ALERTS • LAB AI • ERROR RECOVERY
# DO NOT BREAK THE WORKING OPTICAL MEASUREMENT ENGINES

============================================================
0. ABSOLUTE RULE
============================================================

DiuMed Phase 6 is already implemented.

The following are considered working foundations and MUST NOT be
rewritten casually:

- Supabase Auth
- RLS
- Bio-Aura remote rPPG
- Pulse Touch contact PPG
- camera lifecycle
- waveformBuffer
- measurement result flow
- Records
- experimental screeners
- lab report scanner architecture
- triage
- emergency
- PWA
- current database schema unless a concrete bug requires migration

THIS PHASE IS NOT A RESET.
THIS PHASE IS THE FINAL LAST-MILE PRODUCT POLISH.

Primary goals:
1. Fix visible backend/runtime errors.
2. Improve UI/UX substantially.
3. Make typography and color hierarchy premium.
4. Make authentication
```

## Prompt 2: Final Award-Level Product Reconstruction
```
# DIUMED — FINAL AWARD-LEVEL PRODUCT RECONSTRUCTION
# DO NOT JUST POLISH — AUDIT, CLEAN, REBUILD THE EXPERIENCE, VERIFY EVERYTHING
# ZERO-HARDWARE • ZERO-TRUST • EDGE-FIRST • REAL HEALTH SIGNALS

============================================================
0. MASTER DIRECTIVE
============================================================

THIS IS THE FINAL PRODUCT-QUALITY PASS.

The current DiuMed application already contains substantial working
functionality:

- Supabase authentication
- RLS
- Bio-Aura remote rPPG
- Pulse Touch contact PPG
- camera lifecycle handling
- waveformBuffer
- result/report flow
- Records
- Anemia experimental screening
- Sclera experimental screening
- Lab Report Scanner
- Lab Report Edge Function
- Triage
- Emergency
- PWA
- multilingual UI
- TTS Edge Function
- browser speech fallback

DO NOT THROW AWAY WORKING CORE FUNCTIONALITY.
BUT:
DO NOT ASSUME THE CURRENT IMPLEMENTATION IS GOOD ENOUGH.
The current application must be treat
```

## Prompt 3: Real QA & Zero-Trust
```
# DIUMED — FINAL PRODUCT RECONSTRUCTION + AWARD-LEVEL UI/UX + REAL QA
# ZERO-HARDWARE / ZERO-TRUST EDGE HEALTH OS
# DO NOT JUST REPORT COMPLETION — ACTUALLY REBUILD, TEST, DELETE, VERIFY

====================================================================
0. MASTER DIRECTIVE
====================================================================

The DiuMed codebase has already passed a significant architecture
cleanup and contains working functionality.

Current working areas include:

- Supabase Auth
- Supabase RLS
- Bio-Aura remote rPPG
- Pulse Touch contact PPG
- camera lifecycle
- waveformBuffer
- measurement result flow
- Records
- Anemia experimental screening
- Sclera experimental screening
- Lab Report Scanner
- Lab parser Edge Function
- Triage
- Emergency
- PWA
- multilingual UI
- TTS Edge Function
- browser speech fallback

DO NOT throw away working product logic.
DO NOT rewrite the rPPG/cPPG engines simply for visual reasons.
DO NOT create another parall
```

## Prompt 4: Visual & Functional Reconstruction (Capture Bug Fix)
```
# DIUMED — FINAL VISUAL + FUNCTIONAL RECONSTRUCTION
# CRITICAL BUG FIX + OFFICIAL AUTH EXPERIENCE + REALISTIC MATERIAL DESIGN
# STITCH VISUAL EXPLORATION + AWARD-LEVEL MOBILE PRODUCT

============================================================
0. STOP AND READ THIS FIRST
============================================================

The current application is NOT accepted in its present state.

A real Android screenshot revealed a critical functional problem:

ANEMIA SCREENING:
- page loads
- header loads
- camera area/page loads
- user presses CAPTURE
- screen becomes effectively EMPTY / BLACK
- no captured image
- no ROI
- no analysis result
- no failure state
- no review state

The same must be checked immediately for:
SCLERA SCREENING
LAB REPORT CAPTURE
and every other capture-based workflow.

THIS IS A FUNCTIONAL BUG.
DO NOT MASK IT WITH CSS.
DO NOT simply add a loading spinner.
DO NOT fake a result.
FIRST FIX THE CAPTURE PIPELINE.
Only after the ca
```

## Prompt 5: Hemoglobin / Anemia Model Expansion
```
# DIUMED — HEMOGLOBIN / ANEMIA MODEL EXPANSION
# DO NOT FABRICATE Hb FROM COLOR METRICS

The current DiuMed anemia feature extracts:
L*, a*, b*, erythema index, ROI quality, image quality

This is NOT yet a hemoglobin estimator.

The original DiuMed product concept explicitly includes:
NON-INVASIVE / CAMERA-BASED HEMOGLOBIN SCREENING.

Therefore the final product must preserve Hb estimation as a target
capability, but implement it honestly.

============================================================
1. PRODUCT TARGET
============================================================
ANEMIA SCREENING

Primary intended output:
ESTIMATED HEMOGLOBIN

Secondary:
ANEMIA SCREENING SIGNAL

The application must clearly state:
"Optical hemoglobin estimate — not a diagnostic blood test."

... [Extended instructions regarding building a HemoglobinEstimator without fabricating data] ...
```
