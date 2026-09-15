import { describe, expect, it } from 'vitest'
import { determineBiomarkerStatus } from '../../src/features/records/labSchema'

describe('labSchema', () => {
  it('determines NORMAL for value inside range', () => {
    expect(determineBiomarkerStatus(14, '12.0 - 15.5')).toBe('NORMAL')
  })

  it('determines LOW for value below range', () => {
    expect(determineBiomarkerStatus(10, '12 - 16')).toBe('LOW')
  })

  it('determines HIGH for value above range', () => {
    expect(determineBiomarkerStatus(18, '12 - 16')).toBe('HIGH')
  })

  it('handles < ranges', () => {
    expect(determineBiomarkerStatus(4, '< 5')).toBe('NORMAL')
    expect(determineBiomarkerStatus(6, '< 5')).toBe('HIGH')
  })

  it('handles > ranges', () => {
    expect(determineBiomarkerStatus(12, '> 10')).toBe('NORMAL')
    expect(determineBiomarkerStatus(8, '> 10')).toBe('LOW')
  })

  it('returns UNKNOWN for unparseable ranges', () => {
    expect(determineBiomarkerStatus(14, 'Negative')).toBe('UNKNOWN')
    expect(determineBiomarkerStatus(14, '')).toBe('UNKNOWN')
  })
})
