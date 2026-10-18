// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CanvaInteractiveOverlay } from './CanvaInteractiveOverlay';
import type { SceneData } from '../types/stem';

const scene = {
  id: 's1',
  type: 'TITLE_HERO',
  title: 'Định luật Ôm',
  narration: 'Xin chào',
  durationInFrames: 90,
  subtitle: 'Vật lý 9',
  subject: 'Physics',
  gradeLevel: '9',
  badgeText: 'STEM',
} as unknown as SceneData;

describe('CanvaInteractiveOverlay', () => {
  // Pressing play on a read-only (in review) project used to blank the page: a hook below the
  // "hidden while playing" early return changed the hook count (React error #300).
  it('keeps rendering when playback starts and stops', () => {
    const props = { scene, updateSceneProperty: vi.fn(), onPauseVideo: vi.fn(), disabled: true };
    const { rerender, container } = render(<CanvaInteractiveOverlay {...props} isPlaying={false} />);
    expect(() => rerender(<CanvaInteractiveOverlay {...props} isPlaying />)).not.toThrow();
    expect(container.innerHTML).toBe('');
    expect(() => rerender(<CanvaInteractiveOverlay {...props} isPlaying={false} />)).not.toThrow();
  });
});
