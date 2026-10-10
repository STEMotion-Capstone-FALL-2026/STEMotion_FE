import React, { useEffect, useState } from 'react';
import { workspaceService, WorkspaceMemberDto } from '../../../services';
import { AccountProvisionForm } from './AccountProvisionForm';
import { UserPlus } from 'lucide-react';


interface AdminPortalProps {
  onOpenInviteModal: () => void;
}

/** Initials stand in for an avatar the backend does not store yet. */
const initialsOf = (name: string): string => {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const AdminPortal: React.FC<AdminPortalProps> = ({ onOpenInviteModal }) => {
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const workspaceId = await workspaceService.resolveActiveWorkspaceId();
        const list = await workspaceService.getMembers(workspaceId);
        if (!cancelled) setMembers(list);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Không tải được danh sách thành viên.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex-1 bg-slate-50 p-6 flex flex-col">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Bảng Quản Trị Hệ Thống (Admin Control Center)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phân quyền RBAC, quản lý tổ bộ môn và mã nhúng LMS.
            </p>
          </div>
          <button
            onClick={onOpenInviteModal}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Mời vào tổ bộ môn</span>
          </button>
        </div>

        <AccountProvisionForm />

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Thành viên trong Tổ bộ môn ({members.length})
          </h2>
          {isLoading && <p className="text-xs text-slate-400">Đang tải thành viên...</p>}
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {!isLoading && !error && members.length === 0 && (
            <p className="text-xs text-slate-400">
              Tổ bộ môn chưa có thành viên nào. Dùng nút bên trên để mời.
            </p>
          )}

          <div className="divide-y divide-slate-100 text-xs">
            {members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                    {initialsOf(m.name)}
                  </span>
                  <div>
                    <div className="font-bold text-slate-800">{m.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{m.email}</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-700 font-medium border border-blue-200">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
