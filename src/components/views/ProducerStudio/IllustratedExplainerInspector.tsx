import React from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { FlatAmbience, FlatDetail, FlatLayout, IllustratedExplainerProps, IllustratedIcon } from '../../../types/stem';
import { STEM_ICONS, StemIconGroup, resolveStemIcon } from '../../../remotion/flat/stemIcons';

const MAX_ICONS = 6;

const AMBIENCE_LABELS: Record<FlatAmbience, string> = {
  space: 'Vũ trụ',
  cell: 'Tế bào',
  lab: 'Phòng thí nghiệm',
  ocean: 'Đại dương',
  lilac: 'Tím pastel (nền sáng)',
  sky: 'Xanh pastel (nền sáng)',
};

const LAYOUT_LABELS: Record<FlatLayout, string> = {
  focus: 'Tâm điểm (1 lớn, các icon quay quanh)',
  row: 'Hàng ngang (quy trình có mũi tên)',
  cluster: 'Lưới (nhóm khái niệm)',
  swarm: 'Đàn hạt (tế bào, quần thể, đám mây electron)',
};

const DETAIL_LABELS: Record<FlatDetail, string> = {
  minimal: 'Tối giản (khuyên dùng)',
  rich: 'Nhiều chi tiết nền',
};

const GROUP_LABELS: Record<StemIconGroup, string> = {
  physics: 'Vật lý',
  chemistry: 'Hóa học',
  biology: 'Sinh học',
  earth: 'Khoa học Trái Đất',
  math: 'Toán học',
  technology: 'Công nghệ / Tin học',
  engineering: 'Kỹ thuật',
  general: 'Chung',
};

const GROUPS = Object.keys(GROUP_LABELS) as StemIconGroup[];

/** Producer controls for an ILLUSTRATED_EXPLAINER scene. */
export const IllustratedExplainerInspector: React.FC<{
  scene: IllustratedExplainerProps;
  updateSceneProperty: (updater: (s: any) => any) => void;
}> = ({ scene, updateSceneProperty }) => {
  const icons: IllustratedIcon[] = Array.isArray(scene.icons) ? scene.icons : [];

  const setIcons = (next: IllustratedIcon[]) => updateSceneProperty((s) => ({ ...s, icons: next }));

  const updateIcon = (index: number, patch: Partial<IllustratedIcon>) =>
    setIcons(icons.map((ic, i) => (i === index ? { ...ic, ...patch } : ic)));

  return (
    <div className="p-3 bg-fuchsia-50/70 border border-fuchsia-200 rounded-xl space-y-2.5">
      <span className="font-bold text-fuchsia-950 block text-[11px] flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-fuchsia-600" />
        <span>Minh Họa Flat Explainer:</span>
      </span>

      <div>
        <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Tiêu đề lớn trên màn hình:</span>
        <input
          type="text"
          value={scene.headline || ''}
          onChange={(e) => updateSceneProperty((s) => ({ ...s, headline: e.target.value }))}
          className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-semibold"
        />
      </div>

      <div>
        <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Dòng phụ (không bắt buộc):</span>
        <textarea
          rows={2}
          value={scene.caption || ''}
          onChange={(e) => updateSceneProperty((s) => ({ ...s, caption: e.target.value }))}
          className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Bối cảnh nền:</span>
          <select
            value={scene.ambience || 'space'}
            onChange={(e) => updateSceneProperty((s) => ({ ...s, ambience: e.target.value }))}
            className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
          >
            {(Object.keys(AMBIENCE_LABELS) as FlatAmbience[]).map((a) => (
              <option key={a} value={a}>
                {AMBIENCE_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Bố cục:</span>
          <select
            value={scene.layout || 'focus'}
            onChange={(e) => updateSceneProperty((s) => ({ ...s, layout: e.target.value }))}
            className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
          >
            {(Object.keys(LAYOUT_LABELS) as FlatLayout[]).map((l) => (
              <option key={l} value={l}>
                {LAYOUT_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Mức chi tiết của nền:</span>
        <select
          value={scene.detail || 'minimal'}
          onChange={(e) => updateSceneProperty((s) => ({ ...s, detail: e.target.value }))}
          className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
        >
          {(Object.keys(DETAIL_LABELS) as FlatDetail[]).map((d) => (
            <option key={d} value={d}>
              {DETAIL_LABELS[d]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-700">
            Biểu tượng ({icons.length}/{MAX_ICONS}):
          </span>
          <button
            type="button"
            disabled={icons.length >= MAX_ICONS}
            onClick={() => setIcons([...icons, { name: 'sparkle', label: '' }])}
            className="px-2 py-0.5 rounded bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-40 text-white font-bold text-[10px] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm</span>
          </button>
        </div>

        {icons.map((ic, idx) => {
          const { Icon } = resolveStemIcon(ic.name);
          return (
            <div key={idx} className="p-1.5 bg-white border border-fuchsia-200 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-7 h-7 rounded-full bg-fuchsia-600 flex items-center justify-center shrink-0">
                  <Icon size={16} weight="duotone" color="#ffffff" />
                </span>
                <select
                  value={ic.name}
                  onChange={(e) => updateIcon(idx, { name: e.target.value })}
                  className="flex-1 min-w-0 p-1 border border-slate-200 rounded text-[11px] bg-white"
                >
                  {GROUPS.map((g) => (
                    <optgroup key={g} label={GROUP_LABELS[g]}>
                      {STEM_ICONS.filter((s) => s.group === g).map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {icons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIcons(icons.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Xóa biểu tượng"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={ic.label || ''}
                placeholder="Nhãn hiển thị dưới biểu tượng"
                onChange={(e) => updateIcon(idx, { label: e.target.value })}
                className="w-full p-1 border border-slate-100 rounded text-[11px]"
              />
            </div>
          );
        })}

        {scene.layout === 'swarm' && (
          <p className="text-[10px] text-fuchsia-800/80 leading-snug">
            Biểu tượng đầu tiên là nhân của đàn hạt; tối đa 3 biểu tượng còn lại xếp bên phải.
          </p>
        )}

        {scene.layout === 'focus' && icons.length > 1 && (
          <p className="text-[10px] text-fuchsia-800/80 leading-snug">
            Biểu tượng đầu tiên là tâm điểm, các biểu tượng còn lại quay quanh nó.
          </p>
        )}
      </div>
    </div>
  );
};
