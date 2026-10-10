import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PublishModal } from './PublishModal';
import { projectService } from '../../services/projectService';
import { STEMScript } from '../../types/stem';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const script: STEMScript = { id: 'project', title: 'STEM', subject: 'Math', gradeLevel: '10',
  scriptStatus: 'APPROVED', videoStatus: 'IN_QA', scenes: [], videoUrl: 'https://storage.example/clip.mp4' };

describe('existing video export', () => {
  it('does not expose fake publication success or a fabricated YouTube link', () => {
    render(<PublishModal isOpen onClose={() => {}} script={script} onNotify={() => {}} />);
    expect(screen.queryByText(/đã được tải lên/i)).toBeNull();
    expect(screen.getByText(/Xuất YouTube chưa khả dụng/)).toBeTruthy();
  });

  it('reports server failure without rendering directly from the browser', async () => {
    const notify = vi.fn();
    vi.spyOn(projectService, 'getProjectById').mockRejectedValue(new Error('Forbidden'));
    const fetch = vi.spyOn(globalThis, 'fetch');
    render(<PublishModal isOpen onClose={() => {}} script={script} onNotify={notify} />);
    fireEvent.click(screen.getByRole('button', { name: /tải video MP4/i }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Forbidden', 'warn'));
    expect(fetch).not.toHaveBeenCalled();
  });
});
