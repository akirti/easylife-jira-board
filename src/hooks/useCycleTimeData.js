import { useState, useCallback } from 'react';
import { useJiraApi } from './useJiraApi';

export function useCycleTimeData() {
  const api = useJiraApi();
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchCycleMetrics = useCallback(async (issueKey) => {
    if (cache[issueKey]) return cache[issueKey];

    setLoading(true);
    try {
      const result = await api.getCycleMetrics(issueKey);
      setCache(prev => ({ ...prev, [issueKey]: result }));
      return result;
    } catch {
      return { dev_days: 0, qa_days: 0, stage_days: 0, prod_days: 0, total_days: 0 };
    } finally {
      setLoading(false);
    }
  }, [api, cache]);

  return { fetchCycleMetrics, cache, loading };
}
