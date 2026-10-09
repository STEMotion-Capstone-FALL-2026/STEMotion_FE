'use client';

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { IllustratedExplainerProps } from '@/types/stem';
import { Backdrop } from '../flat/Backdrop';
import { CameraDrift, Float, PopIn } from '../flat/motion';
import { LabelTag, StemIcon } from '../flat/StemIcon';
import { Swarm } from '../flat/Swarm';
import { resolveStemIcon } from '../flat/stemIcons';
import { ACCENTS, FLAT_FONT, accentAt, glow, paletteFor } from '../flat/theme';

/**
 * Flat-explainer scene. One clear subject on a calm colour field: STEM objects
 * hovering over isometric tiles with coloured label tags, or a swarm of dots
 * settling into one mass. One headline, an optional caption, constant gentle
 * motion and a slow camera push.
 */

const MAX_ICONS = 6;
const STAGE_Y = 660;

type Icons = IllustratedExplainerProps['icons'];

/**
 * Satellites sit on two side arcs around the hero. The top of the ring is kept
 * clear for the headline and the bottom for the hero's tile, so nothing ever
 * passes over text; each satellite only sways a few degrees.
 */
const satelliteAngles = (count: number): number[] => {
  const right = Math.ceil(count / 2);
  const left = count - right;
  const spread = (from: number, to: number, n: number) =>
    n === 1 ? [(from + to) / 2] : Array.from({ length: n }, (_, k) => from + ((to - from) * k) / (n - 1));
  const r = spread(-42, 46, right);
  const l = spread(134, 222, left);
  return Array.from({ length: count }, (_, i) => (i % 2 === 0 ? r[Math.floor(i / 2)] : l[Math.floor(i / 2)]));
};

const at = (x: number, y: number, z = 1): React.CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  transform: 'translate(-50%, -50%)',
  zIndex: z,
});

const FocusLayout: React.FC<{ icons: Icons; tone: string }> = ({ icons, tone }) => {
  const frame = useCurrentFrame();
  const [hero, ...satellites] = icons;
  const angles = satelliteAngles(satellites.length);

  return (
    <>
      {satellites.map((ic, i) => {
        const sway = Math.sin(frame * 0.02 + i * 1.7) * 5;
        const angle = ((angles[i] + sway) * Math.PI) / 180;
        return (
          <div key={`${ic.name}-${i}`} style={at(960 + Math.cos(angle) * 590, STAGE_Y + Math.sin(angle) * 265, 2)}>
            <StemIcon tone={tone} name={ic.name} label={ic.label} color={accentAt(i + 1)} size={110} delay={18 + i * 6} labelSize={24} />
          </div>
        );
      })}
      <div style={at(960, STAGE_Y, 3)}>
        <StemIcon tone={tone} name={hero.name} label={hero.label} color={accentAt(0)} size={220} delay={6} labelSize={34} hero />
      </div>
    </>
  );
};

const Connector: React.FC<{ x1: number; x2: number; y: number; delay: number; color: string }> = ({
  x1,
  x2,
  y,
  delay,
  color,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const path = `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - 90} ${x2} ${y}`;
  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, path);
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeOpacity={0.75}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
      {progress > 0.98 ? <circle cx={x2} cy={y} r={10} fill={color} opacity={0.9} /> : null}
    </svg>
  );
};

const RowLayout: React.FC<{ icons: Icons; lineColor: string; tone: string }> = ({ icons, lineColor, tone }) => {
  const n = icons.length;
  const gap = Math.min(380, 1500 / Math.max(1, n));
  const startX = 960 - (gap * (n - 1)) / 2;
  const size = n > 4 ? 120 : 150;
  return (
    <>
      {icons.slice(1).map((_, i) => (
        <Connector
          key={`c-${i}`}
          x1={startX + gap * i + size * 0.7}
          x2={startX + gap * (i + 1) - size * 0.7}
          y={STAGE_Y + 10}
          delay={22 + i * 14}
          color={lineColor}
        />
      ))}
      {icons.map((ic, i) => (
        <div key={`${ic.name}-${i}`} style={at(startX + gap * i, STAGE_Y, 2)}>
          <StemIcon tone={tone} name={ic.name} label={ic.label} color={accentAt(i)} size={size} delay={6 + i * 14} labelSize={26} />
        </div>
      ))}
    </>
  );
};

const ClusterLayout: React.FC<{ icons: Icons; tone: string }> = ({ icons, tone }) => {
  const cols = icons.length <= 4 ? Math.min(icons.length, 2) : 3;
  const rows = Math.ceil(icons.length / cols);
  const cellW = 440;
  const cellH = rows > 1 ? 350 : 0;
  const size = rows > 1 ? 125 : 150;
  return (
    <>
      {icons.map((ic, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const inRow = Math.min(cols, icons.length - row * cols);
        return (
          <div
            key={`${ic.name}-${i}`}
            style={at(960 + (col - (inRow - 1) / 2) * cellW, STAGE_Y + 20 + (row - (rows - 1) / 2) * cellH, 2)}
          >
            <StemIcon tone={tone} name={ic.name} label={ic.label} color={accentAt(i)} size={size} delay={6 + i * 7} labelSize={24} />
          </div>
        );
      })}
    </>
  );
};

/** A swarm that settles into one mass, its nucleus glowing in the middle. */
const SwarmLayout: React.FC<{ icons: Icons; tone: string }> = ({ icons, tone }) => {
  const [core, ...others] = icons;
  const cx = others.length > 0 ? 720 : 960;
  const cy = STAGE_Y + 20;
  const radius = 250;
  const color = accentAt(2);
  const { Icon } = resolveStemIcon(core.name);
  const colors = [ACCENTS[2], ACCENTS[4], ACCENTS[3], ACCENTS[0], ACCENTS[5]];

  return (
    <>
      <Swarm cx={cx} cy={cy} radius={radius} colors={colors} delay={4} seed={`swarm-${core.name}`} />
      <div style={at(cx, cy, 3)}>
        <PopIn delay={46}>
          <Float seed={`core-${core.name}`} amplitude={6}>
            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: color,
                boxShadow: glow(color, 60),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={92} weight="fill" color="#ffffff" />
            </div>
          </Float>
        </PopIn>
      </div>
      {core.label ? (
        <div style={at(cx, cy - radius - 70, 4)}>
          <PopIn delay={54} from={0.6}>
            <LabelTag text={core.label} color={color} size={30} />
          </PopIn>
        </div>
      ) : null}

      {others.slice(0, 3).map((ic, i, list) => (
        <div key={`${ic.name}-${i}`} style={at(1440, cy + (i - (list.length - 1) / 2) * 240, 2)}>
          <StemIcon tone={tone} name={ic.name} label={ic.label} color={accentAt(i + 3)} size={90} delay={60 + i * 10} labelSize={22} />
        </div>
      ))}
    </>
  );
};

export const IllustratedExplainer: React.FC<IllustratedExplainerProps> = ({
  headline = 'Bên trong một tế bào',
  caption,
  ambience = 'space',
  layout = 'focus',
  detail = 'minimal',
  icons,
  durationInFrames = 180,
  customFontSize,
  cardScale,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = paletteFor(ambience);
  // Tiles sit in the scene's own tone: the mid tone on dark fields, the edge tone on light ones.
  const tone = palette.light ? palette.sky[2] : palette.sky[1];
  // Each scene arrives by pulling back out of a slight zoom instead of a hard cut.
  const arrive = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  const safeIcons: Icons =
    Array.isArray(icons) && icons.length > 0 ? icons.slice(0, MAX_ICONS) : [{ name: 'sparkle' }];
  const base = customFontSize || 30;
  const headlineSize = Math.round(base * 2.2);
  const captionSize = Math.round(base * 1.1);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: FLAT_FONT }}>
      {/* The backdrop pushes in less than the stage, which reads as depth. */}
      <AbsoluteFill style={{ transform: `scale(${1.08 - 0.08 * arrive})` }}>
        <CameraDrift durationInFrames={durationInFrames} zoom={0.03} pan={10}>
          <Backdrop ambience={ambience} detail={detail} />
        </CameraDrift>
      </AbsoluteFill>

      <AbsoluteFill style={{ transform: `scale(${1.2 - 0.2 * arrive})`, transformOrigin: `50% ${(STAGE_Y / 1080) * 100}%` }}>
      <CameraDrift durationInFrames={durationInFrames} zoom={0.06} pan={24}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${cardScale || 1})`,
            transformOrigin: `50% ${(STAGE_Y / 1080) * 100}%`,
          }}
        >
          {layout === 'row' ? (
            <RowLayout icons={safeIcons} lineColor={palette.text} tone={tone} />
          ) : layout === 'cluster' ? (
            <ClusterLayout icons={safeIcons} tone={tone} />
          ) : layout === 'swarm' ? (
            <SwarmLayout icons={safeIcons} tone={tone} />
          ) : (
            <FocusLayout icons={safeIcons} tone={tone} />
          )}
        </div>
      </CameraDrift>
      </AbsoluteFill>

      <div style={{ position: 'absolute', top: 64, left: 120, right: 120, textAlign: 'center', zIndex: 20 }}>
        <PopIn delay={2} from={0.7}>
          <div
            style={{
              fontWeight: 800,
              fontSize: headlineSize,
              lineHeight: 1.1,
              color: palette.text,
              textShadow: palette.light ? '0 4px 0 rgba(42,27,94,0.12)' : '0 6px 0 rgba(0,0,0,0.25)',
            }}
          >
            {headline}
          </div>
        </PopIn>
        {caption ? (
          <PopIn delay={10} from={0.85}>
            <div style={{ marginTop: 12, fontWeight: 600, fontSize: captionSize, lineHeight: 1.3, color: palette.textSoft }}>
              {caption}
            </div>
          </PopIn>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
