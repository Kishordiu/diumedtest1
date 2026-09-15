# LEGACY CLEANUP

As part of the final measurement recovery and workflow cleanup, a complete dependency graph audit was performed on `src/`. The following redundant or overly complex legacy modules were identified and replaced.

## 1. Heart Sensor UI & Masking Overlays
- **Action**: Removed in previous refactor, replaced with `CameraLensInstrument.tsx`
- **Why it was obsolete**: The previous codebase used a complex SVG heart-shaped mask that scaled independently of the actual video feed, obscuring the camera view and making it difficult for users to know if they were correctly placing their finger or face.
- **Replacement**: `CameraLensInstrument` explicitly standardizes optical inputs into clear tool-like shapes (circles for fingers, rectangles for faces) without obscuring the source video stream.

## 2. Redundant Signal Validators
- **Action**: Removed multi-patch consensus gating from `rppgEngine.ts` and `PulseTouchEngine.ts`.
- **Why it was obsolete**: The legacy logic required multiple overlapping estimators (e.g. POS and CHROM, Forehead and Cheek) to agree within 5 BPM, or it would abort the entire measurement. This "engineering-console" logic actively prevented normal usage in realistic lighting.
- **Replacement**: The pipeline now uses the single highest-SNR (Signal-to-Noise Ratio) patch and algorithm (POS vs CHROM) as authoritative, abandoning cross-patch consensus voting.

## 3. UI State Machines
- **Action**: Simplified `MeasurementPhase` transitions in `useMeasurementEngine.ts`.
- **Why it was obsolete**: Previously, if a single frame dropped in quality, the system erased the `stableBpmBufferRef` and threw the user back to the beginning.
- **Replacement**: State machine logic was updated to tolerate noise and use a progressive disclosure UI ("Finding your signal", "Almost there") rather than exposing technical error states to the user.

## Proof of No Active Dependency
- `npm run build` succeeds.
- Typescript compiler (`tsc -b`) returns no missing references or orphans.
- Vite build properly minifies and bundles all remaining features.
