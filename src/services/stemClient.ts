import { ApiError, apiClient } from './apiClient';
import type { StemBrief, StemEvidence, StemSaveRequest, StemValidationFinding, WorkspaceStemSettings, WorkspaceStemSettingsWire, SceneData, StemAssessment, StemChangeTarget } from '../types/stem';

export const STEM_CONTEXT_KEYS = ['IN_CLASS_SCREEN', 'GROUP_PRACTICE'] as const;
export const getArtifactStatus = (projectId:string) => apiClient.get<import('../types/stem').StemArtifactStatus>(`/scripts/${projectId}/stem-artifact-status`);
export function artifactExpectation(status:import('../types/stem').StemArtifactStatus):import('../types/stem').StemArtifactExpectation|undefined {
 const {clipId,jobId,snapshotId,inputHash}=status.target;
 return clipId&&jobId&&snapshotId&&inputHash?{clipId,jobId,snapshotId,inputHash}:undefined;
}
export async function hasActiveReviewerSeat(workspaceId:string,userId:string):Promise<boolean> {
 if(!workspaceId||!userId)return false;
 const rows=await apiClient.get<Array<{userId?:string;role?:string;status?:string}>>(`/workspaces/${workspaceId}/members`);
 return Array.isArray(rows)&&rows.some(row=>row.userId===userId&&row.role==='REVIEWER'&&row.status==='ACTIVE');
}
export const emptyStemBrief = (): StemBrief => ({policyVersionId:null,topicVersionId:null,gradeKey:null,subjectKeys:[],outcomeIds:[],scopeOfClip:'',context:{primary:null,secondary:[]},distributionChannels:[],objectives:[],studentTasks:[],contributions:[],steps:[],safetyNotes:'',rawLegacy:null});
export const stemMutationKey = () => `stem_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;

export const stemAssessmentPayload=(a:StemAssessment):StemAssessment=>({
 expectedBriefRevision:a.expectedBriefRevision,expectedScriptRevision:a.expectedScriptRevision,expectedModeRevision:a.expectedModeRevision,
 expectedCompositionRevision:a.expectedCompositionRevision??null,rubricVersionId:a.rubricVersionId??null,idempotencyKey:a.idempotencyKey,
 ...(a.expectedFingerprint !== undefined ? { expectedFingerprint: a.expectedFingerprint } : {}),
 criteria:a.criteria.map(c=>({key:c.key,judgment:c.judgment,rationale:c.rationale,evidenceIds:[...c.evidenceIds]})),
});
export const stemChangePayload=(t:StemChangeTarget):StemChangeTarget=>({expectedVersionId:t.expectedVersionId,expectedScriptRevision:t.expectedScriptRevision,expectedBriefRevision:t.expectedBriefRevision,idempotencyKey:t.idempotencyKey});

/** Explicit wire whitelist: UI state and server-owned response fields never leak into mutations. */
export function stemSavePayload(request: StemSaveRequest): StemSaveRequest {
 const b=request.brief;
 return {schemaVersion:'stem.v1',baseRevision:request.baseRevision,expectedScriptRevision:request.expectedScriptRevision,idempotencyKey:request.idempotencyKey,
  brief:{policyVersionId:b.policyVersionId??null,topicVersionId:b.topicVersionId??null,gradeKey:b.gradeKey??null,subjectKeys:[...b.subjectKeys],outcomeIds:[...b.outcomeIds],scopeOfClip:b.scopeOfClip??null,
   context:{primary:b.context.primary?{key:b.context.primary.key,condition:b.context.primary.condition??null,adaptations:b.context.primary.adaptations??null}:null,secondary:b.context.secondary.map(c=>({key:c.key,condition:c.condition??null,adaptations:c.adaptations??null}))},
   distributionChannels:[...b.distributionChannels],objectives:b.objectives.map(o=>({key:o.key,outcomeId:o.outcomeId??null,learnerAction:o.learnerAction??null,observableEvidence:o.observableEvidence??null})),studentTasks:b.studentTasks.map(t=>({key:t.key,learnerAction:t.learnerAction??null,teacherSupport:t.teacherSupport??null,materials:t.materials??null,safety:t.safety??null,assessmentEvidence:t.assessmentEvidence??null,executionContextKey:t.executionContextKey??null})),
   contributions:b.contributions.map(c=>({component:c.component,explanation:c.explanation??null,objectiveKeys:[...c.objectiveKeys],taskKeys:[...c.taskKeys]})),
   steps:(b.steps??[]).map(s=>({stepKey:s.stepKey,sceneIds:[...(s.sceneIds??[])],activityKey:s.activityKey??null,objectiveKeys:[...(s.objectiveKeys??[])]})),
   safetyNotes:b.safetyNotes??null,rawLegacy:b.rawLegacy??null},
  evidence:request.evidence.map(e=>({...e.id?{id:e.id}:{},sceneId:e.sceneId??null,taskKey:e.taskKey??null,objectiveKey:e.objectiveKey??null,component:e.component,explanation:e.explanation??null}))};
}
export function checkStemPayload(request: StemSaveRequest): void {
 const b=request.brief; const invalid=(field:string,message:string):never=>{throw new ApiError(message,'FE_STEM_INPUT',400,{field});};
 const keys=(list:string[],field:string)=>{if(list.some(x=>!x||x.length>128))invalid(field,'Mã phải có từ 1 đến 128 ký tự.');};
 if(b.context.primary&&!STEM_CONTEXT_KEYS.includes(b.context.primary.key))invalid('brief.context.primary','Bối cảnh không được hỗ trợ.');
 for(const c of b.context.secondary)if(!STEM_CONTEXT_KEYS.includes(c.key))invalid('brief.context.secondary','Bối cảnh phụ không được hỗ trợ.');
 for(const [items,max,field] of [[b.subjectKeys,20,'brief.subjectKeys'],[b.outcomeIds,20,'brief.outcomeIds'],[b.objectives,20,'brief.objectives'],[b.studentTasks,20,'brief.studentTasks'],[b.contributions,4,'brief.contributions'],[b.context.secondary,4,'brief.context.secondary'],[request.evidence,200,'evidence']] as const)if(items.length>max)invalid(field,`Tối đa ${max} mục.`);
 keys(b.subjectKeys,'brief.subjectKeys');keys(b.outcomeIds,'brief.outcomeIds');keys(b.objectives.map(x=>x.key),'brief.objectives');keys(b.studentTasks.map(x=>x.key),'brief.studentTasks');
 const walk=(value:unknown,depth=0):void=>{if(depth>16)invalid('request','Cấu trúc quá sâu.');if(typeof value==='string'&&value.length>4000)invalid('request','Nội dung tối đa 4000 ký tự.');if(value&&typeof value==='object')Object.values(value).forEach(v=>walk(v,depth+1));};walk(request);
 if(new TextEncoder().encode(JSON.stringify(request)).length>262144)invalid('request','Nội dung vượt giới hạn 262144 byte.');
 // Completeness is returned by BE as findings; null primary is valid for draft saving.
}
export function workspaceModeFromWire(wire: WorkspaceStemSettingsWire): WorkspaceStemSettings {
 if(!wire||!Number.isInteger(wire.revision)||!['OFF','ADVISORY','STRICT'].includes(wire.mode)||!Array.isArray(wire.policyIds))throw new ApiError('Settings workspace không đúng contract P3.','FE_STEM_RESPONSE',400);
 return {workspaceId:wire.workspaceId,modeRevision:wire.revision,mode:wire.mode,policyVersionIds:wire.policyIds,defaultPolicyVersionId:wire.defaultPolicyId??null};
}
export function stemError(error: unknown) {
 const e=error as ApiError;const details=e?.details as {field?:string;findings?:StemValidationFinding[];retryAfterSeconds?:number}|undefined;
 const retry=e?.retryAfterSeconds??details?.retryAfterSeconds??60;
 return {status:e?.status??0,code:e?.code??'NETWORK_ERROR',message:e?.message??'Không kết nối được máy chủ.',field:details?.field,findings:Array.isArray(details?.findings)?details.findings:[],retryAfterSeconds:Number.isFinite(Number(retry))?Math.max(0,Math.ceil(Number(retry))):60};
}
export function assertPresentationIdentity(before: SceneData,after: SceneData): SceneData {
 if(after.id!==before.id||after.type!==before.type)throw new ApiError('Chỉnh bố cục phải giữ nguyên Scene ID và loại cảnh.','FE_SCENE_IDENTITY',409);
 return after;
}
/** P2 classifies these layout fields as conditional; no timing/semantic invariance is claimed. */
export const PRESENTATION_REVIEW_NOTICE='Thay đổi bố cục cần rà soát ý nghĩa (NEEDS_REVIEW). Projector/AT21 được kiểm chứng ở P5.';
