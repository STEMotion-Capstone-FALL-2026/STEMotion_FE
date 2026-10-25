import { useDialog } from '../../hooks/useDialog';
import React, { useState } from 'react';
import { CheckCircle2, Loader2, PenLine, Sparkles } from 'lucide-react';
import type { SceneData } from '../../types/stem';
import { useActionGuard } from '../../hooks/useActionGuard';
import { getTemplateLabel } from '../../constants/templatesCatalog';

export interface PendingDraft {
  title: string;
  scenes: SceneData[];
  approachName?: string;
  flow?: string[];
}

/**
 * The AI draft is a suggestion, as the proposal asks ("accept or ignore each
 * result"): the writer reads every scene before anything is saved, then either
 * starts from it or ignores it and writes the script themselves. The decision
 * is recorded only here, never automatically.
 */
export const DraftReviewModal: React.FC<{
  draft: PendingDraft;
  onAccept: () => Promise<void>;
  onIgnore: () => Promise<void>;
}> = ({ draft, onAccept, onIgnore }) => {
  const [busy, setBusy] = useState<'accept' | 'ignore' | null>(null);
  const actions = useActionGuard();
  const [error, setError] = useState('');
  const dialog = useDialog(true, 'Bản nháp AI gợi ý', undefined, busy !== null);
  const seconds = Math.round(draft.scenes.reduce((sum, s) => sum + (s.durationInFrames || 0), 0) / 30);

  const run = actions.wrap(async (which: 'accept' | 'ignore') => {
    setBusy(which);
    setError('');
    try {
      await (which === 'accept' ? onAccept() : onIgnore());
    } catch (err: any) {
      setError(err?.message || 'Chưa tạo được dự án. Bản nháp vẫn được giữ để thử lại.');
    } finally {
      setBusy(null);
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div ref={dialog} className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 text-xs">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Bản nháp AI gợi ý: “{draft.title}”
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {draft.scenes.length} cảnh · khoảng {seconds} giây
            {draft.approachName ? ` · dẫn dắt theo cách “${draft.approachName}”` : ''}. Chưa có gì được lưu: hãy đọc từng
            cảnh, rồi quyết định dùng làm điểm xuất phát hay tự viết.
          </p>
        </div>

        <ol className="flex-1 overflow-y-auto p-5 space-y-2">
          {draft.scenes.map((s, i) => (
            <li key={s.id} className="p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">
                  {i + 1}. {s.title}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono shrink-0">
                  {getTemplateLabel(s.type)}
                </span>
              </div>
              {s.narration && <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{s.narration}</p>}
            </li>
          ))}
        </ol>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
          {error && <p role="alert" className="text-rose-700">{error}</p>}
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run('ignore')}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
          >
            {busy === 'ignore' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
            Bỏ qua, tôi tự viết
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run('accept')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold disabled:opacity-60 flex items-center gap-1.5"
          >
            {busy === 'accept' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Dùng bản nháp này
          </button>
        </div>
      </div>
    </div>
  );
};
