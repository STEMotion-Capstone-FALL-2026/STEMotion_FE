import React, { useEffect, useRef, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { authService, GoogleChallenge, GoogleCredential } from '../services/authService';

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize(options: { client_id: string; nonce: string; auto_select: boolean; callback: (r: { credential: string }) => void }): void;
      renderButton(element: HTMLElement, options: Record<string, unknown>): void;
      disableAutoSelect?(): void;
    } } };
  }
}
let sdk: Promise<void> | undefined;
let owner = 0;
const loadSdk = (): Promise<void> => {
  if (window.google?.accounts.id) return Promise.resolve();
  if (sdk) return sdk;
  sdk = new Promise<void>((resolve, reject) => {
    const src = 'https://accounts.google.com/gsi/client';
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const script = existing ?? document.createElement('script');
    const fail = () => { sdk = undefined; script.remove(); reject(new Error('Không tải được Google. Vui lòng thử lại.')); };
    const timeout = window.setTimeout(fail, 15000);
    script.addEventListener('load', () => { clearTimeout(timeout); resolve(); }, { once: true });
    script.addEventListener('error', () => { clearTimeout(timeout); fail(); }, { once: true });
    if (!existing) { script.src = src; script.async = true; document.head.appendChild(script); }
  });
  return sdk;
};

export const GoogleSignInButton: React.FC<{
  challenge?: GoogleChallenge; disabled?: boolean;
  onCredential: (body: GoogleCredential) => Promise<void>;
}> = ({ challenge, disabled = false, onCredential }) => {
  const holder = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential); callback.current = onCredential;
  const blocked = useRef(disabled); blocked.current = disabled;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false; let expiry: number | undefined;
    const ticket = ++owner;
    const start = async () => {
      setError(''); setLoading(true);
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
      if (!clientId) { setLoading(false); setError('Đăng nhập Google chưa được cấu hình.'); return; }
      try {
        const config = await apiClient.request<{enabled:boolean}>('/auth/google/enabled', { anonymous: true });
        if (!config.enabled) throw new Error('Đăng nhập Google chưa được bật.');
        const c = challenge ?? await authService.googleChallenge();
        await loadSdk();
        if (cancelled || ticket !== owner || !holder.current || !window.google) return;
        holder.current.replaceChildren();
        let submitted = false;
        window.google.accounts.id.initialize({ client_id: clientId, nonce: c.nonce, auto_select: false,
          callback: response => {
            if (cancelled || ticket !== owner || submitted || blocked.current) return;
            submitted = true;
            callback.current({ credential: response.credential, challengeId: c.challengeId, challengeSecret: c.challengeSecret })
              .catch(err => { if (!cancelled) setError(err?.message || 'Không thể đăng nhập Google.'); })
              .finally(() => { if (!cancelled) { holder.current?.replaceChildren(); setError(e => e || 'Phiên Google đã kết thúc. Bấm thử lại nếu cần.'); } });
          } });
        window.google.accounts.id.renderButton(holder.current, { theme:'outline',size:'large',text:challenge ? 'continue_with' : 'signin_with',width:320 });
        expiry = window.setTimeout(() => { submitted = true; holder.current?.replaceChildren(); setError('Phiên Google đã hết hạn. Vui lòng thử lại.'); }, c.expiresInSeconds * 1000);
      } catch (err: any) { if (!cancelled) setError(err.message || 'Không thể kết nối Google.'); }
      finally { if (!cancelled) setLoading(false); }
    };
    void start();
    return () => { cancelled = true; if (expiry) clearTimeout(expiry); };
  }, [challenge, retry]);
  return <div className="space-y-2 text-center">
    {loading && <p className="text-xs text-slate-500">Đang chuẩn bị Google…</p>}
    <div ref={holder} className={`flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`} />
    {error && <div className="text-xs text-slate-600"><p role="status">{error}</p>
      {!challenge && <button type="button" disabled={disabled} onClick={() => setRetry(v => v + 1)} className="underline mt-1">Thử lại Google</button>}</div>}
  </div>;
};
