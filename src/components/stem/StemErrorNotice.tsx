import React, { useEffect, useState } from 'react';
import { stemError } from '../../services/stemClient';
import { useDialog } from '../../hooks/useDialog';

export function StemErrorNotice({error,onReload,onDashboard,onRetryReady}: {error:unknown;onReload:()=>void;onDashboard?:()=>void;onRetryReady?:()=>void}) {
  const e=stemError(error);
  const [seconds,setSeconds]=useState(0);
  useEffect(()=>{setSeconds(e.status===429?e.retryAfterSeconds:0);},[error]);
  useEffect(()=>{if(seconds<=0)return;const timer=setTimeout(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearTimeout(timer);},[seconds]);
  const dialog=useDialog(Boolean(error)&&e.status===409,'Xung đột phiên bản STEM');
  if(!error)return null;
  const content=<><p>{e.status===403?'Thiếu quyền hoặc ghế workspace. ':e.status===404?'Tài nguyên không tồn tại. ':''}{e.message}</p>
    <code>{e.code}{e.field?` — ${e.field}`:''}</code>
    {e.findings.map((f,i)=><p key={i}>{f.field}: [{f.ruleId}] {f.message}</p>)}
    {e.status===409&&<><p>Nội dung đang nhập được giữ lại. Reload sẽ thay bằng dữ liệu máy chủ.</p><button onClick={onReload}>Reload dữ liệu mới nhất</button></>}
    {(e.status===400||e.status===0)&&onRetryReady&&<button onClick={onRetryReady}>Đã sửa dữ liệu / thử lại thủ công</button>}
    {e.status===404&&<button onClick={onDashboard??(()=>{window.location.hash='';window.location.assign('/');})}>Về Dashboard</button>}
    {e.status===429&&<p role="status">Autosave tạm dừng. {seconds>0?`Đợi ${seconds}s`:<button onClick={onRetryReady}>Tiếp tục sửa / thử lưu thủ công</button>}</p>}</>;
  return e.status===409?<div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"><div ref={dialog} className="bg-white p-5 rounded max-w-lg">{content}</div></div>:<div role="alert" className="p-3 bg-amber-50 border border-amber-300">{content}</div>;
}
