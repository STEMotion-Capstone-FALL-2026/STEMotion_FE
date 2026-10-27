import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ManageMembersModal } from './ManageMembersModal';
import { workspaceService, WorkspaceMemberDto } from '../../services';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mockMembers: WorkspaceMemberDto[] = [
  { id: 'm1', userId: 'u1', name: 'User Writer', email: 'writer@test.com', role: 'writer', status: 'ACTIVE', isLeader: true },
  { id: 'm2', userId: 'u2', name: 'User Reviewer', email: 'reviewer@test.com', role: 'reviewer', status: 'ACTIVE', isLeader: false },
  { id: 'm3', userId: 'u3', name: 'User Producer', email: 'producer@test.com', role: 'producer', status: 'ACTIVE', isLeader: false },
];

describe('ManageMembersModal RBAC and error handling (M15, D10, D11)', () => {
  it('Leader view: hides add/remove/status/leader controls and does not fetch candidates', async () => {
    const getMembersSpy = vi.spyOn(workspaceService, 'getMembers').mockResolvedValue(mockMembers);
    const getCandidatesSpy = vi.spyOn(workspaceService, 'getCandidates').mockResolvedValue([]);
    vi.spyOn(workspaceService, 'getAllWorkspaces').mockResolvedValue([]);
    vi.spyOn(workspaceService, 'getMyWorkspaces').mockResolvedValue([
      { id: 'ws-1', name: 'Tổ Toán', membersCount: 3, activeProjects: 1, isLeader: true },
    ]);

    render(
      <ManageMembersModal
        isOpen={true}
        onClose={vi.fn()}
        workspaceId="ws-1"
        workspaceName="Tổ Toán"
        isAdmin={false}
        isCurrentUserAdminOrLeader={true}
      />
    );

    await screen.findByText('User Writer');
    expect(getMembersSpy).toHaveBeenCalledWith('ws-1');
    // Candidates must not be fetched for Leader (would 403 on BE)
    expect(getCandidatesSpy).not.toHaveBeenCalled();

    // Add member form must NOT be shown
    expect(screen.queryByText('Gán thành viên mới vào nhóm')).toBeNull();

    // Role selector is available for leader
    expect(screen.getByLabelText('Vai trò của User Writer')).toBeTruthy();

    // Admin-only actions must be hidden
    expect(screen.queryByText('+ Làm Trưởng nhóm')).toBeNull();
    expect(screen.queryByText('Bỏ Trưởng nhóm')).toBeNull();
    expect(screen.queryByText('Vô hiệu hóa')).toBeNull();
    expect(screen.queryByText('Tắt')).toBeNull();
    expect(screen.queryByLabelText('Xóa thành viên User Writer')).toBeNull();
  });

  it('Admin view: displays candidates, add member form, and full member controls', async () => {
    vi.spyOn(workspaceService, 'getMembers').mockResolvedValue(mockMembers);
    const getCandidatesSpy = vi.spyOn(workspaceService, 'getCandidates').mockResolvedValue([
      { id: 'u4', fullName: 'Candidate User', email: 'cand@test.com', systemRole: 'WRITER' },
    ]);
    vi.spyOn(workspaceService, 'getAllWorkspaces').mockResolvedValue([
      { id: 'ws-1', name: 'Tổ Toán', membersCount: 3, activeProjects: 1 },
    ]);

    render(
      <ManageMembersModal
        isOpen={true}
        onClose={vi.fn()}
        workspaceId="ws-1"
        workspaceName="Tổ Toán"
        isAdmin={true}
        isCurrentUserAdminOrLeader={true}
      />
    );

    await screen.findByText('User Writer');
    expect(getCandidatesSpy).toHaveBeenCalledWith('ws-1');

    // Add member form is visible
    expect(screen.getByText('Gán thành viên mới vào nhóm')).toBeTruthy();

    // Admin controls are visible
    expect(screen.getByLabelText('Vai trò của User Writer')).toBeTruthy();
    expect(screen.getByText('Bỏ Trưởng nhóm')).toBeTruthy();
    expect(screen.getAllByText('Tắt').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Xóa thành viên User Writer')).toBeTruthy();
  });

  it('displays backend error message when member update violates role coverage (D10)', async () => {
    vi.spyOn(workspaceService, 'getMembers').mockResolvedValue(mockMembers);
    vi.spyOn(workspaceService, 'getMyWorkspaces').mockResolvedValue([
      { id: 'ws-1', name: 'Tổ Toán', membersCount: 3, activeProjects: 1, isLeader: true },
    ]);
    const errorMsg = 'This change would leave the workspace without an active [REVIEWER]; give that role to another member first';
    vi.spyOn(workspaceService, 'updateMember').mockRejectedValue(new Error(errorMsg));

    render(
      <ManageMembersModal
        isOpen={true}
        onClose={vi.fn()}
        workspaceId="ws-1"
        workspaceName="Tổ Toán"
        isAdmin={false}
        isCurrentUserAdminOrLeader={true}
      />
    );

    await screen.findByText('User Reviewer');
    const reviewerSelect = screen.getByLabelText('Vai trò của User Reviewer');
    fireEvent.change(reviewerSelect, { target: { value: 'WRITER' } });

    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toContain(errorMsg);
  });
});
