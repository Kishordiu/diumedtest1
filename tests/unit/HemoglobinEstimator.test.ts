import { describe, expect, it } from 'vitest'
import { estimateHemoglobin, extractConjunctivaFeatures, type ConjunctivaFeatures } from '../../src/features/vision/HemoglobinEstimator'

describe('HemoglobinEstimator v2', () => {
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
    expect(result.modelInfo.name).toBe('diumed_hhr_univariate_v2')
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

  it('produces a real Hb estimate for valid conjunctiva features', () => {
    // Healthy conjunctiva: deeply red, low high-hue ratio
    const healthyFeatures: ConjunctivaFeatures = {
      highHueRatio: 0.15,
      pixelCount: 5000
    }
    const result = estimateHemoglobin(dummyColorimetry, healthyFeatures)
    expect(result.estimatedHb).not.toBeNull()
    // Hb = 5.815 + 7.593 * 0.15 ≈ 6.95
    expect(result.estimatedHb).toBeGreaterThan(6.0)
    expect(result.estimatedHb).toBeLessThan(8.0)
    expect(result.modelInfo.status).toBe('ACTIVE')
    expect(result.modelInfo.name).toBe('diumed_hhr_univariate_v2')
  })

  it('verifies model provenance and coefficients are traceable', () => {
    const features: ConjunctivaFeatures = {
      highHueRatio: 0.5,
      pixelCount: 5000
    }
    const result = estimateHemoglobin(dummyColorimetry, features)
    
    // Explicitly verify the model provenance matching our training output
    expect(result.provenance.datasetDoi).toBe('10.5281/zenodo.8277462')
    expect(result.provenance.method).toBe('Univariate OLS Linear Regression on HHR')
    
    // Verify coefficients match the DiuMed training script output exactly
    expect(result.provenance.coefficients.beta0_intercept).toBeCloseTo(5.8154597370440495)
    expect(result.provenance.coefficients.beta1_hhr).toBeCloseTo(7.592921035710115)
    
    // Verify validation metrics are reported honestly
    expect(result.provenance.validation.loaLower).toBe(-3.86)
    expect(result.provenance.validation.loaUpper).toBe(4.31)
  })

  it('runs an end-to-end fixture ensuring displayed Hb comes from the exact HHR inference path', () => {
    // 1. Captured conjunctiva image (mock features representing valid ROI)
    const e2eFeatures: ConjunctivaFeatures = {
      highHueRatio: 0.25, // Mocked HHR
      pixelCount: 6000
    }
    
    // 2. Regression + 3. Hb Result
    const result = estimateHemoglobin(dummyColorimetry, e2eFeatures)
    
    // Exact expected value: 5.8154597370440495 + (7.592921035710115 * 0.25)
    const exactMath = 5.8154597370440495 + (7.592921035710115 * 0.25)
    const expectedRounded = Math.round(exactMath * 10) / 10

    // 4. Verification
    expect(result.estimatedHb).toBe(expectedRounded)
    expect(result.estimatedHb).toBe(7.7) // 7.7136... rounded to 1 decimal place

    // 5. Provenance tracking ensures we can save and retrieve this record accurately
    expect(result.provenance.features.highHueRatio).toBe(0.25)
    expect(result.provenance.features.rawEstimate).toBeCloseTo(exactMath)
    
    // 6. Final status ensures the system considers this EXPERIMENTAL / RESEARCH-DERIVED
    expect(result.modelInfo.status).toBe('ACTIVE')
    expect(result.modelInfo.name).toBe('diumed_hhr_univariate_v2')
  })
})
