'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MathFormulaProps } from '@/types/stem';
import katex from 'katex';

export const MathFormulaStep: React.FC<MathFormulaProps> = ({
  title = 'Công Thức Trọng Tâm',
  latex = 'f(x) = ax^2 + bx + c',
  steps,
  customFontSize,
  cardScale,
  cardTheme = 'dark',
  cardWidth = 'standard',
}) => {
  const safeSteps = Array.isArray(steps) && steps.length > 0 ? steps : [
    { label: 'Bước 1', latexSnippet: 'a \\neq 0', explanation: 'Điều kiện xác định của phương trình' },
    { label: 'Bước 2', latexSnippet: '\\Delta = b^2 - 4ac', explanation: 'Biệt thức quyết định số nghiệm' },
    { label: 'Bước 3', latexSnippet: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', explanation: 'Nghiệm tổng quát của phương trình' },
  ];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const getWidthClass = () => {
    switch (cardWidth) {
      case 'compact':
        return 'max-w-3xl';
      case 'wide':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-7xl';
      case 'standard':
      default:
        return 'max-w-5xl';
    }
  };

  const getThemeClass = () => {
    switch (cardTheme) {
      case 'contrast':
        return 'bg-slate-950/95 border-2 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.25)]';
      case 'glass':
        return 'bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl';
      case 'light':
        return 'bg-slate-800/90 border border-slate-600/70 shadow-xl';
      default:
        return 'bg-slate-900/90 backdrop-blur-xl border border-blue-500/40 shadow-2xl';
    }
  };

  const baseSize = customFontSize || 30;
  const formulaFontSize = Math.round(baseSize * 1.4);
  const stepTextFontSize = Math.max(12, Math.round(baseSize * 0.45));

  // Render LaTeX safely
  const renderLatex = (tex: string) => {
    try {
      return {
        __html: katex.renderToString(tex, {
          displayMode: true,
          throwOnError: false,
          output: 'html',
        }),
      };
    } catch {
      return { __html: `<code>${tex}</code>` };
    }
  };

  const mainFormulaScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const getStepThemeClass = () => {
    switch (cardTheme) {
      case 'contrast':
        return 'bg-slate-950/90 border border-blue-400/50 shadow-md';
      case 'glass':
        return 'bg-slate-900/40 backdrop-blur-md border border-white/15 shadow-md';
      case 'light':
        return 'bg-slate-800/80 border border-slate-600/60 shadow-md';
      default:
        return 'bg-slate-900/70 border border-slate-800 backdrop-blur-sm';
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-16 relative overflow-hidden select-none">
      {/* Background Math watermark grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-blue-600/20 text-blue-400 font-mono text-xs font-bold uppercase tracking-wider border border-blue-500/30">
            MATH FORMULA STEP
          </span>
          <h2 className="text-3xl font-bold text-slate-100">{title}</h2>
        </div>
        <span className="text-sm text-slate-400 font-mono">KaTeX Realtime Engine</span>
      </div>

      {/* Main Core Formula Box */}
      <div 
        style={{ transform: `scale(${mainFormulaScale * (cardScale || 1.0)})`, transformOrigin: 'center center' }}
        className={`my-auto mx-auto ${getWidthClass()} w-full ${getThemeClass()} rounded-2xl p-8 relative z-10 flex flex-col items-center`}
      >
        <div className="text-xs uppercase font-mono text-blue-400 font-semibold mb-3 tracking-widest">
          Công thức cốt lõi (Main Equation)
        </div>
        <div 
          style={{ fontSize: `${formulaFontSize}px` }}
          className="text-blue-300 font-serif py-2 overflow-x-auto max-w-full transition-all"
          dangerouslySetInnerHTML={renderLatex(latex)}
        />
      </div>

      {/* Progressive Step Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {safeSteps.map((step, idx) => {
          const stepDelay = 25 + idx * 25;
          const stepOpacity = interpolate(frame, [stepDelay, stepDelay + 15], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const stepTranslateY = interpolate(frame, [stepDelay, stepDelay + 15], [20, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={idx}
              style={{
                opacity: stepOpacity,
                transform: `translateY(${stepTranslateY}px)`,
              }}
              className={`${getStepThemeClass()} rounded-xl p-5 relative transition-colors`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 font-mono">BƯỚC {idx + 1}</span>
                <span className="text-xs text-slate-400">{step.label}</span>
              </div>
              <div 
                className="text-lg text-slate-100 font-mono py-1.5"
                dangerouslySetInnerHTML={renderLatex(step.latexSnippet)}
              />
              <p 
                style={{ fontSize: `${stepTextFontSize}px` }}
                className="text-slate-400 mt-2 line-clamp-2"
              >
                {step.explanation}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 relative z-10">
        <span>Khai triển logic từng bước công thức STEM</span>
        <span className="font-mono">Tự động căn chỉnh ký hiệu toán học</span>
      </div>
    </div>
  );
};
