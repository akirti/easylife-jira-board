import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useJiraApi } from '../hooks/useJiraApi';
import { getTypeColor } from '../constants';
import { RotateCw, LayoutGrid } from 'lucide-react';

/**
 * Shows user's board memberships with task count breakdown by type.
 * Each board is a card with a mini pie chart of issue types.
 */
export default function BoardsView() {
  const api = useJiraApi();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBoards();
      setBoards(data.boards || data || []);
    } catch (err) {
      setError(err.message);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  if (loading && boards.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-content-muted">
        <RotateCw className="h-5 w-5 animate-spin mr-2" />
        Loading boards...
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-content-muted" />
          <h3 className="text-sm font-medium text-content-secondary">
            {boards.length} board{boards.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <button
          onClick={fetchBoards}
          disabled={loading}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="bg-surface rounded-lg border border-edge p-8 text-center text-sm text-content-muted">
          No boards found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <BoardCard key={board.board_id || board.name} board={board} />
          ))}
        </div>
      )}
    </div>
  );
}

function BoardCard({ board }) {
  // API returns task_counts as [{issue_type, count}] array
  const rawCounts = board.task_counts || [];
  const taskCounts = Array.isArray(rawCounts)
    ? Object.fromEntries(rawCounts.map((t) => [t.issue_type || t.name, t.count || t.value || 0]))
    : rawCounts;
  const total = board.total || Object.values(taskCounts).reduce((sum, c) => sum + c, 0);

  const pieData = Object.entries(taskCounts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      name: type,
      value: count,
      color: getTypeColor(type).hex,
    }));

  return (
    <div className="bg-surface rounded-lg border border-edge p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-content text-sm">{board.board_name || board.name}</h4>
          {board.project_key && (
            <p className="text-xs text-content-muted mt-0.5">{board.project_key}</p>
          )}
        </div>
        <span className="text-lg font-bold text-content-secondary">{total}</span>
      </div>

      {pieData.length > 0 ? (
        <div className="flex items-center gap-3">
          <div className="w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={35}
                  innerRadius={15}
                  strokeWidth={1}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} issues`, name]}
                  contentStyle={{ fontSize: 11, borderRadius: 6 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-content-secondary">{item.name}</span>
                </div>
                <span className="font-medium text-content-secondary">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-content-muted">No issues</p>
      )}
    </div>
  );
}
