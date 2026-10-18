import { useState, useCallback } from 'react';
import { useStore } from 'jotai';
import { t } from '@lingui/core/macro';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { getSessionGeneration } from '@/auth/utils/getSessionGeneration';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

export const useLessBusyApi = () => {
  const store = useStore();
  const workspaceId = useAtomStateValue(currentWorkspaceState)?.id;
  const sessionGeneration = getSessionGeneration();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const request = useCallback(async <TResult,>(path: string, method = 'GET', body?: unknown): Promise<TResult> => {
    const assertCurrentSession = () => {
      if (!workspaceId || store.get(currentWorkspaceState.atom)?.id !== workspaceId || getSessionGeneration() !== sessionGeneration) throw new Error(t`Your workspace or session changed. Reopen this page before continuing.`);
    };
    assertCurrentSession();
    if (!/^[a-z][a-z0-9/_-]*$/i.test(path.split('?')[0])) throw new Error(t`This request destination is not supported.`);
    setPendingRequests((count) => count + 1); setError(null);
    try {
      const response = await fetch(`${REACT_APP_SERVER_BASE_URL}/app/lessbusy/${path}`, { method, credentials: 'include', signal: AbortSignal.timeout(45000), headers: { 'Content-Type': 'application/json', 'x-lessbusy-workspace-id': workspaceId! }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      assertCurrentSession();
      const result: unknown = await response.json();
      assertCurrentSession();
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'message' in result && typeof result.message === 'string' ? result.message : t`We could not complete this request. Please review the details and try again.`;
        throw new Error(message);
      }
      return result as TResult;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t`Something went wrong. Please try again.`);
      throw failure;
    } finally { setPendingRequests((count) => Math.max(0, count - 1)); }
  }, [store, workspaceId, sessionGeneration]);
  return { request, pending: pendingRequests > 0, error, clearError: () => setError(null) };
};
