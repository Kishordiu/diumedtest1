import React, { useEffect, useState } from 'react'
import { ArrowLeft, Info, Fingerprint } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LiveSignalGraph } from '../../shared/components/LiveSignalGraph'
import { CameraLensInstrument } from '../../shared/components/CameraLensInstrument'
import { DiagnosticsPanel } from '../../shared/components/DiagnosticsPanel'
import { useMeasurementEngine } from './camera/useMeasurementEngine'
import { extractPulseTouchRgb, processPulseTouchBuffer } from './camera/PulseTouchEngine'
import type { FinalMeasurementResult, MeasurementPhase } from './camera/types'
import { OnboardingSheet } from '../../shared/components/OnboardingSheet'

export function PulseTouchPage() {
  const navigate = useNavigate()
  const [showOnboarding, setShowOnboarding] = useState(true)
  
  const handleResultReady = (result: FinalMeasurementResult) => {
    navigate('/measurement-result/new', { state: { result }, replace: true })
  }

  const { start, stop, progress, videoRef, canvasRef } = useMeasurementEngine({
    source: 'camera_contact_ppg',
    facingMode: 'environment',
    torch: true,
    extractFrame: extractPulseTouchRgb,
    processBuffer: processPulseTouchBuffer,
    onResultReady: handleResultReady,
    targetWindowSeconds: 10,
    maxTimeoutSeconds: 30,
  })

  useEffect(() => {
    if (!showOnboarding) {
      start()
    }
    return () => stop()
  }, [start, stop, showOnboarding])

  const renderGuidanceMessage = (phase: MeasurementPhase) => {
    switch (phase) {
      case 'IDLE':
      case 'PREPARING': return { title: 'Preparing Sensor', text: 'Warming up the camera' }
      case 'PERMISSION': return { title: 'Camera Access', text: 'Please allow camera access' }
      case 'CAMERA_READY':
      case 'GUIDANCE': return { title: 'Ready', text: 'Cover the rear camera & flash entirely' }
      case 'READY': return { title: 'Finger Detected', text: 'Hold still...' }
      case 'CAPTURING': return { title: 'Finding Your Signal', text: 'Acquiring optical pulse' }
      case 'SIGNAL_DETECTED': return { title: 'Signal Found', text: 'Hold very still' }
      case 'POOR_QUALITY': return { title: 'Adjust Position', text: 'Cover lens completely...' }
      case 'ANALYZING': return { title: 'Almost There', text: 'Analyzing pulse stability' }
      case 'RESULT_READY': return { title: 'Complete', text: 'Measurement finished' }
      case 'PERMISSION_DENIED': return { title: 'Permission Denied', text: 'Camera access is required.' }
      case 'CAMERA_UNAVAILABLE': return { title: 'Camera Error', text: 'Could not access the camera.' }
      case 'TORCH_UNAVAILABLE': return { title: 'Torch Unavailable', text: 'Flash could not be activated.' }
      case 'TIMEOUT': return { title: 'Timeout', text: 'Measurement took too long.' }
      default: return { title: 'Wait', text: 'Processing...' }
    }
  }

  const msg = renderGuidanceMessage(progress.phase)

  const isError = progress.phase === 'PERMISSION_DENIED' || progress.phase === 'CAMERA_UNAVAILABLE' || progress.phase === 'TIMEOUT' || progress.phase === 'TORCH_UNAVAILABLE'

  return (
    <div className="min-h-full bg-mineral-black text-stone flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-4 relative z-10 bg-mineral-black">
        <button onClick={() => { stop(); navigate(-1); }} className="text-muted-slate hover:text-stone transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-warm-pearl font-semibold text-lg leading-tight">Pulse Touch</h1>
          <p className="text-stone text-[10px] font-mono tracking-wide text-signal-teal">CONTACT OPTICAL ESTIMATE</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-5 py-2 overflow-y-auto">
        
        {/* Optical Sensor UI */}
        <CameraLensInstrument 
          phase={progress.phase}
          shape="circle"
          overlay={
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-full">
              {isError && (
                <div className="absolute inset-0 bg-mineral-black/90 rounded-full flex flex-col items-center justify-center p-4 text-center z-20 backdrop-blur-md">
                  <Info size={28} className="text-emergency-red mb-3" />
                  <p className="text-warm-pearl font-medium text-sm mb-2">{msg.title}</p>
                  <p className="text-stone text-xs mb-4">{msg.text}</p>
                  <button onClick={start} className="text-[10px] font-semibold text-stone uppercase tracking-wider bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 pointer-events-auto transition-colors">
                    Retry
                  </button>
                </div>
              )}
              
              {/* Guidance State */}
              {progress.phase === 'GUIDANCE' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="w-24 h-24 border-2 border-dashed border-signal-teal/30 rounded-full animate-[spin_10s_linear_infinite] absolute" />
                  <Fingerprint size={48} className="text-signal-teal/50 animate-pulse drop-shadow-[0_0_15px_rgba(87,185,167,0.5)]" />
                </motion.div>
              )}

              {/* Active Scanning Radar State */}
              {(progress.phase === 'CAPTURING' || progress.phase === 'SIGNAL_DETECTED' || progress.phase === 'ANALYZING') && (
                <>
                  {/* Radar Sweeper */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-signal-teal/20"
                    style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(87,185,167,0.1) 90%, rgba(87,185,167,0.8) 100%)' }}
                  />
                  {/* Pulse Ring */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 border-2 border-signal-teal/50 rounded-full absolute drop-shadow-[0_0_20px_rgba(87,185,167,0.8)]"
                  />
                  <div className="bg-mineral-black/70 px-3 py-1 rounded-full border border-signal-teal/30 z-10 backdrop-blur-sm">
                    <p className="text-[10px] text-signal-teal font-mono tracking-widest uppercase">Acquiring</p>
                  </div>
                </>
              )}
            </div>
          }
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            disablePictureInPicture
          />
          <canvas ref={canvasRef} className="hidden" />
        </CameraLensInstrument>

        <div className="flex flex-col items-center mb-8 mt-2">
           <h2 className="text-lg text-warm-pearl font-medium mb-1">{msg.title}</h2>
           <p className="text-sm text-stone">{msg.text}</p>
           {progress.elapsedSeconds > 0 && !isError && (
             <div className="mt-4 bg-white/5 border border-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs text-warm-pearl font-mono">
               {progress.elapsedSeconds.toFixed(1)}s / {progress.targetWindowSeconds}s
             </div>
           )}
        </div>

        {/* Live Data Instrument */}
        <div className="bg-deep-graphite rounded-3xl p-5 w-full border border-white/5 shadow-xl mt-auto">
           <div className="flex justify-between items-end mb-5">
             <div>
               <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1.5">Optical Signal</p>
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${(progress.signalQuality === 'GOOD' || progress.signalQuality === 'EXCELLENT') ? 'bg-signal-teal shadow-[0_0_8px_rgba(87,185,167,0.8)]' : progress.signalQuality === 'FAIR' ? 'bg-signal-amber' : 'bg-emergency-red'}`} />
                 <p className="text-xs text-warm-pearl font-medium">
                   {progress.signalQuality}
                 </p>
               </div>
             </div>
             
             <div className="text-right">
                <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1">Estimate</p>
                {progress.candidateBPM ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-baseline gap-1"
                  >
                    <motion.span 
                      key={Math.round(progress.candidateBPM)}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`text-4xl font-light drop-shadow-[0_0_15px_rgba(87,185,167,0.4)] ${progress.stableCandidateBPM ? 'text-signal-teal font-medium' : 'text-warm-pearl'}`}
                    >
                      {Math.round(progress.candidateBPM)}
                    </motion.span>
                    <span className="text-xs text-muted-slate font-mono">BPM</span>
                  </motion.div>
                ) : (
                  <span className="text-sm text-muted-slate">--</span>
                )}
             </div>
           </div>

           <div className="h-16 bg-mineral-black rounded-xl overflow-hidden relative border border-white/5 shadow-inner">
             <LiveSignalGraph waveform={progress.waveformBuffer} color="#57B9A7" height={64} />
             {(progress.phase === 'CAPTURING' || progress.phase === 'SIGNAL_DETECTED' || progress.phase === 'ANALYZING') && (
                <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-r from-transparent to-mineral-black pointer-events-none" />
             )}
           </div>
        </div>
      </div>

      <DiagnosticsPanel
        title="Pulse Touch"
        metrics={[
          { label: 'Phase', value: progress.phase },
          { label: 'FPS', value: progress.samplingRate.toFixed(1) },
          { label: 'Frames', value: progress.framesCaptured },
          { label: 'Signal Quality', value: progress.signalQuality, status: progress.signalQuality === 'GOOD' ? 'good' : 'warn' },
          { label: 'Amplitude', value: progress.signalAmplitude.toFixed(2) },
          { label: 'Candidate BPM', value: progress.candidateBPM ? progress.candidateBPM.toFixed(1) : '--' },
          { label: 'Stable BPM', value: progress.stableCandidateBPM ? progress.stableCandidateBPM.toFixed(1) : '--', status: progress.stableCandidateBPM ? 'good' : 'neutral' },
          { label: 'Reason', value: progress.reason || 'N/A', status: progress.reason ? 'error' : 'neutral' },
        ]}
        rawSignal={progress.rawSignal}
        filteredSignal={progress.waveformBuffer}
      />
      
      <OnboardingSheet
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        title="Pulse Touch"
        subtitle="Place your fingertip over the rear camera and flash."
        ctaText="Start Measurement"
        steps={[
          { number: 1, text: "Keep the lens completely covered." },
          { number: 2, text: "Hold still while the optical signal builds." },
          { number: 3, text: "Wait a few seconds for the result." }
        ]}
      />
    </div>
  )
}
