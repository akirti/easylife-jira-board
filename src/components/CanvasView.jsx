import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
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
    epicFilter,
    setEpicFilter,
    epics,
    loading,
    error,
    refresh,
  } = useCanvasData(projectKey);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Sync hook data into ReactFlow state when it changes
  React.useEffect(() => {
    if (rawNodes.length > 0) {
      setNodes(rawNodes);
    }
  }, [rawNodes, setNodes]);

  React.useEffect(() => {
    if (rawEdges.length >= 0) {
      const styledEdges = rawEdges.map((edge) => {
        const label = (edge.label || '').toLowerCase();
        const edgeStyle = EDGE_STYLES[label] || EDGE_STYLES['relates to'] || {};
        return {
          ...edge,
          style: { ...edgeStyle, ...edge.style },
          labelStyle: { fontSize: 10, fill: '#6b7280' },
          labelBgStyle: { fill: '#f9fafb', fillOpacity: 0.8 },
          labelBgPadding: [4, 2],
        };
      });
      setEdges(styledEdges);
    }
  }, [rawEdges, setEdges]);

  const onNodeClick = useCallback((_event, node) => {
    setSelectedIssue(node.data);
  }, []);

  const minimapNodeColor = useCallback((node) => {
    const issueType = node.data?.issue_type;
    return getTypeColor(issueType).hex;
  }, []);

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
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
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <span className="text-xs text-gray-400 ml-auto">
          {nodes.length} nodes, {edges.length} edges
        </span>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex gap-4">
        <div className="flex-1 h-[600px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No canvas data available. Try syncing issues first.
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
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
              <Background variant="dots" gap={16} size={1} color="#e5e7eb" />
            </ReactFlow>
          )}
        </div>

        {/* Side panel: selected issue detail */}
        {selectedIssue && (
          <div className="w-72 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto max-h-[600px]">
            <div className="flex items-center justify-between mb-3">
              <a
                href={selectedIssue.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-blue-600 hover:underline font-medium"
              >
                {selectedIssue.key}
              </a>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                &times;
              </button>
            </div>

            <h3 className="text-sm font-medium text-gray-900 mb-3">{selectedIssue.summary}</h3>

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium">{selectedIssue.issue_type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium">{selectedIssue.status}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Assignee</dt>
                <dd className="font-medium">{selectedIssue.assignee || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Priority</dt>
                <dd className="font-medium">{selectedIssue.priority || 'None'}</dd>
              </div>
              {selectedIssue.sprint && (
                <div>
                  <dt className="text-gray-500">Sprint</dt>
                  <dd className="font-medium">{selectedIssue.sprint}</dd>
                </div>
              )}
              {selectedIssue.parent_key && (
                <div>
                  <dt className="text-gray-500">Parent</dt>
                  <dd className="font-mono font-medium">{selectedIssue.parent_key}</dd>
                </div>
              )}
              {selectedIssue.days_in_status != null && (
                <div>
                  <dt className="text-gray-500">Days in Status</dt>
                  <dd className={`font-medium ${selectedIssue.days_in_status > 14 ? 'text-red-600' : ''}`}>
                    {selectedIssue.days_in_status}
                  </dd>
                </div>
              )}
              {selectedIssue.labels?.length > 0 && (
                <div>
                  <dt className="text-gray-500">Labels</dt>
                  <dd className="flex flex-wrap gap-1 mt-0.5">
                    {selectedIssue.labels.map((l) => (
                      <span key={l} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                        {l}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {selectedIssue.description_text && (
                <div>
                  <dt className="text-gray-500">Description</dt>
                  <dd className="text-gray-700 mt-0.5 whitespace-pre-wrap line-clamp-6">
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
