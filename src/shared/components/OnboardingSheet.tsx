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
            className="fixed inset-0 bg-base/80 backdrop-blur-sm z-backdrop"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[32px] p-6 pb-[calc(var(--safe-bottom)+24px)] z-sheet shadow-[var(--shadow-subtle)] border-t border-t-[var(--glass-border)] flex flex-col transition-colors duration-500"
            style={{ maxHeight: 'calc(100dvh - var(--safe-top) - 16px)' }}
          >
            <div className="w-12 h-1.5 bg-black/10 dark:bg-[var(--glass-surface)] rounded-full mx-auto mb-6 shrink-0" />
            
            <div className="overflow-y-auto no-scrollbar flex-1 -mx-6 px-6">
            
            <h2 className="text-2xl text-primary font-medium mb-1">{title}</h2>
            <p className="text-sm text-muted mb-8">{subtitle}</p>

            <div className="space-y-6 mb-8">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-signal-teal/10 border border-signal-teal/30 flex items-center justify-center text-signal-teal text-xs font-mono">
                    {step.number}
                  </div>
                  <p className="text-sm text-primary/90 leading-relaxed pt-0.5">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
            
            </div>

            <div className="pt-4 shrink-0 z-sheet-controls relative bg-surface">
              <button
                onClick={onClose}
                className="w-full bg-primary text-base-inverse py-4 rounded-xl font-medium text-sm transition-transform active:scale-[0.98] border border-transparent shadow-[var(--shadow-subtle)]"
                style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-base)' }}
              >
                {ctaText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
