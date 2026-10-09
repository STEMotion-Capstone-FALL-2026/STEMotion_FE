import { apiClient } from './apiClient';
import { SceneData, STEMScript } from '../types/stem';

/**
 * Serialises scene saves per script.
 *
 * The inspector changes a scene on every keystroke and slider tick. Sending
 * each change as its own PUT raced on the server, where every save replaces the
 * script's scene rows, and the overlapping requests failed with optimistic-lock
 * errors (HTTP 500). Continuous edits are now coalesced into one save after a
 * short pause, and saves for the same script always run one after another.
 */

export const SAVE_DEBOUNCE_MS = 600;

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pending = new Map<string, SceneData[]>();
const chains = new Map<string, Promise<unknown>>();

/** Runs the PUT after every earlier save for the same script has settled. */
const enqueue = (scriptId: string, scenes: SceneData[]): Promise<STEMScript> => {
  const previous = chains.get(scriptId) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(() => apiClient.put<STEMScript>(`/scripts/${scriptId}`, { scenes }));
  chains.set(scriptId, next);
  return next;
};

const cancelPending = (scriptId: string) => {
  const timer = timers.get(scriptId);
  if (timer) clearTimeout(timer);
  timers.delete(scriptId);
  pending.delete(scriptId);
};

export const sceneSaveQueue = {
  /**
   * For continuous edits. Only the latest scene list is sent, once the edits
   * pause for SAVE_DEBOUNCE_MS. Failures are logged; the local edit stays.
   */
  schedule(scriptId: string, scenes: SceneData[]): void {
    const timer = timers.get(scriptId);
    if (timer) clearTimeout(timer);
    pending.set(scriptId, scenes);
    timers.set(
      scriptId,
      setTimeout(() => {
        const latest = pending.get(scriptId);
        timers.delete(scriptId);
        pending.delete(scriptId);
        if (latest) {
          enqueue(scriptId, latest).catch((error) =>
            console.warn('[sceneSaveQueue] Save failed, keeping the local edit:', error)
          );
        }
      }, SAVE_DEBOUNCE_MS)
    );
  },

  /**
   * For discrete actions (add or delete a scene). Sent right away, still in
   * order. A pending debounced edit is dropped because `scenes` already carries
   * the latest state.
   */
  saveNow(scriptId: string, scenes: SceneData[]): Promise<STEMScript> {
    cancelPending(scriptId);
    return enqueue(scriptId, scenes);
  },
};
