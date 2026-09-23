import React from 'react';
import {
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
} from 'lucide-react';
import { STEMScript, SceneData, FeedbackComment } from '../../../types/stem';
import { UserRole, reviewService } from '../../../services';
import { RemotionPlayerWrapper } from '../../RemotionPlayerWrapper';
import { renderLatexToString } from '../../../utils/latex';

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
  showToast,
}) => {
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
        </div>

        {/* 2 Tabs Chuyển Giữa: Duyệt Kịch Bản (Cấp 1) & Duyệt Video (Cấp 2) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setReviewerMode('script')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
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
          <button
            onClick={() => setReviewerMode('video')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              reviewerMode === 'video'
                ? 'bg-white text-purple-700 shadow-xs ring-1 ring-purple-400/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>2. Duyệt Video Thành Phẩm</span>
            {script.videoStatus === 'APPROVED' && (
              <Check className="w-3 h-3 text-emerald-500 font-bold" />
            )}
          </button>
        </div>

        {/* Quyết định của Reviewer */}
        <div className="flex items-center space-x-2">
          {reviewerMode === 'script' ? (
            <>
              <button
                onClick={async () => {
                  try {
                    await reviewService.submitReviewDecision(script.id, 'CHANGE_REQUESTED');
                  } catch (e) {
                    console.warn('[ReviewerStudio] submitReviewDecision fallback:', e);
                  }
                  setScript((prev) => ({ ...prev, scriptStatus: 'CHANGE_REQUESTED' }));
                  showToast('Đã gửi yêu cầu sửa lại kịch bản cho Writer!', 'warn');
                  setTimeout(() => onRoleChange('writer'), 900);
                }}
                className="px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yêu Cầu Writer Sửa Lại</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    await reviewService.submitReviewDecision(script.id, 'APPROVED');
                  } catch (e) {
                    console.warn('[ReviewerStudio] submitReviewDecision fallback:', e);
                  }
                  setScript((prev) => ({ ...prev, scriptStatus: 'APPROVED' }));
                  showToast(
                    'Đã phê duyệt kịch bản! Hệ thống chuyển sang Producer để tạo video.',
                    'success'
                  );
                  setTimeout(() => onRoleChange('producer'), 1000);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Duyệt Kịch Bản ➔ Chuyển Producer</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={async () => {
                  try {
                    await reviewService.requestVideoChanges(script.id);
                  } catch (e) {
                    console.warn('[ReviewerStudio] requestVideoChanges fallback:', e);
                  }
                  setScript((prev) => ({ ...prev, videoStatus: 'NOT_RENDERED' }));
                  showToast('Đã gửi yêu cầu chỉnh sửa video sang Producer!', 'warn');
                  setTimeout(() => onRoleChange('producer'), 900);
                }}
                className="px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yêu Cầu Producer Sửa Clip</span>
              </button>
              <button
                onClick={onOpenPublishModal}
                className="px-3 py-1.5 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-800 rounded-lg font-bold flex items-center space-x-1.5 shadow-2xs"
                title="Tải video MP4 Full HD về máy tính"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải Video MP4</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    await reviewService.approveVideo(script.id);
                  } catch (e) {
                    console.warn('[ReviewerStudio] approveVideo fallback:', e);
                  }
                  setScript((prev) => ({ ...prev, videoStatus: 'APPROVED' }));
                  showToast('Đã phê duyệt video hoàn chỉnh! Mở màn hình Xuất Bản YouTube & Tải MP4.', 'success');
                  onOpenPublishModal();
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Duyệt Video ➔ Xuất Bản / Tải Về</span>
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

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-blue-900 block text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Chỉ Số Sư Phạm (Flesch-Kincaid):
                </span>
                <ul className="text-blue-800 space-y-1 text-[11px] pl-4 list-disc">
                  <li>
                    Độ khó bài giảng: <b>Phù hợp chuẩn {script.gradeLevel}</b>
                  </li>
                  <li>
                    Thuật ngữ khoa học: <b>Đồng nhất 100%</b>
                  </li>
                  <li>
                    Khuyến nghị: <b>Đủ điều kiện phê duyệt</b>
                  </li>
                </ul>
              </div>

              {/* Form Góp Ý Kịch Bản */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block text-[11px]">
                  Ghi chú thẩm định kịch bản cho Writer:
                </label>
                <textarea
                  rows={4}
                  placeholder="Nhập nhận xét hoặc chỉ dẫn sửa đổi trước khi duyệt..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 shrink-0 mt-4">
              <button
                onClick={async () => {
                  await reviewService.submitReviewDecision(script.id, 'APPROVED');
                  setScript((prev) => ({ ...prev, scriptStatus: 'APPROVED' }));
                  showToast(
                    'Đã phê duyệt kịch bản! Hệ thống chuyển sang Producer để tạo video.',
                    'success'
                  );
                  setTimeout(() => onRoleChange('producer'), 900);
                }}
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
                    Ghi Chú Mốc Thời Gian ({comments.length})
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
                {comments.map((cm) => (
                  <div
                    key={cm.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-purple-700 bg-white px-1.5 py-0.5 rounded border text-[10px]">
                        ⏱{' '}
                        {Math.floor(cm.timestampSec / 60)
                          .toString()
                          .padStart(2, '0')}
                        :
                        {(Math.floor(cm.timestampSec) % 60).toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => setSeekTimestampSec(cm.timestampSec)}
                        className="text-[10px] text-blue-600 font-semibold hover:underline"
                      >
                        Nhảy tới giây này ▶
                      </button>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">{cm.content}</p>
                  </div>
                ))}
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
    </section>
  );
};
