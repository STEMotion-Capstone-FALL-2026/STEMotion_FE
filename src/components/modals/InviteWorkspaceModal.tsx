import React, { useEffect, useState } from 'react';
import { UserPlus, X, CheckCircle2, Users } from 'lucide-react';
import { UserRole } from '../../types/stem';
import { adminService, AdminUserDto } from '../../services/adminService';
import { workspaceService, WorkspaceMemberDto } from '../../services/workspaceService';

interface InviteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGroupName?: string;
  onSendInvite: (email: string, role: UserRole) => Promise<WorkspaceMemberDto | string>;
}

export const InviteWorkspaceModal: React.FC<InviteWorkspaceModalProps> = ({
  isOpen,
  onClose,
  activeGroupName,
  onSendInvite,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('writer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [systemUsers, setSystemUsers] = useState<AdminUserDto[]>([]);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSuccessMsg('');
    void (async () => {
      try {
        const [users, wsId] = await Promise.all([
          adminService.getAllUsers().catch(() => []),
          workspaceService.resolveActiveWorkspaceId().catch(() => ''),
        ]);
        setSystemUsers(users);
        if (wsId) {
          const members = await workspaceService.getMembers(wsId).catch(() => []);
          setExistingEmails(new Set(members.map((m) => m.email.toLowerCase())));
        }
      } catch {
        // ignore
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const availableUsers = systemUsers.filter(
    (u) => !existingEmails.has(u.email.toLowerCase())
  );

  const handleSelectQuickUser = (selectedEmail: string) => {
    if (!selectedEmail) return;
    setEmail(selectedEmail);
    const found = systemUsers.find(
      (u) => u.email.toLowerCase() === selectedEmail.toLowerCase()
    );
    if (found) {
      const mappedRole = found.role.toLowerCase() as UserRole;
      if (['writer', 'reviewer', 'producer', 'admin'].includes(mappedRole)) {
        setRole(mappedRole);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <form
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || !email.trim()) return;
          setBusy(true);
          setError('');
          setSuccessMsg('');
          try {
            const result = await onSendInvite(email.trim(), role);
            setExistingEmails((prev) => new Set([...prev, email.trim().toLowerCase()]));
            if (typeof result === 'object' && result !== null) {
              if (result.status === 'ACTIVE') {
                setSuccessMsg(
                  `Đã thêm trực tiếp "${result.name}" (${result.email}) vào Tổ bộ môn với vai trò ${result.role}!`
                );
              } else {
                setSuccessMsg(
                  `Đã lưu lời mời cho ${result.email} (${result.role}). Khi cấp tài khoản cho email này, thành viên sẽ tự động kích hoạt.`
                );
              }
            } else {
              setSuccessMsg(`Đã thêm ${email.trim()} vào Tổ bộ môn thành công!`);
            }
            setEmail('');
          } catch (failure: any) {
            setError(failure.message || 'Không thể thêm thành viên vào nhóm.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-600" />
              <span>Thêm / Mời thành viên vào Tổ bộ môn</span>
            </h3>
            {activeGroupName && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Nhóm hiện tại: <strong className="text-slate-700">{activeGroupName}</strong> (Chỉ Admin có quyền thêm)
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {availableUsers.length > 0 && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <label className="block font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chọn nhanh từ tài khoản đã cấp ({availableUsers.length} chưa vào nhóm):</span>
            </label>
            <select
              value=""
              onChange={(e) => handleSelectQuickUser(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-medium"
            >
              <option value="">-- Chọn giáo viên trong hệ thống để điền nhanh --</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.fullName} ({u.email}) — [{u.role}]
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="block space-y-1 font-semibold text-slate-700">
          <span>Email giáo viên được thêm vào nhóm</span>
          <input
            type="email"
            required
            placeholder="teacher@school.edu.vn"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 font-normal focus:outline-none focus:border-brand-600"
          />
        </label>

        <label className="block space-y-1 font-semibold text-slate-700">
          <span>Vai trò chuyên môn trong Tổ bộ môn</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 font-bold bg-slate-50"
          >
            <option value="writer">WRITER — Biên soạn Kịch bản</option>
            <option value="reviewer">REVIEWER — Thẩm định Nội dung & QA</option>
            <option value="producer">PRODUCER — Sản xuất & Kết xuất Video</option>
            <option value="admin">ADMIN — Quản trị Tổ bộ môn</option>
          </select>
        </label>

        {error && (
          <p role="alert" className="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 font-medium">
            {error}
          </p>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
          >
            Đóng
          </button>
          <button
            disabled={busy}
            type="submit"
            className="flex-1 p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-50 transition"
          >
            {busy ? 'Đang thêm vào nhóm…' : '+ Thêm vào Tổ bộ môn'}
          </button>
        </div>
      </form>
    </div>
  );
};
