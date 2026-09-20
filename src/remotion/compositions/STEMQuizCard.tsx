'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { STEMQuizProps } from '@/types/stem';

export const STEMQuizCard: React.FC<STEMQuizProps> = ({
  title = 'Câu Hỏi Trắc Nghiệm',
  question = 'Hãy lựa chọn phương án chính xác nhất:',
  options,
  correctIndex = 0,
  explanation = 'Ghi nhớ bản chất quy luật để suy luận chính xác.',
  customFontSize,
  cardScale: userCardScale = 1.0,
  cardWidth = 'standard',
}) => {
  const safeOptions = Array.isArray(options) && options.length > 0 ? options : [
    'Phương án A: Khẳng định đúng',
    'Phương án B: Chưa chính xác',
    'Phương án C: Điều kiện chưa đủ',
    'Phương án D: Cả A và B',
  ];
  const baseSize = customFontSize || 30;
  const questionFontSize = Math.round(baseSize * 0.9);
  const optionFontSize = Math.max(14, Math.round(baseSize * 0.65));
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  const cardScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Reveal answer after 4 seconds (frame 100 at 30fps)
  const answerRevealFrame = 100;
  const isAnswerRevealed = frame >= answerRevealFrame;

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between text-white font-sans p-16 relative overflow-hidden select-none">
      {/* Background Visual */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ec4899 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-rose-600/20 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider border border-rose-500/30">
            CHECKPOINT QUIZ
          </span>
          <h2 className="text-2xl font-bold text-slate-100" style={{ fontSize: `${Math.round(baseSize * 0.95)}px` }}>{title}</h2>
        </div>
        <span className="text-sm font-mono text-slate-400">
          {isAnswerRevealed ? 'Đáp án chính xác' : `Đếm ngược giải mã: ${Math.max(0, Math.ceil((answerRevealFrame - frame) / fps))}s`}
        </span>
      </div>

      {/* Main Question & Option Cards */}
      <div 
        style={{ transform: `scale(${cardScale * userCardScale})`, transformOrigin: 'center center' }}
        className={`my-auto ${getWidthClass()} w-full mx-auto relative z-10 flex flex-col gap-6`}
      >
        <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <span className="text-xs uppercase font-mono text-rose-400 font-bold tracking-wider mb-2 block">
            Câu hỏi kiểm tra nhận thức
          </span>
          <p className="text-2xl font-semibold text-slate-100 leading-snug" style={{ fontSize: `${questionFontSize}px` }}>
            {question}
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeOptions.map((option, idx) => {
            const isCorrect = idx === correctIndex;
            let optionStyle = 'bg-slate-900/60 border-slate-800 text-slate-300';

            if (isAnswerRevealed) {
              if (isCorrect) {
                optionStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 scale-[1.02] shadow-emerald-500/20 shadow-lg';
              } else {
                optionStyle = 'bg-slate-950/40 border-slate-800/50 text-slate-600 opacity-60';
              }
            }

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${optionStyle}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                  isAnswerRevealed && isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-base font-medium" style={{ fontSize: `${optionFontSize}px` }}>{option}</span>
              </div>
            );
          })}
        </div>

        {/* Explanation Alert when revealed */}
        {isAnswerRevealed && (
          <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-500/40 text-emerald-200 text-sm animate-fade-in flex items-start gap-3">
            <span className="text-emerald-400 font-bold font-mono uppercase text-xs px-2 py-0.5 bg-emerald-950 rounded border border-emerald-500/50">
              Giải thích
            </span>
            <p className="text-slate-300" style={{ fontSize: `${Math.max(14, Math.round(baseSize * 0.6))}px` }}>{explanation}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 relative z-10">
        <span>Tương tác kiểm tra kiến thức video STEM</span>
        <span className="font-mono">Adaptive Assessment Engine</span>
      </div>
    </div>
  );
};
