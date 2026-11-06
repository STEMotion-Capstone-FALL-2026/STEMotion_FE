import React, { useEffect, useState } from 'react';
import type { CatalogVersionEntry, StemBrief, StudentTask } from '../../types/stem';
import { scriptService } from '../../services/scriptService';
import { StemErrorNotice } from './StemErrorNotice';

type Props = {brief:StemBrief;onChange:(brief:StemBrief)=>void};
const split=(value:string)=>value.split(',').map(s=>s.trim()).filter(Boolean);
const taskFields: Array<[keyof Omit<StudentTask,'key'>,string]> = [
  ['learnerAction','Hành động học sinh'],['teacherSupport','Hỗ trợ của giáo viên'],['materials','Vật liệu'],
  ['safety','An toàn nhiệm vụ'],['assessmentEvidence','Minh chứng đánh giá'],['executionContextKey','Bối cảnh thực hiện'],
];
export function StemLearningFields({brief:b,onChange}:Props) {
  return <div className="space-y-4">
    <h3>Mục tiêu ({b.objectives.length}/20)</h3>
    {b.objectives.map((o,i)=><fieldset key={i} className="border p-2 space-y-2">
      {(['key','learnerAction','observableEvidence'] as const).map(field=><label key={field} className="block">{field}<input name={`brief.objectives.${field}`} aria-label={`Mục tiêu ${i+1} ${field}`} maxLength={field==='key'?128:4000} value={o[field]??''} onChange={e=>onChange({...b,objectives:b.objectives.map((x,n)=>n===i?{...x,[field]:e.target.value}:x)})}/></label>)}
      <label>Outcome mục tiêu<select name="brief.objectives.outcomeId" value={o.outcomeId??''} onChange={e=>onChange({...b,objectives:b.objectives.map((x,n)=>n===i?{...x,outcomeId:e.target.value||null}:x)})}><option value="">Chưa gắn</option>{b.outcomeIds.map(id=><option key={id}>{id}</option>)}</select></label>
      <button onClick={()=>onChange({...b,objectives:b.objectives.filter((_,n)=>n!==i)})}>Xóa mục tiêu {i+1}</button>
    </fieldset>)}
    <button disabled={b.objectives.length>=20} onClick={()=>onChange({...b,objectives:[...b.objectives,{key:`objective_${Date.now()}`,learnerAction:'',observableEvidence:''}]})}>Thêm mục tiêu</button>
    <h3>Nhiệm vụ ({b.studentTasks.length}/20)</h3>
    {b.studentTasks.map((t,i)=><fieldset key={i} className="border p-2 space-y-2">
      <label>Mã nhiệm vụ<input name="brief.studentTasks.key" aria-label={`Task ${i+1} key`} maxLength={128} value={t.key} onChange={e=>onChange({...b,studentTasks:b.studentTasks.map((x,n)=>n===i?{...x,key:e.target.value}:x)})}/></label>
      {taskFields.map(([field,label])=><label key={field} className="block">{label}{field==='executionContextKey'?<select name={`brief.studentTasks.${field}`} value={t[field]??''} onChange={e=>onChange({...b,studentTasks:b.studentTasks.map((x,n)=>n===i?{...x,[field]:e.target.value||null}:x)})}><option value="">Chưa chọn</option><option>IN_CLASS_SCREEN</option><option>GROUP_PRACTICE</option></select>:<textarea maxLength={4000} name={`brief.studentTasks.${field}`} aria-label={`Task ${i+1} ${field}`} value={t[field]??''} onChange={e=>onChange({...b,studentTasks:b.studentTasks.map((x,n)=>n===i?{...x,[field]:e.target.value}:x)})}/>}</label>)}
      <button onClick={()=>onChange({...b,studentTasks:b.studentTasks.filter((_,n)=>n!==i)})}>Xóa nhiệm vụ {i+1}</button>
    </fieldset>)}
    <button disabled={b.studentTasks.length>=20} onClick={()=>onChange({...b,studentTasks:[...b.studentTasks,{key:`task_${Date.now()}`,learnerAction:''}]})}>Thêm nhiệm vụ</button>
    <h3>Đóng góp S/T/E/M — do người dùng giải trình</h3>
    {(['S','T','E','M'] as const).map(component=>{
      const c=b.contributions.find(x=>x.component===component);
      const update=(patch:Partial<NonNullable<typeof c>>)=>onChange({...b,contributions:c?b.contributions.map(x=>x.component===component?{...x,...patch}:x):[...b.contributions,{component,objectiveKeys:[],taskKeys:[],...patch}]});
      return <fieldset key={component} className="border p-2"><legend>{component}</legend>
        <label>Giải trình {component}<textarea name="brief.contributions.explanation" maxLength={4000} value={c?.explanation??''} onChange={e=>update({explanation:e.target.value})}/></label>
        <fieldset><legend>Mục tiêu liên kết {component}</legend>{Array.from(new Set([...b.objectives.map(o=>o.key),...(c?.objectiveKeys??[])])).map(key=><label key={key} className="block"><input name="brief.contributions.objectiveKeys" type="checkbox" checked={c?.objectiveKeys.includes(key)??false} onChange={e=>update({objectiveKeys:e.target.checked?[...(c?.objectiveKeys??[]),key]:(c?.objectiveKeys??[]).filter(k=>k!==key)})}/>{key}</label>)}</fieldset>
        <fieldset><legend>Nhiệm vụ liên kết {component}</legend>{Array.from(new Set([...b.studentTasks.map(t=>t.key),...(c?.taskKeys??[])])).map(key=><label key={key} className="block"><input name="brief.contributions.taskKeys" type="checkbox" checked={c?.taskKeys.includes(key)??false} onChange={e=>update({taskKeys:e.target.checked?[...(c?.taskKeys??[]),key]:(c?.taskKeys??[]).filter(k=>k!==key)})}/>{key}</label>)}</fieldset>
        {c&&<button onClick={()=>onChange({...b,contributions:b.contributions.filter(x=>x.component!==component)})}>Bỏ đóng góp {component}</button>}
      </fieldset>;
    })}
  </div>;
}

/** Derive grade/subject choices only from declared catalog data, never from titles. */
export function StemCatalogFields({brief:b,onChange,workspaceId}:{workspaceId:string}&Props) {
  const [catalog,setCatalog]=useState<CatalogVersionEntry[]>([]);
  const [error,setError]=useState<unknown>(null);
  const [settings,setSettings]=useState<Awaited<ReturnType<typeof scriptService.getWorkspaceStemSettings>>|null>(null);
  const [reload,setReload]=useState(0);
  const [level,setLevel]=useState('');
  useEffect(()=>{
    let current=true;
    const load=async()=>{
      const rows:CatalogVersionEntry[]=[];
      for(let page=0;;page++){const batch=await scriptService.getCatalog(undefined,page,100);rows.push(...batch);if(batch.length<100)break;if(page>=99)throw new Error('Catalog vượt giới hạn tải; chưa có đủ lựa chọn.');}
      const mode=await scriptService.getWorkspaceStemSettings(workspaceId);
      if(current){setCatalog(rows);setSettings(mode);setError(null);}
    };
    void load().catch(err=>{if(current)setError(err);});return()=>{current=false;};
  },[workspaceId,reload]);
  const text=(entry:CatalogVersionEntry,key:string)=>typeof entry.data[key]==='string'?String(entry.data[key]):null;
  const levels=Array.from(new Set(catalog.map(c=>text(c,'educationLevel')).filter((s):s is string=>Boolean(s))));
  const grades=Array.from(new Set(catalog.filter(c=>!level||text(c,'educationLevel')===level).map(c=>text(c,'gradeKey')).filter((s):s is string=>Boolean(s))));
  const subjects=Array.from(new Set(catalog.map(c=>text(c,'subjectKey')).filter((s):s is string=>Boolean(s))));
  const options=(kind:string)=>catalog.filter(c=>c.kind===kind&&c.status==='DRAFT');
  const select=(label:string,kind:string,value:string|null|undefined,change:(value:string|null)=>void)=><label className="block">{label} — DRAFT/UNVERIFIED<select name={kind==='POLICY'?'brief.policyVersionId':'brief.topicVersionId'} value={value??''} onChange={e=>change(e.target.value||null)}><option value="">Chưa chọn</option>{value&&!catalog.some(c=>c.id===value)&&<option value={value}>Đã pin, không khả dụng: {value}</option>}{options(kind).map(c=><option key={c.id} value={c.id}>{c.logicalKey} v{c.version} — DRAFT/UNVERIFIED</option>)}</select></label>;
  return <div className="border p-3 space-y-2">
    <p>Catalog DRAFT/UNVERIFIED — chưa thẩm định chuyên môn.</p>
    <StemErrorNotice error={error} onReload={()=>setReload(n=>n+1)}/>
    <p>Workspace: {settings?.mode??'Chưa đọc được'} · modeRevision: {settings?.modeRevision??'—'} · policy đã pin: {settings?.policyVersionIds.join(', ')||'Chưa gán'}</p>
    {select('Chủ đề','TOPIC_VERSION',b.topicVersionId,value=>onChange({...b,topicVersionId:value}))}
    {select('Policy cho brief','POLICY',b.policyVersionId,value=>onChange({...b,policyVersionId:value}))}
    <label className="block">Cấp học (lọc theo metadata catalog)<select value={level} onChange={e=>setLevel(e.target.value)}><option value="">Tất cả / chưa có metadata cấp học</option>{levels.map(l=><option key={l}>{l}</option>)}</select></label>
    <label className="block">Cấp/lớp từ catalog<select name="brief.gradeKey" value={b.gradeKey??''} onChange={e=>onChange({...b,gradeKey:e.target.value||null})}><option value="">Chưa chọn</option>{b.gradeKey&&!grades.includes(b.gradeKey)&&<option>{b.gradeKey}</option>}{grades.map(g=><option key={g}>{g}</option>)}</select></label>
    <label className="block">Môn chính<select name="brief.subjectKeys" value={b.subjectKeys[0]??''} onChange={e=>onChange({...b,subjectKeys:e.target.value?[e.target.value,...b.subjectKeys.slice(1).filter(s=>s!==e.target.value)]:[]})}><option value="">Chưa chọn</option>{Array.from(new Set([...subjects,...b.subjectKeys])).map(s=><option key={s}>{s}</option>)}</select></label>
    <fieldset><legend>Môn phối hợp</legend>{subjects.filter(s=>s!==b.subjectKeys[0]).map(s=><label key={s} className="block"><input type="checkbox" name="brief.subjectKeys" checked={b.subjectKeys.slice(1).includes(s)} disabled={!b.subjectKeys.length} onChange={e=>onChange({...b,subjectKeys:e.target.checked?[...b.subjectKeys,s]:b.subjectKeys.filter(x=>x!==s)})}/>{s}</label>)}</fieldset>
    <fieldset><legend>Yêu cầu cần đạt — DRAFT/UNVERIFIED</legend>{options('OUTCOME').filter(c=>(!text(c,'gradeKey')||text(c,'gradeKey')===b.gradeKey)&&(!text(c,'subjectKey')||b.subjectKeys.includes(text(c,'subjectKey')!))).map(c=><label key={c.id} className="block"><input type="checkbox" name="brief.outcomeIds" checked={b.outcomeIds.includes(c.id)} onChange={e=>onChange({...b,outcomeIds:e.target.checked?[...b.outcomeIds,c.id]:b.outcomeIds.filter(id=>id!==c.id)})}/>{c.logicalKey} v{c.version} · nguồn: {catalog.find(source=>source.id===c.sourceId)?.logicalKey??c.sourceId??'Chưa có nguồn'}</label>)}{b.outcomeIds.filter(id=>!catalog.some(c=>c.id===id)).map(id=><p key={id}>Outcome đã pin, không khả dụng: {id}</p>)}</fieldset>
    {!catalog.length&&!error&&<p>Catalog chưa có dữ liệu; giữ nháp, không tạo lựa chọn chính thức giả.</p>}
  </div>;
}
