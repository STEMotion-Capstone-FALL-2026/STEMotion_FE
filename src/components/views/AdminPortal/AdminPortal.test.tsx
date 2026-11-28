import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdminPortal } from './AdminPortal';
import { adminService } from '../../../services/adminService';
import { workspaceService } from '../../../services/workspaceService';
import { apiClient } from '../../../services/apiClient';
import { projectService } from '../../../services/projectService';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('shows an overview failure without invented CPU or latency and can reload the real metrics', async () => {
  vi.spyOn(adminService, 'getAllUsers').mockResolvedValue([]);
  vi.spyOn(adminService, 'getAdminTemplates').mockResolvedValue([]);
  vi.spyOn(workspaceService, 'getAllWorkspaces').mockResolvedValue([]);
  vi.spyOn(workspaceService, 'resolveActiveWorkspaceId').mockResolvedValue(null);
  vi.spyOn(adminService, 'getAiUsageHistory').mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 } as any);
  vi.spyOn(adminService, 'getDashboardOverview').mockRejectedValueOnce(new Error('Overview offline')).mockResolvedValue({
    metrics: { cpuUsage: 23, memoryUsage: 30, activeRenderJobs: 0, completedToday: 0, failedToday: 0, storageUsedGb: 0, successRate: -1 },
    aiUsage: { avgLatencyMs: 800, monthlyBudgetUsd: 0, estimatedCostUsd: 0 }, recentRenderJobs: [], projectsBySubject: {},
  } as any);
  render(<AdminPortal onOpenManageMembersModal={vi.fn()} />);
  await screen.findByText('Overview offline');
  expect(screen.queryByText('14.2%')).toBeNull();
  expect(screen.queryByText('4.3s')).toBeNull();
  expect(screen.getByText('Chưa có số liệu')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Thử tải lại dữ liệu' }));
  await screen.findByText('23%');
  expect(screen.queryByText('Overview offline')).toBeNull();
});

it('plays an approved video whose MP4 link only comes from the script detail', async () => {
  vi.spyOn(adminService, 'getAllUsers').mockResolvedValue([]);
  vi.spyOn(adminService, 'getAdminTemplates').mockResolvedValue([]);
  vi.spyOn(adminService, 'getAiUsageHistory').mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 } as any);
  vi.spyOn(adminService, 'getDashboardOverview').mockResolvedValue({
    metrics: { cpuUsage: 0, memoryUsage: 0, activeRenderJobs: 0, completedToday: 0, failedToday: 0, storageUsedGb: 0, successRate: -1 },
    aiUsage: { avgLatencyMs: 0, monthlyBudgetUsd: 0, estimatedCostUsd: 0 }, recentRenderJobs: [], projectsBySubject: {},
  } as any);
  vi.spyOn(workspaceService, 'getAllWorkspaces').mockResolvedValue([{ id: 'ws1', name: 'abc', department: 'abc', membersCount: 3 }] as any);
  vi.spyOn(workspaceService, 'resolveActiveWorkspaceId').mockResolvedValue('ws1');
  vi.spyOn(workspaceService, 'getMembers').mockResolvedValue([]);
  // The workspace list is a summary: no videoUrl.
  vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) =>
    url === '/workspaces/ws1/scripts'
      ? [{ id: 'p1', title: '[TEST] Định luật Ôm', subject: 'Physics', gradeLevel: 'GRADE_11', videoStatus: 'APPROVED', scriptStatus: 'APPROVED', ownerName: 'a', sceneCount: 1, totalDurationSeconds: 12 }]
      : []) as any;
  const detail = vi.spyOn(projectService, 'getProjectById').mockResolvedValue({ id: 'p1', videoUrl: 'https://worker.test/videos/p1.mp4' } as any);

  const { container } = render(<AdminPortal onOpenManageMembersModal={vi.fn()} />);
  fireEvent.click(await screen.findByTitle('Xem 1 video bài giảng của nhóm abc'));
  fireEvent.click(await screen.findByRole('button', { name: 'Xem chi tiết' }));

  await waitFor(() => expect(container.querySelector('video')?.getAttribute('src')).toBe('https://worker.test/videos/p1.mp4'));
  expect(detail).toHaveBeenCalledWith('p1');
  expect(screen.queryByText(/chưa có URL video MP4/)).toBeNull();
  // The list now knows the link, so the row offers play and download.
  expect(screen.getByRole('button', { name: /Phát video/ })).toBeTruthy();
});
