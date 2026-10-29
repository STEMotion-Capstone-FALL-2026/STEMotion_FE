import { useDialog } from '../../hooks/useDialog';
import { useActionGuard } from '../../hooks/useActionGuard';
import React, { useState } from 'react';
import { KeyRound, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services';

interface ChangePasswordModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  onSuccess: () => void;
  onLogout?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  isMandatory = true,
  onSuccess,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const actions = useActionGuard();
  const [error, setError] = useState('');

  const dialog = useDialog(isOpen, 'Đổi mật khẩu', undefined, busy);

  if (!isOpen) return null;

  const handleSubmit = actions.wrap(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setBusy(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setBusy(false);
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div ref={dialog} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-xs animate-fade-in border border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Đổi Mật Khẩu Lần Đầu</h3>
            <p className="text-[11px] text-slate-500">
              Tài khoản của bạn được cấp mới. Vui lòng đổi mật khẩu để tiếp tục sử dụng hệ thống.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={busy} className="space-y-4 border-0 p-0 m-0">
          <label className="block">
            <span className="font-semibold text-slate-700">Mật khẩu hiện tại (được cấp)</span>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </label>

          <label className="block">
            <span className="font-semibold text-slate-700">Mật khẩu mới (tối thiểu 8 ký tự)</span>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
              placeholder="Nhập mật khẩu mới"
            />
          </label>

          <label className="block">
            <span className="font-semibold text-slate-700">Xác nhận mật khẩu mới</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
              placeholder="Nhập lại mật khẩu mới"
            />
          </label>

          {error && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-1.5 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            )}

            <button
              type="submit"
              disabled={busy}
              className="ml-auto px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all disabled:opacity-50 shadow-xs flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{busy ? 'Đang lưu…' : 'Xác nhận đổi mật khẩu'}</span>
            </button>
          </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};
