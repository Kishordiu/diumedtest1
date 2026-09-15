# DiuMed — Signal Quality Specification

## Purpose

Every quality threshold in DiuMed production code must have a documented source. This document tracks the current state and planned calibration.

## Current State: Hand-Tuned (No Validation Evidence)

> [!WARNING]
> All thresholds below were set by hand without reference to validation distributions from benchmark datasets. This is the primary cause of the LOW/UNKNOWN signal quality problem on real devices.

## rPPG Engine (`rppgEngine.ts`)

| Parameter | Current Value | Source | Planned Calibration |
|-----------|--------------|--------|-------------------|
| `MIN_FRAMES_REQUIRED` | 90 | ~3s × 30fps | Keep (reasonable minimum) |
| `MIN_QUALITY_THRESHOLD` | 0.05 | Hand-tuned | Calibrate from UBFC-rPPG quality distribution |
| `MIN_CONFIDENCE_THRESHOLD` | 0.10 | Hand-tuned | Calibrate from validation set |
| Motion rejection | >1.5 | Hand-tuned | Calibrate from MMPD motion conditions |
| Min duration | 2s | Engineering judgment | Keep |
| Min sampling rate | 10 fps | Engineering judgment | Keep |

### Quality Score Formula
```
quality = peakEnergy / (meanEnergy × 10)
```
**Problem**: The `× 10` scaling factor is arbitrary. This formula has no published basis.

**Planned fix**: Replace with spectral concentration ratio calibrated against UBFC-rPPG ground truth:
```
quality = peakPower / totalBandPower  (within 0.7–3.0 Hz)
```
Then set thresholds at validated percentiles (e.g., reject bottom 10% of quality scores from recordings with |error| > 10 BPM).

### Quality Label Thresholds
| Label | Current Threshold | Evidence |
|-------|------------------|----------|
| EXCELLENT | ≥ 0.7 | None |
| GOOD | ≥ 0.5 | None |
| FAIR | ≥ 0.1 | None |
| POOR | ≥ 0.05 | None |
| UNKNOWN | < 0.05 | None |

**Planned fix**: Set from validation distribution percentiles.

## Contact PPG Engine (`PulseTouchEngine.ts`)

| Parameter | Current Value | Source | Planned Calibration |
|-----------|--------------|--------|-------------------|
| `MIN_FRAMES_REQUIRED` | 90 | ~3s × 30fps | Keep |
| `MIN_QUALITY_THRESHOLD` | 0.05 | Hand-tuned | Calibrate from BUT PPG |
| `MIN_CONFIDENCE_THRESHOLD` | 0.10 | Hand-tuned | Calibrate from BUT PPG |
| Red mean rejection | < 40 | Hand-tuned | Calibrate from Welltory |
| Signal amplitude rejection | < 0.1 | Hand-tuned | Calibrate from BUT PPG |

### Quality Score Formula
```
quality = (peakMag / (totalMag / N)) × 0.1
```
**Problem**: Same arbitrary scaling as rPPG. The `× 0.1` makes the score range opaque.

### Channel Selection
```
Use Green if variance(G) > 1.5 × variance(R), else Red
```
**Problem**: The 1.5× threshold is untested. Published literature generally prefers Red for contact PPG (deeper tissue penetration through finger).

**Planned fix**: Evaluate per-channel SNR on BUT PPG dataset and select based on validated criteria.

## Measurement Engine (`useMeasurementEngine.ts`)

| Parameter | Current Value | Source |
|-----------|--------------|--------|
| Stable BPM buffer size | 5 readings | Hand-tuned |
| Stable BPM max spread | ≤ 5 BPM | Hand-tuned |
| Stable confidence threshold | > 0.1 | Hand-tuned |
| Early completion time | > 4s | Hand-tuned |
| Early completion confidence | > 0.3 | Hand-tuned |
| Max timeout | 30s | Engineering judgment |
| Buffer window | 12s | Engineering judgment |

## Planned Calibration Process

1. Download UBFC-rPPG, PURE, BUT PPG, Welltory datasets
2. Run each recording through the production pipeline
3. For each recording, log: quality_score, error_bpm, confidence
4. Plot quality_score vs |error| to find the empirical relationship
5. Set thresholds at the point where false-accept rate < 5%
6. Document the percentile and dataset used for each threshold
7. Repeat for each dataset to verify cross-dataset stability
