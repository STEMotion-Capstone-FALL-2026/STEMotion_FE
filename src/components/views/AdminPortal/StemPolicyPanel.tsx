import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../../services/apiClient';

interface CatalogEntry {
  id: string;
  kind: string;
  logicalKey: string;
  version: number;
  status: string;
  verificationStatus: string;
  data?: any;
}

const KINDS: { value: string; label: string }[] = [
  { value: 'POLICY', label: 'Chính sách' },
  { value: 'RUBRIC', label: 'Rubric' },
  { value: 'PROFILE', label: 'Hồ sơ cấp học' },
  { value: 'OUTCOME', label: 'YCCĐ' },
  { value: 'SOURCE_EDITION', label: 'Văn bản nguồn' },
  { value: 'TOPIC_VERSION', label: 'Chủ đề' },
];

/**
 * UC-63: the Admin imports a STEM catalogue pack and reviews its policies, rubrics, outcomes and
 * sources with their status. Entries stay DRAFT/UNVERIFIED until verified (FR-62).
 */
export const StemPolicyPanel: React.FC = () => {
  const [kind, setKind] = useState('POLICY');
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [pack, setPack] = useState('stem-demo-pack.v1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEntries(await apiClient.get<CatalogEntry[]>(`/stem/catalog?kind=${encodeURIComponent(kind)}&page=0&size=100`));
    } catch (e) {
      setEntries([]);
      setError(e instanceof Error ? e.message : 'Không tải được danh mục STEM (STEM có thể đang tắt)');
    }
  }, [kind]);
  useEffect(() => { void load(); }, [load]);

  const importPack = async () => {
    if (busy || !pack.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const key = `admin-import-${Date.now()}`;
      const result = await apiClient.post<{ created: number; skipped: number }>('/stem/catalog/import', { pack: pack.trim(), idempotencyKey: key });
      setNotice(`Đã nhập gói: ${result.created} mục mới, ${result.skipped} mục đã có.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không nhập được gói danh mục');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs" aria-label="Chính sách STEM">
      <div>
        <h3 className="font-extrabold text-sm text-slate-900">Chính sách và danh mục STEM</h3>
        <p className="text-slate-600">Nhập gói danh mục (chính sách, rubric, YCCĐ, văn bản nguồn) cho ba cấp học và xem từng phiên bản. Mục mới ở trạng thái DRAFT/UNVERIFIED cho đến khi được xác minh; workspace chọn chính sách trong phần cài đặt STEM.</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1"><span className="font-bold text-slate-700">Gói danh mục</span>
          <input value={pack} onChange={e => setPack(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 w-64" /></label>
        <button onClick={() => void importPack()} disabled={busy || !pack.trim()} className="px-3 py-2 rounded-lg bg-slate-900 text-white font-bold disabled:opacity-50">
          {busy ? 'Đang nhập…' : 'Nhập gói'}
        </button>
      </div>
      {error && <p role="alert" className="text-rose-700 bg-rose-50 p-2 rounded">{error}</p>}
      {notice && <p role="status" className="text-emerald-800 bg-emerald-50 p-2 rounded">{notice}</p>}
      <div className="flex flex-wrap gap-2" role="tablist">
        {KINDS.map(k => (
          <button key={k.value} role="tab" aria-selected={kind === k.value} onClick={() => setKind(k.value)}
            className={`px-3 py-1.5 rounded-lg font-bold ${kind === k.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>{k.label}</button>
        ))}
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead><tr className="text-slate-500"><th className="py-1">Khoá</th><th>Phiên bản</th><th>Trạng thái</th><th>Xác minh</th><th /></tr></thead>
        <tbody>
          {entries.map(e => (
            <React.Fragment key={e.id}>
              <tr className="border-t border-slate-100">
                <td className="py-1.5 font-mono">{e.logicalKey}</td>
                <td>{e.version}</td>
                <td>{e.status}</td>
                <td>{e.verificationStatus}</td>
                <td className="text-right"><button onClick={() => setOpen(open === e.id ? null : e.id)} className="underline">{open === e.id ? 'Ẩn' : 'Xem'}</button></td>
              </tr>
              {open === e.id && (
                <tr><td colSpan={5}><pre className="bg-slate-50 rounded p-2 overflow-x-auto max-h-64">{JSON.stringify(e.data, null, 2)}</pre></td></tr>
              )}
            </React.Fragment>
          ))}
          {entries.length === 0 && !error && <tr><td colSpan={5} className="py-2 text-slate-500">Chưa có mục nào.</td></tr>}
        </tbody>
      </table>
      </div>
    </section>
  );
};
