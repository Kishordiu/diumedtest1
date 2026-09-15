const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, RefreshCw, Cpu, ChevronDown, ChevronUp, AlertCircle, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../shared/components/Button'
import { TopNavigation } from '../../shared/components/TopNavigation'
import { RawSignalDebugger } from '../../shared/components/RawSignalDebugger'
import { LiveSignalGraph } from '../../shared/components/LiveSignalGraph'
import { useMeasurementEngine } from './camera/useMeasurementEngine'
import { extractRoiRgb, processRppgBuffer } from './rppg/rppgEngine'
import { extractPulseTouchRgb, processPulseTouchBuffer } from './camera/PulseTouchEngine'
import type { FinalMeasurementResult, MeasurementPhase } from './camera/types'

type Mode = 'facial' | 'contact'

export function BioAuraPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [mode, setMode] = useState<Mode>('facial')
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  const handleResultReady = (result: FinalMeasurementResult) => {
    // Navigate to result screen with data in memory
    navigate('/measurement-result/new', { state: { result } })
  }

  const { start, stop, progress, videoRef, canvasRef } = useMeasurementEngine({
    source: mode === 'facial' ? 'camera_rppg' : 'camera_contact_ppg',
    facingMode: mode === 'facial' ? 'user' : 'environment',
    torch: mode === 'contact',
    extractFrame: mode === 'facial' ? extractRoiRgb : extractPulseTouchRgb,
    processBuffer: mode === 'facial' ? processRppgBuffer : processPulseTouchBuffer,
    onResultReady: handleResultReady,
    targetWindowSeconds: 10,
    maxTimeoutSeconds: 30,
  })

  // Start camera when component mounts or mode changes
  useEffect(() => {
    start()
    return () => stop()
  }, [mode, start, stop])

  return (
    <div className="min-h-screen bg-mineral-black text-stone flex flex-col">
      <TopNavigation title="Bio-Aura Scanner" />

      {/* Mode Switcher */}
      <div className="px-6 py-4">
        <div className="bg-deep-graphite p-1 rounded-full flex">
          <button
            onClick={() => setMode('facial')}
            className={\`flex-1 text-xs font-medium py-2 rounded-full transition-colors \${mode === 'facial' ? 'bg-mineral-black text-warm-pearl shadow-sm' : 'text-muted-slate hover:text-stone'}\`}
          >
            Facial (rPPG)
          </button>
          <button
            onClick={() => setMode('contact')}
            className={\`flex-1 text-xs font-medium py-2 rounded-full transition-colors \${mode === 'contact' ? 'bg-mineral-black text-warm-pearl shadow-sm' : 'text-muted-slate hover:text-stone'}\`}
          >
            Pulse Touch (cPPG)
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 flex flex-col">
        {/* Camera Viewfinder */}
        <div className="relative aspect-[3/4] bg-deep-graphite rounded-card overflow-hidden mb-6 flex-shrink-0">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            disablePictureInPicture
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlays */}
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex justify-between items-start">
               <StateGuidance phase={progress.phase} />
               {progress.elapsedSeconds > 0 && (
                 <div className="bg-mineral-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-warm-pearl font-mono">
                   {progress.elapsedSeconds.toFixed(1)}s
                 </div>
               )}
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <CameraFrame phase={progress.phase} mode={mode} />
            </div>

            {/* Central Instrument Visualization */}
            <div className="bg-mineral-black/80 backdrop-blur-md rounded-xl p-4 w-full border border-white/5">
               <div className="flex justify-between items-end mb-2">
                 <div>
                   <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1">Signal Quality</p>
                   <QualityBadge quality={progress.signalQuality} />
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1">Candidate BPM</p>
                   <p className="text-xl font-medium text-warm-pearl">
                     {progress.stableCandidateBPM || progress.candidateBPM || '--'}
                   </p>
                 </div>
               </div>
               
               <LiveSignalGraph 
                 waveform={progress.waveformBuffer} 
                 color={progress.signalQuality === 'GOOD' ? '#53B7A8' : progress.signalQuality === 'POOR' ? '#D8A94D' : '#F5F2EA'}
               />
               
               {progress.phase.startsWith('FAILED') && (
                 <div className="mt-3 text-center">
                   <p className="text-signal-amber text-xs mb-2">{progress.reason}</p>
                   <Button variant="secondary" size="sm" onClick={start} icon={<RefreshCw size={14} />}>
                     Try Again
                   </Button>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Diagnostics drawer (dev mode) */}
        {import.meta.env.DEV && (
          <div className="pb-4">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="flex items-center gap-2 text-muted-slate text-xs py-2 hover:text-stone transition-colors"
            >
              <Cpu size={12} />
              Diagnostics
              {showDiagnostics ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            <AnimatePresence>
              {showDiagnostics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-deep-graphite rounded-card p-3 font-mono text-xs text-stone space-y-1 overflow-hidden"
                >
                  <div>Phase: {progress.phase}</div>
                  <div>FPS: {progress.samplingRate.toFixed(1)}</div>
                  <div>Frames: {progress.framesCaptured}</div>
                  <div>Amplitude: {progress.signalAmplitude.toFixed(3)}</div>
                  <div>Motion: {progress.motionScore.toFixed(3)}</div>
                  <div>Confidence: {progress.confidence.toFixed(2)}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  )
}

function CameraFrame({ phase, mode }: { phase: MeasurementPhase, mode: Mode }) {
  const isActive = phase === 'SIGNAL_ACQUIRING' || phase === 'SIGNAL_QUALITY_CHECK' || phase === 'MEASURING' || phase === 'RESULT_CANDIDATE' || phase === 'STABILITY_CONFIRMATION'
  const isPoor = phase === 'SIGNAL_QUALITY_CHECK' || phase === 'FAILED_MOVEMENT'
  const isGood = phase === 'RESULT_CANDIDATE' || phase === 'STABILITY_CONFIRMATION'

  const color = isPoor ? '#D8A94D' : isGood ? '#53B7A8' : '#F5F2EA'

  if (mode === 'contact') {
    return (
      <div 
        className={\`w-24 h-24 rounded-full border-2 transition-all duration-300 flex items-center justify-center \${isActive ? 'scale-110' : 'scale-100'}\`}
        style={{ borderColor: color, opacity: isActive ? 0.8 : 0.3 }}
      >
        <div className="w-16 h-16 rounded-full" style={{ backgroundColor: color, opacity: 0.2 }} />
      </div>
    )
  }

  return (
    <div className="relative w-48 h-64">
      {/* TL */}
      <div style={{ borderColor: color }} className={\`absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 transition-colors duration-300 \${isActive ? 'opacity-80' : 'opacity-20'}\`} />
      {/* TR */}
      <div style={{ borderColor: color }} className={\`absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 transition-colors duration-300 \${isActive ? 'opacity-80' : 'opacity-20'}\`} />
      {/* BL */}
      <div style={{ borderColor: color }} className={\`absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 transition-colors duration-300 \${isActive ? 'opacity-80' : 'opacity-20'}\`} />
      {/* BR */}
      <div style={{ borderColor: color }} className={\`absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 transition-colors duration-300 \${isActive ? 'opacity-80' : 'opacity-20'}\`} />
    </div>
  )
}

function StateGuidance({ phase }: { phase: MeasurementPhase }) {
  const messages: Partial<Record<MeasurementPhase, { text: string; color: string }>> = {
    REQUESTING_CAMERA: { text: 'Starting camera...', color: 'text-stone' },
    CAMERA_READY: { text: 'Camera ready', color: 'text-stone' },
    FINDING_FACE: { text: 'Center your face in the frame', color: 'text-soft-bone' },
    FINGER_NOT_DETECTED: { text: 'Place finger over rear camera', color: 'text-soft-bone' },
    TORCH_INITIALIZING: { text: 'Turning on flashlight...', color: 'text-stone' },
    FACE_LOCKED: { text: 'Face detected, hold still', color: 'text-signal-teal' },
    FINGER_DETECTED: { text: 'Contact detected, hold still', color: 'text-signal-teal' },
    SIGNAL_ACQUIRING: { text: 'Acquiring optical signal...', color: 'text-stone' },
    SIGNAL_QUALITY_CHECK: { text: 'Signal weak — adjusting...', color: 'text-signal-amber' },
    MEASURING: { text: 'Processing signal...', color: 'text-stone' },
    RESULT_CANDIDATE: { text: 'Candidate signal found', color: 'text-signal-teal' },
    STABILITY_CONFIRMATION: { text: 'Confirming stability...', color: 'text-signal-teal' },
  }

  const msg = messages[phase]
  if (!msg) return null

  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-mineral-black/70 backdrop-blur-sm rounded-full px-4 py-1.5"
    >
      <p className={\`text-xs \${msg.color}\`}>{msg.text}</p>
    </motion.div>
  )
}

function QualityBadge({ quality }: { quality: string }) {
  const colors = {
    UNKNOWN: 'text-muted-slate',
    POOR: 'text-signal-amber',
    FAIR: 'text-warm-pearl',
    GOOD: 'text-signal-teal'
  }
  return (
    <span className={\`text-xs font-bold \${colors[quality as keyof typeof colors] || colors.UNKNOWN}\`}>
      {quality}
    </span>
  )
}
`

fs.writeFileSync('src/features/bio-aura/BioAuraPage.tsx', code);
console.log('done');
