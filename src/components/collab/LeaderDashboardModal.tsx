import React, { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, X } from 'lucide-react';
import { blockerLabel, collabService, LeaderDashboard, ROLE_LABELS } from '../../services/collabService';

const STAGES: { key: string; label: string }[] = [
  { key: 'DRAFT', label: 'Bản nháp' },
  { key: 'SCRIPT_REVIEW', label: 'Chờ duyệt kịch bản' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'IN_PRODUCTION', label: 'Đang dựng' },
  { key: 'CLIP_REVIEW', label: 'Chờ duyệt video' },
  { key: 'PUBLISHED', label: 'Đã xuất bản' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
  onOpenProject?: (projectId: string) => void;
}

/** UC-33: the Leader's inbox (proposals, join requests) and the board of projects by stage with blockers. */
export const LeaderDashboardModal: React.FC<Props> = ({ isOpen, onClose, onChanged, onOpenProject }) => {
  const [data, setData] = useState<LeaderDashboard | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setData(await collabService.leaderDashboard()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tải được bảng điều phối'); }
  }, []);

  useEffect(() => { if (isOpen) void load(); }, [isOpen, load]);
  if (!isOpen) return null;

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try { await fn(); await load(); onChanged?.(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Thao tác không thành công'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div role="dialog" aria-label="Bảng điều phối của Leader" className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-2xl space-y-4 text-xs max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-brand-600" /><h3 className="font-extrabold text-sm text-slate-900">Bảng điều phối</h3></div>
          <button onClick={onClose} aria-label="Đóng bảng điều phối" className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        {error && <p role="alert" className="text-rose-700 bg-rose-50 p-2 rounded">{error}</p>}
        {!data && !error && <p role="status">Đang tải…</p>}
        {data && (
          <div className="overflow-y-auto space-y-5">
            <section className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Đề xuất dự án chờ duyệt ({data.pendingProposals.length})</h4>
                {data.pendingProposals.length === 0 && <p className="text-slate-500">Không có đề xuất nào.</p>}
                {data.pendingProposals.map(p => (
                  <div key={p.id} className="bg-slate-50 rounded p-2 space-y-1">
                    <p className="font-bold text-slate-900">{p.title}</p>
                    <p className="text-slate-600">{p.proposerName ?? p.proposerId} · {p.subject}{p.gradeLevel ? ` · ${p.gradeLevel}` : ''}</p>
                    {rejecting?.id === p.id ? (
                      <div className="flex gap-2">
                        <input aria-label="Lý do từ chối" value={rejecting.reason} onChange={e => setRejecting({ id: p.id, reason: e.target.value })}
                          className="flex-1 border border-slate-300 rounded px-2 py-1" placeholder="Lý do từ chối" />
                        <button disabled={busy || !rejecting.reason.trim()} onClick={() => void act(async () => { await collabService.rejectProposal(p.id, rejecting.reason); setRejecting(null); })}
                          className="text-rose-700 underline disabled:opacity-40">Gửi</button>
                        <button onClick={() => setRejecting(null)} className="underline">Huỷ</button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button disabled={busy} onClick={() => void act(() => collabService.approveProposal(p.id))} className="text-emerald-700 underline">Duyệt</button>
                        <button disabled={busy} onClick={() => setRejecting({ id: p.id, reason: '' })} className="text-rose-700 underline">Từ chối</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Yêu cầu tham gia dự án ({data.pendingJoinRequests.length})</h4>
                {data.pendingJoinRequests.length === 0 && <p className="text-slate-500">Không có yêu cầu nào.</p>}
                {data.pendingJoinRequests.map(r => (
                  <div key={r.id} className="bg-slate-50 rounded p-2 flex items-center justify-between gap-2">
                    <span>{r.userName ?? r.userId} xin làm {ROLE_LABELS[r.role]} ở <b>{r.projectTitle}</b></span>
                    <span className="flex gap-3 shrink-0">
                      <button disabled={busy} onClick={() => void act(() => collabService.approveJoin(r.id))} className="text-emerald-700 underline">Duyệt</button>
                      <button disabled={busy} onClick={() => void act(() => collabService.rejectJoin(r.id))} className="text-rose-700 underline">Từ chối</button>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-800">Tiến độ dự án</h4>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {STAGES.map(stage => (
                  <div key={stage.key} className="bg-slate-50 rounded-lg p-2 space-y-2 min-h-[80px]">
                    <p className="font-bold text-slate-700">{stage.label} ({(data.board[stage.key] ?? []).length})</p>
                    {(data.board[stage.key] ?? []).map(card => (
                      <button key={card.projectId} onClick={() => onOpenProject?.(card.projectId)}
                        className="w-full text-left bg-white border border-slate-200 rounded p-2 space-y-1 hover:border-brand-300">
                        <p className="font-bold text-slate-900 line-clamp-2">{card.title}</p>
                        <p className="text-slate-500">{card.ownerName ?? card.ownerId}</p>
                        {card.blockers.map(b => <p key={b} className="text-rose-700">{blockerLabel(b)}</p>)}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
