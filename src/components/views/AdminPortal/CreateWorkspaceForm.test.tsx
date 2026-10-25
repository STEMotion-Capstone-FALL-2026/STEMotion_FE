import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CreateWorkspaceForm } from './CreateWorkspaceForm';
import { adminService } from '../../../services/adminService';
import { workspaceService } from '../../../services/workspaceService';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('prevents repeated workspace creation, keeps the form on failure and permits retry', async () => {
  vi.spyOn(adminService, 'getUsers').mockResolvedValue([{ id: 'u', role: 'WRITER', status: 'ACTIVE', fullName: 'Test Writer', email: 'test@example.test' }] as any);
  let fail!: (error: Error) => void;
  const create = vi.spyOn(workspaceService, 'createWorkspace').mockImplementationOnce(() => new Promise((_, reject) => { fail = reject; })).mockResolvedValue({ id: 'w', name: 'Keep workspace' } as any);
  vi.spyOn(workspaceService, 'setActiveWorkspaceId').mockImplementation(() => {});
  const onCreated = vi.fn(); render(<CreateWorkspaceForm onWorkspaceCreated={onCreated} />);
  await screen.findByText(/Test Writer/);
  fireEvent.change(screen.getByLabelText('Tên Không gian làm việc *'), { target: { value: 'Keep workspace' } });
  const button = screen.getByRole('button', { name: 'Tạo không gian làm việc' });
  act(() => { fireEvent.click(button); fireEvent.submit(button.closest('form')!); });
  expect(create).toHaveBeenCalledTimes(1);
  expect(button.closest('fieldset')?.disabled).toBe(true);
  await act(async () => fail(new Error('Network failed')));
  expect(screen.getByDisplayValue('Keep workspace')).toBeTruthy();
  expect(screen.getByRole('alert').textContent).toContain('Network failed');
  expect(onCreated).not.toHaveBeenCalled();
  await act(async () => fireEvent.click(button));
  expect(create).toHaveBeenCalledTimes(2);
  expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 'w' }));
});
