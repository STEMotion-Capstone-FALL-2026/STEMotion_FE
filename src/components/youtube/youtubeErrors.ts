import { ApiError } from '../../services/apiClient';

/** The YouTube-specific answers of the API, worded for the person who pressed the button. */
export function youtubeErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === 'PUBLISH_TARGET_UNAVAILABLE' || (error.status === 503 && /youtube/i.test(error.message))) return 'YouTube đang tắt trên máy chủ.';
  if (error.code === 'YOUTUBE_NOT_CONNECTED') return 'Workspace chưa kết nối kênh YouTube.';
  if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (error.status === 409 && error.code !== 'STEM_FINGERPRINT_STALE' && error.code !== 'STEM_STALE_TARGET') return 'Video này đã được gửi lên YouTube.';
  return null;
}

export const isYoutubeUnavailable = (error: unknown) =>
  error instanceof ApiError && (error.code === 'PUBLISH_TARGET_UNAVAILABLE' || error.status === 503);
