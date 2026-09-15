# DiuMed Research Provenance & Architectural References

This document explicitly lists the external research repositories and open-source projects that informed the architecture and engineering of DiuMed. 

**IMPORTANT**: DiuMed is a clean-room implementation. We did *not* blindly copy datasets, clinical thresholds, proprietary UI, or Python runtimes from these repositories. They served as research references to guide our custom, browser-native TypeScript implementations.

---

### 1. DSS Anemia
- **Repository**: [pjbk/dss-anemia](https://github.com/pjbk/dss-anemia)
- **What we learned**: Structured anemia-risk UX, model provenance tracking, and the discipline of separating train/test evaluation (e.g. clearly reporting held-out splits).
- **What we did NOT use**: Their Random Forest model or hematological/demographic clinical data thresholds. DiuMed’s pipeline remains strictly image-based (conjunctiva ROI → HHR → research regression).

### 2. rPPG-Toolbox
- **Repository**: [BMI-Lab-IITH/rPPG-Toolbox](https://github.com/BMI-Lab-IITH/rPPG-Toolbox)
- **What we learned**: Fundamental algorithmic structures for remote photoplethysmography (rPPG). We studied their implementations of POS, CHROM, detrending, and signal-window temporal handling.
- **What we did NOT use**: We did not port the Python toolbox into the browser. We wrote our own efficient TypeScript Web API pipelines optimized for `requestAnimationFrame`.

### 3. MediaPipe (Google AI Edge)
- **Repository**: [google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe)
- **What we learned**: Concepts for facial landmarks, stable forehead/cheek ROI localization, and geometry consistency.
- **What we did NOT use**: Obsolete APIs or full-resolution continuous tracking where downsampled ROI bounding is sufficient.

### 4. Contactless Vitals rPPG
- **Repository**: [harshidkoladara/contactless-vitals-rppg](https://github.com/harshidkoladara/contactless-vitals-rppg)
- **What we learned**: End-to-end architectural flow: Video Input → Face Mesh → Skin ROI → Filter → POS/CHROM → Spectral Analysis (Welch PSD) → BPM.
- **What we did NOT use**: Their UI, and we avoided introducing any Python runtime dependencies into the browser.

### 5. rPPG-BP
- **Repository**: [ubicomplab/rPPG-BP](https://github.com/ubicomplab/rPPG-BP)
- **What we learned**: Research reference for advanced rPPG signal quality and physiological estimation constraints.
- **What we did NOT use**: We did *not* implement Blood Pressure (BP) estimation. DiuMed produces no fake or experimental BP numbers.

### 6. FusionVitals
- **Repository**: [McJackTang/FusionVitals](https://github.com/McJackTang/FusionVitals)
- **What we learned**: Robustness considerations (environmental, motion, and illumination variability) for real-world daily-care rPPG.
- **What we did NOT use**: We did not bundle their external dataset, nor do we claim FusionVitals validation applies to DiuMed.

### 7. Medical Report ETL System
- **Repository**: [GunaPalanivel/Medical-Report-ETL-System](https://github.com/GunaPalanivel/Medical-Report-ETL-System)
- **What we learned**: Staged architectural approach to document understanding (Capture → OCR/Vision → Extraction → Normalization).
- **What we did NOT use**: We built our own secure extraction pipeline using Featherless Vision, and we enforce a mandatory User Review step before saving any data.

### 8. Maternal Health Risk Predictor
- **Repository**: [UBC-MDS-2022-23/maternal_health_risk_predictor](https://github.com/UBC-MDS-2022-23/maternal_health_risk_predictor)
- **What we learned**: Structured presentation of explainable risk factors and user-readable risk interpretations.
- **What we did NOT use**: We did not import their medical thresholds or reuse demographic thresholds. 

### 9. PyTorch Grad-CAM
- **Repository**: [jacobgil/pytorch-grad-cam](https://github.com/jacobgil/pytorch-grad-cam)
- **What we learned**: Optional explainability reference for deep learning models.
- **What we did NOT use**: DiuMed currently relies on classical computer vision regression and deterministic extraction. We do not use Grad-CAM to fake explainability. Explainability in DiuMed is achieved by showing the actual extracted features (e.g., HHR, Erythema Index).

### 10. sHEMO
- **Repository**: [sagnikgh1899/sHEMO](https://github.com/sagnikgh1899/sHEMO)
- **What we learned**: Conjunctival ROI acquisition, capture distance guidance (10-12 cm), lighting requirements, and autonomous ROI extraction patterns.
- **What we did NOT use**: We do not blindly import their medical claims. DiuMed's Hb feature remains strictly labeled as an EXPERIMENTAL CAMERA-BASED ESTIMATE for awareness only.

---
*DiuMed Engineering Team — Final Acceptance Audit*
