import React, { useState } from 'react';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Edit2,
  Check,
  Library,
  GripVertical,
} from 'lucide-react';
import { SceneData } from '../../../types/stem';

interface SceneListColumnProps {
  scenes: SceneData[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onAddNewScene: (type?: SceneData['type']) => void;
  onDeleteScene: (id: string) => void;
  onMoveScene: (index: number, direction: 'up' | 'down') => void;
  onReorderScenes: (fromIndex: number, toIndex: number) => void;
  onDuplicateScene: (scene: SceneData) => void;
  onChangeDuration: (sceneId: string, seconds: number) => void;
  onUpdateSceneTitle: (sceneId: string, newTitle: string) => void;
  onOpenTemplateCatalog: () => void;
}

export const SceneListColumn: React.FC<SceneListColumnProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddNewScene,
  onDeleteScene,
  onMoveScene,
  onReorderScenes,
  onDuplicateScene,
  onChangeDuration,
  onUpdateSceneTitle,
  onOpenTemplateCatalog,
}) => {
  const [editingSceneTitleId, setEditingSceneTitleId] = useState<string | null>(null);
  const [inlineTitleValue, setInlineTitleValue] = useState<string>('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleStartEditTitle = (e: React.MouseEvent, sceneId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingSceneTitleId(sceneId);
    setInlineTitleValue(currentTitle);
  };

  const handleSaveInlineTitle = (sceneId: string) => {
    if (inlineTitleValue.trim()) {
      onUpdateSceneTitle(sceneId, inlineTitleValue.trim());
    }
    setEditingSceneTitleId(null);
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-4 h-full min-h-0 overflow-hidden shrink-0">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-bold uppercase tracking-wider text-slate-500">
          Phân cảnh ({scenes.length})
        </span>
        <button
          onClick={() => onAddNewScene('MATH_FORMULA')}
          className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Thêm Cảnh
        </button>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {scenes.map((sc, idx) => {
          const isActive = sc.id === activeSceneId;
          const isEditingTitle = editingSceneTitleId === sc.id;
          const isDragging = draggedIdx === idx;
          const isOver = dragOverIdx === idx && draggedIdx !== idx;

          return (
            <div
              key={sc.id}
              draggable={!isEditingTitle}
              onDragStart={(e) => {
                setDraggedIdx(idx);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverIdx !== idx) setDragOverIdx(idx);
              }}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIdx !== null && draggedIdx !== idx) {
                  onReorderScenes(draggedIdx, idx);
                }
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              onClick={() => onSelectScene(sc.id)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all select-none ${
                isDragging
                  ? 'opacity-40 border-dashed border-indigo-400 scale-[0.98]'
                  : isOver
                  ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-400 scale-[1.01]'
                  : isActive
                  ? 'bg-indigo-50/90 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Header of Card: Index, Reorder arrows, Duration select, Duplicate & Delete */}
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors p-0.5"
                    title="Kéo thả chuột để di chuyển thứ tự phân cảnh"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    0{idx + 1}
                  </span>

                  {/* Reorder Up / Down */}
                  <div className="flex items-center">
                    {idx > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveScene(idx, 'up');
                        }}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors"
                        title="Di chuyển phân cảnh lên trước"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {idx < scenes.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveScene(idx, 'down');
                        }}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors"
                        title="Di chuyển phân cảnh xuống sau"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Sửa Thời Lượng Nhanh (Duration) */}
                  <select
                    value={Math.round((sc.durationInFrames || 150) / 30)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onChangeDuration(sc.id, parseInt(e.target.value));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-mono font-bold text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5 hover:border-indigo-400 cursor-pointer focus:outline-none shadow-2xs"
                    title="Thời lượng phân cảnh"
                  >
                    <option value={3}>3s</option>
                    <option value={5}>5s</option>
                    <option value={6}>6s</option>
                    <option value={8}>8s</option>
                    <option value={10}>10s</option>
                    <option value={15}>15s</option>
                  </select>

                  {/* Nhân bản Scene */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateScene(sc);
                    }}
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                    title="Nhân bản phân cảnh này"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {/* Xóa Scene */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScene(sc.id);
                    }}
                    className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                    title="Xóa phân cảnh này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Tiêu đề Phân Cảnh (Hỗ trợ nhấp đúp hoặc bấm bút để sửa trực tiếp) */}
              {isEditingTitle ? (
                <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={inlineTitleValue}
                    onChange={(e) => setInlineTitleValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveInlineTitle(sc.id);
                      if (e.key === 'Escape') setEditingSceneTitleId(null);
                    }}
                    autoFocus
                    placeholder="Nhập tên cảnh..."
                    className="w-full px-2 py-1 text-xs font-bold border border-indigo-500 rounded-lg bg-white focus:outline-none shadow-inner"
                  />
                  <button
                    onClick={() => handleSaveInlineTitle(sc.id)}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-2xs shrink-0"
                    title="Lưu tên mới"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between group/title mt-1">
                  <h4
                    onDoubleClick={(e) => handleStartEditTitle(e, sc.id, sc.title)}
                    className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-indigo-600 transition-colors cursor-text flex-1 pr-1"
                    title="Nhấp đúp chuột để đổi tên nhanh phân cảnh này"
                  >
                    {sc.title}
                  </h4>
                  <button
                    onClick={(e) => handleStartEditTitle(e, sc.id, sc.title)}
                    className="text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover/title:opacity-100 p-0.5 shrink-0"
                    title="Sửa tên cảnh trực tiếp"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Loại template và chỉ dẫn */}
              <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100/80">
                <span className="text-[10px] font-mono text-indigo-600 font-bold">
                  {sc.type}
                </span>
                {isActive && (
                  <span className="text-[9px] text-indigo-500 font-semibold animate-pulse">
                    Sửa chi tiết ở cột phải ➔
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-1.5 shrink-0">
        <button
          onClick={onOpenTemplateCatalog}
          className="w-full py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg border border-brand-200 flex items-center justify-center gap-1.5 shadow-2xs text-[11px]"
        >
          <Library className="w-3.5 h-3.5 text-brand-600" />
          <span>+ Kho Template STEM (11)</span>
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => onAddNewScene('MATH_FORMULA')}
            className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-700 text-center"
            title="Thêm công thức Toán KaTeX"
          >
            + Toán
          </button>
          <button
            onClick={() => onAddNewScene('CHEMICAL_REACTION')}
            className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-rose-700 text-center"
            title="Thêm phản ứng Hóa học"
          >
            + Hóa
          </button>
          <button
            onClick={() => onAddNewScene('COMPARISON_SPLIT')}
            className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-amber-700 text-center"
            title="Thêm so sánh đối chiếu"
          >
            + So sánh
          </button>
          <button
            onClick={() => onAddNewScene('PROCESS_TIMELINE')}
            className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-emerald-700 text-center"
            title="Thêm chu trình tiến trình"
          >
            + Chu trình
          </button>
        </div>
      </div>
    </aside>
  );
};
