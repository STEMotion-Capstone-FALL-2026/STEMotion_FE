import React, { useState } from 'react';
import {
  Building,
  UserPlus,
  ChevronDown,
  Check,
  FolderPlus,
  Users,
  PenTool,
  CheckSquare,
  Clapperboard,
  Shield,
  Library,
  LogOut,
  PlusCircle,
  MessageSquare,
  ArrowLeft,
  GitCompare,
  Send,
  AlertCircle,
  Plus,
  Mic,
  Split,
  BarChart2,
  Tags,
  Play,
  RotateCcw,
  Maximize,
  Image,
  RefreshCw,
  Cpu,
  Layers,
  Search,
  ExternalLink,
  Share2,
  X,
  Code,
  CheckCheck,
  CheckCircle2,
  Sparkles,
  Sliders,
  FileText
} from 'lucide-react';
import { RemotionPlayerWrapper } from './components/RemotionPlayerWrapper';
import { DEFAULT_SAMPLE_SCRIPT, SAMPLE_WORKSPACES, SAMPLE_MEMBERS, SAMPLE_COMMENTS } from './lib/sampleData';
import { STEMScript, WorkspaceMember, FeedbackComment, Workspace, SceneData } from './types/stem';

export default function App() {
  // Current active role: 'writer' | 'reviewer' | 'producer' | 'admin' | 'library'
  const [currentRole, setCurrentRole] = useState<'writer' | 'reviewer' | 'producer' | 'admin' | 'library'>('producer');

  // Multi-workspace state
  const [workspaces, setWorkspaces] = useState<Workspace[]>(SAMPLE_WORKSPACES);
  const [activeGroup, setActiveGroup] = useState({ name: 'Nhóm STEM THCS Tân Bình', code: 'Gr-01' });
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  // Script & Video state
  const [script, setScript] = useState<STEMScript>(DEFAULT_SAMPLE_SCRIPT);
  const [activeSceneId, setActiveSceneId] = useState<string>(script.scenes[0]?.id || 'scene_1');
  const [comments, setComments] = useState<FeedbackComment[]>(SAMPLE_COMMENTS);
  const [seekTimestampSec, setSeekTimestampSec] = useState<number | null>(null);

  // Producer Render Hub State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStageText, setRenderStageText] = useState<string>('Khởi động BullMQ Worker...');
  const [renderPercentageText, setRenderPercentageText] = useState<string>('0%');

  // Modals state
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [isInviteWorkspaceModalOpen, setIsInviteWorkspaceModalOpen] = useState(false);
  const [isVersionDiffModalOpen, setIsVersionDiffModalOpen] = useState(false);
  const [isSwapAssetModalOpen, setIsSwapAssetModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'info' | 'warn' }[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Active scene pointer
  const selectedScene = script.scenes.find((s) => s.id === activeSceneId) || script.scenes[0];

  // Helper to update current scene dynamically
  const updateSceneProperty = (updater: (s: any) => any) => {
    setScript((prev) => ({
      ...prev,
      scenes: prev.scenes.map((sc) => (sc.id === selectedScene.id ? updater(sc) : sc)),
    }));
  };

  // Trigger Render Simulation
  const startRenderMock = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderPercentageText('0%');
    setRenderStageText('BullMQ: Đang phân bổ task render trên GPU Node...');
    showToast('Đã gửi job kết xuất Remotion lên BullMQ Queue!', 'info');

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      if (current === 30) {
        setRenderStageText('Remotion: Đang render khung hình & KaTeX SVG...');
      } else if (current === 60) {
        setRenderStageText('FPT.AI & Whisper: Đang ghép âm thanh và phụ đề Karaoke...');
      } else if (current === 90) {
        setRenderStageText('FFmpeg: Đang đóng gói file MP4 1080p60...');
      }

      if (current >= 100) {
        clearInterval(interval);
        setIsRendering(false);
        setRenderProgress(100);
        setRenderPercentageText('100%');
        setRenderStageText('Hoàn tất kết xuất! Clip đã sẵn sàng duyệt QA.');
        setScript((prev) => ({ ...prev, videoStatus: 'IN_QA' }));
        showToast('Kết xuất video MP4 thành công! Đã chuyển sang Reviewer QA.', 'success');
      } else {
        setRenderProgress(current);
        setRenderPercentageText(`${current}%`);
      }
    }, 400);
  };

  // Reviewer add comment
  const [newCommentInput, setNewCommentInput] = useState('');
  const [currentSec, setCurrentSec] = useState(0);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;
    const newC: FeedbackComment = {
      id: `c_${Date.now()}`,
      author: 'ThS. Trần Thị B (Reviewer)',
      avatar: '👩‍🏫',
      role: 'Reviewer',
      timestampSec: Math.round(currentSec * 10) / 10,
      content: newCommentInput.trim(),
      status: 'OPEN',
      createdAt: 'Vừa xong',
    };
    setComments([newC, ...comments]);
    setNewCommentInput('');
    showToast(`Đã ghim nhận xét tại giây thứ ${Math.round(currentSec)}!`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen font-sans bg-slate-50 text-slate-900">
      {/* TOAST CONTAINER */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-anim px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white flex items-center space-x-2 pointer-events-auto ${
              t.type === 'success' ? 'bg-emerald-600' : t.type === 'warn' ? 'bg-amber-600' : 'bg-brand-600'
            }`}
          >
            {t.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TOPBAR CHUNG CỦA HỆ THỐNG */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div
            onClick={() => setCurrentRole('producer')}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              S
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base">STEMotion</span>
          </div>

          <span className="text-slate-300">|</span>

          {/* WORKSPACE SELECTOR */}
          <div className="relative flex items-center space-x-1.5">
            <button
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 transition-colors"
            >
              <Building className="w-3.5 h-3.5 text-brand-600" />
              <span className="font-bold">{activeGroup.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-brand-700 font-semibold">{activeGroup.code}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Nút Mời Thành Viên Nhanh */}
            <button
              onClick={() => setIsInviteWorkspaceModalOpen(true)}
              title="Mời thành viên vào nhóm này"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-blue-50 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-brand-600" />
              <span>+ Mời</span>
            </button>

            {/* Dropdown danh sách nhóm */}
            {isGroupDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-1.5 z-50 text-xs animate-fade-in">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  <span>Không gian nhóm làm việc:</span>
                  <span className="text-brand-600 font-semibold">Multi-Workspace</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveGroup({ name: 'Nhóm STEM THCS Tân Bình', code: 'Gr-01' });
                      setIsGroupDropdownOpen(false);
                      showToast('Đã chuyển sang Nhóm STEM THCS Tân Bình');
                    }}
                    className="w-full p-2 rounded-lg hover:bg-blue-50 text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">Nhóm STEM THCS Tân Bình</div>
                      <div className="text-[10px] text-slate-500">Môn Toán & Vật Lý khối 9</div>
                    </div>
                    {activeGroup.code === 'Gr-01' && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>

                  <button
                    onClick={() => {
                      setActiveGroup({ name: 'Kênh EdTech STEM Sáng Tạo', code: 'Gr-02' });
                      setIsGroupDropdownOpen(false);
                      showToast('Đã chuyển sang Kênh EdTech STEM Sáng Tạo');
                    }}
                    className="w-full p-2 rounded-lg hover:bg-blue-50 text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">Kênh EdTech STEM Sáng Tạo</div>
                      <div className="text-[10px] text-slate-500">Dự án Kênh YouTube & TikTok</div>
                    </div>
                    {activeGroup.code === 'Gr-02' && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                </div>

                <div className="pt-1.5 border-t border-slate-100 space-y-1">
                  <button
                    onClick={() => {
                      setIsGroupDropdownOpen(false);
                      setIsCreateWorkspaceModalOpen(true);
                    }}
                    className="w-full p-2 rounded-lg hover:bg-blue-50 text-left flex items-center space-x-2 text-brand-600 font-bold"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>+ Tạo Nhóm / Workspace Mới</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsGroupDropdownOpen(false);
                      setIsInviteWorkspaceModalOpen(true);
                    }}
                    className="w-full p-2 rounded-lg hover:bg-slate-50 text-left flex items-center space-x-2 text-slate-700 font-medium"
                  >
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Quản lý & Mời thành viên...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Switch Role Tabs */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium space-x-1">
            <button
              onClick={() => {
                setCurrentRole('writer');
                showToast('Chuyển sang Writer Studio');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'writer'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Writer</span>
            </button>

            <button
              onClick={() => {
                setCurrentRole('reviewer');
                showToast('Chuyển sang Reviewer QA');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'reviewer'
                  ? 'bg-white text-amber-600 shadow-xs ring-2 ring-amber-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Reviewer</span>
            </button>

            <button
              onClick={() => {
                setCurrentRole('producer');
                showToast('Chuyển sang Producer Studio (Tạo Video)');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'producer'
                  ? 'bg-white text-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Producer (Tạo Video)</span>
            </button>

            <button
              onClick={() => {
                setCurrentRole('admin');
                showToast('Chuyển sang Admin Portal');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'admin'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-500" />
              <span>Admin Portal</span>
            </button>
          </div>

          <button
            onClick={() => {
              setCurrentRole('library');
              showToast('Mở Thư Viện Media');
            }}
            className={`px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              currentRole === 'library' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-slate-700'
            }`}
          >
            <Library className="w-3.5 h-3.5 text-indigo-600" />
            <span>Thư Viện Media</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <div className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-brand-700 border border-blue-200 flex items-center space-x-1.5">
            <span>Vai trò: {currentRole === 'producer' ? 'Producer (Dựng Video)' : currentRole === 'writer' ? 'Writer (Biên kịch)' : currentRole === 'reviewer' ? 'Reviewer (Thẩm định)' : 'Admin'}</span>
          </div>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              NA
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">Nguyễn Văn A</div>
              <div className="text-[10px] text-slate-400">nguyen.vana@edtech.vn</div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 🎬 MÀN HÌNH 1: REMOTION PRODUCTION STUDIO (PRODUCER - TẠO & DỰNG VIDEO THẬT) */}
      {/* ========================================================================= */}
      {currentRole === 'producer' && (
        <section className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-white border-b px-6 py-2.5 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                PRODUCER WORKSPACE
              </span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-sm text-slate-900">{script.title}</span>
              <span className="text-slate-500 font-mono text-[11px]">• {script.scenes.length} Scenes Remotion 4.0</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSwapAssetModalOpen(true)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center space-x-1 shadow-xs"
              >
                <Image className="w-3.5 h-3.5 text-indigo-600" />
                <span>Đổi Tài Nguyên STEM</span>
              </button>
              <button
                onClick={() => showToast('Đã đồng bộ giọng đọc AI FPT.AI và tạo phụ đề Whisper!')}
                className="px-3 py-1.5 bg-blue-50 text-brand-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 flex items-center space-x-1"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Tạo Giọng FPT.AI & Whisper</span>
              </button>
              <button
                onClick={startRenderMock}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Kết Xuất MP4 (BullMQ Queue)</span>
              </button>
            </div>
          </div>

          {/* 3 Cột: Cột Trái (Scenes list) - Cột Giữa (Remotion Player Thật) - Cột Phải (Live Props Inspector) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Cột 1: Danh sách cảnh */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">
                  Cấu trúc phân cảnh ({script.scenes.length})
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 font-mono">Remotion 4.0</span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {script.scenes.map((sc, idx) => {
                  const isActive = sc.id === selectedScene.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => setActiveSceneId(sc.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isActive
                          ? 'bg-indigo-50/80 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          0{idx + 1}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {Math.round((sc.durationInFrames || 150) / 30)}s
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{sc.title}</h4>
                      <span className="text-[10px] font-mono text-indigo-600 font-medium block mt-1">
                        {sc.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Cột 2: LIVE REMOTION PLAYER CANVAS (Không hardcode text, chạy player thật!) */}
            <main className="flex-1 bg-slate-900 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="w-full max-w-3xl mx-auto space-y-4">
                <RemotionPlayerWrapper
                  script={script}
                  activeSceneId={selectedScene.id}
                  onSceneChange={(id) => setActiveSceneId(id)}
                />

                {/* BullMQ Render Progress Simulator (Khi bấm Kết Xuất MP4) */}
                {isRendering && (
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs text-white animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-brand-400 animate-spin" />
                        <span>{renderStageText}</span>
                      </span>
                      <span className="font-mono text-brand-400 font-bold">{renderPercentageText}</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                      <span>Job ID: #BULL-RENDER-9812</span>
                      <span>Node Worker: GPU NVIDIA A10G (1080p60)</span>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Cột 3: LIVE PROPS INSPECTOR (Sửa công thức KaTeX, tiêu đề, voiceover là canvas bên trái đổi theo thời gian thực!) */}
            <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">Thuộc Tính Cảnh (Live Inspector)</h3>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {selectedScene.id}</span>
                  </div>
                  <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedScene.type}
                  </span>
                </div>

                {/* Tiêu đề phân cảnh */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tiêu đề phân cảnh:</label>
                  <input
                    type="text"
                    value={selectedScene.title}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, title: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Lời thoại Thuyết minh */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Lời thoại đọc (TTS Voiceover):</span>
                    <span className="text-[10px] text-slate-400">Đồng bộ giọng đọc</span>
                  </label>
                  <textarea
                    rows={3}
                    value={selectedScene.narration}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, narration: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* DYNAMIC SCENE PROPERTIES BINDING THEO TỪNG TYPE */}
                {selectedScene.type === 'MATH_FORMULA' && (
                  <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                    <span className="font-bold text-blue-900 block text-[11px]">
                      Mã KaTeX / LaTeX chính:
                    </span>
                    <textarea
                      rows={2}
                      value={(selectedScene as any).latex}
                      onChange={(e) => updateSceneProperty((s) => ({ ...s, latex: e.target.value }))}
                      className="w-full p-2 border border-blue-300 rounded-lg font-mono text-xs text-blue-800 bg-white"
                    />
                    <p className="text-[10px] text-blue-600">
                      * Công thức KaTeX hiển thị trực tiếp trên khung video bên cạnh!
                    </p>
                  </div>
                )}

                {selectedScene.type === 'DATA_CHART' && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-900 block text-[11px]">
                      Điểm dữ liệu Biểu đồ (Data Points):
                    </span>
                    {(selectedScene as any).dataPoints?.map((dp: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dp.label}
                          onChange={(e) => {
                            const newPts = [...(selectedScene as any).dataPoints];
                            newPts[i].label = e.target.value;
                            updateSceneProperty((s) => ({ ...s, dataPoints: newPts }));
                          }}
                          className="flex-1 p-1.5 border border-slate-200 rounded text-xs bg-white"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={dp.value}
                          onChange={(e) => {
                            const newPts = [...(selectedScene as any).dataPoints];
                            newPts[i].value = parseFloat(e.target.value) || 0;
                            updateSceneProperty((s) => ({ ...s, dataPoints: newPts }));
                          }}
                          className="w-16 p-1.5 border border-slate-200 rounded text-xs font-mono text-right bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {selectedScene.type === 'ALGORITHM_WALKTHROUGH' && (
                  <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2">
                    <span className="font-bold text-emerald-400 block text-[11px] font-mono">
                      Mã nguồn thuật toán ({ (selectedScene as any).language }):
                    </span>
                    <textarea
                      rows={4}
                      value={(selectedScene as any).codeSnippet}
                      onChange={(e) => updateSceneProperty((s) => ({ ...s, codeSnippet: e.target.value }))}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-emerald-300"
                    />
                  </div>
                )}

                {/* Chọn Giọng Đọc FPT.AI */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-800 block text-[11px] flex items-center space-x-1">
                    <Mic className="w-3.5 h-3.5 text-brand-600" />
                    <span>Giọng Đọc TTS Engine:</span>
                  </span>
                  <select className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white">
                    <option>FPT.AI - Ban Mai (Nữ miền Bắc chuẩn)</option>
                    <option>FPT.AI - Nam Minh (Nam miền Bắc)</option>
                    <option>ElevenLabs Multilingual v2</option>
                  </select>
                </div>

                <button
                  onClick={() => setIsSwapAssetModalOpen(true)}
                  className="w-full py-2 border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <Layers className="w-4 h-4" />
                  <span>Chọn Tài Nguyên Đồ Họa STEM</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={startRenderMock}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Đẩy Render Job Lên BullMQ</span>
                </button>
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MÀN HÌNH 2: REVIEWER QA WORKSPACE (CẢ THẨM ĐỊNH VIDEO LẪN KỊCH BẢN) */}
      {/* ========================================================================= */}
      {currentRole === 'reviewer' && (
        <section className="flex-1 flex flex-col">
          <div className="bg-white border-b px-6 py-2.5 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                REVIEWER QA WORKSPACE
              </span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-sm text-slate-900">{script.title}</span>
              <span className="text-slate-400 font-mono text-[11px]">• Thẩm định video & Ghim phản biện</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setScript((prev) => ({ ...prev, scriptStatus: 'CHANGE_REQUESTED' }));
                  showToast('Đã gửi yêu cầu chỉnh sửa lại cho Writer!', 'warn');
                }}
                className="px-3.5 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yêu Cầu Sửa Lại</span>
              </button>
              <button
                onClick={() => {
                  setScript((prev) => ({ ...prev, videoStatus: 'APPROVED', scriptStatus: 'APPROVED' }));
                  showToast('Đã phê duyệt video hoàn chỉnh để xuất bản LMS!');
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Phê Duyệt Video Xuất Bản</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Cột Trái: Remotion Player trực tiếp để Reviewer thẩm định từng frame */}
            <main className="flex-1 bg-slate-900 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="w-full max-w-3xl mx-auto space-y-4">
                <RemotionPlayerWrapper
                  script={script}
                  seekTimestampSec={seekTimestampSec}
                  onFrameUpdate={(_f, s) => setCurrentSec(s)}
                />
              </div>
            </main>

            {/* Cột Phải: Ghi chú phản biện theo mốc thời gian */}
            <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-slate-900">Ghi Chú Mốc Thời Gian ({comments.length})</h3>
                  </div>
                  <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {Math.floor(currentSec / 60).toString().padStart(2, '0')}:{(Math.floor(currentSec) % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Danh sách bình luận */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {comments.map((cm) => (
                    <div
                      key={cm.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-purple-700 bg-white px-1.5 py-0.5 rounded border text-[10px]">
                          ⏱ {Math.floor(cm.timestampSec / 60).toString().padStart(2, '0')}:{(Math.floor(cm.timestampSec) % 60).toString().padStart(2, '0')}
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
                <form onSubmit={handleAddComment} className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
                  <span className="font-bold text-purple-900 block text-[11px]">
                    Ghim nhận xét tại giây thứ {Math.round(currentSec)}:
                  </span>
                  <textarea
                    rows={2}
                    value={newCommentInput}
                    onChange={(e) => setNewCommentInput(e.target.value)}
                    placeholder="Nhập lỗi sai hoặc điểm cần lưu ý..."
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* ✍️ MÀN HÌNH 3: WRITER STUDIO */}
      {/* ========================================================================= */}
      {currentRole === 'writer' && (
        <section className="flex-1 flex flex-col">
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-brand-700 font-bold border border-blue-200">
                WRITER SCRIPT STUDIO
              </span>
              <span className="text-slate-300">/</span>
              <h1 className="text-sm font-bold text-slate-900">{script.title}</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{script.gradeLevel}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setIsVersionDiffModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-1"
              >
                <GitCompare className="w-3.5 h-3.5 text-brand-600" />
                <span>So Sánh Lịch Sử (Diff)</span>
              </button>
              <button
                onClick={() => {
                  setScript((prev) => ({ ...prev, scriptStatus: 'IN_REVIEW' }));
                  showToast('Đã gửi kịch bản sang Reviewer để thẩm định!');
                }}
                className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Kịch Bản Xin Duyệt</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Cột 1: Cấu trúc cảnh */}
            <aside className="w-72 bg-white border-r border-slate-200 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">Cấu trúc cảnh ({script.scenes.length})</span>
                <span className="font-semibold text-brand-600">{script.totalDurationSeconds}s</span>
              </div>
              <div className="space-y-2">
                {script.scenes.map((sc, i) => (
                  <div
                    key={sc.id}
                    onClick={() => setActiveSceneId(sc.id)}
                    className={`p-3 rounded-lg border cursor-pointer text-xs space-y-1 ${
                      sc.id === selectedScene.id ? 'bg-blue-50 border-brand-400 font-semibold' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>Cảnh 0{i + 1}</span>
                      <span className="text-slate-400">{Math.round((sc.durationInFrames || 150) / 30)}s</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{sc.title}</p>
                  </div>
                ))}
              </div>
            </aside>

            {/* Cột 2: Soạn thảo */}
            <main className="flex-1 bg-slate-50 p-6 overflow-y-auto flex justify-center">
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xs p-6 flex flex-col space-y-5">
                <div className="border-b pb-3 flex justify-between items-center">
                  <h2 className="text-base font-bold text-slate-900">{selectedScene.title}</h2>
                  <span className="text-xs font-mono text-slate-400">{selectedScene.type}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <Mic className="w-3.5 h-3.5 text-brand-600" />
                    <span>Lời thoại Thuyết minh (TTS Audio Script):</span>
                  </label>
                  <textarea
                    rows={6}
                    value={selectedScene.narration}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, narration: e.target.value }))}
                    className="w-full text-sm text-slate-800 p-3 border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </main>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MÀN HÌNH 4: ADMIN PORTAL */}
      {/* ========================================================================= */}
      {currentRole === 'admin' && (
        <main className="flex-1 bg-slate-50 p-6 flex flex-col">
          <div className="max-w-6xl w-full mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Bảng Quản Trị Hệ Thống (Admin Control Center)</h1>
                <p className="text-xs text-slate-500 mt-1">Phân quyền RBAC, quản lý tổ bộ môn và mã nhúng LMS.</p>
              </div>
              <button
                onClick={() => setIsInviteWorkspaceModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Cấp Quyền Thành Viên Mới</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Thành viên trong Tổ bộ môn ({SAMPLE_MEMBERS.length})</h2>
              <div className="divide-y divide-slate-100 text-xs">
                {SAMPLE_MEMBERS.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{m.avatar}</span>
                      <div>
                        <div className="font-bold text-slate-800">{m.name}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{m.email}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-700 font-medium border border-blue-200">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 📚 MÀN HÌNH 5: THƯ VIỆN MEDIA STEM */}
      {/* ========================================================================= */}
      {currentRole === 'library' && (
        <main className="flex-1 bg-slate-50 p-6 flex flex-col">
          <div className="max-w-6xl w-full mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex justify-between items-center">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Thư Viện Clip STEM Nội Bộ (Media Library)</h1>
                <p className="text-xs text-slate-500 mt-1">Kho video bài giảng STEM đã duyệt, sẵn sàng nhúng vào LMS hoặc chia sẻ.</p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5"
              >
                <Code className="w-4 h-4" />
                <span>Xem Mã Nhúng LMS</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="aspect-video bg-gradient-to-br from-blue-900 to-indigo-950 p-4 text-white flex flex-col justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 w-fit">{script.subject} • {script.gradeLevel}</span>
                  <div className="font-bold text-base">{script.title}</div>
                  <span className="text-[11px] text-slate-400">Thời lượng: ~{script.totalDurationSeconds}s</span>
                </div>
                <div className="p-4 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-bold">✓ Đã xuất bản LMS</span>
                  <button
                    onClick={() => setIsPublishModalOpen(true)}
                    className="px-3 py-1.5 bg-brand-50 text-brand-700 font-bold rounded-lg hover:bg-brand-100"
                  >
                    Lấy mã iFrame
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* MODALS PHỤ TRỢ */}
      {/* ========================================================================= */}
      {isInviteWorkspaceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <UserPlus className="w-4 h-4 text-brand-600" />
                <span>Mời Thành Viên Vào Nhóm</span>
              </h3>
              <button onClick={() => setIsInviteWorkspaceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Thành Viên:</label>
                <input
                  type="email"
                  placeholder="dongnghiep@edtech.vn"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vai Trò:</label>
                <select className="w-full p-2 border border-slate-200 rounded-lg bg-white">
                  <option>Writer (Biên kịch kịch bản)</option>
                  <option>Reviewer (Thẩm định học thuật & clip)</option>
                  <option>Producer (Dựng video Remotion)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsInviteWorkspaceModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setIsInviteWorkspaceModalOpen(false);
                  showToast('Đã gửi thư mời tham gia nhóm thành công!');
                }}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-xs"
              >
                Gửi Lời Mời
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MÃ NHÚNG LMS */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>Mã Nhúng LMS & Xuất Bản Video</span>
              </h3>
              <button onClick={() => setIsPublishModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mã thẻ iFrame tích hợp vào Canvas / Moodle:</label>
              <textarea
                readOnly
                rows={4}
                defaultValue={`<iframe src="https://stemotion.edu.vn/embed/${script.id}" width="100%" height="540" frameborder="0" allowfullscreen></iframe>`}
                className="w-full p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe src="https://stemotion.edu.vn/embed/${script.id}" width="100%" height="540" frameborder="0" allowfullscreen></iframe>`);
                  showToast('Đã sao chép mã nhúng LMS vào bộ nhớ tạm!');
                  setIsPublishModalOpen(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
              >
                Sao Chép Mã Nhúng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ĐỔI TÀI NGUYÊN ĐỒ HỌA STEM */}
      {isSwapAssetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Image className="w-4 h-4 text-indigo-600" />
                <span>Kho Tài Nguyên Đồ Họa STEM</span>
              </h3>
              <button onClick={() => setIsSwapAssetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div
                onClick={() => {
                  setIsSwapAssetModalOpen(false);
                  showToast('Đã áp dụng Sơ đồ Parabol Tương Tác!');
                }}
                className="p-3 border rounded-xl hover:border-brand-500 hover:bg-blue-50 cursor-pointer text-center space-y-1.5"
              >
                <div className="h-16 bg-slate-100 rounded-lg flex items-center justify-center font-mono text-xs text-brand-600 font-bold">
                  SVG Parabol
                </div>
                <div className="font-bold text-slate-800 text-[11px]">Đồ thị Parabol</div>
              </div>

              <div
                onClick={() => {
                  setIsSwapAssetModalOpen(false);
                  showToast('Đã áp dụng Mô hình Nguyên tử vào Scene!');
                }}
                className="p-3 border rounded-xl hover:border-brand-500 hover:bg-blue-50 cursor-pointer text-center space-y-1.5"
              >
                <div className="h-16 bg-slate-100 rounded-lg flex items-center justify-center font-mono text-xs text-purple-600 font-bold">
                  Atom 3D
                </div>
                <div className="font-bold text-slate-800 text-[11px]">Mô hình Hóa Học</div>
              </div>

              <div
                onClick={() => {
                  setIsSwapAssetModalOpen(false);
                  showToast('Đã áp dụng Biểu đồ Cột Số liệu vào Scene!');
                }}
                className="p-3 border rounded-xl hover:border-brand-500 hover:bg-blue-50 cursor-pointer text-center space-y-1.5"
              >
                <div className="h-16 bg-slate-100 rounded-lg flex items-center justify-center font-mono text-xs text-emerald-600 font-bold">
                  Bar Chart
                </div>
                <div className="font-bold text-slate-800 text-[11px]">Biểu đồ Dữ liệu</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SO SÁNH DIFF PHIÊN BẢN */}
      {isVersionDiffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <GitCompare className="w-4 h-4 text-brand-600" />
                <span>So Sánh Lịch Sử Phiên Bản (Diff v1.1 vs v1.2)</span>
              </h3>
              <button onClick={() => setIsVersionDiffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-lg font-bold text-slate-700 border">
                <div>BẢN KHỞI TẠO (v1.1)</div>
                <div>BẢN ĐÃ CẬP NHẬT (v1.2)</div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border text-xs leading-relaxed">
                <div className="text-slate-500">
                  <span className="badge-diff-del px-1 rounded">Khi đó tổng hai nghiệm x1 + x2 bằng trừ b trên a</span>
                </div>
                <div className="text-slate-800">
                  <span className="badge-diff-add px-1 rounded font-semibold">Điều kiện tiên quyết là biệt thức delta phải lớn hơn hoặc bằng không để phương trình có nghiệm.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsVersionDiffModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
