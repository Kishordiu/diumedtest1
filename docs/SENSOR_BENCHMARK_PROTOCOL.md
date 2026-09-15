# DiuMed — Sensor Benchmark Protocol

## Purpose

This document defines how to run reproducible benchmarks for every DiuMed sensing modality. Every model change must be evaluated against this protocol before production deployment.

## General Rules

1. **Subject-independent splits**: Never allow the same subject in train and test.
2. **Cross-dataset testing**: Train on dataset A, test on dataset B.
3. **Real-device validation**: Notebook metrics are necessary but not sufficient.
4. **Report failure rate**: A model that always produces a number is not better than one that honestly refuses bad input.
5. **Report false-confident results**: Track cases where the model produced a confident result that was wrong.

## Bio-Aura Benchmark

### Metrics
| Metric | Definition |
|--------|-----------|
| MAE | Mean absolute error (BPM) |
| RMSE | Root mean squared error (BPM) |
| Pearson r | Correlation with ground truth |
| SNR | Signal-to-noise ratio (dB) |
| Coverage | % of recordings that produce a result |
| Failure Rate | % of recordings rejected by quality gate |
| False Accept | % of recordings where quality=GOOD but |error| > 10 BPM |
| Median Latency | Time from camera start to first stable estimate |

### Protocol
1. Load dataset (UBFC-rPPG / PURE / VIPL-HR / MMPD / COHFACE)
2. For each recording: extract frames at native FPS
3. Run rPPG pipeline with same parameters as production
4. Compare estimated HR against ground truth HR
5. Record per-recording: estimated_hr, ground_truth_hr, error, quality, confidence, duration, failure_reason
6. Compute aggregate metrics
7. Report per-condition breakdown (lighting, motion, skin tone where available)

### Minimum Acceptance
- Cross-dataset MAE < 5 BPM on UBFC-rPPG test set
- Coverage > 80% on UBFC-rPPG
- False accept rate < 5%
- Real Android device: 3 consecutive successful measurements per user

## Pulse Touch Benchmark

### Protocol
1. Load dataset (BUT PPG / Welltory)
2. For each recording: extract RGB time series
3. Run contact PPG pipeline with production parameters
4. Compare estimated HR against ECG/reference HR
5. Record same fields as Bio-Aura

### Minimum Acceptance
- MAE < 3 BPM on BUT PPG test set
- Coverage > 90%
- Real Android device: 3 consecutive successful measurements per user

## Hemoglobin Benchmark

### Protocol
1. Load Zenodo 8277462 dataset
2. Subject-independent 80/20 split (random_state=42)
3. For each test image: extract HHR, run model
4. Compare estimated Hb against laboratory Hb
5. Compute MAE, RMSE, Bland-Altman bias and LOA

### Minimum Acceptance
- MAE < 2.0 g/dL
- Bland-Altman LOA within ±5 g/dL
- No silent clamping of implausible values

## Device Benchmark Matrix

For every target phone model:

| Metric | Target |
|--------|--------|
| Bio-Aura MAE | < 8 BPM |
| Bio-Aura failure rate | < 30% |
| Pulse Touch MAE | < 5 BPM |
| Pulse Touch failure rate | < 15% |
| Median quality score | > 0.3 |
| Median latency | < 12s |

## Reporting

All benchmark results stored in:
- `research/reports/benchmark_matrix.csv`
- `research/reports/device_matrix.csv`

All failed sessions must be documented — not hidden.
