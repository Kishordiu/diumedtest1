# Final UI Research & Visual Language

## Primary Inspiration
**Source:** ECG Heart Monitor App UI Design
**URL:** [https://dribbble.com/shots/27514707-ECG-Heart-Monitor-App-UI-Design](https://dribbble.com/shots/27514707-ECG-Heart-Monitor-App-UI-Design)

### Extracted Principles
The final DiuMed product experience is built upon the following principles extracted from the reference design:

1. **Hierarchy & Authority:** The primary biometric value (e.g., BPM) dominates the screen with a very large, thin font weight. This creates immediate visual authority and calm clarity.
2. **Signal Visualization as Identity:** The waveform is not just data; it is part of the product's identity. It sits securely inside bounded instruments.
3. **Quality Communication:** Signal quality, confidence, and duration are grouped closely together in a high-contrast container immediately below the primary metric.
4. **Editorial History:** Measurement history (Records) is grouped by day ("TODAY", "YESTERDAY") rather than looking like an Excel spreadsheet. 
5. **Medical Calmness:** The color palette relies heavily on very dark grounds (Deep Mineral Black) with subtle borders (`white/5`) and desaturated text, avoiding bright neon gaming aesthetics.
6. **Supporting Metrics:** Deep technical details (Algorithm version, sampling rate) are hidden in secondary sheets or cards ("Technical Details"), available but not demanding attention.

### What DiuMed Intentionally DOES NOT Copy
1. **ECG Terminology:** The reference is an ECG app. DiuMed is an *optical* (rPPG/cPPG) app. We explicitly avoid words like "ECG," "electrocardiogram," or "electrical rhythm." Our wording is strictly "Optical Signal" and "Pulse Estimate."
2. **Diagnostic Claims:** The reference may imply medical certainty. DiuMed strictly labels everything as an "Estimate" or "Experimental Screening Signal."
3. **Exact Color Hues:** We did not copy the exact red/purple gradients. DiuMed uses its own established `signal-teal` and `signal-amber` tokens.
4. **Fake Interpolations:** DiuMed never renders a completely smooth sine wave for aesthetic purposes. The waveform is the literal data buffer extracted from the camera.
