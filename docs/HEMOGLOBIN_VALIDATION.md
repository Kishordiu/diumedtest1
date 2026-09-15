# HEMOGLOBIN_VALIDATION

## Model Status: DEPLOYED (Experimental)
DiuMed now includes a real hemoglobin estimation model based on published peer-reviewed research.

## Model Identity
- **Name**: `diumed_hhr_univariate_v2`
- **Version**: `2.0.0`
- **Format**: Pure TypeScript
- **Method**: Univariate ordinary least squares (OLS) linear regression
- **Runs Offline**: YES — fully local, no network required

## Provenance & Training
This is a **genuinely trained DiuMed model** derived from an openly available research dataset.
- **Dataset Source**: Zhao L, Jay G (2023). "Prediction of Severe Anemia in Real-Time using a Smartphone Camera Application Processing Conjunctival Images" (Zenodo).
- **DOI**: [10.5281/zenodo.8277462](https://doi.org/10.5281/zenodo.8277462)
- **Training Method**: N=426 total valid records/participants; 340 used for training and 86 for the held-out test split (random_state=42).
- **Regression Formula**: `Actual Hgb = 5.8154597370440495 + 7.592921035710115 * Average HHR`

## License
- Open dataset published under open access associated with PLOS ONE publications.
- Implementation and model training are original DiuMed work.

## Q&A

**What image is captured?**
An image of the lower palpebral conjunctiva (the pink tissue inside the lower eyelid).

**Why conjunctiva?**
The palpebral conjunctiva has dense, superficial microvasculature with minimal melanin interference, making it the most reliable non-invasive site for optical hemoglobin estimation across diverse skin tones. This is the same clinical site physicians examine during physical pallor assessment.

**What features are extracted?**
From the conjunctival ROI, the system extracts HSV color-space features:
- **High Hue Ratio (HHR)**: Fraction of pixels with hue > 30°. Lower Hb → paler conjunctiva → higher hue values. This is the primary predictor.
- **Mean Saturation**: Color vividness. Healthy red conjunctiva has higher saturation.
- **Mean Value/Brightness**: Illumination normalization factor.

**What model is used?**
A univariate linear regression mapping HHR to hemoglobin concentration.

**Where was it trained?**
DiuMed independently trained this model (v2.0) using the open dataset provided by Zhao et al. (Zenodo DOI: 10.5281/zenodo.8277462).

**What validation metrics exist?**

**DiuMed Internal Held-Out Evaluation (N=86):**
*(Note: This is an internal split, NOT an external clinical validation)*
- **MAE**: 1.66 g/dL
- **RMSE**: 2.09 g/dL
- **Bias**: +0.23 g/dL
- **Bland-Altman LOA**: -3.86 to +4.31 g/dL

**Published Zhao 2024 Metrics (For Reference Only):**
*(Prospective external study)*
- **N**: 435
- **Accuracy**: 75.4%
- **Bland-Altman LOA**: -4.73 to +4.93 g/dL
- **AUC at 7 g/dL**: 0.92
- **AUC at 9 g/dL**: 0.90

**What uncertainty is reported?**
±4.3 g/dL (based on the limits of agreement from DiuMed's internal test set split).

**What happens offline?**
The model runs entirely in the browser — no network required. Camera capture, feature extraction, and regression inference are all local.

**What happens when image quality fails?**
The image must pass brightness (40–230), contrast (>15), and saturation (>0.05) gates. If any gate fails, the system returns `estimatedHb: null` with reason `INSUFFICIENT_QUALITY`.

**What happens when model is unavailable?**
If features cannot be extracted (e.g., too few pixels in ROI), the system returns `null`. The UI states: "Hemoglobin estimation model could not produce a result for this image."

**What happens when the model generates an implausible value?**
Unlike earlier iterations that silently clamped outputs between 3.0–20.0, the v2.0 model explicitly rejects estimates outside plausible bounds (e.g. < 2.0 or > 24.0) with an `INVALID_INPUT` status, indicating the features failed to generalize.

**Why is it a screening estimate instead of diagnosis?**
1. The model was trained on a convenience sample of ED patients, not a general population.
2. The original dataset used RAW smartphone conjunctival imaging; DiuMed uses browser-accessible camera frames (JPEG/WebRTC). **Camera pipeline, lighting, device characteristics and color processing may affect generalization.**
3. Cross-device calibration has NOT been performed.
4. DiuMed has NOT undergone independent clinical validation.
5. The result is explicitly labeled "EXPERIMENTAL CAMERA-BASED ESTIMATE" for awareness and screening only.

## HHR Implementation Details & Differences
DiuMed's High Hue Ratio (HHR) extracts the fraction of pixels with hue > 30° in a standard HSV color space (H mapped 0-360°).
- **RGB→HSV**: Standard conversion used.
- **ROI**: Circular selection at the lower-middle of the frame.
- **Averaging**: Simple arithmetic mean across valid pixels in the ROI.
- **Quality Gates**: Implemented brightness, contrast, and saturation minimums.
- **Unavoidable Difference**: The published research processed uncompressed RAW images to avoid ISP (Image Signal Processor) bias. Browser-based APIs (Canvas/WebRTC) only provide ISP-processed frames (auto-white-balance, auto-exposure, JPEG compression artifacts). This fundamentally alters color space mapping and means the derived HHR may shift unpredictably across different mobile devices.

## Known Limitations
> [!WARNING]
> **Experimental camera-based Hb estimate. Intended for awareness/screening demonstration only. Not a laboratory measurement and not clinically validated.**

- JPEG vs RAW: The original research used RAW images; smartphone JPEG processing pipelines vary across devices.
- Single-device study: The original dataset was captured using specific smartphone models.
- Adult population: Thresholds are calibrated for adult populations; pediatric/pregnancy thresholds differ.
- Lighting: Ambient lighting variations can affect color fidelity.
- **Model Status**: Research-dataset reproduction / internal held-out evaluation (NOT clinically validated).
