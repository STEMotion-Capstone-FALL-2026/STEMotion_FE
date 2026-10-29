import { useActionGuard } from '../../../hooks/useActionGuard';
import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, AlertCircle, PlusCircle, Trash2, Users } from 'lucide-react';
import { adminService, AdminUserDto } from '../../../services/adminService';
import { workspaceService, WorkspaceSummary } from '../../../services/workspaceService';

interface CreateWorkspaceFormProps {
  onWorkspaceCreated?: (workspace: WorkspaceSummary) => void;
  onBusyChange?: (busy: boolean) => void;
}

export interface InitialWorkspaceMember {
  userId: string;
  role: 'WRITER' | 'REVIEWER' | 'PRODUCER';
}

export const CreateWorkspaceForm: React.FC<CreateWorkspaceFormProps> = ({ onWorkspaceCreated, onBusyChange }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [leaderUserId, setLeaderUserId] = useState('');
  const [leaderRole, setLeaderRole] = useState<'WRITER' | 'REVIEWER' | 'PRODUCER'>('WRITER');
  const [members, setMembers] = useState<InitialWorkspaceMember[]>([]);

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [busy, setBusy] = useState(false);
  const actions = useActionGuard();
  const [error, setError] = useState('');
  const [createdName, setCreatedName] = useState('');
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const list = await adminService.getUsers();
        if (!cancelled) {
          const eligibleLeaders = list.filter((u) => u.role !== 'ADMIN' && u.status === 'ACTIVE');
          setUsers(eligibleLeaders);
          if (eligibleLeaders.length > 0) {
            setLeaderUserId(eligibleLeaders[0].id);
            setLeaderRole('WRITER');
          }
          if (eligibleLeaders.length >= 3) {
            setMembers([
              { userId: eligibleLeaders[1].id, role: 'REVIEWER' },
              { userId: eligibleLeaders[2].id, role: 'PRODUCER' },
            ]);
          } else {
            setMembers([]);
          }
        }
      } catch (err: any) {
        if (!cancelled) setError('Không thể tải danh sách tài khoản để chọn Trưởng nhóm.');
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Validation according to Master update plan M11:
  // At least 3 different active users covering WRITER, REVIEWER, and PRODUCER.
  const allAssignedUsers = [leaderUserId, ...members.map((m) => m.userId)].filter(Boolean);
  const uniqueUserIds = new Set(allAssignedUsers);
  const hasDuplicateUsers = uniqueUserIds.size !== allAssignedUsers.length;
  const allAssignedRoles = new Set([leaderRole, ...members.map((m) => m.role)]);
  const missingRoles = (['WRITER', 'REVIEWER', 'PRODUCER'] as const).filter((r) => !allAssignedRoles.has(r));
  const isTeamValid = uniqueUserIds.size >= 3 && !hasDuplicateUsers && missingRoles.length === 0;

  const handleAddMember = () => {
    const unusedUser = users.find((u) => !uniqueUserIds.has(u.id));
    const nextRole = missingRoles[0] || 'WRITER';
    setMembers((prev) => [
      ...prev,
      { userId: unusedUser ? unusedUser.id : (users[0]?.id || ''), role: nextRole },
    ]);
  };

  const handleRemoveMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMemberUserChange = (index: number, newUserId: string) => {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, userId: newUserId } : m)));
  };

  const handleMemberRoleChange = (index: number, newRole: 'WRITER' | 'REVIEWER' | 'PRODUCER') => {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, role: newRole } : m)));
  };

  const handleSubmit = actions.wrap(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !leaderUserId || !isTeamValid) return;
    setBusy(true);
    setError('');
    setCreatedName('');
    try {
      const created = await workspaceService.createWorkspace({
        name: name.trim(),
        department: department.trim() || undefined,
        leaderUserId,
        leaderRole,
        members,
      });
      workspaceService.setActiveWorkspaceId(created.id);
      setCreatedName(created.name);
      setName('');
      setDepartment('');
      onWorkspaceCreated?.(created);
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo không gian làm việc.');
    } finally {
      setBusy(false);
    }
  });

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-xs">
      <fieldset disabled={busy} className="space-y-4 border-0 p-0 m-0">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-extrabold text-sm text-slate-900">Tạo Không Gian Làm Việc Mới</h2>
          <p className="text-[11px] text-slate-500">
            Tạo không gian làm việc (Workspace) với tối thiểu 3 thành viên bao phủ đủ 3 vai trò WRITER, REVIEWER và PRODUCER.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="font-semibold text-slate-700">Tên Không gian làm việc *</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Team Vật Lý - K11 hoặc Kênh STEM Motion"
            className="mt-1 block w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
          />
        </label>

        <label className="block">
          <span className="font-semibold text-slate-700">Bộ môn / Lĩnh vực</span>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Ví dụ: Khoa học Tự nhiên / EdTech Content"
            className="mt-1 block w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
          />
        </label>
      </div>

      {/* Leader Selection */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center space-x-2 font-bold text-slate-800">
          <Users className="w-4 h-4 text-brand-600" />
          <span>Trưởng nhóm phụ trách (Leader)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="font-semibold text-slate-700">Chỉ định Trưởng nhóm *</span>
            <select
              required
              aria-label="Chỉ định Trưởng nhóm *"
              value={leaderUserId}
              onChange={(e) => setLeaderUserId(e.target.value)}
              disabled={loadingUsers || users.length === 0}
              className="mt-1 block w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
            >
              {users.length === 0 ? (
                <option value="">{loadingUsers ? 'Đang tải người dùng...' : 'Chưa có thành viên nào (vui lòng tạo tài khoản Thành viên trước)'}</option>
              ) : (
                users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.email}) - {u.role}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="block">
            <span className="font-semibold text-slate-700">Vai trò chuyên môn của Leader *</span>
            <select
              aria-label="Vai trò chuyên môn của Leader *"
              value={leaderRole}
              onChange={(e) => setLeaderRole(e.target.value as 'WRITER' | 'REVIEWER' | 'PRODUCER')}
              className="mt-1 block w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
            >
              <option value="WRITER">Writer (Biên kịch)</option>
              <option value="REVIEWER">Reviewer (Thẩm định)</option>
              <option value="PRODUCER">Producer (Dựng video)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Additional Members Selection (M11 requirement: >= 3 distinct users covering WRITER, REVIEWER, PRODUCER) */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-slate-800">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Thành viên bổ sung ({members.length})</span>
          </div>
          <button
            type="button"
            onClick={handleAddMember}
            disabled={loadingUsers || users.length === 0}
            className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold border border-indigo-200 transition-colors flex items-center space-x-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Thêm thành viên</span>
          </button>
        </div>

        {members.length === 0 ? (
          <p className="text-slate-500 text-[11px] italic">
            Chưa có thành viên bổ sung. Vui lòng bấm &quot;Thêm thành viên&quot; để nhóm có tối thiểu 3 người.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((member, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 border border-slate-200 rounded-lg">
                <div className="flex-1 w-full">
                  <select
                    aria-label={`Thành viên bổ sung ${idx + 1}`}
                    value={member.userId}
                    onChange={(e) => handleMemberUserChange(idx, e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-40">
                  <select
                    aria-label={`Vai trò thành viên bổ sung ${idx + 1}`}
                    value={member.role}
                    onChange={(e) => handleMemberRoleChange(idx, e.target.value as 'WRITER' | 'REVIEWER' | 'PRODUCER')}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  >
                    <option value="WRITER">Writer (Biên kịch)</option>
                    <option value="REVIEWER">Reviewer (Thẩm định)</option>
                    <option value="PRODUCER">Producer (Dựng video)</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(idx)}
                  title="Xóa thành viên"
                  aria-label={`Xóa thành viên bổ sung ${idx + 1}`}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Validation summary banner */}
        <div className={`p-2.5 rounded-lg text-[11px] border flex items-start space-x-2 ${
          isTeamValid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {isTeamValid ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Đội ngũ hợp lệ: đủ {uniqueUserIds.size} người dùng khác nhau và bao phủ đủ 3 vai trò (WRITER, REVIEWER, PRODUCER).</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Quy tắc nhân sự tổ (M11):</span>
                {uniqueUserIds.size < 3 && <div>• Cần tối thiểu 3 người dùng khác nhau trong nhóm (hiện có: {uniqueUserIds.size}/3).</div>}
                {hasDuplicateUsers && <div>• Có người dùng bị chọn trùng lặp giữa Leader và các thành viên.</div>}
                {missingRoles.length > 0 && <div>• Nhóm còn thiếu vai trò: <span className="font-semibold">{missingRoles.join(', ')}</span>.</div>}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {createdName && (
        <div role="status" className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Đã tạo thành công không gian làm việc &quot;{createdName}&quot; với đầy đủ đội ngũ.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !name.trim() || !leaderUserId || !isTeamValid}
        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-xs cursor-pointer"
      >
        <PlusCircle className="w-4 h-4" />
        <span>{busy ? 'Đang tạo…' : 'Tạo không gian làm việc'}</span>
      </button>
      </fieldset>
    </form>
  );
};
