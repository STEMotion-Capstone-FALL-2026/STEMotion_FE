import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateProjectModal } from './CreateProjectModal';

afterEach(cleanup);

describe('creating a project', () => {
  it('keeps the form and title after failure, and closes only after a successful retry', async () => {
    const create = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(undefined);
    const close = vi.fn();
    render(<CreateProjectModal isOpen onClose={close} onCreate={create} />);
    const title = screen.getByLabelText('Chủ đề bài học STEM:');
    fireEvent.change(title, { target: { value: 'Định luật Ôm' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo & mở Writer Studio' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Offline');
    expect((title as HTMLInputElement).value).toBe('Định luật Ôm');
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tạo & mở Writer Studio' }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenLastCalledWith('Định luật Ôm', 'Physics', 'Đại chúng', false, 0, undefined);
  });

  it('ignores repeated form submissions and prevents closing or editing while waiting', async () => {
    let finish!: () => void;
    const create = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const close = vi.fn();
    render(<CreateProjectModal isOpen onClose={close} onCreate={create} />);
    const input = screen.getByLabelText('Chủ đề bài học STEM:');
    fireEvent.change(input, { target: { value: 'Topic' } });
    const form = input.closest('form')!;
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Đóng tạo dự án' }).hasAttribute('disabled')).toBe(true);
    expect(input.closest('fieldset')?.disabled).toBe(true);
    await act(async () => finish());
    expect(close).toHaveBeenCalledTimes(1);
  });
});
