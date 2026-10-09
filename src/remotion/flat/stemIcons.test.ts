import { describe, expect, it } from 'vitest';
import { FALLBACK_ICON, STEM_ICONS, STEM_ICON_NAMES, isKnownStemIcon, resolveStemIcon } from './stemIcons';
import { FLAT_DEMO_SCENES } from '../../lib/flatDemo';

describe('STEM icon set', () => {
  it('has unique, kebab-case names', () => {
    expect(new Set(STEM_ICON_NAMES).size).toBe(STEM_ICON_NAMES.length);
    for (const name of STEM_ICON_NAMES) {
      expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('binds every name to a real Phosphor component and a Vietnamese label', () => {
    for (const entry of STEM_ICONS) {
      expect(entry.Icon, entry.name).toBeTruthy();
      expect(entry.label.trim().length, entry.name).toBeGreaterThan(0);
    }
  });

  it('resolves names case-insensitively and ignores surrounding spaces', () => {
    expect(resolveStemIcon(' Atom ').name).toBe('atom');
    expect(isKnownStemIcon('DNA')).toBe(true);
  });

  it('falls back to the question icon for unknown or missing names', () => {
    expect(resolveStemIcon('not-an-icon')).toBe(FALLBACK_ICON);
    expect(resolveStemIcon(undefined)).toBe(FALLBACK_ICON);
    expect(FALLBACK_ICON.name).toBe('question');
  });

  it('only uses known icons in the flat-explainer demo', () => {
    for (const scene of FLAT_DEMO_SCENES) {
      for (const icon of scene.icons) {
        expect(isKnownStemIcon(icon.name), `${scene.id}: ${icon.name}`).toBe(true);
      }
    }
  });
});
