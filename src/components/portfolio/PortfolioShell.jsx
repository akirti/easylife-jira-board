import React, { useState } from 'react';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import RollupTable from './RollupTable';
import TreeExplorer from './TreeExplorer';
import { RefreshCw, Loader2, Search, ChevronLeft, ChevronRight, Table2, GitBranch } from 'lucide-react';

const VIEWS = [
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'tree', label: 'Tree', icon: GitBranch },
];

export default function PortfolioShell({ projectKey }) {
  const {
    capabilities, total, page, setPage, pageSize,
    loading, error, filters, updateFilters, refresh, hasMore,
  } = usePortfolioData(projectKey);

  const [searchInput, setSearchInput] = useState('');
  const [activeView, setActiveView] = useState('table');

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ q: searchInput });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateFilters({ q: '' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-content">Portfolio Rollup</h2>
          <p className="text-sm text-content-muted">
            {total} {total === 1 ? 'capability' : 'capabilities'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-1">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-sm border border-edge rounded-lg bg-surface-input text-content focus:outline-none focus:ring-2 focus:ring-primary-500 w-44"
                aria-label="Search capabilities"
              />
            </div>
            {filters.q && (
              <button type="button" onClick={handleClearSearch}
                      className="text-xs text-content-muted hover:text-content-secondary">
                Clear
              </button>
            )}
          </form>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-surface border border-edge text-content-secondary rounded-lg hover:bg-surface-hover disabled:opacity-50"
            aria-label="Refresh data"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-1 border-b border-edge">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-content-muted hover:text-content-secondary hover:border-edge'
            }`}
            aria-label={`Switch to ${label} view`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Content */}
      {activeView === 'table' && (
        <>
          {loading && capabilities.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-content-muted" />
            </div>
          ) : (
            <RollupTable capabilities={capabilities} />
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between text-sm text-content-secondary">
              <span>
                Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-edge hover:bg-surface-hover disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 text-sm tabular-nums text-content">
                  {page}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore}
                  className="p-1.5 rounded-lg border border-edge hover:bg-surface-hover disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeView === 'tree' && (
        <TreeExplorer projectKey={projectKey} />
      )}
    </div>
  );
}
