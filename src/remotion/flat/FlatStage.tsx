import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Backdrop } from './Backdrop';
import { FLAT_FONT, FlatAmbience, paletteFor } from './theme';
import { arrivalTransform, useVariation } from './variation';
import './flat-stage.css';

/**
 * The shared shell that gives the original templates the flat-explainer look:
 * a saturated backdrop with specks and sparkles, the rounded display font, a
 * short pull-back as the scene arrives, and (through flat-stage.css) the
 * templates' charcoal panels, lines and grey text remapped onto the palette.
 *
 * Templates keep their own layout and props; they only swap their outer
 * `bg-slate-950` frame for this component.
 */
export const FlatStage: React.FC<{
  ambience: FlatAmbience;
  /** Layout and padding classes from the template's former outer frame. */
  className?: string;
  children: React.ReactNode;
}> = ({ ambience, className = '', children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrive = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  const variation = useVariation();
  const palette = paletteFor(ambience, variation.hueShift);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: arrivalTransform(variation.arrival, arrive, 0.06) }}>
        <Backdrop ambience={ambience} seed={variation.backdropSeed || ambience} hueShift={variation.hueShift} />
      </AbsoluteFill>
      <div
        className={`flat-stage relative w-full h-full overflow-hidden select-none ${className}`}
        style={{
          fontFamily: FLAT_FONT,
          color: palette.text,
          transform: arrivalTransform(variation.arrival, arrive, 0.04),
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
