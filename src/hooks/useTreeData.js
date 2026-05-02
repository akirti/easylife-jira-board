import { useState, useEffect, useCallback } from 'react';
import { useJiraApi } from './useJiraApi';

export function useTreeData(projectKey) {
  const api = useJiraApi();
  const [capabilities, setCapabilities] = useState([]);
  const [trees, setTrees] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filters, setFilters] = useState({
    search: '', teams: [], labels: [], assignees: [],
    taggedMe: false, hasComments: false,
  });

  // Fetch capability list
  const fetchCapabilities = useCallback(async () => {
    if (!projectKey) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getCapabilities(projectKey, { page_size: 100 });
      setCapabilities(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load capabilities');
    } finally {
      setLoading(false);
    }
  }, [api, projectKey]);

  useEffect(() => { fetchCapabilities(); }, [fetchCapabilities]);

  // Fetch tree for a specific capability
  const fetchTree = useCallback(async (capKey) => {
    if (trees[capKey]) return trees[capKey];
    try {
      const result = await api.getCapabilityTree(capKey);
      setTrees(prev => ({ ...prev, [capKey]: result }));
      return result;
    } catch {
      return null;
    }
  }, [api, trees]);

  // Fetch all trees for building the full D3 visualization
  const fetchAllTrees = useCallback(async () => {
    if (capabilities.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        capabilities.map(cap =>
          api.getCapabilityTree(cap.key).catch(() => ({ ...cap, epics: [] }))
        )
      );
      const treeMap = {};
      results.forEach(t => { if (t && t.key) treeMap[t.key] = t; });
      setTrees(treeMap);
    } catch {
      // partial failure OK
    } finally {
      setLoading(false);
    }
  }, [api, capabilities]);

  useEffect(() => { fetchAllTrees(); }, [fetchAllTrees]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', teams: [], labels: [], assignees: [],
                 taggedMe: false, hasComments: false });
  }, []);

  // Filter pruning: determine which nodes match and which are context-only
  const matchesFilter = useCallback((node) => {
    const f = filters;
    const hasActiveFilter = f.search || f.teams.length || f.labels.length ||
                            f.assignees.length || f.taggedMe || f.hasComments;
    if (!hasActiveFilter) return true;

    if (f.search) {
      const q = f.search.toLowerCase();
      const inKey = (node.key || '').toLowerCase().includes(q);
      const inSummary = (node.summary || '').toLowerCase().includes(q);
      if (!inKey && !inSummary) return false;
    }
    if (f.assignees.length && !f.assignees.includes(node.assignee)) return false;
    if (f.teams.length && !f.teams.includes(node.team)) return false;
    if (f.labels.length && !(node.labels || []).some(l => f.labels.includes(l))) return false;
    return true;
  }, [filters]);

  return {
    capabilities, trees, loading, error,
    selectedKey, setSelectedKey,
    selectedNode, setSelectedNode,
    filters, updateFilters, clearFilters,
    fetchTree, matchesFilter,
    refresh: fetchCapabilities,
  };
}
