'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ComparisonSplitProps } from '@/types/stem';

export const ComparisonSplit: React.FC<ComparisonSplitProps> = (props) => {
  const {
    title = 'So Sánh & Phân Biệt Đối Chiếu',
    topicA,
    topicB,
    conclusion = 'Cả hai mô hình bổ trợ cho nhau tùy thuộc vào bài toán và điều kiện thực tế.',
    fontSizeScale = 'large',
    customFontSize,
    cardScale,
    cardTheme = 'dark',
    cardWidth = 'standard',
  } = props;

  const safeTopicA: { title: string; badge: string; points: string[]; color: string } = {
    title: (props as any).leftTitle || topicA?.title || 'Khái Niệm A (Mô Hình 1)',
    badge: topicA?.badge || 'Đặc tính A',
    points: Array.isArray(topicA?.points) && topicA.points.length > 0
      ? topicA.points
      : (Array.isArray((props as any).leftPoints) && (props as any).leftPoints.length > 0
          ? (props as any).leftPoints
          : [
              'Đặc trưng cốt lõi của hiện tượng A',
              'Mô hình định lượng và điều kiện áp dụng',
              'Ý nghĩa ứng dụng trong thực tế',
            ]),
    color: topicA?.color || '#3b82f6',
  };

  const safeTopicB: { title: string; badge: string; points: string[]; color: string } = {
    title: (props as any).rightTitle || topicB?.title || 'Khái Niệm B (Mô Hình 2)',
    badge: topicB?.badge || 'Đặc tính B',
    points: Array.isArray(topicB?.points) && topicB.points.length > 0
      ? topicB.points
      : (Array.isArray((props as any).rightPoints) && (props as any).rightPoints.length > 0
          ? (props as any).rightPoints
          : [
              'Đặc trưng tương phản của hiện tượng B',
              'Mô hình biến thiên theo chu kỳ',
              'Ứng dụng tối ưu trong kỹ thuật',
            ]),
    color: topicB?.color || '#f59e0b',
  };
  const getWidthClass = () => {
    switch (cardWidth) {
      case 'compact':
        return 'max-w-4xl';
      case 'wide':
        return 'max-w-7xl';
      case 'full':
        return 'w-full px-2';
      case 'standard':
      default:
        return 'max-w-6xl';
    }
  };

  const getThemeClass = (isTopicA: boolean) => {
    switch (cardTheme) {
      case 'contrast':
        return isTopicA 
          ? 'bg-slate-950/95 border-2 border-blue-400 shadow-[0_0_35px_rgba(59,130,246,0.25)]'
          : 'bg-slate-950/95 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.25)]';
      case 'glass':
        return 'bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl';
      case 'light':
        return 'bg-slate-800/90 border border-slate-600/70 shadow-xl';
      default:
        return isTopicA
          ? 'bg-gradient-to-b from-blue-950/50 to-slate-900/90 border border-blue-500/30 shadow-2xl'
          : 'bg-gradient-to-b from-amber-950/50 to-slate-900/90 border border-amber-500/30 shadow-2xl';
    }
  };

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideLeft = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 85 },
  });

  const slideRight = spring({
    frame: frame - 6,
    fps,
    config: { damping: 15, stiffness: 85 },
  });

  const vsBadgeScale = spring({
    frame: frame - 12,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Cỡ chữ động cho 1080p canvas:
  let baseFontSize = 30; // Mặc định 30px to rõ, đọc siêu nét trên màn 1080p
  if (customFontSize && typeof customFontSize === 'number') {
    baseFontSize = customFontSize;
  } else if (fontSizeScale === 'huge') {
    baseFontSize = 42;
  } else if (fontSizeScale === 'large') {
    baseFontSize = 30;
  } else if (fontSizeScale === 'normal') {
    baseFontSize = 24;
  }

  const topicTitleFontSize = Math.round(baseFontSize * 1.35);
  const badgeFontSize = Math.max(12, Math.round(baseFontSize * 0.45));
  const checkSize = Math.round(baseFontSize * 1.25);
  const gapSize = Math.max(12, Math.round(baseFontSize * 0.65));
  const conclusionFontSize = Math.max(14, Math.round(baseFontSize * 0.7));

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-12 relative overflow-hidden select-none">
      {/* Background Subtle Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)',
          backgroundSize: '54px 54px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
            SO SÁNH & PHÂN BIỆT ĐỐI CHIẾU
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100">{title}</h2>
        </div>
        <span className="text-xs text-indigo-300/80 font-mono">Versus Analytical Engine</span>
      </div>

      {/* Center Versus Arena */}
      <div 
        style={{
          transform: `scale(${cardScale || 1.0})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease',
        }}
        className={`flex-1 my-4 ${getWidthClass()} mx-auto w-full grid grid-cols-11 gap-4 items-center relative z-10 min-h-0`}
      >
        {/* Left Side: Topic A */}
        <div
          style={{
            transform: `translateX(${(1 - slideLeft) * -80}px)`,
            opacity: slideLeft,
          }}
          className={`col-span-5 ${getThemeClass(true)} rounded-2xl p-6 h-full flex flex-col justify-between shadow-2xl backdrop-blur-md`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                style={{ fontSize: `${badgeFontSize}px` }}
                className="rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold border border-blue-500/40 px-3 py-0.5"
              >
                {safeTopicA.badge}
              </span>
              <span className="text-xs text-blue-300/70 font-mono">01</span>
            </div>
            <h3
              style={{ fontSize: `${topicTitleFontSize}px`, lineHeight: 1.25 }}
              className="font-black text-blue-200"
            >
              {safeTopicA.title}
            </h3>
          </div>

          {/* Points list centered and balanced */}
          <div
            className="flex-1 flex flex-col justify-center my-4"
            style={{ gap: `${gapSize}px` }}
          >
            {safeTopicA.points.map((pt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 text-slate-100"
                style={{ fontSize: `${baseFontSize}px`, lineHeight: 1.45 }}
              >
                <span
                  style={{
                    width: `${checkSize}px`,
                    height: `${checkSize}px`,
                    fontSize: `${Math.round(baseFontSize * 0.55)}px`,
                  }}
                  className="rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0 mt-1 font-bold"
                >
                  ✓
                </span>
                <span className="leading-snug font-medium">{pt}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] font-mono text-blue-400/80 border-t border-blue-900/50 pt-2 flex justify-between">
            <span>Đặc trưng cốt lõi</span>
            <span>Mô hình định lượng</span>
          </div>
        </div>

        {/* Center: VS Badge */}
        <div className="col-span-1 flex justify-center items-center">
          <div
            style={{ transform: `scale(${Math.max(0, vsBadgeScale)})` }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-rose-500/30 border-2 border-white/20 italic"
          >
            VS
          </div>
        </div>

        {/* Right Side: Topic B */}
        <div
          style={{
            transform: `translateX(${(1 - slideRight) * 80}px)`,
            opacity: Math.max(0, slideRight),
          }}
          className={`col-span-5 ${getThemeClass(false)} rounded-2xl p-6 h-full flex flex-col justify-between shadow-2xl backdrop-blur-md`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                style={{ fontSize: `${badgeFontSize}px` }}
                className="rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/40 px-3 py-0.5"
              >
                {safeTopicB.badge}
              </span>
              <span className="text-xs text-amber-300/70 font-mono">02</span>
            </div>
            <h3
              style={{ fontSize: `${topicTitleFontSize}px`, lineHeight: 1.25 }}
              className="font-black text-amber-200"
            >
              {safeTopicB.title}
            </h3>
          </div>

          {/* Points list centered and balanced */}
          <div
            className="flex-1 flex flex-col justify-center my-4"
            style={{ gap: `${gapSize}px` }}
          >
            {safeTopicB.points.map((pt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 text-slate-100"
                style={{ fontSize: `${baseFontSize}px`, lineHeight: 1.45 }}
              >
                <span
                  style={{
                    width: `${checkSize}px`,
                    height: `${checkSize}px`,
                    fontSize: `${Math.round(baseFontSize * 0.55)}px`,
                    marginTop: `${Math.max(2, Math.round(baseFontSize * 0.08))}px`,
                  }}
                  className="rounded-full bg-amber-500/25 text-amber-400 font-mono flex items-center justify-center shrink-0 font-bold border border-amber-500/40"
                >
                  ✓
                </span>
                <span className="leading-snug font-medium">{pt}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] font-mono text-amber-400/80 border-t border-amber-900/50 pt-2 flex justify-between">
            <span>Đặc trưng cốt lõi</span>
            <span>Mô hình định lượng</span>
          </div>
        </div>
      </div>

      {/* Bottom: Conclusion Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3 relative z-10 shadow-lg">
        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold shrink-0 border border-emerald-500/30">
          KẾT LUẬN SƯ PHẠM
        </span>
        <p
          className="text-slate-200 font-medium leading-normal"
          style={{ fontSize: `${conclusionFontSize}px` }}
        >
          {conclusion}
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-900 pt-2 relative z-10 font-mono">
        <span>STEMotion • Phương Pháp So Sánh Đối Chiếu</span>
        <span>Phân Cảnh Phân Tích Khái Niệm</span>
      </div>
    </div>
  );
};
