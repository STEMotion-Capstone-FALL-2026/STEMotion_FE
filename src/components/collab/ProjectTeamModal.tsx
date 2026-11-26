import React, { useCallback, useEffect, useState } from 'react';
import { Users, X } from 'lucide-react';
import {
  collabService, Contributions, CONTRIBUTION_LABELS, JoinRequest, ProjectRole, ProjectTeam, ROLE_LABELS,
} from '../../services/collabService';

interface Props {
  isOpen: boolean;
  projectId: string;
  projectTitle?: string;
  currentUserId: string;
  canManage: boolean;
  onClose: () => void;
}

/**
 * UC-30 and UC-32: the project's members and missing roles, asking to join with a role, the
 * Leader's approval and revocation, and the contributions of each member.
 */
export const ProjectTeamModal: React.FC<Props> = ({ isOpen, projectId, projectTitle, currentUserId, canManage, onClose }) => {
  const [tab, setTab] = useState<'TEAM' | 'CONTRIBUTIONS'>('TEAM');
  const [team, setTeam] = useState<ProjectTeam | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [contributions, setContributions] = useState<Contributions | null>(null);
  const [role, setRole] = useState<ProjectRole>('REVIEWER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [t, r] = await Promise.all([
        collabService.team(projectId).catch(e => { if (e?.status === 403) return null; throw e; }),
        collabService.joinRequests(projectId),
      ]);
      setTeam(t);
      setRequests(r);
      if (t) setContributions(await collabService.contributions(projectId).catch(() => null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được thành viên dự án');
    }
  }, [projectId]);

  useEffect(() => { if (isOpen) void load(); }, [isOpen, load]);
  if (!isOpen) return null;

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(done);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thao tác không thành công');
    } finally {
      setBusy(false);
    }
  };

  const isMember = Boolean(team?.members.some(m => m.userId === currentUserId && m.status === 'ACTIVE'));
  const myPending = requests.find(r => r.userId === currentUserId && r.status === 'PENDING');
  const pending = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div role="dialog" aria-label="Thành viên dự án" className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-brand-600" />
            <h3 className="font-extrabold text-sm text-slate-900 truncate">Thành viên dự án{projectTitle ? `: ${projectTitle}` : ''}</h3>
          </div>
          <button onClick={onClose} aria-label="Đóng thành viên dự án" className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-2" role="tablist">
          {(['TEAM', 'CONTRIBUTIONS'] as const).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} disabled={t === 'CONTRIBUTIONS' && !team}
              className={`px-3 py-1.5 rounded-lg font-bold ${tab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'} disabled:opacity-40`}>
              {t === 'TEAM' ? 'Thành viên' : 'Đóng góp'}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="text-rose-700 bg-rose-50 p-2 rounded">{error}</p>}
        {notice && <p role="status" className="text-emerald-800 bg-emerald-50 p-2 rounded">{notice}</p>}

        <div className="overflow-y-auto space-y-4">
          {tab === 'TEAM' && (
            <>
              {team && !team.usesProjectRoles && (
                <p className="bg-slate-50 p-3 rounded text-slate-700">Dự án này tạo trước khi có vai trò theo dự án, nên đội ngũ theo vai trò trong workspace.</p>
              )}
              {team?.usesProjectRoles && team.missingRoles.length > 0 && (
                <p className="bg-amber-50 p-3 rounded text-amber-900">Cần thêm {team.missingRoles.map(r => ROLE_LABELS[r] ?? r).join(' và ')} trước khi nộp kịch bản.</p>
              )}
              {team?.usesProjectRoles && (
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="text-slate-500"><th className="py-1">Thành viên</th><th>Vai trò</th><th>Trạng thái</th>{canManage && <th />}</tr></thead>
                  <tbody>
                    {team.members.map(m => (
                      <tr key={m.userId} className="border-t border-slate-100">
                        <td className="py-1.5">{m.name ?? m.userId}</td>
                        <td>{ROLE_LABELS[m.role] ?? m.role}</td>
                        <td>{m.status === 'ACTIVE' ? 'Đang tham gia' : 'Đã thu hồi'}</td>
                        {canManage && <td className="text-right">{m.status === 'ACTIVE' && (
                          <button disabled={busy} onClick={() => void act(() => collabService.revoke(projectId, m.userId), 'Đã thu hồi thành viên; lịch sử đóng góp vẫn được giữ.')}
                            className="text-rose-700 underline">Thu hồi</button>)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}

              {!team && (
                <p className="bg-slate-50 p-3 rounded text-slate-700">Bạn chưa thuộc dự án này. Hãy xin tham gia; Leader sẽ duyệt yêu cầu.</p>
              )}
              {team?.usesProjectRoles !== false && !isMember && !canManage && (
                myPending
                  ? <p className="text-slate-700">Yêu cầu tham gia với vai trò {ROLE_LABELS[myPending.role]} đang chờ Leader duyệt.</p>
                  : (
                    <div className="flex items-center gap-2">
                      <select value={role} onChange={e => setRole(e.target.value as ProjectRole)} aria-label="Vai trò xin tham gia" className="border border-slate-300 rounded-lg px-2 py-1.5">
                        {(['WRITER', 'REVIEWER', 'PRODUCER'] as ProjectRole[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                      <button disabled={busy} onClick={() => void act(() => collabService.requestJoin(projectId, role), 'Đã gửi yêu cầu tham gia.')}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold">Xin tham gia</button>
                    </div>
                  )
              )}

              {canManage && pending.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800">Yêu cầu tham gia đang chờ</h4>
                  {pending.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded p-2">
                      <span>{r.userName ?? r.userId}: {ROLE_LABELS[r.role]}</span>
                      <span className="flex gap-2">
                        <button disabled={busy} onClick={() => void act(() => collabService.approveJoin(r.id), 'Đã duyệt yêu cầu tham gia.')} className="text-emerald-700 underline">Duyệt</button>
                        <button disabled={busy} onClick={() => void act(() => collabService.rejectJoin(r.id), 'Đã từ chối yêu cầu.')} className="text-rose-700 underline">Từ chối</button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'CONTRIBUTIONS' && contributions && (
            <>
              <p className="text-slate-600">Đóng góp chỉ dùng để ghi công và truy vết, không dùng để đánh giá thành viên.</p>
              <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-slate-500"><th className="py-1">Thành viên</th><th>Tổng</th><th>Chi tiết</th></tr></thead>
                <tbody>
                  {contributions.byMember.map(m => (
                    <tr key={m.actorId} className="border-t border-slate-100">
                      <td className="py-1.5">{m.actorName ?? m.actorId}</td>
                      <td>{m.total}</td>
                      <td>{Object.entries(m.byType).map(([k, v]) => `${CONTRIBUTION_LABELS[k] ?? k}: ${v}`).join(' · ')}</td>
                    </tr>
                  ))}
                  {contributions.byMember.length === 0 && <tr><td colSpan={3} className="py-2 text-slate-500">Chưa có đóng góp nào.</td></tr>}
                </tbody>
              </table>
              </div>
              <ul className="space-y-1">
                {contributions.events.slice(0, 30).map(e => (
                  <li key={e.id} className="text-slate-700">{new Date(e.occurredAt).toLocaleString('vi-VN')} · {e.actorName ?? e.actorId} ({ROLE_LABELS[e.projectRole] ?? e.projectRole}) · {CONTRIBUTION_LABELS[e.eventType] ?? e.eventType}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
