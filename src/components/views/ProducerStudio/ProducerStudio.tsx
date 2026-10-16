import React, { useState, useEffect } from 'react';
import { PlusCircle, Image, Play, Cpu, Sparkles, Send, Lock, Loader2 } from 'lucide-react';
import { STEMScript, SceneData } from '../../../types/stem';
import { RemotionPlayerWrapper } from '../../RemotionPlayerWrapper';
import { SceneListColumn } from './SceneListColumn';
import { SceneInspector } from './SceneInspector';

/** The producer's draft of the approved script (Production Workspace). */
export interface ProductionDraftInfo {
  revision: number;
  scriptVersionNo: number;
  editable: boolean;
  lockedReason?: string | null;
  saving: boolean;
}

interface ProducerStudioProps {
  script: STEMScript;
  production?: ProductionDraftInfo;
  selectedScene: SceneData;
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;
  updateSceneProperty: (updater: (s: any) => any) => void;
  handleAddNewScene: (type?: SceneData['type']) => void;
  handleDeleteScene: (sceneId: string) => void;
  handleMoveScene: (index: number, direction: 'up' | 'down') => void;
  handleReorderScenes: (fromIndex: number, toIndex: number) => void;
  handleDuplicateScene: (scene: SceneData) => void;
  handleChangeDuration: (sceneId: string, seconds: number) => void;
  handleUpdateSceneTitle: (sceneId: string, newTitle: string) => void;
  onOpenCreateProjectModal: () => void;
  onOpenTemplateCatalog: () => void;
  isRendering: boolean;
  renderProgress: number;
  renderStageText: string;
  renderPercentageText: string;
  startRender: () => void;
  onOpenPublishModal?: () => void;
  onSubmitForReview?: () => void;
}

export const ProducerStudio: React.FC<ProducerStudioProps> = ({
  script,
  production,
  selectedScene,
  activeSceneId,
  setActiveSceneId,
  updateSceneProperty,
  handleAddNewScene,
  handleDeleteScene,
  handleMoveScene,
  handleReorderScenes,
  handleDuplicateScene,
  handleChangeDuration,
  handleUpdateSceneTitle,
  onOpenCreateProjectModal,
  onOpenTemplateCatalog,
  isRendering,
  renderProgress,
  renderStageText,
  renderPercentageText,
  startRender,
  onOpenPublishModal,
  onSubmitForReview,
}) => {
  // Driven by the clip's state, not by whether an old video URL exists: a clip
  // sent back to production keeps its old URL but must be rendered again.
  const status = script.videoStatus;
  const action = status === 'APPROVED' || status === 'PUBLISHED'
    ? { label: status === 'PUBLISHED' ? 'Xuất bản lại' : 'Xuất bản (đã duyệt)', run: onOpenPublishModal, disabled: !onOpenPublishModal }
    : status === 'RENDERING'
      ? { label: 'Đang kết xuất…', run: undefined, disabled: true }
      : status === 'IN_QA'
        ? { label: 'Chờ Reviewer duyệt clip', run: undefined, disabled: true }
        : { label: production ? `Kết xuất bản dựng r${production.revision}` : 'Kết xuất MP4', run: startRender, disabled: isRendering };

  const [activeLegoPieceId, setActiveLegoPieceId] = useState<string | null>(null);

  useEffect(() => {
    setActiveLegoPieceId(null);
  }, [activeSceneId, selectedScene.type]);

  return (
    <section className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Top Bar Studio */}
      <div className="bg-white border-b px-6 py-2.5 flex justify-between items-center text-xs shrink-0 z-10 shadow-2xs">
        <div className="flex items-center space-x-3">
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
            PRODUCER WORKSPACE
          </span>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-sm text-slate-900">{script.title}</span>
          <span className="text-slate-500 font-mono text-[11px]">
            • {script.scenes.length} Scenes (Tổng: {script.totalDurationSeconds}s)
          </span>
          {production && (
            <span
              className={`px-2 py-0.5 rounded border text-[11px] font-semibold flex items-center gap-1 ${
                production.editable
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={production.lockedReason || 'Chỉnh thuộc tính từng cảnh; kịch bản đã duyệt không đổi'}
            >
              {production.editable ? null : <Lock className="w-3 h-3" />}
              {production.saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Bản dựng {production.revision === 0 ? 'chưa chỉnh' : `r${production.revision}`} · từ kịch bản v{production.scriptVersionNo}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* <button
            onClick={onOpenCreateProjectModal}
            className="px-3 py-1.5 bg-blue-50 text-brand-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 flex items-center space-x-1 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Đề Tài Mới</span>
          </button> */}
          {!production && (
          <button
            onClick={onOpenTemplateCatalog}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center space-x-1 shadow-xs"
          >
            <Image className="w-3.5 h-3.5 text-indigo-600" />
            <span>Đổi Tài Nguyên STEM</span>
          </button>
          )}
          <button
            onClick={() => {
              script.scenes.forEach((sc) => {
                if (sc.narration && sc.narration.trim()) {
                  const words = sc.narration.trim().split(/\s+/).filter(Boolean).length;
                  const estSeconds = Math.max(3, Math.ceil(words / 2.3) + 1);
                  handleChangeDuration(sc.id, estSeconds);
                }
              });
            }}
            className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold rounded-lg border border-amber-200 flex items-center space-x-1 shadow-xs cursor-pointer"
            title="Ước lượng thời lượng từ số từ trong lời thoại; chưa đo audio TTS thực tế"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Ước lượng thời lượng</span>
          </button>
          {onSubmitForReview && (
            <button
              onClick={onSubmitForReview}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Hoàn tất tạo video và chuyển sang Bước 4 để Reviewer thẩm định chất lượng"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Reviewer Duyệt Video</span>
            </button>
          )}
          <button
            onClick={action.run}
            disabled={action.disabled}
            className={`px-3.5 py-1.5 font-bold rounded-lg border flex items-center space-x-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
              status === 'APPROVED' || status === 'PUBLISHED'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border-emerald-500'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title={
              status === 'APPROVED' || status === 'PUBLISHED'
                ? 'Clip đã được Reviewer duyệt - xuất bản YouTube hoặc thư viện'
                : 'Kết xuất MP4 1080p từ bản dựng hiện tại, rồi chuyển Reviewer duyệt clip'
            }
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{action.label}</span>
          </button>
        </div>
      </div>

      {/* 3 CỘT ĐỘNG: Cột Trái (Scenes list) - Cột Giữa (Remotion Player Live) - Cột Phải (Live Props Inspector) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Cột 1: Danh sách cảnh */}
        <SceneListColumn
          scenes={script.scenes}
          activeSceneId={activeSceneId}
          onSelectScene={setActiveSceneId}
          onAddNewScene={handleAddNewScene}
          onDeleteScene={handleDeleteScene}
          onMoveScene={handleMoveScene}
          onReorderScenes={handleReorderScenes}
          onDuplicateScene={handleDuplicateScene}
          onChangeDuration={handleChangeDuration}
          onUpdateSceneTitle={handleUpdateSceneTitle}
          onOpenTemplateCatalog={onOpenTemplateCatalog}
        />

        {/* Cột 2: LIVE REMOTION PLAYER (Chạy Animation, KaTeX thật) */}
        <main className="flex-1 min-h-0 bg-slate-900 p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col justify-start">
          <div className="w-full max-w-3xl mx-auto space-y-4 pb-8">
            <RemotionPlayerWrapper
              script={script}
              activeSceneId={selectedScene.id}
              onSceneChange={(id) => setActiveSceneId(id)}
              updateSceneProperty={updateSceneProperty}
              activeLegoPieceId={activeLegoPieceId}
              onSelectLegoPiece={setActiveLegoPieceId}
            />

            {/* BullMQ Render Progress Simulator (Khi bấm Kết Xuất MP4) */}
            {isRendering && (
              <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs text-white animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-brand-400 animate-spin" />
                    <span>{renderStageText}</span>
                  </span>
                  <span className="font-mono text-brand-400 font-bold">{renderPercentageText}</span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Cột 3: LIVE PROPS INSPECTOR */}
        <SceneInspector
          selectedScene={selectedScene}
          updateSceneProperty={updateSceneProperty}
          onStartRender={startRender}
          activeLegoPieceId={activeLegoPieceId}
          onSelectLegoPiece={setActiveLegoPieceId}
        />
      </div>
    </section>
  );
};
