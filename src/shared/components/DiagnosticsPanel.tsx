import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';

interface DiagnosticMetric {
  label: string;
  value: string | number | null;
  status?: 'good' | 'warn' | 'error' | 'neutral';
}

interface DiagnosticsPanelProps {
  title: string;
  metrics: DiagnosticMetric[];
  rawSignal?: number[];
  filteredSignal?: number[];
}

export function DiagnosticsPanel({ title, metrics, rawSignal, filteredSignal }: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawSignal = (signal: number[], color: string, heightOffset: number, heightScale: number) => {
        if (!signal || signal.length === 0) return;
        
        const min = Math.min(...signal);
        const max = Math.max(...signal);
        const range = max - min || 1; // avoid division by zero

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        for (let i = 0; i < signal.length; i++) {
          const x = (i / (signal.length - 1)) * canvas.width;
          const normalizedY = (signal[i] - min) / range;
          // Invert Y so higher values are up
          const y = heightOffset + (1 - normalizedY) * heightScale;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      // Draw Raw Signal (top half)
      if (rawSignal && rawSignal.length > 0) {
        drawSignal(rawSignal, 'rgba(255, 255, 255, 0.4)', 0, canvas.height / 2 - 5);
      }

      // Draw Filtered Signal (bottom half)
      if (filteredSignal && filteredSignal.length > 0) {
        drawSignal(filteredSignal, 'rgba(45, 212, 191, 0.8)', canvas.height / 2 + 5, canvas.height / 2 - 5);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, rawSignal, filteredSignal]);


  return (
    <div className="fixed bottom-[80px] left-2 right-2 z-50 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden font-mono text-[10px] shadow-2xl flex flex-col max-h-[50vh]">
      <div 
        className="flex items-center justify-between p-2 cursor-pointer bg-white/5 hover:bg-white/10 transition-colors shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-stone">
          <Terminal size={14} />
          <span className="font-semibold uppercase tracking-wider">{title} DIAGNOSTICS</span>
        </div>
        {isOpen ? <ChevronDown size={14} className="text-stone" /> : <ChevronUp size={14} className="text-stone" />}
      </div>
      
      {isOpen && (
        <div className="flex flex-col overflow-y-auto">
          <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 shrink-0">
            {metrics.map((m, i) => (
              <div key={i} className="flex justify-between items-center border-b border-white/5 pb-1">
                <span className="text-white/40">{m.label}</span>
                <span className={`
                  ${m.status === 'good' ? 'text-signal-teal' : ''}
                  ${m.status === 'warn' ? 'text-signal-amber' : ''}
                  ${m.status === 'error' ? 'text-emergency-red' : ''}
                  ${!m.status || m.status === 'neutral' ? 'text-warm-pearl' : ''}
                `}>
                  {m.value === null ? '--' : m.value}
                </span>
              </div>
            ))}
          </div>
          
          {(rawSignal || filteredSignal) && (
            <div className="px-3 pb-3 shrink-0">
              <div className="flex justify-between text-[8px] text-white/40 mb-1">
                <span>RAW SIGNAL (WHITE)</span>
                <span>FILTERED PPG (TEAL)</span>
              </div>
              <canvas 
                ref={canvasRef} 
                width={300} 
                height={80} 
                className="w-full h-[80px] bg-white/5 rounded border border-white/10"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
