import React, { useEffect, useState, useRef } from 'react';
import { authService } from '../../services/authService';
import { scriptService } from '../../services/scriptService';
import { stemMutationKey } from '../../services/stemClient';
import { StemErrorNotice } from './StemErrorNotice';
import type { WorkspaceStemSettings, CatalogVersionEntry } from '../../types/stem';

/** Read/Assign MVP only. Backend remains authoritative for Admin access and CAS. */
export function StemWorkspaceSettings({workspaceId}:{workspaceId:string}) {
  const [settings,setSettings]=useState<WorkspaceStemSettings|null>(null);
  const [policies,setPolicies]=useState<CatalogVersionEntry[]>([]);
  const [error,setError]=useState<unknown>(null);
  const [busy,setBusy]=useState(false);
  const [reload,setReload]=useState(0);
  const retry=useRef<{payload:string;key:string}|null>(null);
  const admin=authService.getCurrentUser().systemRole==='ADMIN';
  useEffect(()=>{
    let current=true;setSettings(null);setError(null);
    const load=async()=>{
      const mode=await scriptService.getWorkspaceStemSettings(workspaceId);
      const rows:CatalogVersionEntry[]=[];
      for(let page=0;;page++){const batch=await scriptService.getCatalog('POLICY',page,100);rows.push(...batch);if(batch.length<100)break;if(page>=99)throw new Error('Danh sách policy chưa đầy đủ.');}
      if(current){setSettings(mode);setPolicies(rows);}
    };
    void load().catch(err=>{if(current)setError(err);});return()=>{current=false;};
  },[workspaceId,reload]);
  const save=async()=>{
    if(!settings||!admin||busy||error)return;
    const payload=JSON.stringify(settings);
    if(retry.current?.payload!==payload)retry.current={payload,key:stemMutationKey()};
    setBusy(true);
    try{setSettings(await scriptService.saveWorkspaceStemSettings(workspaceId,{...settings,idempotencyKey:retry.current.key}));retry.current=null;}
    catch(err){setError(err);}finally{setBusy(false);}
  };
  return <details className="border p-3"><summary>Workspace STEM — xem/gán policy DRAFT</summary>
    <StemErrorNotice error={error} onReload={()=>setReload(n=>n+1)} onRetryReady={()=>setError(null)}/>
    <p>modeRevision: {settings?.modeRevision??'—'} · Cùng counter workspace trên BE.</p>
    {!admin&&<p>Chỉ Admin hệ thống được ghi settings; quyền được BE kiểm tra lại.</p>}
    {settings&&<fieldset disabled={!admin||busy||Boolean(error)}>
      <label>Mode<select value={settings.mode} onChange={e=>setSettings({...settings,mode:e.target.value as 'OFF'|'ADVISORY'})}><option>OFF</option><option>ADVISORY</option></select></label>
      {policies.map(p=><label className="block" key={p.id}><input type="checkbox" checked={settings.policyVersionIds.includes(p.id)} onChange={e=>setSettings({...settings,policyVersionIds:e.target.checked?[...settings.policyVersionIds,p.id]:settings.policyVersionIds.filter(id=>id!==p.id),defaultPolicyVersionId:!e.target.checked&&settings.defaultPolicyVersionId===p.id?null:settings.defaultPolicyVersionId})}/>{p.logicalKey} v{p.version} — {p.status}/UNVERIFIED</label>)}
      {settings.policyVersionIds.filter(id=>!policies.some(p=>p.id===id)).map(id=><p key={id}>Policy đã pin không khả dụng: {id}. Không tự remap.</p>)}
      <label>Policy mặc định<select value={settings.defaultPolicyVersionId??''} onChange={e=>setSettings({...settings,defaultPolicyVersionId:e.target.value||null})}><option value="">Không chọn</option>{settings.policyVersionIds.map(id=><option key={id} value={id}>{policies.find(p=>p.id===id)?.logicalKey??id}</option>)}</select></label>
      <button onClick={()=>void save()}>Lưu settings workspace (CAS)</button>
    </fieldset>}
  </details>;
}
