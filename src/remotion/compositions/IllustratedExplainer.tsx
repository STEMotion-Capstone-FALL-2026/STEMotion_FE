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
import { FLAT_FONT, accentAt, glow, paletteFor, shade } from '../flat/theme';
import { arrivalTransform, useVariation } from '../flat/variation';
import { LegoBlock } from '../lego/LegoBlock';

/**
 * Flat-explainer scene. One clear subject on a calm colour field: STEM objects
 * hovering over isometric tiles with coloured label tags, or a swarm of dots
 * settling into one mass. One headline, an optional caption, constant gentle
 * motion and a slow camera push.
 *
 * Every individual icon (`icon-0`, `icon-1`, `icon-2`, ...), `headline`, and
 * `caption` is wrapped in its own `<LegoBlock>` so users can drag, resize,
 * recolor, hide, or edit each STEM object (e.g., Electron, Nguyên tử, Năng lượng)
 * independently.
 */

const MAX_ICONS = 6;
const STAGE_Y = 660;
/** How far the focus subject moves off centre when a scene is composed to one side. */
const STAGE_SHIFT = 200;

type Icons = IllustratedExplainerProps['icons'];
/** Accent for the i-th object, rotated per video (see variation.ts). */
type Accent = (index: number) => string;

/**
 * Satellites sit on two side arcs around the hero. The top of the ring is kept
 * clear for the headline and the bottom for the hero's tile, so nothing ever
 * passes over text; each satellite only sways a few degrees.
 */
export const satelliteAngles = (count: number): number[] => {
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

const FocusLayout: React.FC<{ icons: Icons; tone: string; accent: Accent; mirror: boolean; stage: number }> = ({
  icons,
  tone,
  accent,
  mirror,
  stage,
}) => {
  const frame = useCurrentFrame();
  const cx = 960 + stage * STAGE_SHIFT;
  const [hero, ...satellites] = icons;
  const angles = satelliteAngles(satellites.length);

  return (
    <>
      {satellites.map((ic, i) => {
        const iconIdx = i + 1;
        const sway = Math.sin(frame * 0.02 + i * 1.7) * 5;
        const angle = ((angles[i] + sway) * Math.PI) / 180;
        return (
          <LegoBlock
            key={`icon-${iconIdx}`}
            id={`icon-${iconIdx}`}
            label={`Khối Minh họa #${iconIdx + 1}: ${ic.label || ic.name}`}
            kind="diagram"
            style={at(cx + (mirror ? -1 : 1) * Math.cos(angle) * 590, STAGE_Y + Math.sin(angle) * 265, 2 + iconIdx)}
          >
            <StemIcon
              tone={tone}
              name={ic.name}
              label={ic.label}
              color={accent(iconIdx)}
              size={110}
              delay={18 + i * 6}
              labelSize={24}
            />
          </LegoBlock>
        );
      })}
      <LegoBlock
        id="icon-0"
        label={`Khối Trung tâm #1: ${hero.label || hero.name}`}
        kind="diagram"
        style={at(cx, STAGE_Y, 10)}
      >
        <StemIcon tone={tone} name={hero.name} label={hero.label} color={accent(0)} size={220} delay={6} labelSize={34} hero />
      </LegoBlock>
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
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
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

const RowLayout: React.FC<{ icons: Icons; lineColor: string; tone: string; accent: Accent }> = ({
  icons,
  lineColor,
  tone,
  accent,
}) => {
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
        <LegoBlock
          key={`icon-${i}`}
          id={`icon-${i}`}
          label={`Khối Minh họa #${i + 1}: ${ic.label || ic.name}`}
          kind="diagram"
          style={at(startX + gap * i, STAGE_Y, 2 + i)}
        >
          <StemIcon tone={tone} name={ic.name} label={ic.label} color={accent(i)} size={size} delay={6 + i * 14} labelSize={26} />
        </LegoBlock>
      ))}
    </>
  );
};

const ClusterLayout: React.FC<{ icons: Icons; tone: string; accent: Accent }> = ({ icons, tone, accent }) => {
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
          <LegoBlock
            key={`icon-${i}`}
            id={`icon-${i}`}
            label={`Khối Minh họa #${i + 1}: ${ic.label || ic.name}`}
            kind="diagram"
            style={at(960 + (col - (inRow - 1) / 2) * cellW, STAGE_Y + 20 + (row - (rows - 1) / 2) * cellH, 2 + i)}
          >
            <StemIcon tone={tone} name={ic.name} label={ic.label} color={accent(i)} size={size} delay={6 + i * 7} labelSize={24} />
          </LegoBlock>
        );
      })}
    </>
  );
};

/** A swarm that settles into one mass, its nucleus glowing in the middle. */
const SwarmLayout: React.FC<{ icons: Icons; tone: string; accent: Accent; mirror: boolean }> = ({
  icons,
  tone,
  accent,
  mirror,
}) => {
  const [core, ...others] = icons;
  const cx = others.length > 0 ? (mirror ? 1200 : 720) : 960;
  const cy = STAGE_Y + 20;
  const radius = 250;
  const color = accent(2);
  const { Icon } = resolveStemIcon(core.name);
  const colors = [accent(2), accent(4), accent(3), accent(0), accent(5)];

  return (
    <>
      <Swarm cx={cx} cy={cy} radius={radius} colors={colors} delay={4} seed={`swarm-${core.name}`} />
      <LegoBlock
        id="icon-0"
        label={`Khối Hạt nhân #1: ${core.label || core.name}`}
        kind="diagram"
        style={at(cx, cy, 4)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          {core.label ? (
            <PopIn delay={54} from={0.6}>
              <LabelTag text={core.label} color={color} size={30} />
            </PopIn>
          ) : null}
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
      </LegoBlock>

      {others.slice(0, 3).map((ic, i, list) => {
        const iconIdx = i + 1;
        return (
          <LegoBlock
            key={`icon-${iconIdx}`}
            id={`icon-${iconIdx}`}
            label={`Khối Minh họa #${iconIdx + 1}: ${ic.label || ic.name}`}
            kind="diagram"
            style={at(mirror ? 480 : 1440, cy + (i - (list.length - 1) / 2) * 240, 2 + iconIdx)}
          >
            <StemIcon tone={tone} name={ic.name} label={ic.label} color={accent(i + 3)} size={90} delay={60 + i * 10} labelSize={22} />
          </LegoBlock>
        );
      })}
    </>
  );
};

/** Point on the quadratic curve from a to b through control c, at t (0..1). */
const quad = (a: [number, number], c: [number, number], b: [number, number], t: number): [number, number] => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** A small counter bubble pinned to an object: how many tokens it gave or got. */
const CountBubble: React.FC<{ text: string; color: string; bump: number }> = ({ text, color, bump }) => (
  <div
    style={{
      fontFamily: FLAT_FONT,
      fontWeight: 800,
      fontSize: 34,
      color: '#ffffff',
      background: shade(color, -0.35),
      border: `4px solid ${color}`,
      borderRadius: 999,
      padding: '2px 18px',
      transform: `scale(${1 + 0.25 * bump})`,
      boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
    }}
  >
    {text}
  </div>
);

const TOKEN_FIRST = 36;
// One token in flight at a time, so the two counts never drift more than one apart.
const TOKEN_EVERY = 54;
const TOKEN_TRAVEL = 40;

const ExchangeLayout: React.FC<{ icons: Icons; tone: string; accent: Accent; durationInFrames: number }> = ({
  icons,
  tone,
  accent,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const [giver, receiver = { name: 'target' }, token = { name: 'sparkle' }] = icons;
  const { Icon: TokenIcon } = resolveStemIcon(token.name);
  const tokenColor = accent(2);
  const from: [number, number] = [560, STAGE_Y - 40];
  const to: [number, number] = [1360, STAGE_Y - 40];
  const control: [number, number] = [960, STAGE_Y - 360];
  const arcPath = `M ${from[0]} ${from[1]} Q ${control[0]} ${control[1]} ${to[0]} ${to[1]}`;
  const arc = evolvePath(
    interpolate(frame, [18, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    arcPath
  );

  // Launch times, stopping early enough for the last token to land before the scene ends.
  const lastLaunch = Math.max(TOKEN_FIRST, durationInFrames - TOKEN_TRAVEL - 30);
  const launches: number[] = [];
  for (let t0 = TOKEN_FIRST; t0 <= lastLaunch; t0 += TOKEN_EVERY) launches.push(t0);

  const launched = launches.filter((l) => frame >= l);
  const landed = launches.filter((l) => frame >= l + TOKEN_TRAVEL);
  const since = (events: number[]) => (events.length ? frame - events[events.length - 1] : Infinity);
  const recoil = Math.exp(-since(launched) / 6);
  const catchBump = Math.exp(-since(landed.map((l) => l + TOKEN_TRAVEL)) / 6);

  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <path
          d={arcPath}
          fill="none"
          stroke={tokenColor}
          strokeOpacity={0.45}
          strokeWidth={6}
          strokeDasharray={arc.strokeDasharray}
          strokeDashoffset={arc.strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      <LegoBlock
        id="icon-0"
        label={`Khối Bên cho #1: ${giver.label || giver.name}`}
        kind="diagram"
        style={at(from[0] - 60, STAGE_Y, 3)}
      >
        <div style={{ transform: `translateX(${-18 * recoil}px) scale(${1 - 0.05 * recoil})` }}>
          <StemIcon tone={tone} name={giver.name} label={giver.label} color={accent(0)} size={190} delay={4} labelSize={32} />
        </div>
      </LegoBlock>

      <LegoBlock
        id="icon-1"
        label={`Khối Bên nhận #2: ${receiver.label || receiver.name}`}
        kind="diagram"
        style={at(to[0] + 60, STAGE_Y, 3)}
      >
        <div style={{ transform: `scale(${1 + 0.08 * catchBump})` }}>
          <StemIcon tone={tone} name={receiver.name} label={receiver.label} color={accent(1)} size={190} delay={12} labelSize={32} />
        </div>
      </LegoBlock>

      {launched.length > 0 ? (
        <>
          <div style={at(from[0] - 60, STAGE_Y + 200, 4)}>
            <CountBubble text={`−${launched.length}`} color={accent(0)} bump={recoil} />
          </div>
          <div style={at(to[0] + 60, STAGE_Y + 200, 4)}>
            <CountBubble text={`+${landed.length}`} color={accent(1)} bump={catchBump} />
          </div>
        </>
      ) : null}

      <LegoBlock
        id="icon-2"
        label={`Khối Trao đổi #3: ${token.label || token.name}`}
        kind="badge"
        style={at(control[0], control[1] + 70, 5)}
      >
        <PopIn delay={30} from={0.6}>
          <LabelTag text={token.label || token.name} color={tokenColor} size={28} pointer={false} />
        </PopIn>
      </LegoBlock>

      {launches.map((l) => {
        const t = (frame - l) / TOKEN_TRAVEL;
        if (t < 0 || t > 1.15) return null;
        const [x, y] = quad(from, control, to, easeInOut(Math.min(1, t)));
        const pop = Math.min(1, t * 6);
        const fade = t > 1 ? 1 - (t - 1) / 0.15 : 1;
        return (
          <div
            key={l}
            style={{ ...at(x, y, 5), opacity: fade, transform: `translate(-50%, -50%) scale(${pop})` }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: tokenColor,
                boxShadow: glow(tokenColor, 26),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TokenIcon size={46} weight="fill" color="#ffffff" />
            </div>
          </div>
        );
      })}
    </>
  );
};

/** How many times larger each level is than the next one down. */
const ZOOM_FACTOR = 7;

const ZoomLayout: React.FC<{ icons: Icons; tone: string; accent: Accent; durationInFrames: number }> = ({
  icons,
  tone,
  accent,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const levels = icons.slice(0, 4);
  const n = levels.length;
  const span = Math.max(1, (durationInFrames - 20) / n);
  const local = Math.max(0, frame - 10);
  const index = Math.min(n - 1, Math.floor(local / span));
  const within = (local - index * span) / span;
  // Hold on each level for most of its share of the scene, then dive into the next.
  const p = index >= n - 1 ? n - 1 : index + easeInOut(Math.min(1, Math.max(0, (within - 0.62) / 0.38)));
  const current = Math.round(p);

  return (
    <>
      {levels.map((ic, j) => {
        const r = p - j;
        if (r <= -1 || r >= 1) return null;
        const opacity =
          r < 0
            ? interpolate(r, [-0.85, -0.35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            : interpolate(r, [0.3, 0.7], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div
            key={`zoom-wrap-${j}`}
            style={{
              position: 'absolute',
              inset: 0,
              opacity,
              transform: `scale(${Math.pow(ZOOM_FACTOR, r)})`,
              transformOrigin: `50% ${((STAGE_Y - 20) / 1080) * 100}%`,
              zIndex: 10 - j,
            }}
          >
            <LegoBlock
              id={`icon-${j}`}
              label={`Khối Phóng đại #${j + 1}: ${ic.label || ic.name}`}
              kind="diagram"
              style={at(960, STAGE_Y, 2 + j)}
            >
              <StemIcon
                tone={tone}
                name={ic.name}
                label={ic.label}
                color={accent(j)}
                size={230}
                delay={j === 0 ? 6 : 0}
                labelSize={34}
                hero
              />
            </LegoBlock>
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 56,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          zIndex: 12,
          fontFamily: FLAT_FONT,
        }}
      >
        {levels.map((ic, j) => (
          <React.Fragment key={j}>
            {j > 0 ? <div style={{ fontSize: 34, fontWeight: 800, color: '#ffffffaa' }}>›</div> : null}
            <div style={{ opacity: j === current ? 1 : 0.45, transform: `scale(${j === current ? 1 : 0.85})` }}>
              <LabelTag text={ic.label || ic.name} color={accent(j)} size={28} pointer={false} />
            </div>
          </React.Fragment>
        ))}
      </div>
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
  id,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variation = useVariation(id);
  const accent: Accent = (i) => accentAt(i + variation.accentShift);
  const palette = paletteFor(ambience, variation.hueShift);
  // Tiles sit in the scene's own tone: the mid tone on dark fields, the edge tone on light ones.
  const tone = palette.light ? palette.sky[2] : palette.sky[1];
  // Each scene arrives by pulling back out of a slight zoom instead of a hard cut.
  const arrive = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  const safeIcons: Icons =
    Array.isArray(icons) && icons.length > 0 ? icons.slice(0, MAX_ICONS) : [{ name: 'sparkle', label: 'Khái niệm' }];
  const base = customFontSize || 30;
  const headlineSize = Math.round(base * 2.2);
  // Only the focus layout is composed off centre; the headline sits over the open side.
  const stage = layout === 'focus' ? variation.stage : 0;
  const headlineBox: React.CSSProperties =
    stage === 1
      ? { left: 120, right: 820, textAlign: 'left' }
      : stage === -1
        ? { left: 820, right: 120, textAlign: 'right' }
        : { left: 120, right: 120, textAlign: 'center' };
  const captionSize = Math.round(base * 1.1);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: FLAT_FONT }}>
      {/* The backdrop pushes in less than the stage, which reads as depth. */}
      <AbsoluteFill style={{ transform: arrivalTransform(variation.arrival, arrive, 0.08) }}>
        <CameraDrift durationInFrames={durationInFrames} zoom={0.03} pan={10} move={variation.camera}>
          <Backdrop
            ambience={ambience}
            detail={detail}
            seed={variation.backdropSeed || ambience}
            hueShift={variation.hueShift}
          />
        </CameraDrift>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          transform: arrivalTransform(variation.arrival, arrive, 0.2),
          transformOrigin: `50% ${(STAGE_Y / 1080) * 100}%`,
        }}
      >
        <CameraDrift
          durationInFrames={durationInFrames}
          zoom={layout === 'zoom' ? 0.02 : 0.06}
          pan={layout === 'zoom' ? 0 : 24}
          move={variation.camera}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${cardScale || 1})`,
              transformOrigin: `50% ${(STAGE_Y / 1080) * 100}%`,
            }}
          >
            {layout === 'row' ? (
              <RowLayout icons={safeIcons} lineColor={palette.text} tone={tone} accent={accent} />
            ) : layout === 'cluster' ? (
              <ClusterLayout icons={safeIcons} tone={tone} accent={accent} />
            ) : layout === 'swarm' ? (
              <SwarmLayout icons={safeIcons} tone={tone} accent={accent} mirror={variation.mirror} />
            ) : layout === 'exchange' ? (
              <ExchangeLayout icons={safeIcons} tone={tone} accent={accent} durationInFrames={durationInFrames} />
            ) : layout === 'zoom' ? (
              <ZoomLayout icons={safeIcons} tone={tone} accent={accent} durationInFrames={durationInFrames} />
            ) : (
              <FocusLayout icons={safeIcons} tone={tone} accent={accent} mirror={variation.mirror} stage={stage} />
            )}
          </div>
        </CameraDrift>
      </AbsoluteFill>

      <div style={{ position: 'absolute', top: 64, zIndex: 20, ...headlineBox }}>
        <LegoBlock
          id="headline"
          label="Tiêu đề Minh họa (Headline)"
          kind="title"
        >
          <PopIn delay={2} from={0.7}>
            <div
              style={{
                fontWeight: 800,
                fontSize: `var(--lego-font-size, ${headlineSize}px)`,
                lineHeight: 1.1,
                color: `var(--lego-accent-solid, ${palette.text})`,
                textShadow: palette.light ? '0 4px 0 rgba(42,27,94,0.12)' : '0 6px 0 rgba(0,0,0,0.25)',
              }}
            >
              {headline}
            </div>
          </PopIn>
        </LegoBlock>

        {caption ? (
          <LegoBlock
            id="caption"
            label="Phụ đề Minh họa (Caption)"
            kind="subtitle"
            style={{ marginTop: 12 }}
          >
            <PopIn delay={10} from={0.85}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: `var(--lego-font-size, ${captionSize}px)`,
                  lineHeight: 1.3,
                  color: `var(--lego-accent-solid, ${palette.textSoft})`,
                }}
              >
                {caption}
              </div>
            </PopIn>
          </LegoBlock>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
