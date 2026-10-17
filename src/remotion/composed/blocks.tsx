import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import type { ComposedBlock, ComposedMotion, ComposedTone } from '@/types/stem';
import { renderLatexToString } from '@/utils/latex';
import { LabelTag, StemIcon } from '../flat/StemIcon';
import { useDrift } from '../flat/motion';
import { FLAT_FONT, AmbiencePalette, shade } from '../flat/theme';
import { Mascot } from '../director/assets/general';
import { Rect, Timed, fitFont } from './layout';
import { LegoBlock } from '../lego/LegoBlock';

/**
 * The building blocks of a composed scene. Each block draws itself inside
 * the rectangle the layout gave it and animates from its own cue frames, so
 * blocks can be combined in any frame and any order.
 */

export interface BlockContext {
  palette: AmbiencePalette;
  accent: (i: number) => string;
  /** Mid tone of the backdrop, used for icon tiles. */
  tone: string;
}

const GOOD = '#5cf2a8';
const BAD = '#ff5c7a';

export const toneColor = (tone: ComposedTone | undefined, ctx: BlockContext): string =>
  tone === 'good' ? GOOD : tone === 'bad' ? BAD : tone === 'accent' ? ctx.accent(0) : ctx.palette.text;

const DEFAULT_MOTION: Record<ComposedBlock['kind'], ComposedMotion> = {
  title: 'rise',
  text: 'rise',
  list: 'rise',
  formula: 'draw',
  icon: 'pop',
  icons: 'pop',
  number: 'count',
  chart: 'draw',
  choice: 'rise',
  guide: 'slide',
  arrow: 'draw',
  highlight: 'draw',
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0 while a block stays, rising to 1 over the ten frames after its exit cue. */
const exitProgress = (frame: number, leave: number) =>
  Number.isFinite(leave) ? interpolate(frame, [leave, leave + 10], [0, 1], clamp) : 0;

/** 0 before the block's cue, springing to 1 after it. */
const useEnter = (enter: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - enter, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
};

/** Positions a block, runs its entrance, exit, emphasis and strike-through. */
const Shell: React.FC<{ t: Timed; rect: Rect; children: React.ReactNode }> = ({ t, rect, children }) => {
  const frame = useCurrentFrame();
  const p = useEnter(t.enter);
  const motion = t.block.motion ?? DEFAULT_MOTION[t.block.kind];
  const out = exitProgress(frame, t.leave);
  const drift = useDrift(`blk-${t.block.id}`, 8, 0.02);
  if (t.block.hidden) return null;
  if (frame < t.enter - 1 || out >= 1) return null;

  let transform = '';
  let opacity = interpolate(p, [0, 0.35], [0, 1], clamp);
  if (motion === 'pop') transform = `scale(${0.4 + 0.6 * p})`;
  else if (motion === 'rise') transform = `translateY(${(1 - p) * 46}px)`;
  else if (motion === 'slide') transform = `translateX(${(1 - p) * (rect.x > 900 ? 120 : -120)}px)`;
  else opacity = Math.min(1, opacity * 1.5);

  const since = frame - t.enter;
  if (t.block.emphasis === 'pulse') transform += ` scale(${1 + 0.035 * Math.sin(since * 0.15)})`;
  if (t.block.emphasis === 'float') transform += ` translate(${drift.x}px, ${drift.y}px)`;
  if (t.block.emphasis === 'shake' && since > 14 && since < 34) transform += ` translateX(${Math.sin(since * 1.9) * 9}px)`;
  const userScale = typeof t.block.scale === 'number' && Number.isFinite(t.block.scale) ? t.block.scale : 1;

  const struck = t.strike !== null ? interpolate(frame, [t.strike, t.strike + 12], [0, 1], clamp) : 0;
  return (
    <div
      data-lego-id={t.block.id}
      data-lego-kind={t.block.kind}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `${transform} scale(${(1 - 0.08 * out) * userScale})`,
        opacity: opacity * (1 - out) * (1 - 0.45 * struck),
        fontFamily: FLAT_FONT,
      }}
    >
      {/* The wrapper hugs the content, so a strike-through spans the words, not the slot. */}
      <div style={{ position: 'relative', display: 'inline-flex', maxWidth: '100%', maxHeight: '100%' }}>
        {children}
        {struck > 0 ? (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: '-4% -3%', width: '106%', height: '108%', overflow: 'visible' }}
          >
            <line
              x1={0}
              y1={62}
              x2={100 * struck}
              y2={62 - 24 * struck}
              stroke={BAD}
              strokeWidth={12}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}
      </div>
    </div>
  );
};

/** A soft panel behind text-heavy blocks so they read on any backdrop. */
const panel = (ctx: BlockContext): React.CSSProperties => ({
  background: ctx.palette.light ? 'rgba(255,255,255,0.55)' : 'rgba(20,4,58,0.45)',
  borderRadius: 28,
  padding: '18px 28px',
  boxShadow: '0 10px 0 rgba(0,0,0,0.12)',
});

const shadow = (ctx: BlockContext) => (ctx.palette.light ? '0 3px 0 rgba(42,27,94,0.12)' : '0 5px 0 rgba(0,0,0,0.25)');

const Title: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const text = t.block.text ?? '';
  const size = t.block.fontSize || fitFont(text, rect.w * 0.96, rect.h * 0.92, 92, 30, 1.1);
  return (
    <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.1, textAlign: 'center', color: toneColor(t.block.tone, ctx), textShadow: shadow(ctx) }}>
      {text}
    </div>
  );
};

const Text: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const frame = useCurrentFrame();
  const text = t.block.text ?? '';
  const size = t.block.fontSize || fitFont(text, rect.w * 0.9, rect.h * 0.85, 52, 22, 1.3);
  const typed = t.block.motion === 'type' ? Math.floor(interpolate(frame, [t.enter, t.enter + text.length * 0.9], [0, text.length], clamp)) : text.length;
  const color = t.block.tone && t.block.tone !== 'default' ? toneColor(t.block.tone, ctx) : ctx.palette.textSoft;
  // Right and wrong statements sit on a panel so red and green stay legible on any backdrop.
  const marked = t.block.tone === 'good' || t.block.tone === 'bad';
  return (
    <div
      style={{
        ...(marked ? { ...panel(ctx), background: 'rgba(14,4,40,0.62)', border: `3px solid ${color}` } : {}),
        fontSize: size,
        fontWeight: marked ? 700 : 600,
        lineHeight: 1.3,
        textAlign: 'center',
        color,
        textShadow: marked ? 'none' : shadow(ctx),
      }}
    >
      {text.slice(0, typed)}
      <span style={{ opacity: 0 }}>{text.slice(typed)}</span>
    </div>
  );
};

const List: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const frame = useCurrentFrame();
  const items = (t.block.items ?? []).slice(0, 6);
  const span = Math.min(Number.isFinite(t.leave) ? t.leave - t.enter - 20 : 999, 34 * items.length);
  const longest = items.reduce((a, b) => (b.length > a.length ? b : a), '');
  const size = t.block.fontSize || Math.min(fitFont(longest, rect.w * 0.78, (rect.h * 0.82) / Math.max(1, items.length), 46, 20, 1.25), 46);
  return (
    <div style={{ ...panel(ctx), display: 'flex', flexDirection: 'column', gap: size * 0.45, maxWidth: rect.w }}>
      {items.map((item, i) => {
        const at = t.enter + (span * i) / Math.max(1, items.length);
        const k = interpolate(frame, [at, at + 12], [0, 1], clamp);
        return (
          <LegoBlock
            key={i}
            id={`${t.block.id}__item-${i}`}
            label={`Mục #${i + 1}: ${item.slice(0, 24)}`}
            kind="step"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.5, opacity: k, transform: `translateX(${(1 - k) * -30}px)` }}>
              <div style={{ width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: `var(--lego-accent-solid, ${ctx.accent(i)})`, flexShrink: 0 }} />
              <div style={{ fontSize: `var(--lego-font-size, ${size}px)`, fontWeight: 700, color: `var(--lego-accent-solid, ${ctx.palette.text})`, lineHeight: 1.25 }}>{item}</div>
            </div>
          </LegoBlock>
        );
      })}
    </div>
  );
};

const Formula: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const frame = useCurrentFrame();
  const latex = t.block.latex ?? '';
  // Rendered TeX is far narrower per source character than prose.
  const size = t.block.fontSize || Math.min(fitFont(latex.replace(/\\[a-z]+/gi, 'x'), rect.w * 0.85, rect.h * 0.7, 80, 26, 1.6), 80);
  const reveal = (t.block.motion ?? 'draw') === 'draw' ? interpolate(frame, [t.enter, t.enter + 26], [0, 100], clamp) : 100;
  const color = t.block.tone && t.block.tone !== 'default' ? toneColor(t.block.tone, ctx) : ctx.palette.text;
  return (
    <div style={{ ...panel(ctx), clipPath: `inset(0 ${100 - reveal}% 0 0 round 28px)` }}>
      <div style={{ fontSize: size, color }} dangerouslySetInnerHTML={renderLatexToString(latex)} />
    </div>
  );
};

const Icon: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const icon = t.block.icon ?? { name: 'sparkle' };
  const size = Math.max(70, Math.min(rect.h * 0.52, rect.w * 0.5, 230));
  return (
    <StemIcon
      name={icon.name}
      label={icon.label}
      color={t.block.tone && t.block.tone !== 'default' ? toneColor(t.block.tone, ctx) : ctx.accent(0)}
      size={size}
      delay={t.enter}
      labelSize={t.block.fontSize || Math.max(20, size * 0.16)}
      tone={ctx.tone}
      hero={t.block.emphasis === 'pulse'}
    />
  );
};

const Icons: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const icons = (t.block.icons ?? []).slice(0, 6);
  const n = Math.max(1, icons.length);
  const size = Math.max(60, Math.min(rect.h * 0.5, (rect.w / n) * 0.55, 170));
  return (
    <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-end', width: '100%' }}>
      {icons.map((ic, i) => (
        <LegoBlock
          key={`${ic.name}-${i}`}
          id={`${t.block.id}__icon-${i}`}
          label={`Khối Minh họa #${i + 1}: ${ic.label || ic.name}`}
          kind="diagram"
        >
          <StemIcon
            name={ic.name}
            label={ic.label}
            color={ctx.accent(i)}
            size={size}
            delay={t.enter + i * 7}
            labelSize={t.block.fontSize || Math.max(18, size * 0.17)}
            tone={ctx.tone}
          />
        </LegoBlock>
      ))}
    </div>
  );
};

const NumberBlock: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const frame = useCurrentFrame();
  const value = t.block.value ?? 0;
  const counting = (t.block.motion ?? 'count') === 'count';
  const k = counting ? interpolate(frame, [t.enter, t.enter + 40], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) }) : 1;
  const decimals = Number.isInteger(value) ? 0 : Math.min(3, String(value).split('.')[1]?.length ?? 1);
  const shown = (value * k).toLocaleString('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const label = t.block.text;
  const size = t.block.fontSize ? t.block.fontSize * 1.8 : fitFont(`${shown} ${t.block.unit ?? ''}`, rect.w * 0.9, rect.h * (label ? 0.6 : 0.85), 150, 36, 1.05);
  const color = t.block.tone && t.block.tone !== 'default' ? toneColor(t.block.tone, ctx) : ctx.accent(0);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.05, color, textShadow: shadow(ctx) }}>
        {shown}
        {t.block.unit ? <span style={{ fontSize: size * 0.45, marginLeft: size * 0.12 }}>{t.block.unit}</span> : null}
      </div>
      {label ? (
        <div style={{ fontSize: Math.max(22, size * 0.28), fontWeight: 700, color: ctx.palette.textSoft, marginTop: 8 }}>{label}</div>
      ) : null}
    </div>
  );
};

const Chart: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const points = (t.block.points ?? []).slice(0, 8);
  const max = Math.max(1e-9, ...points.map((p) => Math.abs(p.value)));
  const w = rect.w * 0.9;
  const h = rect.h * 0.9;
  const labelH = Math.min(46, h * 0.14);
  const plotH = h - labelH * 2.2;
  const slot = w / Math.max(1, points.length);
  const bar = slot * 0.58;
  const font = t.block.fontSize || Math.max(16, Math.min(30, slot * 0.2, labelH * 0.7));
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <line x1={0} y1={labelH + plotH} x2={w} y2={labelH + plotH} stroke={ctx.palette.textSoft} strokeOpacity={0.5} strokeWidth={4} />
      {points.map((p, i) => {
        const at = t.enter + i * 7;
        const k = spring({ frame: frame - at, fps, config: { damping: 16 } });
        const bh = (Math.abs(p.value) / max) * plotH * k;
        const x = i * slot + (slot - bar) / 2;
        const y = labelH + plotH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bar} height={bh} rx={Math.min(16, bar / 4)} fill={ctx.accent(i)} />
            <text x={x + bar / 2} y={y - 10} textAnchor="middle" fontSize={font} fontWeight={800} fill={ctx.palette.text} opacity={k}>
              {p.value.toLocaleString('vi-VN')}
              {t.block.unit ? ` ${t.block.unit}` : ''}
            </text>
            <text x={x + bar / 2} y={labelH + plotH + labelH} textAnchor="middle" fontSize={font} fontWeight={700} fill={ctx.palette.textSoft}>
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const Choice: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const frame = useCurrentFrame();
  const options = (t.block.options ?? []).slice(0, 4);
  const revealed = t.reveal !== null ? interpolate(frame, [t.reveal, t.reveal + 10], [0, 1], clamp) : 0;
  const rows = options.length + (t.block.question ? 1.3 : 0);
  const longest = [t.block.question ?? '', ...options].reduce((a, b) => (b.length > a.length ? b : a), '');
  const size = t.block.fontSize || Math.min(44, fitFont(longest, rect.w * 0.8, (rect.h * 0.8) / Math.max(1, rows), 44, 20, 1.25));
  return (
    <div style={{ ...panel(ctx), display: 'flex', flexDirection: 'column', gap: size * 0.4, minWidth: rect.w * 0.6, maxWidth: rect.w }}>
      {t.block.question ? (
        <LegoBlock id={`${t.block.id}__question`} label="Câu hỏi trắc nghiệm" kind="quiz">
          <div style={{ fontSize: `var(--lego-font-size, ${Math.round(size * 1.08)}px)`, fontWeight: 800, color: `var(--lego-accent-solid, ${ctx.palette.text})`, marginBottom: size * 0.2 }}>
            {t.block.question}
          </div>
        </LegoBlock>
      ) : null}
      {options.map((o, i) => {
        const correct = i === t.block.answer;
        const at = t.enter + 8 + i * 6;
        const k = interpolate(frame, [at, at + 10], [0, 1], clamp);
        const bg = correct ? `rgba(92,242,168,${0.25 * revealed})` : 'transparent';
        return (
          <LegoBlock
            key={i}
            id={`${t.block.id}__opt-${i}`}
            label={`Phương án ${String.fromCharCode(65 + i)}: ${o.slice(0, 20)}`}
            kind="card"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: size * 0.5,
                padding: `${size * 0.2}px ${size * 0.4}px`,
                borderRadius: size * 0.5,
                border: `3px solid ${correct && revealed > 0 ? GOOD : shade(ctx.accent(i), -0.1)}`,
                background: bg,
                opacity: k * (correct ? 1 : 1 - 0.55 * revealed),
                transform: `scale(${correct ? 1 + 0.05 * revealed : 1})`,
              }}
            >
              <div
                style={{
                  width: size * 1.1,
                  height: size * 1.1,
                  borderRadius: '50%',
                  background: correct && revealed > 0.5 ? GOOD : ctx.accent(i),
                  color: '#24164f',
                  fontWeight: 800,
                  fontSize: size * 0.7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {correct && revealed > 0.5 ? '✓' : String.fromCharCode(65 + i)}
              </div>
              <div style={{ fontSize: `var(--lego-font-size, ${size}px)`, fontWeight: 700, color: `var(--lego-accent-solid, ${ctx.palette.text})` }}>{o}</div>
            </div>
          </LegoBlock>
        );
      })}
    </div>
  );
};

const Guide: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const frame = useCurrentFrame();
  const text = t.block.text;
  const scale = Math.min(rect.h / 420, (text ? rect.w * 0.42 : rect.w) / 380, 1.2);
  const bubble = interpolate(frame, [t.enter + 10, t.enter + 22], [0, 1], clamp);
  const bubbleW = rect.w - 400 * scale;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' }}>
      <LegoBlock id={`${t.block.id}__mascot`} label="Nhân vật Trợ giảng" kind="diagram">
        <svg width={380 * scale} height={420 * scale} viewBox="-190 -200 380 420">
          <Mascot pose={t.block.pose ?? 'idle'} color={ctx.accent(1)} />
        </svg>
      </LegoBlock>
      {text ? (
        <LegoBlock id={`${t.block.id}__speech`} label="Lời thoại Trợ giảng" kind="card">
          <div
            style={{
              ...panel(ctx),
              background: ctx.palette.light ? '#ffffff' : '#fff8e8',
              color: '#2b0a5e',
              fontSize: `var(--lego-font-size, ${t.block.fontSize || fitFont(text, Math.max(200, bubbleW) * 0.85, rect.h * 0.55, 42, 20, 1.25)}px)`,
              fontWeight: 700,
              lineHeight: 1.25,
              maxWidth: Math.max(200, bubbleW),
              opacity: bubble,
              transform: `scale(${0.7 + 0.3 * bubble})`,
              transformOrigin: 'left center',
            }}
          >
            {text}
          </div>
        </LegoBlock>
      ) : null}
    </div>
  );
};

export const SLOTTED_BLOCKS: Record<
  Exclude<ComposedBlock['kind'], 'arrow' | 'highlight'>,
  React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }>
> = {
  title: Title,
  text: Text,
  list: List,
  formula: Formula,
  icon: Icon,
  icons: Icons,
  number: NumberBlock,
  chart: Chart,
  choice: Choice,
  guide: Guide,
};

export const SlottedBlock: React.FC<{ t: Timed; rect: Rect; ctx: BlockContext }> = ({ t, rect, ctx }) => {
  const Component = SLOTTED_BLOCKS[t.block.kind as keyof typeof SLOTTED_BLOCKS];
  if (!Component) return null;
  return (
    <Shell t={t} rect={rect}>
      <Component t={t} rect={rect} ctx={ctx} />
    </Shell>
  );
};

const centre = (rc: Rect) => ({ x: rc.x + rc.w / 2, y: rc.y + rc.h / 2 });

/** Where the line from the centre of `rc` towards (tx, ty) leaves the rectangle, pulled in a little. */
const edgeToward = (rc: Rect, tx: number, ty: number, inset = 0.42) => {
  const c = centre(rc);
  const dx = tx - c.x;
  const dy = ty - c.y;
  const sx = dx === 0 ? Infinity : (rc.w * inset) / Math.abs(dx);
  const sy = dy === 0 ? Infinity : (rc.h * inset) / Math.abs(dy);
  const s = Math.min(sx, sy, 1);
  return { x: c.x + dx * s, y: c.y + dy * s };
};

/** Overlays drawn above the slotted blocks: an arrow between two blocks, or a ring around one. */
export const Overlay: React.FC<{ t: Timed; rects: Map<string, Rect>; ctx: BlockContext }> = ({ t, rects, ctx }) => {
  const frame = useCurrentFrame();
  const out = 1 - exitProgress(frame, t.leave);
  const k = interpolate(frame, [t.enter, t.enter + 22], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 2) });
  if (frame < t.enter || out <= 0) return null;
  const color = t.block.tone && t.block.tone !== 'default' ? toneColor(t.block.tone, ctx) : ctx.accent(0);

  if (t.block.kind === 'highlight') {
    const target = t.block.to ? rects.get(t.block.to) : undefined;
    if (!target) return null;
    // Slots are often much larger than what is drawn in them; ring the centre of the slot instead of its edges.
    const c = centre(target);
    const w = Math.min(target.w + 36, Math.max(target.h * 1.3, 420));
    const h = Math.min(target.h + 36, Math.max(w * 0.62, 200));
    const x = c.x - w / 2;
    const y = c.y - h / 2;
    const rx = Math.min(48, h / 3);
    const path = `M ${x + rx} ${y} H ${x + w - rx} Q ${x + w} ${y} ${x + w} ${y + rx} V ${y + h - rx} Q ${x + w} ${y + h} ${x + w - rx} ${y + h} H ${x + rx} Q ${x} ${y + h} ${x} ${y + h - rx} V ${y + rx} Q ${x} ${y} ${x + rx} ${y} Z`;
    const d = evolvePath(k, path);
    const pulse = 1 + 0.012 * Math.sin((frame - t.enter) * 0.18);
    return (
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: out, transform: `scale(${pulse})`, transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}>
        <path d={path} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray={d.strokeDasharray} strokeDashoffset={d.strokeDashoffset} />
      </svg>
    );
  }

  const from = t.block.from ? rects.get(t.block.from) : undefined;
  const to = t.block.to ? rects.get(t.block.to) : undefined;
  if (!from || !to) return null;
  const ct = centre(to);
  const cf = centre(from);
  const a = edgeToward(from, ct.x, ct.y);
  const b = edgeToward(to, cf.x, cf.y);
  // Bend the arrow sideways so it does not run straight through other text.
  const mx = (a.x + b.x) / 2 - (b.y - a.y) * 0.18;
  const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.18 - 30;
  const path = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
  const d = evolvePath(k, path);
  const angle = (Math.atan2(b.y - my, b.x - mx) * 180) / Math.PI;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: out, overflow: 'visible' }}>
      <path d={path} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeDasharray={d.strokeDasharray} strokeDashoffset={d.strokeDashoffset} />
      {k > 0.95 ? (
        <g transform={`translate(${b.x} ${b.y}) rotate(${angle})`}>
          <path d="M -30 -18 L 0 0 L -30 18" fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
      {t.block.text ? (
        <foreignObject x={mx - 200} y={my - 40} width={400} height={80} opacity={k}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <LabelTag text={t.block.text} color={color} size={26} pointer={false} />
          </div>
        </foreignObject>
      ) : null}
    </svg>
  );
};
