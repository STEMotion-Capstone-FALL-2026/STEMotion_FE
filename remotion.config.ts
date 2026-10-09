import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind';

Config.overrideWebpackConfig((currentConfiguration) => {
  return enableTailwind(currentConfiguration);
});

// Flat graphics need lossless frames and a low CRF to stay sharp; the render
// service (STEMotion_RENDER/src/config.ts) uses the same settings.
Config.setVideoImageFormat('png');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
