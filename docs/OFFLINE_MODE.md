# OFFLINE_MODE

DiuMed is built on an Edge-First philosophy. Core features operate without internet.

## Feature Offline Classification

| Feature | Offline Status | Mechanism |
|---------|----------------|-----------|
| **Auth** | Cached Session | Supabase persists JWT in localStorage. Session valid until expiry. |
| **Bio-Aura (rPPG)** | ✅ FULLY LOCAL | POS algorithm runs in browser via Canvas/WebRTC. |
| **Pulse Touch (cPPG)** | ✅ FULLY LOCAL | Red-channel analysis runs in browser. Torch is device-dependent. |
| **Anemia/Hb Estimation** | ✅ FULLY LOCAL | HSV regression model is pure TypeScript. No model file download needed. |
| **Sclera Screening** | ✅ FULLY LOCAL | Color feature extraction runs in browser. |
| **Triage** | ⚠️ GRACEFUL DEGRADATION | Online: Gemini AI via Edge Function. Offline: Deterministic `offlineRules.ts`. |
| **Lab Report Scanner** | ❌ NETWORK REQUIRED | Gemini multimodal API processes the document. Shows "No network" message. |
| **Cloud TTS** | ⚠️ GRACEFUL DEGRADATION | Online: ElevenLabs via Edge Function. Offline: `window.speechSynthesis`. |
| **Emergency SOS** | ✅ DEVICE LOCAL | `tel:` and `sms:` intents work without internet. |
| **Record Sync** | ⚠️ QUEUED | Measurements saved to local IndexedDB/localStorage. Synced when online. |

## Sync States
| State | Meaning |
|-------|---------|
| `LOCAL` | Measurement exists only on device |
| `PENDING_SYNC` | Queued for upload |
| `SYNCED` | Confirmed saved to remote database |
| `SYNC_FAILED` | Upload attempt failed; will retry |

## Important Rules
- Never show `SYNCED` until server confirms the write
- Never fabricate a measurement value because the network is unavailable
- The Hb model runs locally — offline Hb estimation is a real capability
- Service Worker (Workbox) caches the application shell for instant offline startup

## Device-Dependent Features
| Capability | Dependency |
|-----------|-----------|
| Torch/Flash | `MediaStreamTrack.getCapabilities().torch` |
| Camera | `navigator.mediaDevices.getUserMedia` |
| Emergency Call | OS `tel:` URI handler |
| SMS | OS `sms:` URI handler |
| Browser TTS | `window.speechSynthesis` engine availability |
