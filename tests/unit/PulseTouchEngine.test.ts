import { describe, expect, it } from 'vitest'
import { processPulseTouchBuffer, extractPulseTouchRgb, CPPG_VERSION } from '../../src/features/bio-aura/camera/PulseTouchEngine'
import type { RppgSample } from '../../src/features/bio-aura/rppg/rppgEngine'

describe('PulseTouchEngine (Contact PPG cPPG_v1.0)', () => {
  it('returns algorithm version cPPG_v1.0', () => {
    const result = processPulseTouchBuffer([])
    expect(result.algorithmVersion).toBe(CPPG_VERSION)
  })

  it('returns null BPM for empty or small buffer', () => {
    const result = processPulseTouchBuffer([])
    expect(result.bpm).toBeNull()
    expect(result.quality).toBe('UNKNOWN')
    expect(result.reason).toContain('Insufficient frames')
  })

  it('rejects buffer if finger contact is poor (not dominant red channel)', () => {
    // Generate 120 samples of green-dominant light (e.g. ambient room light without finger over flash)
    const samples: RppgSample[] = Array.from({ length: 120 }, (_, i) => ({
      timestamp: 10000 + i * 33,
      r: 50,  // low red
      g: 150, // high green
      b: 50,
      motionScore: 0.05,
    }))

    const result = processPulseTouchBuffer(samples)
    expect(result.bpm).toBeNull()
    expect(result.reason).toContain('Poor finger contact detected')
  })

  it('rejects buffer if red channel is too dark (missing flash)', () => {
    const samples: RppgSample[] = Array.from({ length: 120 }, (_, i) => ({
      timestamp: 10000 + i * 33,
      r: 80,  // below 100 threshold
      g: 30,
      b: 20,
      motionScore: 0.05,
    }))

    const result = processPulseTouchBuffer(samples)
    expect(result.bpm).toBeNull()
    expect(result.reason).toContain('Signal amplitude too low')
  })

  it('detects a valid synthetic pulse in dominant red signal', () => {
    const fps = 30
    const targetBpm = 75
    const targetHz = targetBpm / 60
    const frameCount = 150 // 5 seconds

    const samples: RppgSample[] = Array.from({ length: frameCount }, (_, i) => {
      const t = i / fps
      const pulse = Math.sin(2 * Math.PI * targetHz * t) * 5
      return {
        timestamp: 10000 + i * 33.3,
        r: 180 + pulse, // High red base with pulse
        g: 30,          // Low green
        b: 20,          // Low blue
        motionScore: 0.02,
      }
    })

    const result = processPulseTouchBuffer(samples)
    expect(result.bpm).not.toBeNull()
    expect(Math.abs((result.bpm ?? 0) - targetBpm)).toBeLessThanOrEqual(3)
    expect(['GOOD', 'FAIR']).toContain(result.quality)
  })
})
