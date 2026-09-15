import type { ColorimetryResult } from './ColorimetryEngine'
import { predictLogistic } from '../../shared/ml/EdgeInference'

export interface JaundiceEstimate {
  estimatedProbability: number
  screeningSignal:
    | 'POSSIBLE_ELEVATED_BILIRUBIN'
    | 'WITHIN_EXPECTED_RANGE'
    | 'INSUFFICIENT_QUALITY'
  modelInfo: {
    name: string
    version: string
    status: 'ACTIVE' | 'INVALID_INPUT'
  }
}

const MODEL_VERSION = '1.0.0-ML'
const MODEL_NAME = 'diumed_jaundice_edge_ml'

export function estimateJaundice(colorimetry: ColorimetryResult): JaundiceEstimate {
  const baseInfo = {
    modelInfo: {
      name: MODEL_NAME,
      version: MODEL_VERSION,
      status: 'ACTIVE' as const,
    }
  }

  // Jaundice is primarily indicated by a strong drop in the Blue channel relative to R and G in the sclera.
  // The Logistic Regression model predicts the probability of elevated bilirubin (0.0 to 1.0).
  const probability = predictLogistic('jaundice_classifier', [
    colorimetry.averageRGB.r,
    colorimetry.averageRGB.g,
    colorimetry.averageRGB.b
  ])

  let screeningSignal: JaundiceEstimate['screeningSignal'] = 'WITHIN_EXPECTED_RANGE'
  
  if (probability > 0.5) {
    screeningSignal = 'POSSIBLE_ELEVATED_BILIRUBIN'
  }

  return {
    ...baseInfo,
    estimatedProbability: Math.round(probability * 1000) / 1000,
    screeningSignal
  }
}
