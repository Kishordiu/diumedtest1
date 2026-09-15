import type { RppgSample, RppgResult } from '../rppg/rppgEngine'
import { predictLinear } from '../../../shared/ml/EdgeInference'

export const CPPG_VERSION = 'cPPG_v2.0_Welch'

const MIN_FRAMES_REQUIRED = 90
const MIN_BPM = 42
const MAX_BPM = 180
const MIN_FREQ_HZ = MIN_BPM / 60
const MAX_FREQ_HZ = MAX_BPM / 60
const MIN_QUALITY_THRESHOLD = 0.035
const MIN_CONFIDENCE_THRESHOLD = 0.08

export function extractPulseTouchRgb(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  timestamp: number
): RppgSample | null {
  const { videoWidth, videoHeight } = video
  if (videoWidth === 0 || videoHeight === 0) return null

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  const sampleW = 64
  const sampleH = 64
  canvas.width = sampleW
  canvas.height = sampleH

  ctx.drawImage(video, 0, 0, sampleW, sampleH)

  let rSum = 0, gSum = 0, bSum = 0
  let rSq = 0, gSq = 0, bSq = 0
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH)
  const { data } = imageData
  const pixelCount = sampleW * sampleH

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    rSum += r
    gSum += g
    bSum += b
    rSq += r * r
    gSq += g * g
    bSq += b * b
  }
  
  const rMean = rSum / pixelCount
  const gMean = gSum / pixelCount
  const bMean = bSum / pixelCount
  const varAvg = ((rSq / pixelCount - rMean * rMean) + (gSq / pixelCount - gMean * gMean) + (bSq / pixelCount - bMean * bMean)) / 3

  // Strict Red-Dominance Check: 
  // A finger over a flashlight produces a bright, overwhelmingly red/orange image.
  // If the image is not significantly red, it's just ambient light/background.
  const isFinger = rMean > 80 && rMean > (gMean * 1.5) && rMean > (bMean * 1.5);

  if (!isFinger) {
    return null; // Forces useMeasurementEngine to flush buffer and revert to GUIDANCE
  }

  return {
    timestamp,
    motionScore: 0,
    faceDetected: true, // We repurpose this to mean 'finger firmly placed'
    patches: [{
      id: 'finger',
      r: rMean,
      g: gMean,
      b: bMean,
      validPixels: pixelCount,
      variance: varAvg
    }]
  }
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

function detrend(signal: number[], windowSize = 30): number[] {
  const detrended = new Array(signal.length).fill(0)
  for (let i = 0; i < signal.length; i++) {
    let start = Math.max(0, i - Math.floor(windowSize / 2))
    let end = Math.min(signal.length, i + Math.floor(windowSize / 2))
    let sum = 0
    for (let j = start; j < end; j++) {
      sum += signal[j]
    }
    const mean = sum / (end - start)
    detrended[i] = signal[i] - mean
  }
  return detrended
}

function normalize(signal: number[]): number[] {
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length
  const std = Math.sqrt(signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length)
  if (std === 0) return signal.map(() => 0)
  return signal.map(val => (val - mean) / std)
}

function bandPassFilter(signal: number[], fps: number): number[] {
  const lp = detrend(signal, Math.floor(fps / MIN_FREQ_HZ))
  const hp = detrend(lp, Math.floor(fps / MAX_FREQ_HZ))
  return hp
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

function computePeakToPeakBPM(signal: number[], fps: number): number | null {
  const peaks = []
  const minPeakDistance = Math.floor(fps / MAX_FREQ_HZ)
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
  return 60 / (avgIntervalFrames / fps)
}

function createFailedResult(frameCount: number, durationSeconds: number, samplingRate: number, reason: string, rawSignal?: number[]): RppgResult {
  return {
    bpm: null,
    confidence: null,
    quality: 'UNKNOWN',
    signalAmplitude: 0,
    filteredAmplitude: 0,
    motionScore: 0,
    dominantFrequency: null,
    frameCount,
    durationSeconds,
    samplingRate,
    algorithmVersion: CPPG_VERSION,
    reason,
    waveform: [],
    rawSignal
  }
}

export function processPulseTouchBuffer(samples: RppgSample[]): RppgResult {
  const frameCount = samples.length
  if (frameCount < MIN_FRAMES_REQUIRED) {
    return createFailedResult(frameCount, 0, 0, `Insufficient frames (${frameCount})`)
  }
  const durationSeconds = (samples[frameCount - 1].timestamp - samples[0].timestamp) / 1000
  if (durationSeconds < 1) {
    return createFailedResult(frameCount, durationSeconds, 0, 'Duration too short')
  }
  const samplingRate = frameCount / durationSeconds
  if (samplingRate < 10) {
    return createFailedResult(frameCount, durationSeconds, samplingRate, `Sampling rate too low (${samplingRate.toFixed(1)} fps)`)
  }

  const patchData = samples.map(s => s.patches[0])
  
  const meanR = patchData.reduce((sum, p) => sum + p.r, 0) / frameCount
  const meanG = patchData.reduce((sum, p) => sum + p.g, 0) / frameCount

  if (meanR < 40) {
    return createFailedResult(frameCount, durationSeconds, samplingRate, 'Poor finger contact detected (too dark)')
  }

  // Dynamic channel selection: Use the channel with higher variance (typically Red penetrates deeper, but Green can be stronger)
  const varR = patchData.reduce((sum, p) => sum + (p.r - meanR)**2, 0) / frameCount
  const varG = patchData.reduce((sum, p) => sum + (p.g - meanG)**2, 0) / frameCount

  const rawSignalInitial = varG > varR * 1.5 ? patchData.map(p => p.g) : patchData.map(p => p.r)

  // Hardware compensation: Spike removal and Jitter interpolation
  const timestamps = samples.map(s => s.timestamp)
  const targetFps = 30
  const medSignal = medianFilter(rawSignalInitial)
  const rawSignal = resample(medSignal, timestamps, targetFps)
  const targetSamplingRate = targetFps

  const signalAmplitude = Math.max(...rawSignal) - Math.min(...rawSignal)
  if (signalAmplitude < 0.1) {
    return createFailedResult(frameCount, durationSeconds, samplingRate, 'Signal amplitude too low', rawSignal)
  }

  const detrended = detrend(rawSignal)
  const normalized = normalize(detrended)
  const filtered = bandPassFilter(normalized, targetSamplingRate)
  const filteredAmplitude = Math.max(...filtered.map(Math.abs))

  const { frequencies, magnitudes } = computeWelchPSD(filtered, targetSamplingRate)
  
  if (frequencies.length === 0) {
    return createFailedResult(frameCount, durationSeconds, samplingRate, 'No frequency components', rawSignal)
  }

  let peakIndex = 0
  let peakMag = magnitudes[0]
  let totalMag = magnitudes[0]
  for (let i = 1; i < magnitudes.length; i++) {
    totalMag += magnitudes[i]
    if (magnitudes[i] > peakMag) {
      peakMag = magnitudes[i]
      peakIndex = i
    }
  }

  const dominantFrequency = frequencies[peakIndex]
  const qualityScore = (peakMag / (totalMag / magnitudes.length)) * 0.1
  const quality = qualityScore > 0.5 ? 'GOOD' : qualityScore > 0.1 ? 'FAIR' : 'POOR'

  if (qualityScore < MIN_QUALITY_THRESHOLD) {
    return createFailedResult(frameCount, durationSeconds, samplingRate, `Quality too low (${qualityScore.toFixed(2)})`, rawSignal)
  }

  const rawBpm = dominantFrequency * 60

  // Calibrate HR using Edge ML Model to correct for PSD smearing/harmonics
  const normalizedMags = magnitudes.map(m => m / totalMag)
  let spectralEntropy = 0
  for (let m of normalizedMags) {
    if (m > 0) spectralEntropy -= m * Math.log2(m)
  }
  const snr = 10 * Math.log10(qualityScore / (1 - qualityScore + 1e-10))
  
  const calibratedBpm = predictLinear('hr_calibration', [rawBpm, Math.max(snr, 0), spectralEntropy])

  const confidence = Math.max(0, Math.min(1, qualityScore))
  
  const peakToPeakBpm = computePeakToPeakBPM(filtered, targetSamplingRate)
  // We explicitly DO NOT fail if peakToPeakBpm disagrees with rawBpm, 
  // as time-domain peaks are often noisy on mobile due to auto-exposure.

  if (confidence < MIN_CONFIDENCE_THRESHOLD) {
    return createFailedResult(frameCount, durationSeconds, samplingRate, `Confidence too low (${confidence.toFixed(2)})`, rawSignal)
  }

  return {
    bpm: Math.round(calibratedBpm),
    peakToPeakBpm: peakToPeakBpm ? Math.round(peakToPeakBpm) : null,
    confidence,
    quality,
    signalAmplitude,
    filteredAmplitude,
    motionScore: 0,
    dominantFrequency,
    frameCount,
    durationSeconds,
    samplingRate,
    algorithmVersion: CPPG_VERSION,
    reason: null,
    waveform: filtered,
    rawSignal
  }
}
