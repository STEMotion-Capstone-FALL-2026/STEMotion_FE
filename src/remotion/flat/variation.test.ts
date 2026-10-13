import { describe, expect, it } from 'vitest';
import { arrivalTransform, cameraTransform, variationFor } from './variation';
import { hueRotate, paletteFor } from './theme';

describe('variationFor', () => {
  it('keeps the reference look when there is no video seed', () => {
    const v = variationFor('', 'scene-1');
    expect(v).toMatchObject({ hueShift: 0, accentShift: 0, arrival: 'pull', mirror: false, stage: 0 });
  });

  it('is deterministic for the same ids', () => {
    expect(variationFor('script-a', 'scene-1')).toEqual(variationFor('script-a', 'scene-1'));
  });

  it('always moves a real video away from the reference palette', () => {
    for (let i = 0; i < 50; i++) {
      const v = variationFor(`script-${i}`, 'scene-1');
      expect(Math.abs(v.hueShift)).toBeGreaterThanOrEqual(8);
      expect(Math.abs(v.hueShift)).toBeLessThanOrEqual(22);
      expect(v.accentShift).toBeGreaterThanOrEqual(1);
      expect(v.accentShift).toBeLessThanOrEqual(5);
    }
  });

  it('keeps video-level choices fixed across scenes and varies scene-level ones', () => {
    const scenes = Array.from({ length: 12 }, (_, i) => variationFor('script-x', `scene-${i}`));
    expect(new Set(scenes.map((v) => v.hueShift)).size).toBe(1);
    expect(new Set(scenes.map((v) => v.accentShift)).size).toBe(1);
    expect(new Set(scenes.map((v) => v.arrival)).size).toBe(1);
    expect(new Set(scenes.map((v) => v.camera)).size).toBeGreaterThan(1);
    expect(new Set(scenes.map((v) => v.stage)).size).toBeGreaterThan(1);
  });

  it('spreads different videos over different looks', () => {
    const videos = Array.from({ length: 40 }, (_, i) => variationFor(`video-${i}`, 'scene-1'));
    expect(new Set(videos.map((v) => v.accentShift)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(videos.map((v) => v.arrival)).size).toBe(3);
  });
});

describe('camera and arrival transforms', () => {
  it('starts every camera move at rest except the pull-back', () => {
    expect(cameraTransform('push-left', 0, 0.06, 24)).toBe('scale(1) translateX(0px)');
    expect(cameraTransform('pull-back', 1, 0.06, 24)).toBe('scale(1) translateX(0px)');
  });

  it('settles every arrival at identity', () => {
    for (const a of ['pull', 'push', 'slide'] as const) {
      expect(arrivalTransform(a, 1, 0.2)).toMatch(/scale\(1\)/);
    }
  });
});

describe('hueRotate', () => {
  it('leaves colours unchanged at zero and on a full turn', () => {
    expect(hueRotate('#4b1ba3', 0)).toBe('#4b1ba3');
    expect(hueRotate('#4b1ba3', 360)).toBe('#4b1ba3');
  });

  it('rotates pure red to green at 120 degrees', () => {
    expect(hueRotate('#ff0000', 120)).toBe('#00ff00');
  });

  it('tints the backdrop but not the text colours', () => {
    const base = paletteFor('space');
    const tinted = paletteFor('space', 20);
    expect(tinted.sky).not.toEqual(base.sky);
    expect(tinted.text).toBe(base.text);
  });
});
