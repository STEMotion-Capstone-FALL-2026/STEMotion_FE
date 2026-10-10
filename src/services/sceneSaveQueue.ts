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
const identities = new Map<string, Map<string, string>>();
type SaveEvent = { scriptId: string; error?: unknown };
const listeners = new Set<(event: SaveEvent) => void>();
const resolveId = (scriptId: string, id: string): string => identities.get(scriptId)?.get(id) ?? id;
const notify = (event: SaveEvent) => listeners.forEach(listener => listener(event));

const chains = new Map<string, Promise<unknown>>();

/** Runs the PUT after every earlier save for the same script has settled. */
const enqueue = (scriptId: string, scenes: SceneData[]): Promise<STEMScript> => {
  const previous = chains.get(scriptId) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
        .then(async () => {
      const submitted = scenes.map(scene => ({ ...scene, id: resolveId(scriptId, scene.id) }));
      const saved = await apiClient.put<STEMScript>(`/scripts/${scriptId}`, { scenes: submitted });
      if (saved?.scenes?.length === submitted.length) {
        const aliases = identities.get(scriptId) ?? new Map<string, string>();
        submitted.forEach((scene, index) => {
          const serverId = saved.scenes[index].id;
          aliases.set(scenes[index].id, serverId);
          aliases.set(scene.id, serverId);
        });
        identities.set(scriptId, aliases);
      }
      notify({ scriptId });
      return saved;
    }).catch(error => { notify({ scriptId, error }); throw error; });
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
  resolveId,
  subscribe(listener: (event: SaveEvent) => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
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
