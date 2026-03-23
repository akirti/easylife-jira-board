import React, { useState, useEffect, useCallback } from 'react';
import { useJiraApi } from '../hooks/useJiraApi';
import {
  RotateCw,
  Save,
  Archive,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
} from 'lucide-react';

const SYNC_PERIODS = [
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
];

const ARCHIVE_THRESHOLDS = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
];

/**
 * Sync configuration and controls panel.
 * Manages attribute mapping, sync period, archive threshold, and manual triggers.
 */
export default function SyncConfigPanel({ projectKey }) {
  const api = useJiraApi();

  const [config, setConfig] = useState(null);
  const [attributeMapText, setAttributeMapText] = useState('{}');
  const [syncPeriod, setSyncPeriod] = useState(3);
  const [archiveThreshold, setArchiveThreshold] = useState(6);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [jsonError, setJsonError] = useState(null);

  // Fetch config on mount
  const fetchConfig = useCallback(async () => {
    if (!projectKey) return;
    setLoading(true);
    try {
      const data = await api.getSyncConfig(projectKey);
      setConfig(data);
      setSyncPeriod(data.sync_period_months || 3);
      setArchiveThreshold(data.archive_after_months || 6);
      setAttributeMapText(JSON.stringify(data.attribute_map || {}, null, 2));
    } catch (err) {
      setFeedback({ type: 'error', message: `Failed to load config: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [api, projectKey]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Validate JSON as user types
  const handleAttributeMapChange = useCallback((text) => {
    setAttributeMapText(text);
    try {
      JSON.parse(text);
      setJsonError(null);
    } catch {
      setJsonError('Invalid JSON');
    }
  }, []);

  // Save config
  const handleSave = useCallback(async () => {
    if (jsonError) {
      setFeedback({ type: 'error', message: 'Fix JSON errors before saving.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      let attributeMap;
      try {
        attributeMap = JSON.parse(attributeMapText);
      } catch {
        setFeedback({ type: 'error', message: 'Invalid JSON in attribute mapping.' });
        setSaving(false);
        return;
      }

      await api.updateSyncConfig({
        project_key: projectKey,
        sync_period_months: syncPeriod,
        archive_after_months: archiveThreshold,
        attribute_map: attributeMap,
      });
      setFeedback({ type: 'success', message: 'Configuration saved.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }, [api, projectKey, syncPeriod, archiveThreshold, attributeMapText, jsonError]);

  // Trigger sync
  const handleSync = useCallback(async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const result = await api.triggerSync(projectKey);
      const count = result.synced_count ?? result.count ?? '?';
      setFeedback({ type: 'success', message: `Sync complete. ${count} issues synced.` });
      fetchConfig(); // Refresh last sync time
    } catch (err) {
      setFeedback({ type: 'error', message: `Sync failed: ${err.message}` });
    } finally {
      setSyncing(false);
    }
  }, [api, projectKey, fetchConfig]);

  // Trigger archive
  const handleArchive = useCallback(async () => {
    setArchiving(true);
    setFeedback(null);
    try {
      const result = await api.archive(projectKey, archiveThreshold);
      const count = result.archived_count ?? result.count ?? '?';
      setFeedback({ type: 'success', message: `Archived ${count} issues older than ${archiveThreshold} months.` });
    } catch (err) {
      setFeedback({ type: 'error', message: `Archive failed: ${err.message}` });
    } finally {
      setArchiving(false);
    }
  }, [api, projectKey, archiveThreshold]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <RotateCw className="h-5 w-5 animate-spin mr-2" />
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Last Sync Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">Sync Status</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Last Sync:</span>{' '}
            <span className="font-medium text-gray-900">
              {config?.last_sync
                ? new Date(config.last_sync).toLocaleString()
                : 'Never'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Last Result:</span>{' '}
            <span className={`font-medium ${config?.last_sync_status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {config?.last_sync_status || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total Issues:</span>{' '}
            <span className="font-medium text-gray-900">
              {config?.total_issues ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Project:</span>{' '}
            <span className="font-mono font-medium text-gray-900">{projectKey}</span>
          </div>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">Settings</h3>
        </div>

        <div className="space-y-4">
          {/* Sync Period */}
          <div>
            <label htmlFor="sync-period" className="block text-sm font-medium text-gray-700 mb-1">
              Sync Period
            </label>
            <select
              id="sync-period"
              value={syncPeriod}
              onChange={(e) => setSyncPeriod(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SYNC_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">How far back to sync issues from Jira</p>
          </div>

          {/* Archive Threshold */}
          <div>
            <label htmlFor="archive-threshold" className="block text-sm font-medium text-gray-700 mb-1">
              Archive Threshold
            </label>
            <select
              id="archive-threshold"
              value={archiveThreshold}
              onChange={(e) => setArchiveThreshold(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ARCHIVE_THRESHOLDS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Issues older than this are archived to GCS</p>
          </div>

          {/* Attribute Mapping */}
          <div>
            <label htmlFor="attribute-map" className="block text-sm font-medium text-gray-700 mb-1">
              Attribute Mapping
            </label>
            <textarea
              id="attribute-map"
              value={attributeMapText}
              onChange={(e) => handleAttributeMapChange(e.target.value)}
              rows={8}
              spellCheck={false}
              className={`w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${
                jsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {jsonError && (
              <p className="text-xs text-red-500 mt-1">{jsonError}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Maps Jira custom field IDs to local field names. Format: {`{ "customfield_xxxxx": "our_field_name" }`}
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving || !!jsonError}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? <RotateCw className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>

          <button
            onClick={handleArchive}
            disabled={archiving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {archiving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
            {archiving ? 'Archiving...' : 'Archive Old Issues'}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {feedback.message}
        </div>
      )}
    </div>
  );
}
