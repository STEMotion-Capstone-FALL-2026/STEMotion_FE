'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ProcessTimelineProps } from '@/types/stem';

export const ProcessTimeline: React.FC<ProcessTimelineProps> = ({
  title,
  processTitle = 'Chu Trình Nguyên Phân Tế Bào (Mitosis Lifecycle)',
  stages = [
    {
      stageNumber: 1,
      title: 'Kỳ Đầu (Prophase)',
      description: 'Nhiễm sắc thể kép bắt đầu co xoắn, màng nhân và nhân con tiêu biến dần.',
      badge: 'Giai Đoạn 1',
    },
    {
      stageNumber: 2,
      title: 'Kỳ Giữa (Metaphase)',
      description: 'Các NST kép co xoắn cực đại và xếp thành 1 hàng trên mặt phẳng xích đạo.',
      badge: 'Giai Đoạn 2',
    },
    {
      stageNumber: 3,
      title: 'Kỳ Sau (Anaphase)',
      description: 'Mỗi NST kép tách nhau tại tâm động thành 2 NST đơn phân ly về 2 cực.',
      badge: 'Giai Đoạn 3',
    },
    {
      stageNumber: 4,
      title: 'Kỳ Cuối (Telophase)',
      description: 'NST dãn xoắn, màng nhân tái lập, tế bào chất phân chia tạo 2 tế bào con.',
      badge: 'Giai Đoạn 4',
    },
  ],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Progress line length animation
  const lineProgress = interpolate(frame, [0, 45], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-14 relative overflow-hidden select-none">
      {/* Background Bio Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#10b981 1px, transparent 1px), radial-gradient(#6366f1 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
            TIẾN TRÌNH & CHU TRÌNH SINH HỌC
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100">{title}</h2>
        </div>
        <span className="text-xs text-emerald-300/80 font-mono">Process Dynamic Flow</span>
      </div>

      {/* Title Subheader */}
      <div className="text-center my-2 relative z-10">
        <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block">
          Chủ Đề Chu Trình
        </span>
        <h3 className="text-xl font-bold text-slate-200 mt-0.5">{processTitle}</h3>
      </div>

      {/* Timeline Pipeline */}
      <div className="flex-1 my-3 flex flex-col justify-center relative z-10">
        {/* Horizontal Connecting Bar */}
        <div className="relative mb-6">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all shadow-lg shadow-emerald-500/50"
              style={{ width: `${lineProgress}%` }}
            />
          </div>
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-4 gap-4">
          {stages.map((stg, idx) => {
            const delay = idx * 10;
            const cardSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 90 },
            });
            const isActive = frame >= delay;

            return (
              <div
                key={idx}
                style={{
                  transform: `translateY(${(1 - Math.max(0, cardSpring)) * 40}px)`,
                  opacity: Math.max(0, cardSpring),
                }}
                className={`rounded-2xl p-5 border flex flex-col justify-between transition-all backdrop-blur-md ${
                  isActive
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-xl shadow-emerald-950/30'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono text-sm font-black flex items-center justify-center border border-emerald-500/30">
                      0{stg.stageNumber || idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300 font-semibold">
                      {stg.badge || `Pha ${idx + 1}`}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100 mb-2 leading-snug">
                    {stg.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {stg.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                  <span>Tiếp diễn</span>
                  <span>➔</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-900 pt-3 relative z-10 font-mono">
        <span>STEMotion • Chu Trình Khoa Học Tự Nhiên</span>
        <span>Phân Cảnh Tiến Trình Tương Tác</span>
      </div>
    </div>
  );
};
