import React, { useCallback, useEffect, useState } from 'react';
import { collabService, AiSettings } from '../../../services/collabService';

const csv = (values: string[]) => values.join(', ');
const list = (text: string) => text.split(',').map(v => v.trim()).filter(Boolean);

/**
 * UC-34: the Admin sets the allowed AI/TTS providers, models and voices with a monthly budget and a
 * per-clip cap (defaults USD 20.00 and USD 0.50). Provider secrets stay on the server.
 */
export const AiSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [form, setForm] = useState({ providers: '', models: '', voices: '', monthly: '', perClip: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fill = (s: AiSettings) => {
    setSettings(s);
    setForm({ providers: csv(s.allowedAiProviders), models: csv(s.allowedModels), voices: csv(s.allowedVoices),
      monthly: String(s.monthlyBudgetUsd), perClip: String(s.perClipCapUsd) });
  };

  const load = useCallback(async () => {
    setError(null);
    try { fill(await collabService.aiSettings()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tải được cấu hình AI'); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      fill(await collabService.saveAiSettings({
        baseRevision: settings.revision,
        allowedAiProviders: list(form.providers),
        allowedModels: list(form.models),
        allowedVoices: list(form.voices),
        monthlyBudgetUsd: Number(form.monthly),
        perClipCapUsd: Number(form.perClip),
      }));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được cấu hình AI');
    } finally {
      setBusy(false);
    }
  };

  const spentRatio = settings && settings.monthlyBudgetUsd > 0 ? Math.min(1, settings.spentThisMonthUsd / settings.monthlyBudgetUsd) : 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs" aria-label="AI và ngân sách">
      <div>
        <h3 className="font-extrabold text-sm text-slate-900">AI, giọng đọc và ngân sách</h3>
        <p className="text-slate-600">Khoá bí mật của nhà cung cấp nằm trong biến môi trường của máy chủ; ở đây chỉ lưu tên và hạn mức. Vượt hạn mức thì lệnh gọi AI bị từ chối trước khi gửi đi.</p>
      </div>
      {error && <p role="alert" className="text-rose-700 bg-rose-50 p-2 rounded">{error}</p>}
      {saved && <p role="status" className="text-emerald-800 bg-emerald-50 p-2 rounded">Đã lưu cấu hình (phiên bản {settings?.revision}).</p>}
      {settings && (
        <div className="space-y-1">
          <p className="font-bold text-slate-700">Đã dùng tháng này: {settings.spentThisMonthUsd.toFixed(2)} / {Number(settings.monthlyBudgetUsd).toFixed(2)} USD</p>
          <div className="h-2 bg-slate-100 rounded" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(spentRatio * 100)} aria-label="Tỉ lệ ngân sách đã dùng">
            <div className={`h-2 rounded ${spentRatio >= 1 ? 'bg-rose-600' : spentRatio >= 0.8 ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ width: `${spentRatio * 100}%` }} />
          </div>
        </div>
      )}
      <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
        <fieldset disabled={busy || !settings} className="contents">
          <label className="space-y-1"><span className="font-bold text-slate-700">Nhà cung cấp AI được phép</span>
            <input value={form.providers} onChange={e => setForm({ ...form, providers: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="openai, gemini" /></label>
          <label className="space-y-1"><span className="font-bold text-slate-700">Model được phép (để trống: mọi model)</span>
            <input value={form.models} onChange={e => setForm({ ...form, models: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="gpt-4o-mini" /></label>
          <label className="space-y-1 md:col-span-2"><span className="font-bold text-slate-700">Giọng đọc được phép (để trống: mọi giọng)</span>
            <input value={form.voices} onChange={e => setForm({ ...form, voices: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="banmai, leminh" /></label>
          <label className="space-y-1"><span className="font-bold text-slate-700">Ngân sách mỗi tháng (USD)</span>
            <input type="number" min="0" step="0.01" value={form.monthly} onChange={e => setForm({ ...form, monthly: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" required /></label>
          <label className="space-y-1"><span className="font-bold text-slate-700">Trần mỗi clip (USD)</span>
            <input type="number" min="0" step="0.01" value={form.perClip} onChange={e => setForm({ ...form, perClip: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" required /></label>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu cấu hình'}</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
};
