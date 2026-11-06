import React,{useState} from 'react';
import { beforeAll,afterEach,expect,it,vi } from 'vitest';
import { render,screen,fireEvent,waitFor,cleanup,act } from '@testing-library/react';
import { apiClient } from '../../services/apiClient';
import { scriptService } from '../../services/scriptService';
import { projectService } from '../../services/projectService';
import { reviewService } from '../../services/reviewService';
import { emptyStemBrief,stemMutationKey } from '../../services/stemClient';
import { StemBriefPanel } from './StemBriefPanel';
import { StemRubricPanel } from './StemRubricPanel';
import type { StemAssessment,STEMScript } from '../../types/stem';

// No mocked HTTP, controllers, DB, catalogs or providers. URL comes only from owned runner.
const url=process.env.P4_LIVE_API_URL;
if(!url||!/^http:\/\/127\.0\.0\.1:\d+\/api\/v1$/.test(url))throw new Error('Owned P4 localhost runner is required.');
let adminToken:string,writerToken:string,reviewerToken:string,workspace:string,project:STEMScript;
const login=async(username:string,password:string)=>apiClient.post<any>('/auth/login',{username,password});
beforeAll(async()=>{
  vi.spyOn(apiClient,'getBaseUrl').mockReturnValue(url);
  const admin=await login('e2e-admin','E2e-fixture-only-123');adminToken=admin.accessToken;
  const users=[] as Array<{id:string;token:string}>;
  for(const role of ['writer','reviewer','producer']){
    apiClient.setAuthToken(adminToken);
    const username=`p4${role}${Date.now()}`;
    const user=await apiClient.post<any>('/users',{fullName:`TEST_ONLY ${role}`,username,password:'P4-fixture-only-123',systemRole:'USER'});
    const first=await login(username,'P4-fixture-only-123');apiClient.setAuthToken(first.accessToken);
    const changed=await apiClient.post<any>('/auth/change-password',{currentPassword:'P4-fixture-only-123',newPassword:'P4-local-changed-456'});
    users.push({id:user.id,token:changed.accessToken});
  }
  writerToken=users[0].token;reviewerToken=users[1].token;apiClient.setAuthToken(adminToken);
  const ws=await apiClient.post<any>('/workspaces',{name:'TEST_ONLY P4 disposable workspace',department:'TEST_ONLY',leaderUserId:users[0].id,leaderRole:'WRITER',members:[{userId:users[1].id,role:'REVIEWER'},{userId:users[2].id,role:'PRODUCER'}]});
  workspace=ws.id;apiClient.setAuthToken(writerToken);
  project=await apiClient.post<STEMScript>(`/workspaces/${workspace}/scripts`,{title:'TEST_ONLY P4 not a verified lesson',subject:'Math',gradeLevel:'4',fps:30,scenes:[{type:'TITLE_HERO',title:'TEST_ONLY scene',subtitle:'TEST_ONLY',subject:'Math',gradeLevel:'4',badgeText:'TEST_ONLY',narration:'TEST_ONLY',durationInFrames:90}]});
},60000);
afterEach(()=>cleanup());

it('live G06: assigns DRAFT policy using workspace alias, rejects stale CAS, preserves history after OFF',async()=>{
  apiClient.setAuthToken(adminToken);
  const before=await scriptService.getWorkspaceStemSettings(workspace);
  const policies=await scriptService.getCatalog('POLICY');expect(policies[0].status).toBe('DRAFT');
  const saved=await scriptService.saveWorkspaceStemSettings(workspace,{modeRevision:before.modeRevision,mode:'ADVISORY',policyVersionIds:[policies[0].id],defaultPolicyVersionId:policies[0].id,idempotencyKey:stemMutationKey()});
  expect(saved.modeRevision).toBe(before.modeRevision+1);
  await expect(scriptService.saveWorkspaceStemSettings(workspace,{modeRevision:before.modeRevision,mode:'OFF',policyVersionIds:[],idempotencyKey:stemMutationKey()})).rejects.toMatchObject({status:409});
  const off=await scriptService.saveWorkspaceStemSettings(workspace,{modeRevision:saved.modeRevision,mode:'OFF',policyVersionIds:[policies[0].id],defaultPolicyVersionId:policies[0].id,idempotencyKey:stemMutationKey()});
  expect(off.policyVersionIds).toEqual([policies[0].id]);
  await scriptService.saveWorkspaceStemSettings(workspace,{modeRevision:off.modeRevision,mode:'ADVISORY',policyVersionIds:off.policyVersionIds,defaultPolicyVersionId:off.defaultPolicyVersionId,idempotencyKey:stemMutationKey()});
});

it('real BE flow: incomplete draft → reference400 → corrected UI save → Submit → Reviewer atomic assessment',async()=>{
  apiClient.setAuthToken(writerToken);
  const target=await scriptService.getStemTarget(project.id);
  expect(target.versionId).not.toBe(String(target.versionNo));
  const created=await scriptService.createStemBrief(project.id,target.versionId,{schemaVersion:'stem.v1',expectedScriptRevision:target.scriptRevision,idempotencyKey:stemMutationKey()});
  expect(created.brief?.context.primary).toBeNull();
  // Missing completeness remains a finding in OFF/ADVISORY; structurally invalid reference is the real 400.
  const draft=await scriptService.saveStemBrief(project.id,target.versionId,{schemaVersion:'stem.v1',baseRevision:created.revision,expectedScriptRevision:target.scriptRevision,idempotencyKey:stemMutationKey(),brief:emptyStemBrief(),evidence:[]});
  expect(draft.readiness).toBe('INCOMPLETE');expect(draft.findings.length).toBeGreaterThan(0);
  await expect(scriptService.saveStemBrief(project.id,target.versionId,{schemaVersion:'stem.v1',baseRevision:draft.revision,expectedScriptRevision:target.scriptRevision,idempotencyKey:stemMutationKey(),brief:{...emptyStemBrief(),policyVersionId:'40000000-0000-4000-8000-999999999999'},evidence:[]})).rejects.toMatchObject({status:400});
  render(<StemBriefPanel projectId={project.id} versionId={target.versionId} scriptRevision={target.scriptRevision} scenes={project.scenes} isWriter workspaceId={workspace} showToast={()=>{}}/>);
  const input=await screen.findByLabelText('Phạm vi clip');
  await waitFor(()=>expect(input.closest('fieldset')?.disabled).toBe(false));
  fireEvent.change(input,{target:{value:'TEST_ONLY corrected scope; not expert-reviewed'}});
  const policy=await screen.findByRole('combobox',{name:'Policy cho brief — DRAFT/UNVERIFIED'});
  await waitFor(()=>expect(screen.getByRole('option',{name:/TEST_ONLY_UNASSIGNED_POLICY/})).toBeTruthy());
  fireEvent.change(policy,{target:{value:'40000000-0000-4000-8000-000000000007'}});
  fireEvent.click(screen.getByRole('button',{name:/Lưu hồ sơ/}));
  await screen.findAllByText(/Policy is not assigned/);
  expect(screen.getByDisplayValue('TEST_ONLY corrected scope; not expert-reviewed')).toBeTruthy();
  fireEvent.change(policy,{target:{value:''}});
  fireEvent.click(screen.getByRole('button',{name:'Đã sửa dữ liệu / thử lại thủ công'}));
  fireEvent.click(screen.getByRole('button',{name:/Lưu hồ sơ/}));
  await waitFor(async()=>expect((await scriptService.getStemBrief(project.id,target.versionId)).brief?.scopeOfClip).toBe('TEST_ONLY corrected scope; not expert-reviewed'),{timeout:10000});
  cleanup();
  const submitted=await projectService.submitForReview(project.id);expect(submitted.scriptStatus).toBe('IN_REVIEW');
  apiClient.setAuthToken(adminToken);
  const b=await scriptService.getStemBrief(project.id,target.versionId);
  const invalidAssessment:StemAssessment={expectedBriefRevision:b.revision,expectedScriptRevision:target.scriptRevision,expectedModeRevision:b.modeRevision,rubricVersionId:null,criteria:[{key:'TEST_ONLY',judgment:'NOT_ASSESSED',rationale:'TEST_ONLY no expert feedback',evidenceIds:[]}],idempotencyKey:stemMutationKey()};
  await expect(reviewService.submitReviewDecision(project.id,'APPROVED','TEST_ONLY',invalidAssessment)).rejects.toMatchObject({status:403});
  apiClient.setAuthToken(reviewerToken);
  function Review(){
    const [assessment,setAssessment]=useState<StemAssessment|null>(null);
    const [done,setDone]=useState(false);
    return <><StemRubricPanel isOpen onClose={()=>{}} scriptId={project.id} versionId={target.versionId} scriptRevision={target.scriptRevision} isReviewerActive assessment={assessment} onAssessmentChange={setAssessment} onApproveWithAssessment={async()=>{await reviewService.submitReviewDecision(project.id,'APPROVED','TEST_ONLY not expert feedback',assessment!);setDone(true);}}/>{done&&<p>TEST_ONLY approved atomically</p>}</>;
  }
  render(<Review/>);await waitFor(()=>expect(screen.getAllByPlaceholderText(/Nhận xét/)[0].hasAttribute('disabled')).toBe(false));
  screen.getAllByPlaceholderText(/Nhận xét/).forEach(field=>fireEvent.change(field,{target:{value:'TEST_ONLY not a human expert review'}}));
  fireEvent.click(screen.getByRole('button',{name:'Duyệt kèm assessment'}));
  await screen.findByText('TEST_ONLY approved atomically',{}, {timeout:10000});
  expect((await projectService.getProjectById(project.id)).scriptStatus).toBe('APPROVED');
  expect((await scriptService.getStemBrief(project.id,target.versionId)).verificationStatus).toBe('UNVERIFIED');
},30000);
