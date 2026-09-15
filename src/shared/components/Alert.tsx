import React from 'react'
import { Info, CheckCircle, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react'

export type AlertVariant = 'INFO' | 'SUCCESS' | 'ATTENTION' | 'ERROR' | 'EMERGENCY'

interface AlertProps {
  variant: AlertVariant
  title?: string
  message: string
  className?: string
  action?: React.ReactNode
}

export function Alert({ variant, title, message, className = '', action }: AlertProps) {
  const styles = {
    INFO: {
      bg: 'bg-white/5',
      border: 'border-white/10',
      text: 'text-warm-pearl',
      icon: <Info size={20} className="text-stone" />,
      title: 'text-warm-pearl'
    },
    SUCCESS: {
      bg: 'bg-signal-teal/10',
      border: 'border-signal-teal/20',
      text: 'text-warm-pearl',
      icon: <CheckCircle size={20} className="text-signal-teal" />,
      title: 'text-signal-teal'
    },
    ATTENTION: {
      bg: 'bg-signal-amber/10',
      border: 'border-signal-amber/20',
      text: 'text-warm-pearl',
      icon: <AlertTriangle size={20} className="text-signal-amber" />,
      title: 'text-signal-amber'
    },
    ERROR: {
      bg: 'bg-emergency-red/10',
      border: 'border-emergency-red/20',
      text: 'text-warm-pearl',
      icon: <AlertCircle size={20} className="text-emergency-red" />,
      title: 'text-emergency-red'
    },
    EMERGENCY: {
      bg: 'bg-emergency-red',
      border: 'border-emergency-red',
      text: 'text-white',
      icon: <ShieldAlert size={20} className="text-white" />,
      title: 'text-white'
    }
  }

  const s = styles[variant]

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${s.bg} ${s.border} ${className}`}>
      <div className="shrink-0 mt-0.5">{s.icon}</div>
      <div className="flex-1">
        {title && <h4 className={`text-sm font-semibold mb-1 uppercase tracking-wider ${s.title}`}>{title}</h4>}
        <p className={`text-sm ${s.text} leading-relaxed`}>{message}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}
