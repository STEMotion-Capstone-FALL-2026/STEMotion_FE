import React from 'react';
import {scriptService} from '../../services/scriptService';
import type {GroundedAiResult} from '../../types/stem';
import {StemErrorNotice} from './StemErrorNotice';

export function StemGroundedAiPanel({projectId,isWriter}: {projectId:string;isWriter:boolean}) {
  const [operation,setOperation]=React.useState<GroundedAiResult['operation']>('terms');
  const [result,setResult]=React.useState<GroundedAiResult|null>(null);
  const [busy,setBusy]=React.useState(false);const [error,setError]=React.useState<unknown>(null);const [decision,setDecision]=React.useState('');
  const request=React.useRef(0);
  React.useEffect(()=>{request.current++;setResult(null);setDecision('');setError(null);setBusy(false);return()=>{request.current++;};},[projectId]);
  const generate=async()=>{
    const id=++request.current;setBusy(true);setError(null);setResult(null);setDecision('');
    try {
      const target=await scriptService.getStemTarget(projectId);const brief=await scriptService.getStemBrief(projectId,target.versionId);
      if(!brief.briefId)throw new Error('Cần lưu hồ sơ STEM nháp trước khi yêu cầu gợi ý.');
      const value=await scriptService.getGroundedSuggestion(projectId,operation,{scriptVersionId:target.versionId,expectedScriptRevision:target.scriptRevision,expectedBriefRevision:brief.revision,expectedModeRevision:brief.modeRevision});
      if(request.current===id)setResult(value);
    }catch(e){if(request.current===id)setError(e);}finally{if(request.current===id)setBusy(false);}
  };
  const decide=async(value:'ACCEPTED'|'IGNORED')=>{
    if(!result?.requestId)return;const id=request.current;setBusy(true);setError(null);
    try{await scriptService.decideAiRequest(result.requestId,value,{projectId,target:result.grounding.target,contextDigest:result.grounding.contextDigest});if(id===request.current)setDecision(value);}catch(e){if(id===request.current)setError(e);}finally{if(id===request.current)setBusy(false);}
  };
  return <section aria-label="AI theo hồ sơ STEM" className="mt-5 rounded-xl border bg-white p-4 space-y-3 text-sm">
    <h3 className="font-semibold">AI theo hồ sơ STEM</h3>
    <p>Gợi ý nháp, chưa thẩm định. AI dùng bản kịch bản và hồ sơ đã lưu trên máy chủ. Hãy lưu thay đổi trước khi yêu cầu.</p>
    <label>Loại gợi ý <select aria-label="Loại gợi ý STEM" value={operation} disabled={busy} onChange={e=>setOperation(e.target.value as GroundedAiResult['operation'])}>
      <option value="generate">Gợi ý kịch bản</option><option value="resegment">Gợi ý phân cảnh</option><option value="grade">Ngôn ngữ theo lớp</option><option value="extract">Khái niệm STEM</option><option value="terms">Thuật ngữ và điểm cần xem lại</option>
    </select></label>
    <button type="button" disabled={!isWriter||busy} onClick={()=>void generate()}>{busy?'Đang xử lý…':'Yêu cầu gợi ý theo hồ sơ'}</button>
    <StemErrorNotice error={error} onReload={()=>{setError(null);setResult(null);}} onRetryReady={()=>setError(null)}/>
    {error!=null&&<p>Bạn vẫn có thể chỉnh sửa và lưu kịch bản thủ công.</p>}
    {result&&<><p>Chưa thẩm định · Mục tiêu: {result.grounding.objectiveKeys.join(', ')||'Chưa khai báo'} · Nhiệm vụ: {result.grounding.activityKeys.join(', ')||'Chưa khai báo'}</p>
      <pre className="whitespace-pre-wrap max-h-80 overflow-auto">{JSON.stringify(result.result,null,2)}</pre>
      <p>Chấp nhận chỉ ghi nhận lựa chọn. Kịch bản chưa tự thay đổi; hãy biên tập và dùng Lưu nháp hiện hữu.</p>
      {result.requestId&&!decision&&<><button disabled={busy} onClick={()=>void decide('ACCEPTED')}>Chấp nhận gợi ý STEM</button><button disabled={busy} onClick={()=>void decide('IGNORED')}>Bỏ qua gợi ý STEM</button></>}
      {decision&&<p role="status">Đã ghi nhận lựa chọn. Kịch bản chưa tự thay đổi.</p>}
    </>}
  </section>;
}
