export const TYPE_COLORS = {
  Epic: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', hex: '#9333ea' },
  Story: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', hex: '#16a34a' },
  Bug: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', hex: '#dc2626' },
  Task: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', hex: '#2563eb' },
  'Technical Story': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300', hex: '#0891b2' },
  'Technical Task': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', hex: '#0d9488' },
  Spike: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', hex: '#d97706' },
  'Sub-task': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', hex: '#475569' },
};

export const STATUS_CATEGORIES = {
  'To Do': { bg: 'bg-slate-100', text: 'text-slate-700' },
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Done': { bg: 'bg-green-100', text: 'text-green-700' },
};

export const PRIORITY_ICONS = {
  Highest: '\u2B06\u2B06',
  High: '\u2B06',
  Medium: '\u2550',
  Low: '\u2B07',
  Lowest: '\u2B07\u2B07',
};

export const EDGE_STYLES = {
  blocks: { stroke: '#dc2626', strokeDasharray: '5 5', animated: true },
  'is blocked by': { stroke: '#dc2626', strokeDasharray: '5 5', animated: true },
  'parent of': { stroke: '#2563eb', strokeWidth: 2 },
  'is child of': { stroke: '#2563eb', strokeWidth: 2 },
  'relates to': { stroke: '#9ca3af' },
};

export const getTypeColor = (type) => TYPE_COLORS[type] || TYPE_COLORS.Task;
export const getStatusColor = (category) => STATUS_CATEGORIES[category] || STATUS_CATEGORIES['To Do'];
