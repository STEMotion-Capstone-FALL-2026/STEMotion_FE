/**
 * STEMotion Front-End - Project Service
 * Handles CRUD operations for STEM video production projects
 */

import { apiClient } from './apiClient';
import { STEMScript, STEMSubject, SceneData } from '../types/stem';
import { DEFAULT_SAMPLE_SCRIPT } from '../lib/sampleData';

const PROJECTS_STORAGE_KEY = 'stemotion_projects_cache';

export interface CreateProjectPayload {
  title: string;
  subject: STEMSubject;
  gradeLevel: string;
  topicPrompt?: string;
}

export const projectService = {
  // Local storage cache helper for Mock Mode
  _getMockProjects(): STEMScript[] {
    try {
      const data = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return [DEFAULT_SAMPLE_SCRIPT];
  },

  _saveMockProjects(projects: STEMScript[]): void {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to cache mock projects', e);
    }
  },

  _generateNewProject(payload: CreateProjectPayload): STEMScript {
    const newId = `SCR-${payload.subject.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`;
    
    const defaultScenes: SceneData[] = [
      {
        id: `sc_${Date.now()}_1`,
        type: 'TITLE_HERO',
        title: payload.title,
        subtitle: `Chuyên đề ${payload.subject} ${payload.gradeLevel}`,
        subject: payload.subject,
        gradeLevel: payload.gradeLevel,
        badgeText: 'STEMotion Studio',
        narration: `Chào mừng các em học sinh đến với bài giảng ${payload.title}.`,
        durationInFrames: 150,
      },
      payload.subject === 'Math'
        ? {
            id: `sc_${Date.now()}_2`,
            type: 'MATH_FORMULA',
            title: 'Công thức toán học trọng tâm',
            latex: 'f(x) = ax^2 + bx + c',
            narration: 'Công thức này biểu diễn quy luật toán học cốt lõi của bài học.',
            durationInFrames: 180,
            steps: [
              { label: 'Bước 1', latexSnippet: 'a \\neq 0', explanation: 'Điều kiện hàm số bậc 2' },
              { label: 'Bước 2', latexSnippet: '\\Delta = b^2 - 4ac', explanation: 'Biệt thức quyết định số nghiệm' },
            ],
          }
        : payload.subject === 'ComputerScience'
        ? {
            id: `sc_${Date.now()}_2`,
            type: 'ALGORITHM_WALKTHROUGH',
            title: 'Cài đặt giải thuật',
            language: 'python',
            codeSnippet: 'def solve_problem(n):\n    dp = [0] * (n + 1)\n    return dp[n]',
            narration: 'Thuật toán tối ưu hóa quy hoạch động giải quyết bài toán trong O(n).',
            durationInFrames: 180,
            steps: [
              { lineHighlight: 1, variableState: 'n=5', note: 'Khởi tạo mảng ghi nhớ' },
              { lineHighlight: 2, variableState: 'dp=[0,0,0,0,0,0]', note: 'Lưu kết quả bài toán con' },
            ],
          }
        : {
            id: `sc_${Date.now()}_2`,
            type: 'DATA_CHART',
            title: 'Biểu đồ số liệu thực nghiệm',
            xAxisLabel: 'Tham số X',
            yAxisLabel: 'Giá trị Y',
            chartType: 'bar',
            narration: 'Dữ liệu thực nghiệm chứng minh mối tương quan trực quan giữa các đại lượng.',
            durationInFrames: 150,
            dataPoints: [
              { label: 'Mẫu 1', value: 3.5, color: '#3B82F6' },
              { label: 'Mẫu 2', value: 7.2, color: '#10B981' },
              { label: 'Mẫu 3', value: 5.8, color: '#F59E0B' },
            ],
          },
      {
        id: `sc_${Date.now()}_3`,
        type: 'STEM_QUIZ',
        title: 'Câu hỏi trắc nghiệm kiểm tra nhanh',
        question: `Khẳng định nào sau đây là chính xác về ${payload.title}?`,
        options: [
          'A. Phù hợp theo nguyên lý khoa học chuẩn',
          'B. Luôn đúng trong mọi điều kiện lý tưởng',
          'C. Tỉ lệ thuận với bình phương khoảng cách',
          'D. Không xác định được bằng thực nghiệm',
        ],
        correctIndex: 0,
        hint: 'Vận dụng kiến thức vừa học ở phần trước.',
        explanation: 'Phương án A phản ánh đúng quy luật đã chứng minh trong bài giảng.',
        narration: 'Hãy chọn đáp án đúng trong 5 giây.',
        durationInFrames: 180,
      },
    ];

    const newScript: STEMScript = {
      id: newId,
      title: payload.title,
      subject: payload.subject,
      gradeLevel: payload.gradeLevel,
      totalDurationSeconds: 65,
      scriptStatus: 'DRAFT',
      videoStatus: 'NOT_RENDERED',
      fps: 30,
      createdAt: 'Vừa xong',
      reviewComments: [],
      scenes: defaultScenes,
    };

    const all = this._getMockProjects();
    const updatedList = [newScript, ...all];
    this._saveMockProjects(updatedList);
    return newScript;
  },

  async getProjects(filterSubject?: STEMSubject): Promise<STEMScript[]> {
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(150);
      const all = this._getMockProjects();
      if (filterSubject) {
        return all.filter((p) => p.subject === filterSubject);
      }
      return all;
    }

    try {
      const query = filterSubject ? `?subject=${filterSubject}` : '';
      return await apiClient.get<STEMScript[]>(`/projects${query}`);
    } catch (error) {
      console.warn('[projectService] Backend unreachable, falling back to mock projects:', error);
      const all = this._getMockProjects();
      if (filterSubject) {
        return all.filter((p) => p.subject === filterSubject);
      }
      return all;
    }
  },

  async getProjectById(id: string): Promise<STEMScript> {
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(150);
      const all = this._getMockProjects();
      const found = all.find((p) => p.id === id);
      if (found) return found;
      return DEFAULT_SAMPLE_SCRIPT;
    }

    try {
      return await apiClient.get<STEMScript>(`/projects/${id}`);
    } catch (error) {
      console.warn('[projectService] Backend unreachable, falling back to cached project:', error);
      const all = this._getMockProjects();
      const found = all.find((p) => p.id === id);
      if (found) return found;
      return DEFAULT_SAMPLE_SCRIPT;
    }
  },

  async createProject(payload: CreateProjectPayload): Promise<STEMScript> {
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(200);
      return this._generateNewProject(payload);
    }

    try {
      return await apiClient.post<STEMScript>('/projects', payload);
    } catch (error) {
      console.warn('[projectService] Backend unreachable, fallback to local project:', error);
      return this._generateNewProject(payload);
    }
  },

  async updateProject(id: string, updates: Partial<STEMScript>): Promise<STEMScript> {
    // Always update local cache first
    const all = this._getMockProjects();
    const index = all.findIndex((p) => p.id === id);
    let updated: STEMScript = { ...DEFAULT_SAMPLE_SCRIPT, ...updates };
    if (index >= 0) {
      all[index] = { ...all[index], ...updates };
      this._saveMockProjects(all);
      updated = all[index];
    }

    if (apiClient.isMockMode()) {
      return updated;
    }

    try {
      return await apiClient.put<STEMScript>(`/projects/${id}`, updates);
    } catch (error) {
      console.warn('[projectService] Backend unreachable, keeping local update:', error);
      return updated;
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    const all = this._getMockProjects();
    const filtered = all.filter((p) => p.id !== id);
    this._saveMockProjects(filtered);

    if (apiClient.isMockMode()) {
      return true;
    }

    try {
      await apiClient.delete(`/projects/${id}`);
    } catch (error) {
      console.warn('[projectService] Backend unreachable, deleted locally:', error);
    }
    return true;
  },
};
