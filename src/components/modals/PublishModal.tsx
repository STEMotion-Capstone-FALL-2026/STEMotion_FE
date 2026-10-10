import React, { useState } from 'react';
import { Download, X, Youtube, Code } from 'lucide-react';
import { STEMScript } from '../../types/stem';
import { projectService } from '../../services/projectService';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: STEMScript;
  onNotify: (message: string, type?: 'success' | 'info' | 'warn') => void;
  selectedScene?: any;
}

/** Download the existing server artifact. Rendering is requested in Producer. */
export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, script, onNotify }) => {
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;

  const download = async () => {
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
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl">Video: {script.title}</h2>
          <button onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-600">Trạng thái: {script.videoStatus}. File tải xuống là video đã kết xuất trên máy chủ.</p>
        <button disabled={busy || !script.videoUrl} onClick={download}
          className="bg-brand-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50">
          <Download size={18} /> {busy ? 'Đang lấy video…' : 'Mở / tải video MP4'}
        </button>
        {!script.videoUrl && <p className="text-sm text-amber-700">Chưa có video. Dịch vụ kết xuất phải được cấu hình trước.</p>}
        <div className="border-t pt-4 text-sm text-slate-600 space-y-3">
          <p className="flex items-center gap-2"><Youtube size={18} /> Xuất YouTube chưa khả dụng; cần kết nối kênh bằng OAuth.</p>
          <p className="flex items-center gap-2"><Code size={18} /> Mã nhúng LMS chưa khả dụng.</p>
        </div>
      </div>
    </div>
  );
};