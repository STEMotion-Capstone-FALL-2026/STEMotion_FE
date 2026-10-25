import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { projectService } from '../../services/projectService';
import { VersionDiffModal } from './VersionDiffModal';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('loads actual version content and retries a failed history request', async () => {
  vi.spyOn(projectService, 'getVersions').mockRejectedValueOnce(new Error('Offline')).mockResolvedValue([
    { id: 'v2', versionNo: 2, title: 'Newest' }, { id: 'v1', versionNo: 1, title: 'Original' },
  ] as any);
  const diff = vi.spyOn(projectService, 'diffVersions').mockResolvedValue({
    leftScenes: [{ id: 'a', title: 'Old scene', narration: 'Before' }],
    rightScenes: [{ id: 'b', title: 'New scene', narration: 'After' }],
  } as any);
  render(<VersionDiffModal isOpen projectId="p" onClose={vi.fn()} />);
  await screen.findByText('Offline');
  fireEvent.click(screen.getByRole('button', { name: 'Thử tải lại' }));
  await screen.findByText('After');
  expect(screen.getByText('Before')).toBeTruthy();
  expect(diff).toHaveBeenCalledWith('p', 'v1', 'v2');
});

it('ignores a late version history for the previous project', async () => {
  let finish!: (value: any) => void;
  vi.spyOn(projectService, 'getVersions').mockImplementationOnce(() => new Promise(done => { finish = done; })).mockResolvedValue([]);
  const { rerender } = render(<VersionDiffModal isOpen projectId="old" onClose={vi.fn()} />);
  rerender(<VersionDiffModal isOpen projectId="new" onClose={vi.fn()} />);
  await screen.findByText('Cần ít nhất hai phiên bản đã lưu để so sánh.');
  await act(async () => finish([{ id: 'old-version', versionNo: 1, title: 'Stale' }]));
  expect(screen.queryByText(/Stale/)).toBeNull();
});
