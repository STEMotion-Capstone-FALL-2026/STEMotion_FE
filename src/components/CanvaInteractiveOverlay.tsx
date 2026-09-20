import React, { useState } from 'react';
import { SceneData } from '../types/stem';
import { Edit3, Plus, Check, X, Sparkles, Type, Sliders, Maximize2 } from 'lucide-react';

interface CanvaInteractiveOverlayProps {
  scene: SceneData;
  updateSceneProperty?: (updater: (s: any) => any) => void;
  isPlaying: boolean;
  onPauseVideo: () => void;
}

export const CanvaInteractiveOverlay: React.FC<CanvaInteractiveOverlayProps> = ({
  scene,
  updateSceneProperty,
  isPlaying,
  onPauseVideo,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Nếu video đang chạy thì ẩn overlay để không che animation
  if (isPlaying || !updateSceneProperty) {
    return null;
  }

  const curFontSize = (scene as any).customFontSize || 30;

  const setFontSize = (val: number) => {
    const clamped = Math.min(60, Math.max(16, val));
    updateSceneProperty((s) => ({ ...s, customFontSize: clamped }));
  };

  const handleStartEdit = (field: string, initialText: string) => {
    setEditingField(field);
    setEditValue(initialText || '');
  };

  const handleSaveField = () => {
    if (!editingField) return;

    updateSceneProperty((s) => {
      const updated = { ...s } as any;
      if (editingField === 'title') updated.title = editValue;
      else if (editingField === 'subtitle') updated.subtitle = editValue;
      else if (editingField === 'badgeText') updated.badgeText = editValue;
      else if (editingField === 'gradeLevel') updated.gradeLevel = editValue;
      else if (editingField === 'latex') updated.latex = editValue;
      else if (editingField === 'equation') updated.equation = editValue;
      else if (editingField === 'observation') updated.observation = editValue;
      else if (editingField === 'reactants') updated.reactants = editValue;
      else if (editingField === 'products') updated.products = editValue;
      else if (editingField === 'condition') updated.condition = editValue;
      else if (editingField === 'processTitle') updated.processTitle = editValue;
      else if (editingField === 'question') updated.question = editValue;
      else if (editingField === 'quiz_explanation') updated.explanation = editValue;
      else if (editingField.startsWith('quiz_option_')) {
        const idx = parseInt(editingField.replace('quiz_option_', ''), 10);
        const opts = [...(updated.options || [])];
        opts[idx] = editValue;
        updated.options = opts;
      }
      else if (editingField === 'theoremName') updated.theoremName = editValue;
      else if (editingField === 'geometry_latex') updated.formulaLatex = editValue;
      else if (editingField === 'geom_side_a') {
        updated.dimensions = { ...(updated.dimensions || {}), a: parseFloat(editValue) || 3 };
      }
      else if (editingField === 'geom_side_b') {
        updated.dimensions = { ...(updated.dimensions || {}), b: parseFloat(editValue) || 4 };
      }
      else if (editingField === 'topicA_title') {
        updated.topicA = { ...(updated.topicA || {}), title: editValue };
      } else if (editingField === 'topicB_title') {
        updated.topicB = { ...(updated.topicB || {}), title: editValue };
      } else if (editingField === 'conclusion') updated.conclusion = editValue;
      else if (editingField === 'codeSnippet') updated.codeSnippet = editValue;
      else if (editingField === 'variableState') {
        if (updated.steps && updated.steps[0]) {
          updated.steps[0] = { ...updated.steps[0], variableState: editValue };
        }
      }
      else if (editingField === 'stepNote') {
        if (updated.steps && updated.steps[0]) {
          updated.steps[0] = { ...updated.steps[0], note: editValue };
        }
      }
      else if (editingField === 'instructorName') updated.instructorName = editValue;
      else if (editingField === 'nextLessonSuggestion') updated.nextLessonSuggestion = editValue;
      else if (editingField === 'diagramTitle') updated.diagramTitle = editValue;
      else if (editingField.startsWith('math_step_')) {
        const parts = editingField.split('_'); // ['math', 'step', idx, prop]
        const idx = parseInt(parts[2], 10);
        const prop = parts[3];
        const steps = [...(updated.steps || [])];
        if (steps[idx]) {
          steps[idx] = { ...steps[idx], [prop]: editValue };
          updated.steps = steps;
        }
      }
      else if (editingField.startsWith('stage_')) {
        const parts = editingField.split('_'); // ['stage', idx, prop]
        const idx = parseInt(parts[1], 10);
        const prop = parts[2];
        const stages = [...(updated.stages || [])];
        if (stages[idx]) {
          stages[idx] = { ...stages[idx], [prop]: editValue };
          updated.stages = stages;
        }
      }
      else if (editingField.startsWith('diagram_label_')) {
        const parts = editingField.split('_'); // ['diagram', 'label', idx, prop]
        const idx = parseInt(parts[2], 10);
        const prop = parts[3];
        const labels = [...(updated.labels || [])];
        if (labels[idx]) {
          labels[idx] = { ...labels[idx], [prop]: editValue };
          updated.labels = labels;
        }
      }
      else if (editingField.startsWith('outro_summary_')) {
        const idx = parseInt(editingField.replace('outro_summary_', ''), 10);
        const pts = [...(updated.summaryPoints || [])];
        pts[idx] = editValue;
        updated.summaryPoints = pts;
      }
      return updated;
    });

    setEditingField(null);
  };

  // 4 chốt góc kiểu Canva (Bounding box handles)
  const renderCanvaHandles = (color: string = 'border-blue-500') => (
    <>
      <div className={`absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 ${color} rounded-xs shadow-md z-30`} />
      <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 ${color} rounded-xs shadow-md z-30`} />
      <div className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 ${color} rounded-xs shadow-md z-30`} />
      <div className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 ${color} rounded-xs shadow-md z-30`} />
    </>
  );

  // Bộ thanh trượt font size dùng chung
  const renderFontSizeControl = (accent: 'blue' | 'amber' | 'emerald' | 'indigo' | 'rose' = 'blue') => {
    const accentColor =
      accent === 'amber'
        ? 'accent-amber-500 text-amber-400 bg-amber-950/80 border-amber-500/40'
        : accent === 'emerald'
        ? 'accent-emerald-500 text-emerald-400 bg-emerald-950/80 border-emerald-500/40'
        : accent === 'rose'
        ? 'accent-rose-500 text-rose-400 bg-rose-950/80 border-rose-500/40'
        : accent === 'indigo'
        ? 'accent-indigo-500 text-indigo-400 bg-indigo-950/80 border-indigo-500/40'
        : 'accent-blue-500 text-blue-400 bg-blue-950/80 border-blue-500/40';

    return (
      <div className="flex items-center gap-1.5 border-r border-slate-700 pr-2">
        <Type className="w-3.5 h-3.5 opacity-80 shrink-0" />
        <span className="text-[10px] opacity-80 font-bold shrink-0">Cỡ chữ:</span>

        <button
          type="button"
          onClick={() => setFontSize(curFontSize - 2)}
          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs transition-colors"
          title="Thu nhỏ chữ (-2px)"
        >
          -
        </button>

        <input
          type="range"
          min="18"
          max="54"
          step="2"
          value={curFontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className={`w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer ${accentColor.split(' ')[0]}`}
          title="Kéo trượt để điều chỉnh cỡ chữ mượt mà"
        />

        <button
          type="button"
          onClick={() => setFontSize(curFontSize + 2)}
          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs transition-colors"
          title="Phóng to chữ (+2px)"
        >
          +
        </button>

        <span className={`font-mono font-bold text-[11px] border px-1.5 py-0.5 rounded min-w-[34px] text-center ${accentColor.split(' ').slice(1).join(' ')}`}>
          {curFontSize}px
        </span>

        {/* 3 Nấc chọn nhanh */}
        <div className="flex items-center gap-1 ml-0.5">
          <button
            type="button"
            onClick={() => setFontSize(24)}
            className={`px-1 py-0.5 rounded text-[9px] font-bold ${
              curFontSize === 24 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Nhỏ
          </button>
          <button
            type="button"
            onClick={() => setFontSize(32)}
            className={`px-1 py-0.5 rounded text-[9px] font-bold ${
              curFontSize === 32 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Vừa
          </button>
          <button
            type="button"
            onClick={() => setFontSize(42)}
            className={`px-1 py-0.5 rounded text-[9px] font-bold ${
              curFontSize === 42 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            To
          </button>
        </div>
      </div>
    );
  };

  // Helper điều chỉnh tỉ lệ khung component bên trong (Card Scale)
  const renderCardScaleControl = (accentColor: string = 'text-indigo-400 border-indigo-500/40') => {
    const curScale = (scene as any).cardScale || 1.0;
    const setScale = (newScale: number) => {
      const clamped = Math.max(0.7, Math.min(1.5, Number(newScale.toFixed(2))));
      updateSceneProperty((s) => ({
        ...s,
        cardScale: clamped,
      }));
    };

    return (
      <div className="flex items-center gap-1.5 border-r border-slate-700 pr-2">
        <Maximize2 className="w-3.5 h-3.5 opacity-80 shrink-0 text-indigo-400" />
        <span className="text-[10px] opacity-80 font-bold shrink-0">Khung:</span>

        <button
          type="button"
          onClick={() => setScale(curScale - 0.05)}
          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs transition-colors"
          title="Thu nhỏ khung (-5%)"
        >
          -
        </button>

        <span className={`font-mono font-bold text-[11px] border px-1.5 py-0.5 rounded min-w-[34px] text-center ${accentColor.split(' ').slice(1).join(' ')}`}>
          {Math.round(curScale * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setScale(curScale + 0.05)}
          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs transition-colors"
          title="Phóng to khung (+5%)"
        >
          +
        </button>
      </div>
    );
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedTarget(null);
          setEditingField(null);
        }
      }}
      className="absolute inset-0 z-20 pointer-events-auto select-none"
    >
      {/* Badge báo hiệu chế độ Canva WYSIWYG */}
      <div className="absolute top-2.5 right-3 bg-slate-900/90 border border-blue-500/40 text-blue-400 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg pointer-events-none z-30">
        <Sparkles className="w-3 h-3 text-brand-400 animate-pulse" />
        <span>Canva Mode ({scene.type}): Click trực tiếp để tùy biến</span>
      </div>

      {/* 1. KHU VỰC TIÊU ĐỀ PHÂN CẢNH (TOP TITLE) - DÙNG CHUNG CHO TẤT CẢ SCENES */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTarget('title');
        }}
        onDoubleClick={() => handleStartEdit('title', scene.title)}
        className={`absolute top-3 left-7 right-44 h-11 rounded-lg transition-all cursor-pointer flex items-center px-2 group ${
          selectedTarget === 'title'
            ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-lg'
            : 'hover:ring-1 hover:ring-blue-400/60 hover:bg-blue-500/5'
        }`}
      >
        {selectedTarget === 'title' && renderCanvaHandles()}

        {selectedTarget === 'title' && !editingField && (
          <div className="absolute -bottom-11 left-0 bg-slate-900/95 border border-blue-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in">
            {renderFontSizeControl('blue')}
            <button
              onClick={() => handleStartEdit('title', scene.title)}
              className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 text-[11px]"
            >
              <Edit3 className="w-3 h-3" />
              <span>Sửa Tên</span>
            </button>
            <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {editingField === 'title' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-slate-900 border-2 border-blue-500 rounded-lg flex items-center px-2 z-40 shadow-2xl"
          >
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveField();
                if (e.key === 'Escape') setEditingField(null);
              }}
              autoFocus
              className="w-full bg-transparent text-white font-bold text-sm outline-hidden"
            />
            <button onClick={handleSaveField} className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-1">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditingField(null)} className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. CÁC VÙNG TƯƠNG TÁC CHUYÊN BIỆT CHO TỪNG TEMPLATE */}

      {/* TEMPLATE: COMPARISON_SPLIT */}
      {scene.type === 'COMPARISON_SPLIT' && (
        <>
          {/* Cột A */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('topicA');
            }}
            className={`absolute top-16 bottom-14 left-7 w-[43%] rounded-xl transition-all cursor-pointer ${
              selectedTarget === 'topicA'
                ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-blue-400/50 hover:bg-blue-500/5'
            }`}
          >
            {selectedTarget === 'topicA' && renderCanvaHandles('border-blue-500')}

            {selectedTarget === 'topicA' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 left-0 bg-slate-900/95 border border-blue-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('blue')}
                <button
                  onClick={() => handleStartEdit('topicA_title', (scene as any).topicA?.title || 'Khái Niệm A')}
                  className="px-2 py-0.5 rounded bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Tiêu Đề</span>
                </button>
                <button
                  onClick={() => {
                    const currentPoints = (scene as any).topicA?.points || [];
                    updateSceneProperty((s) => ({
                      ...s,
                      topicA: { ...(s as any).topicA, points: [...currentPoints, 'Ý so sánh mới'] },
                    }));
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm Ý</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Cột B */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('topicB');
            }}
            className={`absolute top-16 bottom-14 right-7 w-[43%] rounded-xl transition-all cursor-pointer ${
              selectedTarget === 'topicB'
                ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-amber-400/50 hover:bg-amber-500/5'
            }`}
          >
            {selectedTarget === 'topicB' && renderCanvaHandles('border-amber-500')}

            {selectedTarget === 'topicB' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 right-0 bg-slate-900/95 border border-amber-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('amber')}
                <button
                  onClick={() => handleStartEdit('topicB_title', (scene as any).topicB?.title || 'Khái Niệm B')}
                  className="px-2 py-0.5 rounded bg-amber-600/80 hover:bg-amber-600 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Tiêu Đề</span>
                </button>
                <button
                  onClick={() => {
                    const currentPoints = (scene as any).topicB?.points || [];
                    updateSceneProperty((s) => ({
                      ...s,
                      topicB: { ...(s as any).topicB, points: [...currentPoints, 'Ý so sánh mới'] },
                    }));
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm Ý</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Kết luận */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('conclusion');
            }}
            onDoubleClick={() => handleStartEdit('conclusion', (scene as any).conclusion || '')}
            className={`absolute bottom-3 left-7 right-7 h-9 rounded-lg transition-all cursor-pointer flex items-center px-3 ${
              selectedTarget === 'conclusion'
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10 shadow-lg'
                : 'hover:ring-1 hover:ring-emerald-400/50 hover:bg-emerald-500/5'
            }`}
          >
            {selectedTarget === 'conclusion' && renderCanvaHandles('border-emerald-500')}
            {selectedTarget === 'conclusion' && !editingField && (
              <div className="absolute -top-9 left-0 bg-slate-900/95 border border-emerald-500/60 rounded-lg shadow-2xl p-1 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in">
                <span className="text-[10px] text-emerald-400 font-bold px-1">Kết luận:</span>
                <button
                  onClick={() => handleStartEdit('conclusion', (scene as any).conclusion || '')}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1 text-[11px]"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Trực Tiếp</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* TEMPLATE 1: TITLE_HERO */}
      {scene.type === 'TITLE_HERO' && (
        <>
          {/* Sub 1: Badge Phân Cấp / Lớp */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('heroBadge');
            }}
            className={`absolute top-14 left-1/3 right-1/3 h-10 rounded-full transition-all cursor-pointer flex items-center justify-center ${
              selectedTarget === 'heroBadge'
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10 shadow-lg'
                : 'hover:ring-1 hover:ring-emerald-400/50 hover:bg-emerald-500/5'
            }`}
          >
            {selectedTarget === 'heroBadge' && renderCanvaHandles('border-emerald-500')}
            {selectedTarget === 'heroBadge' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-11 bg-slate-900/95 border border-emerald-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                <button
                  onClick={() => handleStartEdit('gradeLevel', (scene as any).gradeLevel || 'Lớp 12')}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Khối Lớp</span>
                </button>
                <button
                  onClick={() => handleStartEdit('badgeText', (scene as any).badgeText || 'STEMotion Studio')}
                  className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Nhãn Badge</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 2: Tiêu Đề Chính */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('heroTitle');
            }}
            className={`absolute top-28 left-8 right-8 h-28 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center p-4 ${
              selectedTarget === 'heroTitle'
                ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-blue-400/50 hover:bg-blue-500/5'
            }`}
          >
            {selectedTarget === 'heroTitle' && renderCanvaHandles('border-blue-500')}
            {selectedTarget === 'heroTitle' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 bg-slate-900/95 border border-blue-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('blue')}
                {renderCardScaleControl('text-blue-400 border-blue-500/40')}
                <button
                  onClick={() => handleStartEdit('title', scene.title)}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Tiêu Đề</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 3: Phụ Đề */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('heroSubtitle');
            }}
            className={`absolute bottom-16 left-12 right-12 h-16 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center p-3 ${
              selectedTarget === 'heroSubtitle'
                ? 'ring-2 ring-purple-500 bg-purple-500/10 shadow-xl'
                : 'hover:ring-1 hover:ring-purple-400/50 hover:bg-purple-500/5'
            }`}
          >
            {selectedTarget === 'heroSubtitle' && renderCanvaHandles('border-purple-500')}
            {selectedTarget === 'heroSubtitle' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-11 bg-slate-900/95 border border-purple-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                <button
                  onClick={() => handleStartEdit('subtitle', (scene as any).subtitle || '')}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Phụ Đề</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* TEMPLATE 2: MATH_FORMULA (TỪNG THẺ CON RIÊNG BIỆT) */}
      {scene.type === 'MATH_FORMULA' && (
        <>
          {/* Sub 1: Thẻ Công Thức Cốt Lõi (Trung Tâm Phía Trên) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('mathMainFormula');
            }}
            className={`absolute top-14 bottom-36 left-12 right-12 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center p-6 ${
              selectedTarget === 'mathMainFormula'
                ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-blue-400/50 hover:bg-blue-500/5'
            }`}
          >
            {selectedTarget === 'mathMainFormula' && renderCanvaHandles('border-blue-500')}
            {selectedTarget === 'mathMainFormula' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 bg-slate-900/95 border border-blue-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('blue')}
                {renderCardScaleControl('text-blue-400 border-blue-500/40')}
                <button
                  onClick={() => handleStartEdit('latex', (scene as any).latex || '')}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Mã LaTeX</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 2, 3, 4: 3 Thẻ Bước Triển Khai Phía Dưới */}
          <div className="absolute bottom-6 h-28 left-10 right-10 grid grid-cols-3 gap-4 pointer-events-none">
            {[0, 1, 2].map((stepIdx) => {
              const targetKey = `mathStep_${stepIdx}`;
              const isSelected = selectedTarget === targetKey;
              const stepData = (scene as any).steps?.[stepIdx] || {};

              return (
                <div
                  key={stepIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTarget(targetKey);
                  }}
                  className={`pointer-events-auto rounded-xl transition-all cursor-pointer relative p-3 flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-amber-500 bg-amber-500/15 shadow-xl'
                      : 'hover:ring-1 hover:ring-amber-400/50 hover:bg-amber-500/5'
                  }`}
                >
                  {isSelected && renderCanvaHandles('border-amber-500')}

                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-11 left-0 bg-slate-900/95 border border-amber-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-1.5 text-xs text-white z-40 backdrop-blur-md animate-fade-in whitespace-nowrap"
                    >
                      <span className="text-[10px] text-amber-400 font-bold font-mono">B{stepIdx + 1}:</span>
                      <button
                        onClick={() => handleStartEdit(`math_step_${stepIdx}_label`, stepData.label || `Bước ${stepIdx + 1}`)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Nhãn</span>
                      </button>
                      <button
                        onClick={() => handleStartEdit(`math_step_${stepIdx}_latexSnippet`, stepData.latexSnippet || '')}
                        className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium flex items-center gap-1 font-mono"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>LaTeX</span>
                      </button>
                      <button
                        onClick={() => handleStartEdit(`math_step_${stepIdx}_explanation`, stepData.explanation || '')}
                        className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Diễn giải</span>
                      </button>
                      <button onClick={() => setSelectedTarget(null)} className="p-0.5 text-slate-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TEMPLATE 3: CHEMICAL_REACTION (TỪNG KHỐI RIÊNG BIỆT) */}
      {scene.type === 'CHEMICAL_REACTION' && (
        <>
          {/* Sub 1: Khối Mô Phỏng Ống Nghiệm / Flask (Trái) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('chemFlask');
            }}
            className={`absolute top-14 bottom-14 left-8 w-[38%] rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center p-6 ${
              selectedTarget === 'chemFlask'
                ? 'ring-2 ring-rose-500 bg-rose-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-rose-400/50 hover:bg-rose-500/5'
            }`}
          >
            {selectedTarget === 'chemFlask' && renderCanvaHandles('border-rose-500')}
            {selectedTarget === 'chemFlask' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 left-0 bg-slate-900/95 border border-rose-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderCardScaleControl('text-rose-400 border-rose-500/40')}
                <button
                  onClick={() => handleStartEdit('condition', (scene as any).condition || 'Nhiệt độ phòng')}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Điều Kiện</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 2: Khối Phương Trình Hóa Học (Phải Trên) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('chemEquation');
            }}
            className={`absolute top-14 left-[42%] right-8 h-26 rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-4 ${
              selectedTarget === 'chemEquation'
                ? 'ring-2 ring-indigo-500 bg-indigo-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-indigo-400/50 hover:bg-indigo-500/5'
            }`}
          >
            {selectedTarget === 'chemEquation' && renderCanvaHandles('border-indigo-500')}
            {selectedTarget === 'chemEquation' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 right-0 bg-slate-900/95 border border-indigo-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('indigo')}
                <button
                  onClick={() => handleStartEdit('equation', (scene as any).equation || '')}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Phương Trình LaTeX</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 3: Khối Chất Tham Gia & Sản Phẩm (Phải Giữa) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('chemIO');
            }}
            className={`absolute top-44 left-[42%] right-8 h-24 rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-4 ${
              selectedTarget === 'chemIO'
                ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-amber-400/50 hover:bg-amber-500/5'
            }`}
          >
            {selectedTarget === 'chemIO' && renderCanvaHandles('border-amber-500')}
            {selectedTarget === 'chemIO' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 right-0 bg-slate-900/95 border border-amber-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                <button
                  onClick={() => handleStartEdit('reactants', (scene as any).reactants || '')}
                  className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Chất Tham Gia</span>
                </button>
                <button
                  onClick={() => handleStartEdit('products', (scene as any).products || '')}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sản Phẩm</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 4: Hiện Tượng Quan Sát (Phải Dưới) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('chemObservation');
            }}
            className={`absolute bottom-14 left-[42%] right-8 h-20 rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-4 ${
              selectedTarget === 'chemObservation'
                ? 'ring-2 ring-rose-500 bg-rose-500/10 shadow-xl'
                : 'hover:ring-1 hover:ring-rose-400/50 hover:bg-rose-500/5'
            }`}
          >
            {selectedTarget === 'chemObservation' && renderCanvaHandles('border-rose-500')}
            {selectedTarget === 'chemObservation' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-11 right-0 bg-slate-900/95 border border-rose-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                <button
                  onClick={() => handleStartEdit('observation', (scene as any).observation || '')}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Hiện Tượng</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* TEMPLATE 5: PROCESS_TIMELINE (TIÊU ĐỀ & 4 PHA RIÊNG BIỆT) */}
      {scene.type === 'PROCESS_TIMELINE' && (
        <>
          {/* Sub 1: Tiêu đề chu trình */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('timelineTitle');
            }}
            className={`absolute top-12 left-1/4 right-1/4 h-11 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              selectedTarget === 'timelineTitle'
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10 shadow-lg'
                : 'hover:ring-1 hover:ring-emerald-400/50 hover:bg-emerald-500/5'
            }`}
          >
            {selectedTarget === 'timelineTitle' && renderCanvaHandles('border-emerald-500')}
            {selectedTarget === 'timelineTitle' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-11 bg-slate-900/95 border border-emerald-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('emerald')}
                <button
                  onClick={() => handleStartEdit('processTitle', (scene as any).processTitle || '')}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Tên Chu Trình</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 2: 4 Thẻ Giai Đoạn (Pipeline Stages) */}
          <div className="absolute top-28 bottom-14 left-8 right-8 grid grid-cols-4 gap-3 pointer-events-none">
            {[0, 1, 2, 3].map((stageIdx) => {
              const targetKey = `timelineStage_${stageIdx}`;
              const isSelected = selectedTarget === targetKey;
              const stageData = (scene as any).stages?.[stageIdx] || {};

              return (
                <div
                  key={stageIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTarget(targetKey);
                  }}
                  className={`pointer-events-auto rounded-xl transition-all cursor-pointer relative p-3 flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-teal-500 bg-teal-500/15 shadow-xl'
                      : 'hover:ring-1 hover:ring-teal-400/50 hover:bg-teal-500/5'
                  }`}
                >
                  {isSelected && renderCanvaHandles('border-teal-500')}

                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-11 left-0 bg-slate-900/95 border border-teal-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-1.5 text-xs text-white z-40 backdrop-blur-md animate-fade-in whitespace-nowrap"
                    >
                      {renderCardScaleControl('text-teal-400 border-teal-500/40')}
                      <button
                        onClick={() => handleStartEdit(`stage_${stageIdx}_title`, stageData.title || `Giai đoạn ${stageIdx + 1}`)}
                        className="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Tên</span>
                      </button>
                      <button
                        onClick={() => handleStartEdit(`stage_${stageIdx}_description`, stageData.description || '')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Mô tả</span>
                      </button>
                      <button onClick={() => setSelectedTarget(null)} className="p-0.5 text-slate-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TEMPLATE 6: STEM_QUIZ (CÂU HỎI & 4 LỰA CHỌN A-B-C-D RIÊNG BIỆT) */}
      {scene.type === 'STEM_QUIZ' && (
        <>
          {/* Sub 1: Thẻ Câu Hỏi (Phía Trên) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('quizQuestion');
            }}
            className={`absolute top-14 left-10 right-10 h-28 rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-5 ${
              selectedTarget === 'quizQuestion'
                ? 'ring-2 ring-rose-500 bg-rose-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-rose-400/50 hover:bg-rose-500/5'
            }`}
          >
            {selectedTarget === 'quizQuestion' && renderCanvaHandles('border-rose-500')}
            {selectedTarget === 'quizQuestion' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 left-0 bg-slate-900/95 border border-rose-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('rose')}
                {renderCardScaleControl('text-rose-400 border-rose-500/40')}
                <button
                  onClick={() => handleStartEdit('question', (scene as any).question || '')}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Câu Hỏi</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 2..5: Lưới 4 Phương Án A, B, C, D */}
          <div className="absolute top-46 bottom-14 left-10 right-10 grid grid-cols-2 gap-4 pointer-events-none">
            {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
              const targetKey = `quizOption_${optIdx}`;
              const isSelected = selectedTarget === targetKey;
              const optVal = (scene as any).options?.[optIdx] || '';
              const isCorrect = (scene as any).correctIndex === optIdx;

              return (
                <div
                  key={letter}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTarget(targetKey);
                  }}
                  className={`pointer-events-auto rounded-xl transition-all cursor-pointer relative p-3 flex items-center ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 bg-emerald-500/15 shadow-xl'
                      : 'hover:ring-1 hover:ring-emerald-400/50 hover:bg-emerald-500/5'
                  }`}
                >
                  {isSelected && renderCanvaHandles('border-emerald-500')}

                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-11 left-0 bg-slate-900/95 border border-emerald-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in whitespace-nowrap"
                    >
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">Phương án {letter}:</span>
                      <button
                        onClick={() => handleStartEdit(`quiz_option_${optIdx}`, optVal)}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa Nội Dung</span>
                      </button>
                      <button
                        onClick={() => updateSceneProperty((s) => ({ ...s, correctIndex: optIdx }))}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{isCorrect ? 'Đáp Án Đúng ✓' : 'Chọn Làm Đáp Án Đúng'}</span>
                      </button>
                      <button onClick={() => setSelectedTarget(null)} className="p-0.5 text-slate-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TEMPLATE 7: GEOMETRY_SPACE (MÔ HÌNH HÌNH HỌC SVG & ĐỊNH LÝ) */}
      {scene.type === 'GEOMETRY_SPACE' && (
        <>
          {/* Sub 1: Mô hình hình học SVG (Cột Trái) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('geomSvg');
            }}
            className={`absolute top-14 bottom-14 left-8 w-[40%] rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center p-4 ${
              selectedTarget === 'geomSvg'
                ? 'ring-2 ring-cyan-500 bg-cyan-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-cyan-400/50 hover:bg-cyan-500/5'
            }`}
          >
            {selectedTarget === 'geomSvg' && renderCanvaHandles('border-cyan-500')}
            {selectedTarget === 'geomSvg' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 left-0 bg-slate-900/95 border border-cyan-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderCardScaleControl('text-cyan-400 border-cyan-500/40')}
                <button
                  onClick={() => handleStartEdit('geom_side_a', String((scene as any).dimensions?.a || 3))}
                  className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Cạnh a</span>
                </button>
                <button
                  onClick={() => handleStartEdit('geom_side_b', String((scene as any).dimensions?.b || 4))}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Cạnh b</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 2: Tên Định Lý & KaTeX (Cột Phải Trên) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('geomTheorem');
            }}
            className={`absolute top-14 left-[44%] right-8 h-34 rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-4 ${
              selectedTarget === 'geomTheorem'
                ? 'ring-2 ring-indigo-500 bg-indigo-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-indigo-400/50 hover:bg-indigo-500/5'
            }`}
          >
            {selectedTarget === 'geomTheorem' && renderCanvaHandles('border-indigo-500')}
            {selectedTarget === 'geomTheorem' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 right-0 bg-slate-900/95 border border-indigo-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('indigo')}
                <button
                  onClick={() => handleStartEdit('theoremName', (scene as any).theoremName || 'Định lý')}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Tên Định Lý</span>
                </button>
                <button
                  onClick={() => handleStartEdit('geometry_latex', (scene as any).formulaLatex || '')}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium flex items-center gap-1 font-mono"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Mã LaTeX</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 3: Tính Toán & Kích Thước (Cột Phải Dưới) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('geomProof');
            }}
            className={`absolute bottom-14 left-[44%] right-8 h-32 rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-4 ${
              selectedTarget === 'geomProof'
                ? 'ring-2 ring-cyan-500 bg-cyan-500/10 shadow-xl'
                : 'hover:ring-1 hover:ring-cyan-400/50 hover:bg-cyan-500/5'
            }`}
          >
            {selectedTarget === 'geomProof' && renderCanvaHandles('border-cyan-500')}
            {selectedTarget === 'geomProof' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-11 right-0 bg-slate-900/95 border border-cyan-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                <span className="text-[10px] text-cyan-400 font-mono">
                  a={(scene as any).dimensions?.a} | b={(scene as any).dimensions?.b} | c={(scene as any).dimensions?.c}
                </span>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* TEMPLATE 8: DATA_CHART */}
      {scene.type === 'DATA_CHART' && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTarget('dataChart');
          }}
          className={`absolute top-14 bottom-12 left-10 right-10 rounded-2xl transition-all cursor-pointer flex flex-col justify-center items-center p-6 ${
            selectedTarget === 'dataChart'
              ? 'ring-2 ring-emerald-500 bg-emerald-500/10 shadow-2xl'
              : 'hover:ring-1 hover:ring-emerald-400/50 hover:bg-emerald-500/5'
          }`}
        >
          {selectedTarget === 'dataChart' && renderCanvaHandles('border-emerald-500')}
          {selectedTarget === 'dataChart' && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute -top-12 bg-slate-900/95 border border-emerald-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
            >
              {renderFontSizeControl('emerald')}
              {renderCardScaleControl('text-emerald-400 border-emerald-500/40')}
              <button
                onClick={() => handleStartEdit('xAxisLabel', (scene as any).xAxisLabel || '')}
                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Trục X</span>
              </button>
              <button
                onClick={() => handleStartEdit('yAxisLabel', (scene as any).yAxisLabel || '')}
                className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-medium flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Trục Y</span>
              </button>
              <button
                onClick={() => {
                  const pts = (scene as any).dataPoints || [];
                  updateSceneProperty((s) => ({
                    ...s,
                    dataPoints: [
                      ...pts,
                      { label: `Mẫu ${pts.length + 1}`, value: Math.round((Math.random() * 4 + 1) * 100) / 100 },
                    ],
                  }));
                }}
                className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm Cột</span>
              </button>
              <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TEMPLATE 9: DIAGRAM_EXPLAINER (SƠ ĐỒ TRÁI & 3 NHÃN PHẢI) */}
      {scene.type === 'DIAGRAM_EXPLAINER' && (
        <>
          {/* Sub 1: Sơ đồ tương tác (Trái) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('diagramCanvas');
            }}
            className={`absolute top-14 bottom-14 left-8 w-[45%] rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center p-6 ${
              selectedTarget === 'diagramCanvas'
                ? 'ring-2 ring-purple-500 bg-purple-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-purple-400/50 hover:bg-purple-500/5'
            }`}
          >
            {selectedTarget === 'diagramCanvas' && renderCanvaHandles('border-purple-500')}
            {selectedTarget === 'diagramCanvas' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 left-0 bg-slate-900/95 border border-purple-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderCardScaleControl('text-purple-400 border-purple-500/40')}
                <button
                  onClick={() => handleStartEdit('diagramTitle', (scene as any).diagramTitle || 'Sơ đồ cơ chế')}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Tiêu Đề</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 2..4: Danh sách các nhãn giải thích (Phải) */}
          <div className="absolute top-14 bottom-14 right-8 left-[50%] flex flex-col justify-between pointer-events-none">
            {[0, 1, 2].map((labelIdx) => {
              const targetKey = `diagramLabel_${labelIdx}`;
              const isSelected = selectedTarget === targetKey;
              const labelData = (scene as any).labels?.[labelIdx] || {};

              return (
                <div
                  key={labelIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTarget(targetKey);
                  }}
                  className={`pointer-events-auto h-22 rounded-xl transition-all cursor-pointer relative p-3 flex flex-col justify-center ${
                    isSelected
                      ? 'ring-2 ring-purple-500 bg-purple-500/15 shadow-xl'
                      : 'hover:ring-1 hover:ring-purple-400/50 hover:bg-purple-500/5'
                  }`}
                >
                  {isSelected && renderCanvaHandles('border-purple-500')}

                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-11 left-0 bg-slate-900/95 border border-purple-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in whitespace-nowrap"
                    >
                      <span className="text-[10px] text-purple-400 font-bold font-mono">Nhãn 0{labelIdx + 1}:</span>
                      <button
                        onClick={() => handleStartEdit(`diagram_label_${labelIdx}_name`, labelData.name || `Nhãn ${labelIdx + 1}`)}
                        className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Sửa Tên</span>
                      </button>
                      <button
                        onClick={() => handleStartEdit(`diagram_label_${labelIdx}_description`, labelData.description || '')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Sửa Mô Tả</span>
                      </button>
                      <button onClick={() => setSelectedTarget(null)} className="p-0.5 text-slate-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TEMPLATE 10: ALGORITHM_WALKTHROUGH (CODE & BỘ NHỚ) */}
      {scene.type === 'ALGORITHM_WALKTHROUGH' && (
        <>
          {/* Sub-component 1: Khung Mã Nguồn Code (Bên Trái) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('codeBox');
            }}
            className={`absolute top-14 bottom-12 left-8 w-[46%] rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-4 ${
              selectedTarget === 'codeBox'
                ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-amber-400/50 hover:bg-amber-500/5'
            }`}
          >
            {selectedTarget === 'codeBox' && renderCanvaHandles('border-amber-500')}
            {selectedTarget === 'codeBox' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 left-0 bg-slate-900/95 border border-amber-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('amber')}
                <button
                  onClick={() => handleStartEdit('codeSnippet', (scene as any).codeSnippet || '')}
                  className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Code</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub-component 2: Khung Bộ Nhớ (Phải Trên) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('memoryBox');
            }}
            className={`absolute top-14 right-8 w-[46%] h-36 rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-4 ${
              selectedTarget === 'memoryBox'
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-emerald-400/50 hover:bg-emerald-500/5'
            }`}
          >
            {selectedTarget === 'memoryBox' && renderCanvaHandles('border-emerald-500')}
            {selectedTarget === 'memoryBox' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 right-0 bg-slate-900/95 border border-emerald-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderCardScaleControl('text-emerald-400 border-emerald-500/40')}
                <button
                  onClick={() =>
                    handleStartEdit(
                      'variableState',
                      (scene as any).steps?.[0]?.variableState || '{ i: 0, arr: [2, 5, 8] }'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Biến Nhớ</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub-component 3: Lời bình thuật toán (Phải Dưới) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('noteBox');
            }}
            className={`absolute bottom-12 right-8 w-[46%] h-28 rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-4 ${
              selectedTarget === 'noteBox'
                ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-blue-400/50 hover:bg-blue-500/5'
            }`}
          >
            {selectedTarget === 'noteBox' && renderCanvaHandles('border-blue-500')}
            {selectedTarget === 'noteBox' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-11 right-0 bg-slate-900/95 border border-blue-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                <button
                  onClick={() =>
                    handleStartEdit(
                      'stepNote',
                      (scene as any).steps?.[0]?.note || 'Đang thực thi lệnh tiếp theo...'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Lời Bình</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* TEMPLATE 11: OUTRO (ĐIỂM CỐT LÕI & BÀI HỌC KẾ TIẾP) */}
      {scene.type === 'OUTRO' && (
        <>
          {/* Sub 1: Thẻ Điểm Cốt Lõi (Trái) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('outroTakeaways');
            }}
            className={`absolute top-14 bottom-14 left-8 w-[46%] rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-6 ${
              selectedTarget === 'outroTakeaways'
                ? 'ring-2 ring-indigo-500 bg-indigo-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-indigo-400/50 hover:bg-indigo-500/5'
            }`}
          >
            {selectedTarget === 'outroTakeaways' && renderCanvaHandles('border-indigo-500')}
            {selectedTarget === 'outroTakeaways' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 left-0 bg-slate-900/95 border border-indigo-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                {renderFontSizeControl('indigo')}
                {renderCardScaleControl('text-indigo-400 border-indigo-500/40')}
                <button
                  onClick={() => {
                    const curPts = (scene as any).summaryPoints || [];
                    updateSceneProperty((s) => ({
                      ...s,
                      summaryPoints: [...curPts, 'Điểm ghi nhớ mới'],
                    }));
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm Ý</span>
                </button>
                <button
                  onClick={() => handleStartEdit('instructorName', (scene as any).instructorName || 'STEMotion Academy')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Giảng Viên</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sub 2: Thẻ Bài Học Kế Tiếp (Phải) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTarget('outroUpNext');
            }}
            className={`absolute top-14 bottom-14 right-8 w-[46%] rounded-2xl transition-all cursor-pointer flex flex-col justify-center p-6 ${
              selectedTarget === 'outroUpNext'
                ? 'ring-2 ring-purple-500 bg-purple-500/10 shadow-2xl'
                : 'hover:ring-1 hover:ring-purple-400/50 hover:bg-purple-500/5'
            }`}
          >
            {selectedTarget === 'outroUpNext' && renderCanvaHandles('border-purple-500')}
            {selectedTarget === 'outroUpNext' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 right-0 bg-slate-900/95 border border-purple-500/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 text-xs text-white z-40 backdrop-blur-md animate-fade-in"
              >
                <button
                  onClick={() => handleStartEdit('nextLessonSuggestion', (scene as any).nextLessonSuggestion || 'Bài học kế tiếp')}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa Tên Bài Học Kế Tiếp</span>
                </button>
                <button onClick={() => setSelectedTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL / POPOVER SOẠN THẢO TRỰC TIẾP TRÊN MÀN HÌNH VIDEO */}
      {editingField && editingField !== 'title' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-12 top-20 bg-slate-900/98 border-2 border-blue-500 rounded-2xl p-4 z-50 shadow-2xl space-y-3 backdrop-blur-xl animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa trực tiếp trên màn hình: <b>{editingField}</b></span>
            </span>
            <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            rows={4}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-700 text-xs focus:border-blue-500 outline-hidden font-medium leading-relaxed"
            placeholder="Nhập nội dung mới..."
          />

          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] text-slate-500">Nhấn "Lưu lại" để cập nhật tức thì vào video</span>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingField(null)}
                className="px-3 py-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveField}
                className="px-4 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Lại</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
