import { useState, useEffect, useCallback, useRef } from 'react';
import { useJiraApi } from './useJiraApi';

/**
 * Hook that manages ReactFlow canvas nodes and edges.
 * Fetches from the jira-api canvas endpoint, supports epic filtering.
 */
export function useCanvasData(projectKey) {
  const api = useJiraApi();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [epicFilter, setEpicFilter] = useState('');
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchCanvas = useCallback(async () => {
    if (!projectKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCanvas(projectKey, epicFilter || undefined);
      if (mountedRef.current) {
        const rawNodes = data.nodes || [];
        const rawEdges = data.edges || [];
        setEpics(data.epics || []);

        // Auto-layout: position nodes hierarchically
        const positioned = autoLayout(rawNodes, rawEdges);
        setNodes(positioned);
        setEdges(rawEdges.map((e) => ({
          id: e.id || `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.label || e.relationship || '',
          type: 'smoothstep',
          animated: e.animated || false,
          style: e.style || {},
          data: e.data || {},
        })));
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setNodes([]);
        setEdges([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [api, projectKey, epicFilter]);

  useEffect(() => {
    fetchCanvas();
  }, [fetchCanvas]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    epicFilter,
    setEpicFilter,
    epics,
    loading,
    error,
    refresh: fetchCanvas,
  };
}

/**
 * Simple hierarchical auto-layout.
 * Places parent nodes at top, children below in rows.
 */
function autoLayout(rawNodes, rawEdges) {
  const NODE_WIDTH = 280;
  const NODE_HEIGHT = 120;
  const H_GAP = 40;
  const V_GAP = 60;

  // Build adjacency: parent -> children
  const childMap = new Map();
  const hasParent = new Set();

  for (const edge of rawEdges) {
    const rel = (edge.label || edge.relationship || '').toLowerCase();
    if (rel === 'parent of' || rel === 'is child of') {
      const parentId = rel === 'parent of' ? edge.source : edge.target;
      const childId = rel === 'parent of' ? edge.target : edge.source;
      if (!childMap.has(parentId)) childMap.set(parentId, []);
      childMap.get(parentId).push(childId);
      hasParent.add(childId);
    }
  }

  // Roots are nodes without a parent
  const roots = rawNodes.filter((n) => !hasParent.has(n.id));
  const visited = new Set();
  const positions = new Map();

  let currentX = 0;

  function layoutSubtree(nodeId, depth) {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const children = childMap.get(nodeId) || [];
    if (children.length === 0) {
      positions.set(nodeId, { x: currentX, y: depth * (NODE_HEIGHT + V_GAP) });
      currentX += NODE_WIDTH + H_GAP;
      return 1;
    }

    const startX = currentX;
    let count = 0;
    for (const childId of children) {
      count += layoutSubtree(childId, depth + 1);
    }
    const endX = currentX - H_GAP;
    const midX = (startX + endX) / 2;
    positions.set(nodeId, { x: midX - NODE_WIDTH / 2, y: depth * (NODE_HEIGHT + V_GAP) });
    return count;
  }

  // Layout each root and its subtree
  for (const root of roots) {
    layoutSubtree(root.id, 0);
  }

  // Layout any orphans not yet visited
  for (const node of rawNodes) {
    if (!visited.has(node.id)) {
      positions.set(node.id, { x: currentX, y: 0 });
      currentX += NODE_WIDTH + H_GAP;
    }
  }

  return rawNodes.map((n) => ({
    id: n.id,
    type: 'issue',
    position: positions.get(n.id) || { x: 0, y: 0 },
    data: n.data || n,
    draggable: true,
  }));
}
