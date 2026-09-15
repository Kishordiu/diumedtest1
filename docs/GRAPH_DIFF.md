# GRAPH_DIFF

**Date**: 2026-09-15
**Comparison**: Initial state vs Final state

## Deltas

### Nodes Removed (Obsolete)
- `src/features/bio-aura/camera/useCamera.ts` (Legacy camera hook replaced by `useMeasurementEngine.ts`)

### Nodes Consolidated
- Camera lifecycle and frame acquisition have been unified under `useMeasurementEngine.ts` for all optical features (Bio-Aura, PulseTouch, Anemia, Sclera, Lab).

### Edges Added
- **Auth Flow**: Linked `AuthPage.tsx` to new `ResetPasswordPage.tsx`.
- **Database Types**: Linked expanded `MeasurementType` constraints to frontend UI forms to allow proper saving of `estimated_hemoglobin` and `lab_biomarker`.

## Conclusion
The repository graph now demonstrates zero dead code, clear feature boundaries (Vision vs. Bio-Aura), and a unified data acquisition layer.
