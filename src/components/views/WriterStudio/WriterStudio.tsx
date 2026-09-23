import React, { useState } from 'react';
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
} from 'lucide-react';
import { STEMScript, SceneData } from '../../../types/stem';
import { UserRole } from '../../../services';
import { renderLatexToString } from '../../../utils/latex';

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
  };
  handleTriggerAiAction: (action: 'resegment' | 'grade' | 'extract' | 'terms') => void;
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
  handleTriggerAiAction,
  showToast,
}) => {
  const [draggedSceneIdx, setDraggedSceneIdx] = useState<number | null>(null);
  const [dragOverSceneIdx, setDragOverSceneIdx] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlayTts = (text: string) => {
    if (!text?.trim()) {
      showToast('Vui lòng nhập lời thoại trước khi nghe thử!', 'warn');
      return;
    }

    if (isSpeaking) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      showToast('Đã dừng phát giọng đọc.');
      return;
    }

    setIsSpeaking(true);
    showToast('Đang phát giọng đọc AI thuyết minh tiếng Việt...');

    try {
      const audioUrl = `http://localhost:4000/tts-preview?text=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          const speechSec = audio.duration;
          const targetSec = Math.max(3, Math.round(speechSec + 0.6));
          updateSceneProperty((s) => ({
            ...s,
            durationInFrames: targetSec * 30,
          }));
          showToast(`Đã đồng bộ thời lượng phân cảnh: ${targetSec}s (khớp giọng đọc ${speechSec.toFixed(1)}s)`);
        }
      };
      audio.onended = () => {
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };
      audio.onerror = () => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'vi-VN';
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
        }
      };
      audio.play().catch(() => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'vi-VN';
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
        }
      });
    } catch {
      setIsSpeaking(false);
    }
  };

  return (
    <section className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Top Bar Writer */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex justify-between items-center text-xs shrink-0 z-10 shadow-2xs">
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
            onClick={async () => {
              setScript((prev) => ({ ...prev, scriptStatus: 'IN_REVIEW' }));
              showToast('Đã nộp kịch bản! Chuyển sang Reviewer để thẩm định kịch bản.', 'success');
              setTimeout(() => {
                onRoleChange('reviewer');
                onSetReviewerMode('script');
              }, 800);
            }}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi Kịch Bản Cho Reviewer Thẩm Định (Bước 1 ➔ 2)</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Cột 1: Cấu trúc phân cảnh (Cho phép Thêm / Xóa / Đổi thứ tự) */}
        <aside className="w-72 bg-white border-r border-slate-200 p-4 flex flex-col h-full min-h-0 overflow-hidden shrink-0">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">
              Phân Cảnh ({script.scenes.length})
            </span>
            <span className="font-semibold text-brand-600 font-mono">
              {script.totalDurationSeconds}s
            </span>
          </div>

          {/* Danh sách cảnh */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {script.scenes.map((sc, i) => {
              const isDragging = draggedSceneIdx === i;
              const isOver = dragOverSceneIdx === i && draggedSceneIdx !== i;
              const isSelected = sc.id === selectedScene.id;

              return (
                <div
                  key={sc.id}
                  draggable={true}
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
                    if (draggedSceneIdx !== null && draggedSceneIdx !== i) {
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
                    </div>
                    <div className="flex items-center gap-1">
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
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{sc.title}</p>
                  <span className="text-[10px] font-mono text-brand-600 block">{sc.type}</span>
                </div>
              );
            })}
          </div>

          {/* Nút Thêm Cảnh Mới Nhanh */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
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
                onClick={() => handleAddNewScene('PROCESS_TIMELINE')}
                className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-emerald-700 text-center"
                title="Thêm chu trình"
              >
                + Chu trình
              </button>
            </div>
          </div>
        </aside>

        {/* Cột 2: KHÔNG GIAN SOẠN THẢO KỊCH BẢN CHI TIẾT */}
        <main className="flex-1 min-h-0 bg-slate-50 p-6 overflow-y-auto custom-scrollbar flex justify-center">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col space-y-5">
            {/* 1. Tiêu Đề Cảnh (Cho Phép Writer Sửa Trực Tiếp) */}
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
                    showToast('AI: Đã mở rộng thêm lời dẫn dắt sư phạm & khớp thời lượng!');
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-brand-700 hover:bg-blue-100 font-semibold border border-blue-200 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-brand-600" />
                  <span>AI Mở Rộng Lời Thoại</span>
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
                    showToast('AI: Đã tối ưu câu văn súc tích & khớp thời lượng!');
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 flex items-center gap-1"
                >
                  <span>Tối Ưu Sư Phạm</span>
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
                    showToast(`⚡ Đã khớp thời lượng phân cảnh: ${estSeconds}s!`);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold border border-amber-200 flex items-center gap-1"
                  title="Tự động tính toán lại thời lượng phân cảnh theo độ dài lời thoại"
                >
                  <span>⚡ Khớp Thời Lượng</span>
                </button>
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

            {/* Kết quả AI hiển thị ngay dưới form */}
            {aiAnalysisResult.type && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>{aiAnalysisResult.title}</span>
                </div>
                <ul className="text-xs text-blue-800 space-y-1 pl-4 list-disc">
                  {aiAnalysisResult.details.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
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
                <p className="text-[10px] text-slate-400">Gemini 1.5 Flash (Human-in-the-loop)</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
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
                onClick={() => handleTriggerAiAction('grade')}
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-blue-50/50 text-left transition-all"
              >
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <BarChart2 className="w-4 h-4 text-brand-600" />
                  <span>2. Chấm Độ Khó (Readability)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Đánh giá theo khối lớp</p>
              </button>

              <button
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
    </section>
  );
};
