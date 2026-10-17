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
        points: [
          'Đặc trưng cốt lõi của hiện tượng A',
          'Mô hình định lượng và điều kiện áp dụng',
          'Ý nghĩa ứng dụng trong thực tế',
        ],
      };
      const topB = scene.topicB || {
        title: 'Khái Niệm B',
        badge: 'Đặc tính B',
        points: [
          'Đặc trưng tương phản của hiện tượng B',
          'Mô hình biến thiên theo chu kỳ',
          'Ứng dụng tối ưu trong kỹ thuật',
        ],
      };
      const safePointsA = Array.isArray(topA.points) && topA.points.length > 0
        ? topA.points
        : [
            'Đặc trưng cốt lõi của hiện tượng A',
            'Mô hình định lượng và điều kiện áp dụng',
            'Ý nghĩa ứng dụng trong thực tế',
          ];
      const safePointsB = Array.isArray(topB.points) && topB.points.length > 0
        ? topB.points
        : [
            'Đặc trưng tương phản của hiện tượng B',
            'Mô hình biến thiên theo chu kỳ',
            'Ứng dụng tối ưu trong kỹ thuật',
          ];

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
          subTextValue: safePointsA.join('\n'),
          buildTextPatch: (title, pointsText) => ({
            topicA: {
              ...topA,
              title,
              points:
                pointsText !== undefined
                  ? pointsText.split('\n').map((s) => s.trim()).filter(Boolean)
                  : safePointsA,
            },
          }),
        },
      );

      safePointsA.forEach((pt, idx) => {
        pieces.push({
          id: `left-point-${idx}`,
          label: `Ý A.${idx + 1}: ${String(pt).slice(0, 24)}`,
          kind: 'step',
          defaultRect: { x: 148, y: 320 + idx * 110, w: 700, h: 90 },
          textValue: pt,
          buildTextPatch: (newPt) => {
            const nextPts = [...safePointsA];
            nextPts[idx] = newPt;
            return {
              topicA: {
                ...topA,
                points: nextPts,
              },
            };
          },
        });
      });

      pieces.push(
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
          subTextValue: safePointsB.join('\n'),
          buildTextPatch: (title, pointsText) => ({
            topicB: {
              ...topB,
              title,
              points:
                pointsText !== undefined
                  ? pointsText.split('\n').map((s) => s.trim()).filter(Boolean)
                  : safePointsB,
            },
          }),
        },
      );

      safePointsB.forEach((pt, idx) => {
        pieces.push({
          id: `right-point-${idx}`,
          label: `Ý B.${idx + 1}: ${String(pt).slice(0, 24)}`,
          kind: 'step',
          defaultRect: { x: 1068, y: 320 + idx * 110, w: 700, h: 90 },
          textValue: pt,
          buildTextPatch: (newPt) => {
            const nextPts = [...safePointsB];
            nextPts[idx] = newPt;
            return {
              topicB: {
                ...topB,
                points: nextPts,
              },
            };
          },
        });
      });

      pieces.push({
        id: 'conclusion-banner',
        label: 'Thanh Kết luận Sư phạm',
        kind: 'subtitle',
        defaultRect: { x: 48, y: 920, w: 1824, h: 100 },
        textValue: scene.conclusion || '',
        buildTextPatch: (conclusion) => ({ conclusion }),
      });
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
      const dimA = scene.dimensions?.a ?? 3;
      const dimB = scene.dimensions?.b ?? 4;
      const dimC = scene.dimensions?.c ?? 5;
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
          textValue: `${dimA}, ${dimB}, ${dimC}`,
          buildTextPatch: (val) => {
            const parts = val.split(',').map((s) => Number(s.trim()));
            return {
              dimensions: {
                a: Number.isFinite(parts[0]) ? parts[0] : dimA,
                b: Number.isFinite(parts[1]) ? parts[1] : dimB,
                c: Number.isFinite(parts[2]) ? parts[2] : dimC,
              },
            };
          },
        },
        {
          id: 'dim-a',
          label: `Cạnh a = ${dimA}`,
          kind: 'badge',
          defaultRect: { x: 840, y: 475, w: 300, h: 150 },
          textValue: String(dimA),
          buildTextPatch: (val) => {
            const parsed = Number(val.trim());
            return {
              dimensions: {
                a: Number.isFinite(parsed) ? parsed : dimA,
                b: dimB,
                c: dimC,
              },
            };
          },
        },
        {
          id: 'dim-b',
          label: `Cạnh b = ${dimB}`,
          kind: 'badge',
          defaultRect: { x: 1160, y: 475, w: 300, h: 150 },
          textValue: String(dimB),
          buildTextPatch: (val) => {
            const parsed = Number(val.trim());
            return {
              dimensions: {
                a: dimA,
                b: Number.isFinite(parsed) ? parsed : dimB,
                c: dimC,
              },
            };
          },
        },
        {
          id: 'dim-c',
          label: `Cạnh c = ${dimC}`,
          kind: 'badge',
          defaultRect: { x: 1480, y: 475, w: 300, h: 150 },
          textValue: String(dimC),
          buildTextPatch: (val) => {
            const parsed = Number(val.trim());
            return {
              dimensions: {
                a: dimA,
                b: dimB,
                c: Number.isFinite(parsed) ? parsed : dimC,
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
        {
          id: 'variables-box',
          label: 'Khối Trạng thái Biến số (Variables)',
          kind: 'step',
          defaultRect: { x: 1004, y: 320, w: 652, h: 120 },
          textValue: safeSteps[0]?.variableState || '',
          buildTextPatch: (variableState) => {
            const nextSteps = [...safeSteps];
            nextSteps[0] = {
              ...nextSteps[0],
              variableState,
            };
            return { steps: nextSteps };
          },
        },
        {
          id: 'explanation-note',
          label: 'Khối Giải thích Thao tác',
          kind: 'subtitle',
          defaultRect: { x: 1004, y: 460, w: 652, h: 180 },
          textValue: safeSteps[0]?.note || '',
          buildTextPatch: (note) => {
            const nextSteps = [...safeSteps];
            nextSteps[0] = {
              ...nextSteps[0],
              note,
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
      );

      safePoints.forEach((pt, idx) => {
        pieces.push({
          id: `summary-point-${idx}`,
          label: `Điểm nhớ #${idx + 1}: ${String(pt).slice(0, 24)}`,
          kind: 'step',
          defaultRect: { x: 268, y: 340 + idx * 96, w: 644, h: 80 },
          textValue: pt,
          buildTextPatch: (newPt) => {
            const nextPts = [...safePoints];
            nextPts[idx] = newPt;
            return { summaryPoints: nextPts };
          },
        });
      });

      pieces.push({
        id: 'cta-banner',
        label: 'Khung Bài học Tiếp theo (Next Lesson)',
        kind: 'card',
        defaultRect: { x: 980, y: 250, w: 700, h: 620 },
        textValue: scene.nextLessonSuggestion || 'Bài học chuyên đề tiếp theo',
        buildTextPatch: (nextLessonSuggestion) => ({ nextLessonSuggestion }),
      });
      break;
    }

    case 'ILLUSTRATED_EXPLAINER': {
      const safeIcons = Array.isArray(scene.icons) && scene.icons.length > 0
        ? scene.icons
        : [{ name: 'atom', label: scene.headline }];

      pieces.push({
        id: 'headline',
        label: 'Tiêu đề Minh họa (Headline)',
        kind: 'title',
        defaultRect: { x: 180, y: 56, w: 1560, h: 92 },
        textValue: scene.headline,
        subTextValue: scene.caption || '',
        buildTextPatch: (headline, caption) => ({
          headline,
          ...(caption !== undefined ? { caption } : {}),
        }),
      });

      if (scene.caption) {
        pieces.push({
          id: 'caption',
          label: 'Phụ đề Minh họa (Caption)',
          kind: 'subtitle',
          defaultRect: { x: 320, y: 152, w: 1280, h: 64 },
          textValue: scene.caption,
          buildTextPatch: (caption) => ({ caption }),
        });
      }

      const layoutMode = scene.layout || 'focus';
      safeIcons.forEach((ic, idx) => {
        const iconRect = computeIllustratedIconDefaultRect(layoutMode, idx, safeIcons.length);
        pieces.push({
          id: `icon-${idx}`,
          label: `Khối Lego Icon #${idx + 1}: ${ic.label || ic.name}`,
          kind: 'diagram',
          defaultRect: iconRect,
          textValue: ic.label || ic.name,
          subTextValue: ic.name,
          buildTextPatch: (newLabel, newIconName) => {
            const nextIcons = [...safeIcons];
            nextIcons[idx] = {
              ...nextIcons[idx],
              label: newLabel,
              ...(newIconName && newIconName.trim() ? { name: newIconName.trim() } : {}),
            };
            return { icons: nextIcons };
          },
        });
      });
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

        appendComposedSubPieces(pieces, block, rect, (patcher) => {
          const nextBlocks = [...scene.blocks];
          nextBlocks[idx] = patcher(nextBlocks[idx]);
          return { blocks: nextBlocks };
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

      appendComposedSubPieces(pieces, block, rect, (patcher) => {
        const nextExtra = [...(scene.extraBlocks || [])];
        nextExtra[idx] = patcher(nextExtra[idx]);
        return { extraBlocks: nextExtra };
      });
    });
  }

  return pieces;
}

/**
 * Computes default 1920x1080 bounding box for each individual icon in `ILLUSTRATED_EXPLAINER`.
 */
export function computeIllustratedIconDefaultRect(
  layout: string,
  idx: number,
  count: number,
): { x: number; y: number; w: number; h: number } {
  const cx = 960;
  const cy = 620;

  switch (layout) {
    case 'row': {
      const shownCount = Math.min(4, Math.max(1, count));
      const spacing = shownCount === 1 ? 0 : Math.min(380, 1280 / shownCount);
      const startX = cx - ((shownCount - 1) * spacing) / 2;
      const xCenter = startX + idx * spacing;
      return { x: Math.round(xCenter - 130), y: Math.round(cy - 140), w: 260, h: 290 };
    }
    case 'cluster': {
      const shownCount = Math.min(5, Math.max(1, count));
      const radius = 320;
      const angle = -Math.PI / 2 + (idx / shownCount) * Math.PI * 2;
      const xCenter = cx + Math.cos(angle) * radius;
      const yCenter = cy + Math.sin(angle) * radius * 0.72;
      return { x: Math.round(xCenter - 120), y: Math.round(yCenter - 130), w: 240, h: 270 };
    }
    case 'swarm': {
      const ringRadius = 180 + (idx % 3) * 110;
      const angle = (idx * 2.399963) % (Math.PI * 2);
      const xCenter = cx + Math.cos(angle) * ringRadius;
      const yCenter = cy + Math.sin(angle) * ringRadius * 0.75;
      return { x: Math.round(xCenter - 115), y: Math.round(yCenter - 125), w: 230, h: 260 };
    }
    case 'exchange': {
      if (idx === 0) {
        return { x: cx - 440 - 150, y: cy - 160, w: 300, h: 330 };
      }
      if (idx === 1) {
        return { x: cx + 440 - 150, y: cy - 160, w: 300, h: 330 };
      }
      return { x: cx - 105, y: cy - 230 - 115, w: 210, h: 240 };
    }
    case 'zoom': {
      if (idx === 0) {
        return { x: cx - 210, y: cy - 220, w: 420, h: 460 };
      }
      const satCount = Math.max(1, Math.min(3, count - 1));
      const satIdx = idx - 1;
      const a = -Math.PI / 3 + (satIdx / Math.max(1, satCount - 1 || 1)) * (Math.PI * 2 / 3);
      const xCenter = cx + Math.cos(a) * 440;
      const yCenter = cy + Math.sin(a) * 290;
      return { x: Math.round(xCenter - 105), y: Math.round(yCenter - 115), w: 210, h: 240 };
    }
    case 'focus':
    default: {
      if (idx === 0) {
        return { x: cx - 200, y: cy - 210, w: 400, h: 440 };
      }
      const satCount = Math.max(1, Math.min(4, count - 1));
      const satIdx = idx - 1;
      const angles =
        satCount === 1
          ? [0]
          : satCount === 2
          ? [-Math.PI * 0.25, Math.PI * 1.25]
          : satCount === 3
          ? [-Math.PI / 2, Math.PI * 0.18, Math.PI * 0.82]
          : [-Math.PI * 0.75, -Math.PI * 0.25, Math.PI * 0.25, Math.PI * 0.75];
      const angle = angles[satIdx % angles.length] ?? 0;
      const radius = 380;
      const xCenter = cx + Math.cos(angle) * radius;
      const yCenter = cy + Math.sin(angle) * radius * 0.68;
      return { x: Math.round(xCenter - 120), y: Math.round(yCenter - 130), w: 240, h: 275 };
    }
  }
}

/**
 * Emits granular child `LegoPieceDescriptor`s for multi-item `COMPOSED` blocks
 * (`icons`, `list`, `choice`, `guide`) so every inner element is independently addressable.
 */
function appendComposedSubPieces(
  pieces: LegoPieceDescriptor[],
  block: ComposedBlock,
  parentRect: { x: number; y: number; w: number; h: number },
  buildBlockPatch: (patcher: (b: ComposedBlock) => ComposedBlock) => Partial<SceneData>,
) {
  if (block.kind === 'icons' && Array.isArray(block.icons) && block.icons.length > 0) {
    const icons = block.icons.slice(0, 6);
    const cols = Math.min(icons.length, 3);
    const rows = Math.ceil(icons.length / cols);
    const cellW = Math.round(parentRect.w / Math.max(1, cols));
    const cellH = Math.round(parentRect.h / Math.max(1, rows));
    icons.forEach((ic, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      pieces.push({
        id: `${block.id}__icon-${i}`,
        label: `Icon #${i + 1}: ${ic.label || ic.name}`,
        kind: 'diagram',
        defaultRect: {
          x: parentRect.x + col * cellW + 12,
          y: parentRect.y + row * cellH + 12,
          w: Math.max(120, cellW - 24),
          h: Math.max(120, cellH - 24),
        },
        textValue: ic.label || ic.name,
        subTextValue: ic.name,
        buildTextPatch: (newLabel, newIconName) =>
          buildBlockPatch((b) => {
            const nextIcons = [...(b.icons || [])];
            nextIcons[i] = {
              ...nextIcons[i],
              label: newLabel,
              ...(newIconName && newIconName.trim() ? { name: newIconName.trim() } : {}),
            };
            return { ...b, icons: nextIcons };
          }),
      });
    });
  } else if (block.kind === 'list' && Array.isArray(block.items) && block.items.length > 0) {
    const items = block.items.slice(0, 5);
    const itemH = Math.round((parentRect.h - 48) / Math.max(1, items.length));
    items.forEach((it, i) => {
      pieces.push({
        id: `${block.id}__item-${i}`,
        label: `Mục #${i + 1}: ${String(it).slice(0, 24)}`,
        kind: 'step',
        defaultRect: {
          x: parentRect.x + 24,
          y: parentRect.y + 24 + i * itemH,
          w: Math.max(160, parentRect.w - 48),
          h: Math.max(52, itemH - 8),
        },
        textValue: it,
        buildTextPatch: (newItemText) =>
          buildBlockPatch((b) => {
            const nextItems = [...(b.items || [])];
            nextItems[i] = newItemText;
            return { ...b, items: nextItems };
          }),
      });
    });
  } else if (block.kind === 'choice') {
    const opts = (block.options || []).slice(0, 4);
    pieces.push({
      id: `${block.id}__question`,
      label: `Câu hỏi (${block.id})`,
      kind: 'quiz',
      defaultRect: {
        x: parentRect.x + 24,
        y: parentRect.y + 20,
        w: Math.max(200, parentRect.w - 48),
        h: Math.round(parentRect.h * 0.25),
      },
      textValue: block.question || block.text || '',
      buildTextPatch: (newQ) =>
        buildBlockPatch((b) => ({
          ...b,
          question: newQ,
        })),
    });
    const cellW = Math.round((parentRect.w - 64) / 2);
    const cellH = Math.round((parentRect.h * 0.65) / 2);
    opts.forEach((opt, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const letter = String.fromCharCode(65 + i);
      pieces.push({
        id: `${block.id}__opt-${i}`,
        label: `Đáp án ${letter}: ${String(opt).slice(0, 20)}`,
        kind: 'card',
        defaultRect: {
          x: parentRect.x + 24 + col * (cellW + 16),
          y: parentRect.y + Math.round(parentRect.h * 0.3) + row * (cellH + 12),
          w: Math.max(160, cellW),
          h: Math.max(64, cellH),
        },
        textValue: opt,
        buildTextPatch: (newOpt) =>
          buildBlockPatch((b) => {
            const nextOpts = [...(b.options || [])];
            nextOpts[i] = newOpt;
            return { ...b, options: nextOpts };
          }),
      });
    });
  } else if (block.kind === 'guide') {
    pieces.push(
      {
        id: `${block.id}__mascot`,
        label: `Nhân vật dẫn dắt (${block.id})`,
        kind: 'diagram',
        defaultRect: {
          x: parentRect.x + 16,
          y: parentRect.y + 16,
          w: Math.min(220, Math.round(parentRect.w * 0.3)),
          h: Math.max(120, parentRect.h - 32),
        },
      },
      {
        id: `${block.id}__speech`,
        label: `Lời thoại dẫn dắt (${block.id})`,
        kind: 'subtitle',
        defaultRect: {
          x: parentRect.x + Math.min(236, Math.round(parentRect.w * 0.32)),
          y: parentRect.y + 16,
          w: Math.max(200, parentRect.w - Math.min(252, Math.round(parentRect.w * 0.34))),
          h: Math.max(120, parentRect.h - 32),
        },
        textValue: block.text || '',
        buildTextPatch: (newSpeech) =>
          buildBlockPatch((b) => ({
            ...b,
            text: newSpeech,
          })),
      },
    );
  }
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
    case 'icons':
      return {
        textValue: (block.icons || []).map((ic) => `${ic.name}:${ic.label || ''}`).join(', '),
        subTextValue: block.text || '',
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
    case 'icons': {
      const parsed = newText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((pair) => {
          const [name, ...rest] = pair.split(':');
          const label = rest.join(':').trim();
          return { name: name.trim() || 'atom', ...(label ? { label } : {}) };
        });
      return {
        ...block,
        ...(parsed.length > 0 ? { icons: parsed } : {}),
        ...(newSubText !== undefined ? { text: newSubText } : {}),
      };
    }
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
