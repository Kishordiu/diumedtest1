# DiuMed Camera Capabilities

Understanding browser and hardware constraints is critical for DiuMed's dual optical measurement system.

## 1. WebRTC `getUserMedia` Constraints

### Bio-Aura (Remote rPPG)
*   **Facing Mode**: We request the front-facing camera using `facingMode: { ideal: "user" }`.
*   **Resolution**: We limit resolution (e.g., `width: { ideal: 640 }, height: { ideal: 480 }`) to minimize computational load during the `requestAnimationFrame` processing loop, preventing thermal throttling on Android.
*   **Frame Rate**: Requested at `frameRate: { ideal: 30 }`.

### Pulse Touch (Contact PPG)
*   **Facing Mode**: We request the rear camera using `facingMode: { ideal: "environment" }`.
*   **Torch (Flashlight)**: Requires specific handling.

## 2. Torch Support & Fallbacks

The device flashlight is controlled via the `torch` constraint applied to the `MediaStreamTrack`.

### Implementation Lifecycle
1.  Acquire stream via `getUserMedia`.
2.  Get the video track: `const track = stream.getVideoTracks()[0]`.
3.  Check capabilities: `const capabilities = track.getCapabilities?.()`.
4.  If `capabilities?.torch` is true, apply it: `track.applyConstraints({ advanced: [{ torch: true }] })`.

### Browser Quirks
*   **Android Chrome**: Generally excellent support for `torch`.
*   **iOS Safari**: Does **not** support the `torch` constraint. `track.getCapabilities()` will not list `torch`.
*   **DiuMed Fallback**: When `torch` is unsupported, the app does not crash. It updates the UI to instruct the user: *"Camera torch control isn't available on this device. Use a bright, stable light source."*

## 3. Strict Resource Management

To prevent media player accumulation and battery drain:
*   Only **ONE** `MediaStream` and **ONE** `<video>` element exist per scanner session.
*   On unmount, the exact sequence must be:
    1. Turn off torch (if active).
    2. Cancel `requestAnimationFrame`.
    3. `track.stop()` on all stream tracks.
    4. `video.srcObject = null`.
