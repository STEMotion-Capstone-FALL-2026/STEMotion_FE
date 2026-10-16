import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ComposedBlock, LegoComponentLayout, LegoTheme, SceneData } from '../types/stem';
import {
  getSceneLegoPieces,
  createLegoBlockPreset,
  type LegoPieceDescriptor,
} from '../remotion/lego/catalog';
import { decomposeSceneToComposed } from '../remotion/lego/decompose';
import {
  Edit3,
  Plus,
  Check,
  X,
  Sparkles,
  Type,
  Maximize2,
  Move,
  RotateCcw,
  EyeOff,
  Trash2,
  Layers,
  Puzzle,
  ArrowUp,
  ArrowDown,
  Palette,
} from 'lucide-react';

interface CanvaInteractiveOverlayProps {
  scene: SceneData;
  updateSceneProperty?: (updater: (s: any) => any) => void;
  isPlaying: boolean;
  onPauseVideo: () => void;
  currentFrame?: number;
  stageContainerRef?: React.RefObject<HTMLDivElement | null>;
  activeLegoPieceId?: string | null;
  onSelectLegoPiece?: (pieceId: string | null) => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragInteractionState {
  mode: 'move' | 'resize';
  piece: LegoPieceDescriptor;
  handle?: ResizeHandle;
  startClientX: number;
  startClientY: number;
  overlayWidth: number;
  overlayHeight: number;
  initialLayout: LegoComponentLayout;
  initialRect: { x: number; y: number; w: number; h: number };
  hasMoved: boolean;
}

const LEGO_THEMES: { id: LegoTheme; label: string; colorClass: string }[] = [
  { id: 'cyan', label: 'Cyan', colorClass: 'bg-cyan-500' },
  { id: 'purple', label: 'Tím', colorClass: 'bg-purple-500' },
  { id: 'emerald', label: 'Xanh lá', colorClass: 'bg-emerald-500' },
  { id: 'amber', label: 'Vàng cam', colorClass: 'bg-amber-500' },
  { id: 'rose', label: 'Hồng đỏ', colorClass: 'bg-rose-500' },
  { id: 'slate', label: 'Xám', colorClass: 'bg-slate-500' },
];

export const CanvaInteractiveOverlay: React.FC<CanvaInteractiveOverlayProps> = ({
  scene,
  updateSceneProperty,
  isPlaying,
  onPauseVideo,
  currentFrame = 0,
  stageContainerRef,
  activeLegoPieceId,
  onSelectLegoPiece,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedId = activeLegoPieceId !== undefined ? activeLegoPieceId : internalSelectedId;

  const setSelectedId = useCallback(
    (id: string | null) => {
      setInternalSelectedId(id);
      onSelectLegoPiece?.(id);
    },
    [onSelectLegoPiece]
  );

  const [isEditingText, setIsEditingText] = useState(false);
  const [editPrimary, setEditPrimary] = useState('');
  const [editSecondary, setEditSecondary] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [measuredRects, setMeasuredRects] = useState<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const [dragState, setDragState] = useState<DragInteractionState | null>(null);

  const pieces = useMemo(() => getSceneLegoPieces(scene), [scene]);
  const visiblePieces = useMemo(
    () =>
      pieces.filter((p) => {
        if (p.isComposedBlock && scene.type === 'COMPOSED') {
          return !scene.blocks[p.blockIndex!]?.hidden;
        }
        if (p.isExtraBlock) {
          return !scene.extraBlocks?.[p.blockIndex!]?.hidden;
        }
        return !scene.componentLayouts?.[p.id]?.hidden;
      }),
    [pieces, scene]
  );

  const selectedPiece = useMemo(
    () => visiblePieces.find((p) => p.id === selectedId) || null,
    [visiblePieces, selectedId]
  );

  // Measure real DOM bounding boxes of [data-lego-id] elements inside the Remotion Player
  const measureDomBoxes = useCallback(() => {
    const overlayEl = overlayRef.current;
    const rootEl = stageContainerRef?.current || overlayEl?.parentElement;
    if (!overlayEl || !rootEl) return;

    const overlayBox = overlayEl.getBoundingClientRect();
    if (overlayBox.width <= 0 || overlayBox.height <= 0) return;

    const scaleX = 1920 / overlayBox.width;
    const scaleY = 1080 / overlayBox.height;

    const nodes = rootEl.querySelectorAll<HTMLElement>('[data-lego-id]');
    const nextRects: Record<string, { x: number; y: number; w: number; h: number }> = {};

    nodes.forEach((node) => {
      const id = node.getAttribute('data-lego-id');
      if (!id) return;
      const r = node.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const x = (r.left - overlayBox.left) * scaleX;
      const y = (r.top - overlayBox.top) * scaleY;
      const w = r.width * scaleX;
      const h = r.height * scaleY;
      nextRects[id] = {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
      };
    });

    setMeasuredRects(nextRects);
  }, [stageContainerRef]);

  useEffect(() => {
    if (isPlaying) return;
    const raf = requestAnimationFrame(measureDomBoxes);
    const timer = setTimeout(measureDomBoxes, 80);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [isPlaying, scene, currentFrame, measureDomBoxes]);

  useEffect(() => {
    window.addEventListener('resize', measureDomBoxes);
    return () => window.removeEventListener('resize', measureDomBoxes);
  }, [measureDomBoxes]);

  // Compute effective 1920x1080 rect for a Lego piece
  const getEffectiveRect = useCallback(
    (piece: LegoPieceDescriptor): { x: number; y: number; w: number; h: number } => {
      if (piece.isComposedBlock && scene.type === 'COMPOSED') {
        const block = scene.blocks[piece.blockIndex!];
        if (
          block &&
          typeof block.x === 'number' &&
          typeof block.y === 'number' &&
          typeof block.w === 'number' &&
          typeof block.h === 'number'
        ) {
          return { x: block.x, y: block.y, w: block.w, h: block.h };
        }
      }
      if (piece.isExtraBlock && scene.extraBlocks?.[piece.blockIndex!]) {
        const block = scene.extraBlocks[piece.blockIndex!];
        if (
          typeof block.x === 'number' &&
          typeof block.y === 'number' &&
          typeof block.w === 'number' &&
          typeof block.h === 'number'
        ) {
          return { x: block.x, y: block.y, w: block.w, h: block.h };
        }
      }

      const domRect = measuredRects[piece.id];
      if (domRect) {
        return domRect;
      }

      const layout = scene.componentLayouts?.[piece.id];
      const base = piece.defaultRect;
      if (!layout) return base;

      const scale = layout.scale ?? 1;
      const sx = (layout.scaleX ?? 1) * scale;
      const sy = (layout.scaleY ?? 1) * scale;
      const w = base.w * sx;
      const h = base.h * sy;
      const x = base.x + (layout.dx ?? 0) - (w - base.w) / 2;
      const y = base.y + (layout.dy ?? 0) - (h - base.h) / 2;
      return {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
      };
    },
    [measuredRects, scene]
  );

  // Pointer drag / resize lifecycle
  useEffect(() => {
    if (!dragState || !updateSceneProperty) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaScreenX = e.clientX - dragState.startClientX;
      const deltaScreenY = e.clientY - dragState.startClientY;
      if (Math.abs(deltaScreenX) < 2 && Math.abs(deltaScreenY) < 2 && !dragState.hasMoved) {
        return;
      }
      dragState.hasMoved = true;

      const dxCanvas = Math.round((deltaScreenX / dragState.overlayWidth) * 1920);
      const dyCanvas = Math.round((deltaScreenY / dragState.overlayHeight) * 1080);

      const { piece, mode, handle, initialLayout, initialRect } = dragState;

      // Case 1: Native COMPOSED block or Extra freeform block -> update x, y, w, h directly
      if (piece.isComposedBlock || piece.isExtraBlock) {
        let nextX = initialRect.x;
        let nextY = initialRect.y;
        let nextW = initialRect.w;
        let nextH = initialRect.h;

        if (mode === 'move') {
          nextX = Math.max(0, Math.min(1840, initialRect.x + dxCanvas));
          nextY = Math.max(0, Math.min(1020, initialRect.y + dyCanvas));
        } else if (mode === 'resize' && handle) {
          if (handle.includes('e')) nextW = Math.max(140, initialRect.w + dxCanvas);
          if (handle.includes('s')) nextH = Math.max(70, initialRect.h + dyCanvas);
          if (handle.includes('w')) {
            const proposedW = Math.max(140, initialRect.w - dxCanvas);
            nextX = initialRect.x + (initialRect.w - proposedW);
            nextW = proposedW;
          }
          if (handle.includes('n')) {
            const proposedH = Math.max(70, initialRect.h - dyCanvas);
            nextY = initialRect.y + (initialRect.h - proposedH);
            nextH = proposedH;
          }
        }

        updateSceneProperty((s: SceneData) => {
          if (piece.isComposedBlock && s.type === 'COMPOSED') {
            const nextBlocks = [...s.blocks];
            const idx = piece.blockIndex!;
            if (nextBlocks[idx]) {
              nextBlocks[idx] = {
                ...nextBlocks[idx],
                x: Math.round(nextX),
                y: Math.round(nextY),
                w: Math.round(nextW),
                h: Math.round(nextH),
              };
            }
            return { ...s, blocks: nextBlocks };
          }
          if (piece.isExtraBlock && s.extraBlocks) {
            const nextExtra = [...s.extraBlocks];
            const idx = piece.blockIndex!;
            if (nextExtra[idx]) {
              nextExtra[idx] = {
                ...nextExtra[idx],
                x: Math.round(nextX),
                y: Math.round(nextY),
                w: Math.round(nextW),
                h: Math.round(nextH),
              };
            }
            return { ...s, extraBlocks: nextExtra };
          }
          return s;
        });
        return;
      }

      // Case 2: Template sub-component -> update componentLayouts[piece.id]
      if (mode === 'move') {
        const nextDx = (initialLayout.dx ?? 0) + dxCanvas;
        const nextDy = (initialLayout.dy ?? 0) + dyCanvas;
        updateSceneProperty((s: SceneData) => ({
          ...s,
          componentLayouts: {
            ...(s.componentLayouts || {}),
            [piece.id]: {
              ...(s.componentLayouts?.[piece.id] || {}),
              dx: nextDx,
              dy: nextDy,
            },
          },
        }));
      } else if (mode === 'resize' && handle) {
        const baseW = Math.max(80, initialRect.w);
        const baseH = Math.max(50, initialRect.h);
        const startSx = initialLayout.scaleX ?? 1;
        const startSy = initialLayout.scaleY ?? 1;
        let factorX = 1;
        let factorY = 1;
        let shiftX = 0;
        let shiftY = 0;

        if (handle.includes('e')) {
          factorX = Math.max(0.35, Math.min(2.5, (baseW + dxCanvas) / baseW));
          shiftX = dxCanvas / 2;
        }
        if (handle.includes('w')) {
          factorX = Math.max(0.35, Math.min(2.5, (baseW - dxCanvas) / baseW));
          shiftX = dxCanvas / 2;
        }
        if (handle.includes('s')) {
          factorY = Math.max(0.35, Math.min(2.5, (baseH + dyCanvas) / baseH));
          shiftY = dyCanvas / 2;
        }
        if (handle.includes('n')) {
          factorY = Math.max(0.35, Math.min(2.5, (baseH - dyCanvas) / baseH));
          shiftY = dyCanvas / 2;
        }

        const nextScaleX = Number((startSx * factorX).toFixed(2));
        const nextScaleY = Number((startSy * factorY).toFixed(2));
        const nextDx = Math.round((initialLayout.dx ?? 0) + shiftX);
        const nextDy = Math.round((initialLayout.dy ?? 0) + shiftY);

        updateSceneProperty((s: SceneData) => ({
          ...s,
          componentLayouts: {
            ...(s.componentLayouts || {}),
            [piece.id]: {
              ...(s.componentLayouts?.[piece.id] || {}),
              dx: nextDx,
              dy: nextDy,
              scaleX: nextScaleX,
              scaleY: nextScaleY,
            },
          },
        }));
      }
    };

    const handlePointerUp = () => {
      setDragState(null);
      setTimeout(measureDomBoxes, 40);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, updateSceneProperty, measureDomBoxes]);

  if (isPlaying || !updateSceneProperty) {
    return null;
  }

  const startDrag = (
    e: React.PointerEvent,
    piece: LegoPieceDescriptor,
    mode: 'move' | 'resize',
    handle?: ResizeHandle
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onPauseVideo();
    setSelectedId(piece.id);
    setShowAddMenu(false);

    const overlayEl = overlayRef.current;
    if (!overlayEl) return;
    const rect = overlayEl.getBoundingClientRect();

    const currentLayout: LegoComponentLayout =
      scene.componentLayouts?.[piece.id] || { dx: 0, dy: 0, scale: 1, scaleX: 1, scaleY: 1 };

    setDragState({
      mode,
      piece,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      overlayWidth: rect.width || 1920,
      overlayHeight: rect.height || 1080,
      initialLayout: { ...currentLayout },
      initialRect: getEffectiveRect(piece),
      hasMoved: false,
    });
  };

  const handleOpenTextEdit = (piece: LegoPieceDescriptor) => {
    setEditPrimary(piece.textValue ?? '');
    setEditSecondary(piece.subTextValue ?? '');
    setIsEditingText(true);
  };

  const handleSaveTextEdit = () => {
    if (!selectedPiece?.buildTextPatch) {
      setIsEditingText(false);
      return;
    }
    const patch = selectedPiece.buildTextPatch(
      editPrimary,
      selectedPiece.subTextValue !== undefined ? editSecondary : undefined
    );
    updateSceneProperty((s: SceneData) => ({ ...s, ...patch }));
    setIsEditingText(false);
  };

  const updateSelectedPieceLayout = (patch: Partial<LegoComponentLayout>) => {
    if (!selectedPiece) return;

    if (selectedPiece.isComposedBlock && scene.type === 'COMPOSED') {
      const idx = selectedPiece.blockIndex!;
      updateSceneProperty((s: SceneData) => {
        if (s.type !== 'COMPOSED') return s;
        const nextBlocks = [...s.blocks];
        if (nextBlocks[idx]) {
          nextBlocks[idx] = {
            ...nextBlocks[idx],
            ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
            ...(patch.fontSize !== undefined ? { fontSize: patch.fontSize } : {}),
            ...(patch.hidden !== undefined ? { hidden: patch.hidden } : {}),
          };
        }
        return { ...s, blocks: nextBlocks };
      });
      return;
    }

    if (selectedPiece.isExtraBlock) {
      const idx = selectedPiece.blockIndex!;
      updateSceneProperty((s: SceneData) => {
        const nextExtra = [...(s.extraBlocks || [])];
        if (nextExtra[idx]) {
          nextExtra[idx] = {
            ...nextExtra[idx],
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
        [selectedPiece.id]: {
          ...(s.componentLayouts?.[selectedPiece.id] || {}),
          ...patch,
        },
      },
    }));
  };

  const resetSelectedPiece = () => {
    if (!selectedPiece) return;
    if (selectedPiece.isComposedBlock && scene.type === 'COMPOSED') {
      const idx = selectedPiece.blockIndex!;
      updateSceneProperty((s: SceneData) => {
        if (s.type !== 'COMPOSED') return s;
        const nextBlocks = [...s.blocks];
        if (nextBlocks[idx]) {
          const { x, y, w, h, scale, fontSize, ...rest } = nextBlocks[idx];
          nextBlocks[idx] = rest as ComposedBlock;
        }
        return { ...s, blocks: nextBlocks };
      });
      return;
    }
    updateSceneProperty((s: SceneData) => {
      const nextLayouts = { ...(s.componentLayouts || {}) };
      delete nextLayouts[selectedPiece.id];
      return { ...s, componentLayouts: nextLayouts };
    });
  };

  const deleteExtraOrComposedPiece = () => {
    if (!selectedPiece) return;
    if (selectedPiece.isExtraBlock) {
      const idx = selectedPiece.blockIndex!;
      updateSceneProperty((s: SceneData) => ({
        ...s,
        extraBlocks: (s.extraBlocks || []).filter((_, i) => i !== idx),
      }));
      setSelectedId(null);
      return;
    }
    if (selectedPiece.isComposedBlock && scene.type === 'COMPOSED') {
      const idx = selectedPiece.blockIndex!;
      if (scene.blocks.length <= 1) return;
      updateSceneProperty((s: SceneData) => {
        if (s.type !== 'COMPOSED') return s;
        return {
          ...s,
          blocks: s.blocks.filter((_, i) => i !== idx),
        };
      });
      setSelectedId(null);
    }
  };

  const handleAddLegoBlock = (
    preset: 'text' | 'formula' | 'number' | 'icon' | 'list' | 'guide'
  ) => {
    const seed =
      (scene.type === 'COMPOSED' ? scene.blocks.length : scene.extraBlocks?.length || 0) + 1;
    const newBlock = createLegoBlockPreset(preset, seed);

    updateSceneProperty((s: SceneData) => {
      if (s.type === 'COMPOSED') {
        return {
          ...s,
          blocks: [...(s.blocks || []), newBlock],
        };
      }
      return {
        ...s,
        extraBlocks: [...(s.extraBlocks || []), newBlock],
      };
    });
    setShowAddMenu(false);
    setSelectedId(newBlock.id);
  };

  const handleDecomposeScene = () => {
    if (scene.type === 'COMPOSED') return;
    const composed = decomposeSceneToComposed(scene);
    updateSceneProperty(() => composed);
    setSelectedId(composed.blocks[0]?.id || null);
  };

  const handleResetAllLayouts = () => {
    updateSceneProperty((s: SceneData) => ({
      ...s,
      componentLayouts: {},
      extraBlocks: [],
    }));
    setSelectedId(null);
  };

  const selectedLayout: LegoComponentLayout = selectedPiece
    ? selectedPiece.isComposedBlock && scene.type === 'COMPOSED'
      ? {
          scale: scene.blocks[selectedPiece.blockIndex!]?.scale ?? 1,
          fontSize: scene.blocks[selectedPiece.blockIndex!]?.fontSize,
        }
      : selectedPiece.isExtraBlock
      ? {
          scale: scene.extraBlocks?.[selectedPiece.blockIndex!]?.scale ?? 1,
          fontSize: scene.extraBlocks?.[selectedPiece.blockIndex!]?.fontSize,
        }
      : scene.componentLayouts?.[selectedPiece.id] || {}
    : {};

  const curScale = selectedLayout.scale ?? 1;
  const curFontSize = selectedLayout.fontSize ?? ((scene as any).customFontSize || 30);

  return (
    <div
      ref={overlayRef}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedId(null);
          setIsEditingText(false);
          setShowAddMenu(false);
        }
      }}
      className="absolute inset-0 z-20 pointer-events-auto select-none overflow-hidden"
    >
      {/* Top Lego Studio Bar */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2.5 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-40"
      >
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/90 border border-blue-500/40 px-2.5 py-1 rounded-xl backdrop-blur-md shadow-xl">
          <Puzzle className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-bold text-slate-200">
            Lego Mode ({visiblePieces.length} khối)
          </span>
          <span className="text-[10px] text-slate-400 hidden md:inline">
            • Kéo để di chuyển, kéo góc để co giãn, đúp chuột để sửa chữ
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Add Freeform Lego Block Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu((v) => !v)}
              className="px-2.5 py-1 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-lg border border-emerald-400/40 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Khối Lego</span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  Chọn loại khối Lego mới
                </div>
                {[
                  { id: 'text', label: '📝 Thẻ Ghi chú / Giải thích' },
                  { id: 'formula', label: '∑ Công thức Toán / KaTeX' },
                  { id: 'number', label: '🔢 Chỉ số Khoa học Nổi bật' },
                  { id: 'icon', label: '⚛️ Biểu tượng STEM Minh họa' },
                  { id: 'list', label: '📋 Danh sách Ý chính' },
                  { id: 'guide', label: '🦉 Trợ giảng Cú Mèo (Guide)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddLegoBlock(item.id as any)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-blue-600/30 hover:text-white transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Decompose Template into Freeform COMPOSED Scene */}
          {scene.type !== 'COMPOSED' && (
            <button
              type="button"
              onClick={handleDecomposeScene}
              className="px-2.5 py-1 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-lg border border-indigo-400/40 cursor-pointer transition-all"
              title="Tách khuôn mẫu cố định thành cảnh COMPOSED tự do hoàn toàn"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tách Lego Tự Do</span>
            </button>
          )}

          {/* Reset All Layouts */}
          {(Object.keys(scene.componentLayouts || {}).length > 0 ||
            (scene.extraBlocks && scene.extraBlocks.length > 0)) && (
            <button
              type="button"
              onClick={handleResetAllLayouts}
              className="px-2 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700 cursor-pointer"
              title="Đặt lại toàn bộ vị trí các khối về mặc định"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Bounding Boxes for Every Lego Piece */}
      {visiblePieces.map((piece) => {
        const rect = getEffectiveRect(piece);
        const isSelected = selectedId === piece.id;
        const leftPct = (rect.x / 1920) * 100;
        const topPct = (rect.y / 1080) * 100;
        const widthPct = (rect.w / 1920) * 100;
        const heightPct = (rect.h / 1080) * 100;

        const borderAccent = piece.isExtraBlock
          ? 'border-emerald-400 ring-emerald-500'
          : piece.isComposedBlock
          ? 'border-indigo-400 ring-indigo-500'
          : 'border-blue-400 ring-blue-500';

        return (
          <div
            key={piece.id}
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
            }}
            onPointerDown={(e) => startDrag(e, piece, 'move')}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setSelectedId(piece.id);
              if (piece.buildTextPatch) {
                handleOpenTextEdit(piece);
              }
            }}
            className={`absolute rounded-xl transition-shadow cursor-move group ${
              isSelected
                ? `ring-2 ${borderAccent} bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.25)] z-30`
                : 'hover:ring-1 hover:ring-blue-400/70 hover:bg-blue-500/5 z-20'
            }`}
          >
            {/* Hover / Active Piece Badge */}
            <div
              className={`absolute -top-6 left-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold whitespace-nowrap flex items-center gap-1 pointer-events-none transition-opacity ${
                isSelected
                  ? 'opacity-100 bg-blue-600 text-white shadow-md'
                  : 'opacity-0 group-hover:opacity-100 bg-slate-900/90 text-blue-300 border border-blue-500/40'
              }`}
            >
              <Move className="w-2.5 h-2.5" />
              <span>{piece.label}</span>
              {(scene.componentLayouts?.[piece.id]?.dx ||
                scene.componentLayouts?.[piece.id]?.dy) && (
                <span className="opacity-80">
                  ({scene.componentLayouts?.[piece.id]?.dx ?? 0},
                  {scene.componentLayouts?.[piece.id]?.dy ?? 0})
                </span>
              )}
            </div>

            {/* 8-Point Resize Handles when Selected */}
            {isSelected && (
              <>
                {(
                  [
                    { h: 'nw', cls: '-top-1.5 -left-1.5 cursor-nwse-resize' },
                    { h: 'n', cls: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                    { h: 'ne', cls: '-top-1.5 -right-1.5 cursor-nesw-resize' },
                    { h: 'e', cls: 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize' },
                    { h: 'se', cls: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
                    { h: 's', cls: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                    { h: 'sw', cls: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
                    { h: 'w', cls: 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize' },
                  ] as { h: ResizeHandle; cls: string }[]
                ).map(({ h, cls }) => (
                  <div
                    key={h}
                    onPointerDown={(e) => startDrag(e, piece, 'resize', h)}
                    className={`absolute w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow-md z-40 hover:scale-125 transition-transform ${cls}`}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}

      {/* Floating Inspector Toolbar for the Selected Lego Piece */}
      {selectedPiece && !dragState?.hasMoved && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[96%] bg-slate-950/95 border border-blue-500/60 rounded-2xl shadow-2xl px-3 py-2 flex flex-wrap items-center gap-2 text-xs text-white z-40 backdrop-blur-md"
        >
          {/* Piece Name */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
            <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-bold text-blue-300 text-[11px] max-w-[180px] truncate">
              {selectedPiece.label}
            </span>
          </div>

          {/* Edit Text Button */}
          {selectedPiece.buildTextPatch && (
            <button
              type="button"
              onClick={() => handleOpenTextEdit(selectedPiece)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Sửa Nội Dung</span>
            </button>
          )}

          {/* Font Size Controls */}
          <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
            <Type className="w-3.5 h-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() =>
                updateSelectedPieceLayout({ fontSize: Math.max(12, curFontSize - 2) })
              }
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
              title="Giảm cỡ chữ khối này (-2px)"
            >
              -
            </button>
            <span className="font-mono text-[11px] text-blue-300 px-1 min-w-[38px] text-center">
              {curFontSize}px
            </span>
            <button
              type="button"
              onClick={() =>
                updateSelectedPieceLayout({ fontSize: Math.min(96, curFontSize + 2) })
              }
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
              title="Tăng cỡ chữ khối này (+2px)"
            >
              +
            </button>
          </div>

          {/* Scale Controls */}
          <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <button
              type="button"
              onClick={() =>
                updateSelectedPieceLayout({
                  scale: Number(Math.max(0.4, curScale - 0.08).toFixed(2)),
                })
              }
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
              title="Thu nhỏ khối (-8%)"
            >
              -
            </button>
            <span className="font-mono text-[11px] text-indigo-300 px-1 min-w-[42px] text-center">
              {Math.round(curScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() =>
                updateSelectedPieceLayout({
                  scale: Number(Math.min(2.2, curScale + 0.08).toFixed(2)),
                })
              }
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
              title="Phóng to khối (+8%)"
            >
              +
            </button>
          </div>

          {/* Theme Color Dots (for Template Lego Pieces) */}
          {!selectedPiece.isComposedBlock && !selectedPiece.isExtraBlock && (
            <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
              <Palette className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
              {LEGO_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateSelectedPieceLayout({ theme: t.id })}
                  title={`Đổi màu nhấn: ${t.label}`}
                  className={`w-4 h-4 rounded-full ${t.colorClass} cursor-pointer transition-transform ${
                    selectedLayout.theme === t.id
                      ? 'ring-2 ring-white scale-125'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Layer Z-Index Controls */}
          {!selectedPiece.isComposedBlock && !selectedPiece.isExtraBlock && (
            <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
              <button
                type="button"
                onClick={() =>
                  updateSelectedPieceLayout({
                    zIndex: (selectedLayout.zIndex ?? 10) + 5,
                  })
                }
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Đưa khối lên lớp trên"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateSelectedPieceLayout({
                    zIndex: Math.max(1, (selectedLayout.zIndex ?? 10) - 5),
                  })
                }
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Đưa khối xuống lớp dưới"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Reset / Hide / Delete */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetSelectedPiece}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer"
              title="Đặt lại vị trí & kích thước mặc định cho khối này"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại</span>
            </button>

            <button
              type="button"
              onClick={() => {
                updateSelectedPieceLayout({ hidden: true });
                setSelectedId(null);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-slate-300 hover:text-amber-300 cursor-pointer"
              title="Ẩn khối Lego này khỏi video"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>

            {(selectedPiece.isExtraBlock ||
              (selectedPiece.isComposedBlock &&
                scene.type === 'COMPOSED' &&
                scene.blocks.length > 1)) && (
              <button
                type="button"
                onClick={deleteExtraOrComposedPiece}
                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white cursor-pointer"
                title="Xóa khối Lego này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
              title="Đóng thanh công cụ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Sửa Nội Dung Trực Tiếp Trên Canvas */}
      {isEditingText && selectedPiece && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div className="w-full max-w-lg bg-slate-900 border-2 border-blue-500 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm text-white">
                  Chỉnh sửa: {selectedPiece.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingText(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Nội dung chính
                </label>
                {editPrimary.includes('\n') || editPrimary.length > 80 ? (
                  <textarea
                    rows={4}
                    value={editPrimary}
                    onChange={(e) => setEditPrimary(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl p-2.5 text-sm text-white outline-hidden"
                  />
                ) : (
                  <input
                    type="text"
                    value={editPrimary}
                    onChange={(e) => setEditPrimary(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTextEdit();
                      if (e.key === 'Escape') setIsEditingText(false);
                    }}
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl p-2.5 text-sm text-white outline-hidden"
                  />
                )}
              </div>

              {selectedPiece.subTextValue !== undefined && (
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                    Nội dung phụ / Công thức / Ghi chú (mỗi dòng 1 ý nếu là danh sách)
                  </label>
                  <textarea
                    rows={3}
                    value={editSecondary}
                    onChange={(e) => setEditSecondary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl p-2.5 text-sm text-white outline-hidden font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingText(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveTextEdit}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/30"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
