import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Film,
  BookOpen,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  FolderKanban,
  User,
  ArrowRight,
  PlayCircle
} from 'lucide-react';
import { STEMScript, STEMSubject, UserRole } from '../../../types/stem';
import { PIPELINE_STAGES, pipelineStage, PipelineStage } from '../../../lib/pipeline';

interface ProjectDashboardViewProps {
  scripts: STEMScript[];
  currentRole: UserRole;
  activeGroupName: string;
  onSelectProject: (projectId: string) => void;
  onOpenCreateProjectModal: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Math: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Physics: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Chemistry: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Biology: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ComputerScience: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const STAGE_CONFIGS: Record<PipelineStage, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: { label: 'Bản nháp', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  SCRIPT_REVIEW: { label: 'Chờ duyệt kịch bản', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  APPROVED: { label: 'Đã duyệt (Sẵn sàng dựng)', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  IN_PRODUCTION: { label: 'Đang dựng video', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  CLIP_REVIEW: { label: 'Chờ duyệt video', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  PUBLISHED: { label: 'Đã xuất bản', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' },
};

export const ProjectDashboardView: React.FC<ProjectDashboardViewProps> = ({
  scripts,
  currentRole,
  activeGroupName,
  onSelectProject,
  onOpenCreateProjectModal,
  onRefresh,
  isRefreshing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');

  // Filtered scripts
  const filteredScripts = useMemo(() => {
    return scripts.filter((sc) => {
      const matchSearch =
        sc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sc.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sc.subject?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSubject = selectedSubject === 'ALL' || sc.subject === selectedSubject;
      const stage = pipelineStage(sc);
      const matchStage = selectedStage === 'ALL' || stage === selectedStage;

      return matchSearch && matchSubject && matchStage;
    });
  }, [scripts, searchTerm, selectedSubject, selectedStage]);

  // Statistics
  const stats = useMemo(() => {
    const total = scripts.length;
    const drafts = scripts.filter((s) => pipelineStage(s) === 'DRAFT').length;
    const inScriptReview = scripts.filter((s) => pipelineStage(s) === 'SCRIPT_REVIEW').length;
    const readyForProduce = scripts.filter(
      (s) => pipelineStage(s) === 'APPROVED' || pipelineStage(s) === 'IN_PRODUCTION'
    ).length;
    const inClipReview = scripts.filter((s) => pipelineStage(s) === 'CLIP_REVIEW').length;
    const published = scripts.filter((s) => pipelineStage(s) === 'PUBLISHED').length;

    return { total, drafts, inScriptReview, readyForProduce, inClipReview, published };
  }, [scripts]);

  const canCreate = currentRole === 'writer' || currentRole === 'admin';

  return (
    <div className="flex-1 bg-slate-50/70 overflow-y-auto min-h-0 flex flex-col font-sans">
      {/* Top Banner / Hero */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
              <FolderKanban className="w-4 h-4" />
              <span>Không gian làm việc: {activeGroupName}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Kho Kịch Bản & Dự Án Video STEM
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Chọn kịch bản bên dưới để bắt đầu soạn thảo, chỉnh sửa visual Lego hoặc thẩm định chất lượng.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
            </button>

            {canCreate && (
              <button
                onClick={onOpenCreateProjectModal}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Kịch Bản Mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stage Tabs / Stats Bar */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedStage('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedStage === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Tất cả</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{stats.total}</span>
          </button>

          <button
            onClick={() => setSelectedStage('DRAFT')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedStage === 'DRAFT'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Bản nháp</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-300 text-slate-800">{stats.drafts}</span>
          </button>

          <button
            onClick={() => setSelectedStage('SCRIPT_REVIEW')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedStage === 'SCRIPT_REVIEW'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>Chờ duyệt kịch bản</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">{stats.inScriptReview}</span>
          </button>

          <button
            onClick={() => setSelectedStage('APPROVED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedStage === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>Sẵn sàng dựng video</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-bold">{stats.readyForProduce}</span>
          </button>

          <button
            onClick={() => setSelectedStage('CLIP_REVIEW')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedStage === 'CLIP_REVIEW'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span>Chờ duyệt video</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-200 text-purple-900 font-bold">{stats.inClipReview}</span>
          </button>

          <button
            onClick={() => setSelectedStage('PUBLISHED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedStage === 'PUBLISHED'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            <span>Đã xuất bản</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-200 text-teal-900 font-bold">{stats.published}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-8 py-6 flex-1 flex flex-col">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên bài, môn, lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-brand-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-400">Môn học:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Tất cả môn học</option>
              <option value="Math">Toán Học (Math)</option>
              <option value="Physics">Vật Lý (Physics)</option>
              <option value="Chemistry">Hóa Học (Chemistry)</option>
              <option value="Biology">Sinh Học (Biology)</option>
              <option value="ComputerScience">Tin Học (Computer Science)</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredScripts.length === 0 ? (
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl mb-3">
              📑
            </div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy kịch bản phù hợp</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {scripts.length === 0
                ? 'Tổ bộ môn chưa có kịch bản nào. Hãy bấm "Tạo Kịch Bản Mới" để bắt đầu.'
                : 'Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.'}
            </p>
            {canCreate && scripts.length === 0 && (
              <button
                onClick={onOpenCreateProjectModal}
                className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                + Soạn Kịch Bản Đầu Tiên
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredScripts.map((sc) => {
              const stage = pipelineStage(sc);
              const stageConfig = STAGE_CONFIGS[stage] || STAGE_CONFIGS.DRAFT;
              const subStyle = SUBJECT_COLORS[sc.subject] || {
                bg: 'bg-slate-50',
                text: 'text-slate-700',
                border: 'border-slate-200',
              };

              const isReadyForProducer = stage === 'APPROVED' || stage === 'IN_PRODUCTION';
              const isNeedsWriter = stage === 'DRAFT';
              const isNeedsReviewer = stage === 'SCRIPT_REVIEW' || stage === 'CLIP_REVIEW';

              return (
                <div
                  key={sc.id}
                  onClick={() => onSelectProject(sc.id)}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-brand-400 hover:shadow-md transition-all duration-200 flex flex-col p-5 cursor-pointer relative overflow-hidden"
                >
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${subStyle.bg} ${subStyle.text} ${subStyle.border}`}
                    >
                      {sc.subject} · {sc.gradeLevel}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${stageConfig.bg} ${stageConfig.text} ${stageConfig.border}`}
                    >
                      {stageConfig.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug mb-3">
                    {sc.title}
                  </h3>

                  {/* Details metadata */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-100 text-xs text-slate-500 mb-4">
                    <div className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sc.scenes?.length || 0} Phân cảnh</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        ~{sc.totalDurationSeconds || (sc.scenes?.length || 0) * 15}s thời lượng
                      </span>
                    </div>
                  </div>

                  {/* Smart Action Footer by Role */}
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{(sc as any).ownerName || 'Thành viên tổ'}</span>
                    </div>

                    {currentRole === 'producer' ? (
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                          isReadyForProducer
                            ? 'bg-brand-600 text-white shadow-xs group-hover:bg-brand-700'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{isReadyForProducer ? 'Vào Dựng Video' : 'Xem Kịch Bản'}</span>
                      </span>
                    ) : currentRole === 'reviewer' ? (
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                          isNeedsReviewer
                            ? 'bg-amber-600 text-white shadow-xs group-hover:bg-amber-700'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isNeedsReviewer ? 'Thẩm Định Ngay' : 'Xem Chi Tiết'}</span>
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                          isNeedsWriter
                            ? 'bg-brand-600 text-white shadow-xs group-hover:bg-brand-700'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        <span>{isNeedsWriter ? 'Soạn Kịch Bản' : 'Xem Chi Tiết'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
