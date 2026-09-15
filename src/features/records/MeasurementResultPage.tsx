import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, RefreshCw, Save, CheckCircle, ShieldCheck, Activity, Volume2 } from 'lucide-react'
import Button from '../../shared/components/Button'
import { LiveSignalGraph } from '../../shared/components/LiveSignalGraph'
import { supabase } from '../../core/supabase'
import { useAuth } from '../../core/auth/AuthContext'
import { log } from '../../core/logger'
import { tts } from '../../core/tts'
import type { FinalMeasurementResult } from '../bio-aura/camera/types'

export function MeasurementResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { t } = useTranslation()
  
  const result = location.state?.result as FinalMeasurementResult | undefined
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speakResult = async () => {
    if (!result) return
    setIsSpeaking(true)
    const text = t('results.heartRateSpeech', { bpm: result.bpm, defaultValue: `Your heart rate is ${result.bpm} beats per minute.` })
    await tts.speak(text)
    setIsSpeaking(false)
  }

  useEffect(() => {
    if (result) {
      speakResult()
    }
  }, [result])

  if (!result) {
    return (
      <div className="min-h-full bg-mineral-black text-stone flex flex-col items-center justify-center p-6">
        <ShieldCheck className="text-muted-slate mb-4" size={48} />
        <p className="text-center mb-6 text-warm-pearl">No measurement data found.</p>
        <Button variant="secondary" onClick={() => navigate('/bio-aura')}>Return to Scanner</Button>
      </div>
    )
  }

  const isPulseTouch = result.source === 'camera_contact_ppg'

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    
    let compactWaveform = result.waveformSnapshot || []
    if (compactWaveform.length > 100) {
      const step = Math.ceil(compactWaveform.length / 100)
      compactWaveform = compactWaveform.filter((_, i) => i % step === 0)
    }

    try {
      const { error } = await supabase.from('health_measurements').insert([{
        user_id: session.user.id,
        measurement_type: 'heart_rate',
        value_numeric: result.bpm,
        unit: 'bpm',
        quality: result.quality,
        status: 'SAVED',
        duration_seconds: Math.round(result.durationSeconds),
        metadata: {
          confidence: result.confidence,
          algorithm_version: result.algorithmVersion,
          source: result.source,
          sampling_rate: result.samplingRate,
          signal_snapshot: compactWaveform
        }
      }] as any)

      if (error) throw error
      setSaved(true)
    } catch (e) {
      log.error('DB', 'Failed to save measurement', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-mineral-black flex flex-col pb-24" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-4 bg-mineral-black relative z-10 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-muted-slate hover:text-stone transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
           <h1 className="text-warm-pearl font-semibold text-lg leading-tight">
             {isPulseTouch ? 'Pulse Touch' : 'Bio-Aura'}
           </h1>
           <p className="text-[10px] text-muted-slate font-mono tracking-widest uppercase">
             {isPulseTouch ? 'Contact Optical Estimate' : 'Facial Optical Estimate'}
           </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6">
        
        {/* Primary Instrument Result */}
        <div className="bg-deep-graphite rounded-3xl p-8 border border-white/5 relative overflow-hidden">
          <div className="flex flex-col items-center justify-center text-center">
            
            <button 
              onClick={speakResult}
              className={`absolute top-6 right-6 p-2 rounded-full border border-white/10 transition-colors ${isSpeaking ? 'bg-signal-teal/20 text-signal-teal' : 'bg-mineral-black text-muted-slate hover:text-stone'}`}
              aria-label="Read result aloud"
            >
              <Volume2 size={20} className={isSpeaking ? 'animate-pulse' : ''} />
            </button>

            <div className="flex items-baseline gap-2 mb-1 mt-4">
              <span className="text-7xl font-light tracking-tight text-warm-pearl">
                {result.bpm}
              </span>
              <span className="text-xl text-muted-slate font-medium">BPM</span>
            </div>
            <p className="text-stone tracking-wide mb-8 text-sm">Measured Heart Rate</p>

            <div className="w-full bg-mineral-black/50 rounded-2xl p-4 flex justify-between items-center border border-white/5">
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1">Signal Quality</p>
                <div className="flex items-center justify-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${result.quality === 'GOOD' ? 'bg-signal-teal shadow-[0_0_8px_rgba(45,212,191,0.5)]' : result.quality === 'FAIR' ? 'bg-signal-amber' : 'bg-emergency-red'}`} />
                  <p className={`text-xs font-semibold uppercase tracking-wider ${result.quality === 'GOOD' ? 'text-signal-teal' : result.quality === 'FAIR' ? 'text-signal-amber' : 'text-emergency-red'}`}>
                    {result.quality}
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1">Confidence</p>
                <p className="text-sm font-medium text-stone">
                  {Math.round(result.confidence * 100)}%
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1">Duration</p>
                <p className="text-sm font-medium text-stone">
                  {result.durationSeconds.toFixed(1)}s
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Captured Signal */}
        <div className="bg-deep-graphite rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
             <div>
                <p className="text-warm-pearl text-sm font-medium">Captured Optical Signal</p>
                <p className="text-[10px] text-muted-slate font-mono uppercase tracking-widest mt-0.5">Waveform Snapshot</p>
             </div>
             <Activity size={16} className="text-signal-teal/70" />
          </div>
          
          <div className="h-20 bg-mineral-black/50 rounded-xl overflow-hidden border border-white/5 p-2 relative">
            {result.waveformSnapshot?.length > 0 ? (
              <LiveSignalGraph waveform={result.waveformSnapshot} color="#53B7A8" height={64} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[10px] text-muted-slate uppercase tracking-widest">No snapshot available</p>
              </div>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-deep-graphite rounded-3xl p-6 border border-white/5 space-y-4">
           <p className="text-[10px] text-muted-slate font-mono uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Technical Details</p>
           
           <div className="flex justify-between items-center text-sm">
             <span className="text-muted-slate">Source</span>
             <span className="text-stone font-medium text-right">{isPulseTouch ? 'Contact (rear + torch)' : 'Remote (front)'}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <span className="text-muted-slate">Algorithm</span>
             <span className="text-stone font-medium text-right font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded">{result.algorithmVersion}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <span className="text-muted-slate">Sampling</span>
             <span className="text-stone font-medium text-right">{result.samplingRate.toFixed(1)} fps</span>
           </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-mineral-black/50 border border-white/5 rounded-2xl p-4 flex gap-3">
          <ShieldCheck className="text-muted-slate/50 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-muted-slate leading-relaxed">
            Your phone captured an optical pulse signal during this session. This is an optical estimate and is <strong className="text-stone font-normal">not a medical diagnosis</strong>.
          </p>
        </div>

      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-mineral-black via-mineral-black to-transparent pointer-events-none">
        <div className="flex gap-3 max-w-md mx-auto pointer-events-auto">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(isPulseTouch ? '/pulse-touch' : '/bio-aura')}
            icon={<RefreshCw size={18} />}
          >
            Retake
          </Button>
          {!saved ? (
            <Button
              variant="primary"
              className="flex-1 shadow-lg shadow-signal-teal/10"
              onClick={handleSave}
              loading={saving}
              icon={<Save size={18} />}
            >
              Save Record
            </Button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 text-signal-teal bg-deep-graphite rounded-xl font-medium border border-signal-teal/20">
              <CheckCircle size={18} />
              Saved
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
