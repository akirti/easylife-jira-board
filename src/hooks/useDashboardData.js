import { useState, useEffect, useCallback, useRef } from 'react';
import { useJiraApi } from './useJiraApi';

const DEFAULT_FILTERS = {
  status: '',
  issue_type: '',
  assignee: '',
  flagged: false,
  overdue: false,
  sprint: '',
};

/**
 * Hook that manages dashboard stats and paginated issue list.
 * Fetches from the jira-api on mount and whenever filters or page change.
 */
export function useDashboardData(projectKey) {
  const api = useJiraApi();
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!projectKey) return;
    try {
      const data = await api.getStats(projectKey);
      if (mountedRef.current) setStats(data);
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    }
  }, [api, projectKey]);

  // Fetch issues with current filters + pagination
  const fetchIssues = useCallback(async () => {
    if (!projectKey) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        project_key: projectKey,
        page,
        page_size: pageSize,
      };
      if (filters.status) params.status = filters.status;
      if (filters.issue_type) params.issue_type = filters.issue_type;
      if (filters.assignee) params.assignee = filters.assignee;
      if (filters.flagged) params.flagged = true;
      if (filters.overdue) params.overdue = true;
      if (filters.sprint) params.sprint = filters.sprint;

      const data = await api.getIssues(params);
      if (mountedRef.current) {
        setIssues(data.items || data.issues || []);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setIssues([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [api, projectKey, page, pageSize, filters]);

  // Fetch on mount and when deps change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Reset page when filters change
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    fetchStats();
    fetchIssues();
  }, [fetchStats, fetchIssues]);

  return {
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
  };
}
