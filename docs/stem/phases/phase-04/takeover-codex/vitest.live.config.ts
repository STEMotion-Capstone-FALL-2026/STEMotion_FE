import {defineConfig} from 'vitest/config';
import base from '../../../../../vite.config.ts';
import path from 'node:path';
export default defineConfig({...base,cacheDir:path.resolve(import.meta.dirname,'cache/live'),test:{environment:'jsdom',globals:true,cache:false,fsModuleCache:false,include:['src/**/*.p4-live.test.tsx'],maxWorkers:1,fileParallelism:false,reporters:['default','json'],outputFile:{json:path.resolve(import.meta.dirname,'integration-results.json')}}});
