'use client';

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TitleHeroProps } from '@/types/stem';

export const TitleHeroReveal: React.FC<TitleHeroProps> = ({
  title,
  subtitle,
  subject,
  gradeLevel,
  badgeText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const titleOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(frame, [10, 25], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subjectColorMap: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
    Math: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', gradient: 'from-blue-600 to-indigo-600' },
    Physics: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', gradient: 'from-purple-600 to-pink-600' },
    Chemistry: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500', gradient: 'from-emerald-600 to-teal-600' },
    Biology: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', gradient: 'from-green-600 to-emerald-600' },
    ComputerScience: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', gradient: 'from-amber-600 to-orange-600' },
  };

  const currentTheme = subjectColorMap[subject] || subjectColorMap.Math;

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-white font-sans p-16 select-none">
      {/* Dynamic Animated Grid Background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#6366f1 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />

      {/* Glowing Orb */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(147,51,234,0.4) 50%, transparent 70%)',
          transform: `scale(${1 + Math.sin(frame / 20) * 0.05})`,
        }}
      />

      {/* Top Badge: Subject & Grade */}
      <div 
        style={{ transform: `scale(${badgeScale})` }}
        className="flex items-center gap-3 px-5 py-2 rounded-full border border-slate-700/80 bg-slate-900/90 backdrop-blur-md mb-8 shadow-2xl"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold tracking-wider uppercase text-slate-300">
          {subject} • {gradeLevel}
        </span>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-medium">
          {badgeText || 'STEMotion Studio'}
        </span>
      </div>

      {/* Main Title with Spring Slide */}
      <h1
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
        className="text-6xl md:text-7xl font-extrabold text-center tracking-tight leading-tight max-w-5xl mb-6"
      >
        <span className={`bg-clip-text text-transparent bg-gradient-to-r ${currentTheme.gradient}`}>
          {title}
        </span>
      </h1>

      {/* Subtitle / Key Concept Hook */}
      <p
        style={{
          opacity: subtitleOpacity,
        }}
        className="text-2xl text-slate-300 text-center max-w-3xl font-light leading-relaxed"
      >
        {subtitle}
      </p>

      {/* Progress line indicator at bottom */}
      <div className="absolute bottom-10 left-16 right-16 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4">
        <span>STEM Video Lesson • Section 01: Hook & Core Idea</span>
        <span className="font-mono">FPS: {fps} • Frame {frame}</span>
      </div>
    </div>
  );
};
