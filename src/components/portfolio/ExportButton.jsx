import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useJiraApi } from '../../hooks/useJiraApi';

export default function ExportButton({ projectKey, view = 'progress', filter = 'all' }) {
  const api = useJiraApi();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await api.exportPortfolio({
        project_key: projectKey,
        view,
        filter,
        format: 'docx',
      });

      // Create download link from blob
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-rollup-${view}-${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading || !projectKey}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-surface border border-edge text-content-secondary rounded-lg hover:bg-surface-hover disabled:opacity-50"
      aria-label="Export as DOCX"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      Export
    </button>
  );
}
