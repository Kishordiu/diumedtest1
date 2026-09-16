import React from 'react';
import type { MeasurementPhase } from '../../features/bio-aura/camera/types';

interface CameraLensInstrumentProps {
  phase: MeasurementPhase;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
  shape?: 'circle' | 'rect';
}

export function CameraLensInstrument({ phase, children, overlay, shape = 'circle' }: CameraLensInstrumentProps) {
  // Determine states for visual styling
  const isIdle = phase === 'IDLE' || phase === 'PREPARING' || phase === 'PERMISSION' || phase === 'CAMERA_READY';
  const isActive = phase === 'GUIDANCE' || phase === 'READY' || phase === 'CAPTURING' || phase === 'SIGNAL_DETECTED' || phase === 'POOR_QUALITY' || phase === 'ANALYZING';
  const isError = phase === 'TIMEOUT' || phase === 'CAMERA_UNAVAILABLE' || phase === 'PERMISSION_DENIED' || phase === 'TORCH_UNAVAILABLE';
  const isSuccess = phase === 'RESULT_READY';

  let borderColor = 'border-[var(--glass-border)]';
  let glowColor = 'shadow-[0_0_20px_var(--glass-border)]';
  let innerGlow = '';
  
  if (isActive) {
    borderColor = 'border-signal-teal/30';
    glowColor = 'shadow-[0_0_40px_rgba(87,185,167,0.15)]';
    if (phase === 'SIGNAL_DETECTED' || phase === 'ANALYZING') {
      innerGlow = 'animate-pulse';
      glowColor = 'shadow-[0_0_50px_rgba(87,185,167,0.25)]';
      borderColor = 'border-signal-teal/60';
    } else if (phase === 'POOR_QUALITY') {
      borderColor = 'border-signal-amber/50';
      glowColor = 'shadow-[0_0_40px_rgba(210,163,71,0.15)]';
    }
  } else if (isSuccess) {
    borderColor = 'border-signal-teal/80';
    glowColor = 'shadow-[0_0_60px_rgba(87,185,167,0.4)]';
  } else if (isError) {
    borderColor = 'border-emergency-red/50';
    glowColor = 'shadow-[0_0_30px_rgba(214,91,85,0.15)]';
  }

  const containerShapeClass = shape === 'rect' ? 'w-48 h-64' : 'w-56 h-56';
  const innerShapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-3xl';

  return (
    <div className={`relative mx-auto ${containerShapeClass} flex-shrink-0 flex items-center justify-center mb-8`}>
      {/* Outer Glow */}
      <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${glowColor} ${innerGlow} ${innerShapeClass}`} />
      
      {/* Precision Optical Rim */}
      <div 
        className={`relative w-full h-full bg-deep-graphite overflow-hidden flex items-center justify-center transition-all duration-500 ease-in-out border-[3px] ${borderColor} ${innerShapeClass}`}
      >
        {/* The Camera Feed / Content */}
        <div className="absolute inset-0 w-full h-full scale-100">
          {children}
        </div>

        {/* Frosted Lens Interior Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--glass-surface)] to-transparent pointer-events-none mix-blend-overlay" />
        
        {/* Inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none" />

        {/* Small optical aperture reflection */}
        <div className="absolute top-[10%] left-[20%] w-[15%] h-[15%] bg-[var(--glass-surface)] blur-md rounded-full pointer-events-none mix-blend-screen" />
      </div>

      {/* Dynamic Overlay (e.g. Fingerprint, Face Frame, Errors) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        {overlay}
      </div>
    </div>
  );
}
