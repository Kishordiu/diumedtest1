# JUDGE QA

**1. Why smartphone?**
DiuMed is a Zero-Hardware Health OS. It uses the smartphone the user already owns — its camera, processing power, and network — to provide health observations without requiring additional medical hardware like a smartwatch or pulse oximeter.

**2. How does rPPG work?**
Bio-Aura uses remote photoplethysmography (rPPG). The front camera captures facial video. Micro-changes in skin color caused by blood volume pulsation are extracted from the facial ROI. The POS (Plane-Orthogonal-to-Skin) algorithm separates the pulse signal from motion and illumination noise. Frequency analysis of the resulting temporal signal yields a candidate heart rate (BPM) which must pass quality and stability gates before being reported.

**3. How does Pulse Touch differ?**
Pulse Touch uses contact PPG (cPPG) via the rear camera. The user places their fingertip over the camera lens (with torch if supported). Blood volume changes modulate the red channel intensity of the captured video. This produces a stronger, cleaner signal than rPPG because it eliminates ambient lighting and motion artifacts, but requires physical contact.

**4. How does Hb estimation work?**
DiuMed captures an image of the palpebral conjunctiva (inside of the lower eyelid). It extracts HSV color features from the conjunctival ROI, primarily the High Hue Ratio (HHR) — the fraction of pixels with hue values above 30°. A multivariate linear regression maps HHR, mean saturation, and mean brightness to an estimated hemoglobin concentration in g/dL.

**5. Where did the Hb model/data come from?**
The model was independently trained by DiuMed using an openly available dataset published by Zhao et al. (Zenodo DOI: 10.5281/zenodo.8277462). This dataset contains conjunctival image features and laboratory hemoglobin values from Emergency Department patients at Rhode Island Hospital. DiuMed performed an 80/20 train/test split on this dataset (N=426 total valid records/participants; 340 used for training and 86 for the held-out test split) to derive the coefficients for our univariate model (`Actual Hgb = 5.8154597370440495 + 7.592921035710115 * Average HHR`).

**6. Is Hb clinically validated?**
No. While the original Zhao 2024 prospective external study reported strong performance (N=435, Accuracy 75.4%, LOA -4.73 to +4.93 g/dL), DiuMed's own internal held-out evaluation showed a test MAE of 1.66 g/dL and LOA of -3.86 to +4.31 g/dL on our 86-person split. DiuMed has NOT undergone independent prospective clinical validation. The result is clearly labeled "EXPERIMENTAL CAMERA-BASED ESTIMATE" for awareness and screening only.

**7. Why is the result experimental?**
Three reasons: (1) The original study used RAW format images while DiuMed uses JPEG, introducing ISP variance. (2) Cross-device calibration has not been performed. (3) DiuMed has not been clinically validated independently. Engineering validation ≠ model validation ≠ clinical validation.

**8. How does offline mode work?**
Core features — Bio-Aura rPPG, Pulse Touch cPPG, Hb estimation, Sclera screening — run entirely locally in the browser with zero network dependency. The Hb model is pure TypeScript with no external model files. Triage degrades to a deterministic local rule engine. Only Lab parsing (requires Gemini API) and cloud TTS require a network connection.

**9. What works without internet?**
Bio-Aura: YES. Pulse Touch: YES. Anemia/Hb estimation: YES. Sclera screening: YES. Offline triage rules: YES. Lab parsing: NO. Cloud TTS: NO (falls back to browser speechSynthesis). Record sync: Queued until online.

**10. How is privacy handled?**
All health data is stored in Supabase PostgreSQL with Row Level Security (RLS) enforcing `auth.uid() = user_id`. No API keys are exposed in the frontend. Edge Functions handle all secret-bearing integrations. No conjunctival images are saved to any server — processing is local.

**11. How does Supabase RLS protect users?**
Every query against `health_measurements`, `profiles`, and related tables includes a server-side filter that only returns rows where the `user_id` column matches the authenticated JWT's `auth.uid()`. A user cannot access another user's health data.

**12. What happens when the camera is unavailable?**
The system explicitly handles camera permission denial and hardware absence. The UI displays "Camera access denied or unavailable" and offers a retry. No measurement is fabricated.

**13. What happens if torch is unavailable?**
Pulse Touch checks `MediaStreamTrack.getCapabilities()` for torch support. If unavailable, the measurement proceeds without torch but the user is informed that accuracy may be reduced. The torch is always turned off on unmount, result, failure, or timeout.

**14. How does emergency work?**
Emergency actions use real OS handoffs via `tel:` and `sms:` URI schemes. DiuMed never claims "SOS SENT" — it states "Emergency action handed off to your device" because DiuMed cannot verify whether the user actually completed the call.

**15. How is lab data different from camera estimation?**
Lab data comes from a physical blood test processed by laboratory equipment — it is the clinical ground truth. Camera estimation is an experimental optical screening signal. Records display both separately with clear provenance labels: "Camera Estimate (Experimental)" vs "Laboratory Result (Source: CBC report)".

**16. Why is DiuMed zero-hardware?**
Because it requires nothing beyond the smartphone the user already owns. No external sensors, no Bluetooth devices, no lab equipment for the primary screening features. This makes it accessible in low-resource settings where specialized medical hardware is unavailable.
