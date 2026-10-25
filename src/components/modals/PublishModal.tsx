import { useActionGuard } from '../../hooks/useActionGuard';
import { useDialog } from '../../hooks/useDialog';
import React, { useEffect, useRef, useState } from 'react';
import { Download, X, Youtube, Code } from 'lucide-react';
import { STEMScript } from '../../types/stem';
import { projectService } from '../../services/projectService';
import { publicationService } from '../../services/publicationService';

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
  const activeProject = useRef(script.id);
  activeProject.current = script.id;
  useEffect(() => { setEmbedCode(null); setPublished(false); }, [script.id]);
  const dialog = useDialog(isOpen, 'Xuất bản video', onClose, busy);

  if (!isOpen) return null;

  const publish = actions.wrap(async () => {
    if (busy || published) return;
    const projectId = script.id;
    setBusy(true);
    try {
      const result = await publicationService.publishInternal(script.id, script.title);
      if (activeProject.current === projectId) {
        setEmbedCode(result.lmsEmbedCode);
        setPublished(true);
      }
      if (activeProject.current !== projectId) return;
      onNotify('Đã xuất bản video vào thư viện nội bộ.', 'success');
      try { await onPublished?.(); }
      catch { onNotify('Đã xuất bản; hãy tải lại trang để cập nhật trạng thái.', 'info'); }
    } catch (error: any) {
      onNotify(error.message || 'Không xuất bản được video.', 'warn');
    } finally { setBusy(false); }
  });

  const download = actions.wrap(async () => {
    if (busy) return;
    setBusy(true);
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
      onNotify(error.message || 'Không tải được video.', 'warn');
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
        <button disabled={busy || !script.videoUrl} onClick={download}
          className="bg-brand-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50">
          <Download size={18} /> {busy ? 'Đang lấy video…' : 'Mở / tải video MP4'}
        </button>
        {!script.videoUrl && <p className="text-sm text-amber-700">Chưa có video. Dịch vụ kết xuất phải được cấu hình trước.</p>}
        <div className="border-t pt-4 text-sm text-slate-600 space-y-3">
          <p className="flex items-center gap-2"><Youtube size={18} /> Xuất YouTube chưa khả dụng; cần kết nối kênh bằng OAuth.</p>
          <button disabled={busy || published || !canPublish || script.videoStatus !== 'APPROVED'} onClick={publish}
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
