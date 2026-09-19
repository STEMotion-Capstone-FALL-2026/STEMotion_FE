'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MathFormulaProps } from '@/types/stem';
import katex from 'katex';

export const MathFormulaStep: React.FC<MathFormulaProps> = ({
  title,
  latex,
  steps,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Render LaTeX safely
  const renderLatex = (tex: string) => {
    try {
      return {
        __html: katex.renderToString(tex, {
          displayMode: true,
          throwOnError: false,
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
          <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        </div>
        <span className="text-sm text-slate-400 font-mono">KaTeX Realtime Engine</span>
      </div>

      {/* Main Core Formula Box */}
      <div 
        style={{ transform: `scale(${mainFormulaScale})` }}
        className="my-auto mx-auto max-w-4xl w-full bg-slate-900/90 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-8 shadow-2xl relative z-10 flex flex-col items-center"
      >
        <div className="text-xs uppercase font-mono text-blue-400 font-semibold mb-3 tracking-widest">
          Công thức cốt lõi (Main Equation)
        </div>
        <div 
          className="text-3xl md:text-5xl text-blue-300 font-serif py-2 overflow-x-auto max-w-full"
          dangerouslySetInnerHTML={renderLatex(latex)}
        />
      </div>

      {/* Progressive Step Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {steps.map((step, idx) => {
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
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 backdrop-blur-sm relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 font-mono">BƯỚC {idx + 1}</span>
                <span className="text-xs text-slate-400">{step.label}</span>
              </div>
              <div 
                className="text-lg text-slate-100 font-mono py-1.5"
                dangerouslySetInnerHTML={renderLatex(step.latexSnippet)}
              />
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
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
