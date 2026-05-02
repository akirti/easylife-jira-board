import React, { useState, useCallback } from 'react';
import { useJiraApi } from '../hooks/useJiraApi';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ISSUE_TYPES = ['Epic', 'Story', 'Bug', 'Task', 'Technical Story', 'Technical Task', 'Spike', 'Sub-task'];
const PRIORITIES = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];

/**
 * Modal form for creating a new Jira issue.
 * Calls api.createIssue() on submit.
 */
export default function CreateCardModal({ projectKey, isOpen, onClose, onCreated }) {
  const api = useJiraApi();
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    issue_type: 'Task',
    priority: 'Medium',
    assignee: '',
    parent_key: '',
    related_keys: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      summary: '',
      description: '',
      issue_type: 'Task',
      priority: 'Medium',
      assignee: '',
      parent_key: '',
      related_keys: '',
    });
    setFeedback(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.summary.trim()) {
      setFeedback({ type: 'error', message: 'Summary is required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        project_key: projectKey,
        summary: formData.summary.trim(),
        description: formData.description.trim() || undefined,
        issue_type: formData.issue_type,
        priority: formData.priority,
        assignee: formData.assignee.trim() || undefined,
        parent_key: formData.parent_key.trim() || undefined,
        related_keys: formData.related_keys
          ? formData.related_keys.split(',').map((k) => k.trim()).filter(Boolean)
          : undefined,
      };

      const result = await api.createIssue(payload);
      const createdKey = result.key || result.issue_key || 'issue';
      setFeedback({ type: 'success', message: `Created ${createdKey} successfully.` });
      onCreated?.(result);

      // Reset after short delay so user sees success message
      setTimeout(() => {
        resetForm();
        onClose?.();
      }, 1500);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create issue.' });
    } finally {
      setSubmitting(false);
    }
  }, [api, formData, projectKey, onClose, onCreated, resetForm]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose?.();
  }, [onClose, resetForm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <h2 className="text-lg font-semibold text-content">Create New Issue</h2>
          <button
            onClick={handleClose}
            className="text-content-muted hover:text-content-secondary p-1 rounded-lg hover:bg-surface-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Summary */}
          <div>
            <label htmlFor="create-summary" className="block text-sm font-medium text-content-secondary mb-1">
              Summary <span className="text-red-500">*</span>
            </label>
            <input
              id="create-summary"
              type="text"
              value={formData.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full rounded-md border border-edge bg-surface-input text-content px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="create-description" className="block text-sm font-medium text-content-secondary mb-1">
              Description
            </label>
            <textarea
              id="create-description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Detailed description (optional)"
              rows={4}
              className="w-full rounded-md border border-edge bg-surface-input text-content px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            />
          </div>

          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-type" className="block text-sm font-medium text-content-secondary mb-1">
                Issue Type
              </label>
              <select
                id="create-type"
                value={formData.issue_type}
                onChange={(e) => updateField('issue_type', e.target.value)}
                className="w-full rounded-md border border-edge bg-surface-input text-content px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="create-priority" className="block text-sm font-medium text-content-secondary mb-1">
                Priority
              </label>
              <select
                id="create-priority"
                value={formData.priority}
                onChange={(e) => updateField('priority', e.target.value)}
                className="w-full rounded-md border border-edge bg-surface-input text-content px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="create-assignee" className="block text-sm font-medium text-content-secondary mb-1">
              Assignee
            </label>
            <input
              id="create-assignee"
              type="text"
              value={formData.assignee}
              onChange={(e) => updateField('assignee', e.target.value)}
              placeholder="Email or display name"
              className="w-full rounded-md border border-edge bg-surface-input text-content px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Parent/Epic */}
          <div>
            <label htmlFor="create-parent" className="block text-sm font-medium text-content-secondary mb-1">
              Parent / Epic Key
            </label>
            <input
              id="create-parent"
              type="text"
              value={formData.parent_key}
              onChange={(e) => updateField('parent_key', e.target.value)}
              placeholder="e.g. SCEN-123"
              className="w-full rounded-md border border-edge bg-surface-input text-content px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Related Issues */}
          <div>
            <label htmlFor="create-related" className="block text-sm font-medium text-content-secondary mb-1">
              Related Issues
            </label>
            <input
              id="create-related"
              type="text"
              value={formData.related_keys}
              onChange={(e) => updateField('related_keys', e.target.value)}
              placeholder="Comma-separated keys, e.g. SCEN-100, SCEN-101"
              className="w-full rounded-md border border-edge bg-surface-input text-content px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-content-muted mt-1">These will be linked as &quot;relates to&quot;</p>
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-content-secondary bg-surface border border-edge rounded-lg hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.summary.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
