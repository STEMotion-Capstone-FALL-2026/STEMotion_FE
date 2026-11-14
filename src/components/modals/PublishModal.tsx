import { useActionGuard } from '../../hooks/useActionGuard';
import { useDialog } from '../../hooks/useDialog';
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, X, Youtube, Code } from 'lucide-react';
import { STEMScript } from '../../types/stem';
import { projectService } from '../../services/projectService';
import { publicationService } from '../../services/publicationService';
import { getArtifactStatus, artifactExpectation, stemMutationKey } from '../../services/stemClient';
import type { StemArtifactStatus } from '../../types/stem';
import { ApiError } from '../../services/apiClient';
import { StemErrorNotice } from '../stem/StemErrorNotice';
import { freshnessLabel, integrityLabel, reasonLabel } from '../stem/stemLabels';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: STEMScript;
  onNotify: (message: string, type?: 'success' | 'info' | 'warn') => void;
  selectedScene?: any;
  canPublish?: boolean;
  onPublished?: () => Promise<void>;
}

/** Download the existing server artifact. Rendering is requested in Producer. */
export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, script, onNotify, canPublish = false, onPublished }) => {
  const actions = useActionGuard();
  const [busy, setBusy] = useState(false);
  const [embedCode, setEmbedCode] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [artifact,setArtifact]=useState<StemArtifactStatus|null>(null);
  const [acknowledged,setAcknowledged]=useState(false);
  const [publicationError,setPublicationError]=useState<unknown>(null);
  const publishRetry=useRef<{payload:string;key:string}|null>(null);
  useEffect(()=>{
    let current=true;let timer:ReturnType<typeof setTimeout>|null=null;
    setArtifact(null);setAcknowledged(false);setPublicationError(null);publishRetry.current=null;
    const poll=()=>{
      void getArtifactStatus(script.id).then(value=>{
        if(!current)return;
        setArtifact(value);
        const isOffMode=value.snapshotOrigin?.capturedMode==='OFF'&&value.snapshotOrigin?.effectiveMode==='OFF';
        if(isOffMode)setAcknowledged(true);
        if(!value.publishEligibility.allowed&&isOffMode){
          timer=setTimeout(poll,1000);
        }
      }).catch(()=>{});
    };
    if(isOpen&&canPublish&&script.videoStatus==='APPROVED')poll();
    return()=>{current=false;if(timer)clearTimeout(timer);};
  },[isOpen,canPublish,script.id,script.videoUrl,script.videoStatus]);
  const activeProject = useRef(script.id);
  activeProject.current = script.id;
  useEffect(() => { setEmbedCode(null); setPublished(false); setInlineError(null); }, [script.id]);
  const dialog = useDialog(isOpen, 'Xuất bản video', onClose, busy);

  if (!isOpen) return null;

  const publish = actions.wrap(async () => {
    if (busy || published) return;
    const projectId = script.id;
    setBusy(true);
    setInlineError(null);
    setPublicationError(null);
    try {
      if(artifact?.integrity==='MISMATCH'||artifact?.publishEligibility.route==='BLOCKED')throw new Error('Artifact không khớp nội dung đã duyệt; cần tải lại và duyệt đúng phiên bản.');
      if(artifact?.publishEligibility.requiresLegacyAcknowledgement&&!acknowledged)throw new Error('Cần xác nhận xuất bản nội dung chưa thẩm định.');
      const expectation=artifact?artifactExpectation(artifact):undefined;
      const payload=JSON.stringify([script.id,script.title,acknowledged,expectation]);
      if(publishRetry.current?.payload!==payload)publishRetry.current={payload,key:stemMutationKey()};
      let result;
      if (artifact) {
        result = await publicationService.publishInternal(script.id,script.title,{legacyUnverifiedAcknowledged:acknowledged,artifactExpectation:expectation,idempotencyKey:publishRetry.current.key});
      } else {
        try {
          result = await publicationService.publishInternal(script.id, script.title);
        } catch (err: any) {
          if (err instanceof ApiError && err.code === 'STEM_STALE_TARGET' && (err.details as any)?.reason === 'LEGACY_ACK_REQUIRED') {
            const loaded = await getArtifactStatus(script.id);
            setArtifact(loaded);
            if (loaded.snapshotOrigin?.capturedMode === 'OFF' && loaded.snapshotOrigin?.effectiveMode === 'OFF') {
              setAcknowledged(true);
              const exp = artifactExpectation(loaded);
              result = await publicationService.publishInternal(script.id, script.title, { legacyUnverifiedAcknowledged: true, artifactExpectation: exp, idempotencyKey: stemMutationKey() });
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
      if (activeProject.current === projectId) {
        setEmbedCode(result.lmsEmbedCode);
        setPublished(true);
      }
      if (activeProject.current !== projectId) return;
      onNotify('Đã xuất bản video vào thư viện nội bộ.', 'success');
      try { await onPublished?.(); }
      catch { onNotify('Đã xuất bản; hãy tải lại trang để cập nhật trạng thái.', 'info'); }
    } catch (error: any) {
      const msg = error.message || 'Không xuất bản được video.';
      if (activeProject.current === projectId) {
        if(error instanceof ApiError)setPublicationError(error);else setInlineError(msg);
      }
      onNotify(msg, 'warn');
    } finally { setBusy(false); }
  });

  const download = actions.wrap(async () => {
    if (busy) return;
    setBusy(true);
    setInlineError(null);
    try {
      const latest = await projectService.getProjectById(script.id);
      if (!latest.videoUrl) throw new Error('Chưa có video đã kết xuất. Hãy kết xuất từ Producer Studio.');
      const url = new URL(latest.videoUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL video không hợp lệ.');
      // Keep signed object-storage URLs intact; adding query params invalidates them.
      const link = document.createElement('a');
      link.href = url.href;
      link.download = `${latest.title || 'STEMotion'}.mp4`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
      onNotify('Đã mở video trên máy chủ. Trình duyệt có thể yêu cầu chọn Lưu video.', 'info');
    } catch (error: any) {
      const msg = error.message || 'Không tải được video.';
      setInlineError(msg);
      onNotify(msg, 'warn');
    } finally { setBusy(false); }
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div ref={dialog} className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl">Video: {script.title}</h2>
          <button onClick={onClose} disabled={busy} aria-label="Đóng"><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-600">Trạng thái: {script.videoStatus}. File tải xuống là video đã kết xuất trên máy chủ.</p>
        {artifact&&<div className="text-sm space-y-1"><p>Trạng thái video: {integrityLabel(artifact.integrity)} · {freshnessLabel(artifact.freshness)} · nội dung chưa thẩm định</p>
          {artifact.reasons.map(reason=><p key={reason}>{reasonLabel(reason)}</p>)}
          {artifact.publishEligibility.requiresLegacyAcknowledgement&&artifact.integrity!=='MISMATCH'&&<label><input type="checkbox" checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/>Tôi xác nhận xuất bản nội dung chưa được thẩm định STEM.</label>}
        </div>}

        {/* Inline error banner — shown directly inside the modal on failure */}
        <StemErrorNotice error={publicationError} onReload={()=>{
          void getArtifactStatus(script.id).then(result=>{setArtifact(result);setAcknowledged(false);setPublicationError(null);}).catch(error=>setPublicationError(error));
        }} onRetryReady={()=>setPublicationError(null)}/>
        {inlineError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{inlineError}</span>
          </div>
        )}

        <button disabled={busy || !script.videoUrl} onClick={download}
          className="bg-brand-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50">
          <Download size={18} /> {busy ? 'Đang lấy video…' : 'Mở / tải video MP4'}
        </button>
        {!script.videoUrl && <p className="text-sm text-amber-700">Chưa có video. Dịch vụ kết xuất phải được cấu hình trước.</p>}
        <div className="border-t pt-4 text-sm text-slate-600 space-y-3">
          <p className="flex items-center gap-2"><Youtube size={18} /> Xuất YouTube chưa khả dụng; cần kết nối kênh bằng OAuth.</p>
          <button disabled={busy || published || !canPublish || script.videoStatus !== 'APPROVED' || Boolean(publicationError) || artifact?.integrity==='MISMATCH' || artifact?.publishEligibility.route==='BLOCKED' || Boolean(artifact?.publishEligibility.requiresLegacyAcknowledgement&&!acknowledged)} onClick={publish}
            className="bg-emerald-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">
            {published || script.videoStatus === 'PUBLISHED' ? 'Đã xuất bản vào thư viện' : 'Xuất bản vào thư viện & lấy mã nhúng LMS'}
          </button>
          {!canPublish && <p>Producer hoặc Admin có quyền xuất bản video đã duyệt.</p>}
          {embedCode && <label className="block"><span className="flex items-center gap-2"><Code size={18} /> Mã nhúng LMS</span>
            <textarea readOnly value={embedCode} aria-label="Mã nhúng LMS" className="w-full border rounded p-2 mt-2" />
          </label>}
        </div>
      </div>
    </div>
  );
};
