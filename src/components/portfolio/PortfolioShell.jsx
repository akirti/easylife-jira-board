import React, { useState, useCallback } from 'react';
import { LayoutGrid, GitBranch, Table2, RefreshCw, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import OverviewView from './OverviewView';
import TreeExplorer from './TreeExplorer';
import RollupTable from './RollupTable';

const VIEWS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'tree', label: 'Tree', icon: GitBranch },
  { id: 'table', label: 'Table', icon: Table2 },
];

export default function PortfolioShell({ projectKey }) {
  const [activeView, setActiveView] = useState('overview');
  const [selectedKey, setSelectedKey] = useState(null);
  const portfolio = usePortfolioData(projectKey);
  const [searchInput, setSearchInput] = useState('');

  const navigateTo = useCallback((view, opts = {}) => {
    if (opts.selectedKey) setSelectedKey(opts.selectedKey);
    setActiveView(view);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    portfolio.updateFilters({ q: searchInput });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    portfolio.updateFilters({ q: '' });
  };

  return (
    <div className="space-y-4">
      {/* Header with view switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-content">Portfolio Rollup</h2>
            <p className="text-sm text-content-muted">
              {portfolio.total} {portfolio.total === 1 ? 'capability' : 'capabilities'}
            </p>
          </div>

          {/* View switcher */}
          <div className="flex items-center border border-edge rounded-lg overflow-hidden">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors
                  ${activeView === id
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface text-content-secondary hover:bg-surface-hover'
                  }`}
                aria-label={`${label} view`}
                aria-pressed={activeView === id}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Refresh (only for table view) */}
        {activeView === 'table' && (
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
              {portfolio.filters.q && (
                <button type="button" onClick={handleClearSearch}
                        className="text-xs text-content-muted hover:text-content-secondary">
                  Clear
                </button>
              )}
            </form>
            <button
              onClick={portfolio.refresh}
              disabled={portfolio.loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-surface border border-edge text-content-secondary rounded-lg hover:bg-surface-hover disabled:opacity-50"
              aria-label="Refresh data"
            >
              {portfolio.loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {portfolio.error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg" role="alert">
          {portfolio.error}
        </div>
      )}

      {/* View content with crossfade */}
      <div className="relative min-h-[400px]">
        <div
          className={`transition-opacity duration-200 ${activeView === 'overview' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}
        >
          {activeView === 'overview' && (
            <OverviewView projectKey={projectKey} onNavigate={navigateTo} />
          )}
        </div>

        <div
          className={`transition-opacity duration-200 ${activeView === 'tree' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}
        >
          {activeView === 'tree' && (
            <TreeExplorer projectKey={projectKey} selectedKey={selectedKey} />
          )}
        </div>

        <div
          className={`transition-opacity duration-200 ${activeView === 'table' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}
        >
          {activeView === 'table' && (
            <>
              {portfolio.loading && portfolio.capabilities.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-content-muted" />
                </div>
              ) : (
                <RollupTable capabilities={portfolio.capabilities} />
              )}

              {portfolio.total > portfolio.pageSize && (
                <div className="flex items-center justify-between text-sm text-content-secondary mt-4">
                  <span>
                    Showing {(portfolio.page - 1) * portfolio.pageSize + 1}–
                    {Math.min(portfolio.page * portfolio.pageSize, portfolio.total)} of {portfolio.total}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => portfolio.setPage(portfolio.page - 1)}
                            disabled={portfolio.page <= 1}
                            className="p-1.5 rounded-lg border border-edge hover:bg-surface-hover disabled:opacity-40"
                            aria-label="Previous page">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1 text-sm tabular-nums text-content">{portfolio.page}</span>
                    <button onClick={() => portfolio.setPage(portfolio.page + 1)}
                            disabled={!portfolio.hasMore}
                            className="p-1.5 rounded-lg border border-edge hover:bg-surface-hover disabled:opacity-40"
                            aria-label="Next page">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
