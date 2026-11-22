import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProposeProjectModal } from './ProposeProjectModal';
import { LeaderDashboardModal } from './LeaderDashboardModal';
import { ProjectTeamModal } from './ProjectTeamModal';
import { collabService } from '../../services/collabService';
import { ApiError } from '../../services/apiClient';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('proposing a project (UC-29)', () => {
  it('sends the proposal to the workspace and closes', async () => {
    const propose = vi.spyOn(collabService, 'propose').mockResolvedValue({ id: 'p1', status: 'PENDING' } as any);
    const close = vi.fn();
    render(<ProposeProjectModal isOpen workspaceId="ws1" onClose={close} />);
    fireEvent.change(screen.getByPlaceholderText('Ví dụ: Đòn bẩy trong đời sống'), { target: { value: 'Đòn bẩy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đề xuất' }));
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(propose).toHaveBeenCalledWith('ws1', { title: 'Đòn bẩy', subject: 'Physics', gradeLevel: null });
  });

  it('keeps the form and shows the error when sending fails', async () => {
    vi.spyOn(collabService, 'propose').mockRejectedValue(new Error('Offline'));
    const close = vi.fn();
    render(<ProposeProjectModal isOpen workspaceId="ws1" onClose={close} />);
    fireEvent.change(screen.getByPlaceholderText('Ví dụ: Đòn bẩy trong đời sống'), { target: { value: 'Đòn bẩy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đề xuất' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Offline');
    expect(close).not.toHaveBeenCalled();
  });
});

describe('Leader dashboard (UC-33)', () => {
  it('lists pending proposals, approves one and shows blockers on the board', async () => {
    vi.spyOn(collabService, 'leaderDashboard').mockResolvedValue({
      pendingProposals: [{ id: 'p1', title: 'Đòn bẩy', proposerName: 'Lan', subject: 'Physics', status: 'PENDING' } as any],
      pendingJoinRequests: [],
      board: { DRAFT: [{ projectId: 'c1', title: 'Mạch điện', workspaceId: 'ws1', stage: 'DRAFT', ownerId: 'u1', ownerName: 'Minh', blockers: ['MISSING_ROLE:REVIEWER', 'OPEN_NOTES:2'] }] },
    });
    const approve = vi.spyOn(collabService, 'approveProposal').mockResolvedValue({} as any);
    const changed = vi.fn();
    render(<LeaderDashboardModal isOpen onClose={() => undefined} onChanged={changed} />);
    expect(await screen.findByText('Đòn bẩy')).toBeTruthy();
    expect(screen.getByText('Thiếu Thẩm định')).toBeTruthy();
    expect(screen.getByText('2 ghi chú chưa xử lý')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt' }));
    await waitFor(() => expect(approve).toHaveBeenCalledWith('p1'));
    await waitFor(() => expect(changed).toHaveBeenCalled());
  });

  it('asks for a reason before rejecting a proposal', async () => {
    vi.spyOn(collabService, 'leaderDashboard').mockResolvedValue({
      pendingProposals: [{ id: 'p1', title: 'Đòn bẩy', subject: 'Physics', status: 'PENDING' } as any], pendingJoinRequests: [], board: {},
    });
    const reject = vi.spyOn(collabService, 'rejectProposal').mockResolvedValue({} as any);
    render(<LeaderDashboardModal isOpen onClose={() => undefined} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Từ chối' }));
    const send = screen.getByRole('button', { name: 'Gửi' });
    expect(send.hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByLabelText('Lý do từ chối'), { target: { value: 'Trùng chủ đề' } });
    fireEvent.click(send);
    await waitFor(() => expect(reject).toHaveBeenCalledWith('p1', 'Trùng chủ đề'));
  });
});

describe('project team (UC-30, UC-32)', () => {
  it('lets a non-member ask to join with a role', async () => {
    vi.spyOn(collabService, 'team').mockRejectedValue(new ApiError('Only members', 'FORBIDDEN', 403));
    vi.spyOn(collabService, 'joinRequests').mockResolvedValue([]);
    const join = vi.spyOn(collabService, 'requestJoin').mockResolvedValue({} as any);
    render(<ProjectTeamModal isOpen projectId="c1" currentUserId="u9" canManage={false} onClose={() => undefined} />);
    fireEvent.change(await screen.findByLabelText('Vai trò xin tham gia'), { target: { value: 'PRODUCER' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xin tham gia' }));
    await waitFor(() => expect(join).toHaveBeenCalledWith('c1', 'PRODUCER'));
  });

  it('shows missing roles and lets the Leader revoke a member', async () => {
    vi.spyOn(collabService, 'team').mockResolvedValue({
      projectId: 'c1', usesProjectRoles: true, missingRoles: ['PRODUCER'],
      members: [{ userId: 'u1', name: 'Lan', role: 'WRITER', status: 'ACTIVE' }, { userId: 'u2', name: 'Minh', role: 'REVIEWER', status: 'ACTIVE' }],
    });
    vi.spyOn(collabService, 'joinRequests').mockResolvedValue([]);
    vi.spyOn(collabService, 'contributions').mockResolvedValue({ projectId: 'c1', byMember: [], events: [] });
    const revoke = vi.spyOn(collabService, 'revoke').mockResolvedValue({} as any);
    render(<ProjectTeamModal isOpen projectId="c1" currentUserId="leader" canManage onClose={() => undefined} />);
    expect(await screen.findByText('Cần thêm Dựng video trước khi nộp kịch bản.')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Thu hồi' })[1]);
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('c1', 'u2'));
  });
});
