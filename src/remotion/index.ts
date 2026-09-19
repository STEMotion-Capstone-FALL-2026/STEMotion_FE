/**
 * Remotion render entry point.
 *
 * The Player in the browser mounts <RemotionRoot> directly, but the headless
 * renderer needs a registered root. STEMotion_RENDER bundles this file, so
 * preview and render use the exact same compositions.
 */
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
