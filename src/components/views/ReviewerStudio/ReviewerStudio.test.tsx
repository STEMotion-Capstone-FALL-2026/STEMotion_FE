import type { ComponentProps } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compositionService, reviewService } from '../../../services';
import type { Composition } from '../../../services';
import { ReviewerStudio } from './ReviewerStudio';

vi.mock('../../RemotionPlayerWrapper', () => ({
  RemotionPlayerWrapper: ({ script }: any) => <div data-testid="review-player">{script.scenes[0].title}</div>,
}));
vi.mock('../../modals/ClipCompareModal', () => ({ ClipCompareModal: () => null }));

const scene = { id: 's1', title: 'Kịch bản gốc', type: 'TITLE_HERO', durationInFrames: 90, narration: 'Hello' };
function props(id = 'p'): ComponentProps<typeof ReviewerStudio> {
  return {
    script: { id, title: 'Project', scriptStatus: 'APPROVED', videoStatus: 'IN_QA', scenes: [scene], fps: 30 },
    selectedScene: scene, reviewerMode: 'video', comments: [], currentSec: 0,
    newCommentInput: '', seekTimestampSec: null,
    setScript: vi.fn(), setReviewerMode: vi.fn(), setActiveSceneId: vi.fn(),
    setCurrentSec: vi.fn(), setSeekTimestampSec: vi.fn(), setNewCommentInput: vi.fn(),
    handleAddComment: vi.fn(), onRoleChange: vi.fn(), onOpenPublishModal: vi.fn(), showToast: vi.fn(),
  } as unknown as ComponentProps<typeof ReviewerStudio>;
}
const composition = (id = 'p'): Composition => ({
  projectId: id, revision: 2, scriptVersionNo: 1, editable: false,
  scenes: [{ ...scene, title: `Bản dựng ${id}` }] as any,
});

beforeEach(() => {
  vi.spyOn(reviewService, 'getQaReport').mockResolvedValue({ passed: true, findings: [], failCount: 0, warnCount: 0 } as any);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('reviewing the producer composition', () => {
  it('retains the rejection reason when saving fails and guards repeated confirmation', async () => {
    vi.spyOn(compositionService, 'get').mockResolvedValue(composition());
    let fail!: (error: Error) => void;
    const send = vi.spyOn(reviewService, 'sendBackVideo').mockImplementation(() => new Promise((_, reject) => { fail = reject; }));
    render(<ReviewerStudio {...props()} />);
    await screen.findByTestId('review-player');
    fireEvent.click(screen.getByRole('button', { name: 'Yêu Cầu Producer Sửa Clip' }));
    fireEvent.change(screen.getByPlaceholderText(/Phụ đề chạy/), { target: { value: 'Giữ lý do khi mất mạng' } });
    const confirm = screen.getByRole('button', { name: 'Gửi Yêu Cầu Chỉnh Sửa' });
    act(() => { fireEvent.click(confirm); fireEvent.click(confirm); });
    expect(send).toHaveBeenCalledTimes(1);
    await act(async () => fail(new Error('Offline')));
    expect(screen.getByDisplayValue('Giữ lý do khi mất mạng')).toBeTruthy();
    expect(confirm.hasAttribute('disabled')).toBe(false);
  });
  it('locks a comment action while saving and displays the server resolver', async () => {
    vi.spyOn(compositionService, 'get').mockResolvedValue(composition());
    let finish!: (value: any) => void;
    const resolve = vi.spyOn(reviewService, 'resolveComment').mockImplementation(() => new Promise(done => { finish = done; }));
    const input = props();
    input.comments = [{ id: 'c', content: 'Fix scene', author: 'Reviewer', status: 'OPEN', timestampSec: 0 } as any];
    render(<ReviewerStudio {...input} />);
    await screen.findByTestId('review-player');
    const button = screen.getByRole('button', { name: /Đánh dấu đã sửa/ });
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(button.hasAttribute('disabled')).toBe(true);
    await act(async () => finish({ ...input.comments[0], status: 'RESOLVED', resolvedByName: 'Nguyen An', resolvedAt: '2026-10-23T10:00:00Z' }));
    expect(screen.getByText('Đã sửa bởi Nguyen An')).toBeTruthy();
  });

  it('blocks approval on a failed load, never shows the original script, and allows retry', async () => {
    vi.spyOn(compositionService, 'get').mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(composition());
    const approve = vi.spyOn(reviewService, 'approveVideo');
    render(<ReviewerStudio {...props()} />);
    const button = screen.getByRole('button', { name: /Duyệt Video ➔/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await screen.findByRole('alert');
    expect(screen.queryByTestId('review-player')).toBeNull();
    fireEvent.click(button);
    expect(approve).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Tải lại bản dựng' }));
    await waitFor(() => expect(screen.getByTestId('review-player').textContent).toBe('Bản dựng p'));
    expect(button.disabled).toBe(false);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('ignores an old project response arriving after a new project is loaded', async () => {
    let finishOld!: (value: Composition) => void;
    vi.spyOn(compositionService, 'get')
      .mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; }))
      .mockResolvedValueOnce(composition('new'));
    const { rerender } = render(<ReviewerStudio {...props('old')} />);
    rerender(<ReviewerStudio {...props('new')} />);
    await waitFor(() => expect(screen.getByTestId('review-player').textContent).toBe('Bản dựng new'));
    await act(async () => { finishOld(composition('old')); });
    expect(screen.getByTestId('review-player').textContent).toBe('Bản dựng new');
  });

  it('sends only one approval while the decision is pending, then unlocks after failure', async () => {
    vi.spyOn(compositionService, 'get').mockResolvedValue(composition());
    let fail!: (error: Error) => void;
    const approve = vi.spyOn(reviewService, 'approveVideo').mockImplementation(() => new Promise((_, reject) => { fail = reject; }));
    const input = props();
    render(<ReviewerStudio {...input} />);
    await screen.findByTestId('review-player');
    const button = screen.getByRole('button', { name: /Duyệt Video ➔/ }) as HTMLButtonElement;
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    expect(approve).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Đang lưu quyết định');
    await act(async () => { fail(new Error('Offline')); });
    expect(button.disabled).toBe(false);
    expect(input.showToast).toHaveBeenCalledWith('Offline', 'warn');
  });
});
