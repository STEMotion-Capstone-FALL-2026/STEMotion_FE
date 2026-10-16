import type { STEMScript } from '../types/stem';

/**
 * The content lifecycle of the proposal: Draft → Script Review → Approved →
 * In Production → Clip Review → Published. Mirrors ClipProject.getPipelineStatus
 * in STEMotion_BE so the board and the status history agree.
 */
export type PipelineStage = 'DRAFT' | 'SCRIPT_REVIEW' | 'APPROVED' | 'IN_PRODUCTION' | 'CLIP_REVIEW' | 'PUBLISHED';

export const PIPELINE_STAGES: { id: PipelineStage; label: string; owner: string }[] = [
  { id: 'DRAFT', label: 'Bản nháp', owner: 'Writer' },
  { id: 'SCRIPT_REVIEW', label: 'Duyệt kịch bản', owner: 'Reviewer' },
  { id: 'APPROVED', label: 'Đã duyệt', owner: 'Producer' },
  { id: 'IN_PRODUCTION', label: 'Đang sản xuất', owner: 'Producer' },
  { id: 'CLIP_REVIEW', label: 'Duyệt clip', owner: 'Reviewer' },
  { id: 'PUBLISHED', label: 'Đã xuất bản', owner: '—' },
];

type StatusPair = Pick<STEMScript, 'scriptStatus' | 'videoStatus'>;

export const pipelineStage = ({ scriptStatus, videoStatus }: StatusPair): PipelineStage => {
  if (scriptStatus === 'IN_REVIEW') return 'SCRIPT_REVIEW';
  if (scriptStatus !== 'APPROVED') return 'DRAFT';
  switch (videoStatus) {
    case 'RENDERING':
      return 'IN_PRODUCTION';
    case 'IN_QA':
    case 'APPROVED':
      return 'CLIP_REVIEW';
    case 'PUBLISHED':
      return 'PUBLISHED';
    default:
      return 'APPROVED';
  }
};

export const stageIndex = (stage: PipelineStage) => PIPELINE_STAGES.findIndex((s) => s.id === stage);
