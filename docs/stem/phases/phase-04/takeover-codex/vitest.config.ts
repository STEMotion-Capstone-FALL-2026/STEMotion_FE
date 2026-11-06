import { defineConfig, mergeConfig } from 'vitest/config';
import base from '../../../../../vite.config.ts';
import path from 'node:path';
export default mergeConfig(base,defineConfig({
 cacheDir:path.resolve(import.meta.dirname,'cache/vite'),
 test:{setupFiles:[path.resolve(import.meta.dirname,'unit-network-guard.ts')],cache:false,fsModuleCache:false,maxWorkers:2,fileParallelism:true,
  exclude:['**/node_modules/**','**/e2e/**','**/*.p4-live.test.tsx'],
  reporters:['default','json'],outputFile:{json:path.resolve(import.meta.dirname,'unit-component-results.json')}}
}));
