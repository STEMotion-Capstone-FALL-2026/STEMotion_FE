import React from 'react';
import { useDialog } from '../../hooks/useDialog';
import { Building2, Crown } from 'lucide-react';
import type { WorkspaceSummary } from '../../services/workspaceService';
import type { UserRole } from '../../types/stem';

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  writer: 'Biên kịch',
  reviewer: 'Kiểm duyệt',
  producer: 'Sản xuất',
};

/**
 * Shown after sign-in when the user belongs to several workspaces and has not
 * picked one on this device yet. Roles are per workspace, so each card says
 * what the user does there.
 */
export const WorkspacePickerModal: React.FC<{
  workspaces: WorkspaceSummary[];
  onPick: (workspaceId: string) => void;
}> = ({ workspaces, onPick }) => {
  const dialog = useDialog(true, 'Chọn tổ chuyên môn để làm việc');
  return (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div ref={dialog} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-brand-600" />
          Chọn tổ chuyên môn để làm việc
        </h3>
        <p className="text-[11px] text-slate-500 mt-1">
          Bạn thuộc {workspaces.length} tổ. Quyền của bạn tính riêng theo từng tổ; có thể đổi tổ sau ở thanh trên cùng.
        </p>
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {workspaces.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onPick(w.id)}
            className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 text-sm">{w.name}</span>
              <span className="flex items-center gap-1">
                {w.isLeader && w.myRole !== 'admin' && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    <Crown className="w-3 h-3" /> Trưởng nhóm
                  </span>
                )}
                {w.myRole && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {ROLE_LABELS[w.myRole] ?? w.myRole}
                  </span>
                )}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {w.department || 'Chưa ghi bộ môn'} · {w.membersCount} thành viên · {w.activeProjects} dự án
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
  );
};
