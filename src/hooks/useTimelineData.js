import { useState, useEffect, useCallback, useRef } from 'react';
import { useJiraApi } from './useJiraApi';

/**
 * Hook that manages timeline (Gantt) data.
 * Fetches timeline entries with optional filters.
 */
export function useTimelineData(projectKey) {
  const api = useJiraApi();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    assignee: '',
    issue_type: '',
    sprint: '',
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchTimeline = useCallback(async () => {
    if (!projectKey) return;
    setLoading(true);
    setError(null);
    try {
      const params = { project_key: projectKey };
      if (filters.assignee) params.assignee = filters.assignee;
      if (filters.issue_type) params.issue_type = filters.issue_type;
      if (filters.sprint) params.sprint = filters.sprint;

      const data = await api.getTimeline(params);
      if (mountedRef.current) {
        setEntries(data.entries || data || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setEntries([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [api, projectKey, filters]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    entries,
    loading,
    error,
    filters,
    updateFilters,
    refresh: fetchTimeline,
  };
}
