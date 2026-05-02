import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export default function TreeFilterBar({ filters, onUpdate, onClear }) {
  const hasActive = filters.search || filters.taggedMe || filters.hasComments;

  return (
    <div className="bg-surface rounded-lg border border-edge p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-content-muted shrink-0" />

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onUpdate({ search: e.target.value })}
            placeholder="Search key or summary..."
            className="pl-8 pr-3 py-1.5 text-sm border border-edge rounded-md bg-surface-input text-content w-48 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Search tree nodes"
          />
        </div>

        {/* Tagged Me toggle */}
        <label className="flex items-center gap-1.5 text-sm text-content-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.taggedMe}
            onChange={(e) => onUpdate({ taggedMe: e.target.checked })}
            className="rounded border-edge"
          />
          <span>@ Tagged me</span>
        </label>

        {/* Has Comments toggle */}
        <label className="flex items-center gap-1.5 text-sm text-content-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.hasComments}
            onChange={(e) => onUpdate({ hasComments: e.target.checked })}
            className="rounded border-edge"
          />
          <span>Has comments</span>
        </label>

        {/* Clear */}
        {hasActive && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-content-muted hover:text-content-secondary ml-auto"
            aria-label="Clear all filters"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
