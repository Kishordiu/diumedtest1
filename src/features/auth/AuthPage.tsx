import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../core/auth/AuthContext'
import Button from '../../shared/components/Button'
import { Alert } from '../../shared/components/Alert'
import DiuMedLogo from '../../shared/components/DiuMedLogo'
import { log } from '../../core/logger'

type Mode = 'signin' | 'signup' | 'reset'
type AuthState = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'INVALID_CREDENTIALS' | 'INVALID_INPUT' | 'NETWORK_ERROR' | 'RATE_LIMITED' | 'SERVER_ERROR' | 'RESET_SENT'

export default function AuthPage() {
  const { t } = useTranslation()
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [authState, setAuthState] = useState<AuthState>('IDLE')

  // Clear errors when typing
  useEffect(() => {
    if (authState !== 'IDLE' && authState !== 'SUBMITTING' && authState !== 'SUCCESS' && authState !== 'RESET_SENT') {
      setAuthState('IDLE')
    }
  }, [email, password, confirmPassword, fullName, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.includes('@')) {
      setAuthState('INVALID_INPUT')
      return
    }

    if (mode !== 'reset') {
      if (password.length < 6) {
        setAuthState('INVALID_INPUT')
        return
      }
      if (mode === 'signup' && password !== confirmPassword) {
        setAuthState('INVALID_INPUT')
        return
      }
      if (mode === 'signup' && !termsAccepted) {
        setAuthState('INVALID_INPUT')
        return
      }
    }

    setAuthState('SUBMITTING')

    try {
      let result;
      if (mode === 'reset') {
        result = await resetPassword(email)
      } else if (mode === 'signin') {
        result = await signIn(email, password)
      } else {
        result = await signUp(email, password, fullName)
      }

      if (result.error) {
        log.error('AUTH', 'Authentication failed', { message: result.error })
        const errMsg = result.error.toLowerCase()
        if (errMsg.includes('invalid login credentials')) {
          setAuthState('INVALID_CREDENTIALS')
        } else if (errMsg.includes('rate limit') || errMsg.includes('too many requests')) {
          setAuthState('RATE_LIMITED')
        } else if (errMsg.includes('network') || errMsg.includes('fetch')) {
          setAuthState('NETWORK_ERROR')
        } else {
          setAuthState('SERVER_ERROR')
        }
        return
      }

      if (mode === 'reset') {
        setAuthState('RESET_SENT')
        return
      }

      setAuthState('SUCCESS')
      setTimeout(() => navigate('/'), 800)
    } catch (err: any) {
      log.error('AUTH', 'Authentication exception', err)
      if (err.message?.toLowerCase().includes('network')) {
        setAuthState('NETWORK_ERROR')
      } else {
        setAuthState('SERVER_ERROR')
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as any }
    }
  }

  return (
    <div className="min-h-[100dvh] bg-material-mineral flex flex-col relative overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Dynamic Animated Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            x: ['-20%', '20%', '-20%'], 
            y: ['-20%', '20%', '-20%'],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 15, ease: "linear", repeat: Infinity }}
          className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-signal-teal/10 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            x: ['20%', '-20%', '20%'], 
            y: ['20%', '-20%', '20%'],
            scale: [1.2, 1, 1.2]
          }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-signal-amber/10 rounded-full blur-[100px]"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col px-6 pb-6 pt-12 relative z-10 max-w-md mx-auto w-full"
      >
        {/* Sequence 1-4: Header */}
        <motion.div variants={itemVariants} className="mb-10 text-center flex flex-col items-center">
          <div className="text-signal-teal mb-6">
            <DiuMedLogo size={32} />
          </div>
          <h1 className="text-warm-pearl text-2xl font-light tracking-[0.2em] mb-3">
            DIUMED
          </h1>
          <p className="text-muted-slate text-sm font-medium">
            Health intelligence,<br />inside the device you already carry.
          </p>
        </motion.div>

        {/* Sequence 5: Login Surface */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4" noValidate>
          <AnimatePresence mode="popLayout">
            {mode === 'signup' && (
              <motion.div
                key="fullname"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-slate group-focus-within:text-signal-teal transition-colors" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required={mode === 'signup'}
                    className="w-full bg-material-glass text-warm-pearl border border-white/10 rounded-instrument pl-11 pr-4 py-3.5 text-sm placeholder:text-muted-slate focus:outline-none focus:border-signal-teal/50 transition-all shadow-inner backdrop-blur-md"
                    placeholder="Full name"
                  />
                </div>
              </motion.div>
            )}

            <motion.div key="email" layout className="relative group">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-slate group-focus-within:text-signal-teal transition-colors" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-material-glass backdrop-blur-md border-white/10 text-warm-pearl border border-white/5 rounded-instrument pl-11 pr-4 py-3.5 text-sm placeholder:text-muted-slate focus:outline-none focus:border-signal-teal/50 transition-all shadow-inner"
                placeholder="Email address"
              />
            </motion.div>

            {mode !== 'reset' && (
              <motion.div key="password" layout className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-slate group-focus-within:text-signal-teal transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-material-glass backdrop-blur-md border-white/10 text-warm-pearl border border-white/5 rounded-instrument pl-11 pr-12 py-3.5 text-sm placeholder:text-muted-slate focus:outline-none focus:border-signal-teal/50 transition-all shadow-inner"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-slate hover:text-warm-pearl transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>
            )}

            {mode === 'signup' && (
              <motion.div
                key="confirmPassword"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative group mt-4">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-slate group-focus-within:text-signal-teal transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-material-glass backdrop-blur-md border-white/10 text-warm-pearl border border-white/5 rounded-instrument pl-11 pr-4 py-3.5 text-sm placeholder:text-muted-slate focus:outline-none focus:border-signal-teal/50 transition-all shadow-inner"
                    placeholder="Confirm Password"
                  />
                </div>
              </motion.div>
            )}

            {mode === 'signin' && (
              <motion.div key="forgot" layout className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset')
                    setAuthState('IDLE')
                  }}
                  className="text-stone text-[11px] hover:text-warm-pearl transition-colors uppercase tracking-widest font-mono"
                >
                  Forgot password?
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 mt-4 mb-2"
            >
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-deep-graphite text-signal-teal focus:ring-signal-teal focus:ring-offset-0 focus:ring-offset-transparent"
                />
              </div>
              <label htmlFor="terms" className="text-[10px] text-muted-slate leading-relaxed flex-1 cursor-pointer">
                I agree to the DiuMed <span className="text-stone hover:text-warm-pearl underline underline-offset-2">Terms of Use</span> and <span className="text-stone hover:text-warm-pearl underline underline-offset-2">Privacy Policy</span>.
              </label>
            </motion.div>
          )}

          {/* Error Alert */}
          {authState !== 'IDLE' && authState !== 'SUBMITTING' && authState !== 'SUCCESS' && authState !== 'RESET_SENT' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
              <Alert 
                variant="ERROR" 
                message={
                  authState === 'INVALID_CREDENTIALS' ? 'Email or password is incorrect.' :
                  authState === 'INVALID_INPUT' ? (mode === 'signup' ? (password !== confirmPassword ? 'Passwords do not match.' : !termsAccepted ? 'Please accept the terms.' : 'Please check your inputs (min 6 chars).') : 'Please check your email and password.') :
                  authState === 'NETWORK_ERROR' ? 'Connection unavailable. Check your network.' :
                  authState === 'RATE_LIMITED' ? 'Too many attempts. Please wait and try again.' :
                  'Something went wrong. Please try again.'
                }
              />
            </motion.div>
          )}
          
          {authState === 'SUCCESS' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
              <Alert variant="SUCCESS" message="Authentication successful." />
            </motion.div>
          )}

          {authState === 'RESET_SENT' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
              <Alert variant="SUCCESS" message="Password reset link sent to your email." />
            </motion.div>
          )}

          <div className="mt-6 space-y-4">
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-12 text-sm tracking-widest font-mono"
              loading={authState === 'SUBMITTING' || authState === 'SUCCESS'}
            >
              {mode === 'signin' ? 'CONTINUE' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SEND RESET LINK'}
            </Button>
            
            <button
              type="button"
              onClick={() => {
                setMode(m => m === 'signin' ? 'signup' : 'signin')
                setAuthState('IDLE')
              }}
              className="w-full text-stone text-[11px] hover:text-warm-pearl transition-colors py-2 uppercase tracking-widest font-mono"
            >
              {mode === 'signin' ? 'CREATE ACCOUNT' : 'BACK TO LOGIN'}
            </button>
          </div>

          <motion.div variants={itemVariants} className="mt-8 pt-6 pb-4 text-center space-y-4">
            <p className="text-[10px] text-muted-slate font-sans leading-relaxed">
              By continuing, you agree to the DiuMed <button type="button" className="text-stone hover:text-warm-pearl underline underline-offset-2">Terms of Use</button> and <button type="button" className="text-stone hover:text-warm-pearl underline underline-offset-2">Privacy Policy</button>.
            </p>
            <p className="text-[10px] text-muted-slate/70 font-sans leading-relaxed">
              Health information in DiuMed is provided for informational and screening purposes and is not a substitute for professional medical care.
            </p>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
