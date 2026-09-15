import { useCallback, useEffect, useRef, useState } from 'react';
import { log } from '../../../core/logger';
import { 
  type MeasurementPhase, 
  type MeasurementProgress, 
  type FinalMeasurementResult,
  type SignalQuality 
} from './types';
import { type RppgSample, type RppgResult } from '../rppg/rppgEngine';

interface UseMeasurementEngineOptions {
  source: 'camera_rppg' | 'camera_contact_ppg';
  facingMode: 'user' | 'environment';
  torch?: boolean;
  extractFrame: (video: HTMLVideoElement, canvas: HTMLCanvasElement, timestamp: number) => RppgSample | null;
  processBuffer: (buffer: RppgSample[]) => RppgResult;
  onResultReady: (result: FinalMeasurementResult) => void;
  targetWindowSeconds?: number;
  maxTimeoutSeconds?: number;
}

const FRAME_INTERVAL_MS = 33; // ~30 fps
const FPS_WINDOW = 60;

export function useMeasurementEngine({
  source,
  facingMode,
  torch = false,
  extractFrame,
  processBuffer,
  onResultReady,
  targetWindowSeconds = 10,
  maxTimeoutSeconds = 30,
}: UseMeasurementEngineOptions) {
  const [progress, setProgress] = useState<MeasurementProgress>({
    phase: 'IDLE',
    elapsedSeconds: 0,
    targetWindowSeconds,
    framesCaptured: 0,
    samplingRate: 0,
    signalQuality: 'UNKNOWN',
    signalAmplitude: 0,
    motionScore: 0,
    roiQuality: 0,
    confidence: 0,
    candidateBPM: null,
    stableCandidateBPM: null,
    qualityHistory: [],
    waveformBuffer: [],
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  
  // State refs for the RAF loop
  const bufferRef = useRef<RppgSample[]>([]);
  const startTsRef = useRef<number>(0);
  const lastFrameTimesRef = useRef<number[]>([]);
  const phaseRef = useRef<MeasurementPhase>('IDLE');
  const stableBpmBufferRef = useRef<number[]>([]);

  const updatePhase = (newPhase: MeasurementPhase, reason?: string) => {
    phaseRef.current = newPhase;
    setProgress(p => ({ ...p, phase: newPhase, reason: reason || p.reason }));
  };

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && torch) {
        try {
          // @ts-ignore
          track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        } catch (e) {}
      }
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [torch]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const start = useCallback(async () => {
    cleanup();
    updatePhase('PREPARING');
    bufferRef.current = [];
    stableBpmBufferRef.current = [];
    startTsRef.current = 0;

    try {
      updatePhase('PERMISSION');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const mainTrack = stream.getVideoTracks()[0];
      if (mainTrack && torch) {
        const caps = mainTrack.getCapabilities?.();
        // @ts-ignore
        if (caps && caps.torch) {
          try {
            // @ts-ignore
            await mainTrack.applyConstraints({ advanced: [{ torch: true }] });
          } catch (e) {
            log.error('Torch failed', e);
            updatePhase('TORCH_UNAVAILABLE');
            // We can decide to keep going or fail. For PPG, torch is usually required.
            // But let's proceed and if signal is poor, it will fail naturally.
          }
        } else {
            updatePhase('TORCH_UNAVAILABLE');
        }
      }

      updatePhase('CAMERA_READY');
      
      // Give a brief moment for camera to adjust exposure
      setTimeout(() => {
        updatePhase('GUIDANCE');
        startTsRef.current = Date.now();
        loop();
      }, 1000);

    } catch (err: any) {
      log.error('Camera error', err);
      if (err.name === 'NotAllowedError') {
         updatePhase('PERMISSION_DENIED', 'Camera permission was denied.');
      } else {
         updatePhase('CAMERA_UNAVAILABLE', 'Camera could not be started.');
      }
    }
  }, [cleanup, facingMode, torch, source]);

  const loop = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Stop if terminal state
    const currentPhase = phaseRef.current;
    if (currentPhase === 'RESULT_READY' || 
        currentPhase === 'TIMEOUT' ||
        currentPhase === 'STOPPED' || 
        currentPhase === 'CAMERA_UNAVAILABLE' ||
        currentPhase === 'PERMISSION_DENIED') {
      return;
    }

    const now = Date.now();
    const elapsedSeconds = (now - startTsRef.current) / 1000;

    // Timeout check
    if (elapsedSeconds > maxTimeoutSeconds) {
      updatePhase('TIMEOUT', 'Measurement took too long without stable signal.');
      return;
    }

    const sample = extractFrame(videoRef.current, canvasRef.current, now);
    
    if (sample) {
      bufferRef.current.push(sample);
      
      // Window management: max 12 seconds buffer for FFT
      const cutoff = now - 12000;
      bufferRef.current = bufferRef.current.filter(s => s.timestamp >= cutoff);
      
      lastFrameTimesRef.current.push(performance.now());
      if (lastFrameTimesRef.current.length > FPS_WINDOW) lastFrameTimesRef.current.shift();

      if (currentPhase === 'GUIDANCE') {
        updatePhase('READY');
      } else if (currentPhase === 'READY') {
        updatePhase('CAPTURING');
      }
    } else {
      // No ROI detected
      if (currentPhase !== 'GUIDANCE') {
         bufferRef.current = []; // flush buffer on face loss
         stableBpmBufferRef.current = [];
         updatePhase('GUIDANCE');
      }
    }

    // Process every 10 frames (~3fps UI update) to save battery but provide live feedback
    if (bufferRef.current.length > 30 && bufferRef.current.length % 5 === 0) {
      const result = processBuffer(bufferRef.current);
      
      const times = lastFrameTimesRef.current;
      const fps = times.length > 1 ? (times.length - 1) / ((times[times.length - 1] - times[0]) / 1000) : 0;

      let nextPhase = phaseRef.current;
      
      if (result.quality === 'GOOD' || result.quality === 'FAIR' || result.quality === 'EXCELLENT') {
        if (nextPhase === 'CAPTURING' || nextPhase === 'POOR_QUALITY') {
          nextPhase = 'SIGNAL_DETECTED';
        }
        if (result.bpm) {
          nextPhase = 'ANALYZING';
          stableBpmBufferRef.current.push(result.bpm);
          // Keep last 5 candidate BPMs
          if (stableBpmBufferRef.current.length > 5) stableBpmBufferRef.current.shift();
        }
      } else {
        // Do not immediately wipe the stable buffer.
        // If we lose signal completely we will eventually drop out via GUIDANCE.
        nextPhase = 'POOR_QUALITY';
      }

      // Check stability
      let stableBpm = null;
      let isEarlyComplete = false;
      if (stableBpmBufferRef.current.length === 5) {
        const bpms = stableBpmBufferRef.current;
        const maxDiff = Math.max(...bpms) - Math.min(...bpms);
        if (maxDiff <= 5 && result.confidence && result.confidence > 0.1) {
           stableBpm = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
           // If we've held a highly stable signal for 5 ticks, finish early.
           if (elapsedSeconds > 4.0 && result.confidence > 0.3) {
               isEarlyComplete = true;
           }
        }
      }

      // Lock result if we have a stable BPM and have reached the target window, or early completion
      if (stableBpm && (elapsedSeconds >= targetWindowSeconds || isEarlyComplete)) {
         nextPhase = 'RESULT_READY';
      }

      // If we're ready, fire the callback and stop
      if (nextPhase === 'RESULT_READY') {
         const finalResult: FinalMeasurementResult = {
           bpm: stableBpm!,
           quality: result.quality,
           confidence: result.confidence || 0,
           durationSeconds: elapsedSeconds,
           samplingRate: fps,
           source,
           algorithmVersion: result.algorithmVersion,
           waveformSnapshot: result.waveform,
         };
         onResultReady(finalResult);
      }

      updatePhase(nextPhase);
      
      setProgress(p => ({
        ...p,
        elapsedSeconds,
        framesCaptured: bufferRef.current.length,
        samplingRate: fps,
        signalQuality: result.quality,
        signalAmplitude: result.signalAmplitude,
        motionScore: result.motionScore,
        confidence: result.confidence || 0,
        candidateBPM: result.bpm,
        stableCandidateBPM: stableBpm,
        qualityHistory: [...p.qualityHistory.slice(-20), result.quality],
        waveformBuffer: result.waveform,
        rawSignal: (result as any).rawSignal,
      }));
    } else if (sample) {
        // Just update elapsed time if not processing this frame
        setProgress(p => ({ ...p, elapsedSeconds }));
    }

    if (phaseRef.current !== 'RESULT_READY') {
      rafRef.current = requestAnimationFrame(loop);
    }
  };

  const stop = useCallback(() => {
    cleanup();
    updatePhase('STOPPED');
  }, [cleanup]);

  return { start, stop, progress, videoRef, canvasRef };
}
