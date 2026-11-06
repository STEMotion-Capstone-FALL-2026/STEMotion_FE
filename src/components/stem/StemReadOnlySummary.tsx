import React, { useEffect, useState } from 'react';
import type { STEMScript, StemViewResponse } from '../../types/stem';
import { scriptService } from '../../services/scriptService';
import { useStemTarget } from './useStemTarget';
import { StemErrorNotice } from './StemErrorNotice';
import { getArtifactStatus } from '../../services/stemClient';
import { reviewService } from '../../services/reviewService';
import type { StemArtifactStatus } from '../../types/stem';

export function StemReadOnlySummary({script,compositionVersionNo,compositionRevision}:{script:STEMScript;compositionVersionNo?:number;compositionRevision?:number}) {
  const {target,error:targetError}=useStemTarget(script.id,script.currentVersionNo??script.version);
  const [view,setView]=useState<StemViewResponse|null>(null);
  const [error,setError]=useState<unknown>(null);
  const [reload,setReload]=useState(0);
  const [artifact,setArtifact]=useState<StemArtifactStatus|null>(null);
  const [artifactError,setArtifactError]=useState(false);
  const [qa,setQa]=useState<Awaited<ReturnType<typeof reviewService.getQaReport>>|null>(null);
  useEffect(()=>{
    let current=true;setArtifact(null);setQa(null);setArtifactError(false);
    void getArtifactStatus(script.id).then(result=>{if(current)setArtifact(result);}).catch(()=>{if(current)setArtifactError(true);});
    if(script.videoUrl)void reviewService.getQaReport(script.id).then(result=>{if(current)setQa(result);}).catch(()=>{});
    return()=>{current=false;};
  },[script.id,script.videoUrl,script.videoStatus,script.draftRevision,compositionRevision,reload]);
  useEffect(()=>{
    let current=true;setView(null);setError(null);
    if(target)void scriptService.getStemBrief(script.id,target.versionId).then(result=>{if(current)setView(result);}).catch(err=>{if(current)setError(err);});
    return()=>{current=false;};
  },[script.id,target?.versionId,script.draftRevision,reload]);
  return <details className="border border-amber-200 bg-amber-50 p-3 text-xs" open><summary>Hồ sơ STEM — chỉ đọc · DRAFT/UNVERIFIED</summary>
    <StemErrorNotice error={targetError??error} onReload={()=>setReload(n=>n+1)}/>
    {artifact?<div aria-label="Trạng thái artifact STEM">
      <p>{artifact.freshness} · {artifact.classification} · integrity {artifact.integrity} · UNVERIFIED</p>
      <p>Xuất bản: {artifact.publishEligibility.route}{artifact.publishEligibility.requiresLegacyAcknowledgement?' — cần xác nhận nội dung chưa thẩm định':''}</p>
      <p>Snapshot: {artifact.snapshotOrigin.snapshotId??'Legacy/chưa có'} · mode lúc chụp {artifact.snapshotOrigin.capturedMode??'Không rõ'} · hiện tại {artifact.snapshotOrigin.effectiveMode??'Không rõ'}</p>
      {artifact.reasons.map(reason=><p key={reason}>{reason}</p>)}
    </div>:artifactError?<p>Chưa đọc được trạng thái artifact; máy chủ kiểm tra lại khi duyệt/xuất bản.</p>:<p>Đang đọc trạng thái artifact…</p>}
    {qa&&<div aria-label="Media QA"><p>Media QA: {qa.passed?'PASS':'FAIL'} · {qa.failCount} lỗi · {qa.warnCount} cảnh báo. Kết quả kỹ thuật không chứng nhận STEM.</p><p>QA input: {qa.evaluatedAgainst?.snapshotId??'Legacy/chưa có snapshot'} · job {qa.evaluatedAgainst?.jobId??'Không rõ'}</p></div>}
    {compositionVersionNo!==undefined&&target&&compositionVersionNo!==target.versionNo?<p role="alert">NEEDS_REVIEW: bản dựng v{compositionVersionNo} khác script hiện tại v{target.versionNo}; tóm tắt dưới đây chưa xác nhận cho bản dựng này.</p>:null}
    {!view?<p>Chưa tải được trạng thái STEM.</p>:<>
      <p>{view.readiness} · {view.effectiveMode} · brief revision {view.revision} · mode revision {view.modeRevision}</p>
      {!view.brief?<p>Legacy/chưa có brief. Không tự suy bối cảnh.</p>:<>
        <p>Bối cảnh chính: {view.brief.context.primary?.key??'Chưa chọn'} · {view.brief.context.primary?.condition}</p>
        {view.brief.context.secondary.map((c,i)=><p key={i}>Phụ: {c.key} · {c.condition} · {c.adaptations}</p>)}
        <p>Kênh: {view.brief.distributionChannels.join(', ')||'Chưa chọn'}</p>
        <p>Phạm vi: {view.brief.scopeOfClip}</p><p>An toàn: {view.brief.safetyNotes}</p>
        <p>Policy đã pin: {view.brief.policyVersionId??'Chưa chọn'}</p>
        <ul>{view.brief.objectives.map(o=><li key={o.key}>{o.key}: {o.learnerAction} — {o.observableEvidence}</li>)}</ul>
        {view.brief.contributions.map(c=><p key={c.component}>{c.component}: {c.explanation}</p>)}
      </>}
      <ul className={view.effectiveMode==='OFF'?'opacity-60':''}>{view.findings.map((f,i)=><li key={i}>[{f.ruleId}] {f.field}: {f.message}</li>)}</ul>
      <p>Findings là cảnh báo OFF/ADVISORY; không chứng nhận STEM hoặc thay đổi logic duyệt video.</p>
    </>}
  </details>;
}
