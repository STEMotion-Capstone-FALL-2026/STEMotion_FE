'use client';

import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { GeometrySpaceProps } from '@/types/stem';
import katex from 'katex';

export const GeometrySpace: React.FC<GeometrySpaceProps> = ({
  title,
  theoremName = 'Định Lý Pytago (Pythagorean Theorem)',
  formulaLatex = 'a^2 + b^2 = c^2',
  dimensions = { a: 3, b: 4, c: 5 },
  explanation = 'Trong tam giác vuông, bình phương độ dài cạnh huyền bằng tổng bình phương hai cạnh góc vuông.',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  const geomSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-14 relative overflow-hidden select-none">
      {/* Background Math Geometry Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
            HÌNH HỌC TRỰC QUAN & ĐỊNH LÝ
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100">{title}</h2>
        </div>
        <span className="text-xs text-cyan-300/80 font-mono">Dynamic Geometry Canvas</span>
      </div>

      {/* Main Content Area */}
      <div
        style={{ transform: `scale(${geomSpring})` }}
        className="flex-1 my-4 grid grid-cols-12 gap-8 items-center relative z-10"
      >
        {/* Left Column: Geometric SVG Diagram */}
        <div className="col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-2xl backdrop-blur-md h-full">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Mô Hình Diện Tích Ba Hình Vuông
          </span>

          <svg width="280" height="260" viewBox="0 0 280 260" className="overflow-visible">
            {/* Square on side A (left) */}
            <rect
              x="50"
              y="110"
              width="60"
              height="60"
              fill="rgba(59, 130, 246, 0.25)"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            <text x="75" y="145" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle">
              a² = {dimensions.a * dimensions.a}
            </text>

            {/* Square on side B (bottom) */}
            <rect
              x="110"
              y="170"
              width="80"
              height="80"
              fill="rgba(16, 185, 129, 0.25)"
              stroke="#10b981"
              strokeWidth="2"
            />
            <text x="150" y="215" fill="#6ee7b7" fontSize="11" fontWeight="bold" textAnchor="middle">
              b² = {dimensions.b * dimensions.b}
            </text>

            {/* Triangle ABC */}
            <polygon
              points="110,110 110,170 190,170"
              fill="rgba(244, 63, 94, 0.2)"
              stroke="#f43f5e"
              strokeWidth="3"
            />

            {/* Right-angle mark at (110, 170) */}
            <polyline points="110,160 120,160 120,170" fill="none" stroke="#f43f5e" strokeWidth="2" />

            {/* Labels on triangle sides */}
            <text x="100" y="145" fill="#ffffff" fontSize="12" fontWeight="bold">
              a={dimensions.a}
            </text>
            <text x="145" y="165" fill="#ffffff" fontSize="12" fontWeight="bold">
              b={dimensions.b}
            </text>
            <text x="155" y="135" fill="#fbbf24" fontSize="12" fontWeight="bold">
              c={dimensions.c}
            </text>

            {/* Square on hypotenuse C (slanted visual outline) */}
            <polygon
              points="110,110 190,170 250,90 170,30"
              fill="rgba(245, 158, 11, 0.2)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <text x="180" y="105" fill="#fde68a" fontSize="11" fontWeight="bold" textAnchor="middle">
              c² = {dimensions.c * dimensions.c}
            </text>
          </svg>

          <span className="text-[10px] font-mono text-cyan-400 mt-2">
            Diện tích: {dimensions.a * dimensions.a} + {dimensions.b * dimensions.b} = {dimensions.c * dimensions.c} (Đẳng thức chuẩn)
          </span>
        </div>

        {/* Right Column: Theorem Name, KaTeX, Proof & Dimensions */}
        <div className="col-span-7 flex flex-col justify-between h-full space-y-4">
          <div className="bg-gradient-to-r from-slate-900 to-cyan-950/60 border border-cyan-500/30 rounded-2xl p-6 shadow-xl text-center">
            <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest block mb-1">
              {theoremName}
            </span>
            <div
              className="text-3xl text-cyan-100 font-bold py-2 font-serif overflow-x-auto"
              dangerouslySetInnerHTML={renderLatex(formulaLatex)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-blue-400 block">Cạnh góc vuông a</span>
              <div className="text-xl font-bold text-blue-200 mt-1">{dimensions.a}</div>
            </div>
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-emerald-400 block">Cạnh góc vuông b</span>
              <div className="text-xl font-bold text-emerald-200 mt-1">{dimensions.b}</div>
            </div>
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-amber-400 block">Cạnh huyền c</span>
              <div className="text-xl font-bold text-amber-200 mt-1">{dimensions.c}</div>
            </div>
          </div>

          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold shrink-0">
              📐
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-300 block">Ý nghĩa hình học trực quan:</span>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{explanation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-900 pt-3 relative z-10 font-mono">
        <span>STEMotion • Toán Học Trực Quan GDPT 2018</span>
        <span>Phân Cảnh Hình Học Không Gian</span>
      </div>
    </div>
  );
};
