import React, { useMemo } from 'react';
import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { ACCENTS, FlatAmbience, FlatDetail, mix, paletteFor } from './theme';
import { useDrift } from './motion';

/**
 * Backdrop for flat scenes. By default it is what an explainer frame mostly
 * is: one colour field, a soft vignette and a few specks, so the subject owns
 * the frame. `detail="rich"` adds drifting shapes and a near layer that moves
 * faster than the specks, which reads as parallax.
 */

const W = 1920;
const H = 1080;

const Specks: React.FC<{ ambience: FlatAmbience; count: number }> = ({ ambience, count }) => {
  const frame = useCurrentFrame();
  const palette = paletteFor(ambience);
  const rises = ambience === 'ocean' || ambience === 'cell' || ambience === 'sky';

  const specks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: random(`speck-x-${ambience}-${i}`) * W,
        y: random(`speck-y-${ambience}-${i}`) * H,
        r: 1.2 + random(`speck-r-${ambience}-${i}`) * (rises ? 4 : 2.4),
        phase: random(`speck-p-${ambience}-${i}`) * Math.PI * 2,
        speed: 0.25 + random(`speck-s-${ambience}-${i}`) * 0.7,
      })),
    [ambience, count, rises]
  );

  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      {specks.map((s, i) => {
        const y = rises ? ((s.y - frame * s.speed) % H + H) % H : s.y;
        const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame * 0.06 * s.speed + s.phase));
        return (
          <circle
            key={i}
            cx={s.x}
            cy={y}
            r={s.r}
            fill={palette.speck}
            opacity={(palette.light ? 0.7 : 1) * (rises ? 0.45 : twinkle)}
          />
        );
      })}
    </svg>
  );
};

const Blob: React.FC<{ seed: string; color: string; x: number; y: number; size: number; light: boolean }> = ({
  seed,
  color,
  x,
  y,
  size,
  light,
}) => {
  const d = useDrift(seed, 60, 0.006);
  return (
    <div
      style={{
        position: 'absolute',
        left: x + d.x - size / 2,
        top: y + d.y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        opacity: light ? 0.45 : 0.28,
        filter: 'blur(90px)',
      }}
    />
  );
};

/** Large, low-contrast rings in the field's own colour: depth without clutter. */
const DepthRings: React.FC<{ ambience: FlatAmbience }> = ({ ambience }) => {
  const palette = paletteFor(ambience);
  const d = useDrift(`rings-${ambience}`, 18, 0.004);
  const ring = mix(palette.sky[0], palette.light ? '#ffffff' : palette.sky[2], 0.35);
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, transform: `translate(${d.x}px, ${d.y}px)` }}>
      {[520, 760, 1020].map((r, i) => (
        <circle key={r} cx={960} cy={640} r={r} fill="none" stroke={ring} strokeWidth={90 - i * 20} opacity={0.22 - i * 0.05} />
      ))}
    </svg>
  );
};

/** Four-point sparkles in the accent colours, twinkling at their own pace. */
const Sparkles: React.FC<{ ambience: FlatAmbience; count: number }> = ({ ambience, count }) => {
  const frame = useCurrentFrame();
  const sparks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: 80 + random(`spark-x-${ambience}-${i}`) * (W - 160),
        y: 60 + random(`spark-y-${ambience}-${i}`) * (H - 120),
        r: 7 + random(`spark-r-${ambience}-${i}`) * 11,
        phase: random(`spark-p-${ambience}-${i}`) * Math.PI * 2,
        color: ACCENTS[i % ACCENTS.length],
      })),
    [ambience, count]
  );
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      {sparks.map((s, i) => {
        const k = 0.5 + 0.5 * Math.sin(frame * 0.08 + s.phase);
        const r = s.r * (0.55 + 0.45 * k);
        const path = `M ${s.x} ${s.y - r} Q ${s.x} ${s.y} ${s.x + r} ${s.y} Q ${s.x} ${s.y} ${s.x} ${s.y + r} Q ${s.x} ${s.y} ${s.x - r} ${s.y} Q ${s.x} ${s.y} ${s.x} ${s.y - r} Z`;
        return <path key={i} d={path} fill={s.color} opacity={0.35 + 0.6 * k} />;
      })}
    </svg>
  );
};

/** Shapes that sit at the frame edges and move faster than the specks. */
const NearLayer: React.FC<{ ambience: FlatAmbience }> = ({ ambience }) => {
  const frame = useCurrentFrame();
  const d = useDrift(`near-${ambience}`, 22, 0.008);
  const palette = paletteFor(ambience);
  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translate(${d.x}px, ${d.y}px)`,
  };

  if (ambience === 'space') {
    return (
      <svg width={W} height={H} style={style}>
        <g transform={`translate(1800 1010) rotate(${-18 + frame * 0.02})`}>
          <circle r={230} fill={palette.blobs[0]} opacity={0.9} />
          <circle r={230} fill="#000" opacity={0.18} transform="translate(55 36)" />
          <ellipse rx={380} ry={62} fill="none" stroke={palette.blobs[1]} strokeWidth={22} opacity={0.75} />
        </g>
        <circle cx={240} cy={170} r={46} fill={palette.blobs[2]} opacity={0.85} />
      </svg>
    );
  }

  if (ambience === 'cell') {
    return (
      <svg width={W} height={H} style={style}>
        {[
          { x: 90, y: 960, r: 230, c: palette.blobs[0] },
          { x: 1840, y: 120, r: 190, c: palette.blobs[1] },
        ].map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r={m.r} fill={m.c} opacity={0.18} />
            <circle cx={m.x} cy={m.y} r={m.r} fill="none" stroke={m.c} strokeWidth={12} opacity={0.5} />
          </g>
        ))}
      </svg>
    );
  }

  if (ambience === 'ocean') {
    return (
      <div style={{ ...style, transform: `translate(${d.x}px, 0)` }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: -200,
              left: 300 + i * 380,
              width: 140 + i * 30,
              height: 1500,
              background: `linear-gradient(to bottom, ${palette.speck}55, transparent 70%)`,
              transform: `rotate(${18 + Math.sin(frame * 0.01 + i) * 3}deg)`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    );
  }

  // lab, lilac, sky: a few rounded hexagon outlines in the corners
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const a = (Math.PI / 3) * k + Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
  return (
    <svg width={W} height={H} style={style}>
      {[
        [150, 210], [230, 256], [150, 302], [1770, 820], [1690, 866], [1770, 912],
      ].map(([x, y], i) => (
        <polygon
          key={i}
          points={hex(x, y, 52)}
          fill="none"
          stroke={palette.blobs[i % 3]}
          strokeWidth={6}
          strokeLinejoin="round"
          opacity={palette.light ? 0.7 : 0.45}
        />
      ))}
    </svg>
  );
};

export const Backdrop: React.FC<{ ambience: FlatAmbience; detail?: FlatDetail }> = ({
  ambience,
  detail = 'minimal',
}) => {
  const palette = paletteFor(ambience);
  const rich = detail === 'rich';
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 45%, ${palette.sky[0]} 0%, ${palette.sky[1]} 60%, ${palette.sky[2]} 100%)`,
        overflow: 'hidden',
      }}
    >
      <DepthRings ambience={ambience} />
      <Specks ambience={ambience} count={rich ? 120 : ambience === 'space' ? 80 : 36} />
      <Sparkles ambience={ambience} count={rich ? 18 : 10} />
      {rich ? (
        <>
          <Blob seed={`${ambience}-a`} color={palette.blobs[0]} x={420} y={300} size={620} light={palette.light} />
          <Blob seed={`${ambience}-b`} color={palette.blobs[1]} x={1500} y={720} size={560} light={palette.light} />
          <NearLayer ambience={ambience} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
