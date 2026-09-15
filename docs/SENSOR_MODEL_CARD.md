# DiuMed — Sensor Model Cards

## Bio-Aura (rPPG)

| Field | Value |
|-------|-------|
| **Model ID** | `rPPG_v2.0_MultiROI` |
| **Task** | Remote heart rate estimation from face video |
| **Architecture** | Classical signal processing: POS + CHROM algorithms, Welch PSD, best-patch selection |
| **Learned Components** | None (pure classical) |
| **Face Detection** | MediaPipe FaceLandmarker (float16, GPU delegate) |
| **ROI Strategy** | 3 patches: forehead, left cheek, right cheek |
| **Training Data** | None — hand-coded algorithms with hand-tuned thresholds |
| **Validation Data** | None — no formal benchmark performed |
| **Quality Model** | `peakEnergy / (meanEnergy * 10)` — hand-tuned ratio |
| **Known Limitations** | Thresholds are not calibrated against reference data; quality gates reject usable signal |

## Pulse Touch (Contact PPG)

| Field | Value |
|-------|-------|
| **Model ID** | `cPPG_v2.0_Welch` |
| **Task** | Contact heart rate estimation from finger-over-camera |
| **Architecture** | Red/Green channel selection, moving-average detrend, bandpass, Welch PSD |
| **Learned Components** | None |
| **Torch** | Required (rear camera flash) |
| **Channel Selection** | Green if variance > 1.5× Red, else Red |
| **Training Data** | None |
| **Validation Data** | None |
| **Quality Model** | `peakMag / (totalMag / N) * 0.1` — hand-tuned ratio |
| **Known Limitations** | Channel selection heuristic untested; quality formula arbitrary |

## Hemoglobin Estimator

| Field | Value |
|-------|-------|
| **Model ID** | `diumed_hhr_univariate_v2` |
| **Task** | Camera-based hemoglobin estimation from conjunctival image |
| **Architecture** | Univariate OLS linear regression |
| **Feature** | High Hue Ratio (HHR) — fraction of pixels with hue > 30° |
| **Training Data** | Zenodo 8277462 (Zhao et al., 2023), N=340 train |
| **Test Data** | N=86 held-out, random_state=42 |
| **Coefficients** | intercept=5.8155, β_HHR=7.5929 |
| **Test MAE** | 1.66 g/dL |
| **Test RMSE** | 2.09 g/dL |
| **Test Bias** | 0.23 g/dL |
| **Bland-Altman LOA** | −3.86 to +4.31 g/dL |
| **License** | Open (Zenodo, associated with PLOS ONE) |
| **Known Limitations** | Trained on RAW images, deployed on JPEG; no cross-device calibration; not FDA/CE validated |
| **Status** | EXPERIMENTAL — screening/awareness only |

## Sclera / Jaundice

| Field | Value |
|-------|-------|
| **Model ID** | None |
| **Status** | No model exists. Color analysis only. No bilirubin prediction. |
| **Reason** | No verified public dataset with smartphone sclera images + bilirubin ground truth |
