/**
 * DiuMed hemoglobin estimator — experimental edge-model prototype.
 *
 * The current runtime uses the local `hb_estimator` weights in
 * `src/shared/ml/model_weights.json`. Repository history and the current
 * implementation do not establish a reproducible training run or independent
 * validation for those exact weights. A referenced research DOI is not proof
 * that these weights were trained or validated against that dataset.
 *
 * This output is an experimental demonstration only, not a medical measurement.
 * Do not use it to diagnose, rule out, or make treatment decisions about anemia.
 */

import type { ColorimetryResult } from './ColorimetryEngine'

// ─── Types ───────────────────────────────────────────────────────

export interface HemoglobinEstimate {
  estimatedHb: number | null
  unit: 'g/dL'
  uncertainty: number | null
  screeningSignal:
    | 'POSSIBLE_LOW_HB'
    | 'WITHIN_EXPECTED_RANGE'
    | 'LOWER_ESTIMATE'
    | 'UNCERTAIN'
    | 'INSUFFICIENT_QUALITY'
    | 'MODEL_UNAVAILABLE'
  modelInfo: {
    name: string
    version: string
    status: 'ACTIVE' | 'NOT_CONFIGURED' | 'INVALID_INPUT'
    license: string
    limitations: string[]
  }
  provenance: {
    method: string
    datasetDoi: string
    coefficients: Record<string, number>
    features: Record<string, number>
    validation: {
      mae: number | null
      rmse: number | null
      loaLower: number | null
      loaUpper: number | null
      n: number
    }
  }
}

// ─── HSV Feature Extraction ─────────────────────────────────────

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : delta / max
  const v = max

  return { h, s, v }
}

export interface ConjunctivaFeatures {
  highHueRatio: number
  pixelCount: number
}

/**
 * Extracts the High Hue Ratio (HHR) from the conjunctival ROI.
 * The High Hue Ratio is the fraction of pixels with hue > 30°.
 */
export function extractConjunctivaFeatures(imageData: ImageData, cx: number, cy: number, radius: number): ConjunctivaFeatures {
  const data = imageData.data
  const width = imageData.width
  const rSq = radius * radius

  let highHueCount = 0
  let count = 0

  const HIGH_HUE_THRESHOLD = 30

  const yMin = Math.max(0, Math.floor(cy - radius))
  const yMax = Math.min(imageData.height - 1, Math.ceil(cy + radius))
  const xMin = Math.max(0, Math.floor(cx - radius))
  const xMax = Math.min(width - 1, Math.ceil(cx + radius))

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy > rSq) continue

      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const hsv = rgbToHsv(r, g, b)
      
      if (hsv.h > HIGH_HUE_THRESHOLD) highHueCount++
      count++
    }
  }

  if (count === 0) {
    return { highHueRatio: 0, pixelCount: 0 }
  }

  return {
    highHueRatio: highHueCount / count,
    pixelCount: count
  }
}

import { predictLinear } from '../../shared/ml/EdgeInference'

const MODEL_VERSION = '0.1.0-prototype'
const MODEL_NAME = 'diumed_hb_edge_ml'

// ─── Hb Estimation ──────────────────────────────────────────────

export function estimateHemoglobin(
  colorimetry: ColorimetryResult,
  conjunctivaFeatures?: ConjunctivaFeatures
): HemoglobinEstimate {
  const baseInfo = {
    unit: 'g/dL' as const,
    modelInfo: {
      name: MODEL_NAME,
      version: MODEL_VERSION,
      status: 'ACTIVE' as const,
      license: 'DiuMed Open Source',
      limitations: [
        'Experimental prototype only — not a laboratory measurement.',
        'The embedded development weights do not have verified independent clinical validation.',
        'Do not use the estimate to diagnose, rule out, or treat a health condition.',
        'Not FDA/CE validated.'
      ]
    },
    provenance: {
      method: 'Local linear inference using embedded development weights; not independently validated',
      datasetDoi: 'Reference only: 10.5281/zenodo.8277462. Current weights use a simulated proxy; their training provenance is not verified.',
      coefficients: {}, // Runtime weights are stored in model_weights.json; training provenance is not verified.
      features: {},
      validation: { mae: null, rmse: null, loaLower: null, loaUpper: null, n: 0 }
    }
  }

  // Quality check: Requires sufficient ROI size
  if (!conjunctivaFeatures || conjunctivaFeatures.pixelCount < 100) {
    return {
      ...baseInfo,
      estimatedHb: null,
      uncertainty: null,
      screeningSignal: 'INSUFFICIENT_QUALITY',
    }
  }

  const { highHueRatio } = conjunctivaFeatures

  // Use HHR as the prototype model input; the current embedded weights are not clinically validated.
  const rawHb = predictLinear('hb_estimator', [highHueRatio])

  // Explicit validity check without silent clamping
  if (rawHb < 2.0 || rawHb > 24.0) {
    return {
      ...baseInfo,
      estimatedHb: null,
      uncertainty: null,
      screeningSignal: 'INSUFFICIENT_QUALITY',
      modelInfo: { ...baseInfo.modelInfo, status: 'INVALID_INPUT' },
      provenance: {
        ...baseInfo.provenance,
        features: { r: colorimetry.averageRGB.r, g: colorimetry.averageRGB.g, b: colorimetry.averageRGB.b, rawEstimate: rawHb }
      }
    }
  }

  const estimatedHb = rawHb

  // No validated uncertainty estimate is available for the current embedded weights.
  const uncertainty = null 

  let screeningSignal: HemoglobinEstimate['screeningSignal']
  if (estimatedHb < 7.0) {
    screeningSignal = 'POSSIBLE_LOW_HB'
  } else if (estimatedHb < 11.0) {
    screeningSignal = 'LOWER_ESTIMATE'
  } else if (estimatedHb <= 17.0) {
    screeningSignal = 'WITHIN_EXPECTED_RANGE'
  } else {
    screeningSignal = 'UNCERTAIN'
  }

  return {
    ...baseInfo,
    estimatedHb: Math.round(estimatedHb * 10) / 10,
    uncertainty,
    screeningSignal,
    provenance: {
      ...baseInfo.provenance,
      features: {
        highHueRatio: Math.round(highHueRatio * 1000) / 1000,
        rawEstimate: Math.round(rawHb * 100) / 100,
      }
    }
  }
}
