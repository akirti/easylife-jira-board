import { createContext, useContext, useMemo } from 'react';
import { createJiraApiClient } from '../api';

const JiraApiContext = createContext(null);

/**
 * Provider that creates and shares a Jira API client instance.
 * Wrap your component tree with this to use the useJiraApi() hook.
 */
export function JiraApiProvider({ apiBaseUrl, getToken, children }) {
  const api = useMemo(
    () => createJiraApiClient(apiBaseUrl, getToken),
    [apiBaseUrl, getToken]
  );

  return (
    <JiraApiContext.Provider value={api}>
      {children}
    </JiraApiContext.Provider>
  );
}

/**
 * Hook to access the Jira API client from context.
 * Must be used inside a <JiraApiProvider>.
 */
export function useJiraApi() {
  const api = useContext(JiraApiContext);
  if (!api) {
    throw new Error('useJiraApi must be used within a <JiraApiProvider>');
  }
  return api;
}
