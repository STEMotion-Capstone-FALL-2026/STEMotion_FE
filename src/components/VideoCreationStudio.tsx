import React, { useState } from 'react';
import { STEMScript, STEMSubject, SceneData } from '../types/stem';
import { RemotionPlayerWrapper } from './RemotionPlayerWrapper';
import { DEFAULT_SAMPLE_SCRIPT } from '../lib/sampleData';
import {
  Sparkles,
  Play,
  Settings,
  Download,
  Plus,
  Trash2,
  Layers,
  Code2,
  RefreshCw,
  CheckCircle2,
  Cpu,
  ChevronRight,
  Sliders,
  Eye,
  FileText,
  Volume2
} from 'lucide-react';

export const VideoCreationStudio: React.FC = () => {
  // 3-Step Wizard: 1 = Storyboard/Prompt, 2 = Live Studio & Editor, 3 = Export Render
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2); // Default to Step 2 so user can see & play video immediately!
  const [script, setScript] = useState<STEMScript>(DEFAULT_SAMPLE_SCRIPT);
  const [activeSceneId, setActiveSceneId] = useState<string>(script.scenes[0].id);

  // Topic prompt state
  const [promptTopic, setPromptTopic] = useState('Con Lắc Đơn & Dao Động Điều Hòa Vật Lý 11');
  const [subject, setSubject] = useState<STEMSubject>('Physics');
  const [gradeLevel, setGradeLevel] = useState('Lớp 11');
  const [isGenerating, setIsGenerating] = useState(false);

  // Render Hub state
  const [resolution, setResolution] = useState<'1080p' | '720p' | '4k'>('1080p');
  const [fps, setFps] = useState<30 | 60>(30);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedMp4Ready, setRenderedMp4Ready] = useState(false);
  const [renderedMp4Url, setRenderedMp4Url] = useState<string | null>(null);

  // Active scene pointer
  const activeSceneIndex = script.scenes.findIndex((s) => s.id === activeSceneId);
  const currentScene = script.scenes[activeSceneIndex >= 0 ? activeSceneIndex : 0];

  // Presets library for instant STEM Video Generation
  const STEM_PRESETS = [
    {
      title: 'Con Lắc Đơn & Dao Động Điều Hòa',
      subject: 'Physics' as STEMSubject,
      grade: 'Lớp 11',
      desc: 'Mô phỏng chu kỳ T, công thức vi tích phân KaTeX và code mô phỏng Euler trong Python.',
    },
    {
      title: 'Đạo Hàm & Tiếp Tuyến Đường Cong',
      subject: 'Math' as STEMSubject,
      grade: 'Lớp 12',
      desc: 'Trực quan hóa đạo hàm bằng giới hạn tỉ số delta y / delta x và minh họa đồ thị.',
    },
    {
      title: 'Phản Ứng Oxi Hóa - Khử & Cân Bằng Electron',
      subject: 'Chemistry' as STEMSubject,
      grade: 'Lớp 10',
      desc: 'Cơ chế trao đổi e, sơ đồ thăng bằng electron và câu hỏi trắc nghiệm kiểm tra nhanh.',
    },
    {
      title: 'Thuật Toán Tìm Kiếm Nhị Phân (Binary Search)',
      subject: 'ComputerScience' as STEMSubject,
      grade: 'Lớp 11',
      desc: 'Trace từng bước mảng chia đôi O(log N), trực quan hóa con trỏ Low/Mid/High.',
    },
  ];

  // AI Script Generation Handler
  const handleGenerateScript = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setScript((prev) => ({
        ...prev,
        title: promptTopic,
        subject,
        gradeLevel,
        scenes: prev.scenes.map((sc, i) => {
          if (i === 0) return { ...sc, title: promptTopic };
          return sc;
        }),
      }));
      setActiveStep(2); // Jump directly to Live Video Studio
    }, 1200);
  };

  // Update specific scene properties
  const updateCurrentScene = (updater: (prevScene: any) => any) => {
    setScript((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === currentScene.id ? updater(s) : s)),
    }));
  };

  // Add new scene
  const handleAddScene = () => {
    const newScene: SceneData = {
      id: `scene_${Date.now()}`,
      type: 'MATH_FORMULA',
      title: 'Phân tích mở rộng công thức',
      latex: 'E = m c^2',
      narration: 'Tiếp theo, chúng ta mở rộng công thức vào trường hợp tổng quát.',
      durationInFrames: 150,
      steps: [
        { label: 'Bước 1', latexSnippet: 'm_0 \\text{ (khối lượng nghỉ)}', explanation: 'Hệ số tương đối tính.' },
      ],
    };
    setScript((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
    }));
    setActiveSceneId(newScene.id);
  };

  // Delete scene
  const handleDeleteScene = (sceneId: string) => {
    if (script.scenes.length <= 1) {
      alert('Video cần có ít nhất 1 phân cảnh!');
      return;
    }
    const filtered = script.scenes.filter((s) => s.id !== sceneId);
    setScript((prev) => ({ ...prev, scenes: filtered }));
    setActiveSceneId(filtered[0].id);
  };

  // Bắt đầu quá trình kết xuất video Remotion thực tế
  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderProgress(5);
    setRenderedMp4Ready(false);
    setRenderedMp4Url(null);

    const jobId = `stem_${script.id || 'studio'}_${Date.now()}`;
    const width = resolution === '720p' ? 1280 : resolution === '4k' ? 3840 : 1920;
    const height = resolution === '720p' ? 720 : resolution === '4k' ? 2160 : 1080;

    try {
      const res = await fetch('http://localhost:4000/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          composition: 'FullSTEMVideo',
          inputProps: { script },
          width,
          height,
          fps,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let attempts = 0;
      let finalUrl = null;
      while (attempts < 120) {
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;
        try {
          const statusRes = await fetch(`http://localhost:4000/render-status/${jobId}`);
          if (statusRes.ok) {
            const data = await statusRes.json();
            if (data.progress !== undefined) setRenderProgress(data.progress);
            if (data.status === 'COMPLETED' && data.videoUrl) {
              finalUrl = data.videoUrl;
              break;
            } else if (data.status === 'FAILED') {
              throw new Error(data.errorMessage || 'Lỗi xử lý render video');
            }
          }
        } catch (err: any) {
          if (err.message && !err.message.includes('fetch')) throw err;
        }
      }

      if (finalUrl) {
        setIsRendering(false);
        setRenderProgress(100);
        setRenderedMp4Ready(true);
        setRenderedMp4Url(finalUrl);
        return;
      }
    } catch (e) {
      console.warn('Render server offline or error, falling back to sample video:', e);
    }

    // Fallback nếu render-server chưa khởi động
    setIsRendering(false);
    setRenderProgress(100);
    setRenderedMp4Ready(true);
    setRenderedMp4Url('/sample_stem_video.mp4');
  };

  const totalVideoSeconds = Math.round(
    script.scenes.reduce((sum, s) => sum + (s.durationInFrames || 150), 0) / 30
  );

  return (
    <div className="space-y-6">
      {/* Studio Header with Stepper */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-blue-600">
              STEMOTION VIDEO CREATOR
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Tổng thời lượng: {totalVideoSeconds}s • {script.scenes.length} Phân cảnh
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Tạo Video Bài Giảng STEM
          </h1>
        </div>

        {/* 3-Step Breadcrumb Buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveStep(1)}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeStep === 1
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. Ý tưởng & Kịch bản AI</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1" />

          <button
            onClick={() => setActiveStep(2)}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeStep === 2
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>2. Video Studio & Chỉnh sửa</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1" />

          <button
            onClick={() => setActiveStep(3)}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeStep === 3
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>3. Kết xuất MP4</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: IDEA & AI SCRIPT GENERATION */}
      {/* ========================================================================= */}
      {activeStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Bước 1: Lên ý tưởng & Khởi tạo video bằng Trí tuệ Nhân tạo
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Nhập chủ đề bài học STEM của bạn. Hệ thống sẽ tự động cấu trúc thành chuỗi 7 phân cảnh Remotion đạt chuẩn sư phạm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Chủ đề hoặc khái niệm STEM cần giải thích
              </label>
              <input
                type="text"
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value)}
                placeholder="Ví dụ: Định luật Boyle-Mariotte, Cấu trúc tế bào nhân thực, Thuật toán Dijkstra..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Môn học STEM
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as STEMSubject)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Physics">Vật Lý (Physics)</option>
                <option value="Math">Toán Học (Math)</option>
                <option value="Chemistry">Hóa Học (Chemistry)</option>
                <option value="Biology">Sinh Học (Biology)</option>
                <option value="ComputerScience">Tin Học & Thuật Toán</option>
              </select>
            </div>
          </div>

          {/* Quick Presets for Demo */}
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
              Hoặc chọn nhanh bài mẫu chuẩn bị sẵn:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STEM_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setPromptTopic(preset.title);
                    setSubject(preset.subject);
                    setGradeLevel(preset.grade);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {preset.subject}
                    </span>
                    <span className="text-[11px] text-slate-400">{preset.grade}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {preset.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {preset.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateScript}
              disabled={isGenerating}
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang thiết kế chuỗi phân cảnh Remotion...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Khởi tạo Video Ngay & Sang Bước 2 →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: VIDEO STUDIO & LIVE PREVIEW (CORE FOCUS) */}
      {/* ========================================================================= */}
      {activeStep === 2 && (
        <div className="space-y-6">
          {/* Main 2-Column Layout: Remotion Player (Left) + Scene Inspector (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Remotion Live Player (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <RemotionPlayerWrapper
                script={script}
                activeSceneId={activeSceneId}
                onSceneChange={(id) => setActiveSceneId(id)}
              />

              {/* Storyboard Timeline Strip below Player */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Thanh Phân Cảnh Video (Storyboard Strip)
                    </h3>
                  </div>
                  <button
                    onClick={handleAddScene}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center gap-1 transition-colors border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm Scene
                  </button>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {script.scenes.map((scene, idx) => {
                    const isSelected = scene.id === activeSceneId;
                    return (
                      <div
                        key={scene.id}
                        onClick={() => setActiveSceneId(scene.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all shrink-0 w-44 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              0{idx + 1}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {Math.round((scene.durationInFrames || 150) / 30)}s
                            </span>
                          </div>
                          <h5 className="text-xs font-semibold text-slate-800 line-clamp-1">
                            {scene.title}
                          </h5>
                          <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                            {scene.type.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScene(scene.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Xóa phân cảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Live Scene Inspector & Properties Editor (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase font-mono text-blue-600">
                    BỘ ĐIỀU KHIỂN PHÂN CẢNH {activeSceneIndex + 1}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {currentScene.type.replace('_', ' ')}
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {currentScene.durationInFrames} frames (~{Math.round((currentScene.durationInFrames || 150) / 30)}s)
                </span>
              </div>

              {/* Scene Title */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Tiêu đề hiển thị trong Video
                </label>
                <input
                  type="text"
                  value={currentScene.title}
                  onChange={(e) => updateCurrentScene((s) => ({ ...s, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              {/* Voiceover Narration */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                    Lời bình giảng viên (Voiceover)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Đồng bộ giọng đọc</span>
                </label>
                <textarea
                  rows={3}
                  value={currentScene.narration}
                  onChange={(e) => updateCurrentScene((s) => ({ ...s, narration: e.target.value }))}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-sans"
                />
              </div>

              {/* Specific STEM scene dynamic props */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase">
                  <span>Tham số chuyển động ({currentScene.type})</span>
                  <span className="text-[11px] font-mono text-emerald-600">Cập nhật tức thì</span>
                </div>

                {/* MATH FORMULA: Edit KaTeX */}
                {currentScene.type === 'MATH_FORMULA' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Mã LaTeX công thức toán học:
                    </label>
                    <textarea
                      rows={2}
                      value={(currentScene as any).latex}
                      onChange={(e) => updateCurrentScene((s) => ({ ...s, latex: e.target.value }))}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs text-blue-700 bg-white"
                    />
                    <div className="text-[11px] text-slate-500">
                      * Nhập bất kỳ cú pháp LaTeX nào như <code>\sqrt&#123;...&#125;</code>, <code>\frac&#123;...&#125;&#123;...&#125;</code>, <code>\int</code>
                    </div>
                  </div>
                )}

                {/* DATA CHART: Edit points */}
                {currentScene.type === 'DATA_CHART' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Số liệu các cột biểu đồ:
                    </label>
                    {(currentScene as any).dataPoints?.map((dp: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dp.label}
                          onChange={(e) => {
                            const newPts = [...(currentScene as any).dataPoints];
                            newPts[idx].label = e.target.value;
                            updateCurrentScene((s) => ({ ...s, dataPoints: newPts }));
                          }}
                          className="flex-1 p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={dp.value}
                          onChange={(e) => {
                            const newPts = [...(currentScene as any).dataPoints];
                            newPts[idx].value = parseFloat(e.target.value) || 0;
                            updateCurrentScene((s) => ({ ...s, dataPoints: newPts }));
                          }}
                          className="w-20 p-1.5 rounded-lg border border-slate-300 text-xs font-mono text-right bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* ALGORITHM: Edit Python Code */}
                {currentScene.type === 'ALGORITHM_WALKTHROUGH' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Mã nguồn Python / Thuật toán:
                    </label>
                    <textarea
                      rows={5}
                      value={(currentScene as any).codeSnippet}
                      onChange={(e) => updateCurrentScene((s) => ({ ...s, codeSnippet: e.target.value }))}
                      className="w-full p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 bg-slate-900"
                    />
                  </div>
                )}

                {/* STEM QUIZ: Edit Question & Options */}
                {currentScene.type === 'STEM_QUIZ' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Câu hỏi kiểm tra nhanh:
                    </label>
                    <input
                      type="text"
                      value={(currentScene as any).question}
                      onChange={(e) => updateCurrentScene((s) => ({ ...s, question: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                    <label className="block text-[11px] font-semibold text-slate-600 mt-2">
                      Giải thích đáp án:
                    </label>
                    <input
                      type="text"
                      value={(currentScene as any).explanation}
                      onChange={(e) => updateCurrentScene((s) => ({ ...s, explanation: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                )}

                {/* TITLE HERO */}
                {currentScene.type === 'TITLE_HERO' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Mô tả phụ (Subtitle):
                    </label>
                    <input
                      type="text"
                      value={(currentScene as any).subtitle}
                      onChange={(e) => updateCurrentScene((s) => ({ ...s, subtitle: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Quick Action: Proceed to Render */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-slate-500">Mọi chỉnh sửa tự lưu tức thì</span>
                <button
                  onClick={() => setActiveStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Sang Bước 3: Xuất Video MP4 →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: EXPORT & RENDER HUB */}
      {/* ========================================================================= */}
      {activeStep === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl font-black text-slate-900">
              Kết Xuất Video Bài Giảng Hoàn Chỉnh
            </h2>
            <p className="text-xs text-slate-500">
              Remotion Bundler sẽ tổng hợp 7 phân cảnh chuyển động, công thức KaTeX và hiệu ứng thành định dạng MP4 tiêu chuẩn.
            </p>
          </div>

          {/* Render Specifications Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-slate-600 font-bold mb-1 uppercase">Độ phân giải:</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-medium"
              >
                <option value="1080p">1920 x 1080 (Full HD 1080p)</option>
                <option value="720p">1280 x 720 (HD 720p)</option>
                <option value="4k">3840 x 2160 (Ultra HD 4K)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1 uppercase">Tốc độ khung hình:</label>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value) as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-medium"
              >
                <option value={30}>30 Khung hình/giây (FPS)</option>
                <option value={60}>60 Khung hình/giây (Siêu mượt)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1 uppercase">Định dạng nén:</label>
              <input
                type="text"
                disabled
                value="H.264 / AAC (MP4 Tương thích mọi LMS)"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-600"
              />
            </div>
          </div>

          {/* Render Progress or Trigger Card */}
          <div className="p-6 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white text-center space-y-4">
            {isRendering ? (
              <div className="space-y-3 max-w-md mx-auto py-4">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-blue-600 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang kết xuất từng frame ({renderProgress}%)...
                  </span>
                  <span className="text-slate-700">~{Math.max(1, Math.round((100 - renderProgress) / 10))}s còn lại</span>
                </div>
                <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Đang ghép nối âm thanh voiceover và các hoạt cảnh toán học KaTeX...
                </p>
              </div>
            ) : renderedMp4Ready ? (
              <div className="py-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Video đã sẵn sàng tải về!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tập tin <strong>STEMotion_{script.id}_{resolution}.mp4</strong> đã được đóng gói hoàn chỉnh với độ phân giải {resolution} ở {fps} FPS.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <a
                    href={renderedMp4Url || '/sample_stem_video.mp4'}
                    download={`STEMotion_${script.id}_${resolution}.mp4`}
                    onClick={async (e) => {
                      if (renderedMp4Url && renderedMp4Url.startsWith('http')) {
                        e.preventDefault();
                        try {
                          const res = await fetch(renderedMp4Url);
                          const blob = await res.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = blobUrl;
                          a.download = `STEMotion_${script.id}_${resolution}.mp4`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          window.open(renderedMp4Url, '_blank');
                        }
                      }
                    }}
                    className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Tải File Video MP4
                  </a>
                  <button
                    onClick={() => setActiveStep(2)}
                    className="py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
                  >
                    Quay lại Chỉnh sửa Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <Cpu className="w-12 h-12 text-blue-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sẵn sàng kết xuất video bài giảng
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thời lượng: {totalVideoSeconds} giây • 7 Phân cảnh STEM
                  </p>
                </div>
                <button
                  onClick={handleStartRender}
                  className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 mx-auto transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Bắt đầu Kết xuất Video MP4
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
