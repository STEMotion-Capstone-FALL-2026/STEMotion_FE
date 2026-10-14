import React, { useState } from 'react';
import { adminService, ProvisionUserRequest } from '../../../services/adminService';
import { workspaceService } from '../../../services/workspaceService';
import { UserPlus, CheckCircle2 } from 'lucide-react';

export const AccountProvisionForm: React.FC<{ onCreated?: () => void }> = ({ onCreated }) => {
  const [form, setForm] = useState<ProvisionUserRequest>({
    fullName: '',
    email: '',
    password: '',
    role: 'WRITER',
  });
  const [autoAddWorkspace, setAutoAddWorkspace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setCreated('');
    try {
      const user = await adminService.provisionUser(form);
      if (autoAddWorkspace) {
        try {
          const workspaceId = await workspaceService.resolveActiveWorkspaceId();
          if (workspaceId) {
            await workspaceService.inviteMember(workspaceId, form.email, form.role);
          }
        } catch {
          // Backend linkPendingInvitations already links default workspace as fallback
        }
      }
      setCreated(
        autoAddWorkspace
          ? `Đã cấp tài khoản cho ${user.email} (${form.role}) và thêm trực tiếp vào Tổ bộ môn hiện tại!`
          : `Đã cấp tài khoản hệ thống cho ${user.email} (${form.role}).`
      );
      setForm({ fullName: '', email: '', password: '', role: 'WRITER' });
      onCreated?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể cấp tài khoản.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3.5 shadow-xs text-xs"
    >
      <div className="flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-rose-600" />
        <h2 className="font-bold text-sm text-slate-900">1. Cấp tài khoản hệ thống (Chỉ Admin)</h2>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Chỉ <strong>Admin (Quản trị viên / Tổ trưởng)</strong> mới có quyền tạo tài khoản giáo viên mới và phân quyền vào Tổ bộ môn.
      </p>

      <label className="block space-y-1 font-semibold text-slate-700">
        <span>Họ và tên giáo viên</span>
        <input
          required
          placeholder="VD: Thầy Nguyễn Văn A"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal focus:outline-none focus:border-indigo-500"
        />
      </label>

      <label className="block space-y-1 font-semibold text-slate-700">
        <span>Email đăng nhập</span>
        <input
          required
          type="email"
          placeholder="teacher@school.edu.vn"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal focus:outline-none focus:border-indigo-500"
        />
      </label>

      <label className="block space-y-1 font-semibold text-slate-700">
        <span>Mật khẩu khởi tạo (tối thiểu 8 ký tự)</span>
        <input
          required
          type="password"
          minLength={8}
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal focus:outline-none focus:border-indigo-500"
        />
      </label>

      <label className="block space-y-1 font-semibold text-slate-700">
        <span>Vai trò chuyên môn (RBAC)</span>
        <select
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value as ProvisionUserRequest['role'] })
          }
          className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-slate-50"
        >
          <option value="WRITER">WRITER — Giáo viên Biên soạn Kịch bản</option>
          <option value="REVIEWER">REVIEWER — Tổ trưởng / Thẩm định Nội dung & QA</option>
          <option value="PRODUCER">PRODUCER — Giáo viên Sản xuất & Kết xuất Video</option>
          <option value="ADMIN">ADMIN — Quản trị viên Hệ thống</option>
        </select>
      </label>

      <label className="flex items-start gap-2 pt-1 cursor-pointer select-none text-slate-700">
        <input
          type="checkbox"
          checked={autoAddWorkspace}
          onChange={(e) => setAutoAddWorkspace(e.target.checked)}
          className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
        />
        <span className="text-[11px] leading-snug">
          <strong>Tự động thêm ngay vào Tổ bộ môn đang mở</strong> (người dùng đăng nhập vào sẽ thấy ngay các dự án của nhóm mà không cần mời lại).
        </span>
      </label>

      {error && (
        <p role="alert" className="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 font-medium">
          {error}
        </p>
      )}
      {created && (
        <div
          role="status"
          className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-start gap-2 font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{created}</span>
        </div>
      )}

      <button
        disabled={busy}
        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-4 py-2.5 disabled:opacity-50 transition shadow-xs"
      >
        {busy ? 'Đang cấp tài khoản…' : '+ Cấp tài khoản & Phân vào nhóm'}
      </button>
    </form>
  );
};
