import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useActionGuard } from './useActionGuard';

it('locks before React renders, and unlocks after a failed action for an explicit retry', async () => {
  let fail!: (error: Error) => void;
  const action = vi.fn(() => new Promise<void>((_, reject) => { fail = reject; }));
  const { result } = renderHook(useActionGuard);
  let first!: Promise<unknown>;
  act(() => { first = result.current.wrap(action)().catch(error => error); void result.current.wrap(action)(); });
  expect(action).toHaveBeenCalledTimes(1);
  expect(result.current.pending).toBe(true);
  await act(async () => { fail(new Error('Offline')); await first; });
  expect(result.current.pending).toBe(false);
  const retry = vi.fn().mockResolvedValue(undefined);
  await act(async () => { await result.current.wrap(retry)(); });
  expect(retry).toHaveBeenCalledTimes(1);
});
