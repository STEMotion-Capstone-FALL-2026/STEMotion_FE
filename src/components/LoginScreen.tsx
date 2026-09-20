import React, { useState } from 'react';
import { AlertCircle, Loader2, LogIn, UserPlus } from 'lucide-react';
import { authService, UserProfile } from '../services';
import { UserRole } from '../types/stem';

interface LoginScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'writer', label: 'Writer — Biên kịch' },
  { value: 'reviewer', label: 'Reviewer — Thẩm định' },
  { value: 'producer', label: 'Producer — Dựng video' },
  { value: 'admin', label: 'Admin — Quản trị' },
];

/**
 * Gate in front of the studio. The backend issues a JWT that every later
 * request carries, so nothing else in the app can run until this succeeds.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('writer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = isRegister
        ? await authService.register(fullName, email, password, role)
        : await authService.login(email, password);
      onAuthenticated(user);
    } catch (err: any) {
      // The API answers a wrong password with 400 and a readable message.
      setError(err?.message || 'Không thể kết nối tới máy chủ. Kiểm tra backend đã chạy chưa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-lg">
            S
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">STEMotion</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4"
        >
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {isRegister ? 'Tạo tài khoản mới' : 'Đăng nhập'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Nền tảng sản xuất clip STEM có hỗ trợ AI
            </p>
          </div>

          {error && (
            <div className="flex items-start space-x-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isRegister && (
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Họ và tên</span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@stemotion.vn"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Mật khẩu</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>

          {isRegister && (
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Vai trò</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-brand-600 text-white font-bold text-sm py-2.5 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegister ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{isRegister ? 'Đăng ký & vào studio' : 'Đăng nhập'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register');
              setError(null);
            }}
            className="w-full text-xs text-slate-500 hover:text-brand-600 transition"
          >
            {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Backend cần chạy tại {(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}
        </p>
      </div>
    </div>
  );
};
