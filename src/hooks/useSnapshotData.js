import { useState, useCallback } from 'react';
import { useJiraApi } from './useJiraApi';

export function useSnapshotData() {
  const api = useJiraApi();
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchSeries = useCallback(async (entityKey, metric = 'remaining') => {
    const cacheKey = `${entityKey}:${metric}`;
    if (cache[cacheKey]) return cache[cacheKey];

    setLoading(true);
    try {
      const result = await api.getSnapshotSeries(entityKey, metric);
      const series = result.series || [];
      setCache(prev => ({ ...prev, [cacheKey]: series }));
      return series;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [api, cache]);

  const clearCache = useCallback(() => setCache({}), []);

  return { fetchSeries, cache, loading, clearCache };
}
