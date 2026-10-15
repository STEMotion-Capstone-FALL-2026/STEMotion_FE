import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { workspaceService } from './workspaceService';

describe('workspaceService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    workspaceService.clearCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const mockJson = (status: number, payload: unknown) =>
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      text: () => Promise.resolve(JSON.stringify(payload)),
    } as unknown as Response);

  it('getMyWorkspaces fetches and maps workspace summary with role and leader', async () => {
    const rawWorkspaces = [
      {
        id: 'ws-1',
        name: 'Tổ Vật Lý',
        department: 'Vật Lý',
        membersCount: 3,
        activeProjects: 2,
        myRole: 'WRITER',
        isLeader: true,
      },
    ];
    global.fetch = mockJson(200, rawWorkspaces) as typeof fetch;

    const list = await workspaceService.getMyWorkspaces();

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('ws-1');
    expect(list[0].myRole).toBe('writer');
    expect(list[0].isLeader).toBe(true);
  });

  it('resolveActiveWorkspaceId returns cached workspace if present in mine', async () => {
    const rawWorkspaces = [
      { id: 'ws-1', name: 'Tổ A', membersCount: 1, activeProjects: 0, myRole: 'WRITER', isLeader: false },
      { id: 'ws-2', name: 'Tổ B', membersCount: 2, activeProjects: 1, myRole: 'REVIEWER', isLeader: true },
    ];
    global.fetch = mockJson(200, rawWorkspaces) as typeof fetch;
    workspaceService.setActiveWorkspaceId('ws-2');

    const activeId = await workspaceService.resolveActiveWorkspaceId();

    expect(activeId).toBe('ws-2');
  });

  it('resolveActiveWorkspaceId returns first workspace if cached is absent', async () => {
    const rawWorkspaces = [
      { id: 'ws-1', name: 'Tổ A', membersCount: 1, activeProjects: 0, myRole: 'WRITER', isLeader: false },
    ];
    global.fetch = mockJson(200, rawWorkspaces) as typeof fetch;

    const activeId = await workspaceService.resolveActiveWorkspaceId();

    expect(activeId).toBe('ws-1');
  });

  it('resolveActiveWorkspaceId returns null without calling POST /workspaces when mine is empty', async () => {
    global.fetch = mockJson(200, []) as typeof fetch;

    const activeId = await workspaceService.resolveActiveWorkspaceId();

    expect(activeId).toBeNull();
    // Verify fetch was NOT called with POST /workspaces
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workspaces/mine'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('createWorkspace calls POST /workspaces with leader details', async () => {
    const createdRaw = {
      id: 'ws-new',
      name: 'Tổ Hóa Học',
      department: 'Hóa',
      membersCount: 1,
      activeProjects: 0,
      myRole: 'WRITER',
      isLeader: true,
    };
    global.fetch = mockJson(201, createdRaw) as typeof fetch;

    const res = await workspaceService.createWorkspace({
      name: 'Tổ Hóa Học',
      department: 'Hóa',
      leaderUserId: 'user-leader-1',
      leaderRole: 'WRITER',
    });

    expect(res.id).toBe('ws-new');
    expect(res.name).toBe('Tổ Hóa Học');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workspaces'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Tổ Hóa Học',
          department: 'Hóa',
          leaderUserId: 'user-leader-1',
          leaderRole: 'WRITER',
        }),
      })
    );
  });

  it('getMembers fetches and maps member details including isLeader and status', async () => {
    const rawMembers = [
      {
        id: 'm-1',
        userId: 'u-1',
        name: 'Nguyen Van A',
        email: 'a@example.com',
        role: 'WRITER',
        status: 'ACTIVE',
        isLeader: true,
      },
      {
        id: 'm-2',
        userId: 'u-2',
        name: 'Tran Van B',
        email: 'b@example.com',
        role: 'REVIEWER',
        status: 'INACTIVE',
        isLeader: false,
      },
    ];
    global.fetch = mockJson(200, rawMembers) as typeof fetch;

    const members = await workspaceService.getMembers('ws-1');

    expect(members).toHaveLength(2);
    expect(members[0].role).toBe('writer');
    expect(members[0].isLeader).toBe(true);
    expect(members[0].status).toBe('ACTIVE');
    expect(members[1].role).toBe('reviewer');
    expect(members[1].isLeader).toBe(false);
    expect(members[1].status).toBe('INACTIVE');
  });

  it('getCandidates fetches candidate users for workspace', async () => {
    const rawCandidates = [
      { id: 'u-3', fullName: 'Le Van C', email: 'c@example.com', systemRole: 'WRITER' },
    ];
    global.fetch = mockJson(200, rawCandidates) as typeof fetch;

    const candidates = await workspaceService.getCandidates('ws-1');

    expect(candidates).toHaveLength(1);
    expect(candidates[0].fullName).toBe('Le Van C');
  });

  it('addMember sends direct assignment payload', async () => {
    const rawMember = {
      id: 'm-3',
      userId: 'u-3',
      name: 'Le Van C',
      email: 'c@example.com',
      role: 'PRODUCER',
      status: 'ACTIVE',
      isLeader: false,
    };
    global.fetch = mockJson(201, rawMember) as typeof fetch;

    const member = await workspaceService.addMember('ws-1', {
      userId: 'u-3',
      role: 'producer',
      isLeader: false,
    });

    expect(member.id).toBe('m-3');
    expect(member.role).toBe('producer');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workspaces/ws-1/members'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ userId: 'u-3', role: 'PRODUCER', isLeader: false }),
      })
    );
  });

  it('updateMember patches member role, status and leader', async () => {
    const rawUpdated = {
      id: 'm-1',
      userId: 'u-1',
      name: 'Nguyen Van A',
      email: 'a@example.com',
      role: 'REVIEWER',
      status: 'ACTIVE',
      isLeader: true,
    };
    global.fetch = mockJson(200, rawUpdated) as typeof fetch;

    const updated = await workspaceService.updateMember('ws-1', 'm-1', {
      role: 'REVIEWER',
      isLeader: true,
    });

    expect(updated.role).toBe('reviewer');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workspaces/ws-1/members/m-1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ role: 'REVIEWER', isLeader: true }),
      })
    );
  });

  it('removeMember deletes member seat', async () => {
    global.fetch = mockJson(204, {}) as typeof fetch;

    const ok = await workspaceService.removeMember('ws-1', 'm-1');

    expect(ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workspaces/ws-1/members/m-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
