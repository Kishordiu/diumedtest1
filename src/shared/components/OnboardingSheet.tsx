import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Step {
  number: number;
  text: string;
}

interface OnboardingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  steps: Step[];
  ctaText: string;
}

export function OnboardingSheet({ isOpen, onClose, title, subtitle, steps, ctaText }: OnboardingSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-mineral-black/80 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-deep-graphite rounded-t-[32px] p-6 pb-[calc(env(safe-area-inset-bottom,20px)+24px)] z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] border-t border-white/5"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
            
            <h2 className="text-2xl text-warm-pearl font-medium mb-1">{title}</h2>
            <p className="text-sm text-stone mb-8">{subtitle}</p>

            <div className="space-y-6 mb-8">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-signal-teal/10 border border-signal-teal/30 flex items-center justify-center text-signal-teal text-xs font-mono">
                    {step.number}
                  </div>
                  <p className="text-sm text-warm-pearl/90 leading-relaxed pt-0.5">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full bg-warm-pearl text-mineral-black py-4 rounded-xl font-medium text-sm transition-transform active:scale-[0.98]"
            >
              {ctaText}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
