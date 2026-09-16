import React from 'react';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { type VisionInputState, type VisionInputMode } from '../hooks/useVisionInput';
import { CameraLensInstrument } from '../../../shared/components/CameraLensInstrument';

interface VisionInputStageProps {
  state: VisionInputState;
  onModeChange: (mode: VisionInputMode) => void;
  onCaptureLive: () => void;
  onFileUpload: (file: File) => void;
  triggerFilePicker: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  guidanceText?: string;
  isProcessing?: boolean;
}

export function VisionInputStage({
  state,
  onModeChange,
  onCaptureLive,
  onFileUpload,
  triggerFilePicker,
  videoRef,
  fileInputRef,
  guidanceText = "Position within the frame.",
  isProcessing = false
}: VisionInputStageProps) {

  // We map the vision input status to a simplified phase for the CameraLensInstrument
  let lensPhase: any = 'IDLE';
  if (state.status === 'PREPARING') lensPhase = 'PREPARING';
  if (state.status === 'PERMISSION') lensPhase = 'PERMISSION';
  if (state.status === 'CAMERA_READY') lensPhase = 'GUIDANCE';
  if (state.status === 'IMAGE_LOADED') lensPhase = 'READY';
  if (state.status === 'ERROR') lensPhase = 'CAMERA_UNAVAILABLE';
  if (isProcessing) lensPhase = 'ANALYZING';

  const hudOverlay = (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Target Bracket */}
      {(!isProcessing && (state.status === 'CAMERA_READY' || state.status === 'IMAGE_LOADED')) && (
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-48 h-24 flex items-center justify-center"
        >
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-signal-teal/70 shadow-[0_0_8px_rgba(87,185,167,0.5)]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-signal-teal/70 shadow-[0_0_8px_rgba(87,185,167,0.5)]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-signal-teal/70 shadow-[0_0_8px_rgba(87,185,167,0.5)]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-signal-teal/70 shadow-[0_0_8px_rgba(87,185,167,0.5)]" />
          <div className="text-[10px] text-signal-teal/70 tracking-widest uppercase font-mono animate-pulse bg-mineral-black/40 px-2 py-0.5 rounded">ALIGN</div>
        </motion.div>
      )}

      {/* Laser Scanning Effect */}
      {isProcessing && (
        <div className="absolute inset-0 w-full h-full bg-signal-teal/10">
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '200%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-full h-1 bg-signal-teal shadow-[0_0_20px_4px_rgba(87,185,167,0.8)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-mineral-black/80 text-signal-teal px-3 py-1 rounded-full text-xs font-mono font-medium tracking-widest border border-signal-teal/30 shadow-lg">
              EXTRACTING FEATURES...
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full">
      {/* Segmented Control */}
      <div className="flex bg-mineral-black border border-[var(--glass-border)] rounded-full p-1 mb-6 relative z-10">
        <button
          onClick={() => onModeChange('LIVE')}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors ${
            state.mode === 'LIVE' ? 'bg-deep-graphite text-warm-pearl shadow-md' : 'text-muted-slate hover:text-muted'
          }`}
        >
          <Camera size={14} /> LIVE SCAN
        </button>
        <button
          onClick={() => onModeChange('UPLOAD')}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors ${
            state.mode === 'UPLOAD' ? 'bg-deep-graphite text-warm-pearl shadow-md' : 'text-muted-slate hover:text-muted'
          }`}
        >
          <Upload size={14} /> UPLOAD
        </button>
      </div>

      {/* The Instrument / Preview Area */}
      {state.mode === 'LIVE' ? (
        <div className="w-full flex flex-col items-center">
          <CameraLensInstrument
            phase={lensPhase}
            shape="rect"
            overlay={hudOverlay}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover -scale-x-100" // Mirror for front camera. Rear camera would need scale-x-100
              playsInline
              muted
              disablePictureInPicture
            />
          </CameraLensInstrument>
          
          <p className="text-sm text-muted text-center mb-6">{state.errorMessage || guidanceText}</p>

          {state.status === 'CAMERA_READY' && !isProcessing && (
            <button 
              onClick={onCaptureLive}
              className="bg-signal-teal text-mineral-black font-semibold rounded-full px-12 py-3 shadow-[0_0_20px_rgba(87,185,167,0.3)] hover:scale-105 transition-transform"
            >
              Capture Frame
            </button>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileUpload(file);
            }}
          />

          {state.status === 'IMAGE_LOADED' && state.imageElement ? (
            <CameraLensInstrument phase={lensPhase} shape="rect" overlay={hudOverlay}>
              <img 
                src={(state.imageElement as HTMLImageElement).src} 
                alt="Uploaded" 
                className="w-full h-full object-cover" 
              />
            </CameraLensInstrument>
          ) : (
            <div 
              onClick={triggerFilePicker}
              className="w-48 h-64 border-2 border-dashed border-[var(--glass-border)] rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-signal-teal/50 hover:bg-[var(--glass-surface)] transition-all mb-8"
            >
              <ImageIcon size={32} className="text-muted mb-3" />
              <p className="text-sm text-muted font-medium text-center px-4">Tap to select an image</p>
            </div>
          )}

          <p className="text-sm text-muted text-center mb-6">{state.errorMessage || "Use a clear, steady photo."}</p>

          {state.status !== 'IMAGE_LOADED' && !isProcessing && (
            <button 
              onClick={triggerFilePicker}
              className="bg-deep-graphite border border-[var(--glass-border)] text-warm-pearl font-semibold rounded-full px-8 py-3 hover:bg-[var(--glass-surface)] transition-colors"
            >
              Choose Image
            </button>
          )}
          {state.status === 'IMAGE_LOADED' && !isProcessing && (
            <div className="flex gap-4">
              <button 
                onClick={triggerFilePicker}
                className="bg-transparent border border-[var(--glass-border)] text-muted font-semibold rounded-full px-6 py-2 hover:bg-[var(--glass-surface)] transition-colors text-sm"
              >
                Retake
              </button>
              <button 
                onClick={() => onCaptureLive()} // Use the same action to proceed, it will use state.imageElement
                className="bg-signal-teal text-mineral-black font-semibold rounded-full px-6 py-2 shadow-lg hover:scale-105 transition-transform text-sm"
              >
                Analyze
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
