import { useActionGuard } from '../../../hooks/useActionGuard';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PlusCircle,
  GitCompare,
  Send,
  ChevronUp,
  ChevronDown,
  Trash2,
  Library,
  Mic,
  Sparkles,
  Split,
  BarChart2,
  Tags,
  ShieldAlert,
  GripVertical,
  Volume2,
  Wand2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  Reply,
  Loader2,
} from 'lucide-react';
import { STEMScript, SceneData, FeedbackComment } from '../../../types/stem';
import {
  UserRole,
  projectService,
  reviewService,
  narrationService,
  groupCommentsWithReplies,
} from '../../../services';
import { sceneSaveQueue } from '../../../services/sceneSaveQueue';
import { renderLatexToString } from '../../../utils/latex';
import { MetaphorPanel } from './MetaphorPanel';
import { ComposedBlocksEditor } from './ComposedBlocksEditor';

interface WriterStudioProps {
  script: STEMScript;
  setScript: React.Dispatch<React.SetStateAction<STEMScript>>;
  selectedScene: SceneData;
  setActiveSceneId: (id: string) => void;
  updateSceneProperty: (updater: (s: any) => any) => void;
  handleAddNewScene: (type?: SceneData['type']) => void;
  handleDeleteScene: (sceneId: string) => void;
  handleMoveScene: (index: number, direction: 'up' | 'down') => void;
  handleReorderScenes: (fromIndex: number, toIndex: number) => void;
  onOpenCreateProjectModal: () => void;
  onOpenVersionDiffModal: () => void;
  onOpenTemplateCatalog: () => void;
  onRoleChange: (role: UserRole) => void;
  onSetReviewerMode: (mode: 'script' | 'video') => void;
  aiAnalysisResult: {
    type: 'resegment' | 'grade' | 'extract' | 'terms' | null;
    title: string;
    details: string[];
    requestId?: string;
    decision?: string;
  };
  onAiDecision: (decision: 'ACCEPTED' | 'IGNORED') => Promise<void>;
  handleTriggerAiAction: (action: 'resegment' | 'grade' | 'extract' | 'terms') => void;
  isAiRunning?: boolean;
  showToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const WriterStudio: React.FC<WriterStudioProps> = ({
  script,
  setScript,
  selectedScene,
  setActiveSceneId,
  updateSceneProperty,
  handleAddNewScene,
  handleDeleteScene,
  handleMoveScene,
  handleReorderScenes,
  onOpenCreateProjectModal,
  onOpenVersionDiffModal,
  onOpenTemplateCatalog,
  onRoleChange,
  onSetReviewerMode,
  aiAnalysisResult,
  onAiDecision,
  handleTriggerAiAction,
  isAiRunning = false,
  showToast,
}) => {
  const [draggedSceneIdx, setDraggedSceneIdx] = useState<number | null>(null);
  const [dragOverSceneIdx, setDragOverSceneIdx] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mutations = useActionGuard();
  const activeProject = React.useRef(script.id);
  activeProject.current = script.id;
  const [rejectionNote, setRejectionNote] = useState<string | null>(script.reviewNote || null);
  const [rejectionVersion, setRejectionVersion] = useState<number | null>(null);
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const speechRequest = React.useRef(0);
  const speechActive = React.useRef(false);
  const speechUrl = React.useRef<string | null>(null);
  const stopSpeech = useCallback(() => {
    speechRequest.current++;
    speechActive.current = false;
    if (currentAudioRef.current) {
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (speechUrl.current) URL.revokeObjectURL(speechUrl.current);
    speechUrl.current = null;
    window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => {
    stopSpeech(); setIsSpeaking(false);
    return stopSpeech;
  }, [script.id, selectedScene?.id, stopSpeech]);

  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [commentsError, setCommentsError] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const cms = await reviewService.getComments(script.id);
      if (activeProject.current !== script.id) return;
      setComments(cms);
      setCommentsError('');
    } catch (error: any) {
      if (activeProject.current === script.id) setCommentsError(error.message || 'Không tải được góp ý của Reviewer.');
    }
  }, [script.id]);

  useEffect(() => {
    setComments([]);
    setCommentsError('');
    void fetchComments();
  }, [fetchComments]);

  const groupedComments = useMemo(() => {
    return groupCommentsWithReplies(comments);
  }, [comments]);

  const sceneComments = useMemo(() => {
    return groupedComments.filter((c) => c.sceneId === selectedScene?.id);
  }, [groupedComments, selectedScene?.id]);

  const resolveNote = mutations.wrap(async (id: string) => {
    const projectId = script.id;
    try {
      const saved = await reviewService.resolveComment(projectId, id);
      if (activeProject.current === projectId) setComments(rows => rows.map(row => row.id === id ? { ...row, ...saved } : row));
    } catch (error: any) { showToast(error.message || 'Chưa giải quyết được góp ý.', 'warn'); }
  });

  const handleSendReply = mutations.wrap(async (commentId: string) => {
    const projectId = script.id;
    if (!replyInput.trim()) return;
    setSubmittingReply(true);
    try {
      const replied = await reviewService.replyComment(commentId, replyInput.trim());
      if (activeProject.current !== projectId) return;
      setComments((prev) => [...prev, replied]);
      setReplyInput('');
      setReplyingToId(null);
      showToast('Đã gửi phản hồi cho Reviewer.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không gửi được phản hồi.', 'warn');
    } finally {
      setSubmittingReply(false);
    }
  });

  useEffect(() => {
    setRejectionNote(script.reviewNote || null);
    setRejectionVersion(null);
    if (script.scriptStatus === 'CHANGE_REQUESTED') {
      if (script.reviewNote) {
        setRejectionNote(script.reviewNote);
      }
      // Query review history first (has both script and clip rejection reasons)
      reviewService
        .getReviewHistory(script.id)
        .then((history) => {
          if (activeProject.current !== script.id) return;
          if (Array.isArray(history) && history.length > 0) {
            const rejectEntry = history.find((h) => h.action === 'REJECT');
            if (rejectEntry?.note) {
              setRejectionNote(rejectEntry.note);
              if (rejectEntry.scriptVersionNo) {
                setRejectionVersion(rejectEntry.scriptVersionNo);
              }
              return;
            }
          }
          // Fallback to version history
          return projectService.getVersions(script.id).then((versions) => {
            if (activeProject.current !== script.id) return;
            if (Array.isArray(versions) && versions.length > 0) {
              const verWithNote =
                versions.find((v: any) => v.status === 'CHANGE_REQUESTED' && v.reviewNote) ||
                versions.find((v: any) => v.reviewNote) ||
                versions[0];
              if (verWithNote?.reviewNote) {
                setRejectionNote(verWithNote.reviewNote);
                setRejectionVersion(verWithNote.versionNo);
              }
            }
          });
        })
        .catch(() => {});
    }
  }, [script.id, script.scriptStatus, script.reviewNote]);

  const fallbackSpeechSynthesis = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Trình duyệt chưa hỗ trợ nghe thử lời thoại này.', 'warn');
      setIsSpeaking(false);
      speechActive.current = false;
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    const request = speechRequest.current;
    const finish = () => { if (request === speechRequest.current) { speechActive.current = false; setIsSpeaking(false); } };
    utterance.onend = finish;
    utterance.onerror = finish;
    setIsSpeaking(true);
    showToast('Nghe thử bằng giọng của trình duyệt; giọng video được tạo khi kết xuất.', 'info');
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayTts = async (text: string) => {
    if (!text?.trim()) {
      showToast('Chưa có lời thoại để nghe thử.', 'warn');
      return;
    }
    if (speechActive.current) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    speechActive.current = true;
    const request = ++speechRequest.current;
    setIsSpeaking(true);
    try {
      const audioUrl = await narrationService.getTtsPreview(script.id, text, selectedScene?.id);
      if (request !== speechRequest.current) { URL.revokeObjectURL(audioUrl); return; }
      speechUrl.current = audioUrl;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.onended = () => {
        if (request !== speechRequest.current) return;
        stopSpeech();
        setIsSpeaking(false);
      };
      audio.onerror = () => {
        if (request !== speechRequest.current) return;
        URL.revokeObjectURL(audioUrl); speechUrl.current = null;
        currentAudioRef.current = null;
        fallbackSpeechSynthesis(text);
      };
      await audio.play();
      if (request !== speechRequest.current) return;
      showToast('Đang phát giọng đọc TTS trực tiếp từ máy chủ...', 'info');
    } catch {
      if (request !== speechRequest.current) return;
      if (speechUrl.current) URL.revokeObjectURL(speechUrl.current);
      speechUrl.current = null;
      fallbackSpeechSynthesis(text);
    }
  };

  // Google Vids: Smart Contextual Template Suggestion
  const getContextualTemplateSuggestion = (narration: string, currentType: SceneData['type']) => {
    if (!narration || narration.trim().length < 8) return null;
    const lower = narration.toLowerCase();

    if (
      currentType !== 'MATH_FORMULA' &&
      /(công thức|đạo hàm|tích phân|hàm số|phương trình|toán học|vi phân|số mũ|logarit|biểu thức)/i.test(lower)
    ) {
      return {
        type: 'MATH_FORMULA' as const,
        title: 'Công Thức Toán Học (KaTeX)',
        keyword: 'công thức / phương trình',
        defaultProps: {
          latex: 'f(x) = \\int x \\, dx',
          steps: [{ label: 'Bước 1', latexSnippet: 'f(x)', explanation: 'Khai triển biểu thức' }],
        },
      };
    }

    if (
      currentType !== 'CHEMICAL_REACTION' &&
      /(phản ứng|hóa học|nguyên tử|phân tử|dung dịch|oxi hóa|axit|bazơ|kết tủa|chất tan|phương trình hóa)/i.test(lower)
    ) {
      return {
        type: 'CHEMICAL_REACTION' as const,
        title: 'Phản Ứng Hóa Học Thực Nghiệm',
        keyword: 'phản ứng / hóa học',
        defaultProps: {
          equation: '2H_2 + O_2 -> 2H_2O',
          reactants: ['H_2', 'O_2'],
          products: ['H_2O'],
          condition: 't°',
          observation: 'Phản ứng tỏa nhiều nhiệt',
        },
      };
    }

    if (
      currentType !== 'ALGORITHM_WALKTHROUGH' &&
      /(thuật toán|mã nguồn|lập trình|code|vòng lặp|mảng|tìm kiếm|nhị phân|sắp xếp|python|binary search)/i.test(lower)
    ) {
      return {
        type: 'ALGORITHM_WALKTHROUGH' as const,
        title: 'Mô Phỏng Thuật Toán Lập Trình',
        keyword: 'thuật toán / lập trình',
        defaultProps: {
          language: 'python',
          codeSnippet: 'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1',
          steps: [{ line: 1, explanation: 'Khởi tạo con trỏ tìm kiếm' }],
        },
      };
    }

    if (
      currentType !== 'DATA_CHART' &&
      /(biểu đồ|thống kê|số liệu|tỷ lệ phần trăm|doanh thu|đo lường|tăng trưởng|cột mốc)/i.test(lower)
    ) {
      return {
        type: 'DATA_CHART' as const,
        title: 'Biểu Đồ Thống Kê Dữ Liệu',
        keyword: 'biểu đồ / thống kê',
        defaultProps: {
          chartType: 'bar',
          xAxisLabel: 'Trục hoành',
          yAxisLabel: 'Trục tung',
          dataPoints: [{ label: 'Nhóm A', value: 80 }, { label: 'Nhóm B', value: 45 }],
        },
      };
    }

    if (
      currentType !== 'COMPARISON_SPLIT' &&
      /(so sánh|đối chiếu|khác nhau|phân biệt|ưu điểm|nhược điểm|hai mặt)/i.test(lower)
    ) {
      return {
        type: 'COMPARISON_SPLIT' as const,
        title: 'So Sánh Đối Chiếu Hai Khái Niệm',
        keyword: 'so sánh / đối chiếu',
        defaultProps: {
          topicA: 'Khái niệm A',
          topicB: 'Khái niệm B',
          conclusion: 'Kết luận so sánh',
        },
      };
    }

    if (
      currentType !== 'PROCESS_TIMELINE' &&
      /(quy trình|tiến trình|chu trình|giai đoạn|bước 1|các bước|vòng đời)/i.test(lower)
    ) {
      return {
        type: 'PROCESS_TIMELINE' as const,
        title: 'Tiến Trình Chu Trình Khoa Học',
        keyword: 'quy trình / chu trình',
        defaultProps: {
          processTitle: 'Chu trình khoa học',
          stages: [{ name: 'Giai đoạn 1', desc: 'Bắt đầu' }, { name: 'Giai đoạn 2', desc: 'Phát triển' }],
        },
      };
    }

    return null;
  };

  const handleApplySuggestedTemplate = (suggestion: any) => {
    updateSceneProperty((s) => ({
      ...s,
      type: suggestion.type,
      ...suggestion.defaultProps,
    }));
    showToast(`✨ Đã đổi phân cảnh sang mẫu [${suggestion.title}] theo phong cách Google Vids!`, 'success');
  };

  // Google Vids: Auto-fit duration for current scene
  const handleAutoFitDuration = (narrationText: string) => {
    const words = (narrationText || '').trim().split(/\s+/).filter(Boolean).length;
    const estSeconds = words > 0 ? Math.max(4, Math.ceil(words / 2.3) + 1) : 5;
    updateSceneProperty((s) => ({
      ...s,
      durationInFrames: estSeconds * 30,
    }));
    showToast(`Đã đặt thời lượng ước tính ${estSeconds}s theo số từ. Dùng Khớp Thời Lượng Giọng Đọc để đo bằng TTS.`, 'info');
  };

  const [isSyncingDurations, setIsSyncingDurations] = useState(false);

  const handleSyncDurationsWithBackend = mutations.wrap(async () => {
    if (isSyncingDurations) return;
    const projectId = script.id;
    setIsSyncingDurations(true);
    try {
      await sceneSaveQueue.saveNow(script.id, script.scenes);
      const res = await narrationService.syncDurations(script.id);
      if (activeProject.current !== projectId) return;
      if (res && Array.isArray(res.scenes) && res.scenes.length > 0) {
        const durationMap = new Map(res.scenes.map((s) => [s.id, s.durationInFrames]));
        setScript((prev) => {
          if (prev.id !== projectId) return prev;
          const updatedScenes = prev.scenes.map((sc) => {
            const frames = durationMap.get(sc.id);
            return frames ? { ...sc, durationInFrames: frames } : sc;
          });
          const totalSec = res.totalDurationSeconds || Math.round(
            updatedScenes.reduce((acc, sc) => acc + (sc.durationInFrames || 150), 0) / 30
          );
          return {
            ...prev,
            scenes: updatedScenes,
            totalDurationSeconds: totalSec,
          };
        });
        showToast(`⚡ Đã đồng bộ thời lượng chuẩn theo giọng đọc Whisper (${res.totalDurationSeconds}s)!`, 'success');
      } else {
        throw new Error('Máy chủ chưa trả về thời lượng hợp lệ. Thời lượng hiện tại được giữ nguyên.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Chưa đồng bộ được giọng đọc. Thời lượng hiện tại được giữ nguyên.', 'warn');
    } finally {
      setIsSyncingDurations(false);
    }
  });

  // Google Vids: Batch Auto-Fit All Scenes
  const handleBatchAutoFitAllScenes = () => {
    setScript((prev) => {
      const updatedScenes = prev.scenes.map((sc) => {
        const words = (sc.narration || '').trim().split(/\s+/).filter(Boolean).length;
        const estSeconds = words > 0 ? Math.max(4, Math.ceil(words / 2.3) + 1) : 5;
        return {
          ...sc,
          durationInFrames: estSeconds * 30,
        };
      });
      const totalSec = Math.round(updatedScenes.reduce((acc, sc) => acc + (sc.durationInFrames || 150), 0) / 30);
      return {
        ...prev,
        scenes: updatedScenes,
        totalDurationSeconds: totalSec,
      };
    });
    showToast(`Đã ước tính thời lượng ${script.scenes.length} phân cảnh theo số từ; chưa đo bằng TTS.`, 'info');
  };

  // Real-time pacing calculation
  const wordsCount = (selectedScene.narration || '').trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadSec = wordsCount > 0 ? (wordsCount / 2.5).toFixed(1) : '0';
  const currentSceneSec = ((selectedScene.durationInFrames || 150) / 30).toFixed(1);
  const recommendedSec = wordsCount > 0 ? Math.max(4, Math.ceil(wordsCount / 2.3) + 1) : 5;
  const isPacingTight = wordsCount > 0 && Number(currentSceneSec) < Number(estimatedReadSec) + 0.5;

  const suggestedTemplate = getContextualTemplateSuggestion(selectedScene.narration || '', selectedScene.type);
  const canEdit = ['DRAFT', 'CHANGE_REQUESTED'].includes(script.scriptStatus)
    && !['IN_QA', 'APPROVED', 'PUBLISHED'].includes(script.videoStatus || '');
  return (
    <section aria-busy={isSubmitting} className="studio-workspace flex-1 min-h-0 flex flex-col overflow-hidden">
      <fieldset disabled={isSubmitting || isSyncingDurations} className="contents">
      {!canEdit && <p role="status" className="bg-amber-50 p-3 text-sm text-amber-900">Kịch bản đã gửi duyệt hoặc được khóa xuất bản. Bạn vẫn có thể xem nội dung và góp ý; chỉ chỉnh sửa sau khi Reviewer yêu cầu sửa lại.</p>}
      {commentsError && <div role="alert" className="bg-amber-50 p-3 text-sm"><p>{commentsError}</p><button onClick={() => void fetchComments()} className="underline">Tải lại góp ý</button></div>}
      {/* Top Bar Writer */}
      <div className="studio-toolbar bg-white border-b border-slate-200 px-6 py-2.5 flex justify-between items-center text-xs shrink-0 z-10 shadow-2xs">
        <div className="flex items-center space-x-3">
          <span className="px-2 py-0.5 rounded bg-blue-50 text-brand-700 font-bold border border-blue-200">
            WRITER SCRIPT STUDIO
          </span>
          <span className="text-slate-300">/</span>
          <h1 className="text-sm font-bold text-slate-900">{script.title}</h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-brand-700 font-bold">
            {script.gradeLevel}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            Trạng thái: <b>{script.scriptStatus}</b>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={onOpenCreateProjectModal}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-1 shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
            <span>+ Đề Tài Mới</span>
          </button>
          <button
            onClick={onOpenVersionDiffModal}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-1 shadow-2xs"
          >
            <GitCompare className="w-3.5 h-3.5 text-brand-600" />
            <span>Lịch Sử (Diff)</span>
          </button>
          {/* Nút gửi sang Reviewer (Bước 1 -> Bước 2) */}
          <button
            onClick={mutations.wrap(async () => {
              if (isSubmitting) return;
              setIsSubmitting(true);
              try {
                await sceneSaveQueue.saveNow(script.id, script.scenes);
                await projectService.submitForReview(script.id);
                const fresh = await projectService.getProjectById(script.id);
                if (activeProject.current !== fresh.id) return;
                setScript(fresh);
                setActiveSceneId(fresh.scenes[0]?.id || '');
                showToast('Kịch bản đã được lưu và gửi vào hàng đợi thẩm định.', 'success');
                onSetReviewerMode('script');
              } catch (error: any) {
                showToast(error.message || 'Không gửi được kịch bản. Vui lòng thử lại.', 'warn');
              } finally {
                setIsSubmitting(false);
              }
            })}
            disabled={isSubmitting || !['DRAFT', 'CHANGE_REQUESTED'].includes(script.scriptStatus)}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Đang lưu và gửi duyệt…' : 'Gửi Kịch Bản Cho Reviewer Thẩm Định (Bước 1 ➔ 2)'}</span>
          </button>
        </div>
      </div>

      {/* Banner Cảnh Báo Lý Do Bị Reviewer Yêu Cầu Chỉnh Sửa */}
      {script.scriptStatus === 'CHANGE_REQUESTED' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3.5 text-amber-900 shrink-0 z-10 animate-in fade-in">
          <div className="p-1 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex-1 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">
                Yêu cầu chỉnh sửa từ Reviewer {rejectionVersion ? `(Bản v${rejectionVersion})` : ''}:
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-200 text-amber-900 uppercase tracking-wider">
                Cần sửa đổi
              </span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-lg border border-amber-300/60 text-slate-800 font-medium leading-relaxed shadow-2xs">
              {rejectionNote ? (
                <span>&ldquo;{rejectionNote}&rdquo;</span>
              ) : (
                <span className="text-slate-500 italic">
                  Reviewer đã trả lại kịch bản yêu cầu chỉnh sửa. Vui lòng rà soát lại các phân cảnh theo góp ý và bấm gửi lại sau khi hoàn thiện.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="studio-columns flex-1 min-h-0 flex overflow-hidden">
        {/* Cột 1: Cấu trúc phân cảnh (Cho phép Thêm / Xóa / Đổi thứ tự) */}
        <aside className="w-72 bg-white border-r border-slate-200 p-4 flex flex-col h-full min-h-0 overflow-hidden shrink-0">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">
              Phân Cảnh ({script.scenes.length})
            </span>
            <span className="font-semibold text-brand-600 font-mono">
              {script.totalDurationSeconds}s
            </span>
          </div>

          {/* Google Vids: Batch Auto-Fit All Scenes with Backend Sync */}
          <button
            onClick={handleSyncDurationsWithBackend}
            disabled={isSyncingDurations || !canEdit}
            className="w-full mb-3 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Đồng bộ thời lượng tất cả phân cảnh theo giọng đọc TTS chuẩn Whisper (POST /scripts/{id}/sync-durations)"
          >
            <Clock className={`w-3.5 h-3.5 text-indigo-600 ${isSyncingDurations ? 'animate-spin' : ''}`} />
            <span>{isSyncingDurations ? 'Đang Khớp Thời Lượng...' : '⚡ Khớp Thời Lượng Giọng Đọc'}</span>
          </button>

          {/* Danh sách cảnh */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {script.scenes.map((sc, i) => {
              const isDragging = draggedSceneIdx === i;
              const isOver = dragOverSceneIdx === i && draggedSceneIdx !== i;
              const isSelected = sc.id === selectedScene.id;

              return (
                <div
                  key={sc.id}
                  draggable={canEdit}
                  onDragStart={(e) => {
                    setDraggedSceneIdx(i);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverSceneIdx !== i) setDragOverSceneIdx(i);
                  }}
                  onDragEnd={() => {
                    setDraggedSceneIdx(null);
                    setDragOverSceneIdx(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (canEdit && draggedSceneIdx !== null && draggedSceneIdx !== i) {
                      handleReorderScenes(draggedSceneIdx, i);
                    }
                    setDraggedSceneIdx(null);
                    setDragOverSceneIdx(null);
                  }}
                  onClick={() => setActiveSceneId(sc.id)}
                  className={`p-3 rounded-xl border cursor-pointer text-xs space-y-1.5 transition-all select-none ${
                    isDragging
                      ? 'opacity-40 border-dashed border-brand-400 scale-[0.98]'
                      : isOver
                      ? 'bg-brand-50 border-brand-500 shadow-md ring-2 ring-brand-400 scale-[1.01]'
                      : isSelected
                      ? 'bg-blue-50 border-brand-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors p-0.5"
                        title="Kéo thả chuột để thay đổi thứ tự phân cảnh"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-800">
                        0{i + 1}
                      </span>
                      <span className="font-mono text-slate-400">
                        {Math.round((sc.durationInFrames || 150) / 30)}s
                      </span>
                      {comments.some((c) => c.sceneId === sc.id) && (
                        <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[10px]">
                          💬 {comments.filter((c) => c.sceneId === sc.id).length}
                        </span>
                      )}
                    </div>
                    <fieldset disabled={!canEdit} className="flex items-center gap-1">
                      {i > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveScene(i, 'up');
                          }}
                          className="text-slate-400 hover:text-brand-600 p-0.5"
                          title="Di chuyển lên"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                      )}
                      {i < script.scenes.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveScene(i, 'down');
                          }}
                          className="text-slate-400 hover:text-brand-600 p-0.5"
                          title="Di chuyển xuống"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(sc.id);
                        }}
                        className="text-slate-300 hover:text-rose-600 p-0.5"
                        title="Xóa cảnh"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </fieldset>
                  </div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{sc.title}</p>
                  <span className="text-[10px] font-mono text-brand-600 block">{sc.type}</span>
                </div>
              );
            })}
          </div>

          {/* Nút Thêm Cảnh Mới Nhanh */}
          <fieldset disabled={!canEdit} className="pt-3 border-t border-slate-100 space-y-1.5">
            <button
              onClick={onOpenTemplateCatalog}
              className="w-full py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg border border-brand-200 flex items-center justify-center gap-1.5 shadow-2xs text-[11px]"
            >
              <Library className="w-3.5 h-3.5 text-brand-600" />
              <span>+ Kho Template STEM (11)</span>
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => handleAddNewScene('MATH_FORMULA')}
                className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-700 text-center"
                title="Thêm công thức Toán"
              >
                + Toán
              </button>
              <button
                onClick={() => handleAddNewScene('CHEMICAL_REACTION')}
                className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-rose-700 text-center"
                title="Thêm phản ứng Hóa"
              >
                + Hóa
              </button>
              <button
                onClick={() => handleAddNewScene('COMPARISON_SPLIT')}
                className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-amber-700 text-center"
                title="Thêm so sánh"
              >
                + So sánh
              </button>
              <button
                onClick={() => handleAddNewScene('COMPOSED')}
                className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-fuchsia-700 text-center"
                title="Thêm cảnh tự do, lắp ghép từ các khối"
              >
                + Tự do
              </button>
              <button
                onClick={() => handleAddNewScene('PROCESS_TIMELINE')}
                className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-emerald-700 text-center"
                title="Thêm chu trình"
              >
                + Chu trình
              </button>
            </div>
          </fieldset>
        </aside>

        {/* Cột 2: KHÔNG GIAN SOẠN THẢO KỊCH BẢN CHI TIẾT */}
        <main className="flex-1 min-h-0 bg-slate-50 p-6 overflow-y-auto custom-scrollbar flex justify-center">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col space-y-5">
            {/* Góp Ý Của Reviewer Dành Cho Phân Cảnh Này (Bug 2.1 & Bug 2.2) */}
            {sceneComments.length > 0 && (
              <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2.5 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-amber-200/70 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    <span>Góp ý từ Reviewer cho cảnh này ({sceneComments.length}):</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {sceneComments.map((cm) => (
                    <div key={cm.id} className="p-3 rounded-lg bg-white border border-amber-200 text-slate-800 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">
                          {cm.author || 'Reviewer'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          cm.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {cm.status === 'RESOLVED' ? 'Đã giải quyết' : 'Cần sửa đổi'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{cm.content}</p>

                      {/* Nested Replies */}
                      {cm.replies && cm.replies.length > 0 && (
                        <div className="ml-3 pl-2.5 border-l-2 border-amber-300 space-y-1 pt-1">
                          {cm.replies.map((reply) => (
                            <div key={reply.id} className="text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                              <span className="font-bold text-slate-700">{reply.author || 'Writer'}: </span>
                              <span className="text-slate-600">{reply.content}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {cm.status !== 'RESOLVED' && <button type="button" disabled={mutations.pending} className="text-emerald-700 underline" onClick={() => void resolveNote(cm.id)}>Đánh dấu đã sửa</button>}
                      {/* Reply button */}
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (replyingToId === cm.id) {
                              setReplyingToId(null);
                            } else {
                              setReplyingToId(cm.id);
                              setReplyInput('');
                            }
                          }}
                          className="text-[10px] text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Reply className="w-3 h-3" /> Trả lời Reviewer
                        </button>
                      </div>

                      {replyingToId === cm.id && (
                        <div className="pt-1 space-y-1.5">
                          <textarea
                            rows={2}
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            placeholder="Nhập nội dung phản hồi cho Reviewer..."
                            className="w-full p-2 text-xs border border-amber-300 rounded-lg bg-amber-50/30 focus:bg-white focus:outline-none"
                            autoFocus
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(null);
                                setReplyInput('');
                              }}
                              className="px-2.5 py-1 text-[10px] text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              disabled={submittingReply || !replyInput.trim()}
                              onClick={() => void handleSendReply(cm.id)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {submittingReply && <Loader2 className="w-3 h-3 animate-spin" />}
                              <span>Gửi Phản Hồi</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Tiêu Đề Cảnh (Cho Phép Writer Sửa Trực Tiếp) */}
            <fieldset disabled={!canEdit} className="contents">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Tiêu Đề Phân Cảnh (Scene Title):</span>
                <span className="font-mono text-[10px] text-brand-600 font-bold">
                  {selectedScene.type}
                </span>
              </label>
              <input
                type="text"
                value={selectedScene.title}
                onChange={(e) => updateSceneProperty((s) => ({ ...s, title: e.target.value }))}
                placeholder="VD: Khảo sát định luật bảo toàn cơ năng..."
                className="w-full text-sm font-bold text-slate-900 p-2.5 border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none shadow-2xs"
              />
            </div>

            {/* 2. Lời Thoại Thuyết Minh (TTS Audio Script) với Đếm Từ */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5 text-brand-600" />
                  <span>Lời Thoại Thuyết Minh (Giọng Đọc AI Đọc):</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {(selectedScene.narration || '').trim().split(/\s+/).filter(Boolean).length} từ (~
                  {Math.round(
                    (selectedScene.narration || '').trim().split(/\s+/).filter(Boolean).length / 2.2
                  )}
                  s đọc)
                </span>
              </div>

              <textarea
                rows={5}
                value={selectedScene.narration}
                onChange={(e) => {
                  const val = e.target.value;
                  const words = val.trim().split(/\s+/).filter(Boolean).length;
                  const estSeconds = words > 0 ? Math.max(3, Math.ceil(words / 2.3) + 1) : 5;
                  updateSceneProperty((s) => ({
                    ...s,
                    narration: val,
                    durationInFrames: estSeconds * 30,
                  }));
                }}
                placeholder="Nhập lời giảng sư phạm để AI đọc thuyết minh cho phân cảnh này..."
                className="w-full text-sm text-slate-800 p-3.5 border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none leading-relaxed shadow-2xs"
              />

              {/* AI Quick Helpers cho Lời Thoại */}
              <div className="flex gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => {
                    const newText = `${selectedScene.narration || ''} Các em hãy quan sát kỹ hiện tượng trên màn hình để rút ra kết luận khoa học quan trọng nhất.`;
                    const words = newText.trim().split(/\s+/).filter(Boolean).length;
                    const estSeconds = Math.max(3, Math.ceil(words / 2.3) + 1);
                    updateSceneProperty((s) => ({
                      ...s,
                      narration: newText,
                      durationInFrames: estSeconds * 30,
                    }));
                    showToast('Đã thêm câu dẫn mẫu vào bản nháp; hãy kiểm tra nội dung trước khi gửi duyệt.', 'info');
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-brand-700 hover:bg-blue-100 font-semibold border border-blue-200 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-brand-600" />
                  <span>Thêm Câu Dẫn Mẫu</span>
                </button>
                <button
                  onClick={() => {
                    const newText = (selectedScene.narration || '').replace(/rất là|hoàn toàn là/g, '');
                    const words = newText.trim().split(/\s+/).filter(Boolean).length;
                    const estSeconds = Math.max(3, Math.ceil(words / 2.3) + 1);
                    updateSceneProperty((s) => ({
                      ...s,
                      narration: newText,
                      durationInFrames: estSeconds * 30,
                    }));
                    showToast('Đã bỏ cụm từ thừa theo quy tắc; hãy kiểm tra lại câu văn.', 'info');
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 flex items-center gap-1"
                >
                  <span>Bỏ Cụm Từ Thừa</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePlayTts(selectedScene.narration || '')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border flex items-center gap-1.5 transition-all ${
                    isSpeaking
                      ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
                  }`}
                  title="Nghe máy tính phát âm thử lời thoại bằng tiếng Việt"
                >
                  <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isSpeaking ? 'Dừng Đọc' : '🔊 Nghe Thử Giọng Đọc'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const words = (selectedScene.narration || '').trim().split(/\s+/).filter(Boolean).length;
                    const estSeconds = words > 0 ? Math.max(3, Math.ceil(words / 2.3) + 1) : 5;
                    updateSceneProperty((s) => ({
                      ...s,
                      durationInFrames: estSeconds * 30,
                    }));
                    showToast(`Đã đặt thời lượng ước tính ${estSeconds}s theo số từ; chưa đo bằng TTS.`, 'info');
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold border border-amber-200 flex items-center gap-1"
                  title="Tự động tính toán lại thời lượng phân cảnh theo độ dài lời thoại"
                >
                  <span>Ước Tính Thời Lượng</span>
                </button>
              </div>

              {/* Google Vids: Real-time Pacing Status & Contextual Template Suggestion */}
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
                {/* Pacing Status Bar */}
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    isPacingTight
                      ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isPacingTight ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold">
                        {isPacingTight ? 'Cảnh có thể quá ngắn so với lời thoại' : 'Thời lượng phù hợp với ước tính theo số từ'}
                      </span>
                      <span className="block text-slate-500 text-[10px] mt-0.5">
                        Ước tính đọc: ~{estimatedReadSec}s | Thời lượng cảnh: {currentSceneSec}s ({selectedScene.durationInFrames || 150} frames)
                      </span>
                    </div>
                  </div>

                  {isPacingTight && (
                    <button
                      type="button"
                      onClick={() => handleAutoFitDuration(selectedScene.narration || '')}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Khớp Ngay ({recommendedSec}s)</span>
                    </button>
                  )}
                </div>

                {/* Contextual Template Suggestion */}
                {suggestedTemplate && (
                  <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-blue-50/90 border border-indigo-200 rounded-xl p-3 flex items-center justify-between shadow-2xs animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="text-[11px] text-indigo-950">
                        <div className="font-bold flex items-center gap-1">
                          <span>Gợi ý bố cục thông minh (Google Vids):</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-200/60 text-indigo-800">
                            {suggestedTemplate.keyword}
                          </span>
                        </div>
                        <p className="text-[10px] text-indigo-800/80 mt-0.5">
                          Lời thoại có từ khóa STEM chuyên ngành, chuyển sang mẫu <b>{suggestedTemplate.title}</b>?
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplySuggestedTemplate(suggestedTemplate)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] shrink-0 cursor-pointer shadow-xs flex items-center gap-1 transition-all"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Áp Dụng Mẫu Này</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Nội Dung Trọng Tâm: KaTeX / Biểu Đồ / Quiz / Hóa Học / So Sánh / Chu Trình / Hình Học */}
            {selectedScene.type === 'MATH_FORMULA' && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-blue-950 block">
                    Công Thức Toán Học (Mã LaTeX KaTeX):
                  </label>
                  <span className="text-[10px] text-blue-600 font-mono">Render trực tiếp</span>
                </div>

                <textarea
                  rows={2}
                  value={(selectedScene as any).latex || ''}
                  onChange={(e) => updateSceneProperty((s) => ({ ...s, latex: e.target.value }))}
                  placeholder="VD: f(x) = ax^2 + bx + c hoặc \int_{a}^{b} f(x)dx"
                  className="w-full p-2.5 border border-blue-300 rounded-xl font-mono text-xs text-blue-900 bg-white shadow-2xs"
                />

                {/* Xem trước KaTeX trực tiếp */}
                <div>
                  <span className="text-[10px] text-blue-700 font-bold block mb-1">
                    Xem Trước Hiển Thị Toán Học:
                  </span>
                  <div
                    className="p-3 bg-white rounded-xl border border-blue-200 text-center text-lg overflow-x-auto"
                    dangerouslySetInnerHTML={renderLatexToString((selectedScene as any).latex || '')}
                  />
                </div>
              </div>
            )}

            {selectedScene.type === 'STEM_QUIZ' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-amber-950 block">
                  Câu Hỏi Trắc Nghiệm Ôn Tập:
                </label>
                <input
                  type="text"
                  value={(selectedScene as any).question || ''}
                  onChange={(e) => updateSceneProperty((s) => ({ ...s, question: e.target.value }))}
                  placeholder="Nhập câu hỏi trắc nghiệm..."
                  className="w-full p-2.5 border border-amber-300 rounded-xl text-xs bg-white font-bold text-slate-800"
                />

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-900 block">4 Phương Án Trả Lời:</span>
                  {(selectedScene as any).options?.map((opt: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctQuiz"
                        checked={idx === (selectedScene as any).correctIndex}
                        onChange={() => updateSceneProperty((s) => ({ ...s, correctIndex: idx }))}
                        className="text-emerald-600"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(selectedScene as any).options];
                          newOpts[idx] = e.target.value;
                          updateSceneProperty((s) => ({ ...s, options: newOpts }));
                        }}
                        className="flex-1 p-2 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">
                    Giải Thích Đáp Án:
                  </label>
                  <textarea
                    rows={2}
                    value={(selectedScene as any).explanation || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, explanation: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {selectedScene.type === 'DATA_CHART' && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-emerald-950 block">Biểu Đồ Số Liệu Thống Kê:</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold block mb-1">Nhãn Trục X:</span>
                    <input
                      type="text"
                      value={(selectedScene as any).xAxisLabel || ''}
                      onChange={(e) => updateSceneProperty((s) => ({ ...s, xAxisLabel: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold block mb-1">Nhãn Trục Y:</span>
                    <input
                      type="text"
                      value={(selectedScene as any).yAxisLabel || ''}
                      onChange={(e) => updateSceneProperty((s) => ({ ...s, yAxisLabel: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedScene.type === 'CHEMICAL_REACTION' && (
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-rose-950 block">
                  Soạn Thảo Phản Ứng Hóa Học & Phương Trình:
                </label>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold block mb-1">
                    Phương Trình Hóa Học (LaTeX):
                  </span>
                  <input
                    type="text"
                    value={(selectedScene as any).equation || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, equation: e.target.value }))}
                    className="w-full p-2 border border-rose-300 rounded-xl font-mono text-xs bg-white text-rose-900"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold block mb-1">Xem trước phương trình:</span>
                  <div
                    className="p-2.5 bg-white rounded-xl border border-rose-200 text-center text-base"
                    dangerouslySetInnerHTML={renderLatexToString((selectedScene as any).equation || '')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold block mb-1">Chất tham gia:</span>
                    <input
                      type="text"
                      value={(selectedScene as any).reactants || ''}
                      onChange={(e) => updateSceneProperty((s) => ({ ...s, reactants: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold block mb-1">Sản phẩm:</span>
                    <input
                      type="text"
                      value={(selectedScene as any).products || ''}
                      onChange={(e) => updateSceneProperty((s) => ({ ...s, products: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">Hiện tượng quan sát:</span>
                  <textarea
                    rows={2}
                    value={(selectedScene as any).observation || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, observation: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {selectedScene.type === 'COMPARISON_SPLIT' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-amber-950 block">
                  Soạn Thảo Nội Dung So Sánh Đối Chiếu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-blue-700 font-bold block mb-1">
                      Chủ Đề A (Cột Trái):
                    </span>
                    <input
                      type="text"
                      placeholder="Tiêu đề A"
                      value={(selectedScene as any).topicA?.title || ''}
                      onChange={(e) =>
                        updateSceneProperty((s) => ({
                          ...s,
                          topicA: { ...(s as any).topicA, title: e.target.value },
                        }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white mb-1 font-medium"
                    />
                    <span className="text-[9px] text-slate-500 font-semibold block mb-0.5">Các ý gạch đầu dòng:</span>
                    <textarea
                      rows={3}
                      placeholder="Mỗi dòng 1 ý..."
                      value={((selectedScene as any).topicA?.points || []).join('\n')}
                      onChange={(e) => {
                        const points = e.target.value.split('\n');
                        updateSceneProperty((s) => ({
                          ...s,
                          topicA: { ...(s as any).topicA, points },
                        }));
                      }}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-700 font-bold block mb-1">
                      Chủ Đề B (Cột Phải):
                    </span>
                    <input
                      type="text"
                      placeholder="Tiêu đề B"
                      value={(selectedScene as any).topicB?.title || ''}
                      onChange={(e) =>
                        updateSceneProperty((s) => ({
                          ...s,
                          topicB: { ...(s as any).topicB, title: e.target.value },
                        }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white mb-1 font-medium"
                    />
                    <span className="text-[9px] text-slate-500 font-semibold block mb-0.5">Các ý gạch đầu dòng:</span>
                    <textarea
                      rows={3}
                      placeholder="Mỗi dòng 1 ý..."
                      value={((selectedScene as any).topicB?.points || []).join('\n')}
                      onChange={(e) => {
                        const points = e.target.value.split('\n');
                        updateSceneProperty((s) => ({
                          ...s,
                          topicB: { ...(s as any).topicB, points },
                        }));
                      }}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white leading-relaxed"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">Kết Luận Sư Phạm:</span>
                  <textarea
                    rows={2}
                    value={(selectedScene as any).conclusion || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, conclusion: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {selectedScene.type === 'PROCESS_TIMELINE' && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-emerald-950 block">
                  Chu Trình & Tiến Trình Từng Giai Đoạn:
                </label>
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">Tên Chu Trình:</span>
                  <input
                    type="text"
                    value={(selectedScene as any).processTitle || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, processTitle: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  {(selectedScene as any).stages?.map((stg: any, sIdx: number) => (
                    <div key={sIdx} className="p-2 border border-emerald-200 rounded-lg bg-white">
                      <span className="text-[10px] font-bold text-emerald-700 block">Giai đoạn {sIdx + 1}:</span>
                      <input
                        type="text"
                        value={stg.title}
                        onChange={(e) => {
                          const newStgs = [...(selectedScene as any).stages];
                          newStgs[sIdx].title = e.target.value;
                          updateSceneProperty((s) => ({ ...s, stages: newStgs }));
                        }}
                        className="w-full p-1 border border-slate-100 rounded text-xs font-bold mb-1"
                      />
                      <input
                        type="text"
                        value={stg.description}
                        onChange={(e) => {
                          const newStgs = [...(selectedScene as any).stages];
                          newStgs[sIdx].description = e.target.value;
                          updateSceneProperty((s) => ({ ...s, stages: newStgs }));
                        }}
                        className="w-full p-1 border border-slate-100 rounded text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedScene.type === 'ILLUSTRATED_EXPLAINER' && (
              <div className="p-4 bg-fuchsia-50/70 border border-fuchsia-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-fuchsia-950 block">Minh Họa Flat Explainer:</label>
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">Tiêu đề lớn trên màn hình:</span>
                  <input
                    type="text"
                    value={(selectedScene as any).headline || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, headline: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">Dòng phụ:</span>
                  <textarea
                    rows={2}
                    value={(selectedScene as any).caption || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, caption: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-600 font-bold block">
                    Nhãn của từng biểu tượng (Producer chọn hình biểu tượng):
                  </span>
                  {((selectedScene as any).icons || []).map((ic: any, i: number) => (
                    <input
                      key={i}
                      type="text"
                      value={ic.label || ''}
                      placeholder={ic.name}
                      onChange={(e) =>
                        updateSceneProperty((s) => ({
                          ...s,
                          icons: (s as any).icons.map((x: any, j: number) =>
                            j === i ? { ...x, label: e.target.value } : x
                          ),
                        }))
                      }
                      className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedScene.type === 'COMPOSED' && (
              <ComposedBlocksEditor scene={selectedScene} updateSceneProperty={updateSceneProperty} />
            )}

            {selectedScene.type === 'GEOMETRY_SPACE' && (
              <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-cyan-950 block">Hình Học Trực Quan & Định Lý:</label>
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">Tên Định Lý:</span>
                  <input
                    type="text"
                    value={(selectedScene as any).theoremName || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, theoremName: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">Công Thức LaTeX:</span>
                  <input
                    type="text"
                    value={(selectedScene as any).formulaLatex || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, formulaLatex: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono text-xs bg-white"
                  />
                </div>
                <div
                  className="p-2.5 bg-white rounded-xl border border-cyan-200 text-center text-base"
                  dangerouslySetInnerHTML={renderLatexToString((selectedScene as any).formulaLatex || '')}
                />
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">Ý Nghĩa Sư Phạm:</span>
                  <textarea
                    rows={2}
                    value={(selectedScene as any).explanation || ''}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, explanation: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {/* Ẩn dụ hình ảnh: AI đề xuất, Writer chọn */}
            <MetaphorPanel
              script={script}
              scene={selectedScene}
              updateSceneProperty={updateSceneProperty}
              showToast={showToast}
            />

            {/* Kết quả AI hiển thị ngay dưới form */}
            {aiAnalysisResult.type && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>{aiAnalysisResult.title}</span>
                </div>
                <ul className="text-xs text-blue-800 space-y-1 pl-4 list-disc">
                  {aiAnalysisResult.requestId && !aiAnalysisResult.decision && (
                    <div className="flex gap-2 mb-3">
                      <button disabled={mutations.pending} onClick={mutations.wrap(() => onAiDecision('ACCEPTED'))} className="px-3 py-1 rounded bg-blue-600 text-white">{mutations.pending ? 'Đang lưu…' : 'Chấp nhận gợi ý'}</button>
                      <button disabled={mutations.pending} onClick={mutations.wrap(() => onAiDecision('IGNORED'))} className="px-3 py-1 rounded border">Bỏ qua gợi ý</button>
                    </div>
                  )}
                  {aiAnalysisResult.decision && <p>Đã lưu: {aiAnalysisResult.decision === 'ACCEPTED' ? 'Chấp nhận' : 'Bỏ qua'}. Kịch bản chưa tự thay đổi.</p>}
                  {aiAnalysisResult.details.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            </fieldset>
          </div>
        </main>

        {/* Cột 3: AI Script Intelligence (Bấm nút nào phản hồi phân tích thật nút đó) */}
        <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs h-full min-h-0 shrink-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">AI Script Intelligence</h3>
                <p className="text-[10px] text-slate-400">Gemini (Human-in-the-loop)</p>
              </div>
            </div>

            <div className="space-y-2" aria-busy={isAiRunning}>
              {isAiRunning && <p role="status" className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Đang phân tích AI…</p>}
              <button
                disabled={isAiRunning}
                onClick={() => handleTriggerAiAction('resegment')}
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition-all"
              >
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Split className="w-4 h-4 text-emerald-600" />
                  <span>1. Phân Cảnh Tự Động</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Tối ưu thời lượng các scenes</p>
              </button>

              <button
                disabled={isAiRunning}
                onClick={() => handleTriggerAiAction('grade')}
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-blue-50/50 text-left transition-all"
              >
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <BarChart2 className="w-4 h-4 text-brand-600" />
                  <span>2. Chấm Độ Khó (Readability)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Đo độ dễ hiểu & đối tượng tiếp cận</p>
              </button>

              <button
                disabled={isAiRunning}
                onClick={() => handleTriggerAiAction('extract')}
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all"
              >
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Tags className="w-4 h-4 text-indigo-600" />
                  <span>3. Trích Xuất Khái Niệm</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Lấy các STEM concept tags</p>
              </button>

              <button
                disabled={isAiRunning}
                onClick={() => handleTriggerAiAction('terms')}
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all"
              >
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>4. Bắt Lỗi Thuật Ngữ</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Quét tính nhất quán khoa học</p>
              </button>
            </div>
          </div>
        </aside>
      </div>
      </fieldset>
    </section>
  );
};
