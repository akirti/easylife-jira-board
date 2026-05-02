// Main widget
export { default as JiraDashboard } from './components/JiraDashboard';

// Individual views (for embedding as widgets)
export { default as BoardView } from './components/BoardView';
export { default as CanvasView } from './components/CanvasView';
export { default as TimelineView } from './components/TimelineView';
export { default as IssueCard } from './components/IssueCard';
export { default as StatsHeader } from './components/StatsHeader';
export { default as MyMentionsView } from './components/MyMentionsView';
export { default as BoardsView } from './components/BoardsView';
export { default as CreateCardModal } from './components/CreateCardModal';
export { default as SyncConfigPanel } from './components/SyncConfigPanel';
export { default as CanvasIssueNode } from './components/CanvasIssueNode';

// Provider + hook
export { JiraApiProvider, useJiraApi } from './hooks/useJiraApi';

// Hooks
export { useDashboardData } from './hooks/useDashboardData';
export { useCanvasData } from './hooks/useCanvasData';
export { useTimelineData } from './hooks/useTimelineData';

// API client factory
export { createJiraApiClient } from './api';

// Constants
export { TYPE_COLORS, STATUS_CATEGORIES, PRIORITY_ICONS, EDGE_STYLES, getTypeColor, getStatusColor } from './constants';

// Portfolio components
export { default as PortfolioShell } from './components/portfolio/PortfolioShell';
export { default as RollupTable } from './components/portfolio/RollupTable';
export { default as TshirtBadge } from './components/portfolio/TshirtBadge';
export { default as ProgressBar } from './components/portfolio/ProgressBar';
export { default as Sparkline } from './components/portfolio/Sparkline';

export { default as OverviewView } from './components/portfolio/OverviewView';
export { default as TreeExplorer } from './components/portfolio/TreeExplorer';
export { default as TreeDetailPanel } from './components/portfolio/TreeDetailPanel';
export { default as TreeFilterBar } from './components/portfolio/TreeFilterBar';

// Portfolio hooks
export { usePortfolioData } from './hooks/usePortfolioData';
export { useSnapshotData } from './hooks/useSnapshotData';
export { useTreeData } from './hooks/useTreeData';
