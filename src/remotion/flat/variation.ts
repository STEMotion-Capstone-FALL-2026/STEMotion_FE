import React from 'react';
import { random } from 'remotion';

/**
 * Per-workspace theme and per-scene variation.
 *
 * The proposal sets out to stop "visual style drifting between videos", so the
 * theme (tint, accent order, arrival style) is seeded by the workspace: every
 * clip of one subject department shares it, while departments are told apart.
 * Inside a clip, scenes still get their own camera move and composition side
 * so the frame keeps moving. Everything is deterministic, so a clip looks the
 * same in the Player and in every render.
 */

export type CameraMove = 'push-left' | 'push-right' | 'pull-back' | 'rise';
export type Arrival = 'pull' | 'push' | 'slide';

export interface Variation {
  /** Hue rotation applied to every backdrop of the video, in degrees. */
  hueShift: number;
  /** Rotates the accent palette so objects take different colours per video. */
  accentShift: number;
  /** How each scene arrives. One style per video. */
  arrival: Arrival;
  /** Slow camera move across the scene. */
  camera: CameraMove;
  /** Mirror side-weighted compositions left to right. */
  mirror: boolean;
  /**
   * Where the main subject sits: left third, centre or right third. The
   * headline follows it, so the frame is composed rather than always centred.
   */
  stage: -1 | 0 | 1;
  /** Seed for specks and drifting shapes, so no two scenes share a star field. */
  backdropSeed: string;
}

const CAMERAS: CameraMove[] = ['push-left', 'push-right', 'pull-back', 'rise'];
const ARRIVALS: Arrival[] = ['pull', 'push', 'slide'];
/** Kept within a range where the calibrated palettes stay on-brand. */
const MIN_HUE_SHIFT = 8;
const MAX_HUE_SHIFT = 22;

const pick = <T,>(items: readonly T[], seed: string): T => items[Math.floor(random(seed) * items.length) % items.length];

export const variationFor = (videoSeed: string, sceneSeed: string): Variation => {
  // The demo and template previews have no script id; they keep the reference look.
  if (!videoSeed) {
    return {
      hueShift: 0,
      accentShift: 0,
      arrival: 'pull',
      camera: 'push-left',
      mirror: false,
      stage: 0,
      backdropSeed: sceneSeed,
    };
  }
  return {
    // Never zero, so every real video differs from the reference palette.
    hueShift:
      (random(`hue-sign-${videoSeed}`) < 0.5 ? -1 : 1) *
      Math.round(MIN_HUE_SHIFT + random(`hue-${videoSeed}`) * (MAX_HUE_SHIFT - MIN_HUE_SHIFT)),
    accentShift: 1 + Math.floor(random(`accent-${videoSeed}`) * 5),
    arrival: pick(ARRIVALS, `arrival-${videoSeed}`),
    camera: pick(CAMERAS, `camera-${videoSeed}-${sceneSeed}`),
    mirror: random(`mirror-${videoSeed}-${sceneSeed}`) < 0.5,
    stage: pick([-1, 0, 1] as const, `stage-${videoSeed}-${sceneSeed}`),
    backdropSeed: `${videoSeed}-${sceneSeed}`,
  };
};

/** The video seed (script id), provided once by the full-video composition. */
export const VideoSeedContext = React.createContext('');
/** The scene seed (scene id), provided around each scene by the full-video composition. */
export const SceneSeedContext = React.createContext('');

/** `fallbackSceneSeed` is used when the scene renders outside a full video. */
export const useVariation = (fallbackSceneSeed = ''): Variation => {
  const videoSeed = React.useContext(VideoSeedContext);
  const sceneSeed = React.useContext(SceneSeedContext) || fallbackSceneSeed;
  return React.useMemo(() => variationFor(videoSeed, sceneSeed), [videoSeed, sceneSeed]);
};

/** Camera transform at progress t (0..1) through the scene. */
export const cameraTransform = (move: CameraMove, t: number, zoom: number, pan: number): string => {
  const eased = 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2);
  switch (move) {
    case 'push-right':
      return `scale(${1 + zoom * eased}) translateX(${pan * eased}px)`;
    case 'pull-back':
      return `scale(${1 + zoom * (1 - eased)}) translateX(${-pan * 0.5 * (1 - eased)}px)`;
    case 'rise':
      return `scale(${1 + zoom * 0.6 * eased}) translateY(${-pan * eased}px)`;
    case 'push-left':
    default:
      return `scale(${1 + zoom * eased}) translateX(${-pan * eased}px)`;
  }
};

/** Arrival transform at spring progress p (0..1). */
export const arrivalTransform = (arrival: Arrival, p: number, depth: number): string => {
  switch (arrival) {
    case 'push':
      return `scale(${1 - depth * 0.6 * (1 - p)})`;
    case 'slide':
      return `translateX(${140 * depth * 5 * (1 - p)}px) scale(${1 + depth * 0.3 * (1 - p)})`;
    case 'pull':
    default:
      return `scale(${1 + depth * (1 - p)})`;
  }
};
