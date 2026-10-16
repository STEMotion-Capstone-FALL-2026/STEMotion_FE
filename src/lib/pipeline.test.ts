import { describe, expect, it } from 'vitest';
import { PIPELINE_STAGES, pipelineStage } from './pipeline';

describe('pipelineStage', () => {
  it('follows the six stages of the proposal, like ClipProject.getPipelineStatus', () => {
    expect(PIPELINE_STAGES.map((s) => s.id)).toEqual(['DRAFT', 'SCRIPT_REVIEW', 'APPROVED', 'IN_PRODUCTION', 'CLIP_REVIEW', 'PUBLISHED']);
    expect(pipelineStage({ scriptStatus: 'DRAFT', videoStatus: 'NOT_RENDERED' })).toBe('DRAFT');
    expect(pipelineStage({ scriptStatus: 'CHANGE_REQUESTED', videoStatus: 'NOT_RENDERED' })).toBe('DRAFT');
    expect(pipelineStage({ scriptStatus: 'IN_REVIEW', videoStatus: 'NOT_RENDERED' })).toBe('SCRIPT_REVIEW');
    expect(pipelineStage({ scriptStatus: 'APPROVED', videoStatus: 'NOT_RENDERED' })).toBe('APPROVED');
    expect(pipelineStage({ scriptStatus: 'APPROVED', videoStatus: 'RENDERING' })).toBe('IN_PRODUCTION');
    expect(pipelineStage({ scriptStatus: 'APPROVED', videoStatus: 'IN_QA' })).toBe('CLIP_REVIEW');
    expect(pipelineStage({ scriptStatus: 'APPROVED', videoStatus: 'APPROVED' })).toBe('CLIP_REVIEW');
    expect(pipelineStage({ scriptStatus: 'APPROVED', videoStatus: 'PUBLISHED' })).toBe('PUBLISHED');
  });
});
