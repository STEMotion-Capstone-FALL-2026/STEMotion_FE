import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdminPortal } from './AdminPortal';
import { adminService } from '../../../services/adminService';
import { workspaceService } from '../../../services/workspaceService';
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
