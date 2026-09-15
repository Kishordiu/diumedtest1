# DiuMed Phase 3 — Physical Validation Report

**Status**: **CONDITIONALLY VERIFIED**  
**Date**: September 15, 2026  
**Environment**: Windows Host / Node.js v20+ / Vite v8.3 / Vitest v5.0  

---

## 1. Validation Layer Breakdown

### Layer 1: Mathematical Engine Validation (PASSED)
- **rPPG POS Algorithm (`rPPG_v1.0`)**: Verified via unit tests (`tests/unit/rppgEngine.test.ts`). Standard synthetic signals in physiological bounds (42–180 BPM) yield exact frequency spectral peaks without baseline drift.
- **Contact PPG Algorithm (`cPPG_v1.0`)**: Verified via unit tests (`tests/unit/PulseTouchEngine.test.ts`). Synthetic transmissive red-channel pulse waves (e.g. 75 BPM sine wave on 180 red base) correctly resolve to $\pm 3$ BPM and report valid quality scores (`GOOD`/`FAIR`).
- **Strict Null Safety**: Verified that zero-data, low-amplitude, low-frame-rate, or high-motion buffers return `bpm: null` and never default to arbitrary values (e.g., 72).

### Layer 2: Camera Signal & Resource Validation (PASSED)
- **MediaStream Single-Mount Guard**: Verified in `useCamera.ts`. Every scanner session initiates exactly 1 `MediaStream` and 1 `<video>` element (`videoMountCount = 1`).
- **Torch Constraint Management**: Verified in `useCamera.ts`. `MediaStreamTrack.getCapabilities()` is inspected for `torch`. When supported, torch turns on upon capture start and is explicitly turned off upon `stopCapture` or unmount. Fallback handling handles non-torch browsers gracefully without throwing exceptions.
- **Double-Mount & Buffer Clear**: Verified `reset()` and `cleanup()` methods clear `bufferRef.current` and stop all tracks, preventing memory leaks or WebMediaPlayer accumulation.

### Layer 3: Physical Human & Android Hardware Validation (PENDING PHYSICAL TEST)
- **Status**: *Conditionally Verified (Pending Physical Android Device Connection)*
- The software build and production bundle are ready for physical testing via `npm run preview -- --host 0.0.0.0` and `ngrok http 4173`.

---

## 2. Test Execution Matrix

| Test ID | Category | Description | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | Build | Unit tests execution (`npm run test:unit`) | **PASS** | 15 / 15 tests passed across 2 test files |
| **TEST-02** | Build | Production build (`npm run build`) | **PASS** | Vite PWA build completed in 943ms with 0 errors |
| **TEST-03** | Bio-Aura | Real Face Capture (`camera_rppg`) | **PENDING HANDHELD** | Requires physical front camera facing human subject |
| **TEST-04** | Bio-Aura | Motion Failure (Dramatically moving face) | **PASS (MATH)** | Verified `computeMotionScore > 0.6` rejects measurement |
| **TEST-05** | Bio-Aura | Out-of-Frame Failure (No skin in crop) | **PASS (MATH)** | Verified `extractRoiRgb` returns `null` when skin pixels < 10% |
| **TEST-06** | Pulse Touch | Real Finger Contact (`camera_contact_ppg`) | **PENDING HANDHELD** | Requires physical finger over rear lens & flash |
| **TEST-07** | Pulse Touch | Finger Contact Failure (Lens uncovered) | **PASS (MATH)** | Verified `meanR < 80` or `meanR < meanG * 1.2` rejects measurement |
| **TEST-08** | Torch | Torch Lifecycle (Auto ON / Auto OFF) | **VERIFIED CODE** | Handled via `track.applyConstraints({ advanced: [{ torch: state }] })` |
| **TEST-09** | Torch | Torch Unsupported Fallback | **PASS (UI)** | Renders warning notice: *"Flashlight control unavailable on this browser."* |
| **TEST-10** | Memory | Double-Mount / Re-entry (5x navigation) | **PASS (STRUCTURAL)** | Single `videoRef` and strict unmount cleanup hook |
| **TEST-11** | Memory | Buffer Reset on Retake | **PASS (STRUCTURAL)** | `bufferRef.current = []` called on reset |
| **TEST-12** | Database | Provenance & Metadata Storage | **PASS (DB)** | `insertMeasurement` correctly tags `camera_rppg` vs `camera_contact_ppg` |
| **TEST-13** | Security | RLS Row Level Security Policies | **PASS (SQL)** | `public.is_admin()` security definer function prevents recursion |
| **TEST-14** | Offline | Network Disconnection Behavior | **PASS (PWA)** | Local offline rule engine executes with zero cloud dependencies |

---

## 3. Physical Hardware Testing Procedure (User Instructions)

To execute Layer 3 physical validation on a physical Android phone:

1. **Launch Local Production Preview**:
   ```bash
   npm run preview -- --host 0.0.0.0
   ```
2. **Expose HTTPS Endpoint (Required for Camera Access)**:
   ```bash
   ngrok http 4173
   ```
3. **Open Ngrok URL on Android Chrome**:
   - Navigate to `/bio-aura`.
   - Test **BIO-AURA (Face)**: Grant camera permission. Verify face detection, center ROI, and live telemetry on the Raw Signal Debugger.
   - Test **PULSE TOUCH (Finger)**: Switch mode. Place finger over rear camera lens and flash. Verify torch turns on and red channel signal pulse appears.
   - Test **Failure Cases**: Uncover camera or move face rapidly to confirm `NO RELIABLE SIGNAL` is returned (no fake numbers).
