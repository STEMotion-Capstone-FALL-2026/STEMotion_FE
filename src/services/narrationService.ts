import { apiClient } from './apiClient';

export interface SyncDurationsResponse {
  target: 'SCRIPT' | 'COMPOSITION';
  revision?: number | null;
  totalDurationSeconds: number;
  scenes: {
    id: string;
    durationInFrames?: number;
    captionWords?: any[];
  }[];
  captionSync?: any;
}

export const narrationService = {
  /**
   * Fetches synthesized TTS audio stream from BE proxy.
   * Uses Authorization header with JWT and returns a playable Blob Object URL.
   */
  async getTtsPreview(projectId: string, text?: string, sceneId?: string): Promise<string> {
    const baseUrl = apiClient.getBaseUrl();
    const token = apiClient.getAuthToken();
    const params = new URLSearchParams();
    if (text) params.append('text', text);
    if (sceneId) params.append('sceneId', sceneId);

    const response = await fetch(`${baseUrl}/scripts/${projectId}/tts-preview?${params.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TTS Preview thất bại (${response.status}): ${errText || response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  /**
   * Times scenes accurately using real TTS and Whisper forced alignment.
   * If baseRevision is provided (Producer Studio), saves a new composition revision.
   */
  async syncDurations(projectId: string, baseRevision?: number): Promise<SyncDurationsResponse> {
    const payload = baseRevision !== undefined ? { baseRevision } : {};
    return apiClient.post<SyncDurationsResponse>(`/scripts/${projectId}/sync-durations`, payload);
  },
};
