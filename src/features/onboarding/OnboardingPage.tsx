import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ChevronRight, AlertTriangle, Eye, ShieldCheck } from 'lucide-react'
import Button from '../../shared/components/Button'
import DiuMedLogo from '../../shared/components/DiuMedLogo'

const steps = [
  {
    key: 'step1',
    icon: Eye,
    iconColor: 'text-signal-teal',
  },
  {
    key: 'step2',
    icon: AlertTriangle,
    iconColor: 'text-signal-amber',
  },
  {
    key: 'step3',
    icon: ShieldCheck,
    iconColor: 'text-signal-teal',
  },
]

export default function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [consented, setConsented] = useState(false)

  const isLast = step === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      navigate('/auth')
    } else {
      setStep(s => s + 1)
    }
  }

  const canProceed = isLast ? consented : true

  return (
    <div
      className="min-h-dvh min-h-screen bg-mineral-black flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="text-signal-teal">
          <DiuMedLogo size={28} />
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="text-muted-slate text-sm hover:text-stone transition-colors"
        >
          {t('onboarding.skip')}
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`transition-all duration-300 rounded-full ${
              i === step
                ? 'w-6 h-1.5 bg-signal-teal'
                : i < step
                ? 'w-1.5 h-1.5 bg-signal-teal/40'
                : 'w-1.5 h-1.5 bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col flex-1"
          >
            {/* Icon */}
            <div className={`mb-6 ${steps[step].iconColor}`}>
              {(() => {
                const Icon = steps[step].icon
                return <Icon size={36} strokeWidth={1.5} />
              })()}
            </div>

            {/* Title */}
            <h1 className="text-warm-pearl text-2xl font-semibold mb-4 leading-tight">
              {t(`onboarding.${steps[step].key}.title`)}
            </h1>

            {/* Step-specific content */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-soft-bone text-base leading-relaxed">
                  {t('onboarding.step1.body')}
                </p>
                <div className="surface-raised rounded-card p-4 border border-white/5">
                  <p className="text-muted-slate text-sm">{t('onboarding.step1.note')}</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="surface-measure rounded-card p-4">
                  <p className="text-signal-teal text-sm font-medium mb-1">Can estimate</p>
                  <p className="text-soft-bone text-sm">{t('onboarding.step2.can')}</p>
                </div>
                <div className="surface-warning rounded-card p-4">
                  <p className="text-signal-amber text-sm font-medium mb-1">Cannot do</p>
                  <p className="text-soft-bone text-sm">{t('onboarding.step2.cannot')}</p>
                </div>
                <p className="text-stone text-sm leading-relaxed">{t('onboarding.step2.body')}</p>
                <div className="surface-emergency rounded-card p-4">
                  <p className="text-emergency-red text-sm font-medium">
                    {t('onboarding.step2.warning')}
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-soft-bone text-base leading-relaxed">
                  {t('onboarding.step3.body')}
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={e => setConsented(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-signal-teal"
                    aria-label={t('onboarding.step3.consent')}
                  />
                  <span className="text-soft-bone text-sm leading-relaxed">
                    {t('onboarding.step3.consent')}
                  </span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
          disabled={!canProceed}
          icon={<ChevronRight size={18} />}
        >
          {isLast ? t('onboarding.step3.agree') : t('onboarding.next')}
        </Button>
        {isLast && (
          <button
            onClick={() => navigate('/auth')}
            className="w-full mt-3 text-center text-muted-slate text-sm py-2 hover:text-stone transition-colors"
          >
            {t('onboarding.step3.decline')}
          </button>
        )}
      </div>
    </div>
  )
}
