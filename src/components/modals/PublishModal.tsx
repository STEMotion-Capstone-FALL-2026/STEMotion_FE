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
import { workspaceService } from '../../services/workspaceService';
import type { PublicationResponse } from '../../services/publicationService';
import { YouTubeChannelPanel } from '../youtube/YouTubeChannelPanel';
import { YouTubeMetadataForm, initialYouTubeForm, toMetadata, youtubeFormProblem, type YouTubeFormState } from '../youtube/YouTubeMetadataForm';
import { YouTubeUploadStatus } from '../youtube/YouTubeUploadStatus';
import { isYoutubeUnavailable, youtubeErrorMessage } from '../youtube/youtubeErrors';

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
  const [youtubeOn,setYoutubeOn]=useState(false);
  const [ytForm,setYtForm]=useState<YouTubeFormState>(()=>initialYouTubeForm(script.title));
  const [ytError,setYtError]=useState<string|null>(null);
  const [ytUnavailable,setYtUnavailable]=useState(false);
  const [ytResult,setYtResult]=useState<PublicationResponse|null>(null);
  const [ytRetrying,setYtRetrying]=useState(false);
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
  useEffect(() => {
    setEmbedCode(null); setPublished(false); setInlineError(null);
    setYoutubeOn(false); setYtForm(initialYouTubeForm(script.title)); setYtError(null); setYtResult(null); setYtRetrying(false);
  }, [script.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const workspaceId = script.workspaceId || workspaceService.getCachedWorkspaceId() || '';
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
      const withYoutube=youtubeOn&&!ytUnavailable;
      if(withYoutube){const problem=youtubeFormProblem(ytForm);if(problem)throw new Error(problem);}
      setYtError(null);
      const payload=JSON.stringify([script.id,script.title,acknowledged,expectation,withYoutube?ytForm:null]);
      if(publishRetry.current?.payload!==payload)publishRetry.current={payload,key:stemMutationKey()};
      type Options={legacyUnverifiedAcknowledged:boolean;artifactExpectation?:import('../../types/stem').StemArtifactExpectation;idempotencyKey:string};
      const retryKey=publishRetry.current.key;
      // With YouTube the same request also publishes to the library: the API only publishes an APPROVED clip once.
      const send=(options?:Options)=>withYoutube
        ?publicationService.publishYoutube(script.id,toMetadata(ytForm),{retryFailedUpload:false,idempotencyKey:options?.idempotencyKey??retryKey,legacyUnverifiedAcknowledged:options?.legacyUnverifiedAcknowledged,artifactExpectation:options?.artifactExpectation})
        :options?publicationService.publishInternal(script.id,script.title,options):publicationService.publishInternal(script.id,script.title);
      let result;
      if (artifact) {
        result = await send({legacyUnverifiedAcknowledged:acknowledged,artifactExpectation:expectation,idempotencyKey:retryKey});
      } else {
        try {
          result = await send();
        } catch (err: any) {
          if (err instanceof ApiError && err.code === 'STEM_STALE_TARGET' && (err.details as any)?.reason === 'LEGACY_ACK_REQUIRED') {
            const loaded = await getArtifactStatus(script.id);
            setArtifact(loaded);
            if (loaded.snapshotOrigin?.capturedMode === 'OFF' && loaded.snapshotOrigin?.effectiveMode === 'OFF') {
              setAcknowledged(true);
              const exp = artifactExpectation(loaded);
              result = await send({ legacyUnverifiedAcknowledged: true, artifactExpectation: exp, idempotencyKey: stemMutationKey() });
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
        if (withYoutube) setYtResult(result);
      }
      if (activeProject.current !== projectId) return;
      onNotify(withYoutube ? 'Đã xuất bản vào thư viện; video đang được gửi lên YouTube.' : 'Đã xuất bản video vào thư viện nội bộ.', 'success');
      try { await onPublished?.(); }
      catch { onNotify('Đã xuất bản; hãy tải lại trang để cập nhật trạng thái.', 'info'); }
    } catch (error: any) {
      const youtubeMsg = youtubeOn ? youtubeErrorMessage(error) : null;
      if (youtubeMsg) {
        // Nothing was published: the API checks YouTube before anything else. The library-only path stays open.
        if (activeProject.current === projectId) {
          setYtError(youtubeMsg);
          if (isYoutubeUnavailable(error)) { setYtUnavailable(true); setYoutubeOn(false); }
        }
        onNotify(youtubeMsg, 'warn');
        return;
      }
      const msg = error.message || 'Không xuất bản được video.';
      if (activeProject.current === projectId) {
        if(error instanceof ApiError)setPublicationError(error);else setInlineError(msg);
      }
      onNotify(msg, 'warn');
    } finally { setBusy(false); }
  });

  const retryYoutube = actions.wrap(async () => {
    if (busy) return;
    const problem = youtubeFormProblem(ytForm);
    if (problem) { setYtError(problem); return; }
    const projectId = script.id;
    setBusy(true); setYtError(null);
    try {
      const result = await publicationService.publishYoutube(script.id, toMetadata(ytForm), {
        retryFailedUpload: true, idempotencyKey: stemMutationKey(),
        ...(artifact ? { legacyUnverifiedAcknowledged: acknowledged, artifactExpectation: artifactExpectation(artifact) } : {}),
      });
      if (activeProject.current !== projectId) return;
      setYtResult(result); setYtRetrying(false);
      onNotify('Đã gửi lại video lên YouTube.', 'info');
    } catch (error: any) {
      const msg = youtubeErrorMessage(error) ?? error.message ?? 'Không gửi lại được lên YouTube.';
      if (activeProject.current === projectId) setYtError(msg);
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
          {canPublish && script.videoStatus === 'APPROVED' && !published && (ytUnavailable
            ? <p className="flex items-center gap-2"><Youtube size={18} /> YouTube đang tắt trên máy chủ; chỉ xuất bản vào thư viện.</p>
            : <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <button type="button" aria-pressed={youtubeOn} disabled={busy} onClick={() => { setYoutubeOn(on => !on); setYtError(null); }}
                  className="flex items-center gap-2 font-semibold text-rose-700 disabled:opacity-50">
                  <Youtube size={18} /> {youtubeOn ? 'Bỏ đăng kèm YouTube' : 'Đăng kèm lên YouTube'}
                </button>
                {youtubeOn && <>
                  {workspaceId && <YouTubeChannelPanel workspaceId={workspaceId} canManage={canPublish} onNotify={onNotify} />}
                  <YouTubeMetadataForm value={ytForm} onChange={setYtForm} disabled={busy} />
                  <p className="text-xs text-slate-500">Bấm xuất bản thì video vào thư viện và được gửi lên YouTube cùng lúc.</p>
                </>}
              </div>)}
          {ytError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">{ytError}</p>}
          {(published || script.videoStatus === 'PUBLISHED') && <YouTubeUploadStatus projectId={script.id} initial={ytResult}
            onRetry={canPublish ? () => { setYtRetrying(true); setYtError(null); } : undefined} retryDisabled={busy || ytRetrying} />}
          {ytRetrying && <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            <YouTubeMetadataForm value={ytForm} onChange={setYtForm} disabled={busy} />
            <div className="flex gap-2">
              <button type="button" onClick={retryYoutube} disabled={busy} className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">Gửi lại lên YouTube</button>
              <button type="button" onClick={() => setYtRetrying(false)} disabled={busy} className="rounded-lg border px-3 py-1.5">Hủy</button>
            </div>
          </div>}
          <button disabled={busy || published || !canPublish || script.videoStatus !== 'APPROVED' || Boolean(publicationError) || artifact?.integrity==='MISMATCH' || artifact?.publishEligibility.route==='BLOCKED' || Boolean(artifact?.publishEligibility.requiresLegacyAcknowledgement&&!acknowledged) || Boolean(youtubeOn && youtubeFormProblem(ytForm))} onClick={publish}
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
