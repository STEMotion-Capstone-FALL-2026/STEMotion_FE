import React, { useEffect, useRef, useState } from 'react';
import { authService, GoogleChallenge, ProfileSettings, UserProfile } from '../../services/authService';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { useDialog } from '../../hooks/useDialog';

export const ProfileSettingsModal: React.FC<{ onClose: () => void; onUpdated: (user: UserProfile) => void }> = ({ onClose, onUpdated }) => {
  const [profile,setProfile] = useState<ProfileSettings>();
  const [name,setName] = useState(''); const [password,setPassword] = useState('');
  const [challenge,setChallenge] = useState<GoogleChallenge>();
  const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [message,setMessage] = useState('');
  const pending = useRef(false);
  const dialog = useDialog(true, 'Cài đặt hồ sơ', onClose, busy);
  useEffect(() => { let active=true; authService.profile().then(p => { if(active) {setProfile(p);setName(p.user.fullName);} }).catch(e=>active&&setError(e.message)); return()=>{active=false;}; },[]);
  return <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-4">
    <section ref={dialog} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4">
      <div className="flex justify-between"><h2 className="font-bold">Cài đặt hồ sơ</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Đóng cài đặt">✕</button></div>
      {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
      {message&&<p role="status" className="text-sm text-green-700">{message}</p>}
      {!profile&&!error&&<p>Đang tải hồ sơ…</p>}
      {profile&&<>
        <p className="text-sm">Tài khoản: {profile.user.username || 'Đăng nhập bằng Google'}</p>
        <form className="space-y-2" onSubmit={async e=>{e.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setError('');setMessage('');
          try {const p=await authService.rename(name);setProfile(p);onUpdated(authService.getCurrentUser());setMessage('Đã cập nhật tên.');}
          catch(e:any){setError(e.message);}finally{pending.current=false;setBusy(false);}}}>
          <label className="block text-sm">Tên hiển thị<input className="block w-full border rounded p-2 mt-1" required minLength={2} maxLength={100} disabled={busy} value={name} onChange={e=>setName(e.target.value)}/></label>
          <button className="bg-brand-600 text-white px-3 py-2 rounded disabled:opacity-50" disabled={busy}>Lưu tên</button>
        </form>
        <div className="border-t pt-3 space-y-2 text-sm">
          <h3 className="font-semibold">Liên kết Google</h3>
          {profile.googleLinked?<><p>{profile.googleEmail}</p><p>{profile.googleLoginAllowed?'Google đang được phép đăng nhập.':'Gmail đã bị thu hồi quyền đăng nhập Google.'}</p></>:<p>Chưa liên kết Google.</p>}
          {profile.canLinkGoogle&&!challenge&&<form className="space-y-2" onSubmit={async e=>{e.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setError('');setMessage('');
            try{setChallenge(await authService.linkChallenge(password));}catch(e:any){setError(e.message);}finally{pending.current=false;setPassword('');setBusy(false);}}}>
            <label>Mật khẩu hiện tại<input type="password" autoComplete="current-password" required disabled={busy} className="block w-full border rounded p-2 mt-1" value={password} onChange={e=>setPassword(e.target.value)}/></label>
            <button disabled={busy} className="border rounded px-3 py-2">Xác nhận để liên kết Google</button>
          </form>}
          {challenge&&<><GoogleSignInButton challenge={challenge} disabled={busy} onCredential={async body=>{
            if(pending.current)return;
            pending.current=true;
            setBusy(true);setError('');
            try{const u=await authService.linkGoogle(body);onUpdated(u);setProfile(await authService.profile());setMessage('Đã liên kết Google với tài khoản hiện tại.');}
            catch(e:any){setError(e.message);throw e;}finally{pending.current=false;setChallenge(undefined);setBusy(false);}
          }}/><button type="button" disabled={busy} onClick={()=>setChallenge(undefined)} className="underline">Hủy / xác nhận lại</button></>}
        </div>
      </>}
    </section>
  </div>;
};
