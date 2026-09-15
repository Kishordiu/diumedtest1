# DiuMed — Frozen Baseline

**Date**: 2026-09-15
**Purpose**: Immutable snapshot of all production sensing files before research pipeline rebuild.

> [!CAUTION]
> Do NOT modify or delete these files until a regression baseline is established against reference datasets.

## Sensing Engine Files

| File | SHA-256 | Lines | Bytes |
|------|---------|-------|-------|
| `src/features/bio-aura/camera/PulseTouchEngine.ts` | `E6525437D7B0FBE9...FB1C058A` | 276 | 9,070 |
| `src/features/bio-aura/camera/useMeasurementEngine.ts` | `578D5B5CFE9110CA...3BFDB1` | 300 | 9,712 |
| `src/features/bio-aura/camera/types.ts` | `DF16569D94A91214...0C11FF56` | 62 | 1,418 |
| `src/features/bio-aura/rppg/rppgEngine.ts` | `D8F4EDAD659BCA90...CA236F8B` | 399 | 13,977 |
| `src/features/bio-aura/rppg/FaceMeshExtractor.ts` | `4E84B5DFB4B28E0C...96A7A2335` | 173 | 5,812 |

## UI Pages

| File | SHA-256 | Lines | Bytes |
|------|---------|-------|-------|
| `src/features/bio-aura/BioAuraPage.tsx` | `085F894F2DA1874F...3F07B8678` | 228 | 11,277 |
| `src/features/bio-aura/PulseTouchPage.tsx` | `C9372CEBA0B3B565...D76D1FDB` | 185 | 9,278 |

## Vision / Hb Pipeline

| File | SHA-256 | Lines | Bytes |
|------|---------|-------|-------|
| `src/features/vision/ColorimetryEngine.ts` | `1802FAE1D4B1A71E...01632C867A` | 194 | 5,645 |
| `src/features/vision/HemoglobinEstimator.ts` | `BF6D0722D7B882ED...05298D5A` | 246 | 7,405 |
| `src/features/vision/AnemiaScreeningPage.tsx` | `3881F0E44B39270...42F1F4F1` | 285 | 13,892 |
| `src/features/vision/ScleraScreeningPage.tsx` | `B423F927FC59CDE1...B0197D8B` | 226 | 9,974 |
| `src/features/vision/hooks/useVisionInput.ts` | `4FDDC99C7CB718ED...E994ED312EB` | 128 | 3,915 |
| `src/features/vision/components/VisionInputStage.tsx` | `B4C8F83929D86740...55AEA335` | 158 | 6,374 |

## Shared Components

| File | SHA-256 | Lines | Bytes |
|------|---------|-------|-------|
| `src/shared/components/CameraLensInstrument.tsx` | `662B5DDE95DE5DD6...643065C3E8` | 74 | 3,356 |
| `src/shared/components/DiagnosticsPanel.tsx` | `66414B7227E1F9EC...B65A53CF7` | 127 | 4,486 |
| `src/shared/components/LiveSignalGraph.tsx` | `B052BB9729766D40...DF128C71` | 101 | 2,587 |

## Current Engine Versions

| Engine | Version String | Algorithm |
|--------|---------------|-----------|
| rPPG | `rPPG_v2.0_MultiROI` | POS + CHROM, best-patch selection, Welch PSD |
| Contact PPG | `cPPG_v2.0_Welch` | Red/Green channel selection, detrend, Welch PSD |
| Hemoglobin | `diumed_hhr_univariate_v2` | Univariate OLS on HHR (Zenodo 8277462) |

## Current Quality Thresholds

| Engine | Parameter | Value | Evidence |
|--------|-----------|-------|----------|
| rPPG | `MIN_FRAMES_REQUIRED` | 90 | ~3s at 30fps |
| rPPG | `MIN_QUALITY_THRESHOLD` | 0.05 | Hand-tuned (no validation distribution) |
| rPPG | `MIN_CONFIDENCE_THRESHOLD` | 0.10 | Hand-tuned (no validation distribution) |
| rPPG | Motion rejection | >1.5 | Hand-tuned |
| cPPG | `MIN_FRAMES_REQUIRED` | 90 | ~3s at 30fps |
| cPPG | `MIN_QUALITY_THRESHOLD` | 0.05 | Hand-tuned (no validation distribution) |
| cPPG | `MIN_CONFIDENCE_THRESHOLD` | 0.10 | Hand-tuned (no validation distribution) |
| cPPG | Red mean rejection | <40 | Hand-tuned |
| cPPG | Signal amplitude rejection | <0.1 | Hand-tuned |
| MeasurementEngine | Stable BPM buffer | 5 readings, ≤5 BPM spread | Hand-tuned |
| MeasurementEngine | Early completion | >4s, confidence >0.3 | Hand-tuned |

> [!WARNING]
> **Every threshold marked "Hand-tuned" has no empirical validation against reference data.** This is the core problem this rebuild addresses.
