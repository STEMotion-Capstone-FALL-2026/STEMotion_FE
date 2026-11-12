import {defineConfig} from 'vite';
import base from '../../../../../vite.config.ts';
import path from 'node:path';
export default defineConfig({...base,cacheDir:path.resolve(import.meta.dirname,'cache/build'),build:{outDir:path.resolve(import.meta.dirname,'build'),emptyOutDir:false}});
