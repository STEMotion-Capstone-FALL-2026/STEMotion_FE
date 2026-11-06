import React,{createRef,useState} from 'react';
import { act,cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import { scriptService } from '../../services/scriptService';
import { sceneSaveQueue } from '../../services/sceneSaveQueue';
import { ApiError } from '../../services/apiClient';
import { emptyStemBrief } from '../../services/stemClient';
import { StemBriefPanel,type StemBriefHandle } from './StemBriefPanel';
import { StemRubricPanel } from './StemRubricPanel';
import { StemWorkspaceSettings } from './StemWorkspaceSettings';
import { StemCatalogFields } from './StemLearningFields';
import { authService } from '../../services/authService';
import { StemErrorNotice } from './StemErrorNotice';
import type { StemAssessment,StemViewResponse } from '../../types/stem';

const view=(patch:Partial<StemViewResponse>={}):StemViewResponse=>({schemaVersion:'stem.v1',scriptVersionId:'real-version',briefId:'b',revision:0,modeRevision:0,verificationStatus:'UNVERIFIED',readiness:'INCOMPLETE',effectiveMode:'ADVISORY',brief:emptyStemBrief(),evidence:[],findings:[],...patch});
const props=()=>({projectId:'TEST_ONLY_project',versionId:'real-version',scriptRevision:0,scenes:[{id:'s1',type:'TITLE_HERO',title:'TEST_ONLY'}] as any,isWriter:true,workspaceId:'w',showToast:vi.fn()});
beforeEach(()=>{
  vi.spyOn(scriptService,'getStemBrief').mockResolvedValue(view());
  vi.spyOn(scriptService,'getCatalog').mockResolvedValue([]);
  vi.spyOn(scriptService,'getWorkspaceStemSettings').mockResolvedValue({workspaceId:'w',modeRevision:0,mode:'OFF',policyVersionIds:[],defaultPolicyVersionId:null});
  vi.spyOn(scriptService,'saveStemBrief').mockImplementation(async(_p,_v,r)=>view({brief:r.brief,evidence:r.evidence,revision:r.baseRevision+1}));
  vi.spyOn(sceneSaveQueue,'flush').mockResolvedValue();vi.spyOn(sceneSaveQueue,'getDraftRevision').mockReturnValue(0);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();});
describe('P4 Writer panel',()=>{
 it('saves nullable drafts with POST before PUT and retains channel separate from the two primary enums',async()=>{
   vi.mocked(scriptService.getStemBrief).mockResolvedValue(view({brief:null,briefId:null}));
   const create=vi.spyOn(scriptService,'createStemBrief').mockResolvedValue(view());
   const ref=createRef<StemBriefHandle>();render(<StemBriefPanel {...props()} ref={ref}/>);
   await waitFor(()=>expect(screen.getByLabelText('Phạm vi clip').hasAttribute('disabled')).toBe(false));
   fireEvent.click(screen.getByRole('button',{name:'Bối cảnh'}));
   const primary=screen.getByRole('combobox',{name:'Bối cảnh học tập chính'}) as HTMLSelectElement;
   expect(Array.from(primary.options).map(o=>o.value)).toEqual(['','IN_CLASS_SCREEN','GROUP_PRACTICE']);
   fireEvent.click(screen.getByLabelText('Kho học liệu tổ chuyên môn (DEPARTMENT_LIBRARY)'));
   await act(async()=>{await ref.current!.saveForSubmit();});
   expect(create).toHaveBeenCalledWith('TEST_ONLY_project','real-version',expect.objectContaining({expectedScriptRevision:0}));
   expect(scriptService.saveStemBrief).toHaveBeenCalledWith('TEST_ONLY_project','real-version',expect.objectContaining({brief:expect.objectContaining({context:{primary:null,secondary:[]},distributionChannels:['DEPARTMENT_LIBRARY']})}));
 });
 it.each([400,409,429])('preserves edited input after %s and never loops autosave',async(status)=>{
   const fail=new ApiError('TEST_ONLY failure',`TEST_ONLY_${status}`,status,{field:'brief.scopeOfClip'},status===429?2:undefined);
   vi.mocked(scriptService.saveStemBrief).mockRejectedValue(fail);
   render(<StemBriefPanel {...props()}/>);
   const input=await screen.findByLabelText('Phạm vi clip');await waitFor(()=>expect(input.closest('fieldset')?.disabled).toBe(false));
   fireEvent.change(input,{target:{value:'Giữ nguyên nội dung đang nhập'}});
   fireEvent.click(screen.getByRole('button',{name:/Lưu hồ sơ/}));
   await waitFor(()=>expect(scriptService.saveStemBrief).toHaveBeenCalledTimes(1));
   await waitFor(()=>expect(screen.getByDisplayValue('Giữ nguyên nội dung đang nhập')).toBeTruthy());
   if(status===409)expect(await screen.findByRole('dialog',{name:'Xung đột phiên bản STEM'})).toBeTruthy();
   if(status===400)expect(input.getAttribute('aria-invalid')).toBe('true');
   if(status===429)expect(screen.getByText(/Autosave tạm dừng/)).toBeTruthy();
   await act(async()=>{await new Promise(resolve=>setTimeout(resolve,1100));});
   expect(scriptService.saveStemBrief).toHaveBeenCalledTimes(1);
 });
 it('requires manual Save after accepting a legacy suggestion, preserves opaque rawLegacy',async()=>{
   const b={...emptyStemBrief(),rawLegacy:'TEST_ONLY opaque legacy'};
   vi.mocked(scriptService.getStemBrief).mockResolvedValue(view({brief:b,legacySuggestion:{channelKeys:['DEPARTMENT_LIBRARY'],primaryKey:null,reason:'TEST_ONLY',requiresConfirmation:true}}));
   render(<StemBriefPanel {...props()}/>);
   fireEvent.click(await screen.findByRole('button',{name:/Áp dụng gợi ý vào form/}));
   await act(async()=>{await new Promise(resolve=>setTimeout(resolve,1100));});
   expect(scriptService.saveStemBrief).not.toHaveBeenCalled();
   fireEvent.click(screen.getByRole('button',{name:/Lưu hồ sơ/}));
   await waitFor(()=>expect(scriptService.saveStemBrief).toHaveBeenCalledWith(expect.anything(),expect.anything(),expect.objectContaining({brief:expect.objectContaining({rawLegacy:'TEST_ONLY opaque legacy',context:{primary:null,secondary:[]}})})));
 });
 it('renders orphan evidence without silently deleting or remapping its scene',async()=>{
   vi.mocked(scriptService.getStemBrief).mockResolvedValue(view({evidence:[{id:'e1',sceneId:'deleted',component:'E',explanation:'TEST_ONLY'}]}));
   render(<StemBriefPanel {...props()}/>);await screen.findByLabelText('Phạm vi clip');
   fireEvent.click(screen.getByRole('button',{name:'Minh chứng STEM'}));
   expect(await screen.findByText(/Minh chứng orphan/)).toBeTruthy();
   expect(scriptService.saveStemBrief).not.toHaveBeenCalled();
 });
});
describe('P4 Reviewer Drawer',()=>{
 function Drawer({active=true}:{active?:boolean}){
   const [assessment,setAssessment]=useState<StemAssessment|null>(null);
   return <><StemRubricPanel isOpen onClose={()=>{}} scriptId="p" versionId="real-version" scriptRevision={0} isReviewerActive={active} assessment={assessment} onAssessmentChange={setAssessment}/><output data-testid="assessment">{JSON.stringify(assessment)}</output></>;
 }
 it('initializes only from loaded revisions, does not invent rubric IDs and preserves zero',async()=>{
   render(<Drawer/>);
   await waitFor(()=>expect(screen.getByTestId('assessment').textContent).toContain('expectedModeRevision'));
   const assessment=JSON.parse(screen.getByTestId('assessment').textContent!);
   expect(assessment).toMatchObject({expectedBriefRevision:0,expectedScriptRevision:0,expectedModeRevision:0,rubricVersionId:null});
   const key=assessment.idempotencyKey;
   fireEvent.change(screen.getAllByPlaceholderText(/Nhận xét/)[0],{target:{value:'TEST_ONLY rationale'}});
   expect(JSON.parse(screen.getByTestId('assessment').textContent!).idempotencyKey).not.toBe(key);
   expect(screen.getByText(/chưa phải rubric P2 đã khóa/)).toBeTruthy();
 });
 it('does not initialize or allow assessment without an active Reviewer seat',async()=>{
   render(<Drawer active={false}/>);await waitFor(()=>expect(scriptService.getStemBrief).toHaveBeenCalled());
   expect(screen.getByTestId('assessment').textContent).toBe('null');
   expect(screen.getAllByRole('radio').every(r=>(r as HTMLInputElement).disabled)).toBe(true);
 });
});
describe('P4 conflict/settings UX',()=>{
 it('uses independent TEST_ONLY/DRAFT catalog metadata for grade, subject, outcome and source labels',async()=>{
   const rows=[
     {id:'TEST_ONLY_profile',kind:'PROFILE',logicalKey:'TEST_ONLY_PRIMARY',version:1,status:'DRAFT',verificationStatus:'UNVERIFIED',revision:0,data:{educationLevel:'PRIMARY',gradeKey:'4',subjectKey:'TEST_ONLY_SCIENCE'}},
     {id:'TEST_ONLY_source',kind:'SOURCE_EDITION',logicalKey:'TEST_ONLY_SOURCE_NOT_OFFICIAL',version:1,status:'DRAFT',verificationStatus:'UNVERIFIED',revision:0,data:{}},
     {id:'TEST_ONLY_outcome',kind:'OUTCOME',logicalKey:'TEST_ONLY_OUTCOME_NOT_CURRICULUM',version:1,status:'DRAFT',verificationStatus:'UNVERIFIED',revision:0,sourceId:'TEST_ONLY_source',data:{gradeKey:'4',subjectKey:'TEST_ONLY_SCIENCE'}},
   ];
   vi.mocked(scriptService.getCatalog).mockResolvedValue(rows);
   function Catalog(){const [brief,setBrief]=useState(emptyStemBrief());return <StemCatalogFields brief={brief} onChange={setBrief} workspaceId="w"/>;}
   render(<Catalog/>);
   await screen.findByRole('option',{name:'PRIMARY'});
   fireEvent.change(screen.getByRole('combobox',{name:/Cấp học \(lọc/}),{target:{value:'PRIMARY'}});
   fireEvent.change(screen.getByRole('combobox',{name:'Cấp/lớp từ catalog'}),{target:{value:'4'}});
   fireEvent.change(screen.getByRole('combobox',{name:'Môn chính'}),{target:{value:'TEST_ONLY_SCIENCE'}});
   expect(screen.getByText(/TEST_ONLY_OUTCOME_NOT_CURRICULUM v1 · nguồn: TEST_ONLY_SOURCE_NOT_OFFICIAL/)).toBeTruthy();
   expect(screen.getByText('Catalog DRAFT/UNVERIFIED — chưa thẩm định chuyên môn.')).toBeTruthy();
 });
 it('409 reload requires an explicit user action',()=>{
   const reload=vi.fn();render(<StemErrorNotice error={new ApiError('stale','STEM_STALE_TARGET',409)} onReload={reload}/>);
   expect(screen.getByRole('dialog',{name:'Xung đột phiên bản STEM'})).toBeTruthy();expect(reload).not.toHaveBeenCalled();
   fireEvent.click(screen.getByRole('button',{name:'Reload dữ liệu mới nhất'}));expect(reload).toHaveBeenCalledOnce();
 });
 it('Admin Read/Assign uses modeRevision and offers no STRICT or activation control',async()=>{
   vi.spyOn(authService,'getCurrentUser').mockReturnValue({id:'TEST_ONLY_admin',systemRole:'ADMIN'} as any);
   const save=vi.spyOn(scriptService,'saveWorkspaceStemSettings').mockResolvedValue({workspaceId:'w',modeRevision:1,mode:'ADVISORY',policyVersionIds:[],defaultPolicyVersionId:null});
   render(<StemWorkspaceSettings workspaceId="w"/>);fireEvent.click(screen.getByText('Workspace STEM — xem/gán policy DRAFT'));
   const mode=await screen.findByRole('combobox',{name:'Mode'});fireEvent.change(mode,{target:{value:'ADVISORY'}});
   fireEvent.click(screen.getByRole('button',{name:'Lưu settings workspace (CAS)'}));
   await waitFor(()=>expect(save).toHaveBeenCalledWith('w',expect.objectContaining({modeRevision:0,mode:'ADVISORY'})));
   expect(screen.queryByRole('option',{name:'STRICT'})).toBeNull();
 });
});
