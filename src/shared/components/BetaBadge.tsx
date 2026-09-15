import React from 'react';
import { motion } from 'framer-motion';

export function BetaBadge() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-signal-teal/30 bg-signal-teal/10 shadow-[var(--shadow-subtle)]"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-signal-teal animate-pulse" />
      <span className="text-[9px] font-mono font-medium tracking-widest uppercase text-signal-teal">
        Beta
      </span>
    </motion.div>
  );
}
