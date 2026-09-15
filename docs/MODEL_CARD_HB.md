# DiuMed — Hemoglobin Model Card (v2.0.0)

## Model Identification

| Field | Value |
|-------|-------|
| Name | `diumed_hhr_univariate_v2` |
| Version | 2.0.0 |
| Type | Univariate OLS Linear Regression |
| Feature | High Hue Ratio (HHR) |
| Target | Hemoglobin concentration (g/dL) |
| Status | EXPERIMENTAL — screening/awareness only |

## Dataset

| Field | Value |
|-------|-------|
| Source | Zhao L, Jay G (2023) |
| DOI | 10.5281/zenodo.8277462 |
| Publication | PLOS ONE (2024) |
| License | Open access (Creative Commons, associated with PLOS ONE) |
| Total samples | 426 valid rows |
| Ground truth | Laboratory hemoglobin (HBl, g/dL) from CBC |
| Feature | Average High Hue Ratio (HHR) from conjunctival images |
| Population | Emergency Department patients |
| Image type | Smartphone conjunctival photos |
| Imaging protocol | Lower eyelid exposure |

## Training

| Field | Value |
|-------|-------|
| Split | 80% train (N=340), 20% test (N=86) |
| Random seed | 42 |
| Method | Ordinary Least Squares (OLS) |
| Formula | `Hb = 5.8155 + 7.5929 × HHR` |
| Intercept | 5.8154597370440495 |
| Coefficient (β₁) | 7.592921035710115 |

## Test Set Performance (N=86)

| Metric | DiuMed Result | Published Reference (Zhao et al.) |
|--------|--------------|-----------------------------------|
| MAE | 1.66 g/dL | — |
| RMSE | 2.09 g/dL | — |
| Bias | 0.23 g/dL | 0.10 g/dL |
| LOA Lower | −3.86 g/dL | −4.73 g/dL |
| LOA Upper | +4.31 g/dL | +4.93 g/dL |

## Feature Extraction

1. Circular ROI centered on conjunctival region
2. For each pixel: convert RGB to HSV
3. Count pixels with Hue > 30°
4. HHR = (high-hue pixels) / (total pixels)

## Validity Bounds

| Condition | Action |
|-----------|--------|
| HHR produces Hb < 2.0 g/dL | Return null (model failure) |
| HHR produces Hb > 24.0 g/dL | Return null (model failure) |
| ROI pixel count < 100 | Return null (insufficient quality) |
| Valid range | Return estimate with full uncertainty |

## Known Limitations

1. **JPEG ISP variance**: Training data used RAW images; deployment uses JPEG (auto white balance, gamma, compression artifacts introduce uncontrolled variance)
2. **Cross-device calibration**: Not performed. Different phone cameras have different ISP pipelines
3. **Population bias**: Trained on ED patients from one institution — may not generalize to all populations
4. **Skin tone**: HHR may interact with melanin levels differently across skin tones
5. **Lighting**: Clinical lighting during data collection ≠ user's ambient lighting
6. **Single-feature model**: HHR alone captures limited variance in Hb

## Improvement Candidates

1. **Multi-feature model**: RGB means, HSV stats, CIELAB a*/b*, Erythema Index
2. **Regularized regression**: Ridge, Lasso, or Elastic Net
3. **Non-linear models**: Random Forest, Gradient Boosted Trees
4. **Cross-device normalization**: White-reference calibration card
5. **Additional datasets**: sHEMO, Hemovision, DSS-Anemia (pending verification)
