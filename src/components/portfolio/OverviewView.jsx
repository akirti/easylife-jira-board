import React from 'react';
import { Layers, BarChart3, Hash, TrendingDown } from 'lucide-react';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import ProgressBar from './ProgressBar';
import TshirtBadge from './TshirtBadge';

function KpiCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="bg-surface rounded-lg border border-edge p-4">
      <div className="flex items-center gap-2 text-content-muted text-xs mb-1">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${accent ? 'text-amber-600' : 'text-content'}`}>
        {value}
      </div>
    </div>
  );
}

function CapCard({ cap, onExploreTree, onOpenTable }) {
  const r = cap.rollups || {};
  const cum = r.cumulative_points || 0;
  const rem = r.remaining_points || 0;
  const done = cum - rem;
  const pct = cum > 0 ? Math.round((done / cum) * 100) : 0;

  return (
    <div className="bg-surface rounded-lg border border-edge p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary-600">{cap.key}</span>
          <TshirtBadge size={cap.tshirt_size} />
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded bg-surface-secondary text-content-muted">
          {cap.status}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-content mb-3 line-clamp-2">{cap.summary}</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-content tabular-nums">{cum}</div>
          <div className="text-xs text-content-muted">Cumulative</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-amber-600 tabular-nums">{rem}</div>
          <div className="text-xs text-content-muted">Remaining</div>
        </div>
      </div>

      <ProgressBar cumulative={cum} remaining={rem} className="mb-3" />

      <div className="flex gap-2 text-xs">
        <button
          onClick={() => onExploreTree?.(cap.key)}
          className="flex-1 py-1.5 text-center text-primary-600 hover:bg-surface-hover rounded-md border border-edge transition-colors"
        >
          Explore tree
        </button>
        <button
          onClick={() => onOpenTable?.(cap.key)}
          className="flex-1 py-1.5 text-center text-content-secondary hover:bg-surface-hover rounded-md border border-edge transition-colors"
        >
          Open in table
        </button>
      </div>
    </div>
  );
}

export default function OverviewView({ projectKey, onNavigate }) {
  const { capabilities, total, loading } = usePortfolioData(projectKey);

  const totalCumulative = capabilities.reduce(
    (sum, c) => sum + (c.rollups?.cumulative_points || 0), 0
  );
  const totalRemaining = capabilities.reduce(
    (sum, c) => sum + (c.rollups?.remaining_points || 0), 0
  );
  const totalEpics = capabilities.reduce(
    (sum, c) => sum + (c.rollups?.direct_child_count || 0), 0
  );

  if (loading && capabilities.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-content-muted">
        Loading portfolio overview...
      </div>
    );
  }

  if (capabilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
          <Layers size={28} className="text-content-muted" />
        </div>
        <p className="text-content font-medium">No portfolio data yet</p>
        <p className="text-sm text-content-muted mt-1">Sync Jira data and recompute rollups to see your portfolio overview.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Band */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Layers} label="Capabilities" value={total} />
        <KpiCard icon={BarChart3} label="Total Epics" value={totalEpics} />
        <KpiCard icon={Hash} label="Cumulative Pts" value={totalCumulative} />
        <KpiCard icon={TrendingDown} label="Remaining Pts" value={totalRemaining} accent />
      </div>

      {/* Capability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capabilities.map(cap => (
          <CapCard
            key={cap.key}
            cap={cap}
            onExploreTree={(key) => onNavigate?.('tree', { selectedKey: key })}
            onOpenTable={(key) => onNavigate?.('table', { selectedKey: key })}
          />
        ))}
      </div>
    </div>
  );
}
