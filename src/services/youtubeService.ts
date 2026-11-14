import { apiClient } from './apiClient';

/** A workspace's YouTube channel as the API reports it; tokens never leave the server. */
export interface YouTubeConnection {
  connected: boolean;
  channelId?: string | null;
  channelTitle?: string | null;
  connectedBy?: string | null;
  connectedAt?: string | null;
}

const base = (workspaceId: string) => `/workspaces/${encodeURIComponent(workspaceId)}/youtube`;

export const youtubeService = {
  getConnection(workspaceId: string): Promise<YouTubeConnection> {
    return apiClient.get<YouTubeConnection>(base(workspaceId));
  },

  /** Asks the API for Google's consent page; the caller sends the browser there. */
  async startConnect(workspaceId: string): Promise<string> {
    const response = await apiClient.post<{ authorizationUrl: string }>(`${base(workspaceId)}/connect`);
    const url = new URL(response.authorizationUrl);
    if (url.protocol !== 'https:') throw new Error('Địa chỉ kết nối YouTube không hợp lệ.');
    return url.href;
  },

  disconnect(workspaceId: string): Promise<void> {
    return apiClient.delete<void>(base(workspaceId));
  },
};

/** Google sends the browser back to `/workspaces/{id}/settings` after the channel is connected. */
export function parseYouTubeReturnPath(pathname: string): string | null {
  const match = /^\/workspaces\/([^/]+)\/settings\/?$/.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

// Read once per page load and kept until handled, so React's double render in StrictMode reads the same value.
let pendingReturn: string | null | undefined;

/** The workspace Google returned to on this page load, until clearYouTubeReturn() is called. */
export function peekYouTubeReturn(pathname: string = window.location.pathname): string | null {
  if (pendingReturn === undefined) pendingReturn = parseYouTubeReturnPath(pathname);
  return pendingReturn;
}

export function clearYouTubeReturn(): void {
  pendingReturn = null;
}

/** Tests only: forget what this page load returned to. */
export function resetYouTubeReturnForTest(): void {
  pendingReturn = undefined;
}
