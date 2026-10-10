import React, { useState } from 'react';
import { adminService, ProvisionUserRequest } from '../../../services/adminService';

export const AccountProvisionForm: React.FC = () => {
  const [form, setForm] = useState<ProvisionUserRequest>({ fullName: '', email: '', password: '', role: 'WRITER' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setCreated('');
    try {
      const user = await adminService.provisionUser(form);
      setCreated(user.email);
      setForm({ fullName: '', email: '', password: '', role: 'WRITER' });
    } catch (err: any) {
      setError(err?.message || 'Không thể cấp tài khoản.');
    } finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
    <h2 className="font-bold">Cấp tài khoản hệ thống</h2>
    <p className="text-xs text-slate-500">Sau khi cấp tài khoản, mời người dùng vào tổ bộ môn bằng chức năng bên trên.</p>
    <label className="block">Họ tên<input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="block w-full border rounded p-2" /></label>
    <label className="block">Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="block w-full border rounded p-2" /></label>
    <label className="block">Mật khẩu<input required type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="block w-full border rounded p-2" /></label>
    <label className="block">Vai trò<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as ProvisionUserRequest['role'] })} className="block border rounded p-2">
      {(['WRITER', 'REVIEWER', 'PRODUCER', 'ADMIN'] as const).map(role => <option key={role}>{role}</option>)}
    </select></label>
    {error && <p role="alert" className="text-rose-600">{error}</p>}
    {created && <p role="status" className="text-green-700">Đã cấp tài khoản cho {created}. Phiên đăng nhập của quản trị viên được giữ nguyên.</p>}
    <button disabled={busy} className="bg-brand-600 text-white rounded px-4 py-2 disabled:opacity-50">{busy ? 'Đang cấp tài khoản…' : 'Cấp tài khoản'}</button>
  </form>;
};
