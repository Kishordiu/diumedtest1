# DiuMed — Modality Boundaries

## Purpose

Each DiuMed sensing modality operates on fundamentally different physics and must be developed, trained, and evaluated independently. This document defines what each modality can and cannot do.

## Bio-Aura (Remote rPPG)

### What It Is
- Optical estimation of heart rate from subtle facial color changes
- Camera captures reflected light from skin
- Blood volume pulse causes periodic variation in skin reflectance
- Signal extracted using POS/CHROM color-space projections

### What It Can Do (With Sufficient Signal)
- Estimate resting heart rate (±5-10 BPM with good signal)
- Detect presence of pulsatile signal
- Provide relative heart rate trends

### What It Cannot Do
- Replace a medical-grade pulse oximeter
- Measure blood pressure
- Measure SpO2 (requires NIR, not available on standard cameras)
- Measure respiratory rate reliably (possible but not validated)
- Work in darkness or extreme back-lighting
- Work with significant head motion

### Modality Boundary
- **Input**: Front-facing camera RGB video of face
- **Output**: Heart rate estimate + quality + confidence
- **NOT shared with**: Pulse Touch, Anemia, Sclera

---

## Pulse Touch (Contact PPG)

### What It Is
- Contact photoplethysmography using finger over rear camera + torch
- Torch illuminates tissue, camera captures transmitted/reflected light
- Blood volume pulse modulates light absorption

### What It Can Do
- Estimate resting heart rate (potentially ±3-5 BPM)
- Provide stronger signal than rPPG (direct tissue contact)

### What It Cannot Do
- Replace a pulse oximeter
- Measure SpO2 (single wavelength only — requires dual wavelength)
- Work without torch
- Work without finger contact

### Modality Boundary
- **Input**: Rear camera RGB video + torch, finger covering lens
- **Output**: Heart rate estimate + quality + confidence
- **NOT shared with**: Bio-Aura, Anemia, Sclera
- **NOT the same physics as**: rPPG (different light path, different ROI, different noise sources)

---

## Anemia Screening (Conjunctival Hb)

### What It Is
- Camera-based estimation of hemoglobin from conjunctival pallor
- Based on published research (Zhao et al., PLOS ONE)
- Uses High Hue Ratio (HHR) as proxy for hemoglobin

### What It Can Do
- Provide a screening-level hemoglobin estimate (MAE ~1.7 g/dL)
- Flag possible low hemoglobin for further investigation

### What It Cannot Do
- Replace a complete blood count (CBC)
- Diagnose anemia
- Provide clinically actionable hemoglobin values
- Account for camera ISP pipeline differences

### Modality Boundary
- **Input**: Single conjunctival image (front camera, lower eyelid)
- **Output**: Estimated Hb (g/dL) + uncertainty + screening signal
- **NOT shared with**: Bio-Aura, Pulse Touch, Sclera
- **NOT a diagnostic**: Experimental screening only

---

## Sclera Screening (Jaundice)

### What It Is
- Experimental color analysis of scleral images
- Currently: basic yellownessIndex (CIELAB b* axis)
- No bilirubin prediction model exists

### What It Can Do
- Compute color indices from scleral images
- Provide subjective color analysis

### What It Cannot Do
- Predict bilirubin levels
- Diagnose jaundice
- Differentiate pathological from physiological yellowing

### Modality Boundary
- **Input**: Single scleral image
- **Output**: Color indices only (no clinical prediction)
- **Status**: No validated model. Requires dataset research.

---

## Cross-Modality Rules

1. **Never train Bio-Aura and Pulse Touch together** — different physics, different noise, different ROI
2. **Never use clinical PPG to validate smartphone PPG** — different sensor characteristics
3. **Never use rPPG datasets to validate contact PPG** — fundamentally different signal paths
4. **Never share quality thresholds between modalities** — each has its own noise profile
5. **Never claim one modality's accuracy for another**
6. **Anemia and Sclera are single-image analyses** — do not apply temporal signal processing
