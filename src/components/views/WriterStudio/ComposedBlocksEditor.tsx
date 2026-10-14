import React from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import type { ComposedBlock, ComposedProps } from '../../../types/stem';
import { renderLatexToString } from '../../../utils/latex';
import { FRAMES, findCue, normalizeWords, resolveSlot } from '../../../remotion/composed/layout';

const KIND_LABELS: Record<ComposedBlock['kind'], string> = {
  title: 'Tiêu đề',
  text: 'Câu chữ',
  list: 'Danh sách',
  formula: 'Công thức',
  icon: 'Biểu tượng',
  icons: 'Hàng biểu tượng',
  number: 'Con số',
  chart: 'Biểu đồ',
  choice: 'Câu hỏi trắc nghiệm',
  arrow: 'Mũi tên',
  highlight: 'Khung nhấn mạnh',
  guide: 'Nhân vật dẫn chuyện',
};

const FRAME_LABELS: Record<ComposedProps['frame'], string> = {
  center: 'Giữa (trên, giữa, dưới)',
  split: 'Chia đôi (trái, phải)',
  thirds: 'Ba cột',
  grid: 'Lưới 2×2',
  sidebar: 'Nội dung + cột bên',
};

const SLOT_LABELS: Record<string, string> = {
  top: 'Trên', main: 'Giữa', bottom: 'Dưới', left: 'Trái', right: 'Phải', middle: 'Cột giữa',
  tl: 'Trên trái', tr: 'Trên phải', bl: 'Dưới trái', br: 'Dưới phải', side: 'Cột bên',
};

const input = 'w-full p-1.5 border border-slate-200 rounded text-xs bg-white';
const lines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);

/**
 * Lets the writer edit the words of a composed scene: what each block says,
 * which word of the narration brings it in, and where it sits. Blocks can be
 * removed, and a plain text block added; the producer refines the rest.
 */
export const ComposedBlocksEditor: React.FC<{
  scene: ComposedProps;
  updateSceneProperty: (updater: (s: any) => any) => void;
}> = ({ scene, updateSceneProperty }) => {
  const blocks = Array.isArray(scene.blocks) ? scene.blocks : [];
  const words = normalizeWords(scene.narration || '');
  const slots = Object.keys(FRAMES[scene.frame] ?? FRAMES.center);

  const update = (id: string, patch: Partial<ComposedBlock>) =>
    updateSceneProperty((s) => ({ ...s, blocks: s.blocks.map((b: ComposedBlock) => (b.id === id ? { ...b, ...patch } : b)) }));
  const remove = (id: string) =>
    updateSceneProperty((s) => ({
      ...s,
      // Arrows and highlights pointing at a removed block go with it.
      blocks: s.blocks.filter((b: ComposedBlock) => b.id !== id && b.from !== id && b.to !== id),
    }));
  const addText = () =>
    updateSceneProperty((s) => {
      const taken = new Set((s.blocks ?? []).map((b: ComposedBlock) => b.id));
      let n = (s.blocks?.length ?? 0) + 1;
      while (taken.has(`text${n}`)) n++;
      return { ...s, blocks: [...(s.blocks ?? []), { id: `text${n}`, kind: 'text', slot: 'bottom', text: 'Câu chữ mới' }] };
    });

  return (
    <div className="p-4 bg-fuchsia-50/70 border border-fuchsia-200 rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-fuchsia-950">Cảnh tự do (lắp ghép từ khối):</label>
        <select
          value={scene.frame}
          onChange={(e) => updateSceneProperty((s) => ({ ...s, frame: e.target.value }))}
          className="p-1 border border-fuchsia-200 rounded text-[11px] bg-white"
        >
          {Object.entries(FRAME_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {blocks.map((b) => {
        const missingCue = [b.at, b.until, b.revealAt, b.strikeAt].some((cue) => cue && findCue(words, cue) < 0);
        return (
          <div key={b.id} className="p-2.5 rounded-xl bg-white border border-fuchsia-100 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-800">
                {KIND_LABELS[b.kind] ?? b.kind} <span className="text-slate-400 normal-case">#{b.id}</span>
              </span>
              <div className="flex items-center gap-1">
                {b.kind !== 'arrow' && b.kind !== 'highlight' && (
                  <select
                    value={resolveSlot(scene.frame, b.slot)}
                    onChange={(e) => update(b.id, { slot: e.target.value as ComposedBlock['slot'] })}
                    className="p-0.5 border border-slate-200 rounded text-[10px] bg-white"
                    title="Vị trí trên màn hình"
                  >
                    {slots.map((s) => (
                      <option key={s} value={s}>{SLOT_LABELS[s] ?? s}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => remove(b.id)} className="p-1 text-slate-400 hover:text-rose-600" title="Xoá khối">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {(b.kind === 'title' || b.kind === 'text' || b.kind === 'guide' || b.kind === 'arrow') && (
              <input
                className={input}
                value={b.text ?? ''}
                placeholder={b.kind === 'guide' ? 'Lời nhân vật nói' : b.kind === 'arrow' ? 'Nhãn trên mũi tên (tuỳ chọn)' : ''}
                onChange={(e) => update(b.id, { text: e.target.value })}
              />
            )}
            {b.kind === 'list' && (
              <textarea
                rows={Math.max(2, b.items?.length ?? 2)}
                className={input}
                value={(b.items ?? []).join('\n')}
                placeholder="Mỗi dòng một ý"
                onChange={(e) => update(b.id, { items: lines(e.target.value) })}
              />
            )}
            {b.kind === 'formula' && (
              <>
                <input className={`${input} font-mono`} value={b.latex ?? ''} onChange={(e) => update(b.id, { latex: e.target.value })} />
                <div className="p-1.5 rounded border border-slate-100 text-center" dangerouslySetInnerHTML={renderLatexToString(b.latex ?? '')} />
              </>
            )}
            {b.kind === 'number' && (
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="number"
                  className={input}
                  value={Number.isFinite(b.value) ? b.value : ''}
                  onChange={(e) => update(b.id, { value: Number(e.target.value) })}
                />
                <input className={input} value={b.unit ?? ''} placeholder="Đơn vị" onChange={(e) => update(b.id, { unit: e.target.value })} />
                <input className={input} value={b.text ?? ''} placeholder="Nhãn" onChange={(e) => update(b.id, { text: e.target.value })} />
              </div>
            )}
            {b.kind === 'chart' && (
              <textarea
                rows={Math.max(2, b.points?.length ?? 2)}
                className={`${input} font-mono`}
                value={(b.points ?? []).map((p) => `${p.label}: ${p.value}`).join('\n')}
                placeholder="Nhãn: giá trị (mỗi dòng một cột)"
                onChange={(e) =>
                  update(b.id, {
                    points: lines(e.target.value)
                      .map((l) => {
                        const at = l.lastIndexOf(':');
                        return { label: l.slice(0, at).trim(), value: Number(l.slice(at + 1).replace(',', '.')) };
                      })
                      .filter((p) => p.label && Number.isFinite(p.value)),
                  })
                }
              />
            )}
            {b.kind === 'choice' && (
              <>
                <input className={input} value={b.question ?? ''} placeholder="Câu hỏi" onChange={(e) => update(b.id, { question: e.target.value })} />
                <textarea
                  rows={Math.max(2, b.options?.length ?? 2)}
                  className={input}
                  value={(b.options ?? []).join('\n')}
                  placeholder="Mỗi dòng một phương án"
                  onChange={(e) => update(b.id, { options: lines(e.target.value).slice(0, 4) })}
                />
                <select
                  className={input}
                  value={b.answer ?? 0}
                  onChange={(e) => update(b.id, { answer: Number(e.target.value) })}
                >
                  {(b.options ?? []).map((o, i) => (
                    <option key={i} value={i}>Đáp án đúng: {String.fromCharCode(65 + i)}. {o}</option>
                  ))}
                </select>
              </>
            )}
            {(b.kind === 'icon' || b.kind === 'icons') && (
              <div className="flex flex-wrap gap-1">
                {(b.kind === 'icon' ? [b.icon ?? { name: 'sparkle' }] : b.icons ?? []).map((ic, i) => (
                  <input
                    key={i}
                    className="flex-1 min-w-[90px] p-1 border border-slate-200 rounded text-[11px]"
                    value={ic.label ?? ''}
                    placeholder={ic.name}
                    onChange={(e) =>
                      b.kind === 'icon'
                        ? update(b.id, { icon: { ...ic, label: e.target.value } })
                        : update(b.id, { icons: (b.icons ?? []).map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })
                    }
                  />
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 shrink-0">Xuất hiện khi đọc tới:</span>
              <input
                className="flex-1 p-1 border border-slate-200 rounded text-[11px]"
                value={b.at ?? ''}
                placeholder="(theo thứ tự)"
                onChange={(e) => update(b.id, { at: e.target.value || undefined })}
              />
            </div>
            {missingCue && (
              <p className="text-[10px] text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Cụm từ hẹn giờ không có trong lời thoại; khối sẽ hiện theo thứ tự.
              </p>
            )}
          </div>
        );
      })}

      <button
        onClick={addText}
        disabled={blocks.length >= 12}
        className="w-full py-1.5 rounded-lg border border-dashed border-fuchsia-300 text-[11px] font-semibold text-fuchsia-800 hover:bg-fuchsia-100 disabled:opacity-50 flex items-center justify-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> Thêm khối chữ
      </button>
    </div>
  );
};
