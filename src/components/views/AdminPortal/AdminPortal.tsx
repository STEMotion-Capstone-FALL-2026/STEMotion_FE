import React from 'react';
import { UserPlus } from 'lucide-react';
import { SAMPLE_MEMBERS } from '../../../lib/sampleData';

interface AdminPortalProps {
  onOpenInviteModal: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onOpenInviteModal }) => {
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
            <span>+ Cấp Quyền Thành Viên Mới</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Thành viên trong Tổ bộ môn ({SAMPLE_MEMBERS.length})
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {SAMPLE_MEMBERS.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{m.avatar}</span>
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
