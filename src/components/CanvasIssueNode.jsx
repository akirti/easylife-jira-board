import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getTypeColor, getStatusColor, PRIORITY_ICONS } from '../constants';

/**
 * Custom ReactFlow node that renders a mini issue card.
 * Registered as nodeTypes={{ issue: CanvasIssueNode }} in CanvasView.
 */
function CanvasIssueNode({ data, selected }) {
  const issue = data;
  const typeColor = getTypeColor(issue.issue_type);
  const statusColor = getStatusColor(issue.status_category);
  const priorityIcon = PRIORITY_ICONS[issue.priority] || '';

  return (
    <div
      className={`
        rounded-lg border bg-surface shadow-sm w-[260px]
        ${selected ? 'ring-2 ring-primary-500 shadow-lg' : ''}
        ${issue.flagged ? 'border-l-4 border-l-red-500' : 'border-edge'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-content-muted !w-2 !h-2" />

      <div className="p-2.5">
        {/* Key + Priority */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs text-primary-600 font-medium">{issue.key}</span>
          <div className="flex items-center gap-1">
            {issue.flagged && <span className="text-red-500 text-xs">&#x1F6A9;</span>}
            {priorityIcon && <span className="text-xs">{priorityIcon}</span>}
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-content font-medium line-clamp-2 mb-1.5 leading-tight">
          {issue.summary}
        </p>

        {/* Type + Status */}
        <div className="flex items-center gap-1">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColor.bg} ${typeColor.text}`}>
            {issue.issue_type}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor.bg} ${statusColor.text}`}>
            {issue.status}
          </span>
        </div>

        {/* Assignee */}
        {issue.assignee && (
          <p className="text-[10px] text-content-muted mt-1 truncate">{issue.assignee}</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-content-muted !w-2 !h-2" />
    </div>
  );
}

export default memo(CanvasIssueNode);
