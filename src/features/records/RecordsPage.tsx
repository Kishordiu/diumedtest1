import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, ClipboardList, Camera, Fingerprint, FileText, Droplet, Eye } from 'lucide-react'
import { supabase } from '../../core/supabase'
import type { Database } from '../../core/database.types'

type Measurement = Database['public']['Tables']['health_measurements']['Row']

function formatMeasurementType(type: string): string {
  const labels: Record<string, string> = {
    heart_rate: 'Heart rate',
    spo2: 'SpO2',
    respiratory_rate: 'Respiratory rate',
    hrv: 'HRV',
    erythema_index: 'Erythema Index',
    yellowness_index: 'Yellowness Index',
  }
  return labels[type] ?? type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function getSourceIcon(source: string) {
  if (source === 'camera_contact_ppg') return <Fingerprint size={16} className="text-stone" />
  if (source === 'lab_report') return <FileText size={16} className="text-stone" />
  if (source === 'camera_vision_anemia') return <Droplet size={16} className="text-signal-amber" />
  if (source === 'camera_vision_sclera') return <Eye size={16} className="text-signal-teal" />
  return <Activity size={16} className="text-signal-teal" />
}

function getSourceName(source: string) {
  if (source === 'camera_contact_ppg') return 'Pulse Touch'
  if (source === 'lab_report') return 'Lab Report'
  if (source === 'camera_vision_anemia') return 'Anemia Screen'
  if (source === 'camera_vision_sclera') return 'Sclera Screen'
  return 'Bio-Aura'
}

const qualityColors: Record<string, string> = {
  EXCELLENT: 'text-signal-teal bg-signal-teal/10 border-signal-teal/20',
  GOOD: 'text-signal-teal bg-signal-teal/10 border-signal-teal/20',
  FAIR: 'text-signal-amber bg-signal-amber/10 border-signal-amber/20',
  POOR: 'text-emergency-red bg-emergency-red/10 border-emergency-red/20',
  UNKNOWN: 'text-muted-slate bg-white/5 border-white/5',
}

function groupByDate(measurements: Measurement[]) {
  const groups: Record<string, Measurement[]> = {}
  
  const today = new Date()
  today.setHours(0,0,0,0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const m of measurements) {
    const d = new Date(m.captured_at)
    const mDay = new Date(d)
    mDay.setHours(0,0,0,0)

    let dateLabel = ''
    if (mDay.getTime() === today.getTime()) {
      dateLabel = 'TODAY'
    } else if (mDay.getTime() === yesterday.getTime()) {
      dateLabel = 'YESTERDAY'
    } else {
      dateLabel = d.toLocaleDateString(undefined, {
        month: 'long', day: 'numeric', year: 'numeric'
      }).toUpperCase()
    }

    if (!groups[dateLabel]) groups[dateLabel] = []
    groups[dateLabel].push(m)
  }
  return Object.entries(groups).map(([date, items]) => ({ date, items }))
}

export default function RecordsPage() {
  const navigate = useNavigate()
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('health_measurements')
        .select('*')
        .eq('status', 'SAVED')
        .order('captured_at', { ascending: false })
      setMeasurements(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-full bg-mineral-black flex flex-col pb-28" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="px-6 pt-8 pb-6 flex items-center justify-between sticky top-0 bg-mineral-black/90 backdrop-blur-md z-10">
        <h1 className="text-warm-pearl text-3xl font-light tracking-tight">History</h1>
        <button 
          onClick={() => navigate('/scan-lab-report')} 
          className="text-warm-pearl bg-raised-graphite border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/5 transition-colors"
        >
          <Camera size={14} />
          <span className="text-[10px] font-mono uppercase tracking-[0.1em]">Scan Lab</span>
        </button>
      </div>

      {loading ? (
        <div className="px-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-raised-graphite rounded-3xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : measurements.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center px-6 py-32 text-center">
          <div className="w-16 h-16 rounded-full bg-raised-graphite flex items-center justify-center mb-6 border border-white/5">
            <ClipboardList size={24} className="text-muted-slate" strokeWidth={1.5} />
          </div>
          <p className="text-warm-pearl text-xl font-light tracking-tight mb-2">No Records Yet</p>
          <p className="text-muted-slate text-sm font-medium">Measurements you save will appear here.</p>
        </motion.div>
      ) : (
        <div className="px-6 space-y-10">
          {groupByDate(measurements).map(({ date, items }) => (
            <div key={date}>
              <p className="text-muted-slate text-[10px] font-mono tracking-[0.2em] uppercase mb-4">
                {date}
              </p>
              <div className="space-y-3">
                {items.map(m => {
                  const source = (m.metadata as any)?.source || 'unknown'
                  return (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => navigate(`/records/${m.id}`)}
                      className="w-full bg-raised-graphite rounded-3xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors border border-white/5 group text-left"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-mineral-black border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:border-white/10 transition-colors">
                        {getSourceIcon(source)}
                      </div>
                      <div className="flex-1">
                        <p className="text-warm-pearl text-[15px] font-medium mb-1">
                          {formatMeasurementType(m.measurement_type)}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-muted-slate text-[11px] font-mono">
                            {new Date(m.captured_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <span className="text-[10px] text-muted-slate/30">•</span>
                          <span className="text-[10px] text-muted-slate tracking-wide uppercase font-mono">
                            {getSourceName(source)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        {m.value_numeric !== null ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl text-warm-pearl font-light font-mono tracking-tight">
                              {((m.measurement_type as string) === 'erythema_index' || (m.measurement_type as string) === 'yellowness_index') 
                                ? m.value_numeric.toFixed(2) 
                                : Math.round(m.value_numeric)}
                            </span>
                            <span className="text-[10px] text-signal-teal font-mono uppercase tracking-widest">{m.unit}</span>
                          </div>
                        ) : (
                          <span className="text-muted-slate text-xs">No data</span>
                        )}
                        <span className={`text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${qualityColors[m.quality] ?? 'text-muted-slate border-white/5'}`}>
                          {m.quality}
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
