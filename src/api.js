import axios from 'axios';

/**
 * Create an authenticated Jira API client.
 * @param {string} baseUrl - The jira-api base URL (e.g. http://localhost:8001/api/v1)
 * @param {function|string} getToken - A function returning a token (or token string)
 * @returns {object} API methods
 */
export function createJiraApiClient(baseUrl, getToken) {
  const client = axios.create({ baseURL: baseUrl, withCredentials: true });

  client.interceptors.request.use(async (config) => {
    const token = typeof getToken === 'function' ? await getToken() : getToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = error.response?.data?.detail || error.message || 'API request failed';
      return Promise.reject(new Error(message));
    }
  );

  return {
    // Dashboard (read-only views)
    getStats: (projectKey) =>
      client.get('/dashboard/stats', { params: { project_key: projectKey } }).then((r) => r.data),

    getIssues: (params) =>
      client.get('/dashboard/issues', { params }).then((r) => r.data),

    getCanvas: (projectKey, epicKey) =>
      client.get('/dashboard/canvas', { params: { project_key: projectKey, epic_key: epicKey || undefined } }).then((r) => r.data),

    getTimeline: (params) =>
      client.get('/dashboard/timeline', { params }).then((r) => r.data),

    getMyMentions: () =>
      client.get('/dashboard/my-mentions').then((r) => r.data),

    getBoards: () =>
      client.get('/dashboard/boards').then((r) => r.data),

    getBlockers: (projectKey) =>
      client.get('/dashboard/blockers', { params: { project_key: projectKey } }).then((r) => r.data),

    // Sync controls
    triggerSync: (projectKey, days) =>
      client.post('/sync/trigger', null, { params: { project_key: projectKey, ...(days && { days }) } }).then((r) => r.data),

    getSyncProgress: (projectKey) =>
      client.get('/sync/progress', { params: { project_key: projectKey } }).then((r) => r.data),

    getSyncConfig: (projectKey) =>
      client.get('/sync/config', { params: { project_key: projectKey } }).then((r) => r.data),

    updateSyncConfig: (config) =>
      client.put('/sync/config', config).then((r) => r.data),

    archive: (projectKey, months) =>
      client.post('/sync/archive', null, { params: { project_key: projectKey, months } }).then((r) => r.data),

    getArchives: (projectKey) =>
      client.get('/sync/archives', { params: { project_key: projectKey } }).then((r) => r.data),

    // Issue operations
    createIssue: (data) =>
      client.post('/issues/create', data).then((r) => r.data),

    linkIssue: (key, data) =>
      client.post(`/issues/${key}/link`, data).then((r) => r.data),

    transitionIssue: (key, status) =>
      client.post(`/issues/${key}/transition`, { status }).then((r) => r.data),

    getIssue: (key) =>
      client.get(`/issues/${key}`).then((r) => r.data),

    // Portfolio
    getCapabilities: (projectKey, params = {}) =>
      client.get('/portfolio/capabilities', {
        params: { project_key: projectKey, ...params },
      }).then(r => r.data),

    getCapabilityTree: (key, depth = 'epic') =>
      client.get(`/portfolio/capabilities/${key}/tree`, {
        params: { depth },
      }).then(r => r.data),

    getEpicChildren: (key, params = {}) =>
      client.get(`/portfolio/epics/${key}/children`, { params }).then(r => r.data),

    getSnapshotSeries: (key, metric = 'remaining', fromDate, toDate) =>
      client.get(`/portfolio/snapshots/${key}`, {
        params: { metric, from: fromDate, to: toDate },
      }).then(r => r.data),

    triggerRecompute: (projectKey) =>
      client.post('/portfolio/recompute', null, {
        params: { project_key: projectKey },
      }).then(r => r.data),

    runSnapshot: (projectKey, asOf) =>
      client.post('/portfolio/snapshots/run', {
        project_key: projectKey, as_of: asOf,
      }).then(r => r.data),

    getCycleMetrics: (key) =>
      client.get(`/portfolio/issues/${key}/cycle`).then(r => r.data),

    getRelatedItems: (key) =>
      client.get(`/portfolio/issues/${key}/related`).then(r => r.data),
  };
}
