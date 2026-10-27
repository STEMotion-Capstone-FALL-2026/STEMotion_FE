import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CreateWorkspaceForm } from './CreateWorkspaceForm';
import { adminService } from '../../../services/adminService';
import { workspaceService } from '../../../services/workspaceService';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const mock3Users = [
  { id: 'u1', role: 'WRITER', status: 'ACTIVE', fullName: 'Test Writer', email: 'writer@example.test' },
  { id: 'u2', role: 'REVIEWER', status: 'ACTIVE', fullName: 'Test Reviewer', email: 'reviewer@example.test' },
  { id: 'u3', role: 'PRODUCER', status: 'ACTIVE', fullName: 'Test Producer', email: 'producer@example.test' },
];

it('prevents repeated workspace creation, keeps the form on failure and permits retry', async () => {
  vi.spyOn(adminService, 'getUsers').mockResolvedValue(mock3Users as any);
  let fail!: (error: Error) => void;
  const create = vi.spyOn(workspaceService, 'createWorkspace').mockImplementationOnce(() => new Promise((_, reject) => { fail = reject; })).mockResolvedValue({ id: 'w', name: 'Keep workspace' } as any);
  vi.spyOn(workspaceService, 'setActiveWorkspaceId').mockImplementation(() => {});
  const onCreated = vi.fn(); render(<CreateWorkspaceForm onWorkspaceCreated={onCreated} />);
  await screen.findAllByText(/Test Writer/);
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

it('disables submit button and shows validation warning if team has fewer than 3 members or is missing roles', async () => {
  vi.spyOn(adminService, 'getUsers').mockResolvedValue([
    { id: 'u1', role: 'WRITER', status: 'ACTIVE', fullName: 'Solo Writer', email: 'solo@example.test' }
  ] as any);
  render(<CreateWorkspaceForm />);
  await screen.findAllByText(/Solo Writer/);
  fireEvent.change(screen.getByLabelText('Tên Không gian làm việc *'), { target: { value: 'Incomplete Team' } });
  const button = screen.getByRole('button', { name: 'Tạo không gian làm việc' }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  expect(screen.getByText(/Quy tắc nhân sự tổ \(M11\):/)).toBeTruthy();
  expect(screen.getByText(/Cần tối thiểu 3 người dùng khác nhau/)).toBeTruthy();
});
