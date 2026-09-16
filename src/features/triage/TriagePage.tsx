import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { Send, Wifi, WifiOff, AlertTriangle, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'
import { useAuth } from '../../core/auth/AuthContext'
import { supabase } from '../../core/supabase'
import { insertTriage } from '../../core/db/queries'
import { useNetworkStatus } from '../../shared/hooks/useNetworkStatus'
import { runOfflineRules } from './offlineRules'
import Button from '../../shared/components/Button'
import type { TriageSeverity, TriageSource } from '../../core/database.types'
import { log } from '../../core/logger'

interface TriageResult {
  severity: TriageSeverity
  recommendation: string
  limitations: string
  source: TriageSource
  confidence: number | null
}

const severityConfig: Record<TriageSeverity, { label: string; icon: typeof AlertTriangle; colorClass: string; surfaceClass: string }> = {
  CRITICAL: { label: 'Critical', icon: AlertTriangle, colorClass: 'text-emergency-red', surfaceClass: 'surface-emergency' },
  HIGH: { label: 'High concern', icon: AlertCircle, colorClass: 'text-signal-amber', surfaceClass: 'surface-warning' },
  MEDIUM: { label: 'Moderate concern', icon: AlertCircle, colorClass: 'text-signal-amber', surfaceClass: 'surface-warning' },
  LOW: { label: 'Low concern', icon: CheckCircle, colorClass: 'text-signal-teal', surfaceClass: 'surface-measure' },
  UNKNOWN: { label: 'Unable to assess', icon: HelpCircle, colorClass: 'text-muted-slate', surfaceClass: '' },
}

export default function TriagePage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isOnline = useNetworkStatus()

  const [symptomText, setSymptomText] = useState('')
  const [result, setResult] = useState<TriageResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleCheck = async () => {
    const trimmed = symptomText.trim()
    if (!trimmed) {
      setError(t('triage.noInput'))
      return
    }

    setError(null)
    setLoading(true)
    setResult(null)
    setSaved(false)

    let triageResult: TriageResult

    if (isOnline && user) {
      // Try online AI via Edge Function
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No session')

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/triage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ symptomText, language: 'en' }),
          }
        )

        if (!response.ok) throw new Error(`Edge Function error: ${response.status}`)

        const data = await response.json()
        triageResult = {
          severity: data.severity ?? 'UNKNOWN',
          recommendation: data.recommendation ?? 'Unable to process.',
          limitations: data.limitations ?? t('triage.limitations'),
          source: 'ONLINE_AI_ASSISTANCE',
          confidence: data.confidence ?? null,
        }
        log.triage('Online AI result:', triageResult.severity)
      } catch (err) {
        // Fallback to offline
        log.triage('Online AI failed, falling back to offline rules:', err)
        const offline = runOfflineRules(trimmed)
        triageResult = {
          severity: offline.severity,
          recommendation: offline.recommendation,
          limitations: offline.limitations,
          source: 'OFFLINE_RULE_ENGINE',
          confidence: null,
        }
      }
    } else {
      // Offline path
      const offline = runOfflineRules(trimmed)
      triageResult = {
        severity: offline.severity,
        recommendation: offline.recommendation,
        limitations: offline.limitations,
        source: 'OFFLINE_RULE_ENGINE',
        confidence: null,
      }
      log.triage('Offline rule result:', triageResult.severity)
    }

    setResult(triageResult)
    setLoading(false)

    // Save to Supabase
    if (user) {
      await insertTriage({
        user_id: user.id,
        symptoms: [trimmed],
        symptom_text: trimmed,
        input_language: 'en',
        severity: triageResult.severity,
        recommendation: triageResult.recommendation,
        source: triageResult.source,
        confidence: triageResult.confidence,
        limitations: triageResult.limitations,
        model_metadata: null,
      })
      setSaved(true)
    }
  }

  const cfg = result ? severityConfig[result.severity] : null

  return (
    <div
      className="flex flex-col min-h-dvh bg-mineral-black"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--glass-border)]">
        <h1 className="text-warm-pearl text-xl font-semibold">{t('triage.title')}</h1>
        <p className="text-muted-slate text-sm">{t('triage.subtitle')}</p>
      </div>

      {/* Source indicator */}
      <div className="px-5 pt-3 pb-1 flex items-center gap-2">
        {isOnline ? (
          <><Wifi size={12} className="text-signal-teal" /><span className="text-xs text-muted">Online — AI assistance available</span></>
        ) : (
          <><WifiOff size={12} className="text-signal-amber" /><span className="text-xs text-muted">Offline — rule engine only</span></>
        )}
      </div>

      {/* Input */}
      <div className="px-5 pt-3 pb-4">
        <label className="block text-muted text-xs mb-2 tracking-wider uppercase">
          Describe your symptoms
        </label>
        <textarea
          value={symptomText}
          onChange={e => setSymptomText(e.target.value)}
          placeholder={t('triage.placeholder')}
          rows={4}
          className="w-full bg-deep-graphite text-warm-pearl border border-[var(--glass-border)] rounded-card px-4 py-3 text-sm placeholder:text-muted-slate/50 focus:outline-none focus:border-signal-teal transition-colors resize-none"
          aria-label="Describe your symptoms"
        />
        {error && <p className="text-signal-amber text-xs mt-1">{error}</p>}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleCheck}
          loading={loading}
          icon={<Send size={16} />}
          className="mt-3"
        >
          {loading ? t('triage.checking') : t('triage.submit')}
        </Button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && cfg && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 pb-6 space-y-3"
          >
            {/* Severity badge */}
            <div className={`${cfg.surfaceClass || 'bg-deep-graphite border border-[var(--glass-border)]'} rounded-card p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <cfg.icon size={18} className={cfg.colorClass} />
                <span className={`text-sm font-semibold ${cfg.colorClass}`}>{cfg.label}</span>
                <span className="ml-auto text-xs text-muted-slate bg-[var(--glass-surface)] px-2 py-0.5 rounded-full">
                  {result.source === 'OFFLINE_RULE_ENGINE' ? t('triage.source.offline') : t('triage.source.online')}
                </span>
              </div>
              <p className="text-warm-pearl text-sm leading-relaxed">{result.recommendation}</p>
            </div>

            {/* Limitations */}
            <div className="bg-deep-graphite rounded-card p-4 border border-[var(--glass-border)]">
              <p className="text-muted-slate text-xs leading-relaxed">{result.limitations}</p>
            </div>

            {/* Emergency warning for critical */}
            {result.severity === 'CRITICAL' && (
              <motion.div
                initial={{ scale: 0.97 }}
                animate={{ scale: 1 }}
                className="surface-emergency rounded-card p-4"
              >
                <p className="text-emergency-red text-sm font-semibold">
                  {t('triage.emergencyWarning')}
                </p>
              </motion.div>
            )}

            {saved && (
              <p className="text-center text-muted-slate text-xs">Assessment saved to records.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

