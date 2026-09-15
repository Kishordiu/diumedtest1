/**
 * DiuMed Offline Triage Rule Engine
 * 
 * Deterministic symptom severity classification.
 * No network required. No AI. No guessing.
 * 
 * Source badge: OFFLINE_RULE_ENGINE
 * 
 * IMPORTANT: This is NOT a medical diagnosis.
 * It is a deterministic rule-based guidance system.
 */

import type { TriageSeverity } from '../../core/database.types'

export interface TriageRule {
  keywords: string[]
  severity: TriageSeverity
  recommendation: string
  limitations: string
}

// Rules ordered from most to least severe — first match wins
const RULES: TriageRule[] = [
  {
    keywords: ['chest pain', 'chest tightness', 'heart attack', 'cannot breathe', "can't breathe", 'no breathing', 'not breathing', 'unconscious', 'unresponsive', 'seizure', 'stroke', 'face drooping', 'arm weakness', 'speech difficulty', 'sudden severe headache', 'collapsed', 'collapse'],
    severity: 'CRITICAL',
    recommendation: 'This may be a medical emergency. Call emergency services immediately (112). Do not wait.',
    limitations: 'This assessment is based on keywords only and is not a medical diagnosis. Seek emergency care immediately.',
  },
  {
    keywords: ['severe bleeding', 'heavy bleeding', 'loss of consciousness', 'difficulty breathing', 'breathing difficulty', 'cannot walk', 'severe pain', 'high fever', 'fever above 40', 'vomiting blood', 'blood in stool', 'severe allergic', 'anaphylaxis', 'swollen throat', 'cannot swallow'],
    severity: 'HIGH',
    recommendation: 'Your symptoms suggest you need medical attention soon. Visit a hospital or call a doctor today.',
    limitations: 'This is a general guideline. A healthcare professional must evaluate your condition.',
  },
  {
    keywords: ['fever', 'temperature', 'vomiting', 'nausea', 'diarrhea', 'dehydrated', 'dehydration', 'headache', 'back pain', 'chest discomfort', 'shortness of breath', 'short of breath', 'dizziness', 'dizzy', 'fainting', 'fainted', 'blurred vision', 'eye pain', 'ear pain', 'confusion', 'confused'],
    severity: 'MEDIUM',
    recommendation: 'Monitor your symptoms carefully. If they worsen or do not improve within 24 hours, seek medical care.',
    limitations: 'This assessment cannot account for your medical history. Consult a doctor if uncertain.',
  },
  {
    keywords: ['cough', 'cold', 'sore throat', 'runny nose', 'stuffy nose', 'mild headache', 'mild pain', 'fatigue', 'tired', 'muscle ache', 'body ache', 'slight fever', 'sneezing', 'itching', 'rash', 'minor cut', 'bruise', 'stomach ache', 'indigestion'],
    severity: 'LOW',
    recommendation: 'Your symptoms appear mild. Rest, stay hydrated, and monitor for any worsening. Consult a doctor if symptoms persist beyond a few days.',
    limitations: 'These are general suggestions only. Always consult a healthcare professional for persistent or worsening symptoms.',
  },
]

export interface OfflineTriageResult {
  severity: TriageSeverity
  recommendation: string
  limitations: string
  matchedKeywords: string[]
  source: 'OFFLINE_RULE_ENGINE'
}

/**
 * Classify symptom text using deterministic rules.
 * Returns UNKNOWN if no rules match.
 */
export function runOfflineRules(symptomText: string): OfflineTriageResult {
  const normalized = symptomText.toLowerCase().trim()

  if (!normalized) {
    return {
      severity: 'UNKNOWN',
      recommendation: 'Please describe your symptoms so they can be assessed.',
      limitations: 'No symptoms were provided.',
      matchedKeywords: [],
      source: 'OFFLINE_RULE_ENGINE',
    }
  }

  for (const rule of RULES) {
    const matched = rule.keywords.filter(kw => normalized.includes(kw))
    if (matched.length > 0) {
      return {
        severity: rule.severity,
        recommendation: rule.recommendation,
        limitations: rule.limitations,
        matchedKeywords: matched,
        source: 'OFFLINE_RULE_ENGINE',
      }
    }
  }

  return {
    severity: 'UNKNOWN',
    recommendation: 'Your symptoms could not be classified with available rules. Please consult a healthcare professional.',
    limitations: 'The offline rule engine could not match your symptom description. Please try describing symptoms differently or use AI assistance.',
    matchedKeywords: [],
    source: 'OFFLINE_RULE_ENGINE',
  }
}
