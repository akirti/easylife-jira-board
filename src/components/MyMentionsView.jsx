import React, { useState, useEffect, useCallback } from 'react';
import { useJiraApi } from '../hooks/useJiraApi';
import { getTypeColor, getStatusColor } from '../constants';
import { RotateCw, MessageCircle } from 'lucide-react';

/**
 * Shows issues where the current user is mentioned in comments.
 * Uses the /dashboard/my-mentions endpoint.
 */
export default function MyMentionsView() {
  const api = useJiraApi();
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMentions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyMentions();
      setMentions(data.issues || data || []);
    } catch (err) {
      setError(err.message);
      setMentions([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchMentions();
  }, [fetchMentions]);

  if (loading && mentions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <RotateCw className="h-5 w-5 animate-spin mr-2" />
        Loading mentions...
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
          <MessageCircle className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">
            {mentions.length} issue{mentions.length !== 1 ? 's' : ''} mentioning you
          </h3>
        </div>
        <button
          onClick={fetchMentions}
          disabled={loading}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {mentions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
          No mentions found. You will see issues here when someone tags you in a comment.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mentions.map((issue) => {
                const typeColor = getTypeColor(issue.issue_type);
                const statusColor = getStatusColor(issue.status_category);
                return (
                  <tr key={issue.key} className="hover:bg-gray-50">
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
                      <span className="text-sm text-gray-900 line-clamp-1 max-w-sm block">
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {issue.assignee || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {issue.updated ? new Date(issue.updated).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
