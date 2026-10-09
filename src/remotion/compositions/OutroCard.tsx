'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { OutroProps } from '@/types/stem';
import { FlatStage } from '../flat/FlatStage';

export const OutroCard: React.FC<OutroProps> = ({
  title = 'Tổng Kết Bài Học',
  summaryPoints,
  nextLessonSuggestion = 'Bài học chuyên đề tiếp theo',
  instructorName = 'STEMotion Academy',
  customFontSize,
  cardScale,
  cardTheme = 'dark',
  cardWidth = 'standard',
}) => {
  const safeSummaryPoints = Array.isArray(summaryPoints) && summaryPoints.length > 0 ? summaryPoints : [
    'Nắm vững bản chất và công thức trọng tâm',
    'Hoàn thành bài tập thực hành trên hệ thống LMS',
    'Đón chờ chuyên đề ứng dụng trong bài học kế tiếp',
  ];
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
        return 'bg-slate-950/95 border-2 border-indigo-400 shadow-[0_0_35px_rgba(99,102,241,0.25)]';
      case 'glass':
        return 'bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl';
      case 'light':
        return 'bg-slate-800/90 border border-slate-600/70 shadow-xl';
      default:
        return 'bg-slate-900/80 border border-indigo-500/30 shadow-2xl';
    }
  };

  const baseSize = customFontSize || 30;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <FlatStage ambience="space" className="flex flex-col justify-between p-16">
      {/* Background Radial Glow */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none -bottom-20 -right-20"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.9) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-indigo-600/20 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
            SUMMARY & NEXT STEPS
          </span>
          <h2 className="text-2xl font-bold text-slate-100" style={{ fontSize: `${Math.round(baseSize * 0.95)}px` }}>{title}</h2>
        </div>
        <span className="text-sm font-mono text-slate-400">Tóm tắt bài giảng</span>
      </div>

      {/* Main Content: Key Takeaways & Next Video Hook */}
      <div 
        style={{
          transform: `scale(${cardScale || 1.0})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease',
        }}
        className={`my-auto ${getWidthClass()} w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch relative z-10`}
      >
        {/* Key Takeaways */}
        <div 
          style={{ transform: `scale(${titleScale})` }}
          className={`${getThemeClass()} rounded-2xl p-6 shadow-2xl flex flex-col justify-between`}
        >
          <div>
            <h3 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2" style={{ fontSize: `${Math.round(baseSize * 0.65)}px` }}>
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Điểm cốt lõi cần ghi nhớ
            </h3>
            <div className="space-y-3">
              {safeSummaryPoints.map((point, idx) => {
                const pointOpacity = interpolate(frame, [15 + idx * 10, 25 + idx * 10], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                return (
                  <div
                    key={idx}
                    style={{ opacity: pointOpacity, fontSize: `${Math.max(13, Math.round(baseSize * 0.5))}px` }}
                    className="flex items-start gap-3 text-slate-200 text-sm leading-relaxed p-2.5 rounded-lg bg-slate-800/40 border border-slate-800"
                  >
                    <span className="text-indigo-400 font-bold font-mono">✓</span>
                    <span>{point}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            Giảng viên: <span className="text-slate-200 font-medium">{instructorName || 'STEMotion Academy'}</span>
          </div>
        </div>

        {/* Up Next Card */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-mono text-indigo-400 font-bold tracking-wider mb-2 block">
              Bài học tiếp theo
            </span>
            <h4 className="text-2xl font-bold text-slate-100 mb-3" style={{ fontSize: `${Math.round(baseSize * 0.85)}px` }}>
              {nextLessonSuggestion}
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Hãy thực hành bài tập và mở rộng kiến thức với bài học kế tiếp trong lộ trình học tập STEMotion.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-between">
            <span className="text-xs font-mono text-indigo-300">Nhấn nút bên phải để bắt đầu</span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 font-bold text-white shadow-md">
              HỌC TIẾP →
            </span>
          </div>
        </div>
      </div>

    </FlatStage>
  );
};
