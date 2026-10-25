import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Reply,
} from 'lucide-react';
import { STEMScript, SceneData, FeedbackComment } from '../../../types/stem';
import {
  UserRole,
  reviewService,
  QaReport,
  ReviewQueueItem,
  compositionService,
  type Composition,
  groupCommentsWithReplies,
  projectService,
  renderService,
} from '../../../services';
import { RemotionPlayerWrapper } from '../../RemotionPlayerWrapper';
import { renderLatexToString } from '../../../utils/latex';
import { ClipCompareModal } from '../../modals/ClipCompareModal';
import { useRenderProgress } from '../../../hooks/useRenderProgress';
import { useDialog } from '../../../hooks/useDialog';

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
  isAddingComment?: boolean;
  onRoleChange: (role: UserRole) => void;
  onOpenPublishModal: () => void;
  onOpenProject?: (projectId: string) => void;
  onStartRender?: () => Promise<void>;
  isRendering?: boolean;
  showToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

interface CommentCardProps {
  comment: FeedbackComment;
  onResolve: (id: string) => Promise<void>;
  onReopen: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReply: (id: string) => Promise<void>;
  onSeek?: (timestampSec: number) => void;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  replyInput: string;
  setReplyInput: (val: string) => void;
  submittingReply: boolean;
}

function CommentCard({
  comment,
  onResolve,
  onReopen,
  onDelete,
  onReply,
  onSeek,
  replyingToId,
  setReplyingToId,
  replyInput,
  setReplyInput,
  submittingReply,
}: CommentCardProps) {
  const actionInFlight = useRef(false);
  const [actionPending, setActionPending] = useState(false);
  const runAction = async (action: () => Promise<void>) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActionPending(true);
    try { await action(); }
    finally { actionInFlight.current = false; setActionPending(false); }
  };
  const isResolved = comment.status === 'RESOLVED';
  const hasReplies = Boolean(comment.replies && comment.replies.length > 0);
  const isReplying = replyingToId === comment.id;

  return (
    <div
      className={`p-3 rounded-xl text-xs space-y-1.5 transition-colors border ${
        isResolved
          ? 'bg-slate-100/70 border-slate-200 opacity-80'
          : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 flex-wrap">
          {comment.timestampSec !== undefined && comment.timestampSec !== null && !comment.sceneId && (
            <span className="font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-[10px]">
              ⏱ {Math.floor(comment.timestampSec / 60).toString().padStart(2, '0')}:
              {(Math.floor(comment.timestampSec) % 60).toString().padStart(2, '0')}
            </span>
          )}
          {isResolved ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" />
              Đã sửa{comment.resolvedByName ? ` bởi ${comment.resolvedByName}` : ''}
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
              Chưa sửa
            </span>
          )}
          {comment.author && (
            <span className="text-[10px] text-slate-500 font-medium">
              • {comment.author} ({comment.role || 'Reviewer'})
            </span>
          )}
        </div>
        {onSeek && comment.timestampSec !== undefined && (
          <button
            type="button"
            onClick={() => onSeek(comment.timestampSec)}
            className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer"
          >
            Nhảy tới ▶
          </button>
        )}
      </div>

      <p className={`text-[11px] leading-relaxed ${isResolved ? 'line-through text-slate-500' : 'text-slate-700'}`}>
        {comment.content}
      </p>

      {/* Action buttons for ROOT comment */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
        {actionPending && <span role="status" className="text-xs text-slate-500">Đang cập nhật…</span>}
        <button
          type="button"
          onClick={() => {
            if (isReplying) {
              setReplyingToId(null);
            } else {
              setReplyingToId(comment.id);
              setReplyInput('');
            }
          }}
          className="text-[10px] text-purple-700 hover:text-purple-800 font-semibold flex items-center gap-0.5 cursor-pointer"
        >
          <Reply className="w-3 h-3" /> Trả lời
        </button>

        {isResolved ? (
          <button
            type="button"
            disabled={actionPending}
            onClick={() => void runAction(() => onReopen(comment.id))}
            className="text-[10px] text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
          >
            Mở lại
          </button>
        ) : (
          <button
            type="button"
            disabled={actionPending}
            onClick={() => void runAction(() => onResolve(comment.id))}
            className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <Check className="w-3 h-3" /> Đánh dấu đã sửa
          </button>
        )}

        <button
          type="button"
          disabled={actionPending}
          onClick={() => void runAction(() => onDelete(comment.id))}
          className="text-[10px] text-rose-600 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 cursor-pointer"
          title="Xóa nhận xét"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Nested Replies (Bug 2.2: Note that reply items do NOT have a resolve button) */}
      {hasReplies && (
        <div className="ml-3 pl-3 border-l-2 border-purple-200 space-y-1.5 mt-2 pt-1">
          {comment.replies!.map((reply) => (
            <div key={reply.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-800">
                  {reply.author || 'Thành viên'} <span className="font-normal text-slate-500">({reply.role || 'Member'})</span>
                </span>
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={() => void runAction(() => onDelete(reply.id))}
                  className="text-rose-600 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                  title="Xóa phản hồi"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
              <p className="text-slate-700 leading-snug">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Inline Reply Form */}
      {isReplying && (
        <div className="ml-3 pl-3 border-l-2 border-purple-300 space-y-1.5 mt-2 pt-1">
          <textarea
            rows={2}
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            placeholder="Nhập câu trả lời cho nhận xét này..."
            className="w-full p-2 border border-purple-200 rounded-lg text-xs bg-white focus:outline-none focus:border-purple-400"
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setReplyingToId(null);
                setReplyInput('');
              }}
              className="px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submittingReply || !replyInput.trim()}
              onClick={() => void onReply(comment.id)}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              {submittingReply && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Gửi Phản Hồi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
  isAddingComment = false,
  onRoleChange,
  onOpenPublishModal,
  onOpenProject,
  onStartRender,
  isRendering = false,
  showToast,
}) => {
  const [decisionPending, setDecisionPending] = useState(false);
  const decisionPendingRef = useRef(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [qaReport, setQaReport] = useState<QaReport | null>(null);
  const [qaError, setQaError] = useState('');
  const [loadingQa, setLoadingQa] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const queueDialog = useDialog(showQueueModal, 'Hàng đợi kiểm định', () => setShowQueueModal(false));
  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueError, setQueueError] = useState('');
  const queueRequest = useRef(0);
  const [localComments, setLocalComments] = useState<FeedbackComment[]>(comments);
  const activeProject = useRef(script.id);
  activeProject.current = script.id;

  const [composition, setComposition] = useState<Composition | null>(null);
  const [loadingComposition, setLoadingComposition] = useState(false);
  const [compositionError, setCompositionError] = useState<string | null>(null);
  const compositionRequest = useRef(0);
  const [videoPlayerSource, setVideoPlayerSource] = useState<'mp4' | 'web'>('web');

  useEffect(() => {
    setVideoPlayerSource(script.videoUrl ? 'mp4' : 'web');
  }, [script.id, script.videoUrl]);

  const fetchComposition = useCallback(async () => {
    const request = ++compositionRequest.current;
    setLoadingComposition(true);
    setComposition(null);
    setCompositionError(null);
    try {
      const comp = await compositionService.get(script.id);
      if (request !== compositionRequest.current) return;
      if (comp.projectId !== script.id || !comp.scenes?.length) {
        throw new Error('Composition unavailable');
      }
      setComposition(comp);
    } catch {
      if (request !== compositionRequest.current) return;
      setComposition(null);
      setCompositionError('Không tải được bản dựng Producer. Vui lòng thử lại trước khi duyệt video.');
    } finally {
      if (request === compositionRequest.current) setLoadingComposition(false);
    }
  }, [script.id]);

  useEffect(() => {
    if (reviewerMode === 'video') {
      void fetchComposition();
    }
    return () => { compositionRequest.current++; };
  }, [reviewerMode, fetchComposition]);

  const reviewScript = useMemo<STEMScript | null>(() => {
    if (composition?.projectId === script.id && composition.scenes?.length > 0) {
      return {
        ...script,
        scenes: composition.scenes,
        visualTheme: composition.visualTheme || (script as any).visualTheme,
        totalDurationSeconds: Math.round(
          composition.scenes.reduce((acc, s) => acc + (s.durationInFrames || 150), 0) / (script.fps || 30)
        ),
      };
    }
    return null;
  }, [script, composition]);
  const videoApprovalBlocked = loadingComposition || !reviewScript;

  const { status: bgRenderStatus, error: bgRenderError, retry: retryRenderProgress } = useRenderProgress(
    script.id, script.videoStatus === 'APPROVED' && !script.videoUrl,
    videoUrl => {
      setScript(prev => prev.id === script.id ? { ...prev, videoUrl } : prev);
      showToast('Kết xuất MP4 nền đã hoàn tất! Video đã sẵn sàng để xuất bản.', 'success');
    });

  const groupedComments = useMemo(() => {
    return groupCommentsWithReplies(localComments);
  }, [localComments]);

  const sceneComments = useMemo(() => {
    return groupedComments.filter((c) => c.sceneId === selectedScene.id);
  }, [groupedComments, selectedScene.id]);

  const timelineComments = useMemo(() => {
    return groupedComments.filter((c) => !c.sceneId);
  }, [groupedComments]);

  const [sceneCommentInput, setSceneCommentInput] = useState('');
  const [submittingSceneComment, setSubmittingSceneComment] = useState(false);
  const sceneCommentPending = useRef(false);

  const handleAddSceneComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sceneCommentInput.trim() || sceneCommentPending.current) return;
    sceneCommentPending.current = true;
    const projectId = script.id;
    setSubmittingSceneComment(true);
    try {
      const added = await reviewService.addComment(script.id, {
        content: sceneCommentInput.trim(),
        sceneId: selectedScene.id,
        timestampSec: 0,
        status: 'OPEN',
        author: 'Reviewer',
        avatar: 'RV',
        role: 'Reviewer',
        createdAt: 'Vừa xong',
      });
      if (activeProject.current !== projectId) return;
      setLocalComments((prev) => [...prev, added]);
      setSceneCommentInput('');
      showToast('Đã thêm nhận xét cho phân cảnh.', 'success');
    } catch (err: any) {
      if (activeProject.current === projectId) showToast(err?.message || 'Không gửi được nhận xét phân cảnh.', 'warn');
    } finally {
      sceneCommentPending.current = false;
      setSubmittingSceneComment(false);
    }
  };

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const replyPending = useRef(false);

  const handleSendReply = async (commentId: string) => {
    if (!replyInput.trim() || replyPending.current) return;
    replyPending.current = true;
    const projectId = script.id;
    setSubmittingReply(true);
    try {
      const replied = await reviewService.replyComment(commentId, replyInput.trim());
      if (activeProject.current !== projectId) return;
      setLocalComments((prev) => [...prev, replied]);
      setReplyInput('');
      setReplyingToId(null);
      showToast('Đã gửi phản hồi nhận xét.', 'success');
    } catch (err: any) {
      if (activeProject.current === projectId) showToast(err?.message || 'Không gửi được phản hồi.', 'warn');
    } finally {
      replyPending.current = false;
      setSubmittingReply(false);
    }
  };

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const fetchQaReport = async () => {
    const projectId = script.id;
    setLoadingQa(true);
    try {
      const rep = await reviewService.getQaReport(script.id);
      if (activeProject.current !== projectId) return;
      setQaReport(rep);
      setQaError('');
    } catch (error: any) {
      if (activeProject.current === projectId) { setQaReport(null); setQaError(error.message || 'Không tải được kết quả kiểm định. Hãy bấm Quét lại.'); }
    } finally {
      if (activeProject.current === projectId) setLoadingQa(false);
    }
  };

  useEffect(() => {
    setQaReport(null);
    setQaError('');
    void fetchQaReport();
  }, [script.id]);

  const handleOpenQueue = async () => {
    const request = ++queueRequest.current;
    setShowQueueModal(true);
    setLoadingQueue(true);
    try {
      const items = await reviewService.getReviewQueue();
      if (request !== queueRequest.current) return;
      setQueueItems(items);
      setQueueError('');
    } catch (err: any) {
      if (request === queueRequest.current) setQueueError(err.message || 'Lỗi khi tải hàng đợi kiểm định.');
    } finally {
      if (request === queueRequest.current) setLoadingQueue(false);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    const projectId = script.id;
    try {
      const saved = await reviewService.resolveComment(script.id, commentId);
      if (activeProject.current !== projectId) return;
      showToast('Đã đánh dấu đã giải quyết góp ý.', 'success');
      setLocalComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...saved } : c))
      );
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi giải quyết góp ý.', 'warn');
    }
  };

  const handleReopenComment = async (commentId: string) => {
    const projectId = script.id;
    try {
      const saved = await reviewService.reopenComment(commentId);
      if (activeProject.current !== projectId) return;
      showToast('Đã mở lại nhận xét.', 'info');
      setLocalComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...saved } : c))
      );
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi mở lại nhận xét.', 'warn');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const projectId = script.id;
    try {
      await reviewService.deleteComment(commentId);
      if (activeProject.current !== projectId) return;
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
  const rejectDialog = useDialog(rejectModalOpen, 'Lý do yêu cầu chỉnh sửa', () => setRejectModalOpen(false), decisionPending);
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
    let saved = false;
    if (rejectTarget === 'SCRIPT') {
      saved = Boolean(await decide('CHANGE_REQUESTED', noteToSend));
    } else if (rejectTarget === 'VIDEO') {
      saved = Boolean(await decide('VIDEO_RETURNED', noteToSend));
    }
    if (saved) setRejectModalOpen(false);
  };

  const decide = async (
    decision: 'APPROVED' | 'CHANGE_REQUESTED' | 'VIDEO_APPROVED' | 'VIDEO_RETURNED',
    overrideNote?: string
  ) => {
    if (decisionPendingRef.current) return;
    if (decision === 'VIDEO_APPROVED' && videoApprovalBlocked) {
      showToast('Cần tải bản dựng Producer thành công trước khi duyệt video.', 'warn');
      return;
    }
    const noteToSubmit = overrideNote !== undefined ? overrideNote : reviewNote;
    const projectId = script.id;
    decisionPendingRef.current = true;
    setDecisionPending(true);
    try {
      if (decision === 'VIDEO_APPROVED') {
        await reviewService.approveVideo(script.id);
      } else if (decision === 'VIDEO_RETURNED') {
        await reviewService.sendBackVideo(script.id, noteToSubmit);
      } else {
        await reviewService.submitReviewDecision(script.id, decision, noteToSubmit);
      }
      const updated = await projectService.getProjectById(script.id);
      if (activeProject.current !== projectId) return false;
      setScript(updated);
      setActiveSceneId(updated.scenes[0]?.id || '');
      showToast(decision.includes('RETURNED') || decision === 'CHANGE_REQUESTED'
        ? 'Đã lưu yêu cầu chỉnh sửa và chuyển trả thành công.' : 'Đã lưu quyết định phê duyệt.', 'success');
      if (decision === 'VIDEO_APPROVED') {
        if (updated.videoUrl) {
          onOpenPublishModal();
        }
      }
      return true;
    } catch (error: any) {
      showToast(error.message || 'Chưa xác nhận được quyết định. Hãy tải lại trạng thái trước khi thử lại.', 'warn');
      return false;
    } finally {
      decisionPendingRef.current = false;
      setDecisionPending(false);
    }
  };
  return (
    <section className="studio-workspace flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Top Bar Reviewer với Bộ Chuyển Chế Độ Duyệt */}
      <div className="studio-toolbar bg-white border-b px-6 py-2.5 flex justify-between items-center text-xs shrink-0 z-10 shadow-2xs">
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
                  {decisionPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{decisionPending ? 'Đang lưu quyết định…' : 'Duyệt Kịch Bản ➔ Chuyển Producer'}</span>
                </button>
              </>
            )
          ) : (
            <>
              {script.videoStatus === 'APPROVED' || script.videoStatus === 'PUBLISHED' ? (
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Video đã được duyệt</span>
                  </span>
                  {(['QUEUED', 'PROCESSING', 'RENDERING'].includes(bgRenderStatus || '') || isRendering) && (
                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{bgRenderStatus === 'QUEUED' ? 'Đang chờ kết xuất MP4…' : 'Đang render MP4 ngầm…'}</span>
                    </span>
                  )}
                  {bgRenderError && <div role="alert" className="text-xs text-amber-800 max-w-sm">
                    <p>{bgRenderError}</p>
                    <button onClick={retryRenderProgress} className="underline font-semibold">Kiểm tra lại tiến độ</button>
                  </div>}
                  {script.videoUrl ? (
                    <button
                      onClick={onOpenPublishModal}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      title="Tải video MP4 Full HD hoặc xuất bản"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải MP4 / Xuất Bản</span>
                    </button>
                  ) : !isRendering && onStartRender ? (
                    <button
                      onClick={onStartRender}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      title="Bắt đầu kết xuất MP4"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Bắt Đầu Render MP4</span>
                    </button>
                  ) : null}
                </div>
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
                    onClick={() => void decide('VIDEO_APPROVED')}
                    disabled={decisionPending || isRendering || videoApprovalBlocked}
                    title={videoApprovalBlocked ? 'Cần tải bản dựng Producer thành công trước khi duyệt.' : undefined}
                    aria-busy={decisionPending}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    {decisionPending || isRendering ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCheck className="w-4 h-4" />
                    )}
                    <span>{decisionPending ? 'Đang lưu quyết định…' : 'Duyệt Video ➔ Kích Hoạt Render MP4'}</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* NỘI DUNG REVIEWER THEO TỪNG CHẾ ĐỘ */}
      {reviewerMode === 'script' ? (
        /* ========================================================================= */
        /* CHẾ ĐỘ 1: THẨM ĐỊNH KỊCH BẢN VĂN BẢN (SCRIPT REVIEW) */
        /* ========================================================================= */
        <div className="studio-columns flex-1 min-h-0 flex overflow-hidden">
          {/* Cột 1: Cấu trúc kịch bản */}
          <aside className="w-72 bg-white border-r border-slate-200 p-4 flex flex-col h-full min-h-0 overflow-hidden shrink-0">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
              Danh Sách Cảnh Cần Duyệt ({script.scenes.length})
            </span>
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
              {script.scenes.map((sc, i) => {
                const sceneCommentCount = localComments.filter((c) => c.sceneId === sc.id).length;
                return (
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
                      <div className="flex items-center gap-1.5">
                        {sceneCommentCount > 0 && (
                          <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[10px]">
                            💬 {sceneCommentCount}
                          </span>
                        )}
                        <span>{Math.round((sc.durationInFrames || 150) / 30)}s</span>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{sc.title}</h4>
                    <span className="text-[10px] font-mono text-amber-700 block mt-0.5">
                      {sc.type}
                    </span>
                  </div>
                );
              })}
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

              {/* KHUNG GÓP Ý DÀNH RIÊNG CHO PHÂN CẢNH (Scene-Level Comments - Bug 2.1) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-slate-900 text-xs">
                      Góp Ý Phân Cảnh Này ({sceneComments.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Cảnh: {selectedScene.title}
                  </span>
                </div>

                {/* Danh sách góp ý của phân cảnh */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {sceneComments.length === 0 ? (
                    <p className="text-center text-slate-400 py-3 text-[11px] italic">
                      Chưa có góp ý nào cho phân cảnh này.
                    </p>
                  ) : (
                    sceneComments.map((cm) => (
                      <CommentCard
                        key={cm.id}
                        comment={cm}
                        onResolve={handleResolveComment}
                        onReopen={handleReopenComment}
                        onDelete={handleDeleteComment}
                        onReply={handleSendReply}
                        replyingToId={replyingToId}
                        setReplyingToId={setReplyingToId}
                        replyInput={replyInput}
                        setReplyInput={setReplyInput}
                        submittingReply={submittingReply}
                      />
                    ))
                  )}
                </div>

                {/* Form thêm góp ý cho phân cảnh */}
                <form
                  onSubmit={handleAddSceneComment}
                  className="p-3 bg-white border border-amber-200 rounded-xl space-y-2 shadow-2xs"
                >
                  <label className="font-bold text-amber-900 block text-[11px]">
                    Thêm nhận xét cho phân cảnh {selectedScene.title}:
                  </label>
                  <textarea
                    rows={2}
                    value={sceneCommentInput}
                    onChange={(e) => setSceneCommentInput(e.target.value)}
                    placeholder="Nhập nội dung cần tác giả sửa ở cảnh này..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingSceneComment || !sceneCommentInput.trim()}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      {submittingSceneComment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Gửi Nhận Xét Cảnh</span>
                    </button>
                  </div>
                </form>
              </div>
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

                {qaError && <p role="alert" className="text-rose-700">{qaError}</p>}
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
                {decisionPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{decisionPending ? 'Đang lưu quyết định…' : 'Phê Duyệt Kịch Bản (Chuyển Bước 3)'}</span>
              </button>
            </div>
          </aside>
        </div>
      ) : (
        /* ========================================================================= */
        /* CHẾ ĐỘ 2: THẨM ĐỊNH VIDEO THÀNH PHẨM (VIDEO QA) */
        /* ========================================================================= */
        <div className="studio-columns flex-1 min-h-0 flex overflow-hidden">
          {/* Cột Trái: Remotion Player trực tiếp để Reviewer thẩm định từng frame hoặc video MP4 */}
          <main className="flex-1 min-h-0 bg-slate-900 p-4 md:p-6 flex flex-col justify-start overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-3xl mx-auto space-y-4 pb-8">
              {/* Header switch between MP4 and Web Player if MP4 is ready */}
              {script.videoUrl && (
                <div className="flex items-center justify-between bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoPlayerSource('mp4')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        videoPlayerSource === 'mp4'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Video MP4 Kết Xuất</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoPlayerSource('web')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        videoPlayerSource === 'web'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Web Player Trực Tiếp (Bản Dựng Producer)</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                    MP4 Full HD sẵn sàng
                  </span>
                </div>
              )}

              {compositionError && (
                <div role="alert" className="rounded-xl border border-amber-600 bg-amber-950/40 p-4 text-sm text-amber-100 space-y-3">
                  <p>{compositionError}</p>
                  <button type="button" onClick={() => void fetchComposition()} disabled={loadingComposition}
                    className="rounded-lg border border-amber-500 px-3 py-1.5 disabled:opacity-50">
                    Tải lại bản dựng
                  </button>
                </div>
              )}
              {loadingComposition ? (
                <div className="aspect-video bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 gap-2 border border-slate-700">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  <span className="text-sm">Đang tải bản dựng Producer...</span>
                </div>
              ) : script.videoUrl && videoPlayerSource === 'mp4' ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700">
                  <video
                    src={script.videoUrl}
                    controls
                    onTimeUpdate={(e) => setCurrentSec(e.currentTarget.currentTime)}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : reviewScript ? (
                <RemotionPlayerWrapper
                  script={reviewScript}
                  seekTimestampSec={seekTimestampSec}
                  onFrameUpdate={(_f, s) => setCurrentSec(s)}
                />
              ) : !compositionError ? (
                <p role="status" className="text-sm text-slate-400">Đang chuẩn bị bản dựng Producer…</p>
              ) : null}
            </div>
          </main>

          {/* Cột Phải: Ghi chú phản biện theo mốc thời gian */}
          <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs h-full min-h-0 shrink-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-slate-900">
                    Ghi Chú Mốc Thời Gian ({timelineComments.length})
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
                {timelineComments.length === 0 ? (
                  <p className="text-center text-slate-400 py-4 text-[11px]">Chưa có nhận xét nào được ghim trên video.</p>
                ) : (
                  timelineComments.map((cm) => (
                    <CommentCard
                      key={cm.id}
                      comment={cm}
                      onResolve={handleResolveComment}
                      onReopen={handleReopenComment}
                      onDelete={handleDeleteComment}
                      onReply={handleSendReply}
                      onSeek={setSeekTimestampSec}
                      replyingToId={replyingToId}
                      setReplyingToId={setReplyingToId}
                      replyInput={replyInput}
                      setReplyInput={setReplyInput}
                      submittingReply={submittingReply}
                    />
                  ))
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
                  disabled={isAddingComment}
                  onChange={(e) => setNewCommentInput(e.target.value)}
                  placeholder="Nhập góp ý sư phạm hoặc đồ họa..."
                  className="w-full p-2 border border-purple-300 rounded-lg text-xs bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isAddingComment || !newCommentInput.trim()}
                  aria-busy={isAddingComment}
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingComment ? 'Đang gửi nhận xét…' : 'Ghim Vào Clip'}</span>
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
          <div ref={queueDialog} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
              {queueError && <div role="alert" className="mb-3 text-rose-700">{queueError} <button onClick={() => void handleOpenQueue()} disabled={loadingQueue} className="underline">Tải lại hàng đợi</button></div>}
              {loadingQueue ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                  Đang tải danh sách chờ duyệt...
                </div>
              ) : queueItems.length === 0 && !queueError ? (
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
          <div ref={rejectDialog} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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
                disabled={decisionPending}
                aria-label="Đóng yêu cầu chỉnh sửa"
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
                  disabled={decisionPending}
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
