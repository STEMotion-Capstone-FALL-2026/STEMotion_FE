import React from 'react';
import { useCurrentFrame } from 'remotion';
import { FLAT_FONT, mix, shade } from './theme';
import { Float, PopIn } from './motion';
import { resolveStemIcon } from './stemIcons';

/**
 * One STEM object in flat-explainer dress: a solid two-tone shape hovering
 * over an isometric tile, with a coloured label tag above it. The tile pops in
 * first, then the object, then the tag; afterwards the object keeps floating.
 */

/** White type on dark accents, dark type on bright ones. */
const readableOn = (hex: string) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const lum = (0.299 * ((n >> 16) & 0xff) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff)) / 255;
  return lum > 0.62 ? '#24164f' : '#ffffff';
};

export const LabelTag: React.FC<{ text: string; color: string; size?: number; pointer?: boolean }> = ({
  text,
  color,
  size = 26,
  pointer = true,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div
      style={{
        fontFamily: FLAT_FONT,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.15,
        color: readableOn(color),
        background: color,
        padding: `${size * 0.22}px ${size * 0.6}px`,
        borderRadius: size * 0.32,
        boxShadow: `0 ${size * 0.14}px 0 ${shade(color, -0.35)}`,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
    {pointer ? (
      <div
        style={{
          width: 0,
          height: 0,
          marginTop: size * 0.12,
          borderLeft: `${size * 0.3}px solid transparent`,
          borderRight: `${size * 0.3}px solid transparent`,
          borderTop: `${size * 0.32}px solid ${shade(color, -0.35)}`,
        }}
      />
    ) : null}
  </div>
);

/**
 * Isometric hexagon tile. The tile takes the scene's own tone so it sits in
 * the frame; only its rim and the pulsing ring on top carry the accent.
 */
const Pedestal: React.FC<{ width: number; color: string; tone: string; pulse: number }> = ({
  width,
  color,
  tone,
  pulse,
}) => {
  const rx = width / 2;
  const ry = width * 0.25;
  const depth = width * 0.11;
  const pt = (deg: number, dy = 0) => {
    const a = (deg * Math.PI) / 180;
    return `${rx + rx * Math.cos(a)},${ry + ry * Math.sin(a) + dy}`;
  };
  const top = [0, 60, 120, 180, 240, 300].map((d) => pt(d)).join(' ');
  const left = [pt(180), pt(120), pt(120, depth), pt(180, depth)].join(' ');
  const front = [pt(120), pt(60), pt(60, depth), pt(120, depth)].join(' ');
  const right = [pt(60), pt(0), pt(0, depth), pt(60, depth)].join(' ');
  const face = mix(tone, color, 0.22);

  return (
    <svg width={width} height={ry * 2 + depth + 2} style={{ overflow: 'visible', display: 'block' }}>
      <polygon points={left} fill={shade(face, -0.35)} />
      <polygon points={front} fill={shade(face, -0.22)} />
      <polygon points={right} fill={shade(face, -0.5)} />
      <polygon points={top} fill={face} stroke={color} strokeWidth={4} strokeLinejoin="round" />
      <ellipse cx={rx} cy={ry} rx={rx * (0.5 + 0.08 * pulse)} ry={ry * (0.5 + 0.08 * pulse)} fill="none" stroke={color} strokeWidth={3} opacity={0.35 + 0.35 * pulse} />
      <ellipse cx={rx} cy={ry} rx={rx * 0.38} ry={ry * 0.38} fill={color} opacity={0.3} />
    </svg>
  );
};

export const StemIcon: React.FC<{
  name: string;
  color: string;
  size?: number;
  label?: string;
  delay?: number;
  seed?: string | number;
  labelSize?: number;
  /** The hero object gets a glow and breathes; everything else stays flat. */
  hero?: boolean;
  /** The scene's mid background tone, used for the tile. */
  tone?: string;
}> = ({ name, color, size = 160, label, delay = 0, seed = name, labelSize = 26, hero = false, tone = '#2e0a6e' }) => {
  const frame = useCurrentFrame();
  const { Icon } = resolveStemIcon(name);
  const tileWidth = size * (hero ? 1.15 : 1.3);
  const rim = shade(color, 0.65);
  const under = shade(color, -0.45);
  const pulse = 0.5 + 0.5 * Math.sin((frame - delay) * 0.09 + String(seed).length);
  const breathe = hero ? 1 + 0.025 * Math.sin(frame * 0.07) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {label ? (
        <PopIn delay={delay + 10} from={0.6} style={{ marginBottom: size * 0.08 }}>
          <LabelTag text={label} color={color} size={labelSize} />
        </PopIn>
      ) : null}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {hero ? (
          <div
            style={{
              position: 'absolute',
              top: -size * 0.3,
              width: size * 1.6,
              height: size * 1.6,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color}99 0%, ${color}40 35%, transparent 68%)`,
            }}
          />
        ) : null}

        <PopIn delay={delay + 4}>
          <Float seed={seed} amplitude={size * 0.05} speed={0.015}>
            <div
              style={{
                position: 'relative',
                width: size,
                height: size,
                transform: `scale(${breathe})`,
                filter: `drop-shadow(${-size * 0.025}px ${-size * 0.025}px 0 ${rim}) drop-shadow(0 ${size * 0.045}px 0 ${under})`,
              }}
            >
              <Icon size={size} weight="fill" color={color} />
              {/* Light detail lines on top of the solid shape give it inner structure. */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
                <Icon size={size} weight="light" color={shade(color, 0.85)} />
              </div>
            </div>
          </Float>
        </PopIn>

        <PopIn delay={delay} from={0.5} style={{ marginTop: -size * 0.12 }}>
          <Pedestal width={tileWidth} color={color} tone={tone} pulse={pulse} />
        </PopIn>
      </div>
    </div>
  );
};
