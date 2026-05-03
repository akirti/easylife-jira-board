import React, { useState, useCallback } from 'react';
import { LayoutGrid, GitBranch, Table2, RefreshCw, Loader2, Search, ChevronLeft, ChevronRight, RotateCw, Camera, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useJiraApi } from '../../hooks/useJiraApi';
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
  const api = useJiraApi();
  const [activeView, setActiveView] = useState('overview');
  const [selectedKey, setSelectedKey] = useState(null);
  const portfolio = usePortfolioData(projectKey);
  const [searchInput, setSearchInput] = useState('');

  // Action states
  const [recomputing, setRecomputing] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

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

  // Recompute rollups
  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const result = await api.triggerRecompute(projectKey);
      showFeedback('success',
        `Recomputed: ${result.capabilities_computed} caps, ${result.epics_computed} epics, ${result.stories_processed} stories`
      );
      portfolio.refresh();
    } catch (err) {
      showFeedback('error', `Recompute failed: ${err.message}`);
    } finally {
      setRecomputing(false);
    }
  };

  // Take weekly snapshot
  const handleSnapshot = async () => {
    setSnapshotting(true);
    try {
      const result = await api.runSnapshot(projectKey);
      if (result.skipped) {
        showFeedback('success', `Snapshot already exists for week ${result.snapshot_week}`);
      } else {
        showFeedback('success',
          `Snapshot taken: ${result.entities_snapshotted} entities for week ${result.snapshot_week}`
        );
      }
    } catch (err) {
      showFeedback('error', `Snapshot failed: ${err.message}`);
    } finally {
      setSnapshotting(false);
    }
  };

  // Export DOCX
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.exportPortfolio({
        project_key: projectKey,
        view: 'progress',
        filter: 'all',
        format: 'docx',
      });
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-rollup-${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showFeedback('success', 'DOCX exported successfully');
    } catch (err) {
      showFeedback('error', `Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with view switcher + actions */}
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

        {/* Action buttons — always visible */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search (table view only) */}
          {activeView === 'table' && (
            <form onSubmit={handleSearch} className="flex items-center gap-1">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 text-sm border border-edge rounded-lg bg-surface-input text-content focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
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
          )}

          {/* Refresh */}
          <button
            onClick={portfolio.refresh}
            disabled={portfolio.loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-surface border border-edge text-content-secondary rounded-lg hover:bg-surface-hover disabled:opacity-50"
            aria-label="Refresh data"
            title="Refresh data from database"
          >
            {portfolio.loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>

          {/* Recompute */}
          <button
            onClick={handleRecompute}
            disabled={recomputing || !projectKey}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-surface border border-edge text-content-secondary rounded-lg hover:bg-surface-hover disabled:opacity-50"
            aria-label="Recompute rollups"
            title="Recompute rollups from synced Jira data"
          >
            {recomputing ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
            Recompute
          </button>

          {/* Snapshot */}
          <button
            onClick={handleSnapshot}
            disabled={snapshotting || !projectKey}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-surface border border-edge text-content-secondary rounded-lg hover:bg-surface-hover disabled:opacity-50"
            aria-label="Take weekly snapshot"
            title="Save current rollup values as a weekly snapshot for trend tracking"
          >
            {snapshotting ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            Snapshot
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting || !projectKey}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            aria-label="Export as DOCX"
            title="Download portfolio rollup as Word document"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export
          </button>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-opacity duration-300
          ${feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
          }`}
          role="status"
        >
          {feedback.type === 'success'
            ? <CheckCircle size={16} className="shrink-0" />
            : <AlertCircle size={16} className="shrink-0" />
          }
          {feedback.message}
        </div>
      )}

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
