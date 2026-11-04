'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AlgorithmWalkthroughProps } from '@/types/stem';
import { FlatStage } from '../flat/FlatStage';
import { LegoBlock } from '../lego/LegoBlock';

/**
 * Trích xuất mảng số từ chuỗi text (ví dụ: "arr = [5, 2, 8, 1]" -> [5, 2, 8, 1])
 */
function extractNumberArray(text?: string): number[] | null {
  if (!text) return null;
  const match = text.match(/\[([\d\s,.\-]+)\]/);
  if (match) {
    const items = match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n));
    if (items.length >= 2) return items;
  }
  return null;
}

interface StepOperation {
  type: 'swap' | 'compare' | 'sorted' | 'idle';
  indices: [number, number] | null;
  description?: string;
}

/**
 * Phân tích thao tác tại bước hiện tại: So sánh (compare), Hoán đổi (swap), hoặc Đã sắp xếp (sorted)
 */
function detectStepOperation(
  curr: number[] | null,
  prev: number[] | null,
  stepNote: string = '',
  stepState: string = ''
): StepOperation {
  if (!curr) return { type: 'idle', indices: null };

  const combinedText = `${stepNote} ${stepState}`.toLowerCase();

  // 1. Kiểm tra trạng thái đã hoàn tất / đã sắp xếp
  if (
    combinedText.includes('hoàn tất') ||
    combinedText.includes('đã sắp xếp') ||
    combinedText.includes('kết thúc') ||
    combinedText.includes('sorted')
  ) {
    return { type: 'sorted', indices: null, description: 'Mảng đã được sắp xếp hoàn tất' };
  }

  // 2. Kiểm tra thao tác Hoán đổi (Swap)
  // A. So khớp mảng hiện tại với mảng bước trước (nếu 2 phần tử đổi chỗ)
  if (prev && prev.length === curr.length) {
    const diffIndices: number[] = [];
    for (let i = 0; i < curr.length; i++) {
      if (prev[i] !== curr[i]) {
        diffIndices.push(i);
      }
    }
    if (
      diffIndices.length === 2 &&
      prev[diffIndices[0]] === curr[diffIndices[1]] &&
      prev[diffIndices[1]] === curr[diffIndices[0]]
    ) {
      return {
        type: 'swap',
        indices: [diffIndices[0], diffIndices[1]],
        description: `${curr[diffIndices[1]]} ⇄ ${curr[diffIndices[0]]}`,
      };
    }
  }

  // B. Nhận diện từ khóa hoán đổi trong ghi chú/trạng thái (VD: "Hoán đổi 5 và 2", "Swap 5 and 2")
  const swapMatch = combinedText.match(/(?:hoán đổi|đổi chỗ|swap|tráo)\s*(?:vị trí|hai số)?\s*(\d+)\s*(?:và|với|,)?\s*(\d+)/i);
  if (swapMatch) {
    const valA = Number(swapMatch[1]);
    const valB = Number(swapMatch[2]);
    const idxA = curr.indexOf(valA);
    const idxB = curr.lastIndexOf(valB);
    if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
      return {
        type: 'swap',
        indices: [Math.min(idxA, idxB), Math.max(idxA, idxB)],
        description: `${valA} ⇄ ${valB}`,
      };
    }
  }

  // 3. Kiểm tra thao tác So sánh (Compare)
  // Nhận diện theo giá trị: VD "So sánh 5 và 2", "5 > 2"
  const compValMatch = combinedText.match(/(\d+)\s*(?:>|<|>=|<=|==|và|với)\s*(\d+)/);
  if (
    compValMatch &&
    (combinedText.includes('so sánh') ||
      combinedText.includes('compare') ||
      combinedText.includes('>') ||
      combinedText.includes('<'))
  ) {
    const valA = Number(compValMatch[1]);
    const valB = Number(compValMatch[2]);
    const idxA = curr.indexOf(valA);
    const idxB = curr.lastIndexOf(valB);
    if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
      return {
        type: 'compare',
        indices: [Math.min(idxA, idxB), Math.max(idxA, idxB)],
        description: `${valA} và ${valB}`,
      };
    }
  }

  // Nhận diện theo chỉ số: VD "arr[0] và arr[1]", "j = 1"
  const compIdxMatch = combinedText.match(/arr\[(\d+)\]\s*(?:và|với|>|<)?\s*arr\[(\d+)\]/i);
  if (compIdxMatch) {
    const iA = Number(compIdxMatch[1]);
    const iB = Number(compIdxMatch[2]);
    if (iA >= 0 && iA < curr.length && iB >= 0 && iB < curr.length && iA !== iB) {
      return {
        type: 'compare',
        indices: [Math.min(iA, iB), Math.max(iA, iB)],
        description: `arr[${iA}] (${curr[iA]}) và arr[${iB}] (${curr[iB]})`,
      };
    }
  }

  const varIndexMatch = combinedText.match(/j\s*=\s*(\d+)/);
  if (varIndexMatch) {
    const j = Number(varIndexMatch[1]);
    if (j >= 0 && j + 1 < curr.length) {
      return {
        type: 'compare',
        indices: [j, j + 1],
        description: `arr[${j}] và arr[${j + 1}]`,
      };
    }
  }

  return { type: 'idle', indices: null };
}

export const AlgorithmWalkthrough: React.FC<AlgorithmWalkthroughProps> = ({
  title,
  language,
  codeSnippet,
  steps,
  customFontSize,
  cardScale,
  cardTheme = 'dark',
  cardWidth = 'standard',
  layoutSplit = 'equal',
}) => {
  const getWidthClass = () => {
    switch (cardWidth) {
      case 'compact':
        return 'max-w-4xl';
      case 'wide':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-7xl';
      case 'standard':
      default:
        return 'max-w-5xl';
    }
  };

  const getColSpanClass = () => {
    switch (layoutSplit) {
      case 'code-heavy':
        return { code: 'col-span-7', memory: 'col-span-5' };
      case 'memory-heavy':
        return { code: 'col-span-5', memory: 'col-span-7' };
      case 'equal':
      default:
        return { code: 'col-span-6', memory: 'col-span-6' };
    }
  };

  const getThemeClass = () => {
    switch (cardTheme) {
      case 'contrast':
        return 'bg-slate-950/95 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.25)]';
      case 'glass':
        return 'bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl';
      case 'light':
        return 'bg-slate-800/90 border border-slate-600/70 shadow-xl';
      default:
        return 'bg-slate-900/80 border border-amber-500/30 shadow-2xl';
    }
  };

  const baseSize = customFontSize || 30;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safeCodeSnippet =
    codeSnippet || 'def bubble_sort(arr):\n    # Hoán đổi hai phần tử liền kề nếu sai thứ tự\n    return arr';
  const safeSteps =
    Array.isArray(steps) && steps.length > 0
      ? steps
      : [
          {
            lineHighlight: 1,
            variableState: 'arr = [5, 2, 8, 1]',
            note: 'Khởi tạo mảng số cần sắp xếp.',
          },
          {
            lineHighlight: 2,
            variableState: 'arr = [5, 2, 8, 1] | So sánh 5 > 2',
            note: 'So sánh hai số 5 và 2: vì 5 > 2 nên chuẩn bị hoán đổi.',
          },
          {
            lineHighlight: 3,
            variableState: 'arr = [2, 5, 8, 1] | Hoán đổi 5 và 2',
            note: 'Hoán đổi vị trí: số 5 nổi bọt dần về phía sau.',
          },
        ];

  const codeLines = safeCodeSnippet.split('\n');

  // Xác định bước thực thi hiện tại theo frame
  const stepDuration = Math.max(1, fps * 2.5);
  const currentStepIndex = Math.min(
    Math.floor(frame / stepDuration),
    safeSteps.length - 1
  );
  const activeStep = safeSteps[Math.max(0, currentStepIndex)] || safeSteps[0];
  const frameInStep = frame - currentStepIndex * stepDuration;

  // Spring transition cho từng bước
  const stepSpring = spring({
    frame: frameInStep,
    fps,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 24,
  });

  // Trích xuất và giải quyết mảng số xuyên suốt các bước
  const titleLower = (title || '').toLowerCase();
  const isSortingOrArrayTopic =
    titleLower.includes('sort') ||
    titleLower.includes('sắp xếp') ||
    titleLower.includes('bubble') ||
    titleLower.includes('mảng') ||
    titleLower.includes('array');

  const initialArrayFromSnippet = extractNumberArray(safeCodeSnippet);
  const rawStepArrays = safeSteps.map((s) => extractNumberArray(s.variableState));
  const fallbackInitialArray = initialArrayFromSnippet || (isSortingOrArrayTopic ? [5, 2, 8, 1, 4] : null);

  let runningArray = fallbackInitialArray;
  const resolvedStepArrays: (number[] | null)[] = rawStepArrays.map((arr) => {
    if (arr) {
      runningArray = arr;
    }
    return runningArray ? [...runningArray] : null;
  });

  const currentArray = resolvedStepArrays[currentStepIndex];
  const prevArray = currentStepIndex > 0 ? resolvedStepArrays[currentStepIndex - 1] : null;
  const hasVisualArray = Boolean(currentArray && currentArray.length >= 2);

  const operation = detectStepOperation(
    currentArray,
    prevArray,
    activeStep?.note,
    activeStep?.variableState
  );

  const colSpans = getColSpanClass();

  // Kích thước các bóng số dựa theo số lượng phần tử mảng
  const arrayLength = currentArray ? currentArray.length : 0;
  const bubbleSize = arrayLength > 7 ? 44 : arrayLength > 5 ? 52 : 60;
  const bubbleGap = arrayLength > 7 ? 8 : 12;
  const slotDistance = bubbleSize + bubbleGap;

  return (
    <FlatStage ambience="space" className="flex flex-col justify-between p-14">
      {/* Header */}
      <LegoBlock id="header" label="Tiêu đề Thuật toán" kind="title" className="relative z-10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-amber-600/20 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              ALGORITHM WALKTHROUGH
            </span>
            <h2
              className="text-2xl font-bold text-slate-100"
              style={{ fontSize: `var(--lego-font-size, ${Math.round(baseSize * 0.95)}px)` }}
            >
              {title}
            </h2>
          </div>
          <span className="text-sm text-slate-400 font-mono uppercase">
            {language || 'python'} Trace Mode
          </span>
        </div>
      </LegoBlock>

      {/* Main Code & State Side-by-side */}
      <div
        style={{
          transform: `scale(${cardScale || 1.0})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease',
        }}
        className={`my-auto ${getWidthClass()} w-full mx-auto grid grid-cols-12 gap-8 items-stretch relative z-10`}
      >
        {/* Code Box (Cột trái) */}
        <LegoBlock
          id="code-panel"
          label={`Khung Mã nguồn (${language || 'python'})`}
          kind="card"
          className={colSpans.code}
        >
          <div className={`${getThemeClass()} rounded-xl overflow-hidden font-mono text-sm shadow-2xl flex flex-col h-full`}>
            <div className="bg-slate-800/80 px-4 py-2.5 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </span>
                <span className="font-semibold text-slate-300">
                  source.{language === 'cpp' ? 'cpp' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : 'py'}
                </span>
              </span>
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Line {activeStep?.lineHighlight || 1} executing
              </span>
            </div>
            <div
              className="p-4 space-y-1 overflow-y-auto flex-1 font-mono"
              style={{ fontSize: `var(--lego-font-size, ${Math.max(12, Math.round(baseSize * 0.46))}px)` }}
            >
              {codeLines.map((line, idx) => {
                const lineNumber = idx + 1;
                const isHighlighted = lineNumber === activeStep?.lineHighlight;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 px-2 py-1 rounded transition-all duration-200 ${
                      isHighlighted
                        ? 'bg-amber-500/25 border-l-4 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)] font-semibold'
                        : 'text-slate-300 opacity-80'
                    }`}
                  >
                    <span
                      className={`select-none text-xs w-6 text-right font-mono ${
                        isHighlighted ? 'text-amber-400 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {lineNumber}
                    </span>
                    <span className="whitespace-pre font-mono">{line}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </LegoBlock>

        {/* Memory & Variable State Box (Cột phải) */}
        <LegoBlock
          id="memory-panel"
          label="Khung Trạng thái Bộ nhớ (Memory Heap)"
          kind="card"
          className={colSpans.memory}
        >
          <div className={`flex flex-col justify-between ${getThemeClass()} rounded-xl p-5 shadow-2xl backdrop-blur-sm h-full`}>
            <div className="space-y-4">
              {/* Header của Khung Bộ nhớ */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <span className="text-xs uppercase font-mono font-bold text-amber-400">
                    Trực quan hóa Thuật toán & Bộ nhớ
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Step {Math.max(1, currentStepIndex + 1)} / {safeSteps.length}
                </span>
              </div>

              {/* 1. TRỰC QUAN HÓA MẢNG BÓNG (Visual Array Animation) */}
              {hasVisualArray && currentArray && (
                <LegoBlock id="visual-array" label="Mô phỏng Mảng bóng (Visual Array)" kind="diagram">
                  <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800/80 shadow-inner flex flex-col items-center justify-center min-h-[145px] relative overflow-hidden">
                    {/* Header thông báo trạng thái thao tác */}
                    <div className="w-full flex items-center justify-between mb-3 px-1 text-[11px] font-mono text-slate-400 border-b border-slate-800/70 pb-2">
                      <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        MẢNG SỐ TRỰC QUAN (ARRAY BUBBLES)
                      </span>
                      <span className="text-xs font-semibold">
                        {operation.type === 'swap' ? (
                          <span className="text-rose-400 flex items-center gap-1 font-bold animate-pulse">
                            <span>⇄</span> Đang hoán đổi: {operation.description || 'vị trí'}
                          </span>
                        ) : operation.type === 'compare' ? (
                          <span className="text-amber-300 flex items-center gap-1 font-bold">
                            <span>🔍</span> Đang so sánh: {operation.description || 'hai phần tử'}
                          </span>
                        ) : operation.type === 'sorted' ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            <span>✓</span> {operation.description || 'Mảng đã sắp xếp'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Trạng thái mảng hiện tại</span>
                        )}
                      </span>
                    </div>

                    {/* Vùng hiển thị các quả bóng số (Bubbles) */}
                    <div
                      className="flex items-center justify-center w-full py-4 relative"
                      style={{ gap: `${bubbleGap}px` }}
                    >
                      {currentArray.map((val, idx) => {
                        const isSwap =
                          operation.type === 'swap' &&
                          operation.indices !== null &&
                          operation.indices.includes(idx);
                        const isComparing =
                          operation.type === 'compare' &&
                          operation.indices !== null &&
                          operation.indices.includes(idx);
                        const isSorted =
                          operation.type === 'sorted' ||
                          (currentStepIndex === safeSteps.length - 1 && !isSwap && !isComparing);

                        // Tính toán độ dời animation khi Swap
                        let translateX = 0;
                        let translateY = 0;
                        let bubbleScale = 1;
                        let zIndex = 1;

                        if (isSwap && operation.indices) {
                          const [idxA, idxB] = operation.indices;
                          if (idx === idxA) {
                            // Phần tử hiện ở idxA vốn đến từ idxB
                            const delta = (idxB - idxA) * slotDistance;
                            translateX = interpolate(stepSpring, [0, 1], [delta, 0]);
                            translateY = -Math.sin(stepSpring * Math.PI) * 28; // Bay cong lên trên
                            bubbleScale = 1 + 0.14 * Math.sin(stepSpring * Math.PI);
                            zIndex = 20;
                          } else if (idx === idxB) {
                            // Phần tử hiện ở idxB vốn đến từ idxA
                            const delta = (idxA - idxB) * slotDistance;
                            translateX = interpolate(stepSpring, [0, 1], [delta, 0]);
                            translateY = Math.sin(stepSpring * Math.PI) * 16; // Trượt cong xuống dưới
                            bubbleScale = 1 + 0.14 * Math.sin(stepSpring * Math.PI);
                            zIndex = 15;
                          }
                        } else if (isComparing) {
                          const pulse = Math.sin((frameInStep / fps) * Math.PI * 3.5) * 0.08;
                          bubbleScale = 1 + Math.max(0, pulse);
                          translateY = -Math.abs(Math.sin((frameInStep / fps) * Math.PI * 3.5)) * 6;
                          zIndex = 10;
                        }

                        // Hiệu ứng Pop-in khi mở đầu scene
                        if (currentStepIndex === 0) {
                          const popIn = spring({
                            frame: Math.max(0, frameInStep - idx * 2),
                            fps,
                            config: { damping: 12, stiffness: 110 },
                          });
                          bubbleScale *= popIn;
                        }

                        return (
                          <div
                            key={`bubble-slot-${idx}`}
                            className="flex flex-col items-center relative select-none"
                            style={{
                              transform: `translate(${translateX}px, ${translateY}px) scale(${bubbleScale})`,
                              zIndex,
                              transition: isSwap || isComparing ? 'none' : 'transform 0.2s ease',
                            }}
                          >
                            {/* Tag trạng thái nổi phía trên quả bóng */}
                            {isSwap && (
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-extrabold uppercase tracking-wider text-rose-300 bg-rose-950/90 border border-rose-500/80 px-1.5 py-0.5 rounded-full shadow-lg">
                                SWAP ⇄
                              </span>
                            )}
                            {isComparing && (
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-950/90 border border-amber-500/80 px-1.5 py-0.5 rounded-full shadow-lg">
                                SO SÁNH ?
                              </span>
                            )}

                            {/* Quả bóng tròn (Sphere Bubble) 3D */}
                            <div
                              style={{
                                width: `${bubbleSize}px`,
                                height: `${bubbleSize}px`,
                              }}
                              className={`rounded-full flex items-center justify-center relative font-mono font-black shadow-lg transition-colors duration-200 ${
                                isSwap
                                  ? 'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-600 border-2 border-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.85)]'
                                  : isComparing
                                  ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 border-2 border-amber-300 shadow-[0_0_22px_rgba(245,158,11,0.85)]'
                                  : isSorted
                                  ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-800 border-2 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.7)]'
                                  : 'bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-900 border-2 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                              }`}
                            >
                              {/* Vệt sáng bóng tròn (Specular highlight) */}
                              <div className="absolute top-1 left-2 w-3.5 h-1.5 bg-white/60 rounded-full blur-[0.4px] pointer-events-none" />

                              {/* Giá trị số bên trong quả bóng */}
                              <span className="text-white text-lg font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {val}
                              </span>
                            </div>

                            {/* Chỉ số mảng bên dưới */}
                            <span className="mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 text-slate-400 border border-slate-800 shadow">
                              [{idx}]
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </LegoBlock>
              )}

              {/* 2. KHỐI TRẠNG THÁI BIẾN SỐ (Variables Snapshot) */}
              <LegoBlock id="variables-box" label="Khối Trạng thái Biến số (Variables)" kind="step">
                <div
                  className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400"
                  style={{ fontSize: `var(--lego-font-size, ${Math.max(12, Math.round(baseSize * 0.46))}px)` }}
                >
                  <div className="text-slate-500 mb-1 flex items-center justify-between">
                    <span>// Variables Snapshot:</span>
                    <span className="text-[10px] text-slate-600 font-mono">Heap Memory</span>
                  </div>
                  <div className="text-emerald-300 font-bold tracking-wide">
                    {activeStep?.variableState || '{ i: 0, arr: [2, 5, 8] }'}
                  </div>
                </div>
              </LegoBlock>

              {/* 3. KHỐI GIẢI THÍCH THAO TÁC */}
              <LegoBlock id="explanation-note" label="Khối Giải thích Thao tác" kind="subtitle">
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-amber-300 uppercase">Giải thích thao tác</h4>
                    {operation.type === 'swap' && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                        Hoán đổi vị trí
                      </span>
                    )}
                    {operation.type === 'compare' && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                        So sánh giá trị
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm text-slate-200 leading-relaxed"
                    style={{ fontSize: `var(--lego-font-size, ${Math.max(13, Math.round(baseSize * 0.5))}px)` }}
                  >
                    {activeStep?.note || 'Đang thực thi lệnh tiếp theo trong thuật toán.'}
                  </p>
                </div>
              </LegoBlock>
            </div>

            {/* Footer chân bảng */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Đồng bộ thời gian thực với lời bình narration</span>
              <span className="text-amber-400/80 font-bold">Line {activeStep?.lineHighlight || 1}</span>
            </div>
          </div>
        </LegoBlock>
      </div>
    </FlatStage>
  );
};
