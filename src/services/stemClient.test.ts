import { describe,it,expect,vi,afterEach } from 'vitest';
import { apiClient,ApiError,parseRetryAfter } from './apiClient';
import { scriptService } from './scriptService';
import { reviewService } from './reviewService';
import { emptyStemBrief,stemSavePayload,checkStemPayload,workspaceModeFromWire,stemError,assertPresentationIdentity } from './stemClient';
import type { StemSaveRequest,SceneData,StemAssessment } from '../types/stem';
const request=():StemSaveRequest=>({schemaVersion:'stem.v1',baseRevision:0,expectedScriptRevision:0,idempotencyKey:'TEST_ONLY_key',brief:emptyStemBrief(),evidence:[]});
afterEach(()=>vi.restoreAllMocks());
describe('P4 wire and validation',()=>{
 it('whitelists aggregate and strips UI/server-owned properties including evidence originalSceneId',()=>{
   const input={...request(),effectiveMode:'STRICT',verified:true,brief:{...emptyStemBrief(),approvedBy:'fake'},evidence:[{component:'S',originalSceneId:'old',uiKey:'local'}]} as any;
   const result=stemSavePayload(input);
   expect(result).not.toHaveProperty('verified');expect(result.brief).not.toHaveProperty('approvedBy');
   expect(result.evidence[0]).not.toHaveProperty('id');expect(result.evidence[0]).not.toHaveProperty('originalSceneId');
 });
 it('accepts null primary and zero CAS for a draft without inventing readiness',()=>expect(()=>checkStemPayload(request())).not.toThrow());
 it.each([['context',()=>({...request(),brief:{...emptyStemBrief(),context:{primary:{key:'DEPARTMENT_LIBRARY'},secondary:[]}}})],['text',()=>({...request(),brief:{...emptyStemBrief(),scopeOfClip:'x'.repeat(4001)}})],['tasks',()=>({...request(),brief:{...emptyStemBrief(),studentTasks:Array.from({length:21},(_,i)=>({key:String(i)}))}})],['evidence',()=>({...request(),evidence:Array.from({length:201},()=>({component:'S'}))})]] as const)('rejects invalid %s locally with 400 details',(_,make)=>{
   expect(()=>checkStemPayload(make() as StemSaveRequest)).toThrow(ApiError);
   try{checkStemPayload(make() as StemSaveRequest);}catch(e){expect(stemError(e)).toMatchObject({status:400});expect(stemError(e).field).toBeTruthy();}
 });
 it('parses exact workspace counter response as the same modeRevision alias',()=>expect(workspaceModeFromWire({workspaceId:'w',revision:0,mode:'OFF',policyIds:[],defaultPolicyId:null})).toMatchObject({modeRevision:0,policyVersionIds:[]}));
 it('approved G06 adapter sends only workspace baseRevision, never modeRevision',async()=>{
   const put=vi.spyOn(apiClient,'put').mockResolvedValue({workspaceId:'w',revision:8,mode:'ADVISORY',policyIds:['p'],defaultPolicyId:'p'});
   const result=await scriptService.saveWorkspaceStemSettings('w',{modeRevision:7,mode:'ADVISORY',policyVersionIds:['p'],defaultPolicyVersionId:'p',idempotencyKey:'TEST_ONLY_key'});
   expect(put.mock.calls[0][1]).toEqual({baseRevision:7,mode:'ADVISORY',policyVersionIds:['p'],defaultPolicyVersionId:'p',idempotencyKey:'TEST_ONLY_key',legacyModeSelection:null});expect(result.modeRevision).toBe(8);
 });
 it('resolves real current version UUID and preserves draft revision zero',async()=>{
   vi.spyOn(apiClient,'get').mockResolvedValueOnce({workspaceId:'w',draftRevision:0}).mockResolvedValueOnce([{id:'real-uuid',versionNo:3,isCurrent:true}]);
   expect(await scriptService.getStemTarget('p')).toEqual({versionId:'real-uuid',versionNo:3,workspaceId:'w',scriptRevision:0});
 });
 it('fails closed when the current version cannot be identified',async()=>{
   vi.spyOn(apiClient,'get').mockResolvedValueOnce({workspaceId:'w',draftRevision:0}).mockResolvedValueOnce([]);
   await expect(scriptService.getStemTarget('p')).rejects.toMatchObject({status:409});
 });
 it('keeps approval assessment atomic and excludes it from request-changes',async()=>{
   const post=vi.spyOn(apiClient,'post').mockResolvedValue({});const a={expectedBriefRevision:0,expectedScriptRevision:0,expectedModeRevision:0,expectedCompositionRevision:null,rubricVersionId:null,criteria:[],idempotencyKey:'TEST_ONLY_key'} as StemAssessment;
   await reviewService.submitReviewDecision('p','APPROVED','note',a);
   expect(post).toHaveBeenLastCalledWith('/scripts/p/approve',{note:'note',stemAssessment:a});
   const target={expectedVersionId:'uuid',expectedBriefRevision:0,expectedScriptRevision:0,idempotencyKey:'TEST_ONLY_key'};
   await reviewService.submitReviewDecision('p','CHANGE_REQUESTED','note',a,target);
   expect(post).toHaveBeenLastCalledWith('/scripts/p/request-changes',{note:'note',changeTarget:target});
 });
 it('accepts layout updates preserving ID/type and rejects replacement identities',()=>{
   const scene={id:'s1',type:'TITLE_HERO'} as SceneData;
   expect(assertPresentationIdentity(scene,{...scene,dx:4} as unknown as SceneData).id).toBe('s1');
   expect(()=>assertPresentationIdentity(scene,{...scene,id:'s2'})).toThrow();
 });
});
describe('P4 error parsing',()=>{
 it('reads Retry-After seconds and HTTP dates, rejecting malformed values',()=>{
   expect(parseRetryAfter('12')).toBe(12);expect(parseRetryAfter('Thu, 05 Nov 2026 00:00:03 GMT',Date.UTC(2026,10,5))).toBe(3);
   expect(parseRetryAfter('invalid')).toBeUndefined();expect(parseRetryAfter('-1')).toBeUndefined();expect(parseRetryAfter('1.5')).toBeUndefined();expect(parseRetryAfter(null)).toBeUndefined();
 });
 it('preserves server field/findings and uses Retry-After header before body',()=>{
   const err=new ApiError('bad','STEM_RATE_LIMIT',429,{field:'brief.scopeOfClip',retryAfterSeconds:99,findings:[{ruleId:'BE_RAW',field:'brief',message:'m',severity:'WARN'}]},3);
   expect(stemError(err)).toMatchObject({status:429,retryAfterSeconds:3,field:'brief.scopeOfClip'});expect(stemError(err).findings[0].ruleId).toBe('BE_RAW');
 });
 it('keeps revision conflicts separate from validation errors',()=>expect(stemError(new ApiError('stale','STEM_STALE_TARGET',409))).toMatchObject({status:409,code:'STEM_STALE_TARGET'}));
});
