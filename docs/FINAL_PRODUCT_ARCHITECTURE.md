# Final Product Architecture

DiuMed is engineered as a **Zero-Hardware, Edge-First Health OS**. The product architecture is strictly aligned with these pillars to provide a trustworthy, privacy-preserving experience.

## 1. Zero Hardware
DiuMed removes the friction of dedicated medical wearables. It utilizes the hardware already available to the user (their smartphone) as the primary sensor.
- **Bio-Aura:** Uses the front-facing camera to extract subtle color variations in facial skin (rPPG).
- **Pulse Touch:** Uses the rear camera and torch to measure blood volume changes in the fingertip (cPPG).
- **Vision Screeners:** Uses the camera for single-shot colorimetry of the conjunctiva (Anemia) and sclera (Jaundice).

## 2. Edge / Offline First
DiuMed does the heavy mathematical lifting directly on the device.
- The rPPG and cPPG signal extraction, Fourier transforms (FFT), and peak detection run entirely in the browser's JavaScript engine.
- This ensures that a user's video feed is **never** transmitted to a cloud server.
- The Triage decision-support engine runs on an offline-first rule system, ensuring basic symptom guidance is available without internet access.

## 3. Zero Trust & Privacy
Health data is exceptionally sensitive. DiuMed’s architecture enforces strict privacy:
- **Client-Side:** No privileged API secrets or service role keys exist in the client bundle.
- **Data Provenance:** Every measurement record in the Supabase database retains its exact algorithmic provenance, sampling rate, and image quality metrics.
- **Edge Functions:** The Lab Report Scanner uses an authenticated Supabase Edge Function to proxy calls to the Gemini Vision AI. The image is parsed and immediately discarded from memory; it is never stored in a bucket unless explicitly requested by a user's local consent.
- **Row Level Security (RLS):** All data is protected by Supabase RLS policies. A user can only access their own profiles, records, and emergency events.

## 4. Product Boundaries
The system is divided into clear product workflows to avoid confusing screening with diagnosis:
- **Measurement:** Bio-Aura & Pulse Touch (Optical Heart Rate Estimates)
- **Screening:** Anemia & Sclera (Experimental Optical Signals)
- **Lab Extraction:** Document Scanner (AI OCR + Mandatory User Review)
- **Triage:** Symptom checking and decision support
- **Emergency:** Device handoff and user-initiated escalation
