import type { ComposedBlock, SceneData } from '../../types/stem';
import { layoutBlocks, timeBlocks } from '../composed/layout';

export interface LegoPieceDescriptor {
  /** Unique ID matching `data-lego-id` inside the Remotion composition */
  id: string;
  /** Human-readable Vietnamese label */
  label: string;
  /** Category/kind of Lego block */
  kind: 'title' | 'subtitle' | 'formula' | 'step' | 'card' | 'chart' | 'diagram' | 'quiz' | 'badge' | 'composed' | 'extra';
  /** Default bounding box in 1920x1080 canvas coordinates (before dx/dy/scale or DOM measurement) */
  defaultRect: { x: number; y: number; w: number; h: number };
  /** Whether this piece is a native COMPOSED block (`scene.blocks[i]`) */
  isComposedBlock?: boolean;
  /** Whether this piece is an extra freeform block (`scene.extraBlocks[i]`) */
  isExtraBlock?: boolean;
  /** Block index when `isComposedBlock` or `isExtraBlock` is true */
  blockIndex?: number;
  /** Current primary text value (if inline-editable) */
  textValue?: string;
  /** Secondary text value (if applicable, e.g. formula / description) */
  subTextValue?: string;
  /** Callback to produce partial SceneData patch when primary text is edited */
  buildTextPatch?: (newText: string, newSubText?: string) => Partial<SceneData>;
}

/**
 * Returns all addressable Lego pieces for a given scene, including:
 * 1. Modular sub-components of the template (or blocks of a COMPOSED scene)
 * 2. Any user-added freeform `extraBlocks`
 */
export function getSceneLegoPieces(scene: SceneData): LegoPieceDescriptor[] {
  const pieces: LegoPieceDescriptor[] = [];

  switch (scene.type) {
    case 'TITLE_HERO': {
      pieces.push(
        {
          id: 'badge',
          label: 'Nhãn mở đầu (Badge)',
          kind: 'badge',
          defaultRect: { x: 680, y: 240, w: 560, h: 68 },
          textValue: scene.badgeText || 'STEMotion Studio',
          subTextValue: `${scene.subject || 'Math'} • ${scene.gradeLevel || 'THPT'}`,
          buildTextPatch: (badgeText) => ({ badgeText }),
        },
        {
          id: 'title',
          label: 'Tiêu đề chính (Title)',
          kind: 'title',
          defaultRect: { x: 200, y: 340, w: 1520, h: 240 },
          textValue: scene.title,
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'subtitle',
          label: 'Phụ đề (Subtitle)',
          kind: 'subtitle',
          defaultRect: { x: 320, y: 610, w: 1280, h: 160 },
          textValue: scene.subtitle || '',
          buildTextPatch: (subtitle) => ({ subtitle }),
        },
      );
      break;
    }

    case 'MATH_FORMULA': {
      pieces.push(
        {
          id: 'header',
          label: 'Thanh Tiêu đề (Header)',
          kind: 'title',
          defaultRect: { x: 64, y: 60, w: 1792, h: 90 },
          textValue: scene.title,
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'formula-card',
          label: 'Khung Công thức Cốt lõi (KaTeX)',
          kind: 'formula',
          defaultRect: { x: 320, y: 260, w: 1280, h: 280 },
          textValue: scene.latex,
          buildTextPatch: (latex) => ({ latex }),
        },
      );

      const safeSteps = Array.isArray(scene.steps) && scene.steps.length > 0
        ? scene.steps
        : [
            { label: 'Bước 1', latexSnippet: 'a \\neq 0', explanation: 'Điều kiện xác định của phương trình' },
            { label: 'Bước 2', latexSnippet: '\\Delta = b^2 - 4ac', explanation: 'Biệt thức quyết định số nghiệm' },
            { label: 'Bước 3', latexSnippet: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', explanation: 'Nghiệm tổng quát của phương trình' },
          ];
      const count = Math.max(1, safeSteps.length);
      const colW = Math.floor((1792 - (count - 1) * 24) / count);
      safeSteps.forEach((st, idx) => {
        pieces.push({
          id: `step-${idx}`,
          label: `Thẻ Bước #${idx + 1}: ${st.label}`,
          kind: 'step',
          defaultRect: { x: 64 + idx * (colW + 24), y: 740, w: colW, h: 240 },
          textValue: st.explanation,
          subTextValue: st.latexSnippet,
          buildTextPatch: (explanation, latexSnippet) => {
            const nextSteps = [...safeSteps];
            nextSteps[idx] = {
              ...nextSteps[idx],
              explanation,
              ...(latexSnippet !== undefined ? { latexSnippet } : {}),
            };
            return { steps: nextSteps };
          },
        });
      });
      break;
    }

    case 'CHEMICAL_REACTION': {
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề Phản ứng',
          kind: 'title',
          defaultRect: { x: 56, y: 56, w: 1808, h: 86 },
          textValue: scene.title,
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'flask-card',
          label: 'Mô phỏng Bình phản ứng & Điều kiện',
          kind: 'diagram',
          defaultRect: { x: 180, y: 180, w: 620, h: 780 },
          textValue: scene.condition || 'Đốt nóng (t° > 500°C)',
          buildTextPatch: (condition) => ({ condition }),
        },
        {
          id: 'equation-card',
          label: 'Khung Phương trình Hóa học',
          kind: 'formula',
          defaultRect: { x: 840, y: 180, w: 900, h: 230 },
          textValue: scene.equation,
          buildTextPatch: (equation) => ({ equation }),
        },
        {
          id: 'reactants-box',
          label: 'Thẻ Chất tham gia (Reactants)',
          kind: 'card',
          defaultRect: { x: 840, y: 440, w: 438, h: 230 },
          textValue: scene.reactants,
          buildTextPatch: (reactants) => ({ reactants }),
        },
        {
          id: 'products-box',
          label: 'Thẻ Sản phẩm (Products)',
          kind: 'card',
          defaultRect: { x: 1302, y: 440, w: 438, h: 230 },
          textValue: scene.products,
          buildTextPatch: (products) => ({ products }),
        },
        {
          id: 'observation-banner',
          label: 'Khung Hiện tượng Quan sát',
          kind: 'subtitle',
          defaultRect: { x: 840, y: 700, w: 900, h: 250 },
          textValue: scene.observation,
          buildTextPatch: (observation) => ({ observation }),
        },
      );
      break;
    }

    case 'COMPARISON_SPLIT': {
      const topA = scene.topicA || {
        title: 'Khái Niệm A',
        badge: 'Đặc tính A',
        points: ['Đặc trưng cốt lõi của hiện tượng A'],
      };
      const topB = scene.topicB || {
        title: 'Khái Niệm B',
        badge: 'Đặc tính B',
        points: ['Đặc trưng tương phản của hiện tượng B'],
      };
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề So sánh',
          kind: 'title',
          defaultRect: { x: 48, y: 48, w: 1824, h: 86 },
          textValue: scene.title,
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'left-column',
          label: `Cột Trái: ${topA.title}`,
          kind: 'card',
          defaultRect: { x: 120, y: 165, w: 760, h: 720 },
          textValue: topA.title,
          subTextValue: (topA.points || []).join('\n'),
          buildTextPatch: (title, pointsText) => ({
            topicA: {
              ...topA,
              title,
              points:
                pointsText !== undefined
                  ? pointsText.split('\n').map((s) => s.trim()).filter(Boolean)
                  : topA.points,
            },
          }),
        },
        {
          id: 'vs-badge',
          label: 'Huy hiệu VS trung tâm',
          kind: 'badge',
          defaultRect: { x: 910, y: 480, w: 100, h: 100 },
        },
        {
          id: 'right-column',
          label: `Cột Phải: ${topB.title}`,
          kind: 'card',
          defaultRect: { x: 1040, y: 165, w: 760, h: 720 },
          textValue: topB.title,
          subTextValue: (topB.points || []).join('\n'),
          buildTextPatch: (title, pointsText) => ({
            topicB: {
              ...topB,
              title,
              points:
                pointsText !== undefined
                  ? pointsText.split('\n').map((s) => s.trim()).filter(Boolean)
                  : topB.points,
            },
          }),
        },
        {
          id: 'conclusion-banner',
          label: 'Thanh Kết luận Sư phạm',
          kind: 'subtitle',
          defaultRect: { x: 48, y: 920, w: 1824, h: 100 },
          textValue: scene.conclusion || '',
          buildTextPatch: (conclusion) => ({ conclusion }),
        },
      );
      break;
    }

    case 'PROCESS_TIMELINE': {
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề Tiến trình',
          kind: 'title',
          defaultRect: { x: 56, y: 56, w: 1808, h: 84 },
          textValue: scene.title,
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'process-subheader',
          label: 'Chủ đề Chu trình',
          kind: 'subtitle',
          defaultRect: { x: 460, y: 155, w: 1000, h: 80 },
          textValue: scene.processTitle,
          buildTextPatch: (processTitle) => ({ processTitle }),
        },
      );
      const safeStages = Array.isArray(scene.stages) && scene.stages.length > 0
        ? scene.stages
        : [
            { stageNumber: 1, title: 'Giai Đoạn 1', description: 'Khởi đầu tiến trình khoa học', badge: 'Pha 1' },
            { stageNumber: 2, title: 'Giai Đoạn 2', description: 'Chuyển hóa và phản ứng trọng tâm', badge: 'Pha 2' },
            { stageNumber: 3, title: 'Giai Đoạn 3', description: 'Phân ly và giải phóng năng lượng', badge: 'Pha 3' },
            { stageNumber: 4, title: 'Giai Đoạn 4', description: 'Hoàn tất và thiết lập trạng thái bền vững', badge: 'Pha 4' },
          ];
      const count = Math.max(1, safeStages.length);
      const cardW = Math.floor((1680 - (count - 1) * 20) / count);
      safeStages.forEach((st, idx) => {
        const x = 120 + idx * (cardW + 20);
        pieces.push({
          id: `stage-${idx}`,
          label: `Giai đoạn #${idx + 1}: ${st.title}`,
          kind: 'step',
          defaultRect: { x, y: 340, w: cardW, h: 520 },
          textValue: st.title,
          subTextValue: st.description,
          buildTextPatch: (title, description) => {
            const nextStages = [...safeStages];
            nextStages[idx] = {
              ...nextStages[idx],
              title,
              ...(description !== undefined ? { description } : {}),
            };
            return { stages: nextStages };
          },
        });
      });
      break;
    }

    case 'STEM_QUIZ': {
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề Câu hỏi',
          kind: 'title',
          defaultRect: { x: 64, y: 60, w: 1792, h: 86 },
          textValue: scene.title || 'Câu Hỏi Trắc Nghiệm',
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'question-box',
          label: 'Khung Câu hỏi chính',
          kind: 'quiz',
          defaultRect: { x: 260, y: 200, w: 1400, h: 185 },
          textValue: scene.question,
          buildTextPatch: (question) => ({ question }),
        },
      );
      const safeOptions = Array.isArray(scene.options) && scene.options.length > 0
        ? scene.options
        : [
            'Phương án A: Khẳng định đúng',
            'Phương án B: Chưa chính xác',
            'Phương án C: Điều kiện chưa đủ',
            'Phương án D: Cả A và B',
          ];
      safeOptions.forEach((optText, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const letter = String.fromCharCode(65 + idx);
        pieces.push({
          id: `option-${idx}`,
          label: `Đáp án ${letter} (${idx === scene.correctIndex ? 'Đúng' : 'Lựa chọn'})`,
          kind: 'card',
          defaultRect: {
            x: 260 + col * 710,
            y: 415 + row * 170,
            w: 690,
            h: 150,
          },
          textValue: optText,
          buildTextPatch: (newText) => {
            const nextOptions = [...safeOptions];
            nextOptions[idx] = newText;
            return { options: nextOptions };
          },
        });
      });
      pieces.push({
        id: 'explanation-box',
        label: 'Khung Giải thích Đáp án',
        kind: 'subtitle',
        defaultRect: { x: 260, y: 780, w: 1400, h: 140 },
        textValue: scene.explanation || '',
        buildTextPatch: (explanation) => ({ explanation }),
      });
      break;
    }

    case 'GEOMETRY_SPACE': {
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề Hình học',
          kind: 'title',
          defaultRect: { x: 56, y: 56, w: 1808, h: 86 },
          textValue: scene.title,
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'shape-stage',
          label: 'Mô hình Hình học trực quan (SVG)',
          kind: 'diagram',
          defaultRect: { x: 140, y: 180, w: 660, h: 780 },
        },
        {
          id: 'formulas-panel',
          label: 'Khung Định lý & Công thức (KaTeX)',
          kind: 'formula',
          defaultRect: { x: 840, y: 180, w: 940, h: 250 },
          textValue: scene.theoremName,
          subTextValue: scene.formulaLatex,
          buildTextPatch: (theoremName, formulaLatex) => ({
            theoremName,
            ...(formulaLatex !== undefined ? { formulaLatex } : {}),
          }),
        },
        {
          id: 'dimensions-row',
          label: 'Hàng Thông số Kích thước (a, b, c)',
          kind: 'card',
          defaultRect: { x: 840, y: 460, w: 940, h: 190 },
          textValue: `${scene.dimensions?.a ?? 3}, ${scene.dimensions?.b ?? 4}, ${scene.dimensions?.c ?? 5}`,
          buildTextPatch: (val) => {
            const parts = val.split(',').map((s) => Number(s.trim()));
            return {
              dimensions: {
                a: Number.isFinite(parts[0]) ? parts[0] : (scene.dimensions?.a ?? 3),
                b: Number.isFinite(parts[1]) ? parts[1] : (scene.dimensions?.b ?? 4),
                c: Number.isFinite(parts[2]) ? parts[2] : (scene.dimensions?.c ?? 5),
              },
            };
          },
        },
        {
          id: 'properties-panel',
          label: 'Khung Ý nghĩa Hình học trực quan',
          kind: 'subtitle',
          defaultRect: { x: 840, y: 680, w: 940, h: 260 },
          textValue: scene.explanation,
          buildTextPatch: (explanation) => ({ explanation }),
        },
      );
      break;
    }

    case 'DATA_CHART': {
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề Biểu đồ',
          kind: 'title',
          defaultRect: { x: 64, y: 60, w: 1792, h: 86 },
          textValue: scene.title,
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'chart-canvas',
          label: 'Khung Biểu đồ Chính',
          kind: 'chart',
          defaultRect: { x: 260, y: 220, w: 1400, h: 680 },
          textValue: scene.yAxisLabel,
          subTextValue: scene.xAxisLabel,
          buildTextPatch: (yAxisLabel, xAxisLabel) => ({
            yAxisLabel,
            ...(xAxisLabel !== undefined ? { xAxisLabel } : {}),
          }),
        },
      );
      const safeData = Array.isArray(scene.dataPoints) && scene.dataPoints.length > 0
        ? scene.dataPoints
        : [
            { label: 'Mẫu A', value: 12 },
            { label: 'Mẫu B', value: 24 },
            { label: 'Mẫu C', value: 38 },
          ];
      const count = Math.max(1, safeData.length);
      const itemW = Math.min(240, Math.floor(1240 / count));
      safeData.forEach((d, idx) => {
        pieces.push({
          id: `data-point-${idx}`,
          label: `Cột dữ liệu #${idx + 1}: ${d.label}`,
          kind: 'step',
          defaultRect: {
            x: 340 + idx * (itemW + 32),
            y: 340,
            w: itemW,
            h: 460,
          },
          textValue: d.label,
          subTextValue: String(d.value),
          buildTextPatch: (label, valStr) => {
            const nextData = [...safeData];
            const parsedVal = valStr !== undefined ? Number(valStr) : nextData[idx].value;
            nextData[idx] = {
              ...nextData[idx],
              label,
              value: Number.isFinite(parsedVal) ? parsedVal : nextData[idx].value,
            };
            return { dataPoints: nextData };
          },
        });
      });
      break;
    }

    case 'DIAGRAM_EXPLAINER': {
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề Sơ đồ',
          kind: 'title',
          defaultRect: { x: 64, y: 60, w: 1792, h: 86 },
          textValue: scene.title,
          subTextValue: scene.diagramTitle,
          buildTextPatch: (title, diagramTitle) => ({
            title,
            ...(diagramTitle !== undefined ? { diagramTitle } : {}),
          }),
        },
        {
          id: 'center-diagram',
          label: `Khung Sơ đồ Mô phỏng (${scene.diagramTitle || 'Diagram'})`,
          kind: 'diagram',
          defaultRect: { x: 260, y: 260, w: 660, h: 540 },
          textValue: scene.diagramTitle,
          buildTextPatch: (diagramTitle) => ({ diagramTitle }),
        },
      );
      const safeLabels = Array.isArray(scene.labels) && scene.labels.length > 0
        ? scene.labels
        : [
            { name: 'Cấu trúc trọng tâm', description: 'Phần tử tương tác chính của hệ thống', xPercent: 50, yPercent: 40 },
            { name: 'Trường lực / Môi trường', description: 'Tác nhân kích hoạt phản ứng hoặc chuyển động', xPercent: 50, yPercent: 70 },
          ];
      safeLabels.forEach((lbl, idx) => {
        pieces.push({
          id: `label-${idx}`,
          label: `Nhãn chú thích #${idx + 1}: ${lbl.name}`,
          kind: 'card',
          defaultRect: {
            x: 980,
            y: 260 + idx * 175,
            w: 680,
            h: 155,
          },
          textValue: lbl.name,
          subTextValue: lbl.description,
          buildTextPatch: (name, description) => {
            const nextLabels = [...safeLabels];
            nextLabels[idx] = {
              ...nextLabels[idx],
              name,
              ...(description !== undefined ? { description } : {}),
            };
            return { labels: nextLabels };
          },
        });
      });
      break;
    }

    case 'ALGORITHM_WALKTHROUGH': {
      const safeSteps = Array.isArray(scene.steps) && scene.steps.length > 0
        ? scene.steps
        : [
            { lineHighlight: 1, variableState: 'n = 5', note: 'Khởi tạo tham số thuật toán' },
            { lineHighlight: 3, variableState: 'result = 10', note: 'Tính toán giá trị trả về' },
          ];
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề Thuật toán',
          kind: 'title',
          defaultRect: { x: 64, y: 60, w: 1792, h: 86 },
          textValue: scene.title,
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'code-panel',
          label: `Khung Mã nguồn (${scene.language || 'python'})`,
          kind: 'card',
          defaultRect: { x: 240, y: 240, w: 700, h: 620 },
          textValue: scene.codeSnippet,
          buildTextPatch: (codeSnippet) => ({ codeSnippet }),
        },
        {
          id: 'memory-panel',
          label: 'Khung Trạng thái Bộ nhớ (Memory Heap)',
          kind: 'card',
          defaultRect: { x: 980, y: 240, w: 700, h: 620 },
          textValue: safeSteps[0]?.note || '',
          subTextValue: safeSteps[0]?.variableState || '',
          buildTextPatch: (note, variableState) => {
            const nextSteps = [...safeSteps];
            nextSteps[0] = {
              ...nextSteps[0],
              note,
              ...(variableState !== undefined ? { variableState } : {}),
            };
            return { steps: nextSteps };
          },
        },
      );
      break;
    }

    case 'OUTRO': {
      const safePoints = Array.isArray(scene.summaryPoints) && scene.summaryPoints.length > 0
        ? scene.summaryPoints
        : [
            'Nắm vững bản chất và công thức trọng tâm',
            'Hoàn thành bài tập thực hành trên hệ thống LMS',
            'Đón chờ chuyên đề ứng dụng trong bài học kế tiếp',
          ];
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề Tổng kết',
          kind: 'title',
          defaultRect: { x: 64, y: 60, w: 1792, h: 86 },
          textValue: scene.title,
          buildTextPatch: (title) => ({ title }),
        },
        {
          id: 'takeaways-list',
          label: 'Khung Điểm cốt lõi cần ghi nhớ',
          kind: 'card',
          defaultRect: { x: 240, y: 250, w: 700, h: 620 },
          textValue: safePoints.join('\n'),
          subTextValue: scene.instructorName || 'STEMotion Academy',
          buildTextPatch: (val, instructorName) => ({
            summaryPoints: val.split('\n').map((s) => s.trim()).filter(Boolean),
            ...(instructorName !== undefined ? { instructorName } : {}),
          }),
        },
        {
          id: 'cta-banner',
          label: 'Khung Bài học Tiếp theo (Next Lesson)',
          kind: 'card',
          defaultRect: { x: 980, y: 250, w: 700, h: 620 },
          textValue: scene.nextLessonSuggestion || 'Bài học chuyên đề tiếp theo',
          buildTextPatch: (nextLessonSuggestion) => ({ nextLessonSuggestion }),
        },
      );
      break;
    }

    case 'ILLUSTRATED_EXPLAINER': {
      pieces.push(
        {
          id: 'header',
          label: 'Tiêu đề & Phụ đề Minh họa (Headline)',
          kind: 'title',
          defaultRect: { x: 120, y: 60, w: 1680, h: 170 },
          textValue: scene.headline,
          subTextValue: scene.caption || '',
          buildTextPatch: (headline, caption) => ({
            headline,
            ...(caption !== undefined ? { caption } : {}),
          }),
        },
        {
          id: 'hero-illustration',
          label: `Sân khấu Minh họa (${scene.layout || 'focus'})`,
          kind: 'diagram',
          defaultRect: { x: 220, y: 310, w: 1480, h: 680 },
          textValue: (scene.icons || []).map((ic) => `${ic.name}:${ic.label || ''}`).join(', '),
          buildTextPatch: (val) => {
            const parsed = val
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
              .map((pair) => {
                const [name, ...rest] = pair.split(':');
                const label = rest.join(':').trim();
                return { name: name.trim() || 'sparkle', ...(label ? { label } : {}) };
              });
            return parsed.length > 0 ? { icons: parsed } : {};
          },
        },
      );
      break;
    }

    case 'COMPOSED': {
      const totalFrames = Math.max(1, scene.durationInFrames || 180);
      const timed = timeBlocks(scene.blocks || [], scene.narration || '', totalFrames);
      const rectMap = layoutBlocks(scene.frame || 'center', timed);

      (scene.blocks || []).forEach((block, idx) => {
        const rect = rectMap.get(block.id) || {
          x: block.x ?? 200,
          y: block.y ?? 200 + idx * 140,
          w: block.w ?? 720,
          h: block.h ?? 220,
        };
        const { textValue, subTextValue } = extractBlockEditableText(block);
        pieces.push({
          id: block.id,
          label: `Khối [${block.kind.toUpperCase()}] #${idx + 1} (${block.id})`,
          kind: 'composed',
          defaultRect: rect,
          isComposedBlock: true,
          blockIndex: idx,
          textValue,
          subTextValue,
          buildTextPatch: (newText, newSub) => {
            const nextBlocks = [...scene.blocks];
            nextBlocks[idx] = applyBlockEditableText(nextBlocks[idx], newText, newSub);
            return { blocks: nextBlocks };
          },
        });
      });
      break;
    }
  }

  // Append any extra freeform Lego blocks added by the user
  if (scene.extraBlocks && scene.extraBlocks.length > 0) {
    scene.extraBlocks.forEach((block, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const rect = {
        x: block.x ?? 160 + col * 820,
        y: block.y ?? 180 + row * 260,
        w: block.w ?? 760,
        h: block.h ?? 220,
      };
      const { textValue, subTextValue } = extractBlockEditableText(block);
      pieces.push({
        id: block.id,
        label: `Lego Thêm [${block.kind.toUpperCase()}]: ${block.id}`,
        kind: 'extra',
        defaultRect: rect,
        isExtraBlock: true,
        blockIndex: idx,
        textValue,
        subTextValue,
        buildTextPatch: (newText, newSub) => {
          const nextExtra = [...(scene.extraBlocks || [])];
          nextExtra[idx] = applyBlockEditableText(nextExtra[idx], newText, newSub);
          return { extraBlocks: nextExtra };
        },
      });
    });
  }

  return pieces;
}

export function extractBlockEditableText(block: ComposedBlock): {
  textValue?: string;
  subTextValue?: string;
} {
  switch (block.kind) {
    case 'title':
    case 'text':
    case 'guide':
    case 'highlight':
    case 'arrow':
      return { textValue: block.text || '' };
    case 'list':
      return { textValue: (block.items || []).join('\n'), subTextValue: block.text || '' };
    case 'formula':
      return { textValue: block.latex || '', subTextValue: block.text || '' };
    case 'icon':
      return {
        textValue: block.icon?.label || block.text || block.icon?.name || '',
        subTextValue: block.icon?.name || '',
      };
    case 'number':
      return {
        textValue: block.value !== undefined ? String(block.value) : '0',
        subTextValue: block.text || block.unit || '',
      };
    case 'choice':
      return {
        textValue: block.question || block.text || '',
        subTextValue: (block.options || []).join('\n'),
      };
    default:
      return {};
  }
}

export function applyBlockEditableText(
  block: ComposedBlock,
  newText: string,
  newSubText?: string,
): ComposedBlock {
  switch (block.kind) {
    case 'title':
    case 'text':
    case 'guide':
    case 'highlight':
    case 'arrow':
      return {
        ...block,
        text: newText,
      };
    case 'list':
      return {
        ...block,
        items: newText.split('\n').map((s) => s.trim()).filter(Boolean),
        ...(newSubText !== undefined ? { text: newSubText } : {}),
      };
    case 'formula':
      return {
        ...block,
        latex: newText,
        ...(newSubText !== undefined ? { text: newSubText } : {}),
      };
    case 'icon':
      return {
        ...block,
        text: newText,
        icon: {
          name: newSubText || block.icon?.name || 'atom',
          label: newText,
        },
      };
    case 'number': {
      const numVal = Number(newText);
      return {
        ...block,
        value: Number.isFinite(numVal) ? numVal : (block.value ?? 0),
        ...(newSubText !== undefined ? { text: newSubText } : {}),
      };
    }
    case 'choice':
      return {
        ...block,
        question: newText,
        ...(newSubText !== undefined
          ? { options: newSubText.split('\n').map((s) => s.trim()).filter(Boolean) }
          : {}),
      };
    default:
      return block;
  }
}

/**
 * Factory to create a new freeform `ComposedBlock` when the user clicks "+ Thêm Khối Lego".
 */
export function createLegoBlockPreset(
  preset: 'text' | 'formula' | 'number' | 'icon' | 'list' | 'guide',
  indexSeed: number,
): ComposedBlock {
  const id = `lego_${preset}_${Date.now().toString(36).slice(-4)}_${indexSeed}`;
  const baseRect = {
    x: 560 + ((indexSeed * 40) % 240),
    y: 340 + ((indexSeed * 40) % 200),
    w: 760,
    h: 240,
  };

  switch (preset) {
    case 'text':
      return {
        id,
        kind: 'text',
        text: 'Nhập nội dung giải thích hoặc ghi chú bổ sung tại đây.',
        tone: 'accent',
        motion: 'pop',
        ...baseRect,
      };
    case 'formula':
      return {
        id,
        kind: 'formula',
        latex: 'E = m \\cdot c^2',
        text: 'Công thức bổ sung',
        motion: 'pop',
        ...baseRect,
      };
    case 'number':
      return {
        id,
        kind: 'number',
        value: 99.9,
        unit: '%',
        text: 'Chỉ số nổi bật',
        motion: 'pop',
        ...baseRect,
        w: 520,
        h: 240,
      };
    case 'icon':
      return {
        id,
        kind: 'icon',
        icon: { name: 'atom', label: 'Mô hình Minh họa' },
        text: 'Chú thích trực quan',
        motion: 'pop',
        ...baseRect,
        w: 520,
        h: 320,
      };
    case 'list':
      return {
        id,
        kind: 'list',
        text: 'Các ý chính',
        items: ['Ý quan trọng thứ nhất', 'Ý quan trọng thứ hai', 'Ý quan trọng thứ ba'],
        motion: 'rise',
        ...baseRect,
        h: 320,
      };
    case 'guide':
      return {
        id,
        kind: 'guide',
        pose: 'point',
        text: 'Hãy chú ý đến chi tiết quan trọng này nhé!',
        motion: 'pop',
        ...baseRect,
        w: 680,
        h: 260,
      };
  }
}
