<div align="center">
  <img src="./assets/hero.png" width="100%" alt="Diumed Clinical Diagnostic Scanner Hero" />
</div>

<p align="center">
  <a href="https://diufoundry.online"><img alt="Studio" src="https://img.shields.io/badge/DIU_FOUNDRY-CLINICAL_R%26D-0F291E?style=for-the-badge&logoColor=35D59D" /></a>&nbsp;
  <img alt="Platform" src="https://img.shields.io/badge/PLATFORM-ANDROID_%2F_WEB-0F291E?style=for-the-badge&logo=android&logoColor=35D59D" />&nbsp;
  <img alt="Vision" src="https://img.shields.io/badge/INFERENCE-MEDIAPIPE_VISION-0F291E?style=for-the-badge&logoColor=35D59D" />
</p>

# Diumed

**Edge-native clinical vitals telemetry and private computer-vision diagnostics for point-of-care medical triage.**

---

### The Problem
Field healthcare practitioners in rural and bandwidth-constrained clinics face severe bottlenecks triaging patient vitals with heavy, expensive bench equipment. Conventional medical computer-vision solutions require continuous high-bandwidth cloud video streaming, introducing unacceptable latency and privacy vulnerabilities for sensitive biometrics.

### The Solution
Diumed operates directly on mobile hardware via Capacitor and on-device MediaPipe vision tasks. It extracts multi-spectral optical vitals and facial/skin indicators locally, validates readings against offline clinical triage matrices, and delivers immediate synthesized audio guidance through native text-to-speech without cloud dependency.

---

### Core Architecture

- **Edge Computer Vision:** On-device `@mediapipe/tasks-vision` pipeline for non-invasive pupil, face mesh, and dermatological landmark tracking.
- **Hardware Sensor Abstraction:** Native camera and thermal sensor bridging via Capacitor Android runtime (`@capacitor/camera`, `@capacitor/filesystem`).
- **Acoustic Feedback:** Hands-free diagnostic audio prompts via `@capacitor-community/text-to-speech`.
- **Zero-Trust Patient Records:** Encrypted local biometric staging with selective end-to-end synchronization to Supabase HIPAA-compliant vaults.

---

### Quick Start

```bash
git clone https://github.com/Kishordiu/diumedtest1.git
cd diumedtest1

npm install
npm run dev

# Android native build
npx cap sync android
npx cap open android
```

---

<p align="center">
  <sub>Crafted with clinical precision by <a href="https://diufoundry.online">DIU FOUNDRY</a></sub>
</p>
