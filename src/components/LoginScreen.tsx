import React, { useRef, useState } from 'react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';
import { authService, UserProfile } from '../services';

interface LoginScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

/**
 * Gate in front of the studio. The backend issues a JWT that every later
 * request carries, so nothing else in the app can run until this succeeds.
 * Local accounts are admin-provisioned; Google identities require the Gmail whitelist.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await authService.login(username, password);
      onAuthenticated(user);
    } catch (err: any) {
      // Invalid credentials have a generic message, without revealing account existence.
      setError(err?.message || 'Không thể kết nối tới máy chủ. Kiểm tra backend đã chạy chưa.');
    } finally {
      busy.current = false;
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
              Đăng nhập
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Nền tảng sản xuất video giáo dục STEM có hỗ trợ AI
            </p>
          </div>

          {error && (
            <div className="flex items-start space-x-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Tài khoản</span>
            <input
              type="text"
              autoComplete="username"
              maxLength={254}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên tài khoản do quản trị viên cấp"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Mật khẩu</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-brand-600 text-white font-bold text-sm py-2.5 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>Đăng nhập</span>
          </button>

          <p className="text-xs text-slate-500 text-center pt-2">
            Tài khoản do quản trị viên cấp. Liên hệ quản trị viên nếu bạn chưa có tài khoản.
          </p>
        </form>
        <div className="bg-white rounded-2xl p-5 mt-3 border border-slate-200 space-y-3">
          <GoogleSignInButton disabled={isSubmitting} onCredential={async body => {
            if (busy.current) return;
            busy.current = true; setIsSubmitting(true); setError(null);
            try { onAuthenticated(await authService.loginWithGoogle(body)); }
            catch (err: any) { setError(err.message); throw err; }
            finally { busy.current = false; setIsSubmitting(false); }
          }} />
          <p className="text-xs text-slate-500 text-center">Chỉ Gmail trong whitelist được đăng nhập. Nếu đã có tài khoản thường, hãy đăng nhập bằng mật khẩu và liên kết Google trong Cài đặt hồ sơ trước.</p>
        </div>
      </div>
    </div>
  );
};
