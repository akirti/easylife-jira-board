import React from 'react';
import { CYCLE_COLORS } from '../../constants';

export default function CycleTimeBar({ devDays = 0, qaDays = 0, stageDays = 0, prodDays = 0, className = '' }) {
  const total = devDays + qaDays + stageDays + prodDays;
  if (total === 0) return <span className="text-xs text-content-muted">&mdash;</span>;

  const segments = [
    { key: 'dev', value: devDays, ...CYCLE_COLORS.dev },
    { key: 'qa', value: qaDays, ...CYCLE_COLORS.qa },
    { key: 'stage', value: stageDays, ...CYCLE_COLORS.stage },
    { key: 'prod', value: prodDays, ...CYCLE_COLORS.prod },
  ].filter(s => s.value > 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}
         title={`Dev: ${devDays.toFixed(1)}d | QA: ${qaDays.toFixed(1)}d | Stage: ${stageDays.toFixed(1)}d | Prod: ${prodDays.toFixed(1)}d`}>
      <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden flex">
        {segments.map(s => (
          <div
            key={s.key}
            className={`h-full ${s.bg} first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${(s.value / total) * 100}%` }}
          />
        ))}
      </div>
      <span className="text-xs text-content-muted tabular-nums w-10 text-right">
        {total.toFixed(0)}d
      </span>
    </div>
  );
}
