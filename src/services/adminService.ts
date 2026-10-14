/**
 * STEMotion Front-End - Admin & Asset Library Service
 * Implements FE-15 (Manage Users & Roles), FE-16 (Manage Templates),
 * and FE-17 (Monitor Render Queue & Storage and Monitor AI Cost & Usage).
 */

import { apiClient } from './apiClient';

export interface SystemMetrics {
  cpuUsage: number;
  gpuUsage: number;
  memoryUsage: number;
  activeRenderJobs: number;
  completedToday: number;
  storageUsedGb: number;
  failedToday?: number;
  successRate?: number;
}

export interface AdminRenderJobSummary {
  id: string;
  externalJobId?: string;
  projectId: string;
  projectTitle: string;
  subject: string;
  requestedByName: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  stage?: string;
  resolution: string;
  fps: number;
  videoUrl?: string;
  errorMessage?: string;
  attemptCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AiUsageStats {
  totalProjects: number;
  totalScriptVersions: number;
  totalScenesGenerated: number;
  estimatedAiCalls: number;
  avgLatencyMs: number;
  estimatedTokensUsed: number;
  estimatedCostUsd: number;
  monthlyBudgetUsd: number;
  modelName: string;
  ttsProvider: string;
}

export interface AdminDashboardOverview {
  metrics: SystemMetrics;
  aiUsage: AiUsageStats;
  recentRenderJobs: AdminRenderJobSummary[];
  projectsBySubject: Record<string, number>;
}

export interface STEMAssetTemplate {
  id: string;
  name: string;
  category: 'Math' | 'Physics' | 'Chemistry' | 'Biology' | 'ComputerScience';
  previewType: string;
  tags: string[];
}

export interface AdminTemplateDto {
  id: string;
  name: string;
  category: string;
  propsSchema?: string;
  previewUrl?: string;
  isActive: boolean;
}

export interface AdminTemplateRequest {
  name: string;
  category: string;
  propsSchema?: string;
  previewUrl?: string;
  isActive?: boolean;
}

export type SystemUserRole = 'WRITER' | 'REVIEWER' | 'PRODUCER' | 'ADMIN';
export type SystemUserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface ProvisionUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: SystemUserRole;
}

export interface AdminUserDto {
  id: string;
  fullName: string;
  email: string;
  role: SystemUserRole;
  status: SystemUserStatus;
  createdAt: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: SystemUserRole;
  status?: SystemUserStatus;
}

export const adminService = {
  // FE-15: Manage Users & Roles
  async provisionUser(request: ProvisionUserRequest): Promise<{ id: string; email: string }> {
    return apiClient.post('/users', request);
  },

  async getAllUsers(): Promise<AdminUserDto[]> {
    return apiClient.get<AdminUserDto[]>('/users');
  },

  async updateUser(id: string, request: UpdateUserRequest): Promise<AdminUserDto> {
    return apiClient.patch<AdminUserDto>(`/users/${id}`, request);
  },

  async deleteUser(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  },

  // FE-16: Manage Templates
  async getAssetTemplates(): Promise<STEMAssetTemplate[]> {
    return apiClient.get<STEMAssetTemplate[]>('/templates');
  },

  async getAdminTemplates(activeOnly = false): Promise<AdminTemplateDto[]> {
    return apiClient.get<AdminTemplateDto[]>(`/templates?activeOnly=${activeOnly}`);
  },

  async createTemplate(request: AdminTemplateRequest): Promise<AdminTemplateDto> {
    return apiClient.post<AdminTemplateDto>('/templates', request);
  },

  async updateTemplate(id: string, request: AdminTemplateRequest): Promise<AdminTemplateDto> {
    return apiClient.put<AdminTemplateDto>(`/templates/${id}`, request);
  },

  async deleteTemplate(id: string): Promise<void> {
    return apiClient.delete<void>(`/templates/${id}`);
  },

  // FE-17: Monitor Render Queue & Storage and Monitor AI Cost & Usage
  async getSystemMetrics(): Promise<SystemMetrics> {
    return apiClient.get<SystemMetrics>('/admin/metrics');
  },

  async getDashboardOverview(): Promise<AdminDashboardOverview> {
    return apiClient.get<AdminDashboardOverview>('/admin/overview');
  },

  async getRenderJobs(): Promise<AdminRenderJobSummary[]> {
    return apiClient.get<AdminRenderJobSummary[]>('/admin/render-jobs');
  },
};
