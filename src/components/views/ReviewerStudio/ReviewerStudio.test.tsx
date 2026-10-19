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
