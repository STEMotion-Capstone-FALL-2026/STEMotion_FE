import React, { useState } from 'react';
import { CheckCircle2, Loader2, PenLine, Sparkles } from 'lucide-react';
import type { SceneData } from '../../types/stem';
import { getTemplateLabel } from '../../constants/templatesCatalog';
import { STEM_PHASES, phaseCoverage, phaseLabel } from '../../lib/stemPhases';

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
  const seconds = Math.round(draft.scenes.reduce((sum, s) => sum + (s.durationInFrames || 0), 0) / 30);
  const coverage = phaseCoverage(draft.scenes);

  const run = async (which: 'accept' | 'ignore') => {
    setBusy(which);
    try {
      await (which === 'accept' ? onAccept() : onIgnore());
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 text-xs">
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
          <div className="flex flex-wrap gap-1 mt-2">
            {STEM_PHASES.map((p) => (
              <span
                key={p.id}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  coverage.covered.has(p.id)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                {p.label}
              </span>
            ))}
          </div>
          {coverage.missingRequired.length > 0 && (
            <p className="text-[10px] text-amber-700 mt-1">
              Thiếu pha: {coverage.missingRequired.map((p) => phaseLabel(p)).join(', ')} (CV 3089). Có thể bổ sung sau khi dùng bản nháp.
            </p>
          )}
        </div>

        <ol className="flex-1 overflow-y-auto p-5 space-y-2">
          {draft.scenes.map((s, i) => (
            <li key={s.id} className="p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">
                  {i + 1}. {s.title}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {phaseLabel(s.stemPhase) && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                      {phaseLabel(s.stemPhase)}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                    {getTemplateLabel(s.type)}
                  </span>
                </span>
              </div>
              {s.narration && <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{s.narration}</p>}
            </li>
          ))}
        </ol>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
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
