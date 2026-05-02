import React from 'react';

const TABS = [
  { id: 'progress', label: 'Progress' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'cycle', label: 'Cycle Time' },
];

export default function TabSwitcher({ activeTab, onTabChange }) {
  return (
    <div className="flex items-center gap-0 border-b border-edge mb-3">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors
            ${activeTab === tab.id
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-content-muted hover:text-content-secondary'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
