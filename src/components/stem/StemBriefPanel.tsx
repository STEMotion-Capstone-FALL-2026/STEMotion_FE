import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  BookOpen,
  Compass,
  Target,
  FileCheck2,
  AlertTriangle,
  Info,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react';
import {
  StemBrief,
  StemEvidence,
  StemValidationFinding,
  StemViewResponse,
  SceneData,
  LegacySuggestion,
  UsageContext,
  ContextEntry,
} from '../../types/stem';
import { scriptService } from '../../services/scriptService';
import { sceneSaveQueue } from '../../services/sceneSaveQueue';
import { emptyStemBrief, stemMutationKey, stemError } from '../../services/stemClient';
import { StemWorkspaceSettings } from './StemWorkspaceSettings';
import { StemErrorNotice } from './StemErrorNotice';
import { StemLearningFields, StemCatalogFields } from './StemLearningFields';

export interface StemBriefPanelProps {
  projectId: string;
  versionId: string;
  scriptRevision: number;
  scenes: SceneData[];
  isWriter: boolean;
  workspaceId: string;
  effectiveMode?: string;
  onEvidenceChange?: (evidence: StemEvidence[]) => void;
  onBriefSaved?: (brief: StemBrief) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

const PRIMARY_CONTEXT_OPTIONS: { key: 'IN_CLASS_SCREEN' | 'GROUP_PRACTICE'; label: string; desc: string }[] = [
  { key: 'IN_CLASS_SCREEN', label: 'Chiếu chung trong lớp (IN_CLASS_SCREEN)', desc: 'Chiếu trên màn hình lớp học, có điểm dừng thảo luận' },
  { key: 'GROUP_PRACTICE', label: 'Thực hành nhóm (GROUP_PRACTICE)', desc: 'Học sinh thực hành theo nhóm, có đo lường và vật liệu' },
];

export interface StemBriefHandle { assertSubmitReady: () => void; saveForSubmit: () => Promise<StemViewResponse>; }

export const STANDARD_STEM_STEPS = [
  { key: 'OPENING_PROBLEM', label: '1. Mở đầu / Xác định vấn đề', description: 'Đặt vấn đề thực tiễn, tình huống kích thích tìm tòi (Bắt buộc)' },
  { key: 'BACKGROUND_KNOWLEDGE', label: '2. Nghiên cứu kiến thức nền', description: 'Tiếp cận lý thuyết, bản chất khoa học' },
  { key: 'PROPOSE_SOLUTION', label: '3. Đề xuất giải pháp', description: 'Đề xuất ý tưởng, giải pháp giải quyết vấn đề' },
  { key: 'SELECT_SOLUTION', label: '4. Lựa chọn giải pháp / Thiết kế', description: 'Thiết kế mô hình, quy trình giải pháp tối ưu' },
  { key: 'BUILD_TEST', label: '5. Chế tạo / Thử nghiệm / Đánh giá', description: 'Chế tạo sản phẩm mẫu, thử nghiệm và đánh giá số liệu' },
  { key: 'CLOSING_SHARE_REFLECT', label: '6. Chia sẻ / Thảo luận / Vận dụng', description: 'Báo cáo, thảo luận và mở rộng vận dụng thực tế (Bắt buộc)' },
] as const;

export const StemBriefPanel = forwardRef<StemBriefHandle, StemBriefPanelProps>(({projectId,versionId,scriptRevision,scenes,isWriter,workspaceId,effectiveMode='ADVISORY',onBriefSaved,onEvidenceChange,showToast},ref) => {
  const [activeTab,setActiveTab]=useState<'OVERVIEW'|'CONTEXT'|'OBJECTIVES'|'STEPS'|'EVIDENCE'>('OVERVIEW');
  const [brief,setBrief]=useState<StemBrief>(emptyStemBrief);
  const [evidence,setEvidence]=useState<StemEvidence[]>([]);
  const [findings,setFindings]=useState<StemValidationFinding[]>([]);
  const [revision,setRevision]=useState(0);
  const [readiness,setReadiness]=useState('INCOMPLETE');
  const [currentMode,setCurrentMode]=useState(effectiveMode);
  const [legacySuggestion,setLegacySuggestion]=useState<LegacySuggestion|null>(null);
  const [isLoading,setIsLoading]=useState(true);
  const [isSaving,setIsSaving]=useState(false);
  const [isValidating,setIsValidating]=useState(false);
  const [error,setError]=useState<unknown>(null);
  const [rateLimitCountdown,setRateLimitCountdown]=useState<number|null>(null);
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
  const [dirty,setDirty]=useState(false);
  const [legacyPending,setLegacyPending]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const loaded=useRef(false);
  const exists=useRef(false);
  const saving=useRef<Promise<StemViewResponse>|null>(null);
  const snapshot=useRef('');
  const generation=useRef(0);
  const alive=useRef(true);
  const epoch=useRef(0);
  const latest=useRef({brief,evidence,revision,scriptRevision});latest.current={brief,evidence,revision,scriptRevision};
  const mutation=useRef<{body:string;key:string}|null>(null);
  const keyFor=(body:unknown)=>{const text=JSON.stringify(body);if(mutation.current?.body!==text)mutation.current={body:text,key:stemMutationKey()};return mutation.current.key;};
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;epoch.current++;};},[]);
  const fail=(err:unknown)=>{
    if(!alive.current)return;
    const parsed=stemError(err);setError(err);
    if(parsed.status===429)setRateLimitCountdown(parsed.retryAfterSeconds);
    if(parsed.status===400)setFieldErrors({[parsed.field??'request']:parsed.message});
  };
  const loadBrief=useCallback(async()=>{
    const request=++epoch.current;loaded.current=false;setIsLoading(true);setError(null);setDirty(false);
    try {
      const view=await scriptService.getStemBrief(projectId,versionId);
      if(!alive.current||request!==epoch.current)return;
      const next=view.brief??emptyStemBrief();exists.current=Boolean(view.briefId);
      snapshot.current=JSON.stringify([next,view.evidence]);
      setBrief(next);setEvidence(view.evidence);setRevision(view.revision);setReadiness(view.readiness);
      setFindings(view.findings);setCurrentMode(view.effectiveMode);setLegacySuggestion(view.legacySuggestion??null);
      setFieldErrors({});mutation.current=null;setRateLimitCountdown(null);loaded.current=true;
    }catch(err){if(request===epoch.current)fail(err);}finally{if(alive.current&&request===epoch.current)setIsLoading(false);}
  },[projectId,versionId]);
  useEffect(()=>{void loadBrief();},[loadBrief]);
  useEffect(()=>{onEvidenceChange?.(evidence);},[evidence,onEvidenceChange]);
  useEffect(()=>{
    const text=JSON.stringify([brief,evidence]);
    if(loaded.current&&text!==snapshot.current){snapshot.current=text;generation.current++;setDirty(true);}
  },[brief,evidence]);
  useEffect(()=>{if(rateLimitCountdown===null||rateLimitCountdown<=0)return;const timer=setTimeout(()=>setRateLimitCountdown(n=>n===null?null:Math.max(0,n-1)),1000);return()=>clearTimeout(timer);},[rateLimitCountdown]);

  const persist=async():Promise<StemViewResponse>=>{
    if(saving.current)return saving.current;
    if(!isWriter||!loaded.current||error||rateLimitCountdown!==null)throw new Error('Hãy xử lý lỗi/tải lại hoặc tiếp tục sửa trước khi lưu.');
    const sentGeneration=generation.current;const requestEpoch=epoch.current;
    setIsSaving(true);setFieldErrors({});
    const task=(async()=>{
      await sceneSaveQueue.flush(projectId);
      const state=latest.current;
      const expectedScriptRevision=sceneSaveQueue.getDraftRevision(projectId)??state.scriptRevision;
      let baseRevision=state.revision;
      if(!exists.current){
        const created=await scriptService.createStemBrief(projectId,versionId,{schemaVersion:'stem.v1',expectedScriptRevision,idempotencyKey:keyFor({create:true,expectedScriptRevision})});
        exists.current=true;baseRevision=created.revision;latest.current.revision=baseRevision;
        if(alive.current&&requestEpoch===epoch.current)setRevision(baseRevision);
      }
      const payload={schemaVersion:'stem.v1' as const,baseRevision,expectedScriptRevision,brief:state.brief,evidence:state.evidence.map(e=>({...e,sceneId:e.sceneId?sceneSaveQueue.resolveId(projectId,e.sceneId):null}))};
      const result=await scriptService.saveStemBrief(projectId,versionId,{...payload,idempotencyKey:keyFor(payload)});
      if(!alive.current||requestEpoch!==epoch.current)return result;
      latest.current.revision=result.revision;setRevision(result.revision);setFindings(result.findings);setReadiness(result.readiness);setCurrentMode(result.effectiveMode);
      if(generation.current===sentGeneration){
        snapshot.current=JSON.stringify([result.brief??state.brief,result.evidence]);
        setBrief(result.brief??state.brief);setEvidence(result.evidence);setDirty(false);
      } else {
        // Evidence editing is locked while saving; response order is not assumed to match request order.
        setEvidence(result.evidence);
      }
      onBriefSaved?.(result.brief??state.brief);return result;
    })();saving.current=task;
    try{return await task;}catch(err){fail(err);throw err;}finally{saving.current=null;if(alive.current)setIsSaving(false);}
  };
  const assertSubmitReady=()=>{
    if(!loaded.current)throw new Error('Hồ sơ STEM chưa tải xong.');
    if(legacyPending)throw new Error('Gợi ý legacy mới ở form; hãy bấm Lưu hồ sơ để xác nhận.');
    if(error||rateLimitCountdown!==null)throw new Error('Hồ sơ STEM đang có lỗi chưa xử lý.');
  };
  useImperativeHandle(ref,()=>({assertSubmitReady,saveForSubmit:async()=>{
    assertSubmitReady();
    // OFF legacy without a brief is never silently converted just by submitting.
    if(!dirty&&!exists.current&&currentMode==='OFF')return scriptService.getStemBrief(projectId,versionId);
    let saved:StemViewResponse;
    for(let attempt=0;attempt<3;attempt++){
      const sent=generation.current;saved=await persist();
      if(generation.current===sent)return saved;
    }
    throw new Error('Còn thay đổi đang lưu; hãy kiểm tra và gửi lại.');
  }}));
  const handleSaveBrief=()=>{setLegacyPending(false);void persist().then(()=>showToast('Đã lưu dự thảo STEM.','success')).catch(()=>{});};
  useEffect(()=>{
    if(legacyPending||!dirty||!loaded.current||!isWriter||isSaving||error||rateLimitCountdown!==null)return;
    const timer=setTimeout(()=>{void persist().catch(()=>{});},900);return()=>clearTimeout(timer);
  },[brief,evidence,dirty,isSaving,error,rateLimitCountdown,isWriter,legacyPending]);
  const handleValidate=async()=>{
    if(isValidating||error||rateLimitCountdown!==null||!loaded.current)return;
    setIsValidating(true);
    try{const saved=dirty?await persist():await scriptService.getStemBrief(projectId,versionId);
      const result=await scriptService.validateStem(projectId,versionId,{expectedBriefRevision:saved.revision,expectedScriptRevision:sceneSaveQueue.getDraftRevision(projectId)??scriptRevision,phase:'SCRIPT'});
      setFindings(result.findings);setReadiness(result.readiness);
    }catch(err){fail(err);}finally{setIsValidating(false);}
  };
  const handleAcceptLegacy=()=>{
    if(!legacySuggestion)return;
    setLegacyPending(true);
    const key=legacySuggestion.primaryKey;
    setBrief(b=>({...b,context:{...b.context,primary:key==='IN_CLASS_SCREEN'||key==='GROUP_PRACTICE'?{key,condition:'Xác nhận dữ liệu kế thừa'}:b.context.primary},distributionChannels:Array.from(new Set([...b.distributionChannels,...legacySuggestion.channelKeys.filter(c=>c==='DEPARTMENT_LIBRARY')]))}));
    // Raw legacy is retained. Only a subsequent CAS save persists this explicit choice.
    setLegacySuggestion(null);
  };
  const handleAddEvidence=()=>{if(evidence.length<200)setEvidence([...evidence,{sceneId:scenes[0]?.id??null,taskKey:null,objectiveKey:null,component:'S',explanation:''}]);};
  const handleUpdateEvidence=(index:number,patch:Partial<StemEvidence>)=>setEvidence(current=>current.map((e,i)=>i===index?{...e,...patch}:e));
  const handleRemoveEvidence=(index:number)=>setEvidence(current=>current.filter((_,i)=>i!==index));
  useEffect(()=>{
    const normalize=(field:string)=>field.replace(/^brief\./,'').replace(/\[\d+\]/g,'');
    const aliases:Record<string,string>={'catalog.POLICY':'policyVersionId','catalog.TOPIC_VERSION':'topicVersionId','catalog.OUTCOME':'outcomeIds'};
    root.current?.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('[name]').forEach(control=>{
      const name=normalize(control.name);
      const field=Object.keys(fieldErrors).find(raw=>{
        const f=aliases[raw]??normalize(raw);
        return raw==='brief'||name===f||name.startsWith(f+'.')||f.startsWith(name+'.');
      });
      control.setAttribute('aria-invalid',String(Boolean(field)));
      control.classList.toggle('ring-2',Boolean(field));control.classList.toggle('ring-rose-400',Boolean(field));
      if(field)control.title=fieldErrors[field];
    });
  },[fieldErrors,activeTab,brief.objectives.length,brief.studentTasks.length,evidence.length]);

  // Context Management
  const handleAddSecondaryContext = () => {
    if (brief.context.secondary.length >= 4) {
      showToast('Tối đa 4 bối cảnh phụ', 'warn');
      return;
    }
    const newEntry: ContextEntry = {
      key: 'GROUP_PRACTICE',
      condition: '',
      adaptations: '',
    };
    setBrief({
      ...brief,
      context: {
        ...brief.context,
        secondary: [...brief.context.secondary, newEntry],
      },
    });
  };

  const handleUpdateSecondaryContext = (index: number, patch: Partial<ContextEntry>) => {
    const nextSecondary = [...brief.context.secondary];
    nextSecondary[index] = { ...nextSecondary[index], ...patch };
    setBrief({
      ...brief,
      context: {
        ...brief.context,
        secondary: nextSecondary,
      },
    });
  };

  const handleRemoveSecondaryContext = (index: number) => {
    setBrief({
      ...brief,
      context: {
        ...brief.context,
        secondary: brief.context.secondary.filter((_, i) => i !== index),
      },
    });
  };

  const handleApplyDefaultSteps = () => {
    const existing = brief.steps ?? [];
    const stepsMap = new Map(existing.map(s => [s.stepKey, s]));
    const newSteps = STANDARD_STEM_STEPS.map((std, idx) => {
      const found = stepsMap.get(std.key);
      if (found) return found;
      const defaultScenes = idx === 0 && scenes[0]?.id ? [scenes[0].id] : (idx === STANDARD_STEM_STEPS.length - 1 && scenes.length > 1 ? [scenes[scenes.length - 1].id] : []);
      return {
        stepKey: std.key,
        sceneIds: defaultScenes,
        activityKey: null,
        objectiveKeys: [],
      };
    });
    setBrief({ ...brief, steps: newSteps });
    setDirty(true);
  };

  const handleUpdateStep = (stepKey: string, patch: Partial<import('../../types/stem').LessonStep>) => {
    const steps = [...(brief.steps ?? [])];
    const idx = steps.findIndex(s => s.stepKey === stepKey);
    if (idx >= 0) {
      steps[idx] = { ...steps[idx], ...patch };
    } else {
      steps.push({
        stepKey,
        sceneIds: [],
        activityKey: null,
        objectiveKeys: [],
        ...patch,
      });
    }
    setBrief({ ...brief, steps });
    setDirty(true);
  };

  return (
    <div ref={root} className="flex flex-col h-full bg-white border-l border-slate-200 text-xs text-slate-800">
      {/* Top Header Bar */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-sm">Hồ sơ STEM (DRAFT / UNVERIFIED)</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
            DRAFT
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">
            Chế độ: <strong className="text-slate-700">{currentMode}</strong>
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            readiness === 'INCOMPLETE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            readiness === 'READY_FOR_REVIEW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'bg-slate-100 text-slate-600'
          }`}>
            {readiness}
          </span>
        </div>
      </div>

      {/* Legacy Suggestion Banner */}
      {legacySuggestion && (
        <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-indigo-900">Gợi ý chuyển đổi dữ liệu kế thừa</p>
              <p className="text-[10px] text-indigo-700">{legacySuggestion.reason}</p>
              {legacySuggestion.primaryKey && (
                <p className="text-[10px] text-indigo-800 mt-1">
                  Bối cảnh đề xuất: <strong>{legacySuggestion.primaryKey}</strong>
                </p>
              )}
            </div>
          </div>
          {isWriter && (
            <button
              onClick={handleAcceptLegacy}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-[10px] shrink-0"
            >
              Áp dụng gợi ý vào form (chưa lưu)
            </button>
          )}
        </div>
      )}

      <StemErrorNotice error={error} onReload={()=>void loadBrief()} onRetryReady={()=>{setRateLimitCountdown(null);setError(null);setDirty(false);}} />
      {isLoading&&<p role="status">Đang tải hồ sơ STEM…</p>}
      {Object.entries(fieldErrors).map(([field,message])=><p role="alert" key={field}>{field}: {message}</p>)}
      <StemWorkspaceSettings workspaceId={workspaceId}/>
      <fieldset disabled={!isWriter||isLoading||!loaded.current} className="contents">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/60 px-2 pt-2 gap-1">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t border-t border-x text-xs ${
            activeTab === 'OVERVIEW'
              ? 'bg-white border-slate-200 text-indigo-600 border-b-transparent shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Tổng quan
        </button>
        <button
          onClick={() => setActiveTab('CONTEXT')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t border-t border-x text-xs ${
            activeTab === 'CONTEXT'
              ? 'bg-white border-slate-200 text-indigo-600 border-b-transparent shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" /> Bối cảnh
        </button>
        <button
          onClick={() => setActiveTab('OBJECTIVES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t border-t border-x text-xs ${
            activeTab === 'OBJECTIVES'
              ? 'bg-white border-slate-200 text-indigo-600 border-b-transparent shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Target className="w-3.5 h-3.5" /> Mục tiêu & Nhiệm vụ
        </button>
        <button
          onClick={() => setActiveTab('STEPS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t border-t border-x text-xs ${
            activeTab === 'STEPS'
              ? 'bg-white border-slate-200 text-indigo-600 border-b-transparent shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" /> Tiến trình 6 bước
        </button>
        <button
          onClick={() => setActiveTab('EVIDENCE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t border-t border-x text-xs ${
            activeTab === 'EVIDENCE'
              ? 'bg-white border-slate-200 text-indigo-600 border-b-transparent shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" /> Minh chứng STEM
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            <StemCatalogFields brief={brief} onChange={setBrief} workspaceId={workspaceId} />
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Phạm vi bài giảng trong clip
              </label>
              <textarea
                name="brief.scopeOfClip" aria-label="Phạm vi clip" aria-invalid={Boolean(fieldErrors['brief.scopeOfClip']||fieldErrors['scopeOfClip'])} value={brief.scopeOfClip || ''}
                onChange={(e) => setBrief({ ...brief, scopeOfClip: e.target.value.slice(0, 4000) })}
                disabled={!isWriter}
                rows={3}
                placeholder="Mô tả phạm vi nội dung clip bao phủ (tối đa 4000 ký tự)..."
                className={`w-full p-2 text-xs border rounded focus:ring-1 focus:ring-indigo-500 ${
                  fieldErrors['scopeOfClip'] ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                }`}
              />
              {fieldErrors['scopeOfClip'] && (
                <p className="text-[10px] text-rose-600 mt-0.5">{fieldErrors['scopeOfClip']}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Lưu ý an toàn thực hành (Safety Notes)
              </label>
              <textarea
                name="brief.safetyNotes" aria-label="Lưu ý an toàn" aria-invalid={Boolean(fieldErrors['brief.safetyNotes']||fieldErrors['safetyNotes'])} value={brief.safetyNotes || ''}
                onChange={(e) => setBrief({ ...brief, safetyNotes: e.target.value.slice(0, 4000) })}
                disabled={!isWriter}
                rows={2}
                placeholder="Lưu ý an toàn khi học sinh thực hành hoặc cảnh báo rủi ro..."
                className="w-full p-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Validation Findings Box */}
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" /> Cảnh báo quy tắc (Findings)
              </h3>
              {findings.length === 0 ? (
                <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Chưa có finding trả về; không đồng nghĩa đã thẩm định.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {findings.map((f, i) => (
                    <li
                      key={i}
                      className={`p-2 rounded text-[11px] flex items-start gap-1.5 ${
                        false /* OFF/ADVISORY findings stay advisory */
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">[{f.ruleId}]</span> {f.message}
                        {f.field && <span className="text-[10px] text-slate-500 block">Vị trí: {f.field}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'CONTEXT' && (
          <div className="space-y-4">
            {/* Primary Learning Context */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Bối cảnh học tập chính (Primary Context)
              </label>
              <select
                aria-label="Bối cảnh học tập chính" name="brief.context.primary" value={brief.context.primary?.key || ''}
                onChange={(e) => {
                  const val = e.target.value as ContextEntry['key'] | '';
                  setBrief({
                    ...brief,
                    context: {
                      ...brief.context,
                      primary: val ? { key: val, condition: '' } : null,
                    },
                  });
                }}
                disabled={!isWriter}
                className="w-full p-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Chưa chọn (Draft Null) --</option>
                {PRIMARY_CONTEXT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                * Ở trạng thái Draft, bối cảnh chính có thể để trống. OFF/ADVISORY hiển thị cảnh báo khi nộp duyệt; BE quyết định cuối cùng.
              </p>
            </div>

            {/* Distribution Channels */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kênh phân phối / Lưu trữ (Distribution Channels)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chan_dept" name="brief.distributionChannels"
                  checked={brief.distributionChannels.includes('DEPARTMENT_LIBRARY')}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? Array.from(new Set([...brief.distributionChannels, 'DEPARTMENT_LIBRARY']))
                      : brief.distributionChannels.filter((c) => c !== 'DEPARTMENT_LIBRARY');
                    setBrief({ ...brief, distributionChannels: next });
                  }}
                  disabled={!isWriter}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="chan_dept" className="text-xs text-slate-700">
                  Kho học liệu tổ chuyên môn (DEPARTMENT_LIBRARY)
                </label>
              </div>
            </div>

            {/* Secondary Contexts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-slate-700">
                  Bối cảnh phụ (Secondary Contexts: {brief.context.secondary.length}/4)
                </label>
                {isWriter && brief.context.secondary.length < 4 && (
                  <button
                    onClick={handleAddSecondaryContext}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <Plus className="w-3 h-3" /> Thêm bối cảnh phụ
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {brief.context.secondary.map((sec, idx) => (
                  <div key={idx} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] text-slate-700">#{idx + 1}</span>
                      {isWriter && (
                        <button
                          onClick={() => handleRemoveSecondaryContext(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <select name="brief.context.secondary" aria-label={`Bối cảnh phụ ${idx+1}`} value={sec.key} onChange={e=>handleUpdateSecondaryContext(idx,{key:e.target.value as ContextEntry['key']})}>
                      {PRIMARY_CONTEXT_OPTIONS.map(option=><option key={option.key} value={option.key}>{option.label}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Điều kiện sử dụng (condition)..."
                      name="brief.context.secondary.condition" value={sec.condition || ''}
                      onChange={(e) => handleUpdateSecondaryContext(idx, { condition: e.target.value })}
                      disabled={!isWriter}
                      className="w-full p-1.5 text-[11px] border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Biến thể điều chỉnh (adaptations)..."
                      name="brief.context.secondary.adaptations" value={sec.adaptations || ''}
                      onChange={(e) => handleUpdateSecondaryContext(idx, { adaptations: e.target.value })}
                      disabled={!isWriter}
                      className="w-full p-1.5 text-[11px] border border-slate-300 rounded bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'OBJECTIVES' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px]">
              Mục tiêu học tập và nhiệm vụ của học sinh cần liên kết trực tiếp với yêu cầu cần đạt của bài học.
            </div>
            <StemLearningFields brief={brief} onChange={setBrief} />
            <p>Biến thể, nhiệm vụ hoặc yêu cầu an toàn mâu thuẫn: đề nghị tách brief/version để người có chuyên môn quyết định.</p>
          </div>
        )}

        {activeTab === 'STEPS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="font-bold text-slate-800 text-xs">Tiến trình sư phạm STEM (Mẫu 6 bước)</h3>
                <p className="text-[10px] text-slate-500">
                  Quy định tiến trình chuẩn theo GDPT 2018 (CV 909 / CV 3089 / TT 86). Bước 1 và Bước 6 bắt buộc phải gắn với phân cảnh hoặc nhiệm vụ.
                </p>
              </div>
              {isWriter && (
                <button
                  type="button"
                  onClick={handleApplyDefaultSteps}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-semibold text-[10px]"
                >
                  Áp dụng mẫu 6 bước
                </button>
              )}
            </div>

            {/* Findings cảnh báo chung */}
            {findings.filter(f => f.ruleId === 'TECH-LESSON-ORDER').map((f, i) => (
              <div key={i} role="alert" className="p-2 bg-rose-50 border border-rose-300 text-rose-800 rounded font-semibold text-xs">
                [LỖI THỨ TỰ] {f.message}
              </div>
            ))}
            {findings.filter(f => f.ruleId === 'TECH-LESSON-STEPS').map((f, i) => (
              <div key={i} role="status" className="p-2 bg-amber-50 border border-amber-300 text-amber-800 rounded text-xs">
                [CẢNH BÁO TIẾN TRÌNH] {f.message}
              </div>
            ))}

            {/* Danh sách 6 bước */}
            <div className="space-y-3">
              {STANDARD_STEM_STEPS.map((stdStep) => {
                const currentStep = (brief.steps ?? []).find(s => s.stepKey === stdStep.key);
                const isStepPresent = Boolean(currentStep);
                const sceneIds = currentStep?.sceneIds ?? [];
                const activityKey = currentStep?.activityKey ?? '';
                const objectiveKeys = currentStep?.objectiveKeys ?? [];

                const openingErr = stdStep.key === 'OPENING_PROBLEM' && findings.find(f => f.ruleId === 'TECH-LESSON-OPENING' || f.field?.includes('OPENING_PROBLEM'));
                const closingErr = stdStep.key === 'CLOSING_SHARE_REFLECT' && findings.find(f => f.ruleId === 'TECH-LESSON-CLOSING' || f.field?.includes('CLOSING_SHARE_REFLECT'));
                const stepHasError = Boolean(openingErr || closingErr);

                return (
                  <div
                    key={stdStep.key}
                    data-testid={`lesson-step-${stdStep.key}`}
                    className={`p-3 rounded-lg border transition-colors ${
                      stepHasError
                        ? 'bg-rose-50/50 border-rose-300'
                        : isStepPresent
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : 'bg-slate-50 border-dashed border-slate-300 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{stdStep.label}</span>
                        <p className="text-[10px] text-slate-500">{stdStep.description}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isStepPresent ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {stdStep.key}
                      </span>
                    </div>

                    {/* Lỗi cụ thể từng ô */}
                    {openingErr && (
                      <p role="alert" className="text-rose-600 font-bold text-[10px] mt-1">
                        [TECH-LESSON-OPENING] {openingErr.message}
                      </p>
                    )}
                    {closingErr && (
                      <p role="alert" className="text-rose-600 font-bold text-[10px] mt-1">
                        [TECH-LESSON-CLOSING] {closingErr.message}
                      </p>
                    )}

                    {/* Phân cảnh liên kết */}
                    <div className="mt-2.5 space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-700">
                        Phân cảnh trong kịch bản liên kết (Scene IDs):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {scenes.map((sc) => {
                          const isBound = sceneIds.includes(sc.id);
                          return (
                            <label
                              key={sc.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] cursor-pointer ${
                                isBound
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                name={`step.${stdStep.key}.scene.${sc.id}`}
                                aria-label={`Cảnh ${sc.title || sc.id}`}
                                checked={isBound}
                                disabled={!isWriter}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...sceneIds, sc.id]
                                    : sceneIds.filter(id => id !== sc.id);
                                  handleUpdateStep(stdStep.key, { sceneIds: next });
                                }}
                                className="w-3 h-3 text-indigo-600 rounded"
                              />
                              <span className="truncate max-w-[140px]">{sc.title || sc.type}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nhiệm vụ học sinh & Mục tiêu */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                          Gắn nhiệm vụ học sinh (Activity):
                        </label>
                        <select
                          name={`step.${stdStep.key}.activityKey`}
                          aria-label={`Nhiệm vụ cho ${stdStep.key}`}
                          value={activityKey}
                          disabled={!isWriter}
                          onChange={(e) => handleUpdateStep(stdStep.key, { activityKey: e.target.value || null })}
                          className="w-full text-[10px] px-2 py-1 border border-slate-300 rounded bg-white"
                        >
                          <option value="">Không gắn nhiệm vụ</option>
                          {brief.studentTasks.map(t => (
                            <option key={t.key} value={t.key}>
                              {t.key} ({t.learnerAction?.slice(0, 30) || 'Chưa ghi'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                          Mục tiêu cần đạt liên kết:
                        </label>
                        <select
                          name={`step.${stdStep.key}.objectiveKeys`}
                          aria-label={`Mục tiêu cho ${stdStep.key}`}
                          value={objectiveKeys[0] || ''}
                          disabled={!isWriter}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateStep(stdStep.key, { objectiveKeys: val ? [val] : [] });
                          }}
                          className="w-full text-[10px] px-2 py-1 border border-slate-300 rounded bg-white"
                        >
                          <option value="">Không chọn mục tiêu</option>
                          {brief.objectives.map(o => (
                            <option key={o.key} value={o.key}>
                              {o.key} ({o.learnerAction?.slice(0, 30) || 'Chưa ghi'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'EVIDENCE' && (
          <fieldset disabled={isSaving} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700">
                Minh chứng thành tố STEM ({evidence.length}/200)
              </label>
              {isWriter && (
                <button
                  onClick={handleAddEvidence}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus className="w-3 h-3" /> Gán minh chứng
                </button>
              )}
            </div>

            {evidence.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Chưa có minh chứng thành tố S/T/E/M nào được gán.</p>
            ) : (
              <div className="space-y-2">
                {evidence.map((ev, idx) => (
                  <div key={ev.id || idx} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <select
                          name="evidence.component" value={ev.component}
                          onChange={(e) => handleUpdateEvidence(idx, { component: e.target.value as any })}
                          disabled={!isWriter}
                          className="px-2 py-0.5 text-xs font-bold rounded bg-indigo-100 text-indigo-900 border border-indigo-200"
                        >
                          <option value="S">S - Science</option>
                          <option value="T">T - Technology</option>
                          <option value="E">E - Engineering</option>
                          <option value="M">M - Mathematics</option>
                        </select>
                        <select
                          name="evidence.sceneId" value={ev.sceneId || ''}
                          onChange={(e) => handleUpdateEvidence(idx, { sceneId: e.target.value || null })}
                          disabled={!isWriter}
                          className="p-1 text-[11px] border border-slate-300 rounded bg-white"
                        >
                          <option value="">-- Ngoài clip (Task) --</option>{ev.sceneId&&!scenes.some(scene=>scene.id===ev.sceneId)&&<option value={ev.sceneId}>Orphan: {ev.sceneId}</option>}
                          {scenes.map((s, sIdx) => (
                            <option key={s.id} value={s.id}>
                              Cảnh #{sIdx + 1}: {s.title || s.id}
                            </option>
                          ))}
                        </select>
                      </div>
                      {isWriter && (
                        <button onClick={() => handleRemoveEvidence(idx)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {ev.sceneId&&!scenes.some(scene=>scene.id===ev.sceneId)&&<p role="alert">Minh chứng orphan: cảnh {ev.sceneId} không còn; cần xác nhận, không xóa ngầm.</p>}
                    <select name="evidence.taskKey" aria-label={`Task minh chứng ${idx+1}`} value={ev.taskKey??''} onChange={e=>handleUpdateEvidence(idx,{taskKey:e.target.value||null})}>
                      <option value="">Không gắn Task</option>{brief.studentTasks.map(t=><option key={t.key} value={t.key}>{t.key}</option>)}
                    </select>
                    <select name="evidence.objectiveKey" aria-label={`Mục tiêu minh chứng ${idx+1}`} value={ev.objectiveKey??''} onChange={e=>handleUpdateEvidence(idx,{objectiveKey:e.target.value||null})}>
                      <option value="">Không gắn mục tiêu</option>{brief.objectives.map(o=><option key={o.key} value={o.key}>{o.key}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Giải trình minh chứng (Explanation)..."
                      name="evidence.explanation" value={ev.explanation || ''}
                      onChange={(e) => handleUpdateEvidence(idx, { explanation: e.target.value.slice(0, 4000) })}
                      disabled={!isWriter}
                      className="w-full p-1.5 text-[11px] border border-slate-300 rounded bg-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        )}
      </div>

      </fieldset>
      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
        <button
          onClick={handleValidate}
          disabled={isValidating || rateLimitCountdown !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs disabled:opacity-50"
        >
          {rateLimitCountdown !== null ? (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Đợi {rateLimitCountdown}s
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" /> Kiểm tra quy tắc
            </>
          )}
        </button>

        {isWriter && (
          <button
            onClick={handleSaveBrief}
            disabled={isSaving || isLoading || Boolean(error) || rateLimitCountdown !== null || !loaded.current}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ (CAS)'}
          </button>
        )}
      </div>
    </div>
  );
});
