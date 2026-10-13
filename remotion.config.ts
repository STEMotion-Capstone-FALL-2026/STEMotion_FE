import path from 'node:path';
import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind';

// Studio and CLI renders resolve "@/..." like Vite and the render service do.
Config.overrideWebpackConfig((currentConfiguration) => {
  const withTailwind = enableTailwind(currentConfiguration);
  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: { ...withTailwind.resolve?.alias, '@': path.resolve(process.cwd(), 'src') },
    },
  };
});

// Flat graphics need lossless frames and a low CRF to stay sharp; the render
// service (STEMotion_RENDER/src/config.ts) uses the same settings.
Config.setVideoImageFormat('png');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
