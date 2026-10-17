/**
 * STEMotion Front-End - Script & Scene Service
 * Handles AI generation and scene mutations
 */

import { apiClient } from './apiClient';
import { STEMScript, STEMSubject, SceneData, SceneType } from '../types/stem';
import { sceneSaveQueue } from './sceneSaveQueue';
import { ComposedContentError, composedPropsFrom } from './composed';

export type AiAction = 'resegment' | 'grade' | 'extract' | 'terms' | 'metaphor';

/** Raw payload the AI endpoint returns, plus the metadata the UI shows. */
export interface AiActionResult {
  action: AiAction;
  result: any;
  model: string;
  elapsedMs: number;
  requestId?: string;
}

/** One way to lead a video through a lesson, as suggested by the AI. */
export interface LessonApproach {
  name: string;
  hook: string;
  flow: string[];
  whyItFits: string;
}

/** The text sent as the chosen approach when drafting. */
export const describeApproach = (a: LessonApproach): string =>
  [a.name, a.hook && `Mở đầu: ${a.hook}`, a.flow.length ? `Mạch: ${a.flow.join(' → ')}` : '']
    .filter(Boolean)
    .join('. ')
    .slice(0, 800);

export const scriptService = {
  /** Kept for callers that only want the segmentation analysis. */
  async segmentScript(
    rawScript: string,
    subject?: STEMSubject,
    gradeLevel?: string
  ): Promise<AiActionResult> {
    return this.runAiAction('resegment', rawScript, subject, gradeLevel);
  },

  /**
   * Runs one of the four on-demand analyses on the backend.
   *
   * Results are advisory: the caller shows them to the writer, who decides
   * whether to act on them. Nothing is written to the script here.
   */
  async runAiAction(
    action: AiAction,
    scriptText: string,
    subject?: STEMSubject,
    gradeLevel?: string
  ): Promise<AiActionResult> {

const res = await apiClient.post<any>('/ai/script/action', {
      action,
      scriptText,
      subject: subject || 'Math',
      gradeLevel: gradeLevel || 'Lớp 10',
    });
    return {
      action,
      result: res?.result ?? res,
      model: res?.model ?? 'unknown',
      elapsedMs: res?.elapsedMs ?? 0,
      requestId: res?.requestId,
    };
  },

  async decideAiRequest(requestId: string, decision: 'ACCEPTED' | 'IGNORED'): Promise<void> {
    await apiClient.put(`/ai/requests/${encodeURIComponent(requestId)}/decision`, {decision});
  },

  /**
   * Asks for three different ways to lead a video through the lesson. The
   * writer picks one, edits it or writes their own before drafting.
   */
  async suggestApproaches(topic: string, subject: STEMSubject, gradeLevel: string): Promise<LessonApproach[]> {
    const res = await apiClient.post<any>('/ai/script/approaches', { topic, subject, gradeLevel });
    const options = (res?.result ?? res)?.options;
    return (Array.isArray(options) ? options : [])
      .filter((o: any) => typeof o?.name === 'string' && o.name.trim())
      .map((o: any) => ({
        name: o.name.trim(),
        hook: typeof o.hook === 'string' ? o.hook : '',
        flow: Array.isArray(o.flow) ? o.flow.filter((s: unknown) => typeof s === 'string') : [],
        whyItFits: typeof o.whyItFits === 'string' ? o.whyItFits : '',
      }));
  },

  async generateScriptWithAI(
    topic: string,
    subject: STEMSubject,
    gradeLevel: string,
    targetDurationSec: number = 0,
    approach?: string
  ): Promise<STEMScript & {aiRequestId?: string; approachName?: string; flow?: string[]}> {
    const res = await apiClient.post<any>('/ai/script/generate', {
      topic,
      subject,
      gradeLevel,
      targetDurationSec,
      ...(approach?.trim() ? { approach: approach.trim() } : {}),
    });
    const payload = res?.result ?? res;
    const rawScenes: any[] = payload?.scenes || [];
    if (!Array.isArray(rawScenes) || rawScenes.length === 0) {
      throw new Error('AI không trả về phân cảnh hợp lệ; vui lòng thử lại.');
    }
    // Missing scientific content must not become fabricated lesson data: a
    // formula, equation, quiz, chart or process stage the AI did not supply is
    // an error the writer sees, never a placeholder that looks like real content.
    rawScenes.forEach((scene, index) => {
      const value = (key: string) => scene?.[key] ?? scene?.props?.[key];
      const nonEmpty = (key: string) => typeof value(key) === 'string' && value(key).trim().length > 0;
      let valid = scene != null && typeof scene === 'object';
      if (scene?.type === 'MATH_FORMULA') valid = nonEmpty('latex');
      if (scene?.type === 'CHEMICAL_REACTION') valid = nonEmpty('equation');
      if (scene?.type === 'STEM_QUIZ') {
        const options = value('options');
        const correctIndex = value('correctIndex');
        valid = nonEmpty('question') && Array.isArray(options) && options.length >= 2
          && options.every((option: unknown) => typeof option === 'string' && option.trim().length > 0)
          && Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < options.length;
      }
      if (scene?.type === 'DATA_CHART') {
        const points = value('dataPoints');
        valid = Array.isArray(points) && points.length > 0
          && points.every((point: any) => typeof point?.label === 'string'
            && point.label.trim().length > 0 && typeof point.value === 'number' && Number.isFinite(point.value));
      }
      if (scene?.type === 'PROCESS_TIMELINE') {
        const stages = value('stages');
        valid = Array.isArray(stages) && stages.length >= 2
          && stages.every((stage: any) => typeof stage?.title === 'string' && stage.title.trim().length > 0);
      }
      if (scene?.type === 'COMPOSED') {
        try {
          composedPropsFrom(scene);
        } catch (error) {
          if (!(error instanceof ComposedContentError)) throw error;
          throw new Error(`AI trả về dữ liệu thiếu hoặc sai ở phân cảnh ${index + 1} (COMPOSED: ${error.message}).`);
        }
      }
      if (!valid) throw new Error(`AI trả về dữ liệu thiếu hoặc sai ở phân cảnh ${index + 1} (${scene?.type ?? 'unknown'}).`);
    });

    const scenes: SceneData[] = rawScenes.map((sc, idx) => {
      const type = sc.type || 'ILLUSTRATED_EXPLAINER';
      const durationInFrames = sc.durationInFrames || 240;

      const base: any = {
        id: `scene_ai_${Date.now()}_${idx}`,
        type,
        title: sc.title || `Phân cảnh ${idx + 1}`,
        narration: sc.narration || '',
        durationInFrames,
      };

      if (type === 'TITLE_HERO') {
        return {
          ...base,
          subtitle: sc.subtitle || sc.props?.subtitle || `Chuyên đề ${subject} ${gradeLevel}`,
          badgeText: sc.badgeText || sc.props?.badgeText || 'STEMotion AI Studio',
          subject,
          gradeLevel,
        } as SceneData;
      }
      if (type === 'MATH_FORMULA') {
        const latex = sc.latex || sc.props?.latex;
        const rawSteps = sc.steps || sc.props?.steps;
        return {
          ...base,
          latex,
          steps: Array.isArray(rawSteps) && rawSteps.length > 0 ? rawSteps : [
            { label: 'Bước 1', latexSnippet: latex, explanation: sc.narration || 'Đại lượng trọng tâm' },
          ],
        } as SceneData;
      }
      if (type === 'PROCESS_TIMELINE') {
        const stages = (sc.stages || sc.props?.stages).map((st: any, sIdx: number) => ({
          stageNumber: st.stageNumber ?? (sIdx + 1),
          title: st.title,
          description: st.description || '',
          badge: st.badge || `Bước ${sIdx + 1}`,
        }));
        return {
          ...base,
          processTitle: sc.processTitle || sc.props?.processTitle || base.title,
          stages,
        } as SceneData;
      }
      if (type === 'STEM_QUIZ') {
        const options = sc.options || sc.props?.options;
        const correctIndex = sc.correctIndex ?? sc.props?.correctIndex;
        return {
          ...base,
          question: sc.question || sc.props?.question,
          options,
          correctIndex,
          hint: sc.hint || sc.props?.hint || 'Vận dụng kiến thức vừa học ở phần trước.',
          explanation: sc.explanation || sc.props?.explanation || 'Phương án chính xác theo quy luật bài giảng.',
        } as SceneData;
      }
      if (type === 'CHEMICAL_REACTION') {
        return {
          ...base,
          equation: sc.equation || sc.props?.equation,
          reactants: sc.reactants || sc.props?.reactants || 'Chất tham gia',
          products: sc.products || sc.props?.products || 'Chất sản phẩm',
          condition: sc.condition || sc.props?.condition || 'Điều kiện tiêu chuẩn',
          observation: sc.observation || sc.props?.observation || 'Hiện tượng phản ứng rõ rệt',
        } as SceneData;
      }
      if (type === 'COMPARISON_SPLIT') {
        const topicA = sc.topicA || sc.props?.topicA;
        const topicB = sc.topicB || sc.props?.topicB;
        return {
          ...base,
          topicA: topicA && topicA.title && Array.isArray(topicA.points) ? topicA : {
            title: sc.leftTitle || topicA?.title || 'Khái niệm A',
            badge: topicA?.badge || 'Đặc tính A',
            points: sc.leftPoints || topicA?.points || ['Đặc trưng cốt lõi A', 'Mô hình ứng dụng thực tế'],
          },
          topicB: topicB && topicB.title && Array.isArray(topicB.points) ? topicB : {
            title: sc.rightTitle || topicB?.title || 'Khái niệm B',
            badge: topicB?.badge || 'Đặc tính B',
            points: sc.rightPoints || topicB?.points || ['Đặc trưng tương phản B', 'Ứng dụng trong kỹ thuật'],
          },
          conclusion: sc.conclusion || sc.props?.conclusion || 'Cả hai mô hình bổ trợ cho nhau tùy theo điều kiện thực tế.',
        } as SceneData;
      }
      if (type === 'DATA_CHART') {
        const dataPoints = (sc.dataPoints || sc.props?.dataPoints).map((pt: any) => ({
          label: String(pt.label),
          value: pt.value,
        }));
        return {
          ...base,
          chartType: sc.chartType || sc.props?.chartType || 'bar',
          xAxisLabel: sc.xAxisLabel || sc.props?.xAxisLabel || 'Tham số X',
          yAxisLabel: sc.yAxisLabel || sc.props?.yAxisLabel || 'Giá trị Y',
          dataPoints,
        } as SceneData;
      }
      if (type === 'ILLUSTRATED_EXPLAINER') {
        const rawIcons = sc.icons ?? sc.props?.icons;
        const icons = Array.isArray(rawIcons) && rawIcons.length > 0
          ? rawIcons.slice(0, 6).map((ic: any) => ({
              name: typeof ic?.name === 'string' && ic.name.trim() ? ic.name.trim() : 'sparkle',
              label: typeof ic?.label === 'string' && ic.label.trim() ? ic.label.trim() : 'Minh họa',
              ...(ic?.badge ? { badge: String(ic.badge) } : {}),
              ...(ic?.sub ? { sub: String(ic.sub) } : {}),
            }))
          : [{ name: 'sparkle', label: base.title }];
        return {
          ...sc.props,
          ...sc,
          ...base,
          headline: sc.headline || sc.props?.headline || base.title,
          caption: sc.caption ?? sc.props?.caption ?? '',
          ambience: sc.ambience || sc.props?.ambience || 'space',
          layout: sc.layout || sc.props?.layout || 'focus',
          detail: sc.detail || sc.props?.detail || 'rich',
          icons,
        } as SceneData;
      }
      if (type === 'COMPOSED') {
        return { ...base, ...composedPropsFrom(sc) } as SceneData;
      }
      if (type === 'OUTRO') {
        const rawSummary = sc.summaryPoints || sc.props?.summaryPoints;
        return {
          ...base,
          summaryPoints: Array.isArray(rawSummary) && rawSummary.length > 0
            ? rawSummary
            : ['Nắm vững kiến thức trọng tâm', 'Liên hệ cơ chế thực tiễn', 'Khám phá chủ đề tiếp theo'],
          nextLessonSuggestion: sc.nextLessonSuggestion || sc.props?.nextLessonSuggestion || 'Hẹn gặp lại các bạn trong video khám phá tiếp theo!',
          instructorName: sc.instructorName || sc.props?.instructorName || 'STEMotion Studio',
        } as SceneData;
      }

      return { ...base, ...sc } as SceneData;
    });

    return {
      aiRequestId: res?.requestId,
      approachName: typeof payload?.approachName === 'string' ? payload.approachName : undefined,
      flow: Array.isArray(payload?.flow) ? payload.flow.filter((s: unknown) => typeof s === 'string') : undefined,
      id: `SCR-${subject.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`,
      title: payload?.title || topic,
      subject,
      gradeLevel: payload?.gradeLevel || gradeLevel,
      version: '1.0',
      totalDurationSeconds: payload?.totalDurationSeconds || Math.round(scenes.reduce((acc, s) => acc + s.durationInFrames, 0) / 30),
      scriptStatus: 'DRAFT',
      scenes: scenes.length ? scenes : [
        {
          id: `sc_init_1`,
          type: 'TITLE_HERO',
          title: topic,
          subtitle: `Chuyên đề ${subject} ${gradeLevel}`,
          badgeText: 'STEMotion Studio',
          subject,
          gradeLevel,
          narration: `Chào mừng các em đến với bài học ${topic}.`,
          durationInFrames: 180,
        },
      ],
    };
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

    // Debounced and serialised: one save per pause in editing, never two at once.
    sceneSaveQueue.schedule(currentScript.id, updatedScenes);
    return updatedScript;
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
    } else if (type === 'COMPOSED') {
      // A starting point only: writers and producers add, remove and move blocks freely.
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'COMPOSED',
        title: `Scene ${sceneNum}: Cảnh tự do`,
        frame: 'split',
        ambience: 'space',
        blocks: [
          { id: 'title', kind: 'title', slot: 'top', text: 'Tiêu đề của cảnh' },
          { id: 'idea', kind: 'text', slot: 'left', at: 'ý chính', text: 'Ý chính của cảnh' },
          { id: 'picture', kind: 'icon', slot: 'right', at: 'hình ảnh', icon: { name: 'lightbulb', label: 'Minh hoạ' } },
        ],
        narration: 'Đây là ý chính của cảnh, đi kèm một hình ảnh minh hoạ.',
        durationInFrames: 240,
      };
    } else if (type === 'ILLUSTRATED_EXPLAINER') {
      newScene = {
        id: `scene_${Date.now()}`,
        type: 'ILLUSTRATED_EXPLAINER',
        title: `Scene ${sceneNum}: Minh họa phong cách flat explainer`,
        headline: 'Bên trong một nguyên tử',
        caption: 'Hạt nhân ở giữa, electron chuyển động xung quanh',
        ambience: 'space',
        layout: 'focus',
        icons: [
          { name: 'atom', label: 'Nguyên tử' },
          { name: 'lightning', label: 'Electron' },
          { name: 'sparkle', label: 'Năng lượng' },
        ],
        narration: 'Mọi vật chất quanh ta đều được tạo nên từ những nguyên tử nhỏ bé.',
        durationInFrames: 150,
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
        instructorName: 'Đội Ngũ STEMotion',
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

    const saved = await sceneSaveQueue.saveNow(currentScript.id, updatedScript.scenes);
    const persistedScene = saved.scenes.find(scene => scene.id === sceneSaveQueue.resolveId(currentScript.id, newScene.id));
    if (!persistedScene) throw new Error('Máy chủ không trả lại phân cảnh mới.');
    return { updatedScript: saved, newScene: persistedScene };
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

    return sceneSaveQueue.saveNow(currentScript.id, filtered);
  },
};
