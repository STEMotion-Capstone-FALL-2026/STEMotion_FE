import React, { useState } from 'react';
import { STEMScript, STEMSubject } from '../types/stem';
import { Sparkles, Send, Clock } from 'lucide-react';

interface WriterViewProps {
  script: STEMScript;
  onUpdateScript: (updated: STEMScript) => void;
  onSubmitForReview: () => void;
}

export const WriterView: React.FC<WriterViewProps> = ({
  script,
  onUpdateScript,
  onSubmitForReview,
}) => {
  const [topicInput, setTopicInput] = useState('Định luật vạn vật hấp dẫn và quỹ đạo vệ tinh');
  const [subject, setSubject] = useState<STEMSubject>('Physics');
  const [gradeLevel, setGradeLevel] = useState('Lớp 10');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  // Preset quick templates
  const PRESETS = [
    { title: 'Con lắc đơn & Dao động điều hòa', subject: 'Physics' as STEMSubject, grade: 'Lớp 11' },
    { title: 'Đạo hàm & Cực trị hàm số bậc 3', subject: 'Math' as STEMSubject, grade: 'Lớp 12' },
    { title: 'Cân bằng phản ứng Oxi hóa - Khử', subject: 'Chemistry' as STEMSubject, grade: 'Lớp 10' },
    { title: 'Thuật toán tìm kiếm nhị phân Binary Search', subject: 'ComputerScience' as STEMSubject, grade: 'Lớp 11' },
  ];

  const handleSimulateAiGeneration = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      onUpdateScript({
        ...script,
        title: topicInput,
        subject,
        gradeLevel,
        scriptStatus: 'DRAFT',
      });
    }, 1200);
  };

  const handleUpdateSceneNarration = (sceneId: string, narration: string) => {
    const updatedScenes = script.scenes.map((s) => (s.id === sceneId ? { ...s, narration } : s));
    onUpdateScript({ ...script, scenes: updatedScenes });
  };

  const handleUpdateSceneTitle = (sceneId: string, title: string) => {
    const updatedScenes = script.scenes.map((s) => (s.id === sceneId ? { ...s, title } : s));
    onUpdateScript({ ...script, scenes: updatedScenes });
  };

  const currentScene = script.scenes[activeSceneIndex] || script.scenes[0];

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono bg-blue-50 text-blue-700 border border-blue-200">
              WRITER WORKSPACE
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              script.scriptStatus === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : script.scriptStatus === 'IN_REVIEW'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              Trạng thái Kịch bản: {script.scriptStatus === 'APPROVED' ? 'Đã duyệt ✓' : script.scriptStatus === 'IN_REVIEW' ? 'Đang chờ thẩm định...' : 'Bản nháp (Draft)'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{script.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Môn: <span className="font-semibold text-slate-700">{script.subject}</span> • Khối: <span className="font-semibold text-slate-700">{script.gradeLevel}</span> • Tổng thời lượng: <span className="font-mono font-medium text-slate-700">{script.totalDurationSeconds} giây</span> (7 Phân cảnh STEM)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSubmitForReview}
            disabled={script.scriptStatus === 'IN_REVIEW' || script.scriptStatus === 'APPROVED'}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all ${
              script.scriptStatus === 'IN_REVIEW' || script.scriptStatus === 'APPROVED'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            <Send className="w-4 h-4" />
            {script.scriptStatus === 'APPROVED' ? 'Kịch bản đã được duyệt' : script.scriptStatus === 'IN_REVIEW' ? 'Đã gửi thẩm định' : 'Gửi kịch bản xin duyệt'}
          </button>
        </div>
      </div>

      {/* AI Script Generation Card */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-3">
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          <span>Trợ lý AI Script Intelligence (Google Gemini 1.5)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Chủ đề bài học STEM
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Nhập khái niệm hoặc bài toán STEM..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Môn học
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as STEMSubject)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="Physics">Vật Lý (Physics)</option>
              <option value="Math">Toán Học (Math)</option>
              <option value="Chemistry">Hóa Học (Chemistry)</option>
              <option value="Biology">Sinh Học (Biology)</option>
              <option value="ComputerScience">Tin Học (Computer Science)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Khối lớp
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="Lớp 10">Lớp 10</option>
              <option value="Lớp 11">Lớp 11</option>
              <option value="Lớp 12">Lớp 12</option>
              <option value="Đại học">Đại học / Chuyên sâu</option>
            </select>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs text-slate-500 font-medium">Chủ đề mẫu:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTopicInput(p.title);
                setSubject(p.subject);
                setGradeLevel(p.grade);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-xs"
            >
              {p.title} ({p.subject})
            </button>
          ))}
        </div>

        <button
          onClick={handleSimulateAiGeneration}
          disabled={isGenerating}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>AI đang khởi tạo 7 phân cảnh Remotion STEM...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Tạo kịch bản chuẩn cấu trúc STEMotion</span>
            </>
          )}
        </button>
      </div>

      {/* Main Script Editor: 7 Scenes Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scenes Outline List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Phân cảnh cấu trúc ({script.scenes.length})
            </span>
            <span className="text-xs font-mono text-slate-400">30 fps</span>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {script.scenes.map((scene, idx) => {
              const isActive = activeSceneIndex === idx;
              return (
                <div
                  key={scene.id}
                  onClick={() => setActiveSceneIndex(idx)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      SCENE 0{idx + 1}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {Math.round((scene.durationInFrames || 150) / 30)}s
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{scene.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-blue-600 font-medium">{scene.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Scene Detailed Content & Narration (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono text-blue-600 font-bold uppercase">
                  Biên tập Phân Cảnh 0{activeSceneIndex + 1} • {currentScene.type}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{currentScene.title}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentScene.durationInFrames} frames (~{Math.round((currentScene.durationInFrames || 150) / 30)}s)</span>
              </div>
            </div>

            {/* Scene Title Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Tiêu đề phân cảnh
              </label>
              <input
                type="text"
                value={currentScene.title}
                onChange={(e) => handleUpdateSceneTitle(currentScene.id, e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            {/* Narration voiceover text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase flex items-center justify-between">
                <span>Lời bình đọc giảng viên (Voiceover Narration)</span>
                <span className="text-[11px] text-slate-400 font-normal">Đồng bộ giọng đọc AI TTS</span>
              </label>
              <textarea
                rows={4}
                value={currentScene.narration}
                onChange={(e) => handleUpdateSceneNarration(currentScene.id, e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-sans"
              />
            </div>

            {/* Type-specific properties display */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h5 className="text-xs font-bold uppercase text-slate-600 mb-2 font-mono">
                Tham số Remotion Scene ({currentScene.type})
              </h5>
              {currentScene.type === 'MATH_FORMULA' && (
                <div className="space-y-2 text-xs">
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-800">LaTeX Chính:</span>{' '}
                    <code className="bg-white px-2 py-0.5 rounded border text-blue-700 font-mono">
                      {(currentScene as any).latex}
                    </code>
                  </div>
                  <div className="text-slate-500">
                    Số bước chứng minh: <span className="font-semibold text-slate-700">{(currentScene as any).steps?.length || 0} bước</span>
                  </div>
                </div>
              )}
              {currentScene.type === 'DATA_CHART' && (
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Loại biểu đồ: <span className="font-semibold text-slate-800">{(currentScene as any).chartType}</span></div>
                  <div>Trục X: {(currentScene as any).xAxisLabel} • Trục Y: {(currentScene as any).yAxisLabel}</div>
                </div>
              )}
              {currentScene.type === 'ALGORITHM_WALKTHROUGH' && (
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Ngôn ngữ: <span className="font-semibold text-slate-800 uppercase font-mono">{(currentScene as any).language}</span></div>
                  <div>Số bước trace logic: <span className="font-semibold text-slate-800">{(currentScene as any).steps?.length || 0} bước</span></div>
                </div>
              )}
              {currentScene.type === 'STEM_QUIZ' && (
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Câu hỏi: <span className="font-semibold text-slate-800">{(currentScene as any).question}</span></div>
                  <div>Đáp án đúng: <span className="font-semibold text-emerald-600 font-mono">Lựa chọn {String.fromCharCode(65 + (currentScene as any).correctIndex)}</span></div>
                </div>
              )}
              {currentScene.type === 'TITLE_HERO' && (
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Subtitle: {(currentScene as any).subtitle}</div>
                  <div>Badge: {(currentScene as any).badgeText}</div>
                </div>
              )}
              {currentScene.type === 'DIAGRAM_EXPLAINER' && (
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Sơ đồ: {(currentScene as any).diagramTitle}</div>
                  <div>Số nhãn chú thích: {(currentScene as any).labels?.length || 0} thành phần</div>
                </div>
              )}
              {currentScene.type === 'OUTRO' && (
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Giảng viên: {(currentScene as any).instructorName}</div>
                  <div>Gợi ý tiếp theo: {(currentScene as any).nextLessonSuggestion}</div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
            <span>Dữ liệu kịch bản được tự động lưu cục bộ</span>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSceneIndex(Math.max(0, activeSceneIndex - 1))}
                disabled={activeSceneIndex === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                ← Phân cảnh trước
              </button>
              <button
                onClick={() => setActiveSceneIndex(Math.min(script.scenes.length - 1, activeSceneIndex + 1))}
                disabled={activeSceneIndex === script.scenes.length - 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Phân cảnh tiếp theo →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
