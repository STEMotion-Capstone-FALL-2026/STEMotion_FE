import { beforeEach, vi } from 'vitest';
beforeEach(()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('TEST_ONLY: unconfigured HTTP is disabled in Unit/Component suites')));});
