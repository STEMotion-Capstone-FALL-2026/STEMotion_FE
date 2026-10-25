import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { libraryService, type LibraryItem } from '../../../services/libraryService';
import { MediaLibraryView } from './MediaLibraryView';

const clip = (title: string, subject = 'Physics'): LibraryItem => ({
  id: title, title, subject: subject as any, gradeLevel: 'General', totalDurationSeconds: 30,
  sceneCount: 1, ownerName: 'Writer', workspaceName: 'STEM', videoUrl: 'https://example.com/v.mp4',
  embedCode: '<iframe />', publishedAt: '',
});
const props = { script: { videoStatus: 'NOT_RENDERED' } as any, onOpenPublishModal: vi.fn() };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('library loading states', () => {
  it('shows an error instead of a false empty state and allows retry', async () => {
    vi.spyOn(libraryService, 'getPublishedClips').mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([clip('Recovered')]);
    render(<MediaLibraryView {...props} />);
    expect((await screen.findByRole('alert')).textContent).toContain('Offline');
    expect(screen.queryByText('Chưa có video bài giảng nào trong Thư viện học liệu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Thử tải lại' }));
    await screen.findByText('Recovered');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps previously loaded clips when a refresh fails', async () => {
    vi.spyOn(libraryService, 'getPublishedClips').mockResolvedValueOnce([clip('Existing')]).mockRejectedValueOnce(new Error('Offline'));
    render(<MediaLibraryView {...props} />);
    await screen.findByText('Existing');
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới' }));
    await screen.findByRole('alert');
    expect(screen.getByText('Existing')).toBeTruthy();
    expect(screen.getByText('Đang hiển thị dữ liệu đã tải trước đó.')).toBeTruthy();
  });

  it('ignores an old subject response and does not refetch unused filter metadata', async () => {
    let finishOld!: (rows: LibraryItem[]) => void;
    const load = vi.spyOn(libraryService, 'getPublishedClips')
      .mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
      .mockResolvedValueOnce([clip('Chemistry result', 'Chemistry')]);
    const filters = vi.spyOn(libraryService, 'getFilters');
    render(<MediaLibraryView {...props} />);
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('Lọc theo môn học'), { target: { value: 'Chemistry' } });
    await screen.findByText('Chemistry result');
    await act(async () => finishOld([clip('Stale result')]));
    expect(screen.queryByText('Stale result')).toBeNull();
    expect(filters).not.toHaveBeenCalled();
  });
});
