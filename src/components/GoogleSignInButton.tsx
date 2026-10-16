import React, { useEffect, useRef, useState } from 'react';
import { apiClient } from '../services/apiClient';

/** Google Identity Services, loaded on demand from Google. */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void;
          renderButton(element: HTMLElement, options: Record<string, unknown>): void;
        };
      };
    };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

const loadGoogleScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Không tải được Google Sign-In.')), { once: true });
    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

/**
 * "Sign in with Google" for accounts an admin provisioned (the backend matches
 * the verified Google email to an existing account). Shown only when the web
 * client id is set (VITE_GOOGLE_CLIENT_ID) and the backend reports Google
 * sign-in as configured, so nothing appears on an unconfigured deployment.
 */
export const GoogleSignInButton: React.FC<{
  onCredential: (credential: string) => void;
}> = ({ onCredential }) => {
  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const holder = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const callback = useRef(onCredential);
  callback.current = onCredential;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    apiClient
      .get<{ enabled: boolean }>('/auth/google/enabled')
      .then((r) => !cancelled && setEnabled(Boolean(r?.enabled)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!enabled || !clientId || !holder.current) return;
    loadGoogleScript()
      .then(() => {
        if (!holder.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callback.current(response.credential),
        });
        window.google.accounts.id.renderButton(holder.current, { theme: 'outline', size: 'large', width: 320, text: 'signin_with' });
      })
      .catch(() => setEnabled(false));
  }, [enabled, clientId]);

  if (!enabled) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <div className="flex-1 h-px bg-slate-200" /> hoặc <div className="flex-1 h-px bg-slate-200" />
      </div>
      <div ref={holder} className="flex justify-center" />
      <p className="text-[10px] text-slate-400 text-center">Chỉ dùng được với email đã được quản trị viên cấp tài khoản.</p>
    </div>
  );
};
