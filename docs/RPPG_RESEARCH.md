# DiuMed rPPG & Contact PPG Research

This document outlines the engineering and mathematical principles underlying DiuMed's dual optical measurement system.

## A. Dual Optical Measurement Modes

DiuMed utilizes two fundamentally distinct acquisition pipelines. These must never be mixed or ambiguous in the database.

1.  **Bio-Aura (Remote rPPG)**
    *   **Method**: Facial remote photoplethysmography (rPPG).
    *   **Hardware**: Front-facing camera.
    *   **Algorithm Version**: `rPPG_v1.0`
    *   **Mechanism**: Detects minute volumetric changes in facial microvascular tissue by analyzing reflected ambient light.

2.  **Pulse Touch (Contact PPG)**
    *   **Method**: Contact photoplethysmography.
    *   **Hardware**: Rear-facing camera + device torch (flash).
    *   **Algorithm Version**: `cPPG_v1.0`
    *   **Mechanism**: Transmissive/reflective optical measurement. The torch illuminates the fingertip capillary bed, and the camera acts as a photosensor to measure blood volume changes per cardiac cycle.

---

## B. Remote rPPG (`rPPG_v1.0`)

### 1. ROI Strategy
Instead of full-frame averaging (which introduces background noise), DiuMed uses a **Center ROI with Skin-Color Masking**.
*   **Why**: Modern JS face detection (e.g., MediaPipe) requires heavy WASM payloads (~2-5MB). To maintain DiuMed's offline, instantaneous PWA priority, we use a central geometric crop.
*   **Validation**: Within this crop, pixels are converted to the YCbCr color space. Only pixels falling within established human skin-tone boundaries are averaged. If the valid pixel count drops below a threshold, the measurement is rejected.

### 2. Preprocessing & rPPG Algorithm
*   **Method Selected**: Chrominance-based (CHROM) or POS (Plane-Orthogonal-to-Skin).
*   **Why**: Simple green-channel tracking is highly susceptible to motion and ambient light flicker. CHROM/POS project the RGB signals onto a plane orthogonal to the skin tone, effectively canceling out specular reflection (specular variation affects all channels equally, whereas blood volume changes affect RGB differentially).
*   **Pipeline**:
    1.  Normalize RGB temporal traces.
    2.  Calculate projection matrices (e.g., $X = 3R - 2G$, $Y = 1.5R + G - 1.5B$).
    3.  Extract pulse signal $S = X - \alpha Y$.

### 3. Frequency Estimation
*   **Bandpass Filter**: 0.7 Hz to 3.0 Hz (42 BPM to 180 BPM).
*   **Analysis**: Fast Fourier Transform (FFT).
*   **Peak Detection**: We locate the highest power spectral density (PSD) peak within the physiological band.

---

## C. Pulse Touch (`cPPG_v1.0`)

### 1. Acquisition Requirements
*   **Camera**: `facingMode: { ideal: "environment" }`
*   **Torch**: `track.applyConstraints({ advanced: [{ torch: true }] })`.
*   **Fallback**: iOS Safari does not support the WebRTC torch constraint. The UI gracefully falls back to instructing the user to use ambient light.

### 2. Signal Processing
*   **Dominant Channel**: Red channel. (When a finger covers the lens with the torch on, the image is saturated with red light transmitted through the tissue).
*   **Finger Detection**: 
    *   If `RedMean < Threshold` or `SpatialVariance > Threshold`, the finger is missing or improperly placed.
*   **Pipeline**: Frame-level red average → Linear detrending (to remove baseline wander from finger pressure changes) → Moving average smoothing → FFT peak detection.

---

## D. Confidence & Failure Modes

**Confidence Score** is mathematically derived, not arbitrary. It considers:
1.  **Signal-to-Noise Ratio (SNR)**: Ratio of power in the dominant frequency band vs. the rest of the spectrum.
2.  **Motion Score**: Frame-to-frame standard deviation of the spatial luminance.
3.  **Frame Continuity**: Detection of dropped frames or erratic `requestAnimationFrame` intervals.

**Failure Conditions (Result = `null`)**:
*   Insufficient sampling rate (< 15 fps).
*   High motion artifact (Motion Score > Threshold).
*   Low SNR (No clear periodic peak).
*   Algorithm timeout (User unable to maintain position).

*Never fabricate a result to force a success state.*
