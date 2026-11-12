import React, { useEffect, useState } from 'react';
import { stemError } from '../../services/stemClient';
import { useDialog } from '../../hooks/useDialog';

export function StemErrorNotice({error,onReload,onDashboard,onRetryReady}: {error:unknown;onReload:()=>void;onDashboard?:()=>void;onRetryReady?:()=>void}) {
  const e=stemError(error);
  const [seconds,setSeconds]=useState(0);
  useEffect(()=>{setSeconds(e.status===429?e.retryAfterSeconds:0);},[error]);
  useEffect(()=>{if(seconds<=0)return;const timer=setTimeout(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearTimeout(timer);},[seconds]);
  const isStaleFingerprint = e.code === 'STEM_FINGERPRINT_STALE';
  const isRubricRequired = e.code === 'STEM_RUBRIC_REQUIRED';
  const dialog=useDialog(Boolean(error)&&e.status===409,isStaleFingerprint ? 'Fingerprint STEM bị cũ (Stale)' : 'Xung đột phiên bản STEM');
  if(!error)return null;
  const content=<><p className="font-semibold text-slate-800">
      {e.status===403?'Thiếu quyền hoặc ghế workspace. ':e.status===404?'Tài nguyên không tồn tại. ':''}
      {isStaleFingerprint?'Nội dung kịch bản hoặc bản dựng đã thay đổi sau khi tạo bản thẩm định (Fingerprint không khớp). Vui lòng tải lại và chấm lại rubric.':
       isRubricRequired?'Chế độ STRICT yêu cầu thẩm định Rubric STEM đầy đủ trước khi duyệt.':
       e.message}
    </p>
    <code>{e.code}{e.field?` — ${e.field}`:''}</code>
    {e.findings.length>0&&<div className="space-y-1 my-2">
      {e.findings.map((f,i)=><p key={i} className={`text-xs ${f.severity==='ERROR'?'text-rose-700 font-semibold':'text-amber-700'}`}>
        [{f.ruleId}] {f.field}: {f.message}
      </p>)}
    </div>}
    {e.status===409&&<div className="mt-3 flex gap-2">
      <p className="text-xs text-slate-600">{isStaleFingerprint?'Cần tải lại dữ liệu phiên bản mới nhất để chấm lại.':'Nội dung đang nhập được giữ lại. Reload sẽ thay bằng dữ liệu máy chủ.'}</p>
      <button onClick={onReload} className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded text-xs">{isStaleFingerprint?'Tải lại & chấm lại':'Reload dữ liệu mới nhất'}</button>
    </div>}
    {(e.status===400||e.status===0)&&onRetryReady&&<button onClick={onRetryReady} className="mt-2 text-xs text-indigo-600 underline">Đã sửa dữ liệu / thử lại thủ công</button>}
    {e.status===404&&<button onClick={onDashboard??(()=>{window.location.hash='';window.location.assign('/');})} className="mt-2 text-xs underline">Về Dashboard</button>}
    {e.status===429&&<p role="status">Autosave tạm dừng. {seconds>0?`Đợi ${seconds}s`:<button onClick={onRetryReady}>Tiếp tục sửa / thử lưu thủ công</button>}</p>}</>;
  return e.status===409?<div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"><div ref={dialog} className="bg-white p-5 rounded max-w-lg shadow-xl">{content}</div></div>:<div role="alert" className="p-3 bg-amber-50 border border-amber-300 rounded text-xs">{content}</div>;
}
