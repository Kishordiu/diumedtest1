# Hemoglobin Estimator — Current Model Status

## Status: experimental development prototype

The current application runtime calls `predictLinear('hb_estimator', [highHueRatio])` using the embedded weights in `src/shared/ml/model_weights.json`.

- Runtime model identifier: `diumed_hb_edge_ml`
- Runtime version label: `0.1.0-prototype`
- Inference: local linear calculation, available offline
- Input: high-hue ratio from a selected conjunctiva region
- Output: an experimental numeric estimate for interface testing only

## Provenance boundary

The repository references the paper/data DOI [10.5281/zenodo.8277462](https://doi.org/10.5281/zenodo.8277462), but the current embedded weights and code do **not** establish a reproducible training pipeline showing that these exact weights were trained or validated against that dataset. The weights file labels this as a simulated proxy. Therefore the application must not present the reference DOI as proof of training provenance.

## Validation status

For the current embedded weights, independently verified validation metrics are **not established**. The runtime reports no MAE, RMSE, limits of agreement, or validated sample count. Older documentation and unit tests described a different univariate model and its coefficients; those numbers do not apply to the current runtime weights.

## Safety and limitations

- Experimental software only. Not a medical device, diagnosis, laboratory result, or substitute for professional care.
- Do not use this output to diagnose, rule out, or treat anemia.
- The model has no verified independent clinical validation, external cohort evaluation, or cross-device calibration.
- Browser camera frames are affected by lighting, device image processing, colour balance and compression.
- Do not show a confidence/uncertainty interval unless one is established for the exact deployed model.
- Any future validated release must document the data licence, reproducible training script, versioned weights, held-out test protocol and independently reviewed metrics.

The implementation should continue to fail closed for insufficient pixel quality or out-of-range model output.
