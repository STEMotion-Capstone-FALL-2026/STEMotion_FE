'use client';

import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { AlgorithmWalkthroughProps } from '@/types/stem';

export const AlgorithmWalkthrough: React.FC<AlgorithmWalkthroughProps> = ({
  title,
  language,
  codeSnippet,
  steps,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const codeLines = codeSnippet.split('\n');

  // Determine active step based on frame
  const currentStepIndex = Math.min(
    Math.floor((frame / (fps * 2.5))),
    steps.length - 1
  );
  const activeStep = steps[Math.max(0, currentStepIndex)] || steps[0];

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
          <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        </div>
        <span className="text-sm text-slate-400 font-mono uppercase">{language} Trace Mode</span>
      </div>

      {/* Main Code & State Side-by-side */}
      <div className="my-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch relative z-10">
        {/* Code Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden font-mono text-sm shadow-2xl flex flex-col">
          <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
            <span>source.{language === 'python' ? 'py' : 'ts'}</span>
            <span className="text-amber-400">Line {activeStep?.lineHighlight || 1} executing</span>
          </div>
          <div className="p-4 space-y-1 overflow-y-auto">
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

        {/* Memory & Variable State Box */}
        <div className="flex flex-col justify-between bg-slate-900/80 border border-amber-500/30 rounded-xl p-6 shadow-2xl backdrop-blur-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs uppercase font-mono font-bold text-amber-400">Trạng thái bộ nhớ (Memory Heap)</span>
              <span className="text-xs text-slate-400 font-mono">Step {Math.max(1, currentStepIndex + 1)} / {steps.length}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 mb-4">
              <div className="text-slate-500 mb-1">// Variables Snapshot:</div>
              <div>{activeStep?.variableState || '{ i: 0, arr: [2, 5, 8] }'}</div>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="text-xs font-bold text-amber-300 uppercase mb-1">Giải thích thao tác</h4>
              <p className="text-sm text-slate-200 leading-relaxed">
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
