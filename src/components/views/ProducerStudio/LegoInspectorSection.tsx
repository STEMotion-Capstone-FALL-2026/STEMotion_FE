import React, { useMemo, useState } from 'react';
import {
  Puzzle,
  Eye,
  EyeOff,
  RotateCcw,
  Plus,
  Sparkles,
  Trash2,
  Move,
  Maximize2,
  Type,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { ComposedBlock, LegoComponentLayout, LegoTheme, SceneData } from '../../../types/stem';
import {
  getSceneLegoPieces,
  createLegoBlockPreset,
  type LegoPieceDescriptor,
} from '../../../remotion/lego/catalog';
import { decomposeSceneToComposed } from '../../../remotion/lego/decompose';

interface LegoInspectorSectionProps {
  selectedScene: SceneData;
  updateSceneProperty: (updater: (s: any) => any) => void;
  activeLegoPieceId?: string | null;
  onSelectLegoPiece?: (pieceId: string | null) => void;
}

const THEME_OPTIONS: { id: LegoTheme; label: string; dot: string }[] = [
  { id: 'cyan', label: 'Cyan', dot: 'bg-cyan-500' },
  { id: 'purple', label: 'Tím', dot: 'bg-purple-500' },
  { id: 'emerald', label: 'Lục', dot: 'bg-emerald-500' },
  { id: 'amber', label: 'Cam', dot: 'bg-amber-500' },
  { id: 'rose', label: 'Hồng', dot: 'bg-rose-500' },
  { id: 'slate', label: 'Xám', dot: 'bg-slate-500' },
];

export const LegoInspectorSection: React.FC<LegoInspectorSectionProps> = ({
  selectedScene,
  updateSceneProperty,
  activeLegoPieceId,
  onSelectLegoPiece,
}) => {
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const pieces = useMemo(() => getSceneLegoPieces(selectedScene), [selectedScene]);

  const isPieceHidden = (piece: LegoPieceDescriptor): boolean => {
    if (piece.isComposedBlock && selectedScene.type === 'COMPOSED') {
      return Boolean(selectedScene.blocks[piece.blockIndex!]?.hidden);
    }
    if (piece.isExtraBlock) {
      return Boolean(selectedScene.extraBlocks?.[piece.blockIndex!]?.hidden);
    }
    return Boolean(selectedScene.componentLayouts?.[piece.id]?.hidden);
  };

  const getPieceLayout = (piece: LegoPieceDescriptor): LegoComponentLayout => {
    if (piece.isComposedBlock && selectedScene.type === 'COMPOSED') {
      const b = selectedScene.blocks[piece.blockIndex!];
      return {
        dx: b?.x ?? piece.defaultRect.x,
        dy: b?.y ?? piece.defaultRect.y,
        scale: b?.scale ?? 1,
        fontSize: b?.fontSize,
        hidden: b?.hidden,
      };
    }
    if (piece.isExtraBlock) {
      const b = selectedScene.extraBlocks?.[piece.blockIndex!];
      return {
        dx: b?.x ?? piece.defaultRect.x,
        dy: b?.y ?? piece.defaultRect.y,
        scale: b?.scale ?? 1,
        fontSize: b?.fontSize,
        hidden: b?.hidden,
      };
    }
    return selectedScene.componentLayouts?.[piece.id] || {};
  };

  const updatePieceLayout = (
    piece: LegoPieceDescriptor,
    patch: Partial<LegoComponentLayout> & { w?: number; h?: number }
  ) => {
    if (piece.isComposedBlock && selectedScene.type === 'COMPOSED') {
      const idx = piece.blockIndex!;
      updateSceneProperty((s: SceneData) => {
        if (s.type !== 'COMPOSED') return s;
        const nextBlocks = [...s.blocks];
        const cur = nextBlocks[idx];
        if (cur) {
          nextBlocks[idx] = {
            ...cur,
            ...(patch.dx !== undefined ? { x: patch.dx } : {}),
            ...(patch.dy !== undefined ? { y: patch.dy } : {}),
            ...(patch.w !== undefined ? { w: patch.w } : {}),
            ...(patch.h !== undefined ? { h: patch.h } : {}),
            ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
            ...(patch.fontSize !== undefined ? { fontSize: patch.fontSize } : {}),
            ...(patch.hidden !== undefined ? { hidden: patch.hidden } : {}),
          };
        }
        return { ...s, blocks: nextBlocks };
      });
      return;
    }

    if (piece.isExtraBlock) {
      const idx = piece.blockIndex!;
      updateSceneProperty((s: SceneData) => {
        const nextExtra = [...(s.extraBlocks || [])];
        const cur = nextExtra[idx];
        if (cur) {
          nextExtra[idx] = {
            ...cur,
            ...(patch.dx !== undefined ? { x: patch.dx } : {}),
            ...(patch.dy !== undefined ? { y: patch.dy } : {}),
            ...(patch.w !== undefined ? { w: patch.w } : {}),
            ...(patch.h !== undefined ? { h: patch.h } : {}),
            ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
            ...(patch.fontSize !== undefined ? { fontSize: patch.fontSize } : {}),
            ...(patch.hidden !== undefined ? { hidden: patch.hidden } : {}),
          };
        }
        return { ...s, extraBlocks: nextExtra };
      });
      return;
    }

    updateSceneProperty((s: SceneData) => ({
      ...s,
      componentLayouts: {
        ...(s.componentLayouts || {}),
        [piece.id]: {
          ...(s.componentLayouts?.[piece.id] || {}),
          ...patch,
        },
      },
    }));
  };

  const resetPiece = (piece: LegoPieceDescriptor) => {
    if (piece.isComposedBlock && selectedScene.type === 'COMPOSED') {
      const idx = piece.blockIndex!;
      updateSceneProperty((s: SceneData) => {
        if (s.type !== 'COMPOSED') return s;
        const nextBlocks = [...s.blocks];
        if (nextBlocks[idx]) {
          const { x, y, w, h, scale, fontSize, hidden, ...rest } = nextBlocks[idx];
          nextBlocks[idx] = rest as ComposedBlock;
        }
        return { ...s, blocks: nextBlocks };
      });
      return;
    }
    updateSceneProperty((s: SceneData) => {
      const next = { ...(s.componentLayouts || {}) };
      delete next[piece.id];
      return { ...s, componentLayouts: next };
    });
  };

  const canDeletePiece = (piece: LegoPieceDescriptor) => {
    if (piece.isExtraBlock) return true;
    if (piece.isComposedBlock && selectedScene.type === 'COMPOSED' && selectedScene.blocks.length > 1) {
      return true;
    }
    if (
      selectedScene.type === 'ILLUSTRATED_EXPLAINER' &&
      piece.id.startsWith('icon-') &&
      (selectedScene.icons?.length || 0) > 1
    ) {
      return true;
    }
    return false;
  };

  const deletePiece = (piece: LegoPieceDescriptor) => {
    if (
      selectedScene.type === 'ILLUSTRATED_EXPLAINER' &&
      piece.id.startsWith('icon-') &&
      (selectedScene.icons?.length || 0) > 1
    ) {
      const iconIdx = Number(piece.id.replace('icon-', ''));
      if (Number.isFinite(iconIdx)) {
        updateSceneProperty((s: SceneData) => {
          if (s.type !== 'ILLUSTRATED_EXPLAINER') return s;
          return {
            ...s,
            icons: (s.icons || []).filter((_, i) => i !== iconIdx),
          };
        });
        if (activeLegoPieceId === piece.id) onSelectLegoPiece?.(null);
        return;
      }
    }
    if (piece.isExtraBlock) {
      const idx = piece.blockIndex!;
      updateSceneProperty((s: SceneData) => ({
        ...s,
        extraBlocks: (s.extraBlocks || []).filter((_, i) => i !== idx),
      }));
      if (activeLegoPieceId === piece.id) onSelectLegoPiece?.(null);
      return;
    }
    if (piece.isComposedBlock && selectedScene.type === 'COMPOSED') {
      if (selectedScene.blocks.length <= 1) return;
      const idx = piece.blockIndex!;
      updateSceneProperty((s: SceneData) => {
        if (s.type !== 'COMPOSED') return s;
        return {
          ...s,
          blocks: s.blocks.filter((_, i) => i !== idx),
        };
      });
      if (activeLegoPieceId === piece.id) onSelectLegoPiece?.(null);
    }
  };

  const handleAddPreset = (
    preset: 'text' | 'formula' | 'number' | 'icon' | 'list' | 'guide'
  ) => {
    const seed =
      (selectedScene.type === 'COMPOSED'
        ? selectedScene.blocks.length
        : selectedScene.extraBlocks?.length || 0) + 1;
    const block = createLegoBlockPreset(preset, seed);
    updateSceneProperty((s: SceneData) => {
      if (s.type === 'COMPOSED') {
        return { ...s, blocks: [...(s.blocks || []), block] };
      }
      return { ...s, extraBlocks: [...(s.extraBlocks || []), block] };
    });
    setIsAddingBlock(false);
    onSelectLegoPiece?.(block.id);
  };

  const handleDecompose = () => {
    const composed = decomposeSceneToComposed(selectedScene);
    updateSceneProperty(() => composed);
    onSelectLegoPiece?.(composed.blocks[0]?.id || null);
  };

  return (
    <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/50 border border-blue-200 rounded-xl space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5">
          <Puzzle className="w-3.5 h-3.5 text-blue-600" />
          <span>Tách & Điều Chỉnh Khối Lego ({pieces.length})</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsAddingBlock((v) => !v)}
            className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-0.5 cursor-pointer shadow-2xs"
            title="Thêm một khối Lego tự do vào cảnh này"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm Khối</span>
          </button>
        </div>
      </div>

      {/* Add Block Preset Drawer */}
      {isAddingBlock && (
        <div className="p-2 bg-white border border-emerald-200 rounded-lg space-y-1.5 shadow-xs">
          <div className="text-[10px] font-bold text-slate-600">
            Chọn khối Lego muốn gắn thêm vào video:
          </div>
          {selectedScene.type === 'ILLUSTRATED_EXPLAINER' && (
            <button
              type="button"
              onClick={() => {
                const nextIdx = selectedScene.icons?.length || 0;
                const defaultIcons = ['atom', 'lightning', 'dna', 'flask', 'rocket', 'magnet'];
                updateSceneProperty((s: SceneData) => {
                  if (s.type !== 'ILLUSTRATED_EXPLAINER') return s;
                  return {
                    ...s,
                    icons: [
                      ...(s.icons || []),
                      {
                        name: defaultIcons[nextIdx % defaultIcons.length],
                        label: `Khái niệm #${nextIdx + 1}`,
                      },
                    ],
                  };
                });
                setIsAddingBlock(false);
                onSelectLegoPiece?.(`icon-${nextIdx}`);
              }}
              className="w-full px-2 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-left text-[10px] font-bold cursor-pointer transition-colors"
            >
              ✨ Thêm Icon Vệ tinh vào Sân khấu
            </button>
          )}
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: 'text', label: '📝 Thẻ Ghi chú' },
              { id: 'formula', label: '∑ Công thức' },
              { id: 'number', label: '🔢 Con số' },
              { id: 'icon', label: '⚛️ Icon STEM' },
              { id: 'list', label: '📋 Danh sách' },
              { id: 'guide', label: '🦉 Trợ giảng' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAddPreset(item.id as any)}
                className="px-2 py-1 rounded bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-left text-[10px] font-semibold cursor-pointer transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Decompose to COMPOSED Action */}
      {(selectedScene.type !== 'COMPOSED' ||
        selectedScene.blocks.some((b) => b.kind === 'icons' && (b.icons?.length || 0) > 1)) && (
        <button
          type="button"
          onClick={handleDecompose}
          className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          title="Chuyển đổi khuôn mẫu cố định này thành cảnh Lego tự do (COMPOSED) để thêm/xóa/sắp xếp từng khối độc lập"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tách Toàn Bộ Thành Cảnh Tự Do (COMPOSED)</span>
        </button>
      )}

      {/* List of Lego Pieces in Current Scene */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5 custom-scrollbar">
        {pieces.map((piece) => {
          const isSelected = activeLegoPieceId === piece.id;
          const hidden = isPieceHidden(piece);
          const layout = getPieceLayout(piece);
          const isFreeform = piece.isComposedBlock || piece.isExtraBlock;

          return (
            <div
              key={piece.id}
              className={`rounded-lg border transition-all ${
                isSelected
                  ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-400/50'
                  : 'bg-white/80 border-slate-200 hover:border-blue-300'
              } ${hidden ? 'opacity-60' : ''}`}
            >
              {/* Piece Row Header */}
              <div className="flex items-center justify-between px-2 py-1.5 gap-1">
                <button
                  type="button"
                  onClick={() => onSelectLegoPiece?.(isSelected ? null : piece.id)}
                  className="flex-1 flex items-center gap-1.5 text-left min-w-0 cursor-pointer"
                >
                  {isSelected ? (
                    <ChevronDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="font-semibold text-[11px] text-slate-800 truncate">
                    {piece.label}
                  </span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updatePieceLayout(piece, { hidden: !hidden })}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      hidden
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    title={hidden ? 'Hiện lại khối này' : 'Ẩn khối này khỏi video'}
                  >
                    {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => resetPiece(piece)}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                    title="Đặt lại vị trí & kích thước mặc định"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  {canDeletePiece(piece) && (
                    <button
                      type="button"
                      onClick={() => deletePiece(piece)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Xóa khối Lego này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Fine Controls when Piece is Selected */}
              {isSelected && (
                <div className="px-2.5 pb-2.5 pt-1.5 border-t border-slate-100 space-y-2 bg-slate-50/70 rounded-b-lg">
                  {/* Position X / Y */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mb-0.5">
                        <Move className="w-2.5 h-2.5 text-blue-500" />
                        <span>{isFreeform ? 'Tọa độ X (px):' : 'Dịch ngang ΔX (px):'}</span>
                      </label>
                      <input
                        type="number"
                        step={10}
                        value={layout.dx ?? 0}
                        onChange={(e) =>
                          updatePieceLayout(piece, { dx: Number(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mb-0.5">
                        <Move className="w-2.5 h-2.5 text-blue-500" />
                        <span>{isFreeform ? 'Tọa độ Y (px):' : 'Dịch dọc ΔY (px):'}</span>
                      </label>
                      <input
                        type="number"
                        step={10}
                        value={layout.dy ?? 0}
                        onChange={(e) =>
                          updatePieceLayout(piece, { dy: Number(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono"
                      />
                    </div>
                  </div>

                  {/* Scale & FontSize */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mb-0.5">
                        <Maximize2 className="w-2.5 h-2.5 text-indigo-500" />
                        <span>Tỉ lệ ({Math.round((layout.scale ?? 1) * 100)}%):</span>
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1.8"
                        step="0.05"
                        value={layout.scale ?? 1}
                        onChange={(e) =>
                          updatePieceLayout(piece, { scale: Number(e.target.value) })
                        }
                        className="w-full h-1.5 bg-indigo-200 rounded-lg accent-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mb-0.5">
                        <Type className="w-2.5 h-2.5 text-blue-500" />
                        <span>Cỡ chữ riêng (px):</span>
                      </label>
                      <input
                        type="number"
                        min={12}
                        max={96}
                        step={2}
                        placeholder="Mặc định"
                        value={layout.fontSize ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          updatePieceLayout(piece, {
                            fontSize: v === '' ? undefined : Number(v),
                          });
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono"
                      />
                    </div>
                  </div>

                  {/* Theme Dots for Template Pieces */}
                  {!isFreeform && (
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] font-semibold text-slate-500">
                        Màu nhấn khối:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {THEME_OPTIONS.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => updatePieceLayout(piece, { theme: t.id })}
                            title={t.label}
                            className={`w-4 h-4 rounded-full ${t.dot} cursor-pointer transition-transform ${
                              layout.theme === t.id
                                ? 'ring-2 ring-slate-900 scale-125'
                                : 'opacity-70 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Inline Text Edit */}
                  {piece.buildTextPatch && piece.textValue !== undefined && (
                    <div className="pt-1 border-t border-slate-200/70 space-y-1.5">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          {piece.id.startsWith('icon-') || piece.id.includes('__icon-')
                            ? 'Nhãn hiển thị (VD: Electron, Nguyên tử):'
                            : 'Nội dung khối:'}
                        </label>
                        <input
                          type="text"
                          value={piece.textValue}
                          onChange={(e) => {
                            const patch = piece.buildTextPatch!(
                              e.target.value,
                              piece.subTextValue
                            );
                            updateSceneProperty((s: SceneData) => ({ ...s, ...patch }));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 focus:border-blue-500 rounded text-[11px] outline-hidden"
                        />
                      </div>

                      {piece.subTextValue !== undefined && (
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                            {piece.id.startsWith('icon-') || piece.id.includes('__icon-')
                              ? 'Biểu tượng 3D (atom, lightning, dna, flask...):'
                              : 'Nội dung phụ / Công thức:'}
                          </label>
                          <input
                            type="text"
                            value={piece.subTextValue}
                            onChange={(e) => {
                              const patch = piece.buildTextPatch!(
                                piece.textValue || '',
                                e.target.value
                              );
                              updateSceneProperty((s: SceneData) => ({ ...s, ...patch }));
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 focus:border-blue-500 rounded text-[11px] font-mono outline-hidden"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
