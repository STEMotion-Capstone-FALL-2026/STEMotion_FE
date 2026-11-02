import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../../../services/apiClient';
type Notification={status:string;canResend:boolean;nextAttemptAt?:string|null};
type Row={id:string;email:string;status:'ACTIVE'|'REVOKED';version:number;boundUserId?:string|null;notification?:Notification};
const MAIL_LABELS:Record<string,string>={DISABLED:'Chưa bật email thông báo',NONE:'Chưa gửi thông báo',PENDING:'Email đang chờ gửi',SENDING:'Đang gửi email',ACCEPTED:'Dịch vụ email đã tiếp nhận',PREVIEW:'Đã tạo bản xem trước email local',RETRY:'Email đang chờ thử lại',FAILED:'Gửi email thất bại',CANCELLED:'Đã hủy email chờ',UNKNOWN:'Chưa xác định kết quả gửi email'};

export const GoogleWhitelistPanel:React.FC=()=>{
  const [rows,setRows]=useState<Row[]>([]);const [email,setEmail]=useState('');
  const [page,setPage]=useState(0);const [query,setQuery]=useState('');const [search,setSearch]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const polls=useRef(0);
  const load=useCallback(async()=>{const r=await apiClient.get<Row[]>(`/admin/google-whitelist?page=${page}&size=20&query=${encodeURIComponent(search)}`);setRows(r);},[page,search]);
  useEffect(()=>{let active=true;polls.current=0;setBusy(true);setError('');
    apiClient.get<Row[]>(`/admin/google-whitelist?page=${page}&size=20&query=${encodeURIComponent(search)}`)
      .then(r=>active&&setRows(r)).catch(e=>active&&setError(e.message)).finally(()=>active&&setBusy(false));return()=>{active=false;};},[page,search]);
  useEffect(()=>{
    if(polls.current>=30||!rows.some(r=>['PENDING','SENDING','RETRY'].includes(r.notification?.status||'')))return;
    let active=true;
    const timer=window.setTimeout(()=>{polls.current++;apiClient.get<Row[]>(`/admin/google-whitelist?page=${page}&size=20&query=${encodeURIComponent(search)}`).then(r=>{if(active)setRows(r);}).catch(()=>{});},5000);
    return()=>{active=false;clearTimeout(timer);};
  },[rows,page,search]);
  return <section className="bg-white border rounded-2xl p-5 space-y-3">
    <h2 className="font-bold">Whitelist Google</h2><p className="text-xs text-slate-500">Chỉ Gmail trong danh sách được dùng Google. Tài khoản mới có quyền USER; workspace được quản trị viên gán sau. Muốn cấp ADMIN, đổi quyền trong quản lý người dùng sau khi tài khoản đã đăng nhập lần đầu.</p>
    <button type="button" disabled={busy} className="text-sm underline" onClick={()=>{polls.current=0;void load().catch(e=>setError(e.message));}}>Làm mới danh sách</button>
    {error&&<p role="alert" className="text-rose-700 text-sm">{error}</p>}{notice&&<p role="status" className="text-green-700 text-sm">{notice}</p>}
    <form className="flex gap-2" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');setNotice('');
      try{const row=await apiClient.post<Row>('/admin/google-whitelist',{email:email.trim().toLowerCase()});setEmail('');polls.current=0;await load();setNotice(row.notification?.status==='DISABLED'?'Đã thêm Gmail. Chưa bật email thông báo.':'Đã thêm Gmail. Email thông báo đang chờ xử lý.');}catch(e:any){setError(e.message);}finally{setBusy(false);}}}>
      <input aria-label="Gmail được phép" required type="email" pattern="[^@]+@gmail\.com" disabled={busy} value={email} onChange={e=>setEmail(e.target.value)} placeholder="ten@gmail.com" className="border rounded p-2 flex-1 min-w-0"/>
      <button disabled={busy} className="bg-brand-600 text-white rounded px-3">Thêm Gmail</button>
    </form>
    <form className="flex gap-2" onSubmit={e=>{e.preventDefault();setPage(0);setSearch(query);}}><input aria-label="Tìm Gmail" className="border rounded p-2 flex-1 min-w-0" value={query} onChange={e=>setQuery(e.target.value)}/><button disabled={busy}>Tìm</button></form>
    <ul className="divide-y">{rows.map(r=><li key={r.id} className="py-2 flex items-center justify-between gap-2 text-sm"><span className="break-all">{r.email}<span className="block text-xs text-slate-500">{r.status==='REVOKED'?'Đã thu hồi':r.boundUserId?'Đã liên kết':'Chưa sử dụng'}</span><span className="block text-xs text-slate-500">{MAIL_LABELS[r.notification?.status||'DISABLED']||'Chưa có trạng thái email'}</span></span>
      <div className="flex gap-2 shrink-0">
      {r.status==='ACTIVE'&&r.notification?.canResend&&<button type="button" disabled={busy} className="border px-3 py-1 rounded" onClick={async()=>{if(r.notification?.status==='UNKNOWN'&&!window.confirm('Email trước có thể đã được gửi. Bạn muốn gửi lại thông báo?'))return;setBusy(true);setError('');try{await apiClient.post(`/admin/google-whitelist/${r.id}/notifications/resend`,{version:r.version});polls.current=0;await load();setNotice('Email thông báo đang chờ gửi lại.');}catch(e:any){setError(e.message);}finally{setBusy(false);}}}>Gửi thông báo</button>}
      <button type="button" disabled={busy} className="border px-3 py-1 rounded" onClick={async()=>{setBusy(true);setError('');setNotice('');try{await apiClient.patch(`/admin/google-whitelist/${r.id}`,{status:r.status==='ACTIVE'?'REVOKED':'ACTIVE',version:r.version});polls.current=0;await load();}catch(e:any){setError(e.message);}finally{setBusy(false);}}}>{r.status==='ACTIVE'?'Thu hồi':'Khôi phục'}</button></div></li>)}</ul>
    {!rows.length&&!busy&&<p className="text-sm text-slate-500">Không có Gmail trong trang này.</p>}
    <div className="flex justify-between text-sm"><button disabled={busy||page===0} onClick={()=>setPage(p=>p-1)}>Trang trước</button><span>Trang {page+1}</span><button disabled={busy||rows.length<20} onClick={()=>setPage(p=>p+1)}>Trang sau</button></div>
  </section>;
};
