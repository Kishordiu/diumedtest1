export type MeasurementPhase = 
  | 'IDLE'
  | 'PREPARING'
  | 'PERMISSION'
  | 'CAMERA_READY'
  | 'GUIDANCE'
  | 'READY'
  | 'CAPTURING'
  | 'SIGNAL_DETECTED'
  | 'ANALYZING'
  | 'RESULT_READY'
  | 'PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'TORCH_UNAVAILABLE'
  | 'FACE_NOT_DETECTED'
  | 'ROI_TOO_SMALL'
  | 'LIGHTING_UNSTABLE'
  | 'MOTION_TOO_HIGH'
  | 'SIGNAL_ACQUIRING'
  | 'SIGNAL_WEAK'
  | 'ALGORITHM_DISAGREEMENT'
  | 'SIGNAL_STABLE'
  | 'NO_SIGNAL'
  | 'LOW_SIGNAL'
  | 'POOR_QUALITY'
  | 'ROI_NOT_FOUND'
  | 'MODEL_UNAVAILABLE'
  | 'INFERENCE_FAILED'
  | 'TIMEOUT'
  | 'STOPPED';

export type SignalQuality = 'UNKNOWN' | 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export interface MeasurementProgress {
  phase: MeasurementPhase;
  elapsedSeconds: number;
  targetWindowSeconds: number;
  framesCaptured: number;
  samplingRate: number;
  signalQuality: SignalQuality;
  signalAmplitude: number;
  motionScore: number;
  roiQuality: number;
  confidence: number;
  candidateBPM: number | null;
  stableCandidateBPM: number | null;
  qualityHistory: SignalQuality[];
  waveformBuffer: number[];
  rawSignal?: number[];
  reason?: string;
}

export interface FinalMeasurementResult {
  bpm: number;
  quality: SignalQuality;
  confidence: number;
  durationSeconds: number;
  samplingRate: number;
  source: 'camera_rppg' | 'camera_contact_ppg';
  algorithmVersion: string;
  waveformSnapshot: number[];
}
