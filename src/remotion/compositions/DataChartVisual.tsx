'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DataChartProps } from '@/types/stem';

export const DataChartVisual: React.FC<DataChartProps> = ({
  title,
  xAxisLabel,
  yAxisLabel,
  dataPoints,
  customFontSize,
  cardScale,
  cardTheme = 'dark',
  cardWidth = 'standard',
}) => {
  const baseSize = customFontSize || 30;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxValue = Math.max(...dataPoints.map((d) => d.value), 10);

  // Dynamic theme styling for the inner card
  const getThemeClass = () => {
    switch (cardTheme) {
      case 'contrast':
        return 'bg-slate-950/95 border-2 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.25)]';
      case 'glass':
        return 'bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl';
      case 'light':
        return 'bg-slate-800/90 border border-slate-600/70 shadow-xl';
      case 'cyan':
        return 'bg-cyan-950/85 border border-cyan-500/50 shadow-2xl';
      case 'purple':
        return 'bg-purple-950/85 border border-purple-500/50 shadow-2xl';
      case 'amber':
        return 'bg-amber-950/85 border border-amber-500/50 shadow-2xl';
      case 'emerald':
        return 'bg-emerald-950/85 border border-emerald-500/50 shadow-2xl';
      case 'dark':
      default:
        return 'bg-slate-900/85 border border-emerald-500/30 shadow-2xl';
    }
  };

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

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-16 relative overflow-hidden select-none">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-emerald-600/20 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
            DATA CHART VISUAL
          </span>
          <h2 className="text-2xl font-bold text-slate-100" style={{ fontSize: `${Math.round(baseSize * 0.95)}px` }}>{title}</h2>
        </div>
        <span className="text-sm text-slate-400 font-mono">Dynamic Bar & Trend Simulation</span>
      </div>

      {/* Main Chart Graphic - Inner Component Card */}
      <div 
        style={{
          transform: `scale(${cardScale || 1.0})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease',
        }}
        className={`my-auto ${getWidthClass()} w-full mx-auto ${getThemeClass()} rounded-2xl p-8 relative z-10`}
      >
        <div className="flex justify-between items-center mb-6 text-xs text-slate-400 font-mono" style={{ fontSize: `${Math.max(12, Math.round(baseSize * 0.45))}px` }}>
          <span>Y-Axis: {yAxisLabel}</span>
          <span>X-Axis: {xAxisLabel}</span>
        </div>

        {/* Bars Container */}
        <div className="h-72 flex items-end justify-around gap-6 border-b border-l border-slate-700 p-4">
          {dataPoints.map((point, idx) => {
            const barDelay = 15 + idx * 8;
            const barSpring = spring({
              frame: frame - barDelay,
              fps,
              config: { damping: 12, stiffness: 100 },
            });

            const heightPercent = Math.min((point.value / maxValue) * 100, 100);
            const animatedHeight = Math.max(0, barSpring * heightPercent);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                {/* Value tooltip on top */}
                <div 
                  style={{ opacity: barSpring, fontSize: `${Math.max(11, Math.round(baseSize * 0.45))}px` }}
                  className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40"
                >
                  {point.value}
                </div>

                {/* Bar */}
                <div 
                  style={{
                    height: `${animatedHeight}%`,
                    background: point.color || 'linear-gradient(to top, #059669, #34d399)',
                  }}
                  className="w-full max-w-[64px] rounded-t-lg shadow-lg relative group transition-all"
                />

                {/* Label */}
                <span className="text-xs font-medium text-slate-300 font-mono mt-2 text-center truncate w-full" style={{ fontSize: `${Math.max(12, Math.round(baseSize * 0.45))}px` }}>
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 relative z-10">
        <span>Biểu đồ trực quan hóa dữ liệu thống kê khoa học</span>
        <span className="font-mono">Real-time Data Visualizer</span>
      </div>
    </div>
  );
};
