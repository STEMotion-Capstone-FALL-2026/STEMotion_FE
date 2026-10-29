import type { STEMScript, UserRole } from '../types/stem';

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
  // CHANGE_REQUESTED stays on the writer board (DRAFT), matching ClipProject.getPipelineStatus.
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

export const isChangeRequested = (script: StatusPair) => script.scriptStatus === 'CHANGE_REQUESTED';

/** Dashboard list: each workspace role only sees the work that is theirs to do (admin/writer see all). */
export function canRoleSeeProject(role: UserRole, script: StatusPair): boolean {
  if (role === 'admin' || role === 'writer' || role === 'library') return true;
  const stage = pipelineStage(script);
  if (role === 'producer') {
    return stage === 'APPROVED' || stage === 'IN_PRODUCTION' || stage === 'CLIP_REVIEW' || stage === 'PUBLISHED';
  }
  if (role === 'reviewer') {
    return (
      isChangeRequested(script) ||
      stage === 'SCRIPT_REVIEW' ||
      stage === 'APPROVED' ||
      stage === 'IN_PRODUCTION' ||
      stage === 'CLIP_REVIEW' ||
      stage === 'PUBLISHED'
    );
  }
  return true;
}

/** Opening a project in studio: producer cannot start from a draft; reviewer cannot open an unsubmitted draft. */
export function canRoleOpenProject(role: UserRole, script: StatusPair): { allowed: boolean; message?: string } {
  const stage = pipelineStage(script);
  if (role === 'admin') return { allowed: true };
  if (role === 'producer' && (stage === 'DRAFT' || stage === 'SCRIPT_REVIEW')) {
    return {
      allowed: false,
      message: 'Kịch bản chưa được phê duyệt. Producer chỉ sản xuất khi kịch bản ở trạng thái Approved.',
    };
  }
  if (role === 'reviewer' && stage === 'DRAFT' && !isChangeRequested(script)) {
    return {
      allowed: false,
      message: 'Kịch bản này còn đang là Bản nháp của tác giả, chưa gửi duyệt.',
    };
  }
  return { allowed: true };
}

export const stageIndex = (stage: PipelineStage) => PIPELINE_STAGES.findIndex((s) => s.id === stage);
