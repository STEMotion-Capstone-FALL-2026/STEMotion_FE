import React, { useEffect, useState } from 'react';
import { AlertTriangle, Lightbulb, Loader2, Undo2 } from 'lucide-react';
import { SceneData, STEMScript } from '../../../types/stem';
import { scriptService } from '../../../services/scriptService';
import {
  MetaphorOption,
  applyMetaphor,
  canTakeMetaphor,
  describeSceneForMetaphor,
  parseMetaphorOptions,
} from '../../../services/metaphor';

const LAYOUT_NAMES: Record<string, string> = {
  focus: 'Tâm điểm',
  row: 'Quy trình',
  cluster: 'Nhóm',
  swarm: 'Đàn hạt',
  exchange: 'Tương tác',
  zoom: 'Zoom xuyên tỉ lệ',
};

/**
 * Asks the AI for three visual metaphors for the selected scene. The writer
 * compares them, sees where each comparison stops being accurate, and applies
 * one (visuals only, or visuals and narration). The last apply can be undone.
 */
export const MetaphorPanel: React.FC<{
  script: STEMScript;
  scene: SceneData;
  updateSceneProperty: (updater: (s: any) => any) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}> = ({ script, scene, updateSceneProperty, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<MetaphorOption[]>([]);
  const [meta, setMeta] = useState('');
  const [previous, setPrevious] = useState<SceneData | null>(null);

  // Suggestions belong to one scene; switching scenes clears them.
  useEffect(() => {
    setOptions([]);
    setMeta('');
    setPrevious(null);
  }, [scene.id]);

  if (!canTakeMetaphor(scene)) return null;

  const suggest = async () => {
    if (loading) return;
    if (!scene.narration?.trim() && !scene.title?.trim()) {
      showToast('Cảnh chưa có tiêu đề hoặc lời thoại để AI gợi ý ẩn dụ.', 'warn');
      return;
    }
    setLoading(true);
    try {
      const res = await scriptService.runAiAction(
        'metaphor',
        describeSceneForMetaphor(scene),
        script.subject,
        script.gradeLevel
      );
      const parsed = parseMetaphorOptions(res.result);
      setOptions(parsed);
      setMeta(`${res.model} · ${(res.elapsedMs / 1000).toFixed(1)}s`);
      if (parsed.length === 0) showToast('AI chưa đưa ra được ẩn dụ phù hợp, thử lại nhé.', 'warn');
    } catch (err: any) {
      showToast('Lỗi AI: ' + (err?.message || 'không gọi được dịch vụ AI'), 'warn');
    } finally {
      setLoading(false);
    }
  };

  const apply = (option: MetaphorOption, withNarration: boolean) => {
    setPrevious(scene);
    updateSceneProperty((s) => applyMetaphor(s, option, withNarration));
    showToast(`Đã dựng cảnh theo ẩn dụ "${option.name}". Producer có thể chỉnh tiếp hình ảnh.`, 'success');
  };

  const undo = () => {
    if (!previous) return;
    const snapshot = previous;
    updateSceneProperty(() => snapshot);
    setPrevious(null);
    showToast('Đã hoàn tác về cảnh trước khi áp dụng ẩn dụ.', 'info');
  };

  return (
    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>Ẩn dụ hình ảnh cho cảnh này</span>
          </div>
          <p className="text-[10px] text-amber-900/70 mt-0.5">
            AI đề xuất 3 cách ví von; bạn chọn cách giúp học sinh hiểu đúng nhất.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {previous && (
            <button
              onClick={undo}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
            >
              <Undo2 className="w-3.5 h-3.5" /> Hoàn tác
            </button>
          )}
          <button
            onClick={suggest}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-[11px] font-bold"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
            {options.length ? 'Gợi ý lại' : 'Gợi ý ẩn dụ'}
          </button>
        </div>
      </div>

      {options.map((o, i) => (
        <div key={`${o.name}-${i}`} className="p-3 rounded-xl bg-white border border-amber-200 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900">
              {String.fromCharCode(65 + i)}. {o.name}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800">
              {LAYOUT_NAMES[o.layout] ?? o.layout}
            </span>
          </div>
          <p className="text-[11px] text-slate-700">{o.idea}</p>
          {o.whyItHelps && <p className="text-[11px] text-emerald-800">Vì sao dễ hiểu: {o.whyItHelps}</p>}
          <p className="text-[11px] text-amber-900 flex gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>Giới hạn của phép so sánh: {o.limitation}</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {o.icons.map((ic, j) => (
              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {ic.label || ic.name}
              </span>
            ))}
          </div>
          <details className="text-[11px] text-slate-600">
            <summary className="cursor-pointer select-none">Lời thoại theo ẩn dụ này</summary>
            <p className="mt-1 italic">{o.narration}</p>
          </details>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => apply(o, false)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-[11px] font-semibold hover:bg-slate-50"
            >
              Chỉ dùng hình ảnh
            </button>
            <button
              onClick={() => apply(o, true)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-700"
            >
              Dùng cả lời thoại
            </button>
          </div>
        </div>
      ))}
      {meta && <p className="text-[10px] text-amber-900/60 text-right">— {meta}</p>}
    </div>
  );
};
