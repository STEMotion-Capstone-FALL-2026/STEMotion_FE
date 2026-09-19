import React, { useState } from 'react';
import { STEMScript, FeedbackComment } from '../types/stem';
import { RemotionPlayerWrapper } from './RemotionPlayerWrapper';
import { CheckCircle, XCircle, MessageSquare, Send, Check, ShieldCheck } from 'lucide-react';

interface ReviewerViewProps {
  script: STEMScript;
  comments: FeedbackComment[];
  onApproveScript: () => void;
  onRejectScript: () => void;
  onApproveVideo: () => void;
  onAddComment: (comment: FeedbackComment) => void;
  onResolveComment: (commentId: string) => void;
}

export const ReviewerView: React.FC<ReviewerViewProps> = ({
  script,
  comments,
  onApproveScript,
  onRejectScript,
  onApproveVideo,
  onAddComment,
  onResolveComment,
}) => {
  const [activeTab, setActiveTab] = useState<'VIDEO_QA' | 'SCRIPT_REVIEW'>('VIDEO_QA');
  const [newCommentText, setNewCommentText] = useState('');
  const [currentSec, setCurrentSec] = useState(0);
  const [seekTimestampSec, setSeekTimestampSec] = useState<number | null>(null);

  const handleFrameUpdate = (_frame: number, sec: number) => {
    setCurrentSec(sec);
  };

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: FeedbackComment = {
      id: `c_${Date.now()}`,
      author: 'GS. Lê Hoàng Nam (Reviewer)',
      avatar: '🧑‍🔬',
      role: 'Reviewer',
      timestampSec: Math.round(currentSec * 10) / 10,
      content: newCommentText.trim(),
      status: 'OPEN',
      createdAt: 'Vừa xong',
    };

    onAddComment(newComment);
    setNewCommentText('');
  };

  const formatSec = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top QA Overview Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono bg-purple-50 text-purple-700 border border-purple-200">
              REVIEWER QA WORKSPACE
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Kịch bản: {script.scriptStatus === 'APPROVED' ? 'Đã duyệt ✓' : script.scriptStatus === 'IN_REVIEW' ? 'Đang chờ thẩm định' : 'Chưa gửi'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Video: {script.videoStatus === 'APPROVED' ? 'Đã duyệt xuất bản ✓' : script.videoStatus === 'IN_QA' ? 'Đang kiểm định QA' : 'Chưa dựng'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{script.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy trình thẩm định 2 cấp: (1) Thẩm định Kịch bản học thuật → (2) Kiểm tra chất lượng Video Animation
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('VIDEO_QA')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'VIDEO_QA'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎬 Thẩm định Video ({comments.filter((c) => c.status === 'OPEN').length} góp ý mở)
          </button>
          <button
            onClick={() => setActiveTab('SCRIPT_REVIEW')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'SCRIPT_REVIEW'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📝 Duyệt Kịch bản ({script.scenes.length} Scenes)
          </button>
        </div>
      </div>

      {activeTab === 'VIDEO_QA' ? (
        /* Video QA Layout: Remotion Player + Comments Timeline */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Remotion Player (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <RemotionPlayerWrapper
              script={script}
              seekTimestampSec={seekTimestampSec}
              onFrameUpdate={handleFrameUpdate}
            />

            {/* Quick Action: Approve Video Release */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Phê duyệt video hoàn chỉnh</h4>
                <p className="text-xs text-slate-500">
                  Khi tất cả các góp ý học thuật đã được xử lý xong
                </p>
              </div>
              <button
                onClick={onApproveVideo}
                disabled={script.videoStatus === 'APPROVED'}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
                  script.videoStatus === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {script.videoStatus === 'APPROVED' ? 'Video đã được phê duyệt ✓' : 'Duyệt Video xuất bản LMS'}
              </button>
            </div>
          </div>

          {/* Review Comments & Timestamp Pins (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[680px]">
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Ý kiến phản biện theo Timeline ({comments.length})
                  </h3>
                </div>
                <span className="text-xs font-mono text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Thời gian: {formatSec(currentSec)}
                </span>
              </div>

              {/* Comments list */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Chưa có ý kiến phản biện nào. Hãy xem video và ghi chú lại!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3.5 rounded-xl border text-xs transition-all ${
                        comment.status === 'RESOLVED'
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span>{comment.avatar}</span>
                          <span className="font-semibold text-slate-800">{comment.author}</span>
                        </div>
                        <button
                          onClick={() => setSeekTimestampSec(comment.timestampSec)}
                          className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono font-bold text-[11px] border border-blue-200 transition-colors"
                          title="Bấm để nhảy tới thời điểm này trong video"
                        >
                          ▶ {formatSec(comment.timestampSec)}
                        </button>
                      </div>

                      <p className="text-slate-700 leading-relaxed mb-2.5">{comment.content}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100/80 pt-2">
                        <span>{comment.createdAt}</span>
                        {comment.status === 'OPEN' ? (
                          <button
                            onClick={() => onResolveComment(comment.id)}
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Đánh dấu đã sửa
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đã khắc phục
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Comment Input with Pin-to-second button */}
            <form onSubmit={handleCreateComment} className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Ghim phản biện tại:</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {formatSec(currentSec)} (giây thứ {Math.round(currentSec)})
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập nội dung cần điều chỉnh hoặc lưu ý học thuật..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ghim
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Academic Script Review Layout */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Thẩm định tính chính xác của kịch bản</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm duyệt tính sư phạm, công thức khoa học và thời lượng trước khi giao cho bộ phận dựng video Remotion
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onRejectScript}
                className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Yêu cầu chỉnh sửa
              </button>
              <button
                onClick={onApproveScript}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Phê duyệt kịch bản (Approve)
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {script.scenes.map((scene, idx) => (
              <div key={scene.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      SCENE 0{idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-slate-800">{scene.title}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {Math.round((scene.durationInFrames || 150) / 30)} giây
                  </span>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Lời bình:</span> {scene.narration}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
