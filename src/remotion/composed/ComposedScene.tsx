'use client';

import React, { useMemo } from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ComposedProps } from '@/types/stem';
import { Backdrop } from '../flat/Backdrop';
import { CameraDrift } from '../flat/motion';
import { FLAT_FONT, accentAt, paletteFor } from '../flat/theme';
import { arrivalTransform, useVariation } from '../flat/variation';
import { BlockContext, Overlay, SlottedBlock } from './blocks';
import { OVERLAY_KINDS, layoutBlocks, timeBlocks } from './layout';

/** Blocks beyond this are ignored; the validator rejects them before they get here. */
export const MAX_COMPOSED_BLOCKS = 12;

/**
 * A scene built from blocks rather than a fixed template: the frame divides
 * the screen into slots, each block sits in a slot and enters on a word of
 * the narration. Arrows and highlights are drawn over the blocks they refer to.
 */
export const ComposedScene: React.FC<ComposedProps> = ({
  id,
  frame: screenFrame = 'center',
  ambience = 'space',
  blocks,
  narration = '',
  durationInFrames = 240,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variation = useVariation(id);
  const palette = paletteFor(ambience, variation.hueShift);
  const arrive = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });

  const list = useMemo(() => (Array.isArray(blocks) ? blocks.slice(0, MAX_COMPOSED_BLOCKS) : []), [blocks]);
  const timed = useMemo(() => timeBlocks(list, narration, durationInFrames), [list, narration, durationInFrames]);
  const rects = useMemo(() => layoutBlocks(screenFrame, timed), [screenFrame, timed]);

  const ctx: BlockContext = {
    palette,
    accent: (i) => accentAt(i + variation.accentShift),
    tone: palette.light ? palette.sky[2] : palette.sky[1],
  };

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: FLAT_FONT }}>
      <AbsoluteFill style={{ transform: arrivalTransform(variation.arrival, arrive, 0.08) }}>
        <CameraDrift durationInFrames={durationInFrames} zoom={0.03} pan={10} move={variation.camera}>
          <Backdrop ambience={ambience} seed={variation.backdropSeed || ambience} hueShift={variation.hueShift} />
        </CameraDrift>
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: arrivalTransform(variation.arrival, arrive, 0.06) }}>
        <CameraDrift durationInFrames={durationInFrames} zoom={0.025} pan={0} move={variation.camera}>
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
        </CameraDrift>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
