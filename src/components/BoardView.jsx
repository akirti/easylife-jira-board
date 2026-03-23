import React, { useMemo } from 'react';
import StatsHeader from './StatsHeader';
import { getTypeColor, getStatusColor, PRIORITY_ICONS } from '../constants';
import { useDashboardData } from '../hooks/useDashboardData';
import { ChevronLeft, ChevronRight, RotateCw, Filter, X } from 'lucide-react';

const ISSUE_TYPES = ['Epic', 'Story', 'Bug', 'Task', 'Technical Story', 'Technical Task', 'Spike', 'Sub-task'];
const STATUS_OPTIONS = ['To Do', 'In Progress', 'In Review', 'Done', 'Closed'];

/**
 * Board view: stats header + filter bar + paginated table of issues.
 */
export default function BoardView({ projectKey }) {
  const {
    stats,
    issues,
    totalCount,
    page,
    pageSize,
    setPage,
    filters,
    updateFilters,
    resetFilters,
    loading,
    error,
    refresh,
  } = useDashboardData(projectKey);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);
  const hasActiveFilters = filters.status || filters.issue_type || filters.assignee || filters.flagged || filters.overdue;

  return (
    <div className="space-y-4">
      <StatsHeader stats={stats} />

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />

          <select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filters.issue_type}
            onChange={(e) => updateFilters({ issue_type: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {ISSUE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Assignee..."
            value={filters.assignee}
            onChange={(e) => updateFilters({ assignee: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.flagged}
              onChange={(e) => updateFilters({ flagged: e.target.checked })}
              className="rounded border-gray-300"
            />
            Flagged
          </label>

          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={(e) => updateFilters({ overdue: e.target.checked })}
              className="rounded border-gray-300"
            />
            Overdue
          </label>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}

          <button
            onClick={refresh}
            disabled={loading}
            className="ml-auto flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Issues Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sprint</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">Flag</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && issues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                    Loading issues...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                    No issues found
                  </td>
                </tr>
              ) : (
                issues.map((issue) => {
                  const typeColor = getTypeColor(issue.issue_type);
                  const statusColor = getStatusColor(issue.status_category);
                  const daysInStatus = issue.days_in_status || 0;
                  const isStale = daysInStatus > 14;

                  return (
                    <tr
                      key={issue.key}
                      className={`hover:bg-gray-50 ${issue.flagged ? 'border-l-4 border-l-red-500' : ''}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a
                          href={issue.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-blue-600 hover:underline"
                        >
                          {issue.key}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 line-clamp-1 max-w-xs block">
                          {issue.summary}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                          {issue.issue_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 truncate max-w-[120px]">
                        {issue.assignee || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span title={issue.priority || 'None'}>
                          {PRIORITY_ICONS[issue.priority] || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-medium ${isStale ? 'text-red-600' : 'text-gray-500'}`}>
                          {daysInStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 truncate max-w-[100px]">
                        {issue.sprint || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {issue.flagged ? <span className="text-red-500">&#x1F6A9;</span> : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
