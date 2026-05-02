import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
  { value: 365, label: '365 days' },
];

const ARCHIVE_THRESHOLDS = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
];

const POLL_INTERVAL_MS = 2000;

/**
 * Sync configuration and controls panel.
 * Manages attribute mapping, sync period, archive threshold, and manual triggers.
 */
export default function SyncConfigPanel({ projectKey }) {
  const api = useJiraApi();

  const [config, setConfig] = useState(null);
  const [attributeMapText, setAttributeMapText] = useState('{}');
  const [syncPeriod, setSyncPeriod] = useState(90);
  const [archiveThreshold, setArchiveThreshold] = useState(6);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null);
  const pollRef = useRef(null);

  // Fetch config on mount
  const fetchConfig = useCallback(async () => {
    if (!projectKey) return;
    setLoading(true);
    try {
      const data = await api.getSyncConfig(projectKey);
      setConfig(data);
      setSyncPeriod(data.sync_period_days || data.sync_period_months * 30 || 90);
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

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Poll sync progress
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const progress = await api.getSyncProgress(projectKey);
        setSyncProgress(progress);

        if (progress.status === 'completed' || progress.status === 'error') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setSyncing(false);
          fetchConfig(); // Refresh last sync time

          if (progress.status === 'completed') {
            setFeedback({ type: 'success', message: progress.message });
          } else {
            setFeedback({ type: 'error', message: progress.message });
          }

          // Clear progress after a delay
          setTimeout(() => setSyncProgress(null), 5000);
        }
      } catch {
        // Ignore polling errors
      }
    }, POLL_INTERVAL_MS);
  }, [api, projectKey, fetchConfig]);

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
        sync_period_days: syncPeriod,
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

  // Trigger sync (background)
  const handleSync = useCallback(async () => {
    setSyncing(true);
    setFeedback(null);
    setSyncProgress(null);
    try {
      await api.triggerSync(projectKey, syncPeriod);
      // Start polling for progress
      startPolling();
    } catch (err) {
      setSyncing(false);
      if (err.message?.includes('409') || err.message?.includes('already in progress')) {
        setFeedback({ type: 'error', message: 'Sync already in progress.' });
        // Start polling to show existing progress
        startPolling();
        setSyncing(true);
      } else {
        setFeedback({ type: 'error', message: `Sync failed: ${err.message}` });
      }
    }
  }, [api, projectKey, syncPeriod, startPolling]);

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
      <div className="flex items-center justify-center h-48 text-content-muted">
        <RotateCw className="h-5 w-5 animate-spin mr-2" />
        Loading configuration...
      </div>
    );
  }

  const progressPercent = syncProgress && syncProgress.total_estimated > 0
    ? Math.min(Math.round((syncProgress.synced / syncProgress.total_estimated) * 100), 99)
    : 0;
  const showProgress = syncProgress && syncProgress.status !== 'idle';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Last Sync Info */}
      <div className="bg-surface rounded-lg border border-edge p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-content-muted" />
          <h3 className="text-sm font-medium text-content-secondary">Sync Status</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-content-muted">Last Sync:</span>{' '}
            <span className="font-medium text-content">
              {config?.last_sync
                ? new Date(config.last_sync).toLocaleString()
                : 'Never'}
            </span>
          </div>
          <div>
            <span className="text-content-muted">Last Result:</span>{' '}
            <span className={`font-medium ${config?.last_sync_status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {config?.last_sync_status || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-content-muted">Issues Synced:</span>{' '}
            <span className="font-medium text-content">
              {config?.last_sync_count ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-content-muted">Project:</span>{' '}
            <span className="font-mono font-medium text-content">{projectKey}</span>
          </div>
        </div>
      </div>

      {/* Sync Progress */}
      {showProgress && (
        <div className="bg-surface rounded-lg border border-edge p-4">
          <div className="flex items-center gap-2 mb-3">
            <RotateCw className={`h-4 w-4 text-primary-500 ${syncProgress.status === 'syncing' || syncProgress.status === 'fetching' ? 'animate-spin' : ''}`} />
            <h3 className="text-sm font-medium text-content-secondary">Sync Progress</h3>
            {syncProgress.status === 'completed' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {syncProgress.status === 'error' && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-secondary rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                syncProgress.status === 'error' ? 'bg-red-500' :
                syncProgress.status === 'completed' ? 'bg-green-500' :
                'bg-primary-500'
              }`}
              style={{ width: `${syncProgress.status === 'completed' ? 100 : progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-content-muted">
            <span>{syncProgress.message}</span>
            <span>
              {syncProgress.synced > 0 && `${syncProgress.synced} synced`}
              {syncProgress.current_batch > 0 && ` (batch ${syncProgress.current_batch})`}
            </span>
          </div>
        </div>
      )}

      {/* Sync Settings */}
      <div className="bg-surface rounded-lg border border-edge p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4 text-content-muted" />
          <h3 className="text-sm font-medium text-content-secondary">Settings</h3>
        </div>

        <div className="space-y-4">
          {/* Sync Period */}
          <div>
            <label htmlFor="sync-period" className="block text-sm font-medium text-content-secondary mb-1">
              Sync Period
            </label>
            <select
              id="sync-period"
              value={syncPeriod}
              onChange={(e) => setSyncPeriod(Number(e.target.value))}
              className="rounded-md border border-edge bg-surface-input text-content px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SYNC_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <p className="text-xs text-content-muted mt-1">How far back to sync issues from Jira</p>
          </div>

          {/* Archive Threshold */}
          <div>
            <label htmlFor="archive-threshold" className="block text-sm font-medium text-content-secondary mb-1">
              Archive Threshold
            </label>
            <select
              id="archive-threshold"
              value={archiveThreshold}
              onChange={(e) => setArchiveThreshold(Number(e.target.value))}
              className="rounded-md border border-edge bg-surface-input text-content px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ARCHIVE_THRESHOLDS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <p className="text-xs text-content-muted mt-1">Issues older than this are archived to GCS</p>
          </div>

          {/* Attribute Mapping */}
          <div>
            <label htmlFor="attribute-map" className="block text-sm font-medium text-content-secondary mb-1">
              Attribute Mapping
            </label>
            <textarea
              id="attribute-map"
              value={attributeMapText}
              onChange={(e) => handleAttributeMapChange(e.target.value)}
              rows={8}
              spellCheck={false}
              className={`w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y ${
                jsonError ? 'border-red-300 bg-red-50' : 'border-edge bg-surface-input text-content'
              }`}
            />
            {jsonError && (
              <p className="text-xs text-red-500 mt-1">{jsonError}</p>
            )}
            <p className="text-xs text-content-muted mt-1">
              Maps Jira custom field IDs to local field names. Format: {`{ "customfield_xxxxx": "our_field_name" }`}
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-4 pt-4 border-t border-edge">
          <button
            onClick={handleSave}
            disabled={saving || !!jsonError}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-surface rounded-lg border border-edge p-4">
        <h3 className="text-sm font-medium text-content-secondary mb-4">Actions</h3>
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
