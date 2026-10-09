import React from 'react';
import { noise2D } from '@remotion/noise';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Motion primitives for flat scenes. Nothing in a flat scene ever stands
 * completely still: shapes drift on smooth noise, enter with a springy pop and
 * the whole frame slowly pushes in.
 */

/** Smooth, deterministic wander driven by simplex noise. */
export const useDrift = (seed: string | number, amplitude = 14, speed = 0.012) => {
  const frame = useCurrentFrame();
  return {
    x: noise2D(`${seed}-x`, frame * speed, 0) * amplitude,
    y: noise2D(`${seed}-y`, 0, frame * speed) * amplitude,
    rotate: noise2D(`${seed}-r`, frame * speed * 0.6, 1) * (amplitude / 6),
  };
};

/** Springy entrance: scales up from `from` and fades in after `delay` frames. */
export const usePop = (delay = 0, from = 0.35) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 11, stiffness: 120, mass: 0.8 },
  });
  return {
    progress,
    scale: from + (1 - from) * progress,
    opacity: interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
  };
};

export const PopIn: React.FC<{
  delay?: number;
  from?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, from, style, children }) => {
  const pop = usePop(delay, from);
  return (
    <div style={{ ...style, transform: `scale(${pop.scale})`, opacity: pop.opacity }}>
      {children}
    </div>
  );
};

export const Float: React.FC<{
  seed: string | number;
  amplitude?: number;
  speed?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ seed, amplitude, speed, style, children }) => {
  const d = useDrift(seed, amplitude, speed);
  return (
    <div
      style={{
        ...style,
        transform: `translate(${d.x}px, ${d.y}px) rotate(${d.rotate}deg)`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Slow camera push across the whole scene, the way an explainer keeps the
 * frame alive between beats. `durationInFrames` is the scene's own length.
 */
export const CameraDrift: React.FC<{
  durationInFrames: number;
  zoom?: number;
  pan?: number;
  children: React.ReactNode;
}> = ({ durationInFrames, zoom = 0.06, pan = 24, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const eased = 1 - Math.pow(1 - t, 2);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `scale(${1 + zoom * eased}) translateX(${-pan * eased}px)`,
        transformOrigin: '50% 55%',
      }}
    >
      {children}
    </div>
  );
};
