import React from 'react';
import { X } from 'lucide-react';
import { getTypeColor, getStatusColor } from '../../constants';
import TshirtBadge from './TshirtBadge';
import ProgressBar from './ProgressBar';

export default function TreeDetailPanel({ node, onClose }) {
  if (!node) return null;

  const typeColor = getTypeColor(node.issue_type || 'Task');
  const statusCat = node.status_category || 'To Do';
  const statusColor = getStatusColor(statusCat);

  return (
    <div className="w-80 border-l border-edge bg-surface overflow-y-auto shrink-0
                    transition-transform duration-300 ease-out">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-edge">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-primary-600">{node.key}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
              {node.issue_type || 'Issue'}
            </span>
          </div>
          <span className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
            {node.status}
          </span>
        </div>
        <button onClick={onClose}
                className="p-1 rounded-lg hover:bg-surface-hover text-content-muted shrink-0"
                aria-label="Close detail panel">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Summary */}
        <h3 className="text-sm font-semibold text-content leading-snug">{node.summary}</h3>

        {/* T-shirt size */}
        {node.tshirt_size && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-content-muted">Size:</span>
            <TshirtBadge size={node.tshirt_size} fallback={node.uses_tshirt_fallback} />
          </div>
        )}

        {/* Rollup metrics */}
        {node.rollups && (node.rollups.cumulative_points > 0 || node.rollups.remaining_points > 0) && (
          <div className="bg-surface-secondary rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-content-muted">Cumulative</span>
              <span className="font-semibold text-content tabular-nums">
                {node.rollups.cumulative_points} pts
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-content-muted">Remaining</span>
              <span className="font-semibold text-content tabular-nums">
                {node.rollups.remaining_points} pts
              </span>
            </div>
            {node.rollups.tshirt_rollup_points != null &&
             node.rollups.tshirt_rollup_points !== node.rollups.cumulative_points && (
              <div className="flex justify-between text-sm">
                <span className="text-content-muted">T-shirt adjusted</span>
                <span className="font-medium text-content-secondary tabular-nums">
                  {node.rollups.tshirt_rollup_points} pts
                </span>
              </div>
            )}
            <ProgressBar cumulative={node.rollups.cumulative_points}
                         remaining={node.rollups.remaining_points} />
          </div>
        )}

        {/* Story points (for leaf nodes) */}
        {node.story_points != null && (
          <div className="flex justify-between text-sm">
            <span className="text-content-muted">Story Points</span>
            <span className="font-medium text-content">{node.story_points}</span>
          </div>
        )}

        {/* People */}
        {node.assignee && (
          <div className="flex justify-between text-sm">
            <span className="text-content-muted">Assignee</span>
            <span className="text-content">{node.assignee}</span>
          </div>
        )}

        {/* Sprint */}
        {node.sprint && (
          <div className="flex justify-between text-sm">
            <span className="text-content-muted">Sprint</span>
            <span className="text-content">{node.sprint}</span>
          </div>
        )}

        {/* Labels */}
        {node.labels && node.labels.length > 0 && (
          <div>
            <span className="text-xs text-content-muted block mb-1">Labels</span>
            <div className="flex flex-wrap gap-1">
              {node.labels.map(l => (
                <span key={l} className="px-2 py-0.5 rounded-full text-xs bg-surface-secondary text-content-secondary">
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Child counts */}
        {node.rollups && node.rollups.direct_child_count > 0 && (
          <div className="text-xs text-content-muted pt-2 border-t border-edge">
            {node.rollups.direct_child_count} direct children
            {node.rollups.descendant_count > 0 && ` \u00b7 ${node.rollups.descendant_count} total descendants`}
          </div>
        )}
      </div>
    </div>
  );
}
