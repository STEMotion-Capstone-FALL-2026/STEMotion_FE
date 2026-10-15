import React, { useEffect, useState, useCallback } from 'react';
import { workspaceService, WorkspaceMemberDto, WorkspaceSummary } from '../../../services';
import { AccountProvisionForm } from './AccountProvisionForm';
import { CreateWorkspaceForm } from './CreateWorkspaceForm';
import { Users, ShieldCheck } from 'lucide-react';

interface AdminPortalProps {
  onOpenManageMembersModal: () => void;
  onWorkspaceCreated?: (workspace: WorkspaceSummary) => void;
}

/** Initials stand in for an avatar the backend does not store yet. */
const initialsOf = (name: string): string => {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onOpenManageMembersModal,
  onWorkspaceCreated,
}) => {
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([]);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const workspaceId = await workspaceService.resolveActiveWorkspaceId();
      if (!workspaceId) {
        setMembers([]);
        setActiveWorkspaceName('');
        return;
      }
      const workspaces = await workspaceService.getMyWorkspaces();
      const current = workspaces.find((w) => w.id === workspaceId);
      if (current) setActiveWorkspaceName(current.name);

      const list = await workspaceService.getMembers(workspaceId);
      setMembers(list);
    } catch (err: any) {
      setError(err?.message || 'Không tải được danh sách thành viên.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  return (
    <main className="flex-1 bg-slate-50 p-6 flex flex-col">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Bảng Quản Trị Hệ Thống (Admin Control Center)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cấp tài khoản, tạo tổ chuyên môn, gán phân quyền trực tiếp và cấu hình hệ thống.
            </p>
          </div>
          <button
            onClick={onOpenManageMembersModal}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Quản lý thành viên tổ</span>
          </button>
        </div>

        {/* 1. Account Provision Form */}
        <AccountProvisionForm onUserCreated={() => void loadMembers()} />

        {/* 2. Create Workspace Form */}
        <CreateWorkspaceForm
          onWorkspaceCreated={(w) => {
            void loadMembers();
            onWorkspaceCreated?.(w);
          }}
        />

        {/* 3. Current Workspace Members */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Thành viên trong Tổ {activeWorkspaceName ? `"${activeWorkspaceName}"` : ''} ({members.length})
            </h2>
            <button
              onClick={onOpenManageMembersModal}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
            >
              Chi tiết & phân công &rarr;
            </button>
          </div>

          {isLoading && <p className="text-xs text-slate-400">Đang tải thành viên...</p>}
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {!isLoading && !error && members.length === 0 && (
            <p className="text-xs text-slate-400">
              {activeWorkspaceName
                ? 'Tổ bộ môn chưa có thành viên nào. Dùng nút Quản lý thành viên để gán người dùng vào tổ.'
                : 'Chưa chọn hoặc chưa có tổ bộ môn nào. Tạo tổ mới bằng biểu mẫu bên trên.'}
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
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{m.name}</span>
                      {m.isLeader && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 flex items-center space-x-0.5">
                          <ShieldCheck className="w-3 h-3 text-amber-600" />
                          <span>Tổ trưởng</span>
                        </span>
                      )}
                      {m.status === 'INACTIVE' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px]">
                          Vô hiệu hóa
                        </span>
                      )}
                    </div>
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
