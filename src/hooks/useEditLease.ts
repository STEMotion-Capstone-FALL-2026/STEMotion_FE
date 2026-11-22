import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/apiClient';
import { collabService, Lease, LeaseType } from '../services/collabService';

/** Renew well inside the 90 s expiry (D16/D17). */
export const LEASE_RENEW_MS = 30_000;

export interface EditLeaseState {
  /** True when this user may save: they hold the lease, or the project does not need one and nobody else holds it. */
  canEdit: boolean;
  /** Someone else is editing: the studio opens read-only. */
  heldBy: string | null;
  lease: Lease | null;
  error: string | null;
  retry: () => void;
}

/**
 * Holds the edit lease of a project's script draft or composition while the studio is open:
 * acquires it, renews it every 30 s and releases it on close. A project created before project
 * roles does not need the lease, but still waits while someone else holds it.
 */
export function useEditLease(projectId: string | null | undefined, type: LeaseType, enabled = true): EditLeaseState {
  const [lease, setLease] = useState<Lease | null>(null);
  const [heldBy, setHeldBy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const holding = useRef(false);

  const acquire = useCallback(async () => {
    if (!projectId) return;
    try {
      const next = await collabService.acquireLease(projectId, type);
      holding.current = next.mine;
      setLease(next);
      setHeldBy(null);
      setError(null);
    } catch (e) {
      holding.current = false;
      if (e instanceof ApiError && e.code === 'EDIT_LEASE_HELD') {
        setHeldBy((e.details?.holderName as string) || 'Một thành viên khác');
        setError(null);
      } else if (e instanceof ApiError && e.status === 403) {
        // Not an editor of this project (e.g. a Reviewer opening it): read-only, no lease to take.
        setLease(null);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : 'Không lấy được quyền chỉnh sửa');
      }
    }
  }, [projectId, type]);

  useEffect(() => {
    if (!projectId || !enabled) return;
    let stopped = false;
    void acquire();
    const timer = window.setInterval(() => { if (!stopped) void acquire(); }, LEASE_RENEW_MS);
    const release = () => {
      if (holding.current) {
        holding.current = false;
        void collabService.releaseLease(projectId, type).catch(() => undefined);
      }
    };
    window.addEventListener('beforeunload', release);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener('beforeunload', release);
      release();
    };
  }, [projectId, type, enabled, acquire, attempt]);

  const canEdit = !heldBy && (lease ? lease.mine || !lease.required : true);
  return { canEdit, heldBy, lease, error, retry: () => setAttempt(a => a + 1) };
}
