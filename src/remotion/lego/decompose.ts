import type { ComposedBlock, ComposedProps, SceneData } from '../../types/stem';
import { computeIllustratedIconDefaultRect } from './catalog';

/**
 * Decomposes any fixed Remotion template scene into a freeform `COMPOSED` Lego scene
 * where every visual sub-component becomes an independent `ComposedBlock` with explicit
 * `x, y, w, h` coordinates on the 1920x1080 canvas.
 */
export function decomposeSceneToComposed(scene: SceneData): ComposedProps {
  if (scene.type === 'COMPOSED') {
    const nextBlocks: ComposedBlock[] = [];
    for (const b of scene.blocks || []) {
      if (b.kind === 'icons' && Array.isArray(b.icons) && b.icons.length > 1) {
        const cols = Math.min(b.icons.length, 3);
        const rows = Math.ceil(b.icons.length / cols);
        const bx = b.x ?? 200;
        const by = b.y ?? 240;
        const bw = b.w ?? 1200;
        const bh = b.h ?? 520;
        const cellW = Math.round(bw / Math.max(1, cols));
        const cellH = Math.round(bh / Math.max(1, rows));
        b.icons.forEach((ic, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          nextBlocks.push({
            id: `${b.id}_icon_${idx}`,
            kind: 'icon',
            slot: b.slot || 'main',
            icon: { name: ic.name || 'atom', label: ic.label || ic.name },
            text: ic.label || ic.name,
            motion: b.motion || 'pop',
            x: bx + col * cellW + 12,
            y: by + row * cellH + 12,
            w: Math.max(160, cellW - 24),
            h: Math.max(160, cellH - 24),
          });
        });
      } else {
        nextBlocks.push(b);
      }
    }
    return {
      ...scene,
      blocks: nextBlocks,
    };
  }

  const layouts = scene.componentLayouts || {};
  const applyOffset = (
    pieceId: string,
    rect: { x: number; y: number; w: number; h: number },
  ) => {
    const l = layouts[pieceId];
    if (!l) return rect;
    const scale = l.scale ?? 1;
    const sx = (l.scaleX ?? 1) * scale;
    const sy = (l.scaleY ?? 1) * scale;
    return {
      x: Math.round(rect.x + (l.dx ?? 0)),
      y: Math.round(rect.y + (l.dy ?? 0)),
      w: Math.round(rect.w * sx),
      h: Math.round(rect.h * sy),
    };
  };

  const blocks: ComposedBlock[] = [];

  switch (scene.type) {
    case 'TITLE_HERO': {
      blocks.push(
        {
          id: 'hero_title',
          kind: 'title',
          slot: 'main',
          text: scene.title,
          motion: 'pop',
          ...applyOffset('title', { x: 180, y: 260, w: 1560, h: 320 }),
        },
        {
          id: 'hero_subtitle',
          kind: 'text',
          slot: 'bottom',
          text: scene.subtitle || `${scene.subject || 'STEM'} • ${scene.gradeLevel || 'Studio'}`,
          motion: 'rise',
          ...applyOffset('subtitle', { x: 260, y: 610, w: 1400, h: 180 }),
        },
      );
      break;
    }

    case 'MATH_FORMULA': {
      blocks.push(
        {
          id: 'math_header',
          kind: 'title',
          slot: 'top',
          text: scene.title,
          motion: 'rise',
          ...applyOffset('header', { x: 88, y: 72, w: 1744, h: 170 }),
        },
        {
          id: 'math_formula',
          kind: 'formula',
          slot: 'left',
          latex: scene.latex || 'f(x) = ax^2 + bx + c',
          text: 'Biểu thức trung tâm',
          motion: 'pop',
          ...applyOffset('formula-card', { x: 88, y: 270, w: 820, h: 660 }),
        },
      );
      const steps = scene.steps || [];
      steps.forEach((st, idx) => {
        const stepH = Math.min(200, Math.floor(640 / Math.max(1, steps.length)) - 12);
        blocks.push({
          id: `math_step_${idx + 1}`,
          kind: 'formula',
          slot: 'right',
          latex: st.latexSnippet,
          text: `${st.label || `Bước ${idx + 1}`}: ${st.explanation}`,
          motion: 'slide',
          ...applyOffset(`step-${idx}`, {
            x: 940,
            y: 270 + idx * (stepH + 16),
            w: 892,
            h: stepH,
          }),
        });
      });
      break;
    }

    case 'CHEMICAL_REACTION': {
      blocks.push(
        {
          id: 'chem_header',
          kind: 'title',
          slot: 'top',
          text: scene.title,
          motion: 'rise',
          ...applyOffset('header', { x: 88, y: 64, w: 1744, h: 165 }),
        },
        {
          id: 'chem_equation',
          kind: 'formula',
          slot: 'main',
          latex: scene.equation,
          text: scene.condition ? `Điều kiện: ${scene.condition}` : 'Phương trình phản ứng',
          motion: 'pop',
          ...applyOffset('equation-card', { x: 220, y: 250, w: 1480, h: 210 }),
        },
        {
          id: 'chem_reactants',
          kind: 'text',
          slot: 'left',
          text: `Chất tham gia: ${scene.reactants || 'Chất tham gia'}`,
          tone: 'accent',
          motion: 'rise',
          ...applyOffset('reactants-box', { x: 120, y: 490, w: 780, h: 440 }),
        },
        {
          id: 'chem_products',
          kind: 'text',
          slot: 'right',
          text: `Sản phẩm: ${scene.products || 'Sản phẩm tạo thành'}`,
          tone: 'good',
          motion: 'rise',
          ...applyOffset('products-box', { x: 1020, y: 490, w: 780, h: 440 }),
        },
      );
      break;
    }

    case 'COMPARISON_SPLIT': {
      blocks.push(
        {
          id: 'comp_header',
          kind: 'title',
          slot: 'top',
          text: scene.title,
          motion: 'rise',
          ...applyOffset('header', { x: 88, y: 72, w: 1744, h: 160 }),
        },
        {
          id: 'comp_left',
          kind: 'list',
          slot: 'left',
          text: scene.topicA?.title || 'Bên A',
          items: scene.topicA?.points?.length ? scene.topicA.points : ['Đặc điểm 1'],
          motion: 'rise',
          ...applyOffset('left-column', { x: 88, y: 260, w: 840, h: 680 }),
        },
        {
          id: 'comp_right',
          kind: 'list',
          slot: 'right',
          text: scene.topicB?.title || 'Bên B',
          items: scene.topicB?.points?.length ? scene.topicB.points : ['Đặc điểm 1'],
          motion: 'rise',
          ...applyOffset('right-column', { x: 992, y: 260, w: 840, h: 680 }),
        },
      );
      break;
    }

    case 'PROCESS_TIMELINE': {
      blocks.push({
        id: 'proc_header',
        kind: 'title',
        slot: 'top',
        text: `${scene.title} — ${scene.processTitle || ''}`,
        motion: 'rise',
        ...applyOffset('header', { x: 88, y: 72, w: 1744, h: 170 }),
      });
      const stages = scene.stages || [];
      const count = Math.max(1, stages.length);
      const cardW = Math.floor((1744 - (count - 1) * 24) / count);
      stages.forEach((st, idx) => {
        blocks.push({
          id: `proc_stage_${idx + 1}`,
          kind: 'text',
          slot: 'main',
          text: `${st.stageNumber || idx + 1}. ${st.title}: ${st.description}`,
          tone: idx === 0 ? 'accent' : 'default',
          motion: 'pop',
          ...applyOffset(`stage-${idx}`, {
            x: 88 + idx * (cardW + 24),
            y: 280,
            w: cardW,
            h: 620,
          }),
        });
      });
      break;
    }

    case 'STEM_QUIZ': {
      blocks.push(
        {
          id: 'quiz_header',
          kind: 'title',
          slot: 'top',
          text: scene.title || 'Thử thách Tư duy',
          motion: 'rise',
          ...applyOffset('header', { x: 88, y: 64, w: 1744, h: 170 }),
        },
        {
          id: 'quiz_choice',
          kind: 'choice',
          slot: 'main',
          question: scene.question,
          options: scene.options || [],
          answer: scene.correctIndex ?? 0,
          motion: 'pop',
          ...applyOffset('question-box', { x: 88, y: 260, w: 1744, h: 680 }),
        },
      );
      break;
    }

    case 'GEOMETRY_SPACE': {
      blocks.push(
        {
          id: 'geo_header',
          kind: 'title',
          slot: 'top',
          text: scene.title,
          motion: 'rise',
          ...applyOffset('header', { x: 88, y: 72, w: 1744, h: 165 }),
        },
        {
          id: 'geo_formulas',
          kind: 'formula',
          slot: 'left',
          latex: scene.formulaLatex || 'a^2 + b^2 = c^2',
          text: scene.theoremName,
          motion: 'pop',
          ...applyOffset('formulas-panel', { x: 88, y: 265, w: 850, h: 660 }),
        },
        {
          id: 'geo_properties',
          kind: 'text',
          slot: 'right',
          text: `Kích thước: a=${scene.dimensions?.a ?? 3}, b=${scene.dimensions?.b ?? 4}, c=${scene.dimensions?.c ?? 5} — ${scene.explanation || 'Ý nghĩa hình học trực quan.'}`,
          tone: 'accent',
          motion: 'rise',
          ...applyOffset('properties-panel', { x: 982, y: 265, w: 850, h: 660 }),
        },
      );
      break;
    }

    case 'DATA_CHART': {
      blocks.push(
        {
          id: 'chart_header',
          kind: 'title',
          slot: 'top',
          text: scene.title,
          motion: 'rise',
          ...applyOffset('header', { x: 88, y: 72, w: 1744, h: 170 }),
        },
        {
          id: 'chart_main',
          kind: 'chart',
          slot: 'main',
          points: (scene.dataPoints || []).map((d) => ({
            label: d.label,
            value: d.value,
          })),
          unit: scene.yAxisLabel,
          motion: 'pop',
          ...applyOffset('chart-canvas', { x: 88, y: 270, w: 1744, h: 680 }),
        },
      );
      break;
    }

    case 'DIAGRAM_EXPLAINER': {
      blocks.push(
        {
          id: 'diag_header',
          kind: 'title',
          slot: 'top',
          text: scene.title,
          motion: 'rise',
          ...applyOffset('header', { x: 88, y: 72, w: 1744, h: 165 }),
        },
        {
          id: 'diag_center',
          kind: 'icon',
          slot: 'left',
          icon: { name: 'atom', label: scene.diagramTitle || 'Mô hình trực quan' },
          text: scene.diagramTitle || scene.title,
          motion: 'pop',
          ...applyOffset('center-diagram', { x: 88, y: 270, w: 720, h: 640 }),
        },
      );
      (scene.labels || []).forEach((lbl, idx) => {
        blocks.push({
          id: `diag_label_${idx + 1}`,
          kind: 'text',
          slot: 'right',
          text: `${lbl.name}: ${lbl.description}`,
          tone: 'accent',
          motion: 'rise',
          ...applyOffset(`label-${idx}`, {
            x: 848,
            y: 270 + idx * 220,
            w: 984,
            h: 200,
          }),
        });
      });
      break;
    }

    case 'ALGORITHM_WALKTHROUGH': {
      const codeLines = (scene.codeSnippet || '').split('\n').filter(Boolean);
      const firstStep = scene.steps?.[0];
      blocks.push(
        {
          id: 'algo_header',
          kind: 'title',
          slot: 'top',
          text: scene.title,
          motion: 'rise',
          ...applyOffset('header', { x: 88, y: 72, w: 1744, h: 165 }),
        },
        {
          id: 'algo_steps',
          kind: 'list',
          slot: 'left',
          text: 'Các dòng lệnh chính',
          items: codeLines.length ? codeLines : ['return result'],
          motion: 'rise',
          ...applyOffset('code-panel', { x: 88, y: 265, w: 1020, h: 660 }),
        },
        {
          id: 'algo_explain',
          kind: 'text',
          slot: 'right',
          text: `${firstStep?.variableState || 'Trạng thái bộ nhớ'}: ${firstStep?.note || 'Phân tích từng bước thực thi của thuật toán.'}`,
          tone: 'accent',
          motion: 'slide',
          ...applyOffset('memory-panel', { x: 1140, y: 265, w: 692, h: 660 }),
        },
      );
      break;
    }

    case 'OUTRO': {
      blocks.push(
        {
          id: 'outro_header',
          kind: 'title',
          slot: 'top',
          text: scene.title,
          motion: 'rise',
          ...applyOffset('header', { x: 88, y: 72, w: 1744, h: 180 }),
        },
        {
          id: 'outro_takeaways',
          kind: 'list',
          slot: 'main',
          text: 'Điểm cốt lõi cần nhớ',
          items: scene.summaryPoints?.length ? scene.summaryPoints : ['Tổng kết nội dung'],
          motion: 'rise',
          ...applyOffset('takeaways-list', { x: 140, y: 280, w: 1640, h: 640 }),
        },
      );
      break;
    }

    case 'ILLUSTRATED_EXPLAINER': {
      const safeIcons =
        Array.isArray(scene.icons) && scene.icons.length > 0
          ? scene.icons
          : [{ name: 'atom', label: scene.headline }];
      const layoutMode = scene.layout || 'focus';

      blocks.push({
        id: 'illus_header',
        kind: 'title',
        slot: 'top',
        text: scene.headline,
        motion: 'rise',
        ...applyOffset('headline', { x: 180, y: 56, w: 1560, h: 120 }),
      });

      if (scene.caption) {
        blocks.push({
          id: 'illus_caption',
          kind: 'text',
          slot: 'top',
          text: scene.caption,
          motion: 'rise',
          ...applyOffset('caption', { x: 320, y: 176, w: 1280, h: 72 }),
        });
      }

      safeIcons.forEach((ic, idx) => {
        const defaultRect = computeIllustratedIconDefaultRect(layoutMode, idx, safeIcons.length);
        blocks.push({
          id: idx === 0 ? 'illus_hero' : `illus_icon_${idx}`,
          kind: 'icon',
          slot: 'main',
          icon: { name: ic.name || 'atom', label: ic.label || ic.name || scene.headline },
          text: ic.label || ic.name || scene.headline,
          motion: 'pop',
          ...applyOffset(`icon-${idx}`, defaultRect),
        });
      });
      break;
    }
  }

  // Merge any extraBlocks already added to the scene
  if (scene.extraBlocks && scene.extraBlocks.length > 0) {
    blocks.push(...scene.extraBlocks);
  }

  return {
    id: scene.id,
    type: 'COMPOSED',
    title: scene.title,
    durationInFrames: scene.durationInFrames || 180,
    narration: scene.narration || '',
    frame: 'split',
    ambience: 'space',
    blocks,
  };
}
