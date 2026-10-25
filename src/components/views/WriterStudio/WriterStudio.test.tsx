import type { ComponentProps } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { WriterStudio } from './WriterStudio';
import { narrationService, reviewService } from '../../../services';
import { sceneSaveQueue } from '../../../services/sceneSaveQueue';

const scene = { id: 's', title: 'Scene', narration: 'Hello', type: 'TITLE_HERO', durationInFrames: 90 };
function props(id = 'p'): ComponentProps<typeof WriterStudio> {
  return { script: { id, title: 'Project', scriptStatus: 'DRAFT', scenes: [scene], fps: 30 }, selectedScene: scene,
    setScript: vi.fn(), setActiveSceneId: vi.fn(), updateSceneProperty: vi.fn(), handleAddNewScene: vi.fn(),
    handleDeleteScene: vi.fn(), handleMoveScene: vi.fn(), handleReorderScenes: vi.fn(), onOpenCreateProjectModal: vi.fn(),
    onOpenVersionDiffModal: vi.fn(), onOpenTemplateCatalog: vi.fn(), onRoleChange: vi.fn(), onSetReviewerMode: vi.fn(),
    aiAnalysisResult: { type: null, title: '', details: [] }, onAiDecision: vi.fn(), handleTriggerAiAction: vi.fn(), showToast: vi.fn(),
  } as any;
}
beforeEach(() => { vi.spyOn(reviewService, 'getComments').mockResolvedValue([]); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('disables editing and explains why after a script is submitted', async () => {
  const input = props(); input.script.scriptStatus = 'IN_REVIEW';
  render(<WriterStudio {...input} />);
  expect(screen.getByText(/chỉ chỉnh sửa sau khi Reviewer/)).toBeTruthy();
  const title = screen.getByDisplayValue('Scene');
  expect(title.closest('fieldset')?.disabled).toBe(true);
  const remove = screen.getByTitle('Xóa cảnh');
  expect(remove.closest('fieldset')?.disabled).toBe(true);
  await screen.findByRole('button', { name: 'Lịch Sử (Diff)' });
});

it('locks sync while saving and preserves durations on a 503 response', async () => {
  vi.spyOn(sceneSaveQueue, 'saveNow').mockResolvedValue(props().script);
  let fail!: (e: Error) => void;
  const sync = vi.spyOn(narrationService, 'syncDurations').mockImplementation(() => new Promise((_, reject) => { fail = reject; }));
  const input = props(); render(<WriterStudio {...input} />);
  const button = screen.getByRole('button', { name: /Khớp Thời Lượng Giọng Đọc/ });
  await act(async () => { fireEvent.click(button); fireEvent.click(button); });
  expect(sync).toHaveBeenCalledTimes(1);
  expect(button.closest('fieldset')?.disabled).toBe(true);
  await act(async () => fail(new Error('503 unavailable')));
  expect(input.setScript).not.toHaveBeenCalled();
  expect(input.showToast).toHaveBeenCalledWith('503 unavailable', 'warn');
  expect(button.closest('fieldset')?.disabled).toBe(false);
});

it('discards audio from a preview request after switching project', async () => {
  let finish!: (url: string) => void;
  vi.spyOn(narrationService, 'getTtsPreview').mockImplementation(() => new Promise(done => { finish = done; }));
  const revoke = vi.fn(); Object.defineProperty(URL, 'revokeObjectURL', { value: revoke, configurable: true });
  const audio = vi.fn(function () {}); vi.stubGlobal('Audio', audio);
  const { rerender } = render(<WriterStudio {...props('old')} />);
  fireEvent.click(screen.getByRole('button', { name: /Nghe Thử Giọng Đọc/ }));
  rerender(<WriterStudio {...props('new')} />);
  await act(async () => finish('blob:old-audio'));
  expect(audio).not.toHaveBeenCalled();
  expect(revoke).toHaveBeenCalledWith('blob:old-audio');
});
