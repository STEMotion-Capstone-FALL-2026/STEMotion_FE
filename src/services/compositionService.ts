import { apiClient } from './apiClient';
import { SAVE_DEBOUNCE_MS } from './sceneSaveQueue';
import type { SceneData } from '../types/stem';

/**
 * Production Workspace (proposal): the producer opens an approved script as
 * an auto-generated draft and edits each scene's properties. The approved
 * script stays as the reviewer saw it; renders take this draft.
 */
export interface Composition {
  projectId: string;
  /** Script version the draft was made from. */
  scriptVersionNo: number;
  /** 0 until the first save, then +1 per save. A render records it. */
  revision: number;
  editable: boolean;
  /** Why the draft cannot change now (rendering, in review, approved). */
  lockedReason?: string | null;
  scenes: SceneData[];
  updatedAt?: string | null;
  updatedByName?: string | null;
}

export const compositionService = {
  get(projectId: string): Promise<Composition> {
    return apiClient.get<Composition>(`/scripts/${projectId}/composition`);
  },

  /** Fails with 409 when someone saved a newer revision first. */
  save(projectId: string, baseRevision: number, scenes: SceneData[]): Promise<Composition> {
    return apiClient.put<Composition>(`/scripts/${projectId}/composition`, { baseRevision, scenes });
  },
};

export interface CompositionSaver {
  /** For continuous edits: only the latest scenes are sent, once edits pause. */
  schedule(scenes: SceneData[]): void;
  /** Sends a pending edit now and waits for every save, e.g. before a render. */
  flush(): Promise<void>;
  dispose(): void;
}

/**
 * Saves one project's draft. Edits are coalesced, saves never overlap, and
 * each save starts from the revision the previous one returned.
 */
export function createCompositionSaver(
  projectId: string,
  startRevision: number,
  handlers: { onSaved: (saved: Composition) => void; onError: (error: unknown) => void },
  options: { delayMs?: number; save?: typeof compositionService.save } = {}
): CompositionSaver {
  const delayMs = options.delayMs ?? SAVE_DEBOUNCE_MS;
  const save = options.save ?? compositionService.save;
  let revision = startRevision;
  let pending: SceneData[] | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let chain: Promise<void> = Promise.resolve();
  let disposed = false;

  const flush = (): Promise<void> => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const scenes = pending;
    pending = null;
    if (scenes) {
      chain = chain.then(async () => {
        if (disposed) return;
        try {
          const saved = await save(projectId, revision, scenes);
          revision = saved.revision;
          if (!disposed) handlers.onSaved(saved);
        } catch (error) {
          if (!disposed) handlers.onError(error);
        }
      });
    }
    return chain;
  };

  return {
    schedule(scenes) {
      if (disposed) return;
      pending = scenes;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush(), delayMs);
    },
    flush,
    dispose() {
      disposed = true;
      if (timer) clearTimeout(timer);
      pending = null;
    },
  };
}
