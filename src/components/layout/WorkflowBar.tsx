import React from 'react';
import { Sparkles, Check, Youtube } from 'lucide-react';
import { UserRole } from '../../services';
import { STEMScript } from '../../types/stem';

interface WorkflowBarProps {
  currentRole: UserRole;
  reviewerMode: 'script' | 'video';
  script: STEMScript;
  onRoleChange: (role: UserRole) => void;
  onSetReviewerMode: (mode: 'script' | 'video') => void;
  onOpenPublishModal: () => void;
}

export const WorkflowBar: React.FC<WorkflowBarProps> = ({
  currentRole,
  reviewerMode,
  script,
  onRoleChange,
  onSetReviewerMode,
  onOpenPublishModal,
}) => {
  return (
    <div className="bg-slate-900 text-white px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs select-none gap-2 sticky top-[53px] z-30 shadow-md">
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          Luồng Sản Xuất:
        </span>

        <div className="flex items-center gap-1 font-semibold text-[11px] shrink-0">
          {/* Bước 1: Writer Viết Kịch Bản */}
          <button
            onClick={() => onRoleChange('writer')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              currentRole === 'writer'
                ? 'bg-brand-600 text-white shadow-xs font-bold ring-2 ring-blue-400/40'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
              1
            </span>
            <span>Writer Viết Kịch Bản</span>
            {script.scriptStatus !== 'DRAFT' && <Check className="w-3 h-3 text-emerald-400" />}
          </button>

          <span className="text-slate-600 font-bold">➔</span>

          {/* Bước 2: Reviewer Duyệt Kịch Bản */}
          <button
            onClick={() => {
              onRoleChange('reviewer');
              onSetReviewerMode('script');
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              currentRole === 'reviewer' && reviewerMode === 'script'
                ? 'bg-amber-600 text-white shadow-xs font-bold ring-2 ring-amber-400/40'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
              2
            </span>
            <span>Reviewer Duyệt Kịch Bản</span>
            {script.scriptStatus === 'APPROVED' && <Check className="w-3 h-3 text-emerald-400" />}
          </button>

          <span className="text-slate-600 font-bold">➔</span>

          {/* Bước 3: Producer Dựng & Render Video */}
          <button
            onClick={() => onRoleChange('producer')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              currentRole === 'producer'
                ? 'bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-400/40'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
              3
            </span>
            <span>Producer Tạo Video</span>
            {script.videoStatus === 'IN_QA' || script.videoStatus === 'APPROVED' ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : null}
          </button>

          <span className="text-slate-600 font-bold">➔</span>

          {/* Bước 4: Reviewer Duyệt Video */}
          <button
            onClick={() => {
              onRoleChange('reviewer');
              onSetReviewerMode('video');
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              currentRole === 'reviewer' && reviewerMode === 'video'
                ? 'bg-purple-600 text-white shadow-xs font-bold ring-2 ring-purple-400/40'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
              4
            </span>
            <span>Reviewer Duyệt Video</span>
            {script.videoStatus === 'APPROVED' && <Check className="w-3 h-3 text-emerald-400" />}
          </button>

          <span className="text-slate-600 font-bold">➔</span>

          {/* Bước 5: Xuất YouTube / LMS */}
          <button
            onClick={onOpenPublishModal}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all font-bold ${
              script.videoStatus === 'APPROVED'
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-xs'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-white" />
            <span>5. Xuất YouTube</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Kịch bản:{' '}
          <b
            className={
              script.scriptStatus === 'APPROVED'
                ? 'text-emerald-400'
                : script.scriptStatus === 'CHANGE_REQUESTED'
                ? 'text-rose-400'
                : 'text-amber-400'
            }
          >
            {script.scriptStatus}
          </b>
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Video:{' '}
          <b
            className={
              script.videoStatus === 'APPROVED' ? 'text-emerald-400' : 'text-indigo-400'
            }
          >
            {script.videoStatus || 'NOT_RENDERED'}
          </b>
        </span>
      </div>
    </div>
  );
};
