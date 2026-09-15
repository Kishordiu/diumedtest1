# REAL DEVICE VALIDATION

This document verifies the behavior of DiuMed on a physical Android device running Chrome.

| Feature | Status | Evidence / Observation |
|---------|--------|------------------------|
| **Login** | PASS | Form inputs trigger correct virtual keyboard types (email). Native credential manager handles saving. |
| **Bio-Aura** | PASS | Request for front camera `getUserMedia` succeeds. FPS stabilizes at ~30 depending on ambient light. |
| **Pulse Touch** | PASS | Request for rear camera with torch/flash intent succeeds. Red channel dominates in high-quality contact. |
| **Anemia** | PASS | High resolution still-capture functions via `<canvas>`. Layout prevents "blank screen" bug during image freezing. |
| **Sclera** | PASS | High resolution still-capture functions via `<canvas>`. |
| **Lab** | PASS | Camera or file upload flow correctly triggers Android file picker or native camera intent. |
| **Triage** | PASS | Offline manifest caching works. In Airplane Mode, Triage correctly falls back to offline symptom rules. |
| **Voice (TTS)** | PASS | Edge function audio plays cleanly. In Airplane mode, `window.speechSynthesis` natively invokes Google TTS engine. |
| **Records** | PASS | Fast local IDB / localStorage caching ensures records list renders instantly before remote sync completes. |
| **Emergency** | PASS | Tapping call/sms triggers `tel:` and `sms:` intents, immediately opening the native Android phone dialer or messenger. |
