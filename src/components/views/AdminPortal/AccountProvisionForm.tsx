import { useActionGuard } from '../../../hooks/useActionGuard';
import React, { useState } from 'react';
import { adminService, ProvisionUserRequest } from '../../../services/adminService';

interface AccountProvisionFormProps {
  onUserCreated?: () => void;
}

export const AccountProvisionForm: React.FC<AccountProvisionFormProps> = ({ onUserCreated }) => {
  const [form, setForm] = useState<ProvisionUserRequest>({ fullName: '', username: '', password: '', systemRole: 'USER' });
  const [busy, setBusy] = useState(false);
  const actions = useActionGuard();
  const [error, setError] = useState('');
  const [created, setCreated] = useState('');
  const submit = actions.wrap(async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setCreated('');
    try {
      const user = await adminService.provisionUser(form);
      setCreated(user.username);
      setForm({ fullName: '', username: '', password: '', systemRole: 'USER' });
      onUserCreated?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể cấp tài khoản.');
    } finally { setBusy(false); }
  });
  return <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
    <h2 className="font-bold">Cấp tài khoản hệ thống</h2>
    <p className="text-xs text-slate-500">Sau khi cấp tài khoản, gán người dùng vào không gian làm việc tương ứng. Người dùng sẽ phải đổi mật khẩu ở lần đăng nhập đầu tiên.</p>
    <label className="block">Họ tên<input required disabled={busy} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="block w-full border rounded p-2" /></label>
    <label className="block">Tài khoản<input required type="text" autoComplete="off" pattern={String.raw`[A-Za-z0-9][A-Za-z0-9._\-]{2,31}`} disabled={busy} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="block w-full border rounded p-2" /><span className="text-xs text-slate-500">3–32 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang. Không dùng email.</span></label>
    <label className="block">Mật khẩu ban đầu<input required type="password" minLength={8} autoComplete="new-password" disabled={busy} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="block w-full border rounded p-2" /></label>
    <label className="block">Vai trò toàn hệ thống<select disabled={busy} value={form.systemRole} onChange={e => setForm({ ...form, systemRole: e.target.value as ProvisionUserRequest['systemRole'] })} className="block border rounded p-2">
      <option value="USER">Người dùng (USER)</option>
      <option value="ADMIN">Quản trị viên hệ thống (ADMIN)</option>
    </select></label>
    {error && <p role="alert" className="text-rose-600">{error}</p>}
    {created && <p role="status" className="text-green-700">Đã cấp tài khoản cho {created}. Phiên đăng nhập của quản trị viên được giữ nguyên.</p>}
    <button disabled={busy} className="bg-brand-600 text-white rounded px-4 py-2 disabled:opacity-50">{busy ? 'Đang cấp tài khoản…' : 'Cấp tài khoản'}</button>
  </form>;
};
