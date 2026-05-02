import React, { useState, useEffect, useCallback, Component } from 'react';
import { JiraApiProvider, useJiraApi } from '../hooks/useJiraApi';
import BoardView from './BoardView';
import CanvasView from './CanvasView';
import TimelineView from './TimelineView';
import MyMentionsView from './MyMentionsView';
import BoardsView from './BoardsView';
import SyncConfigPanel from './SyncConfigPanel';
import CreateCardModal from './CreateCardModal';
import {
  LayoutDashboard,
  GitBranch,
  Calendar,
  MessageCircle,
  LayoutGrid,
  Settings,
  Plus,
  RotateCw,
} from 'lucide-react';

/** Error boundary to prevent one tab crash from taking down the whole dashboard. */
class TabErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Tab crash:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-sm font-medium text-red-700 mb-2">This view encountered an error</p>
          <p className="text-xs text-red-500 mb-3">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TABS = [
  { key: 'board', label: 'Board', icon: LayoutDashboard },
  { key: 'canvas', label: 'Canvas', icon: GitBranch },
  { key: 'timeline', label: 'Timeline', icon: Calendar },
  { key: 'mentions', label: 'My Tags', icon: MessageCircle },
  { key: 'boards', label: 'Boards', icon: LayoutGrid },
  { key: 'config', label: 'Config', icon: Settings },
];

/**
 * Main Jira Dashboard widget.
 * Wrap with JiraApiProvider so all child views have access to the API client.
 *
 * Usage:
 *   <JiraDashboard apiBaseUrl="http://localhost:8001/api/v1" getToken={getAccessToken} />
 */
export default function JiraDashboard({ apiBaseUrl, getToken }) {
  return (
    <JiraApiProvider apiBaseUrl={apiBaseUrl} getToken={getToken}>
      <JiraDashboardInner />
    </JiraApiProvider>
  );
}

function JiraDashboardInner() {
  const api = useJiraApi();
  const [activeTab, setActiveTab] = useState('board');
  const [projectKey, setProjectKey] = useState('');
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Fetch available projects from stats or config
  useEffect(() => {
    let cancelled = false;
    async function loadProjects() {
      try {
        const config = await api.getSyncConfig();
        if (!cancelled) {
          const projectList = config.projects || [];
          setProjects(projectList);
          // Auto-select first project if available
          if (projectList.length > 0 && !projectKey) {
            setProjectKey(projectList[0].project_key || projectList[0]);
          } else if (!projectKey && config.project_key) {
            setProjectKey(config.project_key);
          }
        }
      } catch {
        // If config fails, try loading with a default key
        if (!cancelled && !projectKey) {
          setProjectKey('SCEN');
        }
      }
    }
    loadProjects();
    return () => { cancelled = true; };
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quick sync from header
  const handleSync = useCallback(async () => {
    if (!projectKey) return;
    setSyncing(true);
    setSyncFeedback(null);
    try {
      await api.triggerSync(projectKey);
      setSyncFeedback({ type: 'success', message: 'Sync complete' });
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err) {
      setSyncFeedback({ type: 'error', message: err.message });
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setSyncing(false);
    }
  }, [api, projectKey]);

  const handleIssueCreated = useCallback(() => {
    // Views will auto-refresh on next fetch; we just close the modal
    setShowCreateModal(false);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'board':
        return <BoardView projectKey={projectKey} />;
      case 'canvas':
        return <CanvasView projectKey={projectKey} />;
      case 'timeline':
        return <TimelineView projectKey={projectKey} />;
      case 'mentions':
        return <MyMentionsView />;
      case 'boards':
        return <BoardsView />;
      case 'config':
        return <SyncConfigPanel projectKey={projectKey} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-content">Jira Dashboard</h1>

          {/* Project selector */}
          {projects.length > 1 ? (
            <select
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value)}
              className="rounded-md border border-edge bg-surface-input text-content px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {projects.map((p) => {
                const key = typeof p === 'string' ? p : p.project_key;
                const name = typeof p === 'string' ? p : (p.project_name || p.project_key);
                return (
                  <option key={key} value={key}>{name} ({key})</option>
                );
              })}
            </select>
          ) : (
            projectKey && (
              <span className="text-sm font-mono text-content-muted bg-surface-secondary px-2 py-1 rounded">
                {projectKey}
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sync feedback */}
          {syncFeedback && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                syncFeedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {syncFeedback.message}
            </span>
          )}

          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing || !projectKey}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-content-secondary bg-surface border border-edge rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>

          {/* New Issue button */}
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!projectKey}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            New Issue
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-edge">
        <nav className="flex gap-0 -mb-px" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-content-muted hover:text-content-secondary hover:border-edge'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {projectKey ? (
          <TabErrorBoundary key={activeTab}>
            {renderTabContent()}
          </TabErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-64 text-content-muted">
            Select a project to get started
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateCardModal
        projectKey={projectKey}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleIssueCreated}
      />
    </div>
  );
}
