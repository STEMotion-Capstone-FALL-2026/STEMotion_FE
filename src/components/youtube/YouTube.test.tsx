import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { apiClient, ApiError } from '../../services/apiClient';
import { clearYouTubeReturn, parseYouTubeReturnPath, peekYouTubeReturn, resetYouTubeReturnForTest, youtubeService } from '../../services/youtubeService';
import { publicationService, type PublicationResponse } from '../../services/publicationService';
import { YouTubeChannelPanel } from './YouTubeChannelPanel';
import { POLL_INTERVAL_MS, YouTubeUploadStatus } from './YouTubeUploadStatus';
import { PublishModal } from '../modals/PublishModal';
import * as stemClient from '../../services/stemClient';
import type { STEMScript } from '../../types/stem';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const publication = (patch: Partial<PublicationResponse> = {}): PublicationResponse => ({
  id: 'TEST_ONLY_pub', projectId: 'TEST_ONLY_project', lmsEmbedCode: null, youtubeUrl: null, publishedAt: '2026-11-14T10:00:00', uploadStatus: 'PENDING', uploadError: null, externalId: null, ...patch,
});

describe('services', () => {
  it('youtubeService calls the workspace endpoints and refuses a non-https consent URL', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ connected: false });
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=x' });
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined);
    await youtubeService.getConnection('ws 1');
    expect(get).toHaveBeenCalledWith('/workspaces/ws%201/youtube');
    expect(await youtubeService.startConnect('ws')).toBe('https://accounts.google.com/o/oauth2/v2/auth?state=x');
    expect(post).toHaveBeenCalledWith('/workspaces/ws/youtube/connect');
    await youtubeService.disconnect('ws');
    expect(del).toHaveBeenCalledWith('/workspaces/ws/youtube');
    post.mockResolvedValue({ authorizationUrl: 'javascript:alert(1)' });
    await expect(youtubeService.startConnect('ws')).rejects.toThrow();
  });

  it('reads the Google return path once per page load until handled', () => {
    expect(parseYouTubeReturnPath('/workspaces/abc-1/settings')).toBe('abc-1');
    expect(parseYouTubeReturnPath('/workspaces/abc-1/settings/')).toBe('abc-1');
    expect(parseYouTubeReturnPath('/workspaces/abc/other')).toBeNull();
    expect(parseYouTubeReturnPath('/')).toBeNull();
    resetYouTubeReturnForTest();
    expect(peekYouTubeReturn('/workspaces/w9/settings')).toBe('w9');
    expect(peekYouTubeReturn('/')).toBe('w9'); // a second render reads the same value
    clearYouTubeReturn();
    expect(peekYouTubeReturn('/workspaces/w9/settings')).toBeNull();
    resetYouTubeReturnForTest();
  });

  it('publishYoutube sends all three targets on first publish and YOUTUBE alone on a retry', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(publication());
    const metadata = { title: '  Đèn dung nham  ', description: ' ', tags: [' STEM ', '', 'VatLi'], privacyStatus: 'private' as const, selfDeclaredMadeForKids: false };
    await publicationService.publishYoutube('p', metadata, { retryFailedUpload: false, idempotencyKey: 'TEST_ONLY_key' });
    expect(post.mock.calls[0]).toEqual(['/scripts/p/publish', { targets: ['INTERNAL_LIBRARY', 'LMS', 'YOUTUBE'], title: 'Đèn dung nham', tags: ['STEM', 'VatLi'], privacyStatus: 'private', selfDeclaredMadeForKids: false, idempotencyKey: 'TEST_ONLY_key' }]);
    await publicationService.publishYoutube('p', metadata, { retryFailedUpload: true, idempotencyKey: 'TEST_ONLY_key2' });
    expect((post.mock.calls[1][1] as { targets: string[] }).targets).toEqual(['YOUTUBE']);
  });
});

describe('YouTubeChannelPanel', () => {
  it('shows connect only to someone who may manage the channel, and sends the browser to Google', async () => {
    vi.spyOn(youtubeService, 'getConnection').mockResolvedValue({ connected: false });
    vi.spyOn(youtubeService, 'startConnect').mockResolvedValue('https://accounts.google.com/consent');
    const navigate = vi.fn();
    const { rerender } = render(<YouTubeChannelPanel workspaceId="ws" canManage={false} navigate={navigate} />);
    expect(await screen.findByText('Chưa kết nối kênh YouTube.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Kết nối kênh YouTube' })).toBeNull();
    rerender(<YouTubeChannelPanel workspaceId="ws" canManage navigate={navigate} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Kết nối kênh YouTube' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('https://accounts.google.com/consent'));
  });

  it('asks before disconnecting and never prints the channel id', async () => {
    vi.spyOn(youtubeService, 'getConnection').mockResolvedValue({ connected: true, channelId: 'UC_TEST_ONLY_raw', channelTitle: 'Kênh STEM', connectedAt: '2026-11-12T23:30:00' });
    const disconnect = vi.spyOn(youtubeService, 'disconnect').mockResolvedValue(undefined);
    const { container } = render(<YouTubeChannelPanel workspaceId="ws" canManage />);
    expect(await screen.findByText('Đã kết nối: Kênh STEM')).toBeTruthy();
    expect(container.textContent).not.toContain('UC_TEST_ONLY_raw');
    fireEvent.click(screen.getByRole('button', { name: 'Ngắt kết nối' }));
    expect(disconnect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận ngắt kết nối' }));
    await waitFor(() => expect(disconnect).toHaveBeenCalledWith('ws'));
  });

  it('announces the result once after Google returns', async () => {
    vi.spyOn(youtubeService, 'getConnection').mockResolvedValue({ connected: true, channelTitle: 'Kênh STEM' });
    const notify = vi.fn();
    render(<YouTubeChannelPanel workspaceId="ws" canManage announceReturn onNotify={notify} />);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Đã kết nối kênh YouTube: Kênh STEM.', 'success'));
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('a refused disconnect says the person lacks the right', async () => {
    vi.spyOn(youtubeService, 'getConnection').mockResolvedValue({ connected: true, channelTitle: 'Kênh STEM' });
    vi.spyOn(youtubeService, 'disconnect').mockRejectedValue(new ApiError('Forbidden', 'FORBIDDEN', 403));
    render(<YouTubeChannelPanel workspaceId="ws" canManage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ngắt kết nối' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận ngắt kết nối' }));
    expect(await screen.findByText('Bạn không có quyền thực hiện thao tác này.')).toBeTruthy();
  });
});

describe('YouTubeUploadStatus', () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it('polls every 5 seconds while uploading and stops once uploaded', async () => {
    const list = vi.spyOn(publicationService, 'listPublications')
      .mockResolvedValueOnce([publication({ uploadStatus: 'UPLOADING' })])
      .mockResolvedValueOnce([publication({ uploadStatus: 'UPLOADED', youtubeUrl: 'https://youtu.be/TEST_ONLY' })]);
    render(<YouTubeUploadStatus projectId="TEST_ONLY_project" initial={publication()} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('YouTube: đang tải lên…')).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS); });
    expect(screen.getByRole('link', { name: 'Mở video trên YouTube' }).getAttribute('rel')).toBe('noopener noreferrer');
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3); });
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('a failed upload offers a retry and polling stops', async () => {
    const list = vi.spyOn(publicationService, 'listPublications').mockResolvedValue([publication({ uploadStatus: 'FAILED', uploadError: 'quota' })]);
    const retry = vi.fn();
    render(<YouTubeUploadStatus projectId="TEST_ONLY_project" initial={publication()} onRetry={retry} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('YouTube: tải lên thất bại: quota')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Đăng lại lên YouTube' }));
    expect(retry).toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3); });
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('stops polling when unmounted', async () => {
    const list = vi.spyOn(publicationService, 'listPublications').mockResolvedValue([publication({ uploadStatus: 'PENDING' })]);
    const view = render(<YouTubeUploadStatus projectId="TEST_ONLY_project" initial={publication()} />);
    await act(async () => { await Promise.resolve(); });
    view.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3); });
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('a project never sent to YouTube is read once and shows nothing', async () => {
    const list = vi.spyOn(publicationService, 'listPublications').mockResolvedValue([publication({ uploadStatus: null })]);
    const { container } = render(<YouTubeUploadStatus projectId="TEST_ONLY_project" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3); });
    expect(list).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('');
  });
});

describe('PublishModal with YouTube', () => {
  const script: STEMScript = { id: 'TEST_ONLY_yt', title: 'Đèn dung nham', subject: 'Physics', gradeLevel: '8', scriptStatus: 'APPROVED', videoStatus: 'APPROVED', scenes: [], videoUrl: 'https://example.invalid/v.mp4', workspaceId: 'ws' };
  beforeEach(() => {
    vi.spyOn(stemClient, 'getArtifactStatus').mockRejectedValue(new Error('TEST_ONLY no artifact'));
    vi.spyOn(youtubeService, 'getConnection').mockResolvedValue({ connected: true, channelTitle: 'Kênh STEM' });
    vi.spyOn(publicationService, 'listPublications').mockResolvedValue([publication()]);
  });
  const open = () => render(<PublishModal isOpen canPublish script={script} onClose={() => {}} onNotify={() => {}} />);
  const toggle = () => fireEvent.click(screen.getByRole('button', { name: /Đăng kèm lên YouTube/ }));
  const publishButton = () => screen.getByRole('button', { name: /Xuất bản vào thư viện/ });

  it('library-only publish stays as before; YouTube adds the form and sends one request with all targets', async () => {
    const internal = vi.spyOn(publicationService, 'publishInternal');
    const youtube = vi.spyOn(publicationService, 'publishYoutube').mockResolvedValue(publication());
    open();
    expect(screen.queryByLabelText('Thông tin video YouTube')).toBeNull();
    toggle();
    expect(await screen.findByText('Đã kết nối: Kênh STEM')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Thẻ (cách nhau bằng dấu phẩy)'), { target: { value: 'STEM, VatLi' } });
    fireEvent.click(publishButton());
    await waitFor(() => expect(youtube).toHaveBeenCalledWith(script.id,
      expect.objectContaining({ title: 'Đèn dung nham', tags: ['STEM', 'VatLi'], privacyStatus: 'private', selfDeclaredMadeForKids: false }),
      expect.objectContaining({ retryFailedUpload: false, idempotencyKey: expect.any(String) })));
    expect(internal).not.toHaveBeenCalled();
    expect(await screen.findByText('YouTube: đang chờ tải lên…')).toBeTruthy();
  });

  it('an empty YouTube title blocks the publish button', async () => {
    open(); toggle();
    fireEvent.change(screen.getByLabelText('Tiêu đề YouTube'), { target: { value: '   ' } });
    expect(publishButton().hasAttribute('disabled')).toBe(true);
  });

  it.each([
    ['PUBLISH_TARGET_UNAVAILABLE', 503, 'YouTube đang tắt trên máy chủ.'],
    ['YOUTUBE_NOT_CONNECTED', 409, 'Workspace chưa kết nối kênh YouTube.'],
    ['CONFLICT', 409, 'Video này đã được gửi lên YouTube.'],
    ['FORBIDDEN', 403, 'Bạn không có quyền thực hiện thao tác này.'],
  ])('%s is explained and the library path stays open', async (code, status, message) => {
    vi.spyOn(publicationService, 'publishYoutube').mockRejectedValue(new ApiError('TEST_ONLY', code, status));
    open(); toggle();
    fireEvent.click(publishButton());
    expect(await screen.findByText(message)).toBeTruthy();
    if (code === 'PUBLISH_TARGET_UNAVAILABLE') {
      expect(screen.getByText(/chỉ xuất bản vào thư viện/)).toBeTruthy();
      expect(screen.queryByRole('button', { name: /Đăng kèm lên YouTube/ })).toBeNull();
    }
    expect(publishButton().hasAttribute('disabled')).toBe(false);
  });

  it('a STEM fingerprint conflict keeps the STEM recovery path instead of a YouTube message', async () => {
    vi.spyOn(publicationService, 'publishYoutube').mockRejectedValue(new ApiError('Content changed after review', 'STEM_FINGERPRINT_STALE', 409));
    open(); toggle();
    fireEvent.click(publishButton());
    await waitFor(() => expect(publishButton().hasAttribute('disabled')).toBe(true));
    expect(screen.queryByText('Video này đã được gửi lên YouTube.')).toBeNull();
  });

  it('a published project with a failed upload can be sent again with YOUTUBE alone', async () => {
    vi.mocked(publicationService.listPublications).mockResolvedValue([publication({ uploadStatus: 'FAILED', uploadError: 'quota' })]);
    const youtube = vi.spyOn(publicationService, 'publishYoutube').mockResolvedValue(publication());
    render(<PublishModal isOpen canPublish script={{ ...script, videoStatus: 'PUBLISHED' }} onClose={() => {}} onNotify={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Đăng lại lên YouTube' }));
    fireEvent.click(screen.getByRole('button', { name: 'Gửi lại lên YouTube' }));
    await waitFor(() => expect(youtube).toHaveBeenCalledWith(script.id, expect.anything(), expect.objectContaining({ retryFailedUpload: true })));
  });
});
