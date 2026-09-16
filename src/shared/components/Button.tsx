import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'emergency'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      'bg-signal-teal text-mineral-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),_0_2px_10px_rgba(87,185,167,0.3)] hover:bg-[#4AA898] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),_0_4px_14px_rgba(87,185,167,0.4)] transform hover:-translate-y-[1px]',
    secondary:
      'bg-raised-graphite text-warm-pearl border border-[var(--glass-border)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_8px_rgba(0,0,0,0.2)] hover:bg-[#2A3136] hover:border-[var(--glass-border)]',
    ghost:
      'text-warm-pearl hover:bg-[var(--glass-surface)]',
    danger:
      'bg-emergency-red/10 text-emergency-red border border-emergency-red/20 shadow-[0_2px_8px_rgba(214,91,85,0.1)] hover:bg-emergency-red/20',
    emergency:
      'bg-emergency-red text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),_0_4px_16px_rgba(214,91,85,0.4)] hover:bg-[#C94D47] transform hover:-translate-y-[1px]',
  }

  const sizes = {
    sm: 'h-9 px-4 text-xs rounded-card',
    md: 'h-12 px-6 text-sm rounded-card',
    lg: 'h-14 px-8 text-base rounded-card font-medium',
  }

  return (
    <button
      className={`
        relative inline-flex items-center justify-center gap-2
        transition-all duration-200 outline-none
        disabled:opacity-50 disabled:pointer-events-none disabled:transform-none
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
          <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        </div>
      )}
      <span className={`inline-flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    </button>
  )
}
