import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PublishModal } from './PublishModal';
import { projectService } from '../../services/projectService';
import { STEMScript } from '../../types/stem';
import { publicationService } from '../../services/publicationService';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const script: STEMScript = { id: 'project', title: 'STEM', subject: 'Math', gradeLevel: '10',
  scriptStatus: 'APPROVED', videoStatus: 'IN_QA', scenes: [], videoUrl: 'https://storage.example/clip.mp4' };

describe('existing video export', () => {
  it('does not attach a delayed publication result to a different project', async () => {
    let resolve!: (value: any) => void;
    vi.spyOn(publicationService,'publishInternal').mockReturnValue(new Promise(r => { resolve = r; }));
    const notify=vi.fn();
    const view=render(<PublishModal isOpen canPublish onClose={() => {}} script={{...script,videoStatus:'APPROVED'}} onNotify={notify} />);
    fireEvent.click(screen.getByRole('button',{name:/Xuất bản vào thư viện/}));
    view.rerender(<PublishModal isOpen canPublish onClose={() => {}} script={{...script,id:'other',videoStatus:'APPROVED'}} onNotify={notify} />);
    resolve({id:'publication',projectId:'project',lmsEmbedCode:'old embed',youtubeUrl:null,publishedAt:'2026-10-10'});
    await waitFor(() => expect(screen.getByRole('button',{name:/Xuất bản vào thư viện/}).hasAttribute('disabled')).toBe(false));
    expect(notify).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Mã nhúng LMS')).toBeNull();
  });
  it('publishes through BE and only displays returned embed after success', async () => {
    const notify = vi.fn();
    const refreshed = vi.fn().mockResolvedValue(undefined);
    const publish = vi.spyOn(publicationService, 'publishInternal').mockResolvedValue({
      id: 'publication', projectId: script.id, lmsEmbedCode: '<iframe src="https://storage.example/clip.mp4"></iframe>',
      youtubeUrl: null, publishedAt: '2026-10-10',
    });
    render(<PublishModal isOpen canPublish onClose={() => {}} script={{...script,videoStatus:'APPROVED'}}
      onNotify={notify} onPublished={refreshed} />);
    fireEvent.click(screen.getByRole('button', {name: /Xuất bản vào thư viện/}));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Đã xuất bản video vào thư viện nội bộ.', 'success'));
    expect(publish).toHaveBeenCalledWith(script.id,script.title);
    expect((screen.getByLabelText('Mã nhúng LMS') as HTMLTextAreaElement).value).toContain('https://storage.example/clip.mp4');
    expect(refreshed).toHaveBeenCalled();
  });

  it('does not mark a failed publication as published', async () => {
    const notify = vi.fn();
    vi.spyOn(publicationService,'publishInternal').mockRejectedValue(new Error('QA failed'));
    render(<PublishModal isOpen canPublish onClose={() => {}} script={{...script,videoStatus:'APPROVED'}} onNotify={notify} />);
    fireEvent.click(screen.getByRole('button', {name: /Xuất bản vào thư viện/}));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('QA failed','warn'));
    expect(screen.queryByLabelText('Mã nhúng LMS')).toBeNull();
    expect(screen.queryByRole('button',{name:'Đã xuất bản vào thư viện'})).toBeNull();
  });
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
