import React, { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { collabService, Proposal } from '../../services/collabService';

const SUBJECTS: { value: string; label: string }[] = [
  { value: 'Physics', label: 'Vật lí' },
  { value: 'Chemistry', label: 'Hoá học' },
  { value: 'Biology', label: 'Sinh học' },
  { value: 'Math', label: 'Toán' },
  { value: 'ComputerScience', label: 'Tin học' },
];

interface Props {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
  onProposed?: (proposal: Proposal) => void;
}

/** UC-29: a Writer proposes a project; a Leader of the workspace approves it in the dashboard. */
export const ProposeProjectModal: React.FC<Props> = ({ isOpen, workspaceId, onClose, onProposed }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [gradeLevel, setGradeLevel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const proposal = await collabService.propose(workspaceId, { title: title.trim(), subject, gradeLevel: gradeLevel.trim() || null });
      onProposed?.(proposal);
      setTitle('');
      setGradeLevel('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được đề xuất');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} role="dialog" aria-label="Đề xuất dự án"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-900">Đề xuất dự án</h3>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng đề xuất dự án" className="p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-slate-600">Leader của workspace sẽ duyệt đề xuất. Khi được duyệt, dự án được tạo ở trạng thái bản nháp và bạn là Biên kịch của dự án.</p>
        <fieldset disabled={busy} className="space-y-3">
          <label className="block space-y-1">
            <span className="font-bold text-slate-700">Chủ đề bài học</span>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={255} required
              className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Ví dụ: Đòn bẩy trong đời sống" />
          </label>
          <label className="block space-y-1">
            <span className="font-bold text-slate-700">Môn học</span>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="font-bold text-slate-700">Khối lớp (không bắt buộc)</span>
            <input value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} maxLength={32}
              className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Ví dụ: GRADE_8" />
          </label>
        </fieldset>
        {error && <p role="alert" className="text-rose-700 bg-rose-50 p-2 rounded">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="px-3 py-2 rounded-lg border border-slate-300">Huỷ</button>
          <button type="submit" disabled={busy || !title.trim()} className="px-3 py-2 rounded-lg bg-slate-900 text-white font-bold disabled:opacity-50">
            {busy ? 'Đang gửi…' : 'Gửi đề xuất'}
          </button>
        </div>
      </form>
    </div>
  );
};
