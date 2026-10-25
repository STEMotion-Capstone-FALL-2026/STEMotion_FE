import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useDialog } from '../../hooks/useDialog';

export const VersionDiffModal: React.FC<{ isOpen: boolean; onClose: () => void; projectId: string }> = ({ isOpen, onClose, projectId }) => {
  const dialog = useDialog(isOpen, 'So sánh lịch sử phiên bản', onClose);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadedFor, setLoadedFor] = useState('');
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [diff, setDiff] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!isOpen || !projectId) return;
    let active = true;
    setVersions([]); setDiff(null); setError(''); setLoading(true); setLeft(''); setRight('');
    projectService.getVersions(projectId).then(rows => {
      if (!active) return;
      setVersions(rows);
      setLoadedFor(projectId);
      if (rows.length >= 2) { setLeft(rows[1].id); setRight(rows[0].id); }
    }).catch(err => { if (active) setError(err.message || 'Không tải được lịch sử phiên bản.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, projectId, retry]);
  useEffect(() => {
    if (!isOpen || loadedFor !== projectId || !left || !right) return;
    let active = true;
    setLoading(true); setError(''); setDiff(null);
    projectService.diffVersions(projectId, left, right).then(data => { if (active) setDiff(data); })
      .catch(err => { if (active) setError(err.message || 'Không tải được nội dung so sánh.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, projectId, loadedFor, left, right]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-slate-900/50 p-4 flex items-center justify-center">
    <div ref={dialog} className="bg-white rounded-2xl p-5 w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-4">
      <div className="flex justify-between items-center"><h2 className="font-bold">So sánh lịch sử phiên bản</h2><button aria-label="Đóng lịch sử phiên bản" onClick={onClose}><X /></button></div>
      {loading && <p role="status">Đang tải phiên bản…</p>}
      {error && <div role="alert"><p>{error}</p><button className="underline" onClick={() => setRetry(n => n + 1)}>Thử tải lại</button></div>}
      {!loading && !error && versions.length < 2 && <p>Cần ít nhất hai phiên bản đã lưu để so sánh.</p>}
      {versions.length >= 2 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['left', 'right'] as const).map(side => <div key={side} className="space-y-2"><label>{side === 'left' ? 'Phiên bản trước' : 'Phiên bản đối chiếu'}
          <select aria-label={side === 'left' ? 'Phiên bản trước' : 'Phiên bản đối chiếu'} className="block w-full border p-2 rounded" value={side === 'left' ? left : right} onChange={e => (side === 'left' ? setLeft : setRight)(e.target.value)}>
            {versions.map(v => <option key={v.id} value={v.id}>v{v.versionNo} · {v.title}</option>)}
          </select></label>
          {diff && <ol className="space-y-3">{(side === 'left' ? diff.leftScenes : diff.rightScenes)?.map((scene: any, i: number) => <li key={scene.id} className="border p-3 rounded text-sm whitespace-pre-wrap"><b>{i + 1}. {scene.title}</b><p>{scene.narration || 'Chưa có lời dẫn.'}</p></li>)}</ol>}
        </div>)}
      </div>}
    </div>
  </div>;
};
