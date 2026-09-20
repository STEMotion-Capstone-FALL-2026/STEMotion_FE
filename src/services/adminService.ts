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
    if (apiClient.isMockMode()) {
      return {
        cpuUsage: 42,
        gpuUsage: 68,
        memoryUsage: 54,
        activeRenderJobs: 3,
        completedToday: 128,
        storageUsedGb: 14.8,
      };
    }
    return apiClient.get<SystemMetrics>('/admin/metrics');
  },

  async getAssetTemplates(): Promise<STEMAssetTemplate[]> {
    if (apiClient.isMockMode()) {
      return [
        { id: 'tpl_1', name: 'Đồ thị Parabol Động', category: 'Math', previewType: 'MATH_FORMULA', tags: ['Hàm số', 'Bậc 2'] },
        { id: 'tpl_2', name: 'Mô hình Nguyên tử Bohr 3D', category: 'Chemistry', previewType: 'DIAGRAM_EXPLAINER', tags: ['Hóa 10', 'Cấu tạo'] },
        { id: 'tpl_3', name: 'Biểu đồ Số liệu Khảo sát', category: 'Physics', previewType: 'DATA_CHART', tags: ['Thực nghiệm', 'Sai số'] },
        { id: 'tpl_4', name: 'Thuật toán Duyệt Đồ Thị', category: 'ComputerScience', previewType: 'ALGORITHM_WALKTHROUGH', tags: ['Python', 'Graph'] },
      ];
    }
    return apiClient.get<STEMAssetTemplate[]>('/templates');
  },
};
