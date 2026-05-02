import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CanvasIssueNode from './CanvasIssueNode';
import { useCanvasData } from '../hooks/useCanvasData';
import { EDGE_STYLES, getTypeColor } from '../constants';
import { RotateCw, Maximize2 } from 'lucide-react';

const nodeTypes = { issue: CanvasIssueNode };

/**
 * ReactFlow interactive graph showing issue relationships.
 * Nodes are issue cards, edges show parent/child/blocker/related links.
 */
export default function CanvasView({ projectKey }) {
  const {
    nodes: rawNodes,
    edges: rawEdges,
    setNodes: setRawNodes,
    setEdges: setRawEdges,
    epicFilter,
    setEpicFilter,
    epics,
    loading,
    error,
    refresh,
  } = useCanvasData(projectKey);

  const [selectedIssue, setSelectedIssue] = useState(null);

  // Style edges for display
  const styledEdges = useMemo(() =>
    rawEdges.map((edge) => {
      const label = (edge.label || '').toLowerCase();
      const edgeStyle = EDGE_STYLES[label] || EDGE_STYLES['relates to'] || {};
      return {
        ...edge,
        style: { ...edgeStyle, ...edge.style },
        labelStyle: { fontSize: 10, fill: 'var(--color-text-muted)' },
        labelBgStyle: { fill: 'var(--color-surface-secondary)', fillOpacity: 0.8 },
        labelBgPadding: [4, 2],
      };
    }),
  [rawEdges]);

  // Handle node dragging by applying changes to hook state directly
  const onNodesChange = useCallback(
    (changes) => setRawNodes((nds) => applyNodeChanges(changes, nds)),
    [setRawNodes],
  );
  const onEdgesChange = useCallback(
    (changes) => setRawEdges((eds) => applyEdgeChanges(changes, eds)),
    [setRawEdges],
  );

  const onNodeClick = useCallback((_event, node) => {
    setSelectedIssue(node.data);
  }, []);

  const minimapNodeColor = useCallback((node) => {
    const issueType = node.data?.issue_type;
    return getTypeColor(issueType).hex;
  }, []);

  if (loading && rawNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-content-muted">
        <RotateCw className="h-5 w-5 animate-spin mr-2" />
        Loading canvas...
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
    <div className="space-y-3">
      {/* Controls bar */}
      <div className="flex items-center gap-3">
        <select
          value={epicFilter}
          onChange={(e) => setEpicFilter(e.target.value)}
          className="rounded-md border border-edge bg-surface-input text-content px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Epics</option>
          {epics.map((epic) => (
            <option key={epic.key} value={epic.key}>
              {epic.key} - {epic.summary}
            </option>
          ))}
        </select>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <span className="text-xs text-content-muted ml-auto">
          {rawNodes.length} nodes, {styledEdges.length} edges
        </span>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex gap-4">
        <div className="flex-1 h-[600px] w-full bg-surface-secondary rounded-lg border border-edge overflow-hidden" style={{ minHeight: 600 }}>
          {rawNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-content-muted text-sm">
              No canvas data available. Try syncing issues first.
            </div>
          ) : (
            <ReactFlow
              nodes={rawNodes}
              edges={styledEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              attributionPosition="bottom-left"
            >
              <Controls />
              <MiniMap
                nodeColor={minimapNodeColor}
                nodeStrokeWidth={3}
                zoomable
                pannable
                style={{ height: 100, width: 150 }}
              />
              <Background variant="dots" gap={16} size={1} color="var(--color-border)" />
            </ReactFlow>
          )}
        </div>

        {/* Side panel: selected issue detail */}
        {selectedIssue && (
          <div className="w-72 bg-surface rounded-lg border border-edge p-4 overflow-y-auto max-h-[600px]">
            <div className="flex items-center justify-between mb-3">
              <a
                href={selectedIssue.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-primary-600 hover:underline font-medium"
              >
                {selectedIssue.key}
              </a>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-content-muted hover:text-content-secondary text-sm"
              >
                &times;
              </button>
            </div>

            <h3 className="text-sm font-medium text-content mb-3">{selectedIssue.summary}</h3>

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-content-muted">Type</dt>
                <dd className="font-medium">{selectedIssue.issue_type}</dd>
              </div>
              <div>
                <dt className="text-content-muted">Status</dt>
                <dd className="font-medium">{selectedIssue.status}</dd>
              </div>
              <div>
                <dt className="text-content-muted">Assignee</dt>
                <dd className="font-medium">{selectedIssue.assignee || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-content-muted">Priority</dt>
                <dd className="font-medium">{selectedIssue.priority || 'None'}</dd>
              </div>
              {selectedIssue.sprint && (
                <div>
                  <dt className="text-content-muted">Sprint</dt>
                  <dd className="font-medium">{selectedIssue.sprint}</dd>
                </div>
              )}
              {selectedIssue.parent_key && (
                <div>
                  <dt className="text-content-muted">Parent</dt>
                  <dd className="font-mono font-medium">{selectedIssue.parent_key}</dd>
                </div>
              )}
              {selectedIssue.days_in_status != null && (
                <div>
                  <dt className="text-content-muted">Days in Status</dt>
                  <dd className={`font-medium ${selectedIssue.days_in_status > 14 ? 'text-red-600' : ''}`}>
                    {selectedIssue.days_in_status}
                  </dd>
                </div>
              )}
              {selectedIssue.labels?.length > 0 && (
                <div>
                  <dt className="text-content-muted">Labels</dt>
                  <dd className="flex flex-wrap gap-1 mt-0.5">
                    {selectedIssue.labels.map((l) => (
                      <span key={l} className="bg-surface-secondary text-content-secondary px-1.5 py-0.5 rounded text-[10px]">
                        {l}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {selectedIssue.description_text && (
                <div>
                  <dt className="text-content-muted">Description</dt>
                  <dd className="text-content-secondary mt-0.5 whitespace-pre-wrap line-clamp-6">
                    {selectedIssue.description_text}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
