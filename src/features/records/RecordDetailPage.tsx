import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Activity } from 'lucide-react'
import { LiveSignalGraph } from '../../shared/components/LiveSignalGraph'
import { supabase } from '../../core/supabase'
import type { Database } from '../../core/database.types'

type Measurement = Database['public']['Tables']['health_measurements']['Row']

const qualityColors: Record<string, string> = {
  EXCELLENT: 'text-signal-teal',
  GOOD: 'text-signal-teal',
  FAIR: 'text-signal-amber',
  POOR: 'text-emergency-red',
  UNKNOWN: 'text-muted-slate',
}

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [measurement, setMeasurement] = useState<Measurement | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('health_measurements')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) {
        setNotFound(true)
      } else {
        setMeasurement(data)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-full bg-mineral-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-signal-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !measurement) {
    return (
      <div className="min-h-full bg-mineral-black flex flex-col items-center justify-center px-6">
        <p className="text-soft-bone text-base mb-2">Record not found.</p>
        <button onClick={() => navigate('/records')} className="text-signal-teal text-sm">
          Back to records
        </button>
      </div>
    )
  }

  const meta = measurement.metadata as any

  return (
    <div className="min-h-full bg-mineral-black" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-4 border-b border-[var(--glass-border)]">
        <button
          onClick={() => navigate(-1)}
          className="text-muted-slate hover:text-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-warm-pearl font-semibold">Measurement detail</h1>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Hero value */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-measure rounded-card p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-signal-teal" />
            <p className="text-muted text-sm capitalize">
              {measurement.measurement_type.replace('_', ' ')}
            </p>
          </div>
          {measurement.value_numeric !== null ? (
            <div className="flex items-end gap-2">
              <span className="readout text-signal-teal text-readout-lg font-thin">
                {Math.round(measurement.value_numeric)}
              </span>
              <span className="text-muted-slate text-sm mb-3">{measurement.unit}</span>
            </div>
          ) : (
            <p className="text-muted-slate text-lg">No value recorded</p>
          )}
        </motion.div>

        {/* Details */}
        <div className="bg-deep-graphite rounded-card divide-y divide-[var(--glass-border)] border border-[var(--glass-border)]">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-muted-slate text-sm">Quality</p>
            <p className={`text-sm font-medium ${qualityColors[measurement.quality] ?? 'text-warm-pearl'}`}>
              {measurement.quality}
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-muted-slate text-sm">Captured at</p>
            <p className="text-sm font-medium text-warm-pearl">
              {new Date(measurement.captured_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-muted-slate text-sm">Duration</p>
            <p className="text-sm font-medium text-warm-pearl">
              {measurement.duration_seconds ? `${measurement.duration_seconds}s` : '--'}
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-muted-slate text-sm">Source</p>
            <p className="text-sm font-medium text-warm-pearl">
              {meta?.source === 'camera_contact_ppg' ? 'Pulse Touch' :
               meta?.source === 'camera_rppg' ? 'Bio-Aura' :
               meta?.source ?? '--'}
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-muted-slate text-sm">Algorithm</p>
            <p className="text-sm font-medium text-warm-pearl">
              {meta?.algorithm_version ?? '--'}
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-muted-slate text-sm">Confidence</p>
            <p className="text-sm font-medium text-warm-pearl">
              {meta?.confidence != null ? `${Math.round(meta.confidence * 100)}%` : '--'}
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-muted-slate text-sm">FPS</p>
            <p className="text-sm font-medium text-warm-pearl">
              {meta?.fps != null ? Number(meta.fps).toFixed(1) : '--'}
            </p>
          </div>
        </div>

        {meta?.signal_snapshot && Array.isArray(meta.signal_snapshot) && (
          <div className="bg-deep-graphite rounded-card p-4 border border-[var(--glass-border)]">
            <p className="text-muted-slate text-sm mb-3">Signal Snapshot</p>
            <LiveSignalGraph waveform={meta.signal_snapshot} color="#53B7A8" height={60} />
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-deep-graphite rounded-card p-4 border border-[var(--glass-border)]">
          <p className="text-muted-slate text-xs leading-relaxed italic">
            Optical estimate — not a medical diagnosis. Accuracy depends on lighting, motion, skin tone, and camera quality.
          </p>
        </div>
      </div>
    </div>
  )
}
