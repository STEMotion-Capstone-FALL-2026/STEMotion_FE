import React, { useState } from 'react';
import { Mic, Send, Type, Maximize2, BarChart2, Plus, Trash2, Palette, Code2, HelpCircle, Layers, CheckCircle2, Award, Sparkles, X, Save, Check, Volume2 } from 'lucide-react';
import { SceneData } from '../../../types/stem';
import { IllustratedExplainerInspector } from './IllustratedExplainerInspector';

interface SceneInspectorProps {
  selectedScene: SceneData;
  updateSceneProperty: (updater: (s: any) => any) => void;
  onStartRender?: () => void;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  selectedScene,
  updateSceneProperty,
  onStartRender,
}) => {
  const [isVoiceSaved, setIsVoiceSaved] = useState(false);

  const handleSaveVoice = () => {
    setIsVoiceSaved(true);
    setTimeout(() => setIsVoiceSaved(false), 2200);
  };
  return (
    <aside className="w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto custom-scrollbar text-xs h-full min-h-0 shrink-0">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
          Live Props Inspector
        </span>
        <span className="px-2 py-0.5 rounded bg-blue-100 text-brand-700 font-mono text-[10px] font-bold">
          {selectedScene.type}
        </span>
      </div>

      <div className="space-y-4">
        {/* Tiêu đề phân cảnh */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Tiêu đề phân cảnh:</label>
          <input
            type="text"
            value={selectedScene.title}
            onChange={(e) => updateSceneProperty((s) => ({ ...s, title: e.target.value }))}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* BỘ ĐIỀU KHIỂN CỠ CHỮ TOÀN NĂNG CHO MỌI PHÂN CẢNH (FLUID SCALE SLIDER) */}
        <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-brand-900 font-bold flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-brand-600" />
              <span>Cỡ Chữ Phân Cảnh (Fluid Scale):</span>
            </span>
            <span className="font-mono font-bold text-brand-700 text-xs bg-white border border-blue-300 px-2 py-0.5 rounded shadow-2xs">
              {(selectedScene as any).customFontSize || 30}px
            </span>
          </div>

          {/* Slider kéo mượt mà + nút - / + */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const cur = (selectedScene as any).customFontSize || 30;
                updateSceneProperty((s) => ({
                  ...s,
                  customFontSize: Math.max(16, cur - 2),
                }));
              }}
              className="w-6 h-6 rounded bg-white hover:bg-brand-600 hover:text-white text-slate-700 font-bold flex items-center justify-center text-xs transition-colors shadow-2xs border border-slate-200"
              title="Giảm 2px"
            >
              -
            </button>

            <input
              type="range"
              min="18"
              max="54"
              step="2"
              value={(selectedScene as any).customFontSize || 30}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateSceneProperty((s) => ({
                  ...s,
                  customFontSize: val,
                }));
              }}
              className="flex-1 h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />

            <button
              type="button"
              onClick={() => {
                const cur = (selectedScene as any).customFontSize || 30;
                updateSceneProperty((s) => ({
                  ...s,
                  customFontSize: Math.min(60, cur + 2),
                }));
              }}
              className="w-6 h-6 rounded bg-white hover:bg-brand-600 hover:text-white text-slate-700 font-bold flex items-center justify-center text-xs transition-colors shadow-2xs border border-slate-200"
              title="Tăng 2px"
            >
              +
            </button>
          </div>

          {/* 4 Nấc chọn nhanh */}
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {[
              { label: 'Nhỏ', size: 22 },
              { label: 'Chuẩn', size: 30 },
              { label: 'Lớn', size: 38 },
              { label: 'Cực Đại', size: 48 },
            ].map((item) => (
              <button
                key={item.size}
                type="button"
                onClick={() =>
                  updateSceneProperty((s) => ({
                    ...s,
                    customFontSize: item.size,
                  }))
                }
                className={`py-1 rounded font-bold transition-all ${
                  ((selectedScene as any).customFontSize || 30) === item.size
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {item.label} ({item.size})
              </button>
            ))}
          </div>
        </div>

        {/* BỘ ĐIỀU KHIỂN KHUNG THẺ BÊN TRONG (INNER COMPONENT CARD CONTROLLER) */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-950 block text-[11px] flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cỡ Khung Thẻ Bên Trong:</span>
            </span>
            <span className="text-[11px] font-mono font-bold bg-white text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 shadow-2xs">
              {Math.round(((selectedScene as any).cardScale || 1.0) * 100)}%
            </span>
          </div>

          {/* Slider Scale + Nút - / + */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const cur = (selectedScene as any).cardScale || 1.0;
                updateSceneProperty((s) => ({
                  ...s,
                  cardScale: Math.max(0.7, Number((cur - 0.05).toFixed(2))),
                }));
              }}
              className="w-6 h-6 rounded bg-white hover:bg-indigo-600 hover:text-white text-slate-700 font-bold flex items-center justify-center text-xs transition-colors shadow-2xs border border-slate-200"
              title="Thu nhỏ khung 5%"
            >
              -
            </button>

            <input
              type="range"
              min="0.75"
              max="1.45"
              step="0.05"
              value={(selectedScene as any).cardScale || 1.0}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateSceneProperty((s) => ({
                  ...s,
                  cardScale: val,
                }));
              }}
              className="flex-1 h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <button
              type="button"
              onClick={() => {
                const cur = (selectedScene as any).cardScale || 1.0;
                updateSceneProperty((s) => ({
                  ...s,
                  cardScale: Math.min(1.5, Number((cur + 0.05).toFixed(2))),
                }));
              }}
              className="w-6 h-6 rounded bg-white hover:bg-indigo-600 hover:text-white text-slate-700 font-bold flex items-center justify-center text-xs transition-colors shadow-2xs border border-slate-200"
              title="Phóng to khung 5%"
            >
              +
            </button>
          </div>

          {/* 4 Nấc chọn nhanh Scale */}
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {[
              { label: 'Gọn (85%)', scale: 0.85 },
              { label: 'Chuẩn', scale: 1.0 },
              { label: 'Lớn (115%)', scale: 1.15 },
              { label: 'Cực Đại', scale: 1.3 },
            ].map((item) => (
              <button
                key={item.scale}
                type="button"
                onClick={() =>
                  updateSceneProperty((s) => ({
                    ...s,
                    cardScale: item.scale,
                  }))
                }
                className={`py-1 rounded font-bold transition-all text-center ${
                  ((selectedScene as any).cardScale || 1.0) === item.scale
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Màu nền & Độ tương phản của Thẻ bên trong ("cái màu nhạt hơn 1 xíu") */}
          <div className="pt-2 border-t border-indigo-100">
            <span className="text-[10px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Palette className="w-3 h-3 text-indigo-500" />
              <span>Màu Nền / Tone Thẻ:</span>
            </span>
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {[
                { label: 'Mặc Định', theme: 'dark' },
                { label: 'Đậm Nét', theme: 'contrast' },
                { label: 'Kính Mờ', theme: 'glass' },
                { label: 'Sáng Nhẹ', theme: 'light' },
              ].map((th) => (
                <button
                  key={th.theme}
                  type="button"
                  onClick={() =>
                    updateSceneProperty((s) => ({
                      ...s,
                      cardTheme: th.theme as any,
                    }))
                  }
                  className={`py-1 rounded font-bold transition-all text-center ${
                    ((selectedScene as any).cardTheme || 'dark') === th.theme
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          {/* Độ Rộng Khung (Card Width) */}
          <div className="pt-2 border-t border-indigo-100">
            <span className="text-[10px] font-bold text-slate-700 block mb-1">Độ Phủ Màn Hình (Width):</span>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {[
                { label: 'Tiêu Chuẩn', width: 'standard' },
                { label: 'Rộng (Wide)', width: 'wide' },
                { label: 'Tràn Viền', width: 'full' },
              ].map((w) => (
                <button
                  key={w.width}
                  type="button"
                  onClick={() =>
                    updateSceneProperty((s) => ({
                      ...s,
                      cardWidth: w.width as any,
                    }))
                  }
                  className={`py-1 rounded font-bold transition-all text-center ${
                    ((selectedScene as any).cardWidth || 'standard') === w.width
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lời thoại Thuyết minh */}
        <div>
          <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
            <span>Lời thoại đọc (TTS Voiceover):</span>
            <span className="text-[10px] text-slate-400">Đồng bộ giọng đọc</span>
          </label>
          <textarea
            rows={3}
            value={selectedScene.narration}
            onChange={(e) => updateSceneProperty((s) => ({ ...s, narration: e.target.value }))}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Sửa công thức KaTeX nếu là MATH_FORMULA */}
        {selectedScene.type === 'MATH_FORMULA' && (
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
            <span className="font-bold text-blue-900 block text-[11px]">
              Công Thức Cốt Lõi (Main Equation):
            </span>
            <textarea
              rows={2}
              value={(selectedScene as any).latex}
              onChange={(e) => updateSceneProperty((s) => ({ ...s, latex: e.target.value }))}
              className="w-full p-2 border border-blue-300 rounded-lg font-mono text-xs text-blue-800 bg-white"
            />
            <p className="text-[10px] text-blue-600">
              * Nhập mã LaTeX (VD: <code>\sqrt&#123;...&#125;</code>, <code>x_1 + x_2 = -b/a</code>).
            </p>

            {/* Danh sách các bước triển khai con (Sub-components) */}
            <div className="pt-2 border-t border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Các Bước Diễn Giải ({((selectedScene as any).steps || []).length} bước):</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const curSteps = (selectedScene as any).steps || [];
                    const nextNum = curSteps.length + 1;
                    updateSceneProperty((s) => ({
                      ...s,
                      steps: [
                        ...curSteps,
                        {
                          label: `Bước ${nextNum}`,
                          latexSnippet: `x_${nextNum} = ...`,
                          explanation: 'Mô tả diễn giải chi tiết cho bước này...',
                        },
                      ],
                    }));
                  }}
                  className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Thêm Bước</span>
                </button>
              </div>

              {((selectedScene as any).steps || []).map((st: any, idx: number) => (
                <div key={idx} className="p-2 bg-white border border-blue-200 rounded-lg space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 font-mono">BƯỚC {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const curSteps = (selectedScene as any).steps || [];
                        updateSceneProperty((s) => ({
                          ...s,
                          steps: curSteps.filter((_: any, i: number) => i !== idx),
                        }));
                      }}
                      className="text-slate-400 hover:text-rose-600 text-[10px]"
                      title="Xóa bước này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Nhãn bước (VD: Chiều dài dây)"
                      value={st.label || ''}
                      onChange={(e) => {
                        const curSteps = [...((selectedScene as any).steps || [])];
                        curSteps[idx] = { ...curSteps[idx], label: e.target.value };
                        updateSceneProperty((s) => ({ ...s, steps: curSteps }));
                      }}
                      className="p-1 border border-slate-200 rounded text-[11px] bg-slate-50"
                    />
                    <input
                      type="text"
                      placeholder="LaTeX (VD: l (m))"
                      value={st.latexSnippet || ''}
                      onChange={(e) => {
                        const curSteps = [...((selectedScene as any).steps || [])];
                        curSteps[idx] = { ...curSteps[idx], latexSnippet: e.target.value };
                        updateSceneProperty((s) => ({ ...s, steps: curSteps }));
                      }}
                      className="p-1 border border-slate-200 rounded text-[11px] font-mono bg-slate-50 text-blue-900"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Lời giải thích ngắn gọn..."
                    value={st.explanation || ''}
                    onChange={(e) => {
                      const curSteps = [...((selectedScene as any).steps || [])];
                      curSteps[idx] = { ...curSteps[idx], explanation: e.target.value };
                      updateSceneProperty((s) => ({ ...s, steps: curSteps }));
                    }}
                    className="w-full p-1 border border-slate-200 rounded text-[11px] bg-slate-50 text-slate-700"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sửa biểu đồ nếu là DATA_CHART */}
        {selectedScene.type === 'DATA_CHART' && (
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
            <span className="font-bold text-emerald-900 block text-[11px]">
              Số liệu các cột biểu đồ (Data Points):
            </span>
            {(selectedScene as any).dataPoints?.map((dp: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={dp.label}
                  onChange={(e) => {
                    const newPts = [...(selectedScene as any).dataPoints];
                    newPts[i].label = e.target.value;
                    updateSceneProperty((s) => ({ ...s, dataPoints: newPts }));
                  }}
                  className="flex-1 p-1.5 border border-slate-200 rounded text-xs bg-white"
                />
                <input
                  type="number"
                  step="0.1"
                  value={dp.value}
                  onChange={(e) => {
                    const newPts = [...(selectedScene as any).dataPoints];
                    newPts[i].value = parseFloat(e.target.value) || 0;
                    updateSceneProperty((s) => ({ ...s, dataPoints: newPts }));
                  }}
                  className="w-16 p-1.5 border border-slate-200 rounded text-xs font-mono text-right bg-white"
                />
              </div>
            ))}
          </div>
        )}

        {/* Sửa Code nếu là ALGORITHM */}
        {selectedScene.type === 'ALGORITHM_WALKTHROUGH' && (
          <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2">
            <span className="font-bold text-emerald-400 block text-[11px] font-mono">
              Mã nguồn thuật toán:
            </span>
            <textarea
              rows={4}
              value={(selectedScene as any).codeSnippet}
              onChange={(e) => updateSceneProperty((s) => ({ ...s, codeSnippet: e.target.value }))}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-emerald-300"
            />
          </div>
        )}

        {/* Sửa Phản ứng nếu là CHEMICAL_REACTION */}
        {selectedScene.type === 'CHEMICAL_REACTION' && (
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
            <span className="font-bold text-rose-950 block text-[11px]">
              Phương Trình Hóa Học & Phản Ứng:
            </span>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Mã LaTeX Phương Trình:</span>
              <input
                type="text"
                value={(selectedScene as any).equation || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, equation: e.target.value }))}
                className="w-full p-1.5 border border-rose-300 rounded text-xs font-mono bg-white text-rose-900"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Chất tham gia:</span>
              <input
                type="text"
                value={(selectedScene as any).reactants || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, reactants: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Sản phẩm thu được:</span>
              <input
                type="text"
                value={(selectedScene as any).products || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, products: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Hiện tượng quan sát:</span>
              <textarea
                rows={2}
                value={(selectedScene as any).observation || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, observation: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
              />
            </div>
          </div>
        )}

        {/* Sửa So Sánh nếu là COMPARISON_SPLIT */}
        {selectedScene.type === 'COMPARISON_SPLIT' && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 block text-[11px]">
                Thông Số So Sánh Đối Chiếu:
              </span>
            </div>

            {/* Cột A */}
            <div className="p-2 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1.5">
              <span className="text-[10px] text-blue-800 font-bold block">Chủ Đề A (Cột Trái):</span>
              <input
                type="text"
                placeholder="Tiêu đề Cột A"
                value={(selectedScene as any).topicA?.title || ''}
                onChange={(e) =>
                  updateSceneProperty((s) => ({
                    ...s,
                    topicA: { ...(s as any).topicA, title: e.target.value },
                  }))
                }
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-medium"
              />
              <span className="text-[9px] text-slate-500 font-semibold block">Gạch đầu dòng (Mỗi dòng 1 ý):</span>
              <textarea
                rows={3}
                placeholder="Nhập các đặc trưng, mỗi dòng 1 ý..."
                value={((selectedScene as any).topicA?.points || []).join('\n')}
                onChange={(e) => {
                  const points = e.target.value.split('\n');
                  updateSceneProperty((s) => ({
                    ...s,
                    topicA: { ...(s as any).topicA, points },
                  }));
                }}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white leading-relaxed"
              />
            </div>

            {/* Cột B */}
            <div className="p-2 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1.5">
              <span className="text-[10px] text-amber-800 font-bold block">Chủ Đề B (Cột Phải):</span>
              <input
                type="text"
                placeholder="Tiêu đề Cột B"
                value={(selectedScene as any).topicB?.title || ''}
                onChange={(e) =>
                  updateSceneProperty((s) => ({
                    ...s,
                    topicB: { ...(s as any).topicB, title: e.target.value },
                  }))
                }
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-medium"
              />
              <span className="text-[9px] text-slate-500 font-semibold block">Gạch đầu dòng (Mỗi dòng 1 ý):</span>
              <textarea
                rows={3}
                placeholder="Nhập các đặc trưng, mỗi dòng 1 ý..."
                value={((selectedScene as any).topicB?.points || []).join('\n')}
                onChange={(e) => {
                  const points = e.target.value.split('\n');
                  updateSceneProperty((s) => ({
                    ...s,
                    topicB: { ...(s as any).topicB, points },
                  }));
                }}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white leading-relaxed"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Kết Luận Sư Phạm:</span>
              <textarea
                rows={2}
                value={(selectedScene as any).conclusion || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, conclusion: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
              />
            </div>
          </div>
        )}

        {/* Sửa Chu Trình nếu là PROCESS_TIMELINE */}
        {selectedScene.type === 'PROCESS_TIMELINE' && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <span className="font-bold text-emerald-950 block text-[11px]">
              Thông Số Chu Trình & Tiến Trình:
            </span>
            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Tên Chu Trình:</span>
              <input
                type="text"
                value={(selectedScene as any).processTitle || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, processTitle: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
              />
            </div>
            <div className="space-y-1.5">
              {(selectedScene as any).stages?.map((stg: any, sIdx: number) => (
                <div key={sIdx} className="p-2 border border-emerald-200 rounded-lg bg-white">
                  <span className="text-[9px] font-bold text-emerald-700 block">Pha {sIdx + 1}:</span>
                  <input
                    type="text"
                    value={stg.title}
                    onChange={(e) => {
                      const newStgs = [...(selectedScene as any).stages];
                      newStgs[sIdx].title = e.target.value;
                      updateSceneProperty((s) => ({ ...s, stages: newStgs }));
                    }}
                    className="w-full p-1 border border-slate-100 rounded text-xs font-bold mb-1"
                  />
                  <input
                    type="text"
                    value={stg.description}
                    onChange={(e) => {
                      const newStgs = [...(selectedScene as any).stages];
                      newStgs[sIdx].description = e.target.value;
                      updateSceneProperty((s) => ({ ...s, stages: newStgs }));
                    }}
                    className="w-full p-1 border border-slate-100 rounded text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedScene.type === 'ILLUSTRATED_EXPLAINER' && (
          <IllustratedExplainerInspector
            scene={selectedScene}
            updateSceneProperty={updateSceneProperty}
          />
        )}

        {/* Sửa Hình Học nếu là GEOMETRY_SPACE */}
        {selectedScene.type === 'GEOMETRY_SPACE' && (
          <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl space-y-2">
            <span className="font-bold text-cyan-950 block text-[11px]">
              Thông Số Hình Học & Định Lý:
            </span>
            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Tên Định Lý:</span>
              <input
                type="text"
                value={(selectedScene as any).theoremName || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, theoremName: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <span className="text-[10px] text-slate-600 block">Cạnh a:</span>
                <input
                  type="number"
                  value={(selectedScene as any).dimensions?.a || 3}
                  onChange={(e) =>
                    updateSceneProperty((s) => ({
                      ...s,
                      dimensions: { ...(s as any).dimensions, a: Number(e.target.value) },
                    }))
                  }
                  className="w-full p-1 border border-slate-200 rounded text-xs bg-white text-center font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-600 block">Cạnh b:</span>
                <input
                  type="number"
                  value={(selectedScene as any).dimensions?.b || 4}
                  onChange={(e) =>
                    updateSceneProperty((s) => ({
                      ...s,
                      dimensions: { ...(s as any).dimensions, b: Number(e.target.value) },
                    }))
                  }
                  className="w-full p-1 border border-slate-200 rounded text-xs bg-white text-center font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-600 block">Cạnh huyền c:</span>
                <input
                  type="number"
                  value={(selectedScene as any).dimensions?.c || 5}
                  onChange={(e) =>
                    updateSceneProperty((s) => ({
                      ...s,
                      dimensions: { ...(s as any).dimensions, c: Number(e.target.value) },
                    }))
                  }
                  className="w-full p-1 border border-slate-200 rounded text-xs bg-white text-center font-bold"
                />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Ý Nghĩa Định Lý:</span>
              <textarea
                rows={2}
                value={(selectedScene as any).explanation || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, explanation: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
              />
            </div>
          </div>
        )}

        {/* Sửa Subtitle nếu là TITLE_HERO */}
        {selectedScene.type === 'TITLE_HERO' && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <span className="font-bold text-blue-950 block text-[11px] uppercase">
              Thông Số Tiêu Đề Hero & Huy Hiệu:
            </span>
            <div>
              <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Mô tả phụ (Subtitle):</label>
              <textarea
                rows={2}
                value={(selectedScene as any).subtitle || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, subtitle: e.target.value }))}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                placeholder="Câu tóm lược chủ đề hoặc câu hỏi gợi mở..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Chữ Huy Hiệu (Badge):</label>
                <input
                  type="text"
                  value={(selectedScene as any).badgeText || ''}
                  onChange={(e) => updateSceneProperty((s) => ({ ...s, badgeText: e.target.value }))}
                  className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-medium"
                  placeholder="STEMotion Studio"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Khối Lớp:</label>
                <input
                  type="text"
                  value={(selectedScene as any).gradeLevel || ''}
                  onChange={(e) => updateSceneProperty((s) => ({ ...s, gradeLevel: e.target.value }))}
                  className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-medium"
                  placeholder="Lớp 10 / 11 / 12"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sửa Dữ Liệu Biểu Đồ nếu là DATA_CHART */}
        {selectedScene.type === 'DATA_CHART' && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 block text-[11px] flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thông Số Trục & Dữ Liệu Cột:</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Nhãn Trục Y:</span>
                <input
                  type="text"
                  value={(selectedScene as any).yAxisLabel || ''}
                  onChange={(e) => updateSceneProperty((s) => ({ ...s, yAxisLabel: e.target.value }))}
                  className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                  placeholder="Ví dụ: Chu kỳ T (s)"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Nhãn Trục X:</span>
                <input
                  type="text"
                  value={(selectedScene as any).xAxisLabel || ''}
                  onChange={(e) => updateSceneProperty((s) => ({ ...s, xAxisLabel: e.target.value }))}
                  className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                  placeholder="Ví dụ: Chiều dài l (m)"
                />
              </div>
            </div>

            {/* Danh sách các cột DataPoints */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700">Các Cột Biểu Đồ (Bars):</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentPoints = (selectedScene as any).dataPoints || [];
                    const nextNum = currentPoints.length + 1;
                    updateSceneProperty((s) => ({
                      ...s,
                      dataPoints: [
                        ...currentPoints,
                        {
                          label: `Mẫu ${nextNum}`,
                          value: Math.round((Math.random() * 4 + 1) * 100) / 100,
                          color: 'linear-gradient(to top, #059669, #34d399)',
                        },
                      ],
                    }));
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm Cột</span>
                </button>
              </div>

              {((selectedScene as any).dataPoints || []).map((pt: any, pIdx: number) => (
                <div key={pIdx} className="p-2 border border-emerald-200 rounded-lg bg-white space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 shrink-0">#{pIdx + 1}</span>
                    <input
                      type="text"
                      value={pt.label}
                      onChange={(e) => {
                        const newPts = [...(selectedScene as any).dataPoints];
                        newPts[pIdx].label = e.target.value;
                        updateSceneProperty((s) => ({ ...s, dataPoints: newPts }));
                      }}
                      className="flex-1 p-1 border border-slate-200 rounded text-[11px] font-medium"
                      placeholder="Nhãn (ví dụ l = 0.25m)"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={pt.value}
                      onChange={(e) => {
                        const newPts = [...(selectedScene as any).dataPoints];
                        newPts[pIdx].value = Number(e.target.value);
                        updateSceneProperty((s) => ({ ...s, dataPoints: newPts }));
                      }}
                      className="w-16 p-1 border border-slate-200 rounded text-[11px] font-bold text-center text-emerald-700"
                      placeholder="Giá trị"
                    />
                    {((selectedScene as any).dataPoints || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newPts = (selectedScene as any).dataPoints.filter((_: any, idx: number) => idx !== pIdx);
                          updateSceneProperty((s) => ({ ...s, dataPoints: newPts }));
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Xóa cột này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sửa Chi Tiết Từng Khung Con nếu là ALGORITHM_WALKTHROUGH */}
        {selectedScene.type === 'ALGORITHM_WALKTHROUGH' && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <span className="font-bold text-amber-950 block text-[11px] flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Tùy Chỉnh Từng Khung Con (Sub-Components):</span>
            </span>

            {/* Bố cục chia tỷ lệ cột */}
            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-1">Tỷ Lệ Chia Khung (Code vs Bộ Nhớ):</span>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {[
                  { label: '50 - 50', split: 'equal' },
                  { label: 'Code 60%', split: 'code-heavy' },
                  { label: 'Bộ Nhớ 60%', split: 'memory-heavy' },
                ].map((item) => (
                  <button
                    key={item.split}
                    type="button"
                    onClick={() =>
                      updateSceneProperty((s) => ({
                        ...s,
                        layoutSplit: item.split as any,
                      }))
                    }
                    className={`py-1 rounded font-bold transition-all text-center ${
                      ((selectedScene as any).layoutSplit || 'equal') === item.split
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Khung 1: Khung Mã Nguồn Code */}
            <div className="p-2.5 bg-white border border-amber-200 rounded-lg space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-800 uppercase">Khung Trái: Mã Nguồn (Code Box)</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">{(selectedScene as any).language || 'python'}</span>
              </div>
              <textarea
                rows={5}
                value={(selectedScene as any).codeSnippet || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, codeSnippet: e.target.value }))}
                className="w-full p-2 border border-slate-200 rounded text-[11px] font-mono bg-slate-950 text-emerald-300 leading-relaxed"
                placeholder="Nhập code từng dòng..."
              />
            </div>

            {/* Khung 2: Khung Bộ Nhớ & Giải Thích */}
            <div className="p-2.5 bg-white border border-amber-200 rounded-lg space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Khung Phải: Trạng Thái Bộ Nhớ & Lời Bình</span>
              <div>
                <span className="text-[9px] text-slate-500 font-bold block mb-0.5">Biến Nhớ (Variables Snapshot):</span>
                <input
                  type="text"
                  value={(selectedScene as any).steps?.[0]?.variableState || ''}
                  onChange={(e) => {
                    const steps = (selectedScene as any).steps || [{ lineHighlight: 1, variableState: '', note: '' }];
                    const newSteps = [...steps];
                    newSteps[0] = { ...newSteps[0], variableState: e.target.value };
                    updateSceneProperty((s) => ({ ...s, steps: newSteps }));
                  }}
                  className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono bg-slate-900 text-emerald-400"
                  placeholder="{ i: 0, arr: [2, 5, 8] }"
                />
              </div>

              <div>
                <span className="text-[9px] text-slate-500 font-bold block mb-0.5">Giải Thích Thao Tác Bước:</span>
                <textarea
                  rows={2}
                  value={(selectedScene as any).steps?.[0]?.note || ''}
                  onChange={(e) => {
                    const steps = (selectedScene as any).steps || [{ lineHighlight: 1, variableState: '', note: '' }];
                    const newSteps = [...steps];
                    newSteps[0] = { ...newSteps[0], note: e.target.value };
                    updateSceneProperty((s) => ({ ...s, steps: newSteps }));
                  }}
                  className="w-full p-1.5 border border-slate-200 rounded text-xs leading-relaxed"
                  placeholder="Mô tả thuật toán đang thực thi..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Sửa Câu Hỏi & Đáp Án nếu là STEM_QUIZ */}
        {selectedScene.type === 'STEM_QUIZ' && (
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
            <span className="font-bold text-rose-950 block text-[11px] flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Thông Số Câu Hỏi & 4 Lựa Chọn (Quiz):</span>
            </span>

            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Câu Hỏi Nhận Thức:</span>
              <textarea
                rows={3}
                value={(selectedScene as any).question || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, question: e.target.value }))}
                className="w-full p-2 border border-slate-200 rounded text-xs bg-white font-medium leading-relaxed"
                placeholder="Nhập nội dung câu hỏi kiểm tra..."
              />
            </div>

            {/* 4 Options với Radio chọn đáp án đúng */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-600 font-bold block">4 Đáp Án (Tick chọn đáp án đúng):</span>
              {['A', 'B', 'C', 'D'].map((letter, idx) => {
                const options = (selectedScene as any).options || ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];
                const isCorrect = (selectedScene as any).correctIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`p-1.5 rounded-lg border flex items-center gap-2 bg-white transition-all ${
                      isCorrect ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/40' : 'border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => updateSceneProperty((s) => ({ ...s, correctIndex: idx }))}
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={isCorrect ? 'Đáp án chính xác' : 'Bấm để chọn làm đáp án đúng'}
                    >
                      {letter}
                    </button>
                    <input
                      type="text"
                      value={options[idx] || ''}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx] = e.target.value;
                        updateSceneProperty((s) => ({ ...s, options: newOpts }));
                      }}
                      className="flex-1 p-1 border border-slate-100 rounded text-xs"
                      placeholder={`Nội dung phương án ${letter}...`}
                    />
                    {isCorrect && (
                      <span className="text-[9px] font-bold text-emerald-600 font-mono shrink-0">ĐÚNG ✓</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Lời Giải Thích Chi Tiết:</span>
              <textarea
                rows={2}
                value={(selectedScene as any).explanation || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, explanation: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white leading-relaxed"
                placeholder="Giải thích vì sao đáp án đó là đúng..."
              />
            </div>
          </div>
        )}

        {/* Sửa Sơ Đồ & Nhãn nếu là DIAGRAM_EXPLAINER */}
        {selectedScene.type === 'DIAGRAM_EXPLAINER' && (
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5">
            <span className="font-bold text-purple-950 block text-[11px] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Thông Số Sơ Đồ & Các Nhãn Chú Thích:</span>
            </span>

            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Tiêu Đề Sơ Đồ:</span>
              <input
                type="text"
                value={(selectedScene as any).diagramTitle || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, diagramTitle: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-medium"
                placeholder="Ví dụ: Cơ chế dao động con lắc đơn"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700">Các Nhãn Chú Thích (Labels):</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentLabels = (selectedScene as any).labels || [];
                    const nextNum = currentLabels.length + 1;
                    updateSceneProperty((s) => ({
                      ...s,
                      labels: [
                        ...currentLabels,
                        { name: `Bộ phận ${nextNum}`, description: 'Mô tả nguyên lý hoạt động của bộ phận mới' },
                      ],
                    }));
                  }}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm Nhãn</span>
                </button>
              </div>

              {((selectedScene as any).labels || []).map((lbl: any, lIdx: number) => (
                <div key={lIdx} className="p-2 border border-purple-200 rounded-lg bg-white space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-purple-700 shrink-0">0{lIdx + 1}</span>
                    <input
                      type="text"
                      value={lbl.name}
                      onChange={(e) => {
                        const newLabels = [...(selectedScene as any).labels];
                        newLabels[lIdx].name = e.target.value;
                        updateSceneProperty((s) => ({ ...s, labels: newLabels }));
                      }}
                      className="flex-1 p-1 border border-slate-200 rounded text-xs font-bold text-slate-800"
                      placeholder="Tên bộ phận"
                    />
                    {((selectedScene as any).labels || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newLabels = (selectedScene as any).labels.filter((_: any, idx: number) => idx !== lIdx);
                          updateSceneProperty((s) => ({ ...s, labels: newLabels }));
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Xóa nhãn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={lbl.description}
                    onChange={(e) => {
                      const newLabels = [...(selectedScene as any).labels];
                      newLabels[lIdx].description = e.target.value;
                      updateSceneProperty((s) => ({ ...s, labels: newLabels }));
                    }}
                    className="w-full p-1 border border-slate-200 rounded text-[11px] text-slate-600"
                    placeholder="Mô tả chức năng..."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sửa Tổng Kết & Bài Tiếp Theo nếu là OUTRO */}
        {selectedScene.type === 'OUTRO' && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
            <span className="font-bold text-indigo-950 block text-[11px] flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>Thông Số Thẻ Tổng Kết & Bài Học Kế Tiếp (Outro):</span>
            </span>

            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Bài Học Tiếp Theo (Next Lesson):</span>
              <input
                type="text"
                value={(selectedScene as any).nextLessonSuggestion || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, nextLessonSuggestion: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-medium"
                placeholder="Tên bài học tiếp theo..."
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Tên Giảng Viên / Tổ Bộ Môn:</span>
              <input
                type="text"
                value={(selectedScene as any).instructorName || ''}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, instructorName: e.target.value }))}
                className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                placeholder="STEMotion Academy"
              />
            </div>

            {/* Danh sách các ý tóm tắt */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700">Điểm Cốt Lõi Cần Nhớ:</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentPoints = (selectedScene as any).summaryPoints || [];
                    updateSceneProperty((s) => ({
                      ...s,
                      summaryPoints: [...currentPoints, 'Điểm cốt lõi mới cần ghi nhớ'],
                    }));
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm Ý</span>
                </button>
              </div>

              {((selectedScene as any).summaryPoints || []).map((pt: string, ptIdx: number) => (
                <div key={ptIdx} className="flex items-center gap-1.5 p-1 bg-white border border-indigo-200 rounded-lg">
                  <span className="text-indigo-600 font-bold font-mono text-xs pl-1">✓</span>
                  <input
                    type="text"
                    value={pt}
                    onChange={(e) => {
                      const newPoints = [...(selectedScene as any).summaryPoints];
                      newPoints[ptIdx] = e.target.value;
                      updateSceneProperty((s) => ({ ...s, summaryPoints: newPoints }));
                    }}
                    className="flex-1 p-1 border-0 text-xs font-medium text-slate-800 outline-hidden"
                  />
                  {((selectedScene as any).summaryPoints || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newPoints = (selectedScene as any).summaryPoints.filter((_: any, idx: number) => idx !== ptIdx);
                        updateSceneProperty((s) => ({ ...s, summaryPoints: newPoints }));
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chọn Giọng Đọc FPT.AI */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <span className="font-bold text-slate-800 block text-[11px] flex items-center space-x-1">
            <Mic className="w-3.5 h-3.5 text-brand-600" />
            <span>Giọng Đọc TTS Engine:</span>
          </span>
          <select 
            value={(selectedScene as any).voiceId || 'banmai'}
            onChange={(e) => updateSceneProperty((s) => ({ ...s, voiceId: e.target.value }))}
            className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white text-slate-700 font-medium"
          >
            <option value="banmai">FPT.AI - Ban Mai (Nữ miền Bắc chuẩn)</option>
            <option value="namminh">FPT.AI - Nam Minh (Nam miền Bắc)</option>
            <option value="myan">FPT.AI - Mỹ An (Nữ miền Trung)</option>
            <option value="giahuy">FPT.AI - Gia Huy (Nam miền Nam)</option>
            <option value="elevenlabs">ElevenLabs Multilingual v2</option>
          </select>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 shrink-0 mt-4 space-y-2">
        <button
          type="button"
          onClick={handleSaveVoice}
          className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-all ${
            isVoiceSaved
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
          }`}
        >
          {isVoiceSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Đã Lưu Cấu Hình Giọng Đọc!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình Giọng Đọc (TTS)</span>
            </>
          )}
        </button>
        <p className="text-[10px] text-slate-400 text-center leading-tight">
          * Nhấn nút <b>"Kết Xuất Toàn Bộ Video"</b> ở góc trên để chạy render MP4.
        </p>
      </div>
    </aside>
  );
};
