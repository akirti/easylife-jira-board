import React from 'react';

export default function ProgressBar({ cumulative, remaining, className = '' }) {
  if (!cumulative || cumulative === 0) return null;
  const done = cumulative - remaining;
  const pct = Math.round((done / cumulative) * 100);
  return (
    <div className={`flex items-center gap-2 ${className}`} role="progressbar"
         aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
         aria-label={`${pct}% complete`}>
      <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-content-muted tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}
