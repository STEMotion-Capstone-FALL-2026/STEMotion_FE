import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { apiClient, authService, workspaceService, projectService, reviewService, compositionService } from './services';

// Keep App's real state, services, saver and modal; substitute only heavy view presentation.
vi.mock('./components/layout/HeaderNav', () => ({ HeaderNav: (p: any) => <><button onClick={p.onOpenCreateProjectModal}>Create project</button><button onClick={p.onNavigateToDashboard}>Dashboard</button></> }));
vi.mock('./components/views/ProjectDashboard/ProjectDashboardView', () => ({ ProjectDashboardView: (p: any) => <button onClick={() => p.onSelectProject(p.scripts[0]?.id)}>Open project</button> }));
vi.mock('./components/views/ProducerStudio/ProducerStudio', () => ({ ProducerStudio: (p: any) => <div>
  <span>{p.script.scenes[0]?.title}</span>
  <button onClick={() => p.updateSceneProperty((s: any) => ({ ...s, title: 'Unsaved edit' }))}>Edit scene</button>
  <button disabled={p.isSyncingDurations || p.isSubmittingForReview} onClick={p.onSyncDurations}>Sync</button>
  <button disabled={p.isSyncingDurations || p.isSubmittingForReview} onClick={p.onSubmitForReview}>Submit video</button>
</div> }));

const scene = { id: 's', type: 'TITLE_HERO', title: 'Script', narration: 'Hello', durationInFrames: 90 };
const project = { id: 'p', title: 'Project', scenes: [scene], subject: 'Physics', scriptStatus: 'APPROVED', videoStatus: 'NOT_RENDERED' } as any;
const draft = { projectId: 'p', revision: 1, scriptVersionNo: 1, editable: true, scenes: [{ ...scene, title: 'Saved draft' }] } as any;
beforeEach(() => {
  vi.spyOn(apiClient, 'getAuthToken').mockReturnValue('local-test');
  const profile = { id: 'u', name: 'UX', email: 'ux@example.test', role: 'producer' } as any;
  vi.spyOn(authService, 'getCurrentUser').mockReturnValue(profile);
  vi.spyOn(authService, 'fetchCurrentUser').mockResolvedValue(profile);
  vi.spyOn(workspaceService, 'getCachedWorkspaceId').mockReturnValue('ws');
  vi.spyOn(workspaceService, 'getMyWorkspaces').mockResolvedValue([{ id: 'ws', name: 'Test', myRole: 'producer' }] as any);
  vi.spyOn(projectService, 'getProjects').mockResolvedValue([project]);
  vi.spyOn(projectService, 'getProjectById').mockResolvedValue(project);
  vi.spyOn(reviewService, 'getComments').mockResolvedValue([]);
  vi.spyOn(compositionService, 'get').mockResolvedValue(draft);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function openProducer() {
  render(<App />);
  await screen.findByRole('button', { name: 'Open project' });
  fireEvent.click(screen.getByRole('button', { name: 'Open project' }));
  await screen.findByText('Saved draft');
}
describe('App UX workflow integration', () => {
  it('does not replace an unsaved project when creating another project', async () => {
    vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('Save failed'));
    const create = vi.spyOn(projectService, 'createProject');
    await openProducer();
    fireEvent.click(screen.getByRole('button', { name: 'Edit scene' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
    fireEvent.change(screen.getByLabelText('Chủ đề bài học STEM:'), { target: { value: 'New project draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo & mở Writer Studio' }));
    await screen.findByText('Chưa lưu được dự án đang mở. Hãy lưu lại trước khi tạo dự án khác.');
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByText('Unsaved edit')).toBeTruthy();
    expect(screen.getByDisplayValue('New project draft')).toBeTruthy();
  });
  it('waits for the saved revision before sync and unlocks after a 503 response', async () => {
    let finish!: (value: any) => void;
    const put = vi.spyOn(apiClient, 'put').mockImplementationOnce(() => new Promise(done => { finish = done; }));
    const post = vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('503 unavailable'));
    await openProducer();
    fireEvent.click(screen.getByRole('button', { name: 'Edit scene' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sync' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Submit video' }).hasAttribute('disabled')).toBe(true);
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    await act(async () => finish({ ...draft, revision: 7, scenes: [{ ...scene, title: 'Unsaved edit' }] }));
    await screen.findByText('503 unavailable');
    expect(post).toHaveBeenCalledWith('/scripts/p/sync-durations', { baseRevision: 7 });
    expect(screen.getByText('Unsaved edit')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sync' }).hasAttribute('disabled')).toBe(false);
  });

  it('keeps an unsaved composition visible when navigation is requested after a failed save', async () => {
    vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('Save failed'));
    await openProducer();
    fireEvent.click(screen.getByRole('button', { name: 'Edit scene' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    await screen.findByText(/Chưa lưu được thay đổi/);
    expect(screen.getByText('Unsaved edit')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open project' })).toBeNull();
  });
  it('keeps the actual create modal open when the App callback fails', async () => {
    vi.spyOn(projectService, 'createProject').mockRejectedValue(new Error('Create failed'));
    render(<App />);
    await screen.findByRole('button', { name: 'Open project' });
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
    fireEvent.change(screen.getByLabelText('Chủ đề bài học STEM:'), { target: { value: 'Keep this title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo & mở Writer Studio' }));
    await screen.findByText('Create failed');
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect((screen.getByLabelText('Chủ đề bài học STEM:') as HTMLInputElement).value).toBe('Keep this title');
  });

  it('blocks sync after autosave fails and keeps the edited composition visible', async () => {
    vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('Save failed'));
    const post = vi.spyOn(apiClient, 'post');
    await openProducer();
    fireEvent.click(screen.getByRole('button', { name: 'Edit scene' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    await screen.findAllByText('Save failed');
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText('Unsaved edit')).toBeTruthy();
  });

  it('does not announce success if sync succeeds but reloading composition fails', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ scenes: [{ id: 's', durationInFrames: 180 }], totalDurationSeconds: 6 });
    const get = vi.mocked(compositionService.get);
    get.mockResolvedValueOnce(draft).mockRejectedValueOnce(new Error('Reload failed'));
    await openProducer();
    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    await screen.findByText(/Không mở được bản dựng: Reload failed/);
    expect(screen.queryByText('Đã đồng bộ thời lượng các phân cảnh theo giọng đọc AI thành công!')).toBeNull();
  });

  it('reloads a conflict and does not automatically repeat a sync mutation', async () => {
    const post = vi.spyOn(apiClient, 'post').mockRejectedValue(Object.assign(new Error('Conflict'), { status: 409 }));
    vi.mocked(compositionService.get).mockResolvedValueOnce(draft).mockResolvedValueOnce({ ...draft, revision: 2, scenes: [{ ...scene, title: 'Newest draft' }] });
    await openProducer();
    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    await screen.findByText('Newest draft');
    expect(post).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sync' }).hasAttribute('disabled')).toBe(false));
  });
});
