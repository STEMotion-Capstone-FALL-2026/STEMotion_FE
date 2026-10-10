import React, { useState } from 'react';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';
import { authService, UserProfile } from '../services';

interface LoginScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

/**
 * Gate in front of the studio. The backend issues a JWT that every later
 * request carries, so nothing else in the app can run until this succeeds.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await authService.login(email, password);
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
              Đăng nhập
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



          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-brand-600 text-white font-bold text-sm py-2.5 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />

            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>Đăng nhập</span>
          </button>

          <p className="text-xs text-slate-500">Tài khoản do quản trị viên cấp. Liên hệ quản trị viên nếu bạn chưa có tài khoản.</p>
        </form>

      </div>
    </div>
  );
};
