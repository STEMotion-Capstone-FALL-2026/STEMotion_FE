/**
 * STEMotion Front-End - Script & Scene Service
 * Handles AI generation and scene mutations
 */

import { apiClient } from './apiClient';
import { STEMScript, STEMSubject, SceneData, SceneType } from '../types/stem';
import { projectService } from './projectService';

export const scriptService = {
  async segmentScript(rawScript: string): Promise<any> {
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(500);
      return {
        scenes: [
          { templateType: 'CONCEPT_OVERVIEW', suggestedDuration: 15, narrationText: 'Giới thiệu khái niệm cốt lõi và hiện tượng thực tiễn.' },
          { templateType: 'MATH_FORMULA', suggestedDuration: 20, narrationText: 'Khai triển công thức KaTeX và phân tích các thông số.' },
          { templateType: 'INTERACTIVE_EXPERIMENT', suggestedDuration: 20, narrationText: 'Mô phỏng đồ thị và thực nghiệm ảo trực quan.' },
          { templateType: 'QUIZ_CHECKPOINT', suggestedDuration: 15, narrationText: 'Câu hỏi trắc nghiệm tương tác kiểm tra độ hiểu bài.' },
          { templateType: 'SUMMARY_OUTRO', suggestedDuration: 15, narrationText: 'Tổng kết nội dung trọng tâm và bài tập trên Canvas LMS.' },
        ],
      };
    }
    return apiClient.post('/ai/segment', { rawScript });
  },

  async generateScriptWithAI(
    prompt: string,
    subject: STEMSubject,
    gradeLevel: string
  ): Promise<STEMScript> {
    if (apiClient.isMockMode()) {
      await apiClient.mockDelay(500);
      return projectService.createProject({
        title: prompt || `Khám phá ${subject} - ${gradeLevel}`,
        subject,
        gradeLevel,
        topicPrompt: prompt,
      });
    }

    return apiClient.post<STEMScript>('/scripts/generate', {
      prompt,
      subject,
      gradeLevel,
    });
  },

  async updateScene(
    currentScript: STEMScript,
    sceneId: string,
    updater: (scene: SceneData) => SceneData
  ): Promise<STEMScript> {
    const updatedScenes = currentScript.scenes.map((sc) => {
      if (sc.id === sceneId) {
        return updater(sc);
      }
      return sc;
    });

    const updatedScript: STEMScript = {
      ...currentScript,
      scenes: updatedScenes,
    };

    if (apiClient.isMockMode()) {
      projectService.updateProject(currentScript.id, updatedScript);
      return updatedScript;
    }

    const targetScene = updatedScenes.find((s) => s.id === sceneId);
    return apiClient.put<STEMScript>(`/projects/${currentScript.id}/scenes/${sceneId}`, targetScene);
  },

  async addScene(
    currentScript: STEMScript,
    type: SceneType = 'MATH_FORMULA'
  ): Promise<{ updatedScript: STEMScript; newScene: SceneData }> {
    const sceneNum = currentScript.scenes.length + 1;
    let newScene: SceneData;

    if (type === 'MATH_FORMULA') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'MATH_FORMULA',
        title: `Scene ${sceneNum}: Công thức mở rộng`,
        latex: 'y = a x^2 + b x + c',
        narration: 'Chúng ta khảo sát tọa độ đỉnh và trục đối xứng của hàm số bậc hai.',
        durationInFrames: 150,
        steps: [
          { label: 'Tọa độ đỉnh I', latexSnippet: 'I\\left(-\\frac{b}{2a}, -\\frac{\\Delta}{4a}\\right)', explanation: 'Điểm cực trị của đồ thị parabol' },
        ],
      };
    } else if (type === 'DATA_CHART') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'DATA_CHART',
        title: `Scene ${sceneNum}: Biểu đồ thống kê số liệu`,
        xAxisLabel: 'Thời gian t (s)',
        yAxisLabel: 'Vận tốc v (m/s)',
        durationInFrames: 150,
        chartType: 'bar',
        narration: 'Dữ liệu thực nghiệm biểu diễn sự biến thiên của vận tốc theo thời gian.',
        dataPoints: [
          { label: 't=1s', value: 3.5 },
          { label: 't=2s', value: 7.0 },
          { label: 't=3s', value: 10.5 },
          { label: 't=4s', value: 14.0 },
        ],
      };
    } else if (type === 'STEM_QUIZ') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'STEM_QUIZ',
        title: `Scene ${sceneNum}: Câu hỏi trắc nghiệm kiểm tra nhanh`,
        question: 'Biệt thức Delta của phương trình bậc 2 có công thức là gì?',
        options: ['Δ = b² - 4ac', 'Δ = b² + 4ac', 'Δ = 2b - 4ac', 'Δ = b - 4ac'],
        correctIndex: 0,
        hint: 'Nhớ lại định lý cơ bản.',
        explanation: 'Delta bằng b bình phương trừ 4 nhân a nhân c.',
        narration: 'Hãy chọn đáp án đúng trong 5 giây.',
        durationInFrames: 180,
      };
    } else {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'TITLE_HERO',
        title: `Scene ${sceneNum}: Phân cảnh kiến thức`,
        subtitle: 'Khái niệm STEM trọng tâm',
        subject: currentScript.subject,
        gradeLevel: currentScript.gradeLevel,
        badgeText: 'STEMotion 4.0',
        narration: 'Chào mừng các bạn đến với phần tiếp theo của bài học.',
        durationInFrames: 150,
      };
    }

    const updatedScenes = [...currentScript.scenes, newScene];
    const totalDurationSeconds = Math.round(
      updatedScenes.reduce((sum, s) => sum + (s.durationInFrames || 150), 0) / 30
    );

    const updatedScript: STEMScript = {
      ...currentScript,
      scenes: updatedScenes,
      totalDurationSeconds,
    };

    if (apiClient.isMockMode()) {
      projectService.updateProject(currentScript.id, updatedScript);
      return { updatedScript, newScene };
    }

    const res = await apiClient.post<STEMScript>(`/projects/${currentScript.id}/scenes`, newScene);
    return { updatedScript: res || updatedScript, newScene };
  },

  async deleteScene(
    currentScript: STEMScript,
    sceneId: string
  ): Promise<STEMScript> {
    if (currentScript.scenes.length <= 1) {
      return currentScript;
    }

    const filtered = currentScript.scenes.filter((s) => s.id !== sceneId);
    const totalDurationSeconds = Math.round(
      filtered.reduce((sum, s) => sum + (s.durationInFrames || 150), 0) / 30
    );

    const updatedScript: STEMScript = {
      ...currentScript,
      scenes: filtered,
      totalDurationSeconds,
    };

    if (apiClient.isMockMode()) {
      projectService.updateProject(currentScript.id, updatedScript);
      return updatedScript;
    }

    await apiClient.delete(`/projects/${currentScript.id}/scenes/${sceneId}`);
    return updatedScript;
  },
};
