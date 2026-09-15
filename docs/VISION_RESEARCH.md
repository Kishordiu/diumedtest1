# DiuMed Vision Research (Experimental)

> [!WARNING]
> The features outlined in this document are strictly **Experimental Screening Features**. They do not constitute medical diagnostics.

This document scaffolds the research for Phase 2 (P2) computer vision capabilities in DiuMed.

---

## A. Anemia Screening (Experimental)

### Concept
Investigating the pallor of the palpebral conjunctiva (the inner lining of the lower eyelid) as a non-invasive screening indicator for hemoglobin levels.

### Proposed Pipeline (Future)
1.  **Acquisition**: High-resolution, front-facing camera capture.
2.  **Localization**: Strict requirement for a robust facial landmark model (e.g., MediaPipe Face Mesh) to isolate the eye region.
3.  **ROI Extraction**: Isolate the pixels corresponding specifically to the lower palpebral conjunctiva.
4.  **Quality Gate**: 
    *   Reject if eye is closed.
    *   Reject if lighting is insufficient, highly shadowed, or colored (non-white ambient light).
5.  **Color Feature Extraction**: Convert RGB to CIELAB or HSV color space to evaluate erythema (redness).
6.  **Heuristic/Model**: Compare color features against baseline heuristics.
7.  **Result**: "Screening signal suggests further evaluation" or "Unable to obtain a reliable ocular signal."

---

## B. Sclera / Jaundice Screening (Experimental)

### Concept
Evaluating the sclera (white of the eye) for yellowish discoloration indicative of elevated bilirubin.

### Proposed Pipeline (Future)
1.  **Acquisition**: High-resolution capture.
2.  **Localization**: Eye region isolation via landmarks.
3.  **Sclera Segmentation**: Binary mask separating the sclera from the iris and eyelids.
4.  **Illumination Normalization**: Crucial step. The color temperature of ambient light (e.g., warm indoor lighting vs. cool daylight) drastically alters perceived scleral color. A white-balance reference (like a piece of paper) is often required in clinical apps.
5.  **Color Statistics**: Analyze the 'b*' channel in CIELAB space (blue-yellow axis).
6.  **Result**: "Experimental scleral color screening signal" or "Image quality insufficient."

---

## C. Architectural Isolation
These features must reside in `src/features/vision/` and be strictly decoupled from the core Bio-Aura heart rate engine. They require distinct informed consent flows and explicit "NOT DIAGNOSTIC" labeling.
