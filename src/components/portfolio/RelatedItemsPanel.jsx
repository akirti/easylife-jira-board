import React from 'react';
import { getTypeColor } from '../../constants';

function RelatedSection({ title, items, showLinkType = false }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3 last:mb-0">
      <h4 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-1.5">
        {title} ({items.length})
      </h4>
      <div className="space-y-1">
        {items.map((item, i) => {
          const typeColor = getTypeColor(item.issue_type || 'Task');
          return (
            <div key={item.key || i}
                 className="flex items-center gap-2 py-1 px-2 rounded text-sm hover:bg-surface-hover transition-colors">
              <span className="font-mono text-xs text-primary-600 shrink-0">{item.key}</span>
              {showLinkType && item.link_type && (
                <span className="text-[10px] text-content-muted shrink-0">
                  {item.direction === 'outward' ? '\u2192' : '\u2190'} {item.link_type}
                </span>
              )}
              <span className="text-xs text-content truncate">{item.summary || ''}</span>
              {item.status && (
                <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColor.bg} ${typeColor.text}`}>
                  {item.status}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RelatedItemsPanel({ subtasks, links, tests, loading }) {
  const hasContent = (subtasks?.length > 0) || (links?.length > 0) || (tests?.length > 0);

  if (loading) {
    return (
      <div className="border-l-2 border-primary-200 pl-3 ml-16 my-1">
        <span className="text-xs text-content-muted">Loading related items...</span>
      </div>
    );
  }

  if (!hasContent) return null;

  return (
    <tr>
      <td colSpan={7} className="p-0">
        <div className="border-l-2 border-primary-200 bg-surface-secondary/50 pl-4 pr-3 py-2 ml-16 my-1 rounded-r">
          <RelatedSection title="Subtasks" items={subtasks} />
          <RelatedSection title="Linked Issues" items={links} showLinkType />
          <RelatedSection title="Test Cases" items={tests} showLinkType />
        </div>
      </td>
    </tr>
  );
}
