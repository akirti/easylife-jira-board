import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { useJiraApi } from '../../hooks/useJiraApi';
import { getTypeColor } from '../../constants';
import TshirtBadge from './TshirtBadge';
import ProgressBar from './ProgressBar';
import CycleTimeBar from './CycleTimeBar';
import TabSwitcher from './TabSwitcher';

function getTabColumns(tab) {
  switch (tab) {
    case 'schedule':
      return [
        { key: 'target_start', label: 'Start', width: 'w-24', align: 'text-left' },
        { key: 'target_end', label: 'End', width: 'w-24', align: 'text-left' },
        { key: 'days_to_done', label: 'Days', width: 'w-16', align: 'text-right' },
      ];
    case 'cycle':
      return [
        { key: 'cycle_bar', label: 'Cycle Time', width: 'w-40', align: 'text-left' },
      ];
    default: // progress
      return [
        { key: 'cumulative', label: 'Cumul.', width: 'w-20', align: 'text-right' },
        { key: 'remaining', label: 'Remain.', width: 'w-20', align: 'text-right' },
        { key: 'progress', label: 'Progress', width: 'w-28', align: 'text-left' },
      ];
  }
}

function TabCells({ tab, data, rollups }) {
  switch (tab) {
    case 'schedule':
      return (
        <>
          <td className="py-2 px-2 text-xs text-content-secondary">{data.target_start || '\u2014'}</td>
          <td className="py-2 px-2 text-xs text-content-secondary">{data.target_end || '\u2014'}</td>
          <td className="py-2 px-2 text-xs text-right tabular-nums text-content">
            {data.days_to_done != null ? `${data.days_to_done.toFixed(0)}d` : '\u2014'}
          </td>
        </>
      );
    case 'cycle':
      return (
        <td className="py-2 px-2 w-40">
          <CycleTimeBar devDays={data.dev_days} qaDays={data.qa_days}
                        stageDays={data.stage_days} prodDays={data.prod_days} />
        </td>
      );
    default:
      return (
        <>
          <td className="py-2 px-2 text-right text-xs font-medium tabular-nums text-content">
            {rollups?.cumulative_points || 0}
          </td>
          <td className="py-2 px-2 text-right text-xs tabular-nums text-content-secondary">
            {rollups?.remaining_points || 0}
          </td>
          <td className="py-2 px-2 w-28">
            <ProgressBar cumulative={rollups?.cumulative_points} remaining={rollups?.remaining_points} />
          </td>
        </>
      );
  }
}

function StoryRow({ story, tab }) {
  const typeColor = getTypeColor(story.issue_type);
  return (
    <tr className="text-sm border-b border-edge last:border-b-0">
      <td className="py-1.5 pl-16 pr-2">
        <span className="font-mono text-xs text-primary-600">{story.key}</span>
      </td>
      <td className="py-1.5 px-2 text-content truncate max-w-xs">{story.summary}</td>
      <td className="py-1.5 px-2">
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
          {story.issue_type}
        </span>
      </td>
      <td className="py-1.5 px-2 text-xs text-content-secondary">{story.status}</td>
      {tab === 'progress' ? (
        <>
          <td className="py-1.5 px-2 text-right text-xs tabular-nums text-content">
            {story.story_points ?? '\u2014'}
            {story.in_remaining && (
              <span className="ml-1 text-amber-500" title="Counts toward remaining">*</span>
            )}
          </td>
          <td className="py-1.5 px-2 text-xs text-content-muted">{story.assignee || '\u2014'}</td>
        </>
      ) : (
        <TabCells tab={tab} data={story} rollups={null} />
      )}
    </tr>
  );
}

function EpicRow({ epic, tab }) {
  const [expanded, setExpanded] = useState(false);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const api = useJiraApi();

  const toggle = useCallback(async () => {
    if (!expanded && !loaded) {
      setLoading(true);
      try {
        const result = await api.getEpicChildren(epic.key, { page_size: 50 });
        setStories(result.data || []);
        setLoaded(true);
      } catch { /* ignore */ }
      setLoading(false);
    }
    setExpanded(prev => !prev);
  }, [expanded, loaded, api, epic.key]);

  const r = epic.rollups || {};
  return (
    <>
      <tr
        className="text-sm border-b border-edge hover:bg-surface-hover cursor-pointer transition-colors"
        onClick={toggle}
        role="row"
        aria-expanded={expanded}
      >
        <td className="py-2 pl-8 pr-2">
          <div className="flex items-center gap-1">
            {loading ? (
              <Loader2 size={14} className="animate-spin text-content-muted" />
            ) : expanded ? (
              <ChevronDown size={14} className="text-content-muted" />
            ) : (
              <ChevronRight size={14} className="text-content-muted" />
            )}
            <span className="font-mono text-xs text-primary-600">{epic.key}</span>
          </div>
        </td>
        <td className="py-2 px-2 text-content truncate max-w-sm">{epic.summary}</td>
        <td className="py-2 px-2">
          <TshirtBadge size={epic.tshirt_size} fallback={epic.uses_tshirt_fallback} />
        </td>
        <td className="py-2 px-2 text-xs text-content-secondary">{epic.status}</td>
        <TabCells tab={tab} data={epic} rollups={r} />
      </tr>
      {expanded && stories.map(s => <StoryRow key={s.key} story={s} tab={tab} />)}
    </>
  );
}

function CapabilityRow({ cap, tab }) {
  const [expanded, setExpanded] = useState(false);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const api = useJiraApi();

  const toggle = useCallback(async () => {
    if (!expanded && !tree) {
      setLoading(true);
      try {
        const result = await api.getCapabilityTree(cap.key);
        setTree(result);
      } catch { /* ignore */ }
      setLoading(false);
    }
    setExpanded(prev => !prev);
  }, [expanded, tree, api, cap.key]);

  const r = cap.rollups || {};
  return (
    <>
      <tr
        className="text-sm border-b border-edge bg-surface-secondary hover:bg-surface-hover cursor-pointer font-medium transition-colors"
        onClick={toggle}
        role="row"
        aria-expanded={expanded}
      >
        <td className="py-2.5 pl-2 pr-2">
          <div className="flex items-center gap-1">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-content-muted" />
            ) : expanded ? (
              <ChevronDown size={16} className="text-content-muted" />
            ) : (
              <ChevronRight size={16} className="text-content-muted" />
            )}
            <span className="font-mono text-primary-600">{cap.key}</span>
          </div>
        </td>
        <td className="py-2.5 px-2 text-content truncate max-w-sm">{cap.summary}</td>
        <td className="py-2.5 px-2">
          <TshirtBadge size={cap.tshirt_size} />
        </td>
        <td className="py-2.5 px-2 text-xs text-content-secondary">{cap.status}</td>
        <TabCells tab={tab} data={cap} rollups={r} />
      </tr>
      {expanded && tree && tree.epics && tree.epics.map(epic => (
        <EpicRow key={epic.key} epic={epic} tab={tab} />
      ))}
    </>
  );
}

export default function RollupTable({ capabilities }) {
  const [activeTab, setActiveTab] = useState('progress');

  if (!capabilities || capabilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-content font-medium">No capabilities found</p>
        <p className="text-sm text-content-muted mt-1">Sync Jira data and recompute rollups to see portfolio data here.</p>
      </div>
    );
  }

  const tabColumns = getTabColumns(activeTab);

  return (
    <div>
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="bg-surface rounded-lg border border-edge overflow-hidden">
        <table className="w-full text-left" role="treegrid">
          <thead>
            <tr className="bg-surface-secondary border-b border-edge">
              <th className="py-2.5 px-2 text-xs font-medium text-content-muted uppercase tracking-wider w-32">Key</th>
              <th className="py-2.5 px-2 text-xs font-medium text-content-muted uppercase tracking-wider">Summary</th>
              <th className="py-2.5 px-2 text-xs font-medium text-content-muted uppercase tracking-wider w-16">Size</th>
              <th className="py-2.5 px-2 text-xs font-medium text-content-muted uppercase tracking-wider w-28">Status</th>
              {tabColumns.map(col => (
                <th key={col.key}
                    className={`py-2.5 px-2 text-xs font-medium text-content-muted uppercase tracking-wider ${col.width} ${col.align}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {capabilities.map(cap => (
              <CapabilityRow key={cap.key} cap={cap} tab={activeTab} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
