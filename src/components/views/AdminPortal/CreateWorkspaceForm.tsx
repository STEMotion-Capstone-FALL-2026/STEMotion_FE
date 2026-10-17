import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import { adminService, AdminUserDto } from '../../../services/adminService';
import { workspaceService, WorkspaceSummary } from '../../../services/workspaceService';

interface CreateWorkspaceFormProps {
  onWorkspaceCreated?: (workspace: WorkspaceSummary) => void;
}

export const CreateWorkspaceForm: React.FC<CreateWorkspaceFormProps> = ({ onWorkspaceCreated }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [leaderUserId, setLeaderUserId] = useState('');
  const [leaderRole, setLeaderRole] = useState('WRITER');

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdName, setCreatedName] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !leaderUserId) return;
    setBusy(true);
    setError('');
    setCreatedName('');
    try {
      const created = await workspaceService.createWorkspace({
        name: name.trim(),
        department: department.trim() || undefined,
        leaderUserId,
        leaderRole,
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
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs text-xs">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-extrabold text-sm text-slate-900">Tạo Không Gian Làm Việc Mới</h2>
          <p className="text-[11px] text-slate-500">
            Tạo không gian làm việc (Workspace) cho nhóm sản xuất và chỉ định Trưởng nhóm phụ trách ngay từ đầu.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="font-semibold text-slate-700">Chỉ định Trưởng nhóm *</span>
          <select
            required
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
          <span className="font-semibold text-slate-700">Vai trò của Trưởng nhóm trong nhóm</span>
          <select
            value={leaderRole}
            onChange={(e) => setLeaderRole(e.target.value)}
            className="mt-1 block w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
          >
            <option value="WRITER">Writer (Biên kịch - Mặc định)</option>
            <option value="REVIEWER">Reviewer (Thẩm định)</option>
            <option value="PRODUCER">Producer (Dựng video)</option>
          </select>
        </label>
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
          <span>Đã tạo thành công không gian làm việc &quot;{createdName}&quot; cùng Trưởng nhóm phụ trách.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !name.trim() || !leaderUserId}
        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-xs"
      >
        <PlusCircle className="w-4 h-4" />
        <span>{busy ? 'Đang tạo…' : 'Tạo không gian làm việc'}</span>
      </button>
    </form>
  );
};
