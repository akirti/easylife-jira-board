import React from 'react';

/**
 * Dashboard stats cards row.
 * Shows: Total Issues, By Status breakdown, Blockers, Overdue count.
 */
function StatsHeader({ stats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface rounded-lg border border-edge p-4 animate-pulse">
            <div className="h-4 bg-surface-secondary rounded w-20 mb-2" />
            <div className="h-8 bg-surface-secondary rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  // API returns arrays of {status, count} / {issue_type, count} objects
  const byStatusRaw = stats.by_status || [];
  const byStatus = Array.isArray(byStatusRaw)
    ? Object.fromEntries(byStatusRaw.map((s) => [s.status || s._id || 'Unknown', s.count]))
    : byStatusRaw;
  const byTypeRaw = stats.by_type || [];
  const byType = Array.isArray(byTypeRaw)
    ? Object.fromEntries(byTypeRaw.map((t) => [t.issue_type || t._id || 'Unknown', t.count]))
    : byTypeRaw;
  const blockers = stats.blockers || 0;
  const overdue = stats.overdue || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Issues */}
      <div className="bg-surface rounded-lg border border-edge p-4">
        <p className="text-sm font-medium text-content-muted">Total Issues</p>
        <p className="text-2xl font-bold text-content mt-1">{stats.total || 0}</p>
        {Object.keys(byType).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(byType).slice(0, 4).map(([type, count]) => (
              <span key={type} className="text-xs text-content-muted">
                {type}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* By Status */}
      <div className="bg-surface rounded-lg border border-edge p-4">
        <p className="text-sm font-medium text-content-muted">By Status</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(byStatus).map(([status, count]) => {
            let badgeClass = 'bg-slate-100 text-slate-700';
            const lower = (status || '').toLowerCase();
            if (lower.includes('progress') || lower.includes('review')) {
              badgeClass = 'bg-blue-100 text-blue-700';
            } else if (lower === 'done' || lower.includes('closed') || lower.includes('resolved')) {
              badgeClass = 'bg-green-100 text-green-700';
            }
            return (
              <span key={status} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                {status}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Blockers */}
      <div className={`rounded-lg border p-4 ${blockers > 0 ? 'bg-red-50 border-red-200' : 'bg-surface border-edge'}`}>
        <p className="text-sm font-medium text-content-muted">Blockers</p>
        <p className={`text-2xl font-bold mt-1 ${blockers > 0 ? 'text-red-600' : 'text-content'}`}>
          {blockers}
        </p>
        {blockers > 0 && (
          <p className="text-xs text-red-500 mt-1">Issues flagged or blocking</p>
        )}
      </div>

      {/* Overdue */}
      <div className={`rounded-lg border p-4 ${overdue > 0 ? 'bg-amber-50 border-amber-200' : 'bg-surface border-edge'}`}>
        <p className="text-sm font-medium text-content-muted">Overdue</p>
        <p className={`text-2xl font-bold mt-1 ${overdue > 0 ? 'text-amber-600' : 'text-content'}`}>
          {overdue}
        </p>
        {overdue > 0 && (
          <p className="text-xs text-amber-500 mt-1">Past due date, unresolved</p>
        )}
      </div>
    </div>
  );
}

export default React.memo(StatsHeader);
