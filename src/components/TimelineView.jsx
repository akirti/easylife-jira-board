import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTimelineData } from '../hooks/useTimelineData';
import { getTypeColor } from '../constants';
import { RotateCw, Filter } from 'lucide-react';

const ISSUE_TYPES = ['Epic', 'Story', 'Bug', 'Task', 'Technical Story', 'Technical Task', 'Spike', 'Sub-task'];

/**
 * Gantt-style timeline view using recharts horizontal BarChart.
 * Each bar represents an issue's duration from start to end/due date.
 */
export default function TimelineView({ projectKey }) {
  const {
    entries,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
  } = useTimelineData(projectKey);

  // Transform entries for recharts
  const { chartData, minDate, maxDate } = useMemo(() => {
    if (!entries.length) return { chartData: [], minDate: 0, maxDate: 0 };

    const now = Date.now();
    let earliest = Infinity;
    let latest = -Infinity;

    const data = entries.filter((e) => e && e.key).map((entry) => {
      const start = entry.start ? new Date(entry.start).getTime() : now;
      const end = entry.end ? new Date(entry.end).getTime() : now;
      const dueDate = entry.due_date ? new Date(entry.due_date).getTime() : null;
      const isOverdue = entry.overdue || (dueDate && dueDate < now && !entry.resolution_date);

      earliest = Math.min(earliest, start);
      latest = Math.max(latest, end);

      return {
        key: entry.key,
        summary: entry.summary ? (entry.summary.length > 40 ? entry.summary.slice(0, 40) + '...' : entry.summary) : entry.key,
        issue_type: entry.issue_type || 'Task',
        status: entry.status || '',
        assignee: entry.assignee || 'Unassigned',
        start,
        end,
        duration: [start, end],
        overdue: isOverdue,
        fullSummary: entry.summary || entry.key,
      };
    });

    return {
      chartData: data.slice(0, 50), // Limit to 50 for readability
      minDate: earliest,
      maxDate: latest,
    };
  }, [entries]);

  const formatDate = (tick) => {
    if (!tick) return '';
    const d = new Date(tick);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
        <p className="font-mono text-xs text-blue-600 font-medium">{item.key}</p>
        <p className="text-sm text-gray-900 mt-1">{item.fullSummary}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
          <span>Type: <strong>{item.issue_type}</strong></span>
          <span>Status: <strong>{item.status}</strong></span>
          <span>Assignee: <strong>{item.assignee}</strong></span>
          <span>
            Start: <strong>{new Date(item.start).toLocaleDateString()}</strong>
          </span>
          <span>
            End: <strong>{new Date(item.end).toLocaleDateString()}</strong>
          </span>
          {item.overdue && (
            <span className="text-red-600 font-medium col-span-2">Overdue</span>
          )}
        </div>
      </div>
    );
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <RotateCw className="h-5 w-5 animate-spin mr-2" />
        Loading timeline...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />

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

          <button
            onClick={refresh}
            disabled={loading}
            className="ml-auto flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <span className="text-xs text-gray-400">
            {entries.length} entries{entries.length > 50 ? ' (showing first 50)' : ''}
          </span>
        </div>
      </div>

      {/* Timeline Chart */}
      {chartData.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
          No timeline data available. Issues need start dates to appear here.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 36 + 60)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[minDate, maxDate]}
                tickFormatter={formatDate}
                scale="time"
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="key"
                width={110}
                fontSize={11}
                tick={{ fill: '#374151' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="duration" minPointSize={4} radius={[3, 3, 3, 3]}>
                {chartData.map((entry, index) => {
                  const color = getTypeColor(entry.issue_type).hex;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={color}
                      stroke={entry.overdue ? '#dc2626' : 'none'}
                      strokeWidth={entry.overdue ? 2 : 0}
                      fillOpacity={0.8}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100">
            {Object.entries(
              chartData.reduce((acc, d) => {
                if (!acc[d.issue_type]) acc[d.issue_type] = true;
                return acc;
              }, {})
            ).map(([type]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getTypeColor(type).hex }}
                />
                <span className="text-xs text-gray-600">{type}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-3 h-3 rounded-sm border-2 border-red-500 bg-transparent" />
              <span className="text-xs text-gray-600">Overdue</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
