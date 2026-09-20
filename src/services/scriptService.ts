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
    const res = await apiClient.post<any>('/ai/script/action', {
      action: 'resegment',
      scriptText: rawScript,
    });
    // The model's payload sits under `result`; unwrap it for the caller.
    return res?.result ?? res;
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

    return apiClient.post<STEMScript>('/ai/script/generate', {
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

    // Always update local cache for smooth instantaneous interaction
    projectService.updateProject(currentScript.id, updatedScript);

    if (apiClient.isMockMode()) {
      return updatedScript;
    }

    try {
      const res = await apiClient.put<STEMScript>(`/scripts/${currentScript.id}`, {
        scenes: updatedScenes,
      });
      return res || updatedScript;
    } catch (error) {
      console.warn('[scriptService] Backend sync failed, keeping local update:', error);
      return updatedScript;
    }
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
    } else if (type === 'CHEMICAL_REACTION') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'CHEMICAL_REACTION',
        title: `Scene ${sceneNum}: Phản ứng hóa học thực nghiệm`,
        equation: 'Fe + 2HCl \\rightarrow FeCl_2 + H_2\\uparrow',
        reactants: 'Sắt kim loại (Fe) + Axit Clohidric (HCl)',
        products: 'Sắt(II) Clorua (FeCl2) + Khí Hydro (H2)',
        condition: 'Nhiệt độ phòng, không cần xúc tác',
        observation: 'Kim loại sắt tan dần, sủi nhiều bọt khí không màu thoát ra khỏi dung dịch.',
        flaskColor: '#0ea5e9',
        narration: 'Cho đinh sắt vào ống nghiệm chứa dung dịch axit clohidric, ta thấy có bọt khí hiđro thoát ra mãnh liệt.',
        durationInFrames: 180,
      };
    } else if (type === 'COMPARISON_SPLIT') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'COMPARISON_SPLIT',
        title: `Scene ${sceneNum}: So sánh đối chiếu hai khái niệm`,
        topicA: {
          title: 'Khái Niệm A (DC)',
          badge: 'Mô Hình 1',
          points: ['Chuyển dời một chiều ổn định', 'Điện áp cố định theo thời gian', 'Phù hợp vi mạch và pin sạc'],
          color: '#3b82f6',
        },
        topicB: {
          title: 'Khái Niệm B (AC)',
          badge: 'Mô Hình 2',
          points: ['Biến thiên điều hòa chu kỳ', 'Dễ dàng thay đổi điện áp', 'Truyền tải xa hiệu suất cao'],
          color: '#f59e0b',
        },
        conclusion: 'Cả hai mô hình bổ trợ cho nhau tùy thuộc vào bài toán kỹ thuật thực tế.',
        narration: 'Chúng ta cùng phân tích và đối chiếu các đặc tính trọng tâm giữa hai hiện tượng.',
        durationInFrames: 180,
      };
    } else if (type === 'PROCESS_TIMELINE') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'PROCESS_TIMELINE',
        title: `Scene ${sceneNum}: Tiến trình chu trình khoa học`,
        processTitle: 'Chu Trình Tiến Trình Các Giai Đoạn (4 Pha)',
        stages: [
          { stageNumber: 1, title: 'Khởi đầu (Pha 1)', description: 'Tích lũy năng lượng và chuẩn bị vật chất', badge: 'Giai Đoạn 1' },
          { stageNumber: 2, title: 'Chuyển hóa (Pha 2)', description: 'Biến đổi cấu trúc và hoạt hóa phân tử', badge: 'Giai Đoạn 2' },
          { stageNumber: 3, title: 'Phân ly (Pha 3)', description: 'Tách chiết và giải phóng năng lượng', badge: 'Giai Đoạn 3' },
          { stageNumber: 4, title: 'Hoàn tất (Pha 4)', description: 'Tạo sản phẩm bền vững và lập lại chu trình', badge: 'Giai Đoạn 4' },
        ],
        narration: 'Tiến trình này diễn ra liên tục theo các giai đoạn được kiểm soát nghiêm ngặt.',
        durationInFrames: 180,
      };
    } else if (type === 'GEOMETRY_SPACE') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'GEOMETRY_SPACE',
        title: `Scene ${sceneNum}: Hình học trực quan & định lý`,
        shapeType: 'pythagoras_triangle',
        theoremName: 'Định Lý Pytago Trong Tam Giác Vuông',
        formulaLatex: 'a^2 + b^2 = c^2',
        dimensions: { a: 3, b: 4, c: 5 },
        explanation: 'Diện tích hai hình vuông trên hai cạnh góc vuông bù đúng bằng diện tích hình vuông cạnh huyền.',
        narration: 'Mô hình hình học trực quan giúp học sinh ghi nhớ bản chất diện tích của định lý Pytago.',
        durationInFrames: 180,
      };
    } else if (type === 'DIAGRAM_EXPLAINER') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'DIAGRAM_EXPLAINER',
        title: `Scene ${sceneNum}: Sơ đồ giải thích cơ chế`,
        diagramTitle: 'Cấu Trúc Mô Hình Vật Lý',
        svgType: 'circuit',
        labels: [
          { name: 'Nguồn điện', description: 'Cung cấp năng lượng', xPercent: 20, yPercent: 40 },
          { name: 'Tải tiêu thụ', description: 'Biến đổi quang/nhiệt', xPercent: 80, yPercent: 60 },
        ],
        narration: 'Sơ đồ giúp chúng ta hình dung trực tiếp đường đi của các đại lượng vật lý.',
        durationInFrames: 180,
      };
    } else if (type === 'ALGORITHM_WALKTHROUGH') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'ALGORITHM_WALKTHROUGH',
        title: `Scene ${sceneNum}: Mô phỏng thuật toán lập trình`,
        language: 'python',
        codeSnippet: 'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1',
        steps: [
          { lineHighlight: 2, variableState: 'low=0, high=9', note: 'Thiết lập phạm vi tìm kiếm ban đầu' },
          { lineHighlight: 4, variableState: 'mid=4, arr[mid]=15', note: 'So sánh phần tử chính giữa' },
        ],
        narration: 'Thuật toán tìm kiếm nhị phân giảm một nửa không gian tìm kiếm sau mỗi bước lặp.',
        durationInFrames: 180,
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
    } else if (type === 'OUTRO') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'OUTRO',
        title: `Scene ${sceneNum}: Tổng kết bài học & Bài tập LMS`,
        summaryPoints: [
          'Nắm vững bản chất quy luật và phương trình',
          'Biết vận dụng công thức vào bài toán thực tiễn',
          'Luyện tập các câu hỏi kiểm tra trên Canvas LMS',
        ],
        nextLessonSuggestion: 'Bài tiếp theo: Ứng dụng nâng cao trong kỹ thuật',
        instructorName: 'Tổ Chuyên Môn STEM',
        narration: 'Cảm ơn các em đã theo dõi bài giảng hôm nay. Hãy hoàn thành các bài tập củng cố trên LMS.',
        durationInFrames: 150,
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

    projectService.updateProject(currentScript.id, updatedScript);

    if (apiClient.isMockMode()) {
      return { updatedScript, newScene };
    }

    try {
      const res = await apiClient.put<STEMScript>(`/scripts/${currentScript.id}`, {
        scenes: updatedScript.scenes,
      });
      return { updatedScript: res || updatedScript, newScene };
    } catch (error) {
      console.warn('[scriptService] Backend add scene failed, added locally:', error);
      return { updatedScript, newScene };
    }
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

    projectService.updateProject(currentScript.id, updatedScript);

    if (apiClient.isMockMode()) {
      return updatedScript;
    }

    try {
      await apiClient.put(`/scripts/${currentScript.id}`, { scenes: filtered });
    } catch (error) {
      console.warn('[scriptService] Backend delete scene failed, deleted locally:', error);
    }
    return updatedScript;
  },
};
