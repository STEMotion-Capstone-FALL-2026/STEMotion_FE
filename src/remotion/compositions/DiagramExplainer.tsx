'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DiagramExplainerProps } from '@/types/stem';

export const DiagramExplainer: React.FC<DiagramExplainerProps> = ({
  title,
  diagramTitle,
  labels,
  customFontSize,
  cardScale,
  cardTheme = 'dark',
  cardWidth = 'standard',
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

  const getThemeClass = () => {
    switch (cardTheme) {
      case 'contrast':
        return 'bg-slate-950/95 border-2 border-purple-400 shadow-[0_0_35px_rgba(168,85,247,0.25)]';
      case 'glass':
        return 'bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl';
      case 'light':
        return 'bg-slate-800/90 border border-slate-600/70 shadow-xl';
      default:
        return 'bg-slate-900/80 border border-purple-500/30 shadow-2xl';
    }
  };

  const baseSize = customFontSize || 30;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const diagramScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-16 relative overflow-hidden select-none">
      {/* Background visual grid */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-purple-600/20 text-purple-400 font-mono text-xs font-bold uppercase tracking-wider border border-purple-500/30">
            DIAGRAM EXPLAINER
          </span>
          <h2 className="text-2xl font-bold text-slate-100" style={{ fontSize: `${Math.round(baseSize * 0.95)}px` }}>{title}</h2>
        </div>
        <span className="text-sm text-slate-400 font-mono" style={{ fontSize: `${Math.max(12, Math.round(baseSize * 0.5))}px` }}>{diagramTitle}</span>
      </div>

      {/* Main Diagram Area with Interactive Pins / Annotations */}
      <div 
        style={{
          transform: `scale(${cardScale || 1.0})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease',
        }}
        className={`my-auto ${getWidthClass()} w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative z-10`}
      >
        {/* SVG Schematic Area */}
        <div 
          style={{ transform: `scale(${diagramScale})` }}
          className={`w-full h-80 ${getThemeClass()} rounded-2xl relative flex items-center justify-center p-6 shadow-2xl overflow-hidden`}
        >
          {/* Animated SVG Graphic (Simulating Physics Pendulum / Anatomy) */}
          <svg className="w-full h-full" viewBox="0 0 400 300">
            {/* Ceiling */}
            <line x1="100" y1="30" x2="300" y2="30" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
            
            {/* Pivot */}
            <circle cx="200" cy="30" r="6" fill="#38bdf8" />
            
            {/* Pendulum rod moving */}
            {(() => {
              const angle = Math.sin(frame / 15) * 28;
              const rad = (angle * Math.PI) / 180;
              const length = 180;
              const bobX = 200 + length * Math.sin(rad);
              const bobY = 30 + length * Math.cos(rad);
              return (
                <g>
                  <line x1="200" y1="30" x2={bobX} y2={bobY} stroke="#94a3b8" strokeWidth="3" strokeDasharray="4 2" />
                  <circle cx={bobX} cy={bobY} r="22" fill="#a855f7" className="filter drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
                  <text x={bobX} y={bobY + 5} fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">m</text>
                  <circle cx={bobX} cy={bobY} r="32" fill="none" stroke="#e879f9" strokeWidth="1.5" opacity="0.6" />
                </g>
              );
            })()}

            {/* Reference dashed vertical line */}
            <line x1="200" y1="30" x2="200" y2="250" stroke="#475569" strokeWidth="1.5" strokeDasharray="6 4" />
          </svg>
        </div>

        {/* Labels and Descriptions List */}
        <div className="flex flex-col gap-4">
          {labels.map((item, idx) => {
            const labelDelay = 20 + idx * 20;
            const labelOpacity = interpolate(frame, [labelDelay, labelDelay + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const labelX = interpolate(frame, [labelDelay, labelDelay + 12], [20, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <div
                key={idx}
                style={{
                  opacity: labelOpacity,
                  transform: `translateX(${labelX}px)`,
                }}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-start gap-4 hover:border-purple-500/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center shrink-0 text-sm">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-base" style={{ fontSize: `${Math.round(baseSize * 0.65)}px` }}>{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed" style={{ fontSize: `${Math.max(13, Math.round(baseSize * 0.5))}px` }}>{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 relative z-10">
        <span>Sơ đồ giải phẫu & cơ chế dao động tuần hoàn</span>
        <span className="font-mono">Motion Diagram Engine</span>
      </div>
    </div>
  );
};
