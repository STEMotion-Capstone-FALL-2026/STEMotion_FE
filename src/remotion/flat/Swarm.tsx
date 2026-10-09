import React, { useMemo } from 'react';
import { noise2D } from '@remotion/noise';
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { shade } from './theme';

/**
 * A swarm: a few hundred coloured dots fly in from across the frame and settle
 * into one organic mass (a cell, a colony, an electron cloud). Once settled
 * the dots keep jittering, a membrane fades in around them and the whole mass
 * turns slowly.
 */

const W = 1920;
const H = 1080;

export const Swarm: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  colors: string[];
  count?: number;
  delay?: number;
  seed?: string;
}> = ({ cx, cy, radius, colors, count = 260, delay = 0, seed = 'swarm' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /** Edge of the mass at angle `a`, wobbling with noise so it is not a circle. */
  const edge = (a: number, t: number) =>
    radius * (1 + 0.13 * noise2D(`${seed}-edge`, Math.cos(a) * 1.3 + t, Math.sin(a) * 1.3));

  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = random(`${seed}-a-${i}`) * Math.PI * 2;
        const r = Math.sqrt(random(`${seed}-r-${i}`)) * 0.9;
        const fromA = random(`${seed}-fa-${i}`) * Math.PI * 2;
        const fromR = 700 + random(`${seed}-fr-${i}`) * 700;
        return {
          a,
          r,
          fromX: cx + Math.cos(fromA) * fromR,
          fromY: cy + Math.sin(fromA) * fromR,
          size: 4 + random(`${seed}-s-${i}`) * 8,
          color: colors[i % colors.length],
          lag: random(`${seed}-l-${i}`) * 14,
        };
      }),
    [count, seed, cx, cy, colors]
  );

  const turn = frame * 0.0025;
  const t = frame * 0.004;
  const settled = interpolate(frame, [delay + 30, delay + 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const outline = Array.from({ length: 140 }, (_, k) => {
    const a = (k / 140) * Math.PI * 2;
    const r = edge(a, t) * 1.08;
    return `${k === 0 ? 'M' : 'L'} ${cx + Math.cos(a + turn) * r} ${cy + Math.sin(a + turn) * r}`;
  }).join(' ') + ' Z';

  const membrane = colors[0];

  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <path
        d={outline}
        fill={membrane}
        fillOpacity={0.14 * settled}
        stroke={shade(membrane, 0.35)}
        strokeOpacity={0.9 * settled}
        strokeWidth={14}
        strokeLinejoin="round"
      />
      {dots.map((d, i) => {
        const p = spring({
          frame: frame - delay - d.lag,
          fps,
          config: { damping: 16, stiffness: 60, mass: 1 },
        });
        const a = d.a + turn;
        const r = edge(d.a, t) * d.r;
        const jx = noise2D(`${seed}-jx-${i}`, frame * 0.02, 0) * 6;
        const jy = noise2D(`${seed}-jy-${i}`, 0, frame * 0.02) * 6;
        const x = d.fromX + (cx + Math.cos(a) * r + jx - d.fromX) * p;
        const y = d.fromY + (cy + Math.sin(a) * r + jy - d.fromY) * p;
        return <circle key={i} cx={x} cy={y} r={d.size} fill={d.color} opacity={0.35 + 0.65 * Math.min(1, p)} />;
      })}
    </svg>
  );
};
