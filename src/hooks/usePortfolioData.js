import { useState, useEffect, useCallback } from 'react';
import { useJiraApi } from './useJiraApi';

export function usePortfolioData(projectKey) {
  const api = useJiraApi();
  const [capabilities, setCapabilities] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', q: '' });

  const fetchCapabilities = useCallback(async () => {
    if (!projectKey) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getCapabilities(projectKey, {
        page,
        page_size: pageSize,
        ...(filters.status && { status: filters.status }),
        ...(filters.q && { q: filters.q }),
      });
      setCapabilities(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load capabilities');
      setCapabilities([]);
    } finally {
      setLoading(false);
    }
  }, [api, projectKey, page, pageSize, filters]);

  useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  return {
    capabilities, total, page, setPage, pageSize,
    loading, error, filters, updateFilters,
    refresh: fetchCapabilities,
    hasMore: (page * pageSize) < total,
  };
}
