import React, { useEffect, useState } from 'react';
import type { STEMScript, StemViewResponse } from '../../types/stem';
import { scriptService } from '../../services/scriptService';
import { useStemTarget } from './useStemTarget';
import { StemErrorNotice } from './StemErrorNotice';
import { getArtifactStatus } from '../../services/stemClient';
import { reviewService } from '../../services/reviewService';
import type { StemArtifactStatus } from '../../types/stem';
import { channelLabel, componentLabel, contextLabel, fieldLabel, findingMessage, freshnessLabel, integrityLabel, modeLabel, readinessLabel, reasonLabel, routeLabel, severityLabel } from './stemLabels';

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
  const blocked=artifact?.integrity==='MISMATCH'||artifact?.publishEligibility.route==='BLOCKED';
  const stale=artifact?.freshness==='NEEDS_REVIEW';
  const modeChanged=Boolean(artifact?.snapshotOrigin.capturedMode&&artifact?.snapshotOrigin.effectiveMode&&artifact.snapshotOrigin.capturedMode!==artifact.snapshotOrigin.effectiveMode);
  const tone=blocked?'border-rose-200 bg-rose-50 text-rose-800':stale?'border-amber-300 bg-amber-100 text-amber-900':'border-emerald-200 bg-emerald-50 text-emerald-800';
  const brief=view?.brief;
  return <details className="border border-amber-200 bg-amber-50 p-3 text-xs space-y-2" open><summary className="font-semibold">Hồ sơ STEM · Bản nháp, chưa thẩm định</summary>
    <StemErrorNotice error={targetError??error} onReload={()=>setReload(n=>n+1)}/>
    <section aria-label="Tình trạng STEM" className="space-y-1">
      {artifact?<div aria-label="Trạng thái artifact STEM" className={`rounded border px-2 py-1 ${tone}`}>
        <p className="font-semibold">{routeLabel(artifact.publishEligibility.route)} · {freshnessLabel(artifact.freshness)}</p>
        <p>{integrityLabel(artifact.integrity)}{artifact.publishEligibility.requiresLegacyAcknowledgement&&!blocked?' · cần xác nhận nội dung chưa thẩm định khi xuất bản':''}</p>
        {modeChanged&&<p>Chế độ STEM đã đổi từ {modeLabel(artifact.snapshotOrigin.capturedMode)} (lúc tạo video) sang {modeLabel(artifact.snapshotOrigin.effectiveMode)}.</p>}
        {artifact.reasons.map(reason=><p key={reason}>{reasonLabel(reason)}</p>)}
      </div>:artifactError?<p>Chưa đọc được trạng thái video; máy chủ sẽ kiểm tra lại khi duyệt hoặc xuất bản.</p>:<p>Đang đọc trạng thái video…</p>}
      {qa&&<p aria-label="Media QA">Kiểm tra kỹ thuật video: {qa.passed?'Đạt':'Chưa đạt'} · {qa.failCount} lỗi · {qa.warnCount} cảnh báo. Kết quả kỹ thuật không phải chứng nhận STEM.</p>}
      {compositionVersionNo!==undefined&&target&&compositionVersionNo!==target.versionNo?<p role="alert" className="font-semibold text-amber-900">Bản dựng v{compositionVersionNo} khác kịch bản hiện tại v{target.versionNo}; cần rà soát lại trước khi duyệt.</p>:null}
      {view?<p>{readinessLabel(view.readiness)} · Chế độ STEM: {modeLabel(view.effectiveMode)}</p>:<p>Chưa tải được hồ sơ STEM.</p>}
    </section>
    {view&&<>
      <section aria-label="Nội dung bài học" className="space-y-1">
        <p className="font-semibold">Nội dung bài học</p>
        {!brief?<p>Dự án chưa có hồ sơ STEM; hệ thống không tự suy ra bối cảnh từ dữ liệu cũ.</p>:<>
          <p>Bối cảnh chính: {brief.context.primary?contextLabel(brief.context.primary.key):'Chưa chọn'}{brief.context.primary?.condition?` — ${brief.context.primary.condition}`:''}</p>
          {brief.context.secondary.map((c,i)=><p key={i}>Bối cảnh phụ: {contextLabel(c.key)}{c.condition?` — ${c.condition}`:''}{c.adaptations?` (điều chỉnh: ${c.adaptations})`:''}</p>)}
          <p>Kênh sử dụng: {brief.distributionChannels.length?brief.distributionChannels.map(channelLabel).join(', '):'Chưa chọn'}</p>
          <p>Phạm vi clip: {brief.scopeOfClip||'Chưa ghi'}</p>
          <p>Lưu ý an toàn: {brief.safetyNotes||'Chưa ghi'}</p>
          {brief.objectives.length>0&&<ul className="list-disc pl-4">{brief.objectives.map(o=><li key={o.key}>Học sinh {o.learnerAction||'(chưa ghi hành động)'} — minh chứng: {o.observableEvidence||'chưa ghi'}</li>)}</ul>}
          {brief.contributions.map(c=><p key={c.component}>{componentLabel(c.component)}: {c.explanation||'Chưa giải thích'}</p>)}
        </>}
      </section>
      <section aria-label="Kiểm tra STEM" className="space-y-1">
        <p className="font-semibold">Kiểm tra STEM</p>
        {view.findings.length===0?<p>Không có ghi chú nào.</p>:
          <ul className={view.effectiveMode==='OFF'?'opacity-60':''}>{view.findings.map((f,i)=><li key={i}><span className={f.severity==='ERROR'?'font-semibold text-rose-700':'text-amber-800'}>{severityLabel(f.severity)}</span> · {fieldLabel(f.field)}: {findingMessage(f)}</li>)}</ul>}
        <p>Kết quả kiểm tra không phải chứng nhận STEM{view.effectiveMode==='STRICT'?'':' và không chặn việc duyệt ở chế độ hiện tại'}.</p>
      </section>
    </>}
    <details aria-label="Chi tiết kỹ thuật" className="border-t border-amber-200 pt-1 text-[11px] text-slate-600">
      <summary>Chi tiết kỹ thuật</summary>
      {artifact&&<>
        <p>Mã snapshot: {artifact.snapshotOrigin.snapshotId??'chưa có (dự án cũ)'}</p>
        <p>Mode lúc chụp: {artifact.snapshotOrigin.capturedMode||'không rõ'} · mode hiện tại: {artifact.snapshotOrigin.effectiveMode||'không rõ'}</p>
        <p>freshness {artifact.freshness} · classification {artifact.classification} · integrity {artifact.integrity} · route {artifact.publishEligibility.route}</p>
        {artifact.reasons.length>0&&<p>reasons: {artifact.reasons.join(', ')}</p>}
      </>}
      {qa&&<p>QA đối chiếu snapshot {qa.evaluatedAgainst?.snapshotId??'chưa có'} · job {qa.evaluatedAgainst?.jobId??'không rõ'}</p>}
      {view&&<p>readiness {view.readiness} · mode {view.effectiveMode} · brief revision {view.revision} · mode revision {view.modeRevision}</p>}
      {brief&&<p>Policy: {brief.policyVersionId??'chưa chọn'}</p>}
      {view?.findings.map((f,i)=><p key={i}>[{f.ruleId}] {f.field}</p>)}
    </details>
  </details>;
}
