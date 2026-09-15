import { describe, expect, it } from 'vitest'
import { runOfflineRules } from '../../src/features/triage/offlineRules'

describe('offlineRuleEngine', () => {
  it('returns CRITICAL for chest pain', () => {
    const res = runOfflineRules('I have severe chest pain')
    expect(res.severity).toBe('CRITICAL')
    expect(res.matchedKeywords).toContain('chest pain')
  })

  it('returns HIGH for severe bleeding', () => {
    const res = runOfflineRules('severe bleeding from arm')
    expect(res.severity).toBe('HIGH')
    expect(res.matchedKeywords).toContain('severe bleeding')
  })

  it('returns MEDIUM for fever and headache', () => {
    const res = runOfflineRules('fever and bad headache')
    expect(res.severity).toBe('MEDIUM')
    expect(res.matchedKeywords).toContain('fever')
    expect(res.matchedKeywords).toContain('headache')
  })

  it('returns LOW for minor cut', () => {
    const res = runOfflineRules('i have a minor cut on my finger')
    expect(res.severity).toBe('LOW')
    expect(res.matchedKeywords).toContain('minor cut')
  })

  it('returns UNKNOWN for unrecognizable symptoms', () => {
    const res = runOfflineRules('my hair is growing too fast')
    expect(res.severity).toBe('UNKNOWN')
    expect(res.matchedKeywords.length).toBe(0)
  })

  it('returns UNKNOWN for empty input', () => {
    const res = runOfflineRules('   ')
    expect(res.severity).toBe('UNKNOWN')
  })
})
