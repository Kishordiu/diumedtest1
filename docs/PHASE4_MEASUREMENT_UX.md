# Phase 4: Measurement Experience, Live Feedback & Results Report Reconstruction

## Overview
Phase 4 completely revamps the user measurement experience. Instead of an opaque "Acquiring Signal..." loading state, the user is now taken on a real-time journey showing precisely what the optical sensor is doing, backed by explicit state machines.

## Architecture

### State Machine (\`useMeasurementEngine\`)
The measurement lifecycle has been refactored from scattered booleans into a rigorous \`MeasurementPhase\` state machine:

1. **Initialization:** \`IDLE\` \`->\` \`REQUESTING_CAMERA\` \`->\` \`CAMERA_READY\`
2. **Subject Detection:** \`FINDING_FACE\` / \`FINGER_NOT_DETECTED\` \`->\` \`FACE_LOCKED\` / \`FINGER_DETECTED\`
3. **Signal Acquisition:** \`SIGNAL_ACQUIRING\` \`->\` \`SIGNAL_QUALITY_CHECK\` \`->\` \`MEASURING\`
4. **Result Lock:** \`RESULT_CANDIDATE\` \`->\` \`STABILITY_CONFIRMATION\` \`->\` \`RESULT_READY\`

This engine manages the camera stream, extracts optical frames (either via facial ROI or contact pixel average), and maintains a sliding window buffer of the last 12 seconds.

### Sliding Window Processor (\`rppgEngine\` & \`PulseTouchEngine\`)
Previously, the engine would capture a fixed 8-second buffer, halt, and compute one result. 
Now, it processes a rolling buffer of 12 seconds every 10 frames (~3fps). This provides:
- Live feedback on `signalQuality`
- Live rendering of the filtered POS/detrended signal wave
- A \`candidateBPM\` that is verified for stability over a fixed time span before declaring \`RESULT_READY\`.

### Live Visualization (\`LiveSignalGraph\`)
A custom High-DPI HTML Canvas component renders the raw \`waveformBuffer\`. This is mathematically derived from the exact filtered signal inside the POS algorithm (for Bio-Aura) or detrended signal (for Pulse Touch). There are **no faked sine waves**. If the user moves, the wave flatlines or scrambles, instantly showing them why the measurement failed.

### Robust Reporting (\`MeasurementResultPage\`)
When a measurement locks, the system transitions to a dedicated report screen that explicitly declares:
- The measured value
- The signal confidence & quality
- A snapshot of the exact waveform chunk that generated the result
- Hardware source (facial vs contact)

This data is then saved into the PostgreSQL metadata column.

### Hardware Validation (\`ActivitySensor\`)
Instead of faking pedometer steps when a sensor is missing, a new \`ActivitySensor\` actively probes the browser capabilities. If \`DeviceMotionEvent\` is unsupported (or denied), the UI explicitly says "Activity tracking unavailable in this browser".

## Conclusion
The application now behaves like a professional hardware monitoring tool, providing rigorous feedback loops that explain failures instead of hiding them.
