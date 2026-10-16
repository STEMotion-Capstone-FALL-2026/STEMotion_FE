import React, { useEffect, useState } from 'react';
import { Check, KanbanSquare, Loader2, X } from 'lucide-react';
import type { STEMScript, UserRole } from '../../types/stem';
import { projectService } from '../../services/projectService';
import { PIPELINE_STAGES, pipelineStage, stageIndex, PipelineStage } from '../../lib/pipeline';

/**
 * The state-driven pipeline of the proposal for the open project: the six
 * lifecycle stages, which one the project is in, and whose turn it is. Opens a
 * board of every project of the workspace grouped by stage.
 */
export const PipelineStatusBar: React.FC<{
  script: STEMScript;
  onOpenProject: (id: string) => void;
  onBackToDashboard?: () => void;
  currentRole?: UserRole;
}> = ({
  script,
  onOpenProject,
  onBackToDashboard,
  currentRole,
}) => {
  const [boardOpen, setBoardOpen] = useState(false);
  const current = stageIndex(pipelineStage(script));
  if (!script.id) return null;

  return (
    <>
      <div className="bg-slate-900 text-white px-6 py-1.5 border-b border-slate-800 flex items-center justify-between gap-3 text-[11px] select-none">
        <div className="flex items-center gap-1 overflow-x-auto">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              type="button"
              className="mr-3 px-2.5 py-0.5 rounded-md bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer border border-slate-700 hover:border-brand-500"
            >
              <span>← Kho kịch bản</span>
            </button>
          )}
          <span className="font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Quy trình:</span>
          {PIPELINE_STAGES.map((stage, i) => (
            <React.Fragment key={stage.id}>
              {i > 0 && <span className="text-slate-600">➔</span>}
              <span
                title={`Phụ trách: ${stage.owner}`}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 ${
                  i === current
                    ? 'bg-brand-600 font-bold ring-2 ring-blue-400/40'
                    : i < current
                      ? 'text-emerald-300'
                      : 'text-slate-500'
                }`}
              >
                {i < current && <Check className="w-3 h-3" />}
                {stage.label}
                {i === current && stage.owner !== '—' && <span className="text-[10px] text-blue-100">· {stage.owner}</span>}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* <button
          type="button"
          onClick={() => setBoardOpen(true)}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 font-semibold"
        >
          <KanbanSquare className="w-3.5 h-3.5" /> Bảng quy trình của tổ
        </button> */}
      </div>
      {boardOpen && (
        <PipelineBoardModal
          currentRole={currentRole}
          onClose={() => setBoardOpen(false)}
          onOpenProject={(id) => {
            setBoardOpen(false);
            onOpenProject(id);
          }}
        />
      )}
    </>
  );
};

const PipelineBoardModal: React.FC<{
  onClose: () => void;
  onOpenProject: (id: string) => void;
  currentRole?: UserRole;
}> = ({
  onClose,
  onOpenProject,
  currentRole,
}) => {
  const [projects, setProjects] = useState<STEMScript[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    projectService
      .getProjects()
      .then(setProjects)
      .catch((err: any) => setError(err?.message || 'Không tải được danh sách dự án.'));
  }, []);

  const isStageAccessible = (stageId: PipelineStage) => {
    if (!currentRole || currentRole === 'admin' || currentRole === 'writer') return true;
    if (currentRole === 'producer') return stageId !== 'DRAFT' && stageId !== 'SCRIPT_REVIEW';
    if (currentRole === 'reviewer') return stageId !== 'DRAFT';
    return true;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 text-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <KanbanSquare className="w-4 h-4 text-brand-600" /> Bảng quy trình sản xuất của tổ
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="p-4 text-rose-600">{error}</p>}
        {!projects && !error && (
          <p className="p-6 text-slate-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
          </p>
        )}
        {projects && (
          <div className="flex-1 overflow-auto p-4 grid grid-cols-6 gap-3 min-w-[900px]">
            {PIPELINE_STAGES.map((stage) => {
              const inStage = projects.filter((p) => pipelineStage(p) === stage.id);
              const accessible = isStageAccessible(stage.id);

              return (
                <div key={stage.id} className="bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{stage.label}</span>
                    <span className="px-1.5 rounded-full bg-white border text-[10px] text-slate-500">{inStage.length}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Phụ trách: {stage.owner}</p>
                  {inStage.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!accessible}
                      onClick={() => accessible && onOpenProject(p.id)}
                      title={
                        !accessible
                          ? currentRole === 'producer'
                            ? 'Kịch bản chưa được duyệt, Producer chưa thể sản xuất video'
                            : 'Bản nháp của tác giả, chưa gửi duyệt'
                          : ''
                      }
                      className={`w-full text-left p-2 rounded-lg border transition-all ${
                        accessible
                          ? 'bg-white border-slate-200 hover:border-brand-400 hover:shadow-xs cursor-pointer'
                          : 'bg-slate-100/70 border-slate-200/60 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-semibold text-slate-900 line-clamp-2">{p.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {p.subject} · {p.gradeLevel}
                        {p.ownerName ? ` · ${p.ownerName}` : ''}
                      </div>
                      {!accessible && (
                        <div className="text-[9px] text-amber-700 font-semibold mt-1">
                          🔒 {currentRole === 'producer' ? 'Chưa được duyệt' : 'Chưa gửi duyệt'}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
