import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Loader2, Maximize2 } from 'lucide-react';
import { useTreeData } from '../../hooks/useTreeData';
import { getTypeColor } from '../../constants';
import TreeFilterBar from './TreeFilterBar';
import TreeDetailPanel from './TreeDetailPanel';

const NODE_W = 220;
const NODE_H = 28;
const H_GAP = 260;
const V_GAP = 36;

function buildHierarchy(treesMap) {
  const root = { key: '__root__', summary: 'Portfolio', children: [], _isRoot: true };
  Object.values(treesMap).forEach(cap => {
    const capNode = { ...cap, children: [] };
    if (cap.epics) {
      cap.epics.forEach(epic => {
        capNode.children.push({ ...epic, children: [] });
      });
    }
    root.children.push(capNode);
  });
  return root;
}

export default function TreeExplorer({ projectKey }) {
  const svgRef = useRef(null);
  const {
    trees, loading, error,
    selectedNode, setSelectedNode,
    filters, updateFilters, clearFilters,
    matchesFilter,
  } = useTreeData(projectKey);

  const hierarchy = useMemo(() => {
    if (!Object.keys(trees).length) return null;
    return buildHierarchy(trees);
  }, [trees]);

  // Render D3 tree
  useEffect(() => {
    if (!hierarchy || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const root = d3.hierarchy(hierarchy);
    const treeLayout = d3.tree().nodeSize([V_GAP, H_GAP]);
    treeLayout(root);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 2])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // Links (skip root's children links)
    g.selectAll('.link')
      .data(root.links().filter(d => !d.source.data._isRoot))
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x));

    // Nodes (skip root)
    const allNodes = root.descendants().filter(d => !d.data._isRoot);
    const nodes = g.selectAll('.node')
      .data(allNodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedNode(d.data);
        // Pulse animation
        d3.select(_event.currentTarget).select('rect')
          .transition().duration(200).attr('stroke-width', 3)
          .transition().duration(1200).attr('stroke-width', 1);
      });

    // Node rectangles
    nodes.append('rect')
      .attr('x', -NODE_W / 2)
      .attr('y', -NODE_H / 2)
      .attr('width', NODE_W)
      .attr('height', NODE_H)
      .attr('rx', 4)
      .attr('fill', d => {
        const tc = getTypeColor(d.data.issue_type || 'Task');
        return tc.hex || '#94a3b8';
      })
      .attr('fill-opacity', d => matchesFilter(d.data) ? 0.15 : 0.05)
      .attr('stroke', d => {
        const tc = getTypeColor(d.data.issue_type || 'Task');
        return tc.hex || '#94a3b8';
      })
      .attr('stroke-width', 1)
      .attr('stroke-opacity', d => matchesFilter(d.data) ? 1 : 0.3);

    // Node text
    nodes.append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', 'var(--color-text)')
      .attr('opacity', d => matchesFilter(d.data) ? 1 : 0.3)
      .text(d => {
        const label = `${d.data.key} ${d.data.summary || ''}`;
        return label.length > 28 ? label.slice(0, 26) + '\u2026' : label;
      });

    // Auto-fit
    const bounds = g.node()?.getBBox();
    if (bounds) {
      const parent = svgRef.current.parentElement;
      const pw = parent?.clientWidth || 800;
      const ph = parent?.clientHeight || 500;
      const scale = Math.min(
        pw / (bounds.width + 100),
        ph / (bounds.height + 100),
        1
      );
      const tx = pw / 2 - (bounds.x + bounds.width / 2) * scale;
      const ty = ph / 2 - (bounds.y + bounds.height / 2) * scale;
      svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
  }, [hierarchy, matchesFilter, setSelectedNode]);

  // Fit to view button
  const handleFitView = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    const bounds = g.node()?.getBBox();
    if (!bounds) return;
    const parent = svgRef.current.parentElement;
    const pw = parent?.clientWidth || 800;
    const ph = parent?.clientHeight || 500;
    const scale = Math.min(pw / (bounds.width + 100), ph / (bounds.height + 100), 1);
    const tx = pw / 2 - (bounds.x + bounds.width / 2) * scale;
    const ty = ph / 2 - (bounds.y + bounds.height / 2) * scale;
    svg.transition().duration(400)
      .call(d3.zoom().transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }, []);

  if (loading && !Object.keys(trees).length) {
    return (
      <div className="flex items-center justify-center h-96 text-content-muted">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading tree...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700" role="alert">
        {error}
      </div>
    );
  }

  if (!hierarchy || hierarchy.children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <p className="text-content font-medium">No tree data</p>
        <p className="text-sm text-content-muted mt-1">Sync data and recompute rollups first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TreeFilterBar filters={filters} onUpdate={updateFilters} onClear={clearFilters} />

      <div className="flex" style={{ height: 'calc(100vh - 22rem)' }}>
        {/* Tree canvas */}
        <div className="flex-1 relative bg-surface-secondary rounded-lg border border-edge overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" />
          <button
            onClick={handleFitView}
            className="absolute top-3 right-3 p-2 rounded-lg bg-surface border border-edge shadow-sm hover:bg-surface-hover text-content-muted"
            aria-label="Fit to view"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <TreeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>
    </div>
  );
}
