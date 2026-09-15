import React from 'react';

export function AdvancedBadge() {
  return (
    <div className="inline-flex items-center px-2 py-0.5 rounded border border-[var(--glass-border)] bg-instrument shadow-[var(--shadow-subtle)]">
      <span className="text-[9px] font-mono font-medium tracking-widest uppercase text-text-technical">
        Advanced
      </span>
    </div>
  );
}
