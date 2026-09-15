# SENSOR REGRESSION AUDIT

## Goal
Identify the root causes of the measurement engines (Pulse Touch and Bio-Aura) continuously falling back to `UNKNOWN` or `LOW` quality, causing blank screens or failed states on physical devices.

## Status of Repository
No `.git` history is available on this environment (uninitialized repository). Consequently, this audit relies on a static code review of the legacy constraints vs. the target simple baseline.

## 1. Pulse Touch Engine (`PulseTouchEngine.ts`)

### Over-Gating Mechanisms Identified
1. **Binary Peak-to-Peak Failure**: If the frequency-domain (PSD) heart rate estimate differed from the simple time-domain peak-to-peak estimate by > 15 BPM, the entire pipeline immediately failed and returned `UNKNOWN` (`createFailedResult`).
   - *Issue*: On real Android devices, auto-exposure and frame jitter cause time-domain peak finders to be significantly noisier than PSD estimates. Rejecting a stable PSD just because the time-domain peak finder disagreed resulted in a high failure rate.
2. **Quality Score Threshold**: The quality threshold was set to > `0.2` for acceptance and > `0.5` for `FAIR`. In practice, a strong heartbeat can produce a concentrated frequency peak that translates to a quality score of ~0.1-0.15 on phone cameras.

### Resolution
- Removed the strict `> 15 BPM` failure rule; peak-to-peak BPM is now just logged.
- Lowered the minimum quality threshold to `0.05` and updated the `qualityLabel` definitions (`> 0.1` is FAIR).

## 2. Bio-Aura rPPG Engine (`rppgEngine.ts`)

### Over-Gating Mechanisms Identified
1. **ROI Consensus Rejection**: The engine analyzed multiple patches (forehead, left cheek, right cheek) with two algorithms (POS, CHROM). If more than half of the extracted estimates disagreed with the median BPM by > 5 BPM, the whole pipeline was aborted (`Algorithm/Patch disagreement (High variance)`).
   - *Issue*: Lighting is rarely uniform. The forehead might have an excellent signal while the cheeks are noisy. Rejecting the whole signal because the noisy cheeks disagreed with the excellent forehead violates the "DO NOT OVER-REJECT" principle.
2. **Confidence Thresholding**: Similar to PulseTouch, the minimum acceptable threshold was set to `0.2`, which is too high for many real-world environments.

### Resolution
- Instead of requiring a multi-patch consensus, the engine will extract all valid patch+algorithm combinations, evaluate their PSD SNR, and simply pick the highest-quality estimate.
- Reduced the `MIN_QUALITY_THRESHOLD` to `0.05`. 

## 3. Engine Controller (`useMeasurementEngine.ts`)

### Over-Gating Mechanisms Identified
1. The measurement loop reset the whole buffer state to `POOR_QUALITY` if a single update returned `POOR`. This wiped out valid prior stable BPMs.

### Resolution
- The engine logic will be updated to tolerate intermittent `POOR` frames gracefully, maintaining the `stableBpmBuffer` and allowing the user's signal to naturally recover.
