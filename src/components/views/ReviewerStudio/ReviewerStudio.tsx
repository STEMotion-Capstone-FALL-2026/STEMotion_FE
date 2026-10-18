import React, { useState, useEffect } from 'react';
import {
  Columns2,
  FileText,
  Play,
  RotateCcw,
  CheckCheck,
  Check,
  Mic,
  Sparkles,
  CheckSquare,
  MessageSquare,
  Plus,
  Download,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ListOrdered,
  X,
  Loader2,
} from 'lucide-react';
import { STEMScript, SceneData, FeedbackComment } from '../../../types/stem';
import { UserRole, reviewService, QaReport, ReviewQueueItem } from '../../../services';
import { RemotionPlayerWrapper } from '../../RemotionPlayerWrapper';
import { renderLatexToString } from '../../../utils/latex';
import { ClipCompareModal } from '../../modals/ClipCompareModal';

interface ReviewerStudioProps {
  script: STEMScript;
  setScript: React.Dispatch<React.SetStateAction<STEMScript>>;
  reviewerMode: 'script' | 'video';
  setReviewerMode: (mode: 'script' | 'video') => void;
  selectedScene: SceneData;
  setActiveSceneId: (id: string) => void;
  comments: FeedbackComment[];
  currentSec: number;
  setCurrentSec: (sec: number) => void;
  seekTimestampSec: number | null;
  setSeekTimestampSec: (sec: number | null) => void;
  newCommentInput: string;
  setNewCommentInput: (val: string) => void;
  handleAddComment: (e: React.FormEvent) => void;
  onRoleChange: (role: UserRole) => void;
  onOpenPublishModal: () => void;
  onOpenProject?: (projectId: string) => void;
  onStartRender?: () => Promise<void>;
  isRendering?: boolean;
  showToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const ReviewerStudio: React.FC<ReviewerStudioProps> = ({
  script,
  setScript,
  reviewerMode,
  setReviewerMode,
  selectedScene,
  setActiveSceneId,
  comments,
  currentSec,
  setCurrentSec,
  seekTimestampSec,
  setSeekTimestampSec,
  newCommentInput,
  setNewCommentInput,
  handleAddComment,
  onRoleChange,
  onOpenPublishModal,
  onOpenProject,
  onStartRender,
  isRendering = false,
  showToast,
}) => {
  const [decisionPending, setDecisionPending] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [qaReport, setQaReport] = useState<QaReport | null>(null);
  const [loadingQa, setLoadingQa] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [localComments, setLocalComments] = useState<FeedbackComment[]>(comments);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const fetchQaReport = async () => {
    setLoadingQa(true);
    try {
      const rep = await reviewService.getQaReport(script.id);
      setQaReport(rep);
    } catch {
      setQaReport(null);
    } finally {
      setLoadingQa(false);
    }
  };

  useEffect(() => {
    void fetchQaReport();
  }, [script.id]);

  const handleOpenQueue = async () => {
    setShowQueueModal(true);
    setLoadingQueue(true);
    try {
      const items = await reviewService.getReviewQueue();
      setQueueItems(items);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải hàng đợi kiểm định.', 'warn');
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await reviewService.resolveComment(script.id, commentId);
      showToast('Đã đánh dấu đã giải quyết góp ý.', 'success');
      setLocalComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: 'RESOLVED' } : c))
      );
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi giải quyết góp ý.', 'warn');
    }
  };

  const handleReopenComment = async (commentId: string) => {
    try {
      await reviewService.reopenComment(commentId);
      showToast('Đã mở lại nhận xét.', 'info');
      setLocalComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: 'OPEN' } : c))
      );
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi mở lại nhận xét.', 'warn');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await reviewService.deleteComment(commentId);
      showToast('Đã xóa nhận xét.', 'info');
      setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa nhận xét.', 'warn');
    }
  };

  // Producer đã hoàn thành video và nộp cho Reviewer duyệt khi:
  // - videoStatus là IN_QA (đang chờ Reviewer duyệt video)
  // - hoặc video đã được APPROVED/PUBLISHED
  const isVideoReadyForReview =
    script.videoStatus === 'IN_QA' ||
    script.videoStatus === 'APPROVED' ||
    script.videoStatus === 'PUBLISHED';

  // Nếu đang ở tab duyệt video nhưng Producer chưa nộp, tự động chuyển về duyệt kịch bản
  useEffect(() => {
    if (reviewerMode === 'video' && !isVideoReadyForReview) {
      setReviewerMode('script');
    }
  }, [reviewerMode, isVideoReadyForReview, setReviewerMode]);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<'SCRIPT' | 'VIDEO' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleOpenRejectModal = (target: 'SCRIPT' | 'VIDEO') => {
    setRejectTarget(target);
    setRejectReason(reviewNote || '');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối để chuyển cho tác giả kịch bản / người dựng clip.', 'warn');
      return;
    }
    const noteToSend = rejectReason.trim();
    setReviewNote(noteToSend);
    setRejectModalOpen(false);

    if (rejectTarget === 'SCRIPT') {
      await decide('CHANGE_REQUESTED', noteToSend);
    } else if (rejectTarget === 'VIDEO') {
      await decide('VIDEO_RETURNED', noteToSend);
    }
  };

  const decide = async (
    decision: 'APPROVED' | 'CHANGE_REQUESTED' | 'VIDEO_APPROVED' | 'VIDEO_RETURNED',
    overrideNote?: string
  ) => {
    if (decisionPending) return;
    const noteToSubmit = overrideNote !== undefined ? overrideNote : reviewNote;
    setDecisionPending(true);
    try {
      const updated = decision === 'VIDEO_APPROVED'
        ? await reviewService.approveVideo(script.id)
        : decision === 'VIDEO_RETURNED'
          ? await reviewService.sendBackVideo(script.id, noteToSubmit)
          : await reviewService.submitReviewDecision(script.id, decision, noteToSubmit);
      setScript(updated);
      setActiveSceneId(updated.scenes[0]?.id || '');
      showToast(decision.includes('RETURNED') || decision === 'CHANGE_REQUESTED'
        ? 'Đã lưu yêu cầu chỉnh sửa và chuyển trả thành công.' : 'Đã lưu quyết định phê duyệt.', 'success');
      if (decision === 'VIDEO_APPROVED') {
        if (!updated.videoUrl && onStartRender) {
          showToast('Clip đã được phê duyệt! Bắt đầu kết xuất MP4 tự động...', 'info');
          void onStartRender();
        } else {
          onOpenPublishModal();
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Không lưu được quyết định. Trạng thái chưa thay đổi.', 'warn');
    } finally { setDecisionPending(false); }
  };
  return (
    <section className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Top Bar Reviewer với Bộ Chuyển Chế Độ Duyệt */}
      <div className="bg-white border-b px-6 py-2.5 flex justify-between items-center text-xs shrink-0 z-10 shadow-2xs">
        <div className="flex items-center space-x-3">
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
            REVIEWER QA WORKSPACE
          </span>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-sm text-slate-900">{script.title}</span>
          <button
            onClick={() => void handleOpenQueue()}
            className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Xem danh sách kịch bản và video đang chờ kiểm định"
          >
            <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
            <span>Hàng đợi chờ duyệt</span>
          </button>
        </div>

        {/* 2 Tabs Chuyển Giữa: Duyệt Kịch Bản (Cấp 1) & Duyệt Video (Cấp 2) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setReviewerMode('script')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              reviewerMode === 'script'
                ? 'bg-white text-amber-700 shadow-xs ring-1 ring-amber-400/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Duyệt Kịch Bản Chữ</span>
            {script.scriptStatus === 'APPROVED' && (
              <Check className="w-3 h-3 text-emerald-500 font-bold" />
            )}
          </button>

          {/* Tab Duyệt Video: Chỉ mở khi Producer đã hoàn tất và nộp video */}
          <button
            onClick={() => {
              if (!isVideoReadyForReview) {
                showToast('Producer chưa làm xong hoặc chưa nộp video để duyệt.', 'warn');
                return;
              }
              setReviewerMode('video');
            }}
            disabled={!isVideoReadyForReview}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              !isVideoReadyForReview
                ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-100'
                : reviewerMode === 'video'
                ? 'bg-white text-purple-700 shadow-xs ring-1 ring-purple-400/30 cursor-pointer'
                : 'text-slate-600 hover:text-slate-900 cursor-pointer'
            }`}
            title={
              !isVideoReadyForReview
                ? 'Producer chưa nộp video. Chỉ mở khi Producer hoàn tất dựng và gửi duyệt.'
                : 'Thẩm định video thành phẩm'
            }
          >
            {!isVideoReadyForReview ? (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>2. Duyệt Video Thành Phẩm</span>
            {!isVideoReadyForReview ? (
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                Chờ Producer nộp
              </span>
            ) : script.videoStatus === 'APPROVED' ? (
              <Check className="w-3 h-3 text-emerald-500 font-bold" />
            ) : script.videoStatus === 'IN_QA' ? (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-bold animate-pulse">
                Cần duyệt
              </span>
            ) : null}
          </button>
        </div>

        {/* Quyết định của Reviewer */}
        <div className="flex items-center space-x-2">
          {reviewerMode === 'script' ? (
            script.scriptStatus === 'APPROVED' ? (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Kịch bản đã được duyệt</span>
                </span>
                {!isVideoReadyForReview && (
                  <span className="text-[11px] text-slate-500 italic">
                    • Đang chờ Producer dựng và nộp video
                  </span>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleOpenRejectModal('SCRIPT')}
                  disabled={decisionPending}
                  className="px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Yêu Cầu Writer Sửa Lại</span>
                </button>
                <button
                  onClick={() => void decide('APPROVED')}
                  disabled={decisionPending}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Duyệt Kịch Bản ➔ Chuyển Producer</span>
                </button>
              </>
            )
          ) : (
            <>
              <button
                onClick={() => setCompareOpen(true)}
                className="px-3 py-1.5 bg-purple-50 border border-purple-300 hover:bg-purple-100 text-purple-800 rounded-lg font-bold flex items-center space-x-1"
                title="Đặt hai bản render của clip cạnh nhau"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>So sánh bản render</span>
              </button>
              <button
                onClick={() => handleOpenRejectModal('VIDEO')}
                disabled={decisionPending}
                className="px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yêu Cầu Producer Sửa Clip</span>
              </button>
              <button
                onClick={onOpenPublishModal}
                disabled={!script.videoUrl}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shadow-2xs ${
                  !script.videoUrl
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                    : 'bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-800 cursor-pointer'
                }`}
                title={script.videoUrl ? 'Tải video MP4 Full HD về máy tính' : 'Chưa có file MP4; cần kết xuất sau khi duyệt'}
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải Video MP4</span>
              </button>
              <button
                onClick={() => void decide('VIDEO_APPROVED')}
                disabled={decisionPending || isRendering}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                {decisionPending || isRendering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                <span>
                  {script.videoStatus === 'APPROVED'
                    ? script.videoUrl
                      ? 'Đã Duyệt ➔ Tải MP4 / Xuất Bản'
                      : isRendering
                      ? 'Đang Render MP4...'
                      : 'Đã Duyệt ➔ Bắt Đầu Render MP4'
                    : 'Duyệt Video ➔ Kích Hoạt Render MP4'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* NỘI DUNG REVIEWER THEO TỪNG CHẾ ĐỘ */}
      {reviewerMode === 'script' ? (
        /* ========================================================================= */
        /* CHẾ ĐỘ 1: THẨM ĐỊNH KỊCH BẢN VĂN BẢN (SCRIPT REVIEW) */
        /* ========================================================================= */
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Cột 1: Cấu trúc kịch bản */}
          <aside className="w-72 bg-white border-r border-slate-200 p-4 flex flex-col h-full min-h-0 overflow-hidden shrink-0">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
              Danh Sách Cảnh Cần Duyệt ({script.scenes.length})
            </span>
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
              {script.scenes.map((sc, i) => (
                <div
                  key={sc.id}
                  onClick={() => setActiveSceneId(sc.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    sc.id === selectedScene.id
                      ? 'bg-amber-50 border-amber-400 font-semibold shadow-xs ring-2 ring-amber-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                    <span className="font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      0{i + 1}
                    </span>
                    <span>{Math.round((sc.durationInFrames || 150) / 30)}s</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{sc.title}</h4>
                  <span className="text-[10px] font-mono text-amber-700 block mt-0.5">
                    {sc.type}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          {/* Cột 2: Nội dung chi tiết kịch bản cần thẩm định */}
          <main className="flex-1 min-h-0 bg-slate-50 p-6 overflow-y-auto custom-scrollbar flex justify-center">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col space-y-5">
              <div className="border-b pb-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedScene.type}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {selectedScene.title}
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded">
                  ⏱ {Math.round((selectedScene.durationInFrames || 150) / 30)} giây
                </span>
              </div>

              {/* Lời thoại đọc */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-600" />
                  <span>Lời Thoại Thuyết Minh (Voiceover):</span>
                </label>
                <p className="text-sm text-slate-800 leading-relaxed font-serif bg-white p-3 rounded-lg border border-slate-200">
                  "{selectedScene.narration || 'Chưa có lời thoại'}"
                </p>
              </div>

              {/* Kiến thức trọng tâm: KaTeX / Biểu đồ / Quiz */}
              {selectedScene.type === 'MATH_FORMULA' && (
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                  <label className="text-xs font-bold text-blue-900 block">
                    Công Thức Toán Học (Kiểm tra tính chính xác của KaTeX):
                  </label>
                  <div
                    className="p-4 bg-white rounded-lg border border-blue-200 text-center overflow-x-auto text-lg"
                    dangerouslySetInnerHTML={renderLatexToString((selectedScene as any).latex || '')}
                  />
                  {(selectedScene as any).steps && (
                    <div className="space-y-1 mt-2">
                      <span className="text-[11px] font-bold text-slate-700">
                        Các bước biến đổi:
                      </span>
                      {(selectedScene as any).steps.map((st: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-100 flex items-center justify-between"
                        >
                          <span>
                            <b>{st.label}:</b> {st.explanation}
                          </span>
                          <span className="font-mono text-brand-600 font-bold text-[11px]">
                            {st.latexSnippet}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedScene.type === 'STEM_QUIZ' && (
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                  <label className="text-xs font-bold text-amber-900 block">
                    Câu Hỏi Trắc Nghiệm Tương Tác:
                  </label>
                  <p className="font-bold text-slate-900 text-sm">
                    {(selectedScene as any).question}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(selectedScene as any).options?.map((opt: string, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs font-medium ${
                          idx === (selectedScene as any).correctIndex
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {opt} {idx === (selectedScene as any).correctIndex && '✓ (Đáp án đúng)'}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded border">
                    <b>Giải thích:</b> {(selectedScene as any).explanation}
                  </p>
                </div>
              )}

              {selectedScene.type === 'DATA_CHART' && (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                  <label className="text-xs font-bold text-emerald-900 block">
                    Số Liệu Biểu Đồ Thực Nghiệm:
                  </label>
                  <div className="flex gap-2 text-xs text-slate-700">
                    <span>
                      Trục X: <b>{(selectedScene as any).xAxisLabel}</b>
                    </span>
                    <span>•</span>
                    <span>
                      Trục Y: <b>{(selectedScene as any).yAxisLabel}</b>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(selectedScene as any).dataPoints?.map((dp: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded border text-xs text-center">
                        <div className="text-slate-500 text-[10px]">{dp.label}</div>
                        <div className="font-bold text-slate-800 text-sm font-mono">{dp.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedScene.type === 'CHEMICAL_REACTION' && (
                <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                  <label className="text-xs font-bold text-rose-900 block">
                    Thẩm Định Phương Trình & Phản Ứng Hóa Học:
                  </label>
                  <div
                    className="p-3 bg-white rounded-lg border border-rose-200 text-center text-lg"
                    dangerouslySetInnerHTML={renderLatexToString((selectedScene as any).equation || '')}
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border">
                      <b className="text-slate-700">Chất tham gia:</b>{' '}
                      {(selectedScene as any).reactants}
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <b className="text-slate-700">Sản phẩm:</b> {(selectedScene as any).products}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-white p-2 rounded border">
                    <b>Hiện tượng:</b> {(selectedScene as any).observation}
                  </p>
                </div>
              )}

              {selectedScene.type === 'COMPARISON_SPLIT' && (
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                  <label className="text-xs font-bold text-amber-900 block">
                    Thẩm Định Đối Chiếu Hai Khái Niệm:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200">
                      <b className="text-blue-900 block mb-1">
                        {(selectedScene as any).topicA?.title}
                      </b>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                        {(selectedScene as any).topicA?.points?.map((p: string, pIdx: number) => (
                          <li key={pIdx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200">
                      <b className="text-amber-900 block mb-1">
                        {(selectedScene as any).topicB?.title}
                      </b>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                        {(selectedScene as any).topicB?.points?.map((p: string, pIdx: number) => (
                          <li key={pIdx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-white p-2 rounded border">
                    <b>Kết luận:</b> {(selectedScene as any).conclusion}
                  </p>
                </div>
              )}

              {selectedScene.type === 'PROCESS_TIMELINE' && (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                  <label className="text-xs font-bold text-emerald-900 block">
                    Thẩm Định Chu Trình Sinh Học & Tiến Trình:
                  </label>
                  <p className="font-bold text-slate-800 text-xs">
                    {(selectedScene as any).processTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(selectedScene as any).stages?.map((st: any, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="p-2 bg-white rounded-lg border border-emerald-100 text-xs"
                      >
                        <span className="font-bold text-emerald-800 block">
                          Pha {sIdx + 1}: {st.title}
                        </span>
                        <span className="text-[11px] text-slate-600 mt-0.5 block">
                          {st.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedScene.type === 'ILLUSTRATED_EXPLAINER' && (
                <div className="p-4 bg-fuchsia-50/60 rounded-xl border border-fuchsia-200 space-y-2">
                  <label className="text-xs font-bold text-fuchsia-900 block">
                    Thẩm Định Minh Họa Flat Explainer:
                  </label>
                  <p className="font-bold text-slate-800 text-sm">{(selectedScene as any).headline}</p>
                  {(selectedScene as any).caption && (
                    <p className="text-xs text-slate-600">{(selectedScene as any).caption}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {((selectedScene as any).icons || []).map((ic: any, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-white border border-fuchsia-200 text-[11px] text-slate-700"
                      >
                        {ic.label || ic.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedScene.type === 'GEOMETRY_SPACE' && (
                <div className="p-4 bg-cyan-50/60 rounded-xl border border-cyan-200 space-y-2">
                  <label className="text-xs font-bold text-cyan-900 block">
                    Thẩm Định Hình Học & Định Lý:
                  </label>
                  <p className="font-bold text-slate-800 text-xs">
                    {(selectedScene as any).theoremName}
                  </p>
                  <div
                    className="p-3 bg-white rounded-lg border border-cyan-200 text-center text-lg"
                    dangerouslySetInnerHTML={renderLatexToString(
                      (selectedScene as any).formulaLatex || ''
                    )}
                  />
                  <div className="p-2 bg-white rounded border text-xs text-slate-700">
                    <b>Kích thước:</b> a = {(selectedScene as any).dimensions?.a}, b ={' '}
                    {(selectedScene as any).dimensions?.b}, c = {(selectedScene as any).dimensions?.c}
                  </div>
                  <p className="text-xs text-slate-600 bg-white p-2 rounded border">
                    <b>Ý nghĩa:</b> {(selectedScene as any).explanation}
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Cột 3: Chỉ số AI Sư phạm & Khung Góp Ý Kịch Bản */}
          <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs h-full min-h-0 shrink-0">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <div>
                  <h3 className="font-bold text-slate-900">Thẩm Định Kịch Bản (Script QA)</h3>
                  <p className="text-[10px] text-slate-400">Kiểm tra tính sư phạm & kiến thức</p>
                </div>
              </div>

              {/* Báo Cáo Kiểm Định Pre-publish QA (Live API) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    Báo Cáo Pre-publish QA:
                  </span>
                  <button
                    onClick={() => void fetchQaReport()}
                    disabled={loadingQa}
                    className="text-[10px] text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Chạy lại kiểm định"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingQa ? 'animate-spin' : ''}`} />
                    Quét lại
                  </button>
                </div>

                {loadingQa ? (
                  <p className="text-slate-500 italic text-[11px]">Đang phân tích kiểm định kịch bản...</p>
                ) : qaReport ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {qaReport.passed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đạt chuẩn xuất bản
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5" /> Có {qaReport.failCount} lỗi cần sửa
                        </span>
                      )}
                      {qaReport.warnCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          {qaReport.warnCount} lưu ý
                        </span>
                      )}
                    </div>

                    {/* Danh sách các vi phạm / kiểm tra */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {qaReport.findings && qaReport.findings.length > 0 ? (
                        qaReport.findings.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className={`p-2 rounded-lg border text-[11px] leading-snug ${
                              f.severity === 'FAIL'
                                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                                : f.severity === 'WARN'
                                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            }`}
                          >
                            <div className="font-bold flex items-center gap-1">
                              <span>[{f.severity}]</span>
                              <span>{f.check}</span>
                            </div>
                            <p className="mt-0.5">{f.message}</p>
                            {f.suggestion && (
                              <p className="mt-1 text-[10px] italic text-slate-600">
                                💡 Gợi ý: {f.suggestion}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-[11px] italic">Không phát hiện cảnh báo hay lỗi vi phạm nào.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    Chưa có kết quả phân tích. Bấm 'Quét lại' để kiểm tra quy chuẩn sư phạm.
                  </p>
                )}
              </div>

              {/* Form Góp Ý Kịch Bản */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block text-[11px]">
                  Ghi chú thẩm định kịch bản cho Writer:
                </label>
                <textarea
                  rows={4}
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder="Nhập nhận xét hoặc chỉ dẫn sửa đổi trước khi duyệt..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 shrink-0 mt-4">
              <button
                onClick={() => void decide('APPROVED')}
                disabled={decisionPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Phê Duyệt Kịch Bản (Chuyển Bước 3)</span>
              </button>
            </div>
          </aside>
        </div>
      ) : (
        /* ========================================================================= */
        /* CHẾ ĐỘ 2: THẨM ĐỊNH VIDEO THÀNH PHẨM (VIDEO QA) */
        /* ========================================================================= */
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Cột Trái: Remotion Player trực tiếp để Reviewer thẩm định từng frame */}
          <main className="flex-1 min-h-0 bg-slate-900 p-4 md:p-6 flex flex-col justify-start overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-3xl mx-auto space-y-4 pb-8">
              <RemotionPlayerWrapper
                script={script}
                seekTimestampSec={seekTimestampSec}
                onFrameUpdate={(_f, s) => setCurrentSec(s)}
              />
            </div>
          </main>

          {/* Cột Phải: Ghi chú phản biện theo mốc thời gian */}
          <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs h-full min-h-0 shrink-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-slate-900">
                    Ghi Chú Mốc Thời Gian ({localComments.length})
                  </h3>
                </div>
                <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {Math.floor(currentSec / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {(Math.floor(currentSec) % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Danh sách bình luận động */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {localComments.length === 0 ? (
                  <p className="text-center text-slate-400 py-4 text-[11px]">Chưa có nhận xét nào được ghim trên video.</p>
                ) : (
                  localComments.map((cm) => {
                    const isResolved = cm.status === 'RESOLVED';
                    return (
                      <div
                        key={cm.id}
                        className={`p-3 rounded-xl text-xs space-y-1.5 transition-colors border ${
                          isResolved
                            ? 'bg-slate-100/70 border-slate-200 opacity-75'
                            : 'bg-slate-50 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-purple-700 bg-white px-1.5 py-0.5 rounded border text-[10px]">
                              ⏱{' '}
                              {Math.floor(cm.timestampSec / 60)
                                .toString()
                                .padStart(2, '0')}
                              :
                              {(Math.floor(cm.timestampSec) % 60).toString().padStart(2, '0')}
                            </span>
                            {isResolved ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                Đã sửa
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                Chưa sửa
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setSeekTimestampSec(cm.timestampSec)}
                            className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer"
                          >
                            Nhảy tới ▶
                          </button>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isResolved ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                          {cm.content}
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                          {isResolved ? (
                            <button
                              onClick={() => void handleReopenComment(cm.id)}
                              className="text-[10px] text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                            >
                              Mở lại
                            </button>
                          ) : (
                            <button
                              onClick={() => void handleResolveComment(cm.id)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Đánh dấu đã sửa
                            </button>
                          )}
                          <button
                            onClick={() => void handleDeleteComment(cm.id)}
                            className="text-[10px] text-rose-600 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 cursor-pointer"
                            title="Xóa nhận xét"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Form thêm nhận xét ghim vào giây */}
              <form
                onSubmit={handleAddComment}
                className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2"
              >
                <span className="font-bold text-purple-900 block text-[11px]">
                  Ghim nhận xét tại giây thứ {Math.round(currentSec)}:
                </span>
                <textarea
                  rows={2}
                  value={newCommentInput}
                  onChange={(e) => setNewCommentInput(e.target.value)}
                  placeholder="Nhập góp ý sư phạm hoặc đồ họa..."
                  className="w-full p-2 border border-purple-300 rounded-lg text-xs bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ghim Vào Clip</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
      {compareOpen && <ClipCompareModal projectId={script.id} onClose={() => setCompareOpen(false)} />}

      {/* Modal Hàng Đợi Kiểm Định (Review Queue) */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Hàng Đợi Kiểm Định (Review Queue)</h2>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingQueue ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                  Đang tải danh sách chờ duyệt...
                </div>
              ) : queueItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  Không có dự án nào đang chờ kiểm định vào lúc này.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {queueItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-3 rounded-xl transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {item.subject}
                          </span>
                          {item.videoStatus === 'IN_QA' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                              Chờ duyệt video
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Chờ duyệt kịch bản
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span>Số cảnh: {item.sceneCount}</span>
                          <span>Tác giả: {item.ownerName || 'N/A'}</span>
                          <span>Cập nhật: {new Date(item.updatedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>

                      {onOpenProject && (
                        <button
                          onClick={() => {
                            setShowQueueModal(false);
                            onOpenProject(item.id);
                          }}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        >
                          Kiểm định
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowQueueModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Từ Chối & Ghi Lý Do Yêu Cầu Chỉnh Sửa */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  {rejectTarget === 'SCRIPT' ? 'Yêu Cầu Writer Sửa Lại Kịch Bản' : 'Yêu Cầu Producer Sửa Clip Video'}
                </h2>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200/70 p-3 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {rejectTarget === 'SCRIPT'
                    ? 'Vui lòng cung cấp lý do từ chối hoặc hướng dẫn sửa đổi sư phạm. Writer sẽ nhìn thấy thông báo này nổi bật ngay trên đầu kịch bản.'
                    : 'Vui lòng ghi rõ các lỗi cần sửa đổi (âm thanh, đồ họa, timing phụ đề hoặc bố cục animation) để Producer chỉnh sửa và kết xuất lại.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do từ chối & chỉ dẫn sửa đổi <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={
                    rejectTarget === 'SCRIPT'
                      ? 'Ví dụ: Phân cảnh 2 công thức vận tốc bị sai số mũ; Lời thoại phân cảnh 3 quá dài so với thời lượng 5s...'
                      : 'Ví dụ: Phụ đề chạy từ giây 0:15 bị trễ so với giọng đọc; Animation đồ thị ở cảnh 3 xuất hiện quá nhanh...'
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 focus:bg-white resize-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={decisionPending}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmReject()}
                disabled={decisionPending || !rejectReason.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                {decisionPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Gửi Yêu Cầu Chỉnh Sửa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
