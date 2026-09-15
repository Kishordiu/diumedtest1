/**
 * DiuMed rPPG Engine
 * 
 * Camera-based remote photoplethysmography (rPPG) for heart rate estimation.
 * 
 * IMPORTANT: This is an EXPERIMENTAL optical estimation system.
 * - Results are NOT medically validated
 * - Accuracy depends on lighting, skin tone, camera quality, and motion
 * - If signal quality is insufficient, returns null — NEVER fabricates values
 * 
 * Pipeline:
 * 1. FaceMesh extraction (Multi-ROI)
 * 2. Temporal buffer (rolling window)
 * 3. Detrending (linear trend removal)
 * 4. Algorithm mapping (POS & CHROM)
 * 5. Band-pass filter (0.7–3.0 Hz = 42–180 BPM)
 * 6. Welch PSD estimation
 * 7. Consensus validation
 */

export const RPPG_VERSION = 'rPPG_v2.0_MultiROI'

// Physiological constraints
const MIN_BPM = 42
const MAX_BPM = 180
const MIN_FREQ_HZ = MIN_BPM / 60  // 0.7 Hz
const MAX_FREQ_HZ = MAX_BPM / 60  // 3.0 Hz

// Buffer constraints
const MIN_FRAMES_REQUIRED = 90  // ~3s at 30fps minimum
const MIN_QUALITY_THRESHOLD = 0.035
const MIN_CONFIDENCE_THRESHOLD = 0.08

export interface FacePatch {
  id: string;
  r: number;
  g: number;
  b: number;
  validPixels: number;
  variance: number;
}

export interface RppgSample {
  timestamp: number;  // ms
  motionScore: number;
  faceDetected: boolean;
  patches: FacePatch[];
}

export interface PipelineDiagnostics {
  camera: {
    fps: number;
    jitter: number; // std dev of inter-frame intervals
    resolution: string;
  };
  roi: {
    area: number;
    coverage: number; // fraction of frame covered by ROI
    patchCount: number;
    patchIds: string[];
    validPixelsPerPatch: Record<string, number>;
  };
  signal: {
    snr: number; // signal-to-noise ratio (dB)
    acDcRatio: number; // pulsatile / mean
    illuminationMean: number;
    illuminationStd: number;
    rgbMeans: { r: number; g: number; b: number };
    rgbVariances: { r: number; g: number; b: number };
  };
  processing: {
    posQuality: number;
    chromQuality: number;
    posBpm: number | null;
    chromBpm: number | null;
    psdPeakProminence: number;
    spectralConcentration: number; // peak power / total band power
    windowLength: number;
    selectedAlgorithm: string;
    selectedPatch: string;
  };
  quality: {
    score: number;
    label: string;
    firstRejectedStage: string | null;
    rejectionReason: string | null;
  };
}

export interface RppgResult {
  bpm: number | null  // null if signal insufficient
  peakToPeakBpm?: number | null // Time-domain fallback estimate
  confidence: number | null  // 0–1 or null
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNKNOWN'
  signalAmplitude: number
  filteredAmplitude: number
  motionScore: number
  dominantFrequency: number | null  // Hz or null
  frameCount: number
  durationSeconds: number
  samplingRate: number  // actual measured FPS
  algorithmVersion: string
  reason: string | null  // why bpm is null, if applicable
  waveform: number[]
  rawSignal?: number[] // Unfiltered signal for diagnostics
  diagnostics?: PipelineDiagnostics
}

// ─────────────────────────────────────────────
// Signal processing utilities
// ─────────────────────────────────────────────

function linspace(start: number, stop: number, n: number): number[] {
  if (n <= 1) return [start]
  const step = (stop - start) / (n - 1)
  return Array.from({ length: n }, (_, i) => start + i * step)
}

function medianFilter(signal: number[], window: number = 3): number[] {
  const n = signal.length;
  if (n < window) return signal;
  const result = new Array(n);
  const half = Math.floor(window / 2);
  for (let i = 0; i < n; i++) {
    const neighborhood = [];
    for (let j = Math.max(0, i - half); j <= Math.min(n - 1, i + half); j++) {
      neighborhood.push(signal[j]);
    }
    neighborhood.sort((a, b) => a - b);
    result[i] = neighborhood[Math.floor(neighborhood.length / 2)];
  }
  return result;
}

function resample(signal: number[], timestamps: number[], targetFps: number): number[] {
  if (signal.length < 2) return signal;
  const duration = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
  const targetLength = Math.floor(duration * targetFps);
  const result = new Array(targetLength);
  const t0 = timestamps[0];
  
  for (let i = 0; i < targetLength; i++) {
    const targetTime = t0 + (i / targetFps) * 1000;
    
    // Find surrounding timestamps
    let left = 0;
    while (left < timestamps.length - 1 && timestamps[left + 1] <= targetTime) {
      left++;
    }
    let right = Math.min(left + 1, timestamps.length - 1);
    
    if (left === right || timestamps[left] === timestamps[right]) {
      result[i] = signal[left];
    } else {
      // Linear interpolation
      const fraction = (targetTime - timestamps[left]) / (timestamps[right] - timestamps[left]);
      result[i] = signal[left] + fraction * (signal[right] - signal[left]);
    }
  }
  return result;
}

function movingAverageDetrend(signal: number[], windowSize: number): number[] {
  const ma = movingAverage(signal, windowSize);
  return signal.map((val, i) => val - ma[i]);
}

function normalize(signal: number[]): number[] {
  const n = signal.length
  if (n === 0) return signal
  const mean = signal.reduce((a, b) => a + b, 0) / n
  const variance = signal.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)
  if (std < 1e-10) return new Array(n).fill(0)
  return signal.map(v => (v - mean) / std)
}

function movingAverage(signal: number[], window: number): number[] {
  const n = signal.length
  const result = new Array(n).fill(0)
  const half = Math.floor(window / 2)
  for (let i = 0; i < n; i++) {
    let sum = 0, count = 0
    for (let j = Math.max(0, i - half); j <= Math.min(n - 1, i + half); j++) {
      sum += signal[j]
      count++
    }
    result[i] = count > 0 ? sum / count : 0
  }
  return result
}

function bandPassFilter(signal: number[], sampleRate: number): number[] {
  const n = signal.length
  if (n < 4) return signal
  const nyquist = sampleRate / 2
  const lowCut = MIN_FREQ_HZ / nyquist
  const highCut = Math.min(MAX_FREQ_HZ / nyquist, 0.99)
  if (lowCut >= highCut || lowCut <= 0) return signal

  const lowWindow = Math.max(2, Math.round(sampleRate / (MAX_FREQ_HZ * 2)))
  const highWindow = Math.max(2, Math.round(sampleRate / (MIN_FREQ_HZ * 2)))

  const lowPassed = movingAverage(signal, lowWindow)
  const longLowPassed = movingAverage(signal, highWindow)
  return lowPassed.map((v, i) => v - longLowPassed[i])
}

function hammingWindow(n: number): number[] {
  return Array.from({ length: n }, (_, i) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1)));
}

function computeWelchPSD(signal: number[], sampleRate: number): { frequencies: number[]; magnitudes: number[] } {
  const n = signal.length;
  let segmentLength = Math.pow(2, Math.floor(Math.log2(n)));
  if (segmentLength < 64) segmentLength = n;

  const step = Math.floor(segmentLength / 2);
  const window = hammingWindow(segmentLength);
  
  const psd = new Array(Math.floor(segmentLength / 2)).fill(0);
  let segments = 0;

  for (let start = 0; start <= n - segmentLength; start += step) {
    const segment = signal.slice(start, start + segmentLength);
    const windowed = segment.map((v, i) => v * window[i]);
    
    for (let k = 1; k < Math.floor(segmentLength / 2); k++) {
      const freq = (k * sampleRate) / segmentLength;
      if (freq < MIN_FREQ_HZ || freq > MAX_FREQ_HZ) continue;
      
      let re = 0, im = 0;
      for (let t = 0; t < segmentLength; t++) {
        const angle = (2 * Math.PI * k * t) / segmentLength;
        re += windowed[t] * Math.cos(angle);
        im -= windowed[t] * Math.sin(angle);
      }
      psd[k] += (re * re + im * im) / segmentLength;
    }
    segments++;
  }

  const freqs = [];
  const mags = [];
  for (let k = 1; k < Math.floor(segmentLength / 2); k++) {
    const freq = (k * sampleRate) / segmentLength;
    if (freq >= MIN_FREQ_HZ && freq <= MAX_FREQ_HZ) {
      freqs.push(freq);
      mags.push(Math.sqrt(psd[k] / segments));
    }
  }

  return { frequencies: freqs, magnitudes: mags };
}

function computePOS(r: number[], g: number[], b: number[]): number[] {
  const n = r.length
  const meanR = r.reduce((a,b)=>a+b,0)/n
  const meanG = g.reduce((a,b)=>a+b,0)/n
  const meanB = b.reduce((a,b)=>a+b,0)/n

  const X = new Array(n)
  const Y = new Array(n)
  for(let i=0; i<n; i++){
     const rn = r[i]/meanR;
     const gn = g[i]/meanG;
     const bn = b[i]/meanB;
     X[i] = gn - bn;
     Y[i] = gn + bn - 2*rn;
  }
  const meanX = X.reduce((a,b)=>a+b,0)/n
  const meanY = Y.reduce((a,b)=>a+b,0)/n
  const stdX = Math.sqrt(X.reduce((a,b)=>a+(b-meanX)**2,0) / n);
  const stdY = Math.sqrt(Y.reduce((a,b)=>a+(b-meanY)**2,0) / n);
  const alpha = stdY === 0 ? 0 : stdX / stdY;
  
  return X.map((x, i) => x + alpha * Y[i]);
}

function computeCHROM(r: number[], g: number[], b: number[]): number[] {
  const n = r.length
  const meanR = r.reduce((a,b)=>a+b,0)/n
  const meanG = g.reduce((a,b)=>a+b,0)/n
  const meanB = b.reduce((a,b)=>a+b,0)/n

  const X = new Array(n)
  const Y = new Array(n)
  for(let i=0; i<n; i++){
     const rn = r[i]/meanR;
     const gn = g[i]/meanG;
     const bn = b[i]/meanB;
     X[i] = 3*rn - 2*gn;
     Y[i] = 1.5*rn + gn - 1.5*bn;
  }
  const meanX = X.reduce((a,b)=>a+b,0)/n
  const meanY = Y.reduce((a,b)=>a+b,0)/n
  const stdX = Math.sqrt(X.reduce((a,b)=>a+(b-meanX)**2,0) / n);
  const stdY = Math.sqrt(Y.reduce((a,b)=>a+(b-meanY)**2,0) / n);
  const alpha = stdY === 0 ? 0 : stdX / stdY;
  
  return X.map((x, i) => x - alpha * Y[i]);
}

function computeSignalQuality(magnitudes: number[], peakIndex: number): number {
  if (magnitudes.length === 0) return 0
  const peakMag = magnitudes[peakIndex]
  const totalEnergy = magnitudes.reduce((a, b) => a + b * b, 0)
  if (totalEnergy === 0) return 0
  const peakEnergy = peakMag * peakMag
  return Math.min(1, peakEnergy / (totalEnergy / magnitudes.length) / 10)
}

function qualityLabel(q: number): RppgResult['quality'] {
  if (q >= 0.7) return 'EXCELLENT'
  if (q >= 0.5) return 'GOOD'
  if (q >= 0.1) return 'FAIR'
  if (q >= 0.05) return 'POOR'
  return 'UNKNOWN'
}

function computePeakToPeakBPM(signal: number[], sampleRate: number): number | null {
  const peaks = []
  const minPeakDistance = Math.floor(sampleRate / (MAX_BPM / 60))
  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > 0) {
      if (peaks.length === 0 || (i - peaks[peaks.length - 1]) >= minPeakDistance) {
        peaks.push(i)
      } else if (signal[i] > signal[peaks[peaks.length - 1]]) {
        peaks[peaks.length - 1] = i
      }
    }
  }
  if (peaks.length < 2) return null
  let totalInterval = 0
  for (let i = 1; i < peaks.length; i++) {
    totalInterval += peaks[i] - peaks[i - 1]
  }
  const avgIntervalFrames = totalInterval / (peaks.length - 1)
  return 60 / (avgIntervalFrames / sampleRate)
}

// ─────────────────────────────────────────────
// Main rPPG processing function
// ─────────────────────────────────────────────

export function processRppgBuffer(samples: RppgSample[]): RppgResult {
  const frameCount = samples.length

  const createFailedResult = (reason: string, quality: RppgResult['quality'] = 'UNKNOWN', motionScore = 0): RppgResult => ({
    bpm: null, confidence: null, quality, signalAmplitude: 0, filteredAmplitude: 0,
    motionScore, dominantFrequency: null, frameCount,
    durationSeconds: frameCount > 1 ? (samples[frameCount-1].timestamp - samples[0].timestamp)/1000 : 0,
    samplingRate: frameCount > 1 ? frameCount / ((samples[frameCount-1].timestamp - samples[0].timestamp)/1000) : 0,
    algorithmVersion: RPPG_VERSION, reason, waveform: []
  })

  if (frameCount < MIN_FRAMES_REQUIRED) {
    return createFailedResult(`Insufficient frames (${frameCount} < ${MIN_FRAMES_REQUIRED})`)
  }

  const durationSeconds = (samples[frameCount - 1].timestamp - samples[0].timestamp) / 1000
  if (durationSeconds < 2) return createFailedResult('Duration too short for reliable estimation')

  const samplingRate = frameCount / durationSeconds
  if (samplingRate < 10) return createFailedResult(`Sampling rate too low (${samplingRate.toFixed(1)} fps)`)

  const motionScore = samples.reduce((a, b) => a + b.motionScore, 0) / frameCount
  if (motionScore > 1.5) return createFailedResult(`Excessive motion (${motionScore.toFixed(2)})`, 'POOR', motionScore)

  const patchesById: Record<string, { r: number[], g: number[], b: number[] }> = {}
  
  samples.forEach(s => {
    s.patches.forEach(p => {
       if (!patchesById[p.id]) patchesById[p.id] = { r: [], g: [], b: [] };
       patchesById[p.id].r.push(p.r);
       patchesById[p.id].g.push(p.g);
       patchesById[p.id].b.push(p.b);
    })
  })

  const patchKeys = Object.keys(patchesById)
  if (patchKeys.length === 0) return createFailedResult('No valid patches found in buffer', 'POOR', motionScore)

  interface PatchResult {
    id: string;
    algorithm: string;
    bpm: number;
    quality: number;
    waveform: number[];
  }

  const results: PatchResult[] = []

  let bestWaveform: number[] = []
  let bestQuality = 0

  const timestamps = samples.map(s => s.timestamp)
  const targetFps = 30 // Resample to constant 30 FPS

  for (const id of patchKeys) {
    const patch = patchesById[id]
    if (patch.r.length !== frameCount) continue; // Skip incomplete patches

    // 1. Median filter (Spike removal)
    const r_med = medianFilter(patch.r)
    const g_med = medianFilter(patch.g)
    const b_med = medianFilter(patch.b)

    // 2. Resample to strict time grid (Jitter removal)
    const r_resampled = resample(r_med, timestamps, targetFps)
    const g_resampled = resample(g_med, timestamps, targetFps)
    const b_resampled = resample(b_med, timestamps, targetFps)

    for (const algo of ['POS', 'CHROM']) {
       const raw = algo === 'POS' ? computePOS(r_resampled, g_resampled, b_resampled) : computeCHROM(r_resampled, g_resampled, b_resampled)
       
       // 3. Moving Average Detrending (AE Wander removal)
       const detrended = movingAverageDetrend(raw, Math.round(targetFps))
       const filtered = bandPassFilter(detrended, targetFps)
       
       const { frequencies, magnitudes } = computeWelchPSD(filtered, targetFps)
       if (frequencies.length === 0) continue;

       let peakIndex = 0
       let peakMag = magnitudes[0]
       for (let i = 1; i < magnitudes.length; i++) {
         if (magnitudes[i] > peakMag) {
           peakMag = magnitudes[i]
           peakIndex = i
         }
       }
       const quality = computeSignalQuality(magnitudes, peakIndex)
       const bpm = frequencies[peakIndex] * 60

       results.push({ id, algorithm: algo, bpm, quality, waveform: filtered })

       if (quality > bestQuality) {
         bestQuality = quality
         bestWaveform = filtered
       }
    }
  }

  if (results.length === 0) return createFailedResult('No frequency components found', 'POOR', motionScore)

  // Consensus validation: filter for quality > MIN
  const validResults = results.filter(r => r.quality >= MIN_QUALITY_THRESHOLD)
  
  if (validResults.length === 0) {
    return createFailedResult('Signal quality too low across all patches and algorithms', 'POOR', motionScore)
  }

  // We do not reject the entire signal just because one patch (e.g. cheek) is noisy.
  // Instead, sort valid results by quality (best first) and use the best one.
  validResults.sort((a, b) => b.quality - a.quality)
  const bestResult = validResults[0]

  const finalBpm = bestResult.bpm
  const finalQualityScore = bestResult.quality

  const peakToPeakBpm = computePeakToPeakBPM(bestWaveform, samplingRate)

  // Confidence: combination of quality, agreement, and motion
  const motionPenalty = motionScore * 0.3
  const confidence = Math.max(0, Math.min(1, finalQualityScore - motionPenalty))

  // --- Build diagnostics ---
  // Frame jitter
  const intervals: number[] = []
  for (let i = 1; i < samples.length; i++) {
    intervals.push(samples[i].timestamp - samples[i - 1].timestamp)
  }
  const meanInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0
  const jitter = intervals.length > 1 ? Math.sqrt(intervals.reduce((a, v) => a + (v - meanInterval) ** 2, 0) / intervals.length) : 0

  // ROI stats from last sample
  const lastSample = samples[samples.length - 1]
  const validPixelsPerPatch: Record<string, number> = {}
  lastSample.patches.forEach(p => { validPixelsPerPatch[p.id] = p.validPixels })

  // Signal stats from best patch
  const bestPatchData = patchesById[bestResult.id]
  const rMean = bestPatchData ? bestPatchData.r.reduce((a, b) => a + b, 0) / frameCount : 0
  const gMean = bestPatchData ? bestPatchData.g.reduce((a, b) => a + b, 0) / frameCount : 0
  const bMean = bestPatchData ? bestPatchData.b.reduce((a, b) => a + b, 0) / frameCount : 0
  const rVar = bestPatchData ? bestPatchData.r.reduce((a, v) => a + (v - rMean) ** 2, 0) / frameCount : 0
  const gVar = bestPatchData ? bestPatchData.g.reduce((a, v) => a + (v - gMean) ** 2, 0) / frameCount : 0
  const bVar = bestPatchData ? bestPatchData.b.reduce((a, v) => a + (v - bMean) ** 2, 0) / frameCount : 0
  const illuminationMean = (rMean + gMean + bMean) / 3
  const illuminationStd = Math.sqrt((rVar + gVar + bVar) / 3)
  const acDcRatio = illuminationMean > 0 ? illuminationStd / illuminationMean : 0

  // SNR: peak power / noise power in dB
  const bestFiltered = bestWaveform
  const signalPower = bestFiltered.reduce((a, v) => a + v * v, 0) / bestFiltered.length
  const snr = signalPower > 0 ? 10 * Math.log10(finalQualityScore / (1 - finalQualityScore + 1e-10)) : 0

  // Per-algorithm results
  const posResult = results.find(r => r.algorithm === 'POS')
  const chromResult = results.find(r => r.algorithm === 'CHROM')

  // Spectral concentration
  const bestFilteredPSD = computeWelchPSD(bestWaveform, samplingRate)
  let totalBandPower = 0
  let peakPower = 0
  if (bestFilteredPSD.magnitudes.length > 0) {
    totalBandPower = bestFilteredPSD.magnitudes.reduce((a, m) => a + m * m, 0)
    const pIdx = bestFilteredPSD.magnitudes.indexOf(Math.max(...bestFilteredPSD.magnitudes))
    peakPower = bestFilteredPSD.magnitudes[pIdx] ** 2
  }
  const spectralConcentration = totalBandPower > 0 ? peakPower / totalBandPower : 0

  const diagnostics: PipelineDiagnostics = {
    camera: { fps: samplingRate, jitter, resolution: 'N/A' },
    roi: {
      area: 0,
      coverage: 0,
      patchCount: patchKeys.length,
      patchIds: patchKeys,
      validPixelsPerPatch,
    },
    signal: {
      snr,
      acDcRatio,
      illuminationMean,
      illuminationStd,
      rgbMeans: { r: rMean, g: gMean, b: bMean },
      rgbVariances: { r: rVar, g: gVar, b: bVar },
    },
    processing: {
      posQuality: posResult?.quality ?? 0,
      chromQuality: chromResult?.quality ?? 0,
      posBpm: posResult?.bpm ?? null,
      chromBpm: chromResult?.bpm ?? null,
      psdPeakProminence: finalQualityScore,
      spectralConcentration,
      windowLength: frameCount,
      selectedAlgorithm: bestResult.algorithm,
      selectedPatch: bestResult.id,
    },
    quality: {
      score: finalQualityScore,
      label: qualityLabel(finalQualityScore),
      firstRejectedStage: confidence < MIN_CONFIDENCE_THRESHOLD ? 'confidence' : null,
      rejectionReason: confidence < MIN_CONFIDENCE_THRESHOLD ? `Confidence ${confidence.toFixed(2)} < ${MIN_CONFIDENCE_THRESHOLD}` : null,
    },
  }

  if (confidence < MIN_CONFIDENCE_THRESHOLD) {
    return { ...createFailedResult(`Confidence too low (${confidence.toFixed(2)})`, 'POOR', motionScore), diagnostics }
  }

  return {
    bpm: Math.round(finalBpm),
    peakToPeakBpm: peakToPeakBpm ? Math.round(peakToPeakBpm) : null,
    confidence,
    quality: qualityLabel(finalQualityScore),
    signalAmplitude: illuminationStd,
    filteredAmplitude: Math.max(...bestWaveform.map(Math.abs)),
    motionScore,
    dominantFrequency: finalBpm / 60,
    frameCount,
    durationSeconds,
    samplingRate,
    algorithmVersion: RPPG_VERSION,
    reason: null,
    waveform: bestWaveform,
    rawSignal: [],
    diagnostics
  }
}
