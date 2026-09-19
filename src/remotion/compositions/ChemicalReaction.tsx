'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ChemicalReactionProps } from '@/types/stem';
import katex from 'katex';

export const ChemicalReaction: React.FC<ChemicalReactionProps> = ({
  title,
  equation = '2H_2 + O_2 \\xrightarrow{t^\\circ} 2H_2O',
  reactants = 'Khí Hydro (H2) + Khí Oxy (O2)',
  products = 'Nước (H2O)',
  condition = 'Đốt nóng (t° > 500°C)',
  observation = 'Hỗn hợp phát nổ kèm nhiệt lượng lớn, thành bình xuất hiện hơi nước ngưng tụ.',
  flaskColor = '#38bdf8',
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

  // Entry animation
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const flaskBubble = (offset: number) => {
    const y = ((frame * 2.5 + offset * 30) % 90);
    const opacity = interpolate(y, [0, 20, 70, 90], [0, 0.9, 0.8, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return { y, opacity };
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-14 relative overflow-hidden select-none">
      {/* Background Chemistry Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#ec4899 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 24px 24px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-rose-500/20 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider border border-rose-500/30">
            HÓA HỌC • PHẢN ỨNG THỰC NGHIỆM
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100">{title}</h2>
        </div>
        <span className="text-xs text-rose-300/80 font-mono">STEM Chemistry Lab 4.0</span>
      </div>

      {/* Main Content Area */}
      <div
        style={{ transform: `scale(${cardScale})` }}
        className="flex-1 my-5 grid grid-cols-12 gap-8 items-center relative z-10"
      >
        {/* Left Column: Animated Flask Graphic */}
        <div className="col-span-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-2xl backdrop-blur-md h-full">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Mô Phỏng Ống Nghiệm / Bình Phản Ứng
          </span>

          <svg width="220" height="240" viewBox="0 0 200 240" className="overflow-visible">
            {/* Flask Glass Body */}
            <path
              d="M85 30 L85 80 L35 190 A25 25 0 0 0 55 220 L145 220 A25 25 0 0 0 165 190 L115 80 L115 30 Z"
              fill="rgba(15, 23, 42, 0.7)"
              stroke="#64748b"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Liquid Fill */}
            <path
              d="M50 170 L62 195 A15 15 0 0 0 75 208 L125 208 A15 15 0 0 0 138 195 L150 170 Z"
              fill={flaskColor}
              fillOpacity="0.45"
            />
            {/* Flask Rim Top */}
            <ellipse cx="100" cy="30" rx="18" ry="6" fill="none" stroke="#94a3b8" strokeWidth="3" />

            {/* Rising Bubbles */}
            {[15, 45, 75, 105].map((seed, i) => {
              const { y, opacity } = flaskBubble(seed);
              return (
                <circle
                  key={i}
                  cx={75 + (i * 18)}
                  cy={200 - y}
                  r={4 + (i % 3)}
                  fill="#ffffff"
                  opacity={opacity}
                />
              );
            })}
          </svg>

          <div className="mt-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Điều kiện: {condition}</span>
          </div>
        </div>

        {/* Right Column: Chemical Equation & Observation Data */}
        <div className="col-span-7 flex flex-col justify-between h-full space-y-4">
          {/* Reaction Equation Box with KaTeX */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-6 shadow-xl text-center">
            <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest block mb-1">
              Phương Trình Hóa Học
            </span>
            <div
              className="text-3xl text-indigo-100 font-bold py-2 font-serif overflow-x-auto"
              dangerouslySetInnerHTML={renderLatex(equation)}
            />
          </div>

          {/* Reactants vs Products */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-bold text-amber-400 block mb-1 font-mono uppercase">
                Chất Tham Gia (Reactants)
              </span>
              <p className="text-sm text-slate-200 font-medium leading-snug">{reactants}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-bold text-emerald-400 block mb-1 font-mono uppercase">
                Sản Phẩm Thu Được (Products)
              </span>
              <p className="text-sm text-slate-200 font-medium leading-snug">{products}</p>
            </div>
          </div>

          {/* Observation Callout */}
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm font-bold shrink-0">
              🧪
            </div>
            <div>
              <span className="text-xs font-bold text-rose-300 block">Hiện tượng thực nghiệm quan sát:</span>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{observation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-900 pt-3 relative z-10 font-mono">
        <span>STEMotion • Chuẩn Khoa Học GDPT 2018</span>
        <span>Phân Cảnh Hóa Học Tương Tác</span>
      </div>
    </div>
  );
};
