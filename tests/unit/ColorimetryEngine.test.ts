import { describe, expect, it } from 'vitest'
import { rgbToLab, calculateErythemaIndex, validateImageQuality } from '../../src/features/vision/ColorimetryEngine'

// Polyfill ImageData for Node environment
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class {
    data: Uint8ClampedArray
    width: number
    height: number
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data
      this.width = width
      this.height = height
    }
  } as any
}

describe('ColorimetryEngine', () => {
  it('rgbToLab converts pure white to L=100, a=0, b=0', () => {
    const lab = rgbToLab(255, 255, 255)
    expect(lab.L).toBeCloseTo(100, 1)
    expect(lab.a).toBeCloseTo(0, 1)
    expect(lab.b).toBeCloseTo(0, 1)
  })

  it('rgbToLab converts pure black to L=0, a=0, b=0', () => {
    const lab = rgbToLab(0, 0, 0)
    expect(lab.L).toBeCloseTo(0, 1)
    expect(lab.a).toBeCloseTo(0, 1)
    expect(lab.b).toBeCloseTo(0, 1)
  })

  it('calculateErythemaIndex computes log(R) - log(G)', () => {
    const ei = calculateErythemaIndex(200, 100)
    expect(ei).toBeCloseTo(Math.log10(200) - Math.log10(100), 5)
  })

  it('validateImageQuality handles completely dark images', () => {
    const arr = new Uint8ClampedArray(4 * 64)
    arr.fill(0) // completely black
    const imgData = new ImageData(arr, 8, 8)
    const report = validateImageQuality(imgData)
    expect(report.isSufficient).toBe(false)
    expect(report.reason).toContain('too dark')
  })

  it('validateImageQuality handles overexposed images', () => {
    const arr = new Uint8ClampedArray(4 * 64)
    arr.fill(255) // completely white
    const imgData = new ImageData(arr, 8, 8)
    const report = validateImageQuality(imgData)
    expect(report.isSufficient).toBe(false)
    expect(report.reason).toContain('overexposed')
  })
})
