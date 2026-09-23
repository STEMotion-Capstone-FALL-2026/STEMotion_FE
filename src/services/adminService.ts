/**
 * STEMotion Front-End - Admin & Asset Library Service
 * Provides monitoring data, render queue status, and template assets
 */

import { apiClient } from './apiClient';

export interface SystemMetrics {
  cpuUsage: number;
  gpuUsage: number;
  memoryUsage: number;
  activeRenderJobs: number;
  completedToday: number;
  storageUsedGb: number;
}

export interface STEMAssetTemplate {
  id: string;
  name: string;
  category: 'Math' | 'Physics' | 'Chemistry' | 'Biology' | 'ComputerScience';
  previewType: string;
  tags: string[];
}

export const adminService = {
  async getSystemMetrics(): Promise<SystemMetrics> {
return apiClient.get<SystemMetrics>('/admin/metrics');
  },

  async getAssetTemplates(): Promise<STEMAssetTemplate[]> {
return apiClient.get<STEMAssetTemplate[]>('/templates');
  },
};
