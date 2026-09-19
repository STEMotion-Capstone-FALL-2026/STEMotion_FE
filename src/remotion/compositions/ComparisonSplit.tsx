'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ComparisonSplitProps } from '@/types/stem';

export const ComparisonSplit: React.FC<ComparisonSplitProps> = ({
  title,
  topicA = {
    title: 'Dòng Điện Một Chiều (DC)',
    badge: 'Direct Current',
    points: [
      'Dòng electron chuyển dời có hướng theo 1 chiều duy nhất',
      'Điện áp không đổi theo thời gian',
      'Nguồn phát: Pin, Ắc quy, Pin năng lượng mặt trời',
      'Ứng dụng: Bo mạch điện tử, điện thoại, vi xử lý',
    ],
    color: '#3b82f6',
  },
  topicB = {
    title: 'Dòng Điện Xoay Chiều (AC)',
    badge: 'Alternating Current',
    points: [
      'Chiều và cường độ biến thiên tuần hoàn hình sin',
      'Dễ dàng tăng/hạ áp bằng máy biến áp',
      'Truyền tải điện năng đi xa ít hao phí nhiệt lượng',
      'Ứng dụng: Lưới điện quốc gia, động cơ công nghiệp',
    ],
    color: '#f59e0b',
  },
  conclusion = 'Điện AC tối ưu cho truyền tải lưới điện lớn, còn DC không thể thay thế trong các thiết bị vi mạch số.',
}) => {
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

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-14 relative overflow-hidden select-none">
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
          <h2 className="text-2xl font-extrabold text-slate-100">{title}</h2>
        </div>
        <span className="text-xs text-indigo-300/80 font-mono">Versus Analytical Engine</span>
      </div>

      {/* Center Versus Arena */}
      <div className="flex-1 my-4 grid grid-cols-11 gap-4 items-center relative z-10">
        {/* Left Side: Topic A */}
        <div
          style={{
            transform: `translateX(${(1 - slideLeft) * -80}px)`,
            opacity: slideLeft,
          }}
          className="col-span-5 bg-gradient-to-b from-blue-950/40 to-slate-900/90 border border-blue-500/30 rounded-2xl p-6 h-full flex flex-col justify-between shadow-2xl backdrop-blur-md"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[11px] font-bold border border-blue-500/40">
                {topicA.badge || 'KHÁI NIỆM A'}
              </span>
              <span className="text-xs text-blue-300/70 font-mono">01</span>
            </div>
            <h3 className="text-xl font-bold text-blue-200">{topicA.title}</h3>
          </div>

          <div className="space-y-2.5 my-3">
            {topicA.points?.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  ✓
                </span>
                <span className="leading-relaxed">{pt}</span>
              </div>
            ))}
          </div>

          <div className="text-[10px] font-mono text-blue-400/80 border-t border-blue-900/50 pt-2 flex justify-between">
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
          className="col-span-5 bg-gradient-to-b from-amber-950/40 to-slate-900/90 border border-amber-500/30 rounded-2xl p-6 h-full flex flex-col justify-between shadow-2xl backdrop-blur-md"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold border border-amber-500/40">
                {topicB.badge || 'KHÁI NIỆM B'}
              </span>
              <span className="text-xs text-amber-300/70 font-mono">02</span>
            </div>
            <h3 className="text-xl font-bold text-amber-200">{topicB.title}</h3>
          </div>

          <div className="space-y-2.5 my-3">
            {topicB.points?.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  ✓
                </span>
                <span className="leading-relaxed">{pt}</span>
              </div>
            ))}
          </div>

          <div className="text-[10px] font-mono text-amber-400/80 border-t border-amber-900/50 pt-2 flex justify-between">
            <span>Đặc trưng cốt lõi</span>
            <span>Mô hình định lượng</span>
          </div>
        </div>
      </div>

      {/* Bottom: Conclusion Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3 relative z-10 shadow-lg">
        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold shrink-0 border border-emerald-500/30">
          KẾT LUẬN SƯ PHẠM
        </span>
        <p className="text-xs text-slate-300 font-medium leading-normal">{conclusion}</p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-900 pt-3 relative z-10 font-mono">
        <span>STEMotion • Phương Pháp So Sánh Đối Chiếu</span>
        <span>Phân Cảnh Phân Tích Khái Niệm</span>
      </div>
    </div>
  );
};
