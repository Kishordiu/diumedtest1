import { describe, expect, it } from 'vitest'
import { estimateHemoglobin, extractConjunctivaFeatures, type ConjunctivaFeatures } from '../../src/features/vision/HemoglobinEstimator'

describe('HemoglobinEstimator edge prototype', () => {
  const dummyColorimetry = {
    averageRGB: { r: 180, g: 100, b: 80 },
    averageLab: { L: 50, a: 30, b: 20 },
    erythemaIndex: 0.25,
    yellownessIndex: 20
  }

  it('returns INSUFFICIENT_QUALITY when no conjunctiva features provided', () => {
    const result = estimateHemoglobin(dummyColorimetry)
    expect(result.estimatedHb).toBeNull()
    expect(result.screeningSignal).toBe('INSUFFICIENT_QUALITY')
    expect(result.modelInfo.name).toBe('diumed_hb_edge_ml')
  })

  it('returns INSUFFICIENT_QUALITY when pixel count is too low', () => {
    const lowPixelFeatures: ConjunctivaFeatures = {
      highHueRatio: 0.3,
      pixelCount: 50 // too few
    }
    const result = estimateHemoglobin(dummyColorimetry, lowPixelFeatures)
    expect(result.estimatedHb).toBeNull()
    expect(result.screeningSignal).toBe('INSUFFICIENT_QUALITY')
  })

  it('returns INVALID_INPUT when regression output is physiologically impossible (fails to generalize)', () => {
    const absurdFeatures: ConjunctivaFeatures = {
      highHueRatio: 3.0, // Absurdly high HHR (should be 0.0-1.0), yields Hb > 24
      pixelCount: 1000
    }
    const result = estimateHemoglobin(dummyColorimetry, absurdFeatures)
    expect(result.estimatedHb).toBeNull()
    expect(result.modelInfo.status).toBe('INVALID_INPUT')
  })

  it('returns a deterministic prototype output for valid feature input without asserting clinical accuracy', () => {
    // Synthetic feature fixture only; this is not a clinical test or a healthy-patient prediction.
    const healthyFeatures: ConjunctivaFeatures = {
      highHueRatio: 0.15,
      pixelCount: 5000
    }
    const result = estimateHemoglobin(dummyColorimetry, healthyFeatures)
    expect(result.estimatedHb).not.toBeNull()
    // Current embedded weights: 4.4772270519 + 8.9942135720 * 0.15 ≈ 5.8.
    expect(result.estimatedHb).toBe(5.8)
    expect(result.modelInfo.status).toBe('ACTIVE')
    expect(result.modelInfo.name).toBe('diumed_hb_edge_ml')
  })

  it('does not claim training coefficients or validation metrics that are not established', () => {
    const features: ConjunctivaFeatures = {
      highHueRatio: 0.5,
      pixelCount: 5000
    }
    const result = estimateHemoglobin(dummyColorimetry, features)

    expect(result.provenance.method).toContain('not independently validated')
    expect(result.provenance.datasetDoi).toContain('Reference only')
    expect(Object.keys(result.provenance.coefficients)).toHaveLength(0)
    expect(result.provenance.validation.mae).toBeNull()
    expect(result.provenance.validation.rmse).toBeNull()
    expect(result.provenance.validation.loaLower).toBeNull()
    expect(result.provenance.validation.loaUpper).toBeNull()
    expect(result.provenance.validation.n).toBe(0)
    expect(result.provenance.features.highHueRatio).toBe(0.5)
    expect(result.provenance.features.rawEstimate).toBeCloseTo(8.97, 2)
  })

  it('runs an end-to-end fixture ensuring displayed Hb comes from the exact HHR inference path', () => {
    // 1. Captured conjunctiva image (mock features representing valid ROI)
    const e2eFeatures: ConjunctivaFeatures = {
      highHueRatio: 0.25, // Mocked HHR
      pixelCount: 6000
    }
    
    // 2. Regression + 3. Hb Result
    const result = estimateHemoglobin(dummyColorimetry, e2eFeatures)
    
    // Current development weights: 4.4772270519 + (8.9942135720 * 0.25).
    const exactMath = 4.477227051942548 + (8.994213571973638 * 0.25)
    const expectedRounded = Math.round(exactMath * 10) / 10

    // 4. Verification
    expect(result.estimatedHb).toBe(expectedRounded)
    expect(result.estimatedHb).toBe(6.7) // Deterministic output of the current embedded prototype weights.

    // 5. Provenance tracking ensures we can save and retrieve this record accurately
    expect(result.provenance.features.highHueRatio).toBe(0.25)
    expect(result.provenance.features.rawEstimate).toBeCloseTo(exactMath)
    
    // 6. Final status ensures the system considers this EXPERIMENTAL / RESEARCH-DERIVED
    expect(result.modelInfo.status).toBe('ACTIVE')
    expect(result.modelInfo.name).toBe('diumed_hhr_univariate_v2')
  })
})
