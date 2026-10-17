import React, { createContext, useContext } from 'react';
import { AbsoluteFill } from 'remotion';
import type { ComposedBlock, LegoComponentLayout, LegoTheme, SceneData } from '../../types/stem';
import { accentAt, paletteFor } from '../flat/theme';
import { OVERLAY_KINDS, layoutBlocks, timeBlocks } from '../composed/layout';
import { BlockContext, Overlay, SlottedBlock } from '../composed/blocks';

interface LegoSceneContextValue {
  scene?: SceneData;
  componentLayouts: Record<string, LegoComponentLayout>;
}

const LegoSceneContext = createContext<LegoSceneContextValue>({
  scene: undefined,
  componentLayouts: {},
});

export const useLegoScene = () => useContext(LegoSceneContext);

export const useLegoLayout = (id: string): LegoComponentLayout | undefined => {
  const { componentLayouts } = useContext(LegoSceneContext);
  return componentLayouts[id];
};

const THEME_ACCENTS: Partial<Record<LegoTheme, { solid: string; border: string; bg: string; text: string; glow: string }>> = {
  cyan: {
    solid: '#06B6D4',
    border: 'rgba(13, 148, 136, 0.55)',
    bg: 'rgba(240, 253, 250, 0.92)',
    text: '#0F766E',
    glow: '0 8px 24px rgba(13, 148, 136, 0.18)',
  },
  purple: {
    solid: '#A855F7',
    border: 'rgba(124, 58, 237, 0.55)',
    bg: 'rgba(245, 243, 255, 0.92)',
    text: '#6D28D9',
    glow: '0 8px 24px rgba(124, 58, 237, 0.18)',
  },
  emerald: {
    solid: '#10B981',
    border: 'rgba(5, 150, 105, 0.55)',
    bg: 'rgba(236, 253, 245, 0.92)',
    text: '#047857',
    glow: '0 8px 24px rgba(5, 150, 105, 0.18)',
  },
  amber: {
    solid: '#F59E0B',
    border: 'rgba(217, 119, 6, 0.55)',
    bg: 'rgba(255, 251, 235, 0.92)',
    text: '#B45309',
    glow: '0 8px 24px rgba(217, 119, 6, 0.18)',
  },
  rose: {
    solid: '#F43F5E',
    border: 'rgba(225, 29, 72, 0.55)',
    bg: 'rgba(255, 241, 242, 0.92)',
    text: '#BE123C',
    glow: '0 8px 24px rgba(225, 29, 72, 0.18)',
  },
  slate: {
    solid: '#64748B',
    border: 'rgba(71, 85, 105, 0.55)',
    bg: 'rgba(248, 250, 252, 0.92)',
    text: '#334155',
    glow: '0 8px 24px rgba(71, 85, 105, 0.18)',
  },
  blue: {
    solid: '#3B82F6',
    border: 'rgba(37, 99, 235, 0.55)',
    bg: 'rgba(239, 246, 255, 0.92)',
    text: '#1D4ED8',
    glow: '0 8px 24px rgba(37, 99, 235, 0.18)',
  },
  dark: {
    solid: '#38BDF8',
    border: 'rgba(56, 189, 248, 0.55)',
    bg: 'rgba(15, 23, 42, 0.92)',
    text: '#F8FAFC',
    glow: '0 8px 24px rgba(15, 23, 42, 0.35)',
  },
};

export interface LegoBlockProps {
  id: string;
  label?: string;
  kind?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  /** Render as inline/span-friendly block or standard div */
  inline?: boolean;
  /** Apply theme box styling directly onto the wrapper when user picks a theme */
  applyThemeBox?: boolean;
}

interface LegoPieceContextValue {
  id?: string;
  layout?: LegoComponentLayout;
  solidColor?: string;
}

const LegoPieceContext = createContext<LegoPieceContextValue>({});

export const useCurrentLegoPiece = () => useContext(LegoPieceContext);

/**
 * Wraps any sub-component in a Remotion scene so it becomes an addressable,
 * draggable, resizable, themeable "Lego piece" on the video canvas.
 */
export const LegoBlock: React.FC<LegoBlockProps> = ({
  id,
  label,
  kind = 'part',
  children,
  style,
  className,
  inline = false,
  applyThemeBox = false,
}) => {
  const layout = useLegoLayout(id);

  if (layout?.hidden) {
    return null;
  }

  const dx = layout?.dx ?? 0;
  const dy = layout?.dy ?? 0;
  const uniformScale = layout?.scale ?? 1;
  const sx = (layout?.scaleX ?? 1) * uniformScale;
  const sy = (layout?.scaleY ?? 1) * uniformScale;
  const hasTransform = dx !== 0 || dy !== 0 || sx !== 1 || sy !== 1;

  const themePalette = layout?.theme ? THEME_ACCENTS[layout.theme] : undefined;

  const existingTransform = style?.transform ? `${style.transform} ` : '';
  const legoTransform = hasTransform
    ? `${existingTransform}translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`
    : style?.transform;

  const mergedStyle: React.CSSProperties & Record<string, string | number | undefined> = {
    ...style,
    position: style?.position ?? 'relative',
    display: inline ? 'inline-block' : style?.display,
    transform: legoTransform,
    transformOrigin: style?.transformOrigin ?? 'center center',
    zIndex: layout?.zIndex ?? style?.zIndex,
    '--lego-font-size': layout?.fontSize ? `${layout.fontSize}px` : undefined,
    '--lego-accent-solid': themePalette?.solid,
    '--lego-accent-border': themePalette?.border,
    '--lego-accent-bg': themePalette?.bg,
    '--lego-accent-text': themePalette?.text,
  };

  if (layout?.fontSize) {
    mergedStyle.fontSize = layout.fontSize;
  }

  if (themePalette && applyThemeBox) {
    mergedStyle.borderColor = themePalette.border;
    mergedStyle.backgroundColor = themePalette.bg;
    mergedStyle.color = themePalette.text;
    mergedStyle.boxShadow = themePalette.glow;
  } else if (themePalette) {
    mergedStyle.filter = 'drop-shadow(0 6px 16px rgba(15, 23, 42, 0.08))';
  }

  return (
    <LegoPieceContext.Provider value={{ id, layout, solidColor: themePalette?.solid }}>
      <div
        data-lego-id={id}
        data-lego-label={label || id}
        data-lego-kind={kind}
        data-lego-theme={layout?.theme}
        className={className}
        style={mergedStyle}
      >
        {children}
      </div>
    </LegoPieceContext.Provider>
  );
};

/**
 * Renders any extra freeform Lego blocks (`scene.extraBlocks`) added by the user
 * on top of a template scene.
 */
export const ExtraLegoBlocksLayer: React.FC<{ scene?: SceneData }> = ({ scene }) => {
  const extraBlocks = scene?.extraBlocks;
  if (!extraBlocks || extraBlocks.length === 0 || !scene) {
    return null;
  }

  const totalFrames = Math.max(1, scene.durationInFrames || 180);
  // Default freeform layout for extra blocks if x/y/w/h are not explicitly set
  const blocksWithDefaultRects: ComposedBlock[] = extraBlocks.map((b, idx) => {
    if (
      typeof b.x === 'number' ||
      typeof b.y === 'number' ||
      typeof b.w === 'number' ||
      typeof b.h === 'number'
    ) {
      return b;
    }
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    return {
      ...b,
      x: 160 + col * 820,
      y: 180 + row * 260,
      w: 760,
      h: 220,
    };
  });

  const timed = timeBlocks(blocksWithDefaultRects, scene.narration || '', totalFrames);
  const rects = layoutBlocks('center', timed);
  const palette = paletteFor('space', 0);
  const ctx: BlockContext = {
    palette,
    accent: (i) => accentAt(i),
    tone: palette.light ? palette.sky[2] : palette.sky[1],
  };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 40 }}>
      {timed
        .filter((t) => !OVERLAY_KINDS.includes(t.block.kind))
        .map((t) => {
          const rect = rects.get(t.block.id);
          return rect ? <SlottedBlock key={t.block.id} t={t} rect={rect} ctx={ctx} /> : null;
        })}
      {timed
        .filter((t) => OVERLAY_KINDS.includes(t.block.kind))
        .map((t) => (
          <Overlay key={t.block.id} t={t} rects={rects} ctx={ctx} />
        ))}
    </AbsoluteFill>
  );
};

export const LegoSceneProvider: React.FC<{
  scene?: SceneData;
  children: React.ReactNode;
}> = ({ scene, children }) => {
  const componentLayouts = scene?.componentLayouts ?? {};

  return (
    <LegoSceneContext.Provider value={{ scene, componentLayouts }}>
      <AbsoluteFill>
        {children}
        {scene?.type !== 'COMPOSED' && <ExtraLegoBlocksLayer scene={scene} />}
      </AbsoluteFill>
    </LegoSceneContext.Provider>
  );
};
