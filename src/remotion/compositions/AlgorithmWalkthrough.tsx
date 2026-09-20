'use client';

import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { AlgorithmWalkthroughProps } from '@/types/stem';

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

  const codeLines = codeSnippet.split('\n');

  // Determine active step based on frame
  const currentStepIndex = Math.min(
    Math.floor((frame / (fps * 2.5))),
    steps.length - 1
  );
  const activeStep = steps[Math.max(0, currentStepIndex)] || steps[0];

  const colSpans = getColSpanClass();

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-16 relative overflow-hidden select-none">
      {/* Background Matrix/Hex pattern */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-amber-600/20 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider border border-amber-500/30">
            ALGORITHM WALKTHROUGH
          </span>
          <h2 className="text-2xl font-bold text-slate-100" style={{ fontSize: `${Math.round(baseSize * 0.95)}px` }}>{title}</h2>
        </div>
        <span className="text-sm text-slate-400 font-mono uppercase">{language} Trace Mode</span>
      </div>

      {/* Main Code & State Side-by-side */}
      <div 
        style={{
          transform: `scale(${cardScale || 1.0})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease',
        }}
        className={`my-auto ${getWidthClass()} w-full mx-auto grid grid-cols-12 gap-8 items-stretch relative z-10`}
      >
        {/* Code Box (Sub-component 1) */}
        <div className={`${colSpans.code} ${getThemeClass()} rounded-xl overflow-hidden font-mono text-sm shadow-2xl flex flex-col`}>
          <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
            <span>source.{language === 'python' ? 'py' : 'ts'}</span>
            <span className="text-amber-400">Line {activeStep?.lineHighlight || 1} executing</span>
          </div>
          <div className="p-4 space-y-1 overflow-y-auto" style={{ fontSize: `${Math.max(12, Math.round(baseSize * 0.48))}px` }}>
            {codeLines.map((line, idx) => {
              const lineNumber = idx + 1;
              const isHighlighted = lineNumber === activeStep?.lineHighlight;
              return (
                <div 
                  key={idx}
                  className={`flex items-center gap-4 px-2 py-1 rounded transition-colors ${
                    isHighlighted 
                      ? 'bg-amber-500/20 border-l-4 border-amber-400 text-amber-200' 
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 select-none text-xs w-6 text-right">{lineNumber}</span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Memory & Variable State Box (Sub-component 2) */}
        <div className={`${colSpans.memory} flex flex-col justify-between ${getThemeClass()} rounded-xl p-6 shadow-2xl backdrop-blur-sm`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs uppercase font-mono font-bold text-amber-400">Trạng thái bộ nhớ (Memory Heap)</span>
              <span className="text-xs text-slate-400 font-mono">Step {Math.max(1, currentStepIndex + 1)} / {steps.length}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 mb-4" style={{ fontSize: `${Math.max(12, Math.round(baseSize * 0.48))}px` }}>
              <div className="text-slate-500 mb-1">// Variables Snapshot:</div>
              <div>{activeStep?.variableState || '{ i: 0, arr: [2, 5, 8] }'}</div>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="text-xs font-bold text-amber-300 uppercase mb-1">Giải thích thao tác</h4>
              <p className="text-sm text-slate-200 leading-relaxed" style={{ fontSize: `${Math.max(13, Math.round(baseSize * 0.52))}px` }}>
                {activeStep?.note || 'Đang thực thi lệnh tiếp theo trong thuật toán.'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500 font-mono">
            Từng dòng mã được đồng bộ với lời bình narration
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 relative z-10">
        <span>Mô phỏng từng bước thực thi thuật toán tin học</span>
        <span className="font-mono">Code Trace Engine</span>
      </div>
    </div>
  );
};
