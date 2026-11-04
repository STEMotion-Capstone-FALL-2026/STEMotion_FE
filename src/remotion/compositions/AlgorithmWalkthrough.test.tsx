// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlgorithmWalkthrough } from './AlgorithmWalkthrough';
import type { AlgorithmWalkthroughProps } from '@/types/stem';

// Mock remotion hooks
vi.mock('remotion', async () => {
  const actual = await vi.importActual<any>('remotion');
  return {
    ...actual,
    useCurrentFrame: () => 30, // Frame 30 corresponds to step index 0
    useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 180 }),
    spring: () => 1,
    interpolate: (val: number, [inMin, inMax]: number[], [outMin, outMax]: number[]) => outMax,
  };
});

describe('AlgorithmWalkthrough Component', () => {
  it('renders Bubble Sort with visual array bubbles and operation highlights', () => {
    const props: AlgorithmWalkthroughProps = {
      id: 'scene_bubble_test',
      type: 'ALGORITHM_WALKTHROUGH',
      title: 'Thuật toán Bubble Sort',
      language: 'python',
      codeSnippet: `def bubble_sort(arr):\n    for i in range(len(arr)):\n        if arr[j] > arr[j+1]:\n            arr[j], arr[j+1] = arr[j+1], arr[j]`,
      steps: [
        {
          lineHighlight: 3,
          variableState: 'arr = [5, 2, 8, 1] | So sánh 5 > 2',
          note: 'So sánh hai phần tử 5 và 2: vì 5 > 2 nên chuẩn bị đổi chỗ.',
        },
        {
          lineHighlight: 4,
          variableState: 'arr = [2, 5, 8, 1] | Hoán đổi 5 và 2',
          note: 'Hoán đổi vị trí: số 5 nổi bọt về phía sau.',
        },
      ],
      narration: 'Các số như những quả bóng, liên tục so sánh và hoán đổi vị trí với nhau.',
      durationInFrames: 180,
    };

    render(<AlgorithmWalkthrough {...props} />);

    // Check title
    expect(screen.getByText('Thuật toán Bubble Sort')).toBeDefined();

    // Check code snippet lines
    expect(screen.getByText('def bubble_sort(arr):')).toBeDefined();

    // Check visual array bubbles rendered (elements 5, 2, 8, 1)
    expect(screen.getByText('MẢNG SỐ TRỰC QUAN (ARRAY BUBBLES)')).toBeDefined();
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('8').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);

    // Check indices tags
    expect(screen.getByText('[0]')).toBeDefined();
    expect(screen.getByText('[1]')).toBeDefined();
    expect(screen.getByText('[2]')).toBeDefined();
    expect(screen.getByText('[3]')).toBeDefined();

    // Check operation badge: In step 0, it's comparing 5 and 2
    expect(screen.getByText(/Đang so sánh/)).toBeDefined();

    // Check explanation note
    expect(screen.getByText(/So sánh hai phần tử 5 và 2/)).toBeDefined();
  });

  it('renders non-array algorithm gracefully without breaking', () => {
    const props: AlgorithmWalkthroughProps = {
      id: 'scene_euler_test',
      type: 'ALGORITHM_WALKTHROUGH',
      title: 'Tích phân Euler con lắc',
      language: 'python',
      codeSnippet: 'alpha = -(g / l) * sin(theta)\nomega = omega + alpha * dt',
      steps: [
        {
          lineHighlight: 1,
          variableState: 'theta = 0.15 rad, g = 9.8 -> alpha = -1.46 rad/s^2',
          note: 'Tính gia tốc góc từ mô-men lực phục hồi',
        },
      ],
      narration: 'Phương pháp tích phân Euler.',
      durationInFrames: 180,
    };

    render(<AlgorithmWalkthrough {...props} />);
    expect(screen.getByText('Tích phân Euler con lắc')).toBeDefined();
    expect(screen.getByText(/theta = 0.15 rad/)).toBeDefined();
    expect(screen.getByText('Tính gia tốc góc từ mô-men lực phục hồi')).toBeDefined();
  });
});
