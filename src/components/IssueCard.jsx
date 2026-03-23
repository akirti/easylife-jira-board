import React from 'react';
import { getTypeColor, getStatusColor, PRIORITY_ICONS } from '../constants';

/**
 * Renders a single Jira issue as a compact card.
 * Color-coded by issue type, with status badge, priority, and age indicator.
 */
function IssueCard({ issue, compact = false, onClick }) {
  const typeColor = getTypeColor(issue.issue_type);
  const statusColor = getStatusColor(issue.status_category);
  const priorityIcon = PRIORITY_ICONS[issue.priority] || '';
  const isFlagged = issue.flagged;
  const daysInStatus = issue.days_in_status || 0;
  const isStale = daysInStatus > 14;

  return (
    <div
      className={`
        rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md
        ${isFlagged ? 'border-l-4 border-l-red-500' : 'border-gray-200'}
        ${onClick ? 'cursor-pointer' : ''}
        ${compact ? 'p-2' : 'p-3'}
      `}
      onClick={() => onClick?.(issue)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(issue);
        }
      }}
    >
      {/* Header: key + flagged */}
      <div className="flex items-center justify-between mb-1">
        <a
          href={issue.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {issue.key}
        </a>
        <div className="flex items-center gap-1">
          {isFlagged && <span title="Flagged" className="text-red-500 text-sm">&#x1F6A9;</span>}
          {priorityIcon && (
            <span className="text-xs" title={`Priority: ${issue.priority}`}>
              {priorityIcon}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <p className={`text-sm text-gray-900 font-medium ${compact ? 'line-clamp-1' : 'line-clamp-2'} mb-2`}>
        {issue.summary}
      </p>

      {/* Type + Status badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
          {issue.issue_type}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
          {issue.status}
        </span>
      </div>

      {/* Footer: assignee, days in status, sprint */}
      {!compact && (
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span className="truncate max-w-[120px]" title={issue.assignee || 'Unassigned'}>
            {issue.assignee || 'Unassigned'}
          </span>
          <div className="flex items-center gap-2">
            {issue.sprint && (
              <span className="truncate max-w-[80px]" title={issue.sprint}>
                {issue.sprint}
              </span>
            )}
            <span
              className={`font-medium ${isStale ? 'text-red-600' : 'text-gray-500'}`}
              title={`${daysInStatus} days in current status`}
            >
              {daysInStatus}d
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(IssueCard);
