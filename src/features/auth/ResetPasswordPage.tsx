import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../core/auth/AuthContext'
import Button from '../../shared/components/Button'
import { Alert } from '../../shared/components/Alert'
import DiuMedLogo from '../../shared/components/DiuMedLogo'
import { log } from '../../core/logger'
import { supabase } from '../../core/supabase'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR' | 'INVALID_INPUT'>('IDLE')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Check if we actually have a recovery token in the URL Hash
    // Supabase sets the session automatically when clicking the email link
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        log.error('AUTH', 'No session found for password reset')
        navigate('/auth', { replace: true })
      }
    })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      setStatus('INVALID_INPUT')
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setStatus('INVALID_INPUT')
      setErrorMsg('Passwords do not match.')
      return
    }

    setStatus('SUBMITTING')

    try {
      const { error } = await updatePassword(password)
      if (error) {
        setStatus('ERROR')
        setErrorMsg(error)
        return
      }
      
      setStatus('SUCCESS')
      setTimeout(() => navigate('/'), 1500)
    } catch (err: any) {
      setStatus('ERROR')
      setErrorMsg(err.message || 'An unexpected error occurred.')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-material-mineral flex flex-col relative overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col px-6 pb-6 pt-12 relative z-10 max-w-md mx-auto w-full"
      >
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="text-signal-teal mb-6">
            <DiuMedLogo size={32} />
          </div>
          <h1 className="text-warm-pearl text-2xl font-light tracking-[0.2em] mb-3">
            RESET PASSWORD
          </h1>
          <p className="text-muted-slate text-sm font-medium">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4" noValidate>
          <div className="relative group">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-slate group-focus-within:text-signal-teal transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-material-glass backdrop-blur-md border-[var(--glass-border)] text-warm-pearl border border-[var(--glass-border)] rounded-instrument pl-11 pr-12 py-3.5 text-sm placeholder:text-muted-slate focus:outline-none focus:border-signal-teal/50 transition-all shadow-inner"
              placeholder="New password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-slate hover:text-warm-pearl transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative group mt-2">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-slate group-focus-within:text-signal-teal transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-material-glass backdrop-blur-md border-[var(--glass-border)] text-warm-pearl border border-[var(--glass-border)] rounded-instrument pl-11 pr-4 py-3.5 text-sm placeholder:text-muted-slate focus:outline-none focus:border-signal-teal/50 transition-all shadow-inner"
              placeholder="Confirm new password"
            />
          </div>

          {(status === 'ERROR' || status === 'INVALID_INPUT') && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
              <Alert variant="ERROR" message={errorMsg} />
            </motion.div>
          )}

          {status === 'SUCCESS' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
              <Alert variant="SUCCESS" message="Password updated successfully." />
            </motion.div>
          )}

          <div className="mt-6">
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-12 text-sm tracking-widest font-mono"
              loading={status === 'SUBMITTING' || status === 'SUCCESS'}
            >
              UPDATE PASSWORD
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
