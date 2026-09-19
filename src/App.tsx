import React, { useState, useEffect } from 'react';
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
  ShieldAlert,
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
  Zap,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Navigation Screens:
  // 'login' | 'dashboard-writer' | 'screen-writer' | 'dashboard-reviewer' | 'screen-reviewer' | 'screen-clip-review' | 'dashboard-producer' | 'screen-production' | 'dashboard-admin' | 'screen-library'
  // Default to 'screen-production' (TẠO & DỰNG VIDEO REMOTION) as user requested!
  const [currentScreen, setCurrentScreen] = useState<string>('screen-production');
  const [currentRole, setCurrentRole] = useState<'writer' | 'reviewer' | 'producer' | 'admin'>('producer');

  // Workspace state
  const [activeGroup, setActiveGroup] = useState({ name: 'Nhóm STEM THCS Tân Bình', code: 'Gr-01' });
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  // Modals state
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [isInviteWorkspaceModalOpen, setIsInviteWorkspaceModalOpen] = useState(false);
  const [isVersionDiffModalOpen, setIsVersionDiffModalOpen] = useState(false);
  const [isSwapAssetModalOpen, setIsSwapAssetModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Toast notification state
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'info' | 'warn' }[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Producer Studio state
  const [producerActiveScene, setProducerActiveScene] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderPercentageText, setRenderPercentageText] = useState<string>('0%');
  const [renderStageText, setRenderStageText] = useState<string>('Khởi động BullMQ Worker...');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [clipCurrentTime, setClipCurrentTime] = useState<string>('00:25');

  // Scene data in Producer Studio
  const [scenes, setScenes] = useState([
    { id: 1, name: 'Scene 1: Tiêu đề & Đặt vấn đề', template: 'TitleHeroReveal.tsx', duration: '15s', color: '#3B82F6', title: 'ĐỊNH LÝ VI-ÉT', subtitle: 'Toán Học Khối 9 Trực Quan', transition: 'fade' },
    { id: 2, name: 'Scene 2: Công thức Vi-ét', template: 'MathFormulaStep.tsx', duration: '20s', color: '#10B981', title: 'CÔNG THỨC VI-ÉT', subtitle: 'x₁ + x₂ = -b/a  |  x₁·x₂ = c/a', transition: 'slide' },
    { id: 3, name: 'Scene 3: Đồ thị Parabol', template: 'DiagramExplainer.tsx', duration: '20s', color: '#8B5CF6', title: 'MINH HỌA PARABOL', subtitle: 'Tọa độ giao điểm với trục hoành Ox', transition: 'zoom' },
    { id: 4, name: 'Scene 4: Quiz phản xạ 3s', template: 'STEMQuizCard.tsx', duration: '15s', color: '#F59E0B', title: 'BÀI TẬP PHẢN XẠ 3S', subtitle: 'Tìm hai số biết tổng bằng 5 và tích bằng 6', transition: 'wipe' },
    { id: 5, name: 'Scene 5: Tổng kết & Outro', template: 'OutroCard.tsx', duration: '15s', color: '#EC4899', title: 'TỔNG KẾT BÀI HỌC', subtitle: 'Đón xem bài tiếp theo trên STEMotion!', transition: 'fade' },
  ]);

  const activeSceneObj = scenes.find((s) => s.id === producerActiveScene) || scenes[0];

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
        setRenderProgress(100);
        setRenderPercentageText('100%');
        setRenderStageText('Hoàn tất kết xuất! Clip đã sẵn sàng duyệt QA.');
        showToast('Kết xuất video MP4 thành công! Đã gửi sang Reviewer.', 'success');
      } else {
        setRenderProgress(current);
        setRenderPercentageText(`${current}%`);
      }
    }, 400);
  };

  // Switch role handler
  const handleRoleSwitch = (role: 'writer' | 'reviewer' | 'producer' | 'admin') => {
    setCurrentRole(role);
    if (role === 'producer') setCurrentScreen('screen-production');
    else if (role === 'writer') setCurrentScreen('dashboard-writer');
    else if (role === 'reviewer') setCurrentScreen('dashboard-reviewer');
    else if (role === 'admin') setCurrentScreen('dashboard-admin');
    showToast(`Đã chuyển sang vai trò: ${role.toUpperCase()}`, 'info');
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

      {/* TOPBAR CHUNG CỦA HỆ THỐNG */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div
            onClick={() => setCurrentScreen('screen-production')}
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

        {/* Quick Switch Role Tabs & Media Library Button */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium space-x-1">
            <button
              onClick={() => handleRoleSwitch('writer')}
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
              onClick={() => handleRoleSwitch('reviewer')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'reviewer'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Reviewer</span>
            </button>

            <button
              onClick={() => handleRoleSwitch('producer')}
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
              onClick={() => handleRoleSwitch('admin')}
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
            onClick={() => setCurrentScreen('screen-library')}
            className={`px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              currentScreen === 'screen-library' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-slate-700'
            }`}
          >
            <Library className="w-3.5 h-3.5 text-indigo-600" />
            <span>Thư Viện Media</span>
          </button>
        </div>

        {/* User Profile & Quick Actions */}
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
            <button
              onClick={() => setCurrentScreen('login')}
              title="Đăng xuất"
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 🎬 MÀN HÌNH CHÍNH: REMOTION PRODUCTION STUDIO (TẠO & DỰNG VIDEO REMOTION) */}
      {/* ========================================================================= */}
      {currentScreen === 'screen-production' && (
        <section className="flex-1 flex flex-col">
          {/* Top Studio Bar */}
          <div className="bg-white border-b px-6 py-2.5 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentScreen('dashboard-producer')}
                className="text-indigo-600 font-bold hover:underline flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Về Dashboard Producer</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-sm text-slate-900">Remotion Production Studio: Định lý Vi-ét (5 Scenes)</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSwapAssetModalOpen(true)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center space-x-1 shadow-xs"
              >
                <Image className="w-3.5 h-3.5 text-indigo-600" />
                <span>Đổi Tài Nguyên STEM (Swap Assets)</span>
              </button>
              <button
                onClick={() => showToast('Đã đồng bộ giọng đọc AI TTS và tạo phụ đề Whisper!')}
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

          {/* 3 CỘT: CẢNH ÁNH XẠ (TRÁI) - VIDEO PREVIEW CANVAS (GIỮA) - THUỘC TÍNH SCENE (PHẢI) */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* CỘT 1: DANH SÁCH CẢNH ÁNH XẠ REMOTION (LEFT) */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">Kịch bản ánh xạ Templates</span>
                <span className="text-[11px] font-semibold text-indigo-600">Remotion 4.0</span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {scenes.map((sc) => {
                  const isActive = sc.id === producerActiveScene;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => setProducerActiveScene(sc.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isActive
                          ? 'bg-indigo-50/70 border-indigo-400 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          0{sc.id}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{sc.duration}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{sc.name}</h4>
                      <span className="text-[10px] font-mono text-indigo-600 font-medium block mt-1">
                        {sc.template}
                      </span>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* CỘT 2: PREVIEW CANVAS TRỰC TIẾP & AUTO-CAPTIONS (CENTER) */}
            <main className="flex-1 bg-slate-900 p-6 flex flex-col items-center justify-between overflow-y-auto">
              <div className="w-full max-w-2xl aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative flex flex-col justify-between p-6 text-white text-center">
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 bg-white/10 rounded font-mono text-indigo-300">
                    {activeSceneObj.template}
                  </span>
                  <span className="font-mono">FPS: 60 • 1920x1080</span>
                </div>

                {/* Dynamic Graphic Simulation based on Scene */}
                <div className="my-auto py-6">
                  {producerActiveScene === 1 && (
                    <div className="space-y-3">
                      <h2 className="text-3xl font-extrabold text-blue-400">{activeSceneObj.title}</h2>
                      <div className="text-lg font-mono text-emerald-300">{activeSceneObj.subtitle}</div>
                      <div className="text-xs text-slate-400 mt-2">Chương trình GDPT Toán Học Lớp 9 Mới</div>
                    </div>
                  )}

                  {producerActiveScene === 2 && (
                    <div className="space-y-4">
                      <div className="text-xs uppercase font-mono text-emerald-400 font-bold">HỆ THỨC VI-ÉT CHÍNH XÁC</div>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl font-mono text-2xl text-emerald-300 inline-block">
                        x₁ + x₂ = −b / a &nbsp;&nbsp;|&nbsp;&nbsp; x₁ · x₂ = c / a
                      </div>
                      <p className="text-xs text-slate-400">Điều kiện có nghiệm: Δ = b² − 4ac ≥ 0</p>
                    </div>
                  )}

                  {producerActiveScene === 3 && (
                    <div className="space-y-3">
                      <div className="text-xs uppercase font-mono text-purple-400 font-bold">TỌA ĐỘ GIAO ĐIỂM PARABOL</div>
                      <div className="w-72 h-28 mx-auto bg-slate-950/80 border border-purple-500/30 rounded-xl flex items-center justify-center relative overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 200 80">
                          <line x1="10" y1="60" x2="190" y2="60" stroke="#64748b" strokeWidth="1.5" />
                          <line x1="100" y1="10" x2="100" y2="75" stroke="#64748b" strokeWidth="1.5" />
                          <path d="M 30 10 Q 100 80 170 10" fill="none" stroke="#a855f7" strokeWidth="3" />
                          <circle cx="58" cy="60" r="4" fill="#38bdf8" />
                          <circle cx="142" cy="60" r="4" fill="#38bdf8" />
                          <text x="58" y="74" fill="#38bdf8" fontSize="9" textAnchor="middle">x₁</text>
                          <text x="142" y="74" fill="#38bdf8" fontSize="9" textAnchor="middle">x₂</text>
                        </svg>
                      </div>
                      <div className="text-xs text-purple-300 font-mono">y = ax² + bx + c</div>
                    </div>
                  )}

                  {producerActiveScene === 4 && (
                    <div className="space-y-3 max-w-md mx-auto">
                      <div className="text-xs uppercase font-mono text-amber-400 font-bold">CÂU HỎI PHẢN XẠ STEM</div>
                      <h3 className="text-base font-bold text-slate-100">Tìm hai số biết Tổng S = 5 và Tích P = 6?</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 rounded bg-slate-800 text-slate-300 border border-slate-700">A. 1 và 4</div>
                        <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold">B. 2 và 3 ✓</div>
                      </div>
                    </div>
                  )}

                  {producerActiveScene === 5 && (
                    <div className="space-y-3">
                      <div className="text-xs uppercase font-mono text-rose-400 font-bold">TỔNG KẾT BÀI GIẢNG</div>
                      <h3 className="text-2xl font-bold text-slate-100">Cảm Ơn Các Em Đã Theo Dõi!</h3>
                      <p className="text-xs text-slate-300">Bài tiếp theo: Ứng dụng Vi-ét giải bài toán cực trị</p>
                    </div>
                  )}
                </div>

                {/* Subtitle Karaoke Display (Whisper Auto-Captions) */}
                <div className="bg-black/60 backdrop-blur-xs py-1.5 px-4 rounded-lg text-xs font-semibold text-yellow-300 border border-yellow-300/20 max-w-lg mx-auto">
                  <span className="text-white">Chào mừng các em học sinh lớp 9 </span>
                  <span className="underline decoration-yellow-400">đến với chuỗi bài giảng STEM Toán học!</span>
                </div>

                {/* Scrubber & Controls */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-2">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <span className="font-mono text-white">{clipCurrentTime}</span>
                    <span className="text-slate-600">/ 01:25</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">1080p60 • FPT.AI Voice</span>
                    <button className="hover:text-white"><Maximize className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>

              {/* BullMQ Render Progress Simulator (Visible when rendering) */}
              {isRendering && (
                <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-xl p-4 mt-4 text-xs text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-brand-400 animate-spin" />
                      <span>{renderStageText}</span>
                    </span>
                    <span className="font-mono text-brand-400 font-bold">{renderPercentageText}</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-500 h-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>Job ID: #BULL-RENDER-9812</span>
                    <span>GPU Server: Node-SG-01 (NVIDIA A10G)</span>
                  </div>
                </div>
              )}
            </main>

            {/* CỘT 3: TÙY BIẾN THUỘC TÍNH PHÂN CẢNH (SCENE PROPERTIES - RIGHT) */}
            <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">Thuộc Tính Cảnh (Scene Properties)</h3>
                  <span className="font-mono text-brand-600 font-bold">Scene {activeSceneObj.id}</span>
                </div>

                {/* Choose Remotion Template */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mẫu Giao Diện Remotion:</label>
                  <select
                    value={activeSceneObj.template.replace('.tsx', '')}
                    onChange={(e) => {
                      const newTemplate = `${e.target.value}.tsx`;
                      setScenes((prev) =>
                        prev.map((s) => (s.id === activeSceneObj.id ? { ...s, template: newTemplate } : s))
                      );
                      showToast(`Đã đổi mẫu giao diện thành ${newTemplate}`);
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none text-xs font-medium"
                  >
                    <option value="TitleHeroReveal">1. TitleHeroReveal (Tiêu đề)</option>
                    <option value="MathFormulaStep">2. MathFormulaStep (Công thức/Step reveal)</option>
                    <option value="DiagramExplainer">3. DiagramExplainer (Sơ đồ tương tác)</option>
                    <option value="DataChartVisual">4. DataChartVisual (Biểu đồ số liệu)</option>
                    <option value="AlgorithmWalkthrough">5. AlgorithmWalkthrough (Thuật toán)</option>
                    <option value="STEMQuizCard">6. STEMQuizCard (Quiz tương tác)</option>
                    <option value="OutroCard">7. OutroCard (Kết bài / Kêu gọi)</option>
                  </select>
                </div>

                {/* Transition selector */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hiệu ứng Chuyển Cảnh (Transition):</label>
                  <select
                    value={activeSceneObj.transition}
                    onChange={(e) => {
                      setScenes((prev) =>
                        prev.map((s) => (s.id === activeSceneObj.id ? { ...s, transition: e.target.value } : s))
                      );
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none text-xs"
                  >
                    <option value="fade">Fade Transition (Mờ dần)</option>
                    <option value="slide">Slide In Right (Trượt sang phải)</option>
                    <option value="zoom">Zoom Reveal (Phóng to kịch tính)</option>
                    <option value="wipe">Wipe Clockwise (Quét kim đồng hồ)</option>
                  </select>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Màu Chủ Đạo (Accent Theme):</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={activeSceneObj.color}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setScenes((prev) =>
                          prev.map((s) => (s.id === activeSceneObj.id ? { ...s, color: newColor } : s))
                        );
                      }}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={activeSceneObj.color}
                      readOnly
                      className="flex-1 px-2 py-1 border rounded text-slate-700 font-mono text-xs bg-slate-50"
                    />
                  </div>
                </div>

                {/* TTS Voice Selector */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-800 block text-[11px] flex items-center space-x-1">
                    <Mic className="w-3.5 h-3.5 text-brand-600" />
                    <span>Cấu hình Giọng Đọc (TTS Engine):</span>
                  </span>
                  <select className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white">
                    <option>FPT.AI - Ban Mai (Nữ miền Bắc chuẩn)</option>
                    <option>FPT.AI - Nam Minh (Nam miền Bắc truyền cảm)</option>
                    <option>FPT.AI - Lan Nhi (Nữ miền Nam)</option>
                    <option>ElevenLabs Multilingual v2</option>
                  </select>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Tốc độ đọc: 1.0x</span>
                    <span className="text-emerald-600 font-semibold">Tự đồng bộ Whisper Captions</span>
                  </div>
                </div>

                {/* Button swap assets */}
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
      {/* 📝 DASHBOARD WRITER & SOẠN THẢO */}
      {/* ========================================================================= */}
      {currentScreen === 'dashboard-writer' && (
        <main className="flex-1 bg-slate-50 p-6 flex flex-col">
          <div className="max-w-6xl w-full mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-extrabold text-slate-900">Bảng điều khiển Biên kịch (Script Studio)</h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-700 font-bold border border-blue-200">Không gian Nhóm</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Bạn đang làm việc trong: <strong className="text-slate-800">{activeGroup.name}</strong>. Tạo kịch bản mới cho 5 môn (Toán, Lý, Hóa, Sinh, Tin).
                </p>
              </div>
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Tạo Dự Án Kịch Bản Mới</span>
              </button>
            </div>

            {/* Project List Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Danh sách Kịch bản trong Nhóm</h2>
                <span className="text-xs text-slate-400">Chọn kịch bản để vào Studio soạn thảo, gọi AI và theo dõi phản hồi Reviewer</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Tên Dự Án Kịch Bản</th>
                      <th className="px-4 py-3">Môn & Khối Lớp</th>
                      <th className="px-4 py-3">Thời Lượng</th>
                      <th className="px-4 py-3">Trạng Thái (State)</th>
                      <th className="px-4 py-3">Góp Ý Reviewer</th>
                      <th className="px-6 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">Định lý Vi-ét và Ứng dụng giải toán</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Mã kịch bản: #SCR-MATH9-001 • 5 phân cảnh</div>
                      </td>
                      <td className="px-4 py-4"><span className="px-2 py-0.5 rounded bg-blue-50 text-brand-700 font-medium">Toán • Lớp 9</span></td>
                      <td className="px-4 py-4 font-mono font-medium">~85s</td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200 inline-flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>CHANGE_REQUESTED (v1.1)</span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-amber-800 font-semibold flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>1 nhận xét cần sửa</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setCurrentScreen('screen-writer')}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
                        >
                          Mở Sửa Kịch Bản →
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* ✍️ SOẠN THẢO KỊCH BẢN VỚI AI SCRIPT INTELLIGENCE (WRITER STUDIO) */}
      {/* ========================================================================= */}
      {currentScreen === 'screen-writer' && (
        <section className="flex-1 flex flex-col">
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentScreen('dashboard-writer')}
                className="text-brand-600 text-xs font-bold hover:underline flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Về Dashboard Writer</span>
              </button>
              <span className="text-slate-300">/</span>
              <h1 className="text-sm font-bold text-slate-900">Định lý Vi-ét và Ứng dụng giải toán</h1>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200">Toán • Lớp 9</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Bản nháp v1.2 (Đang sửa)</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setIsVersionDiffModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-1"
              >
                <GitCompare className="w-3.5 h-3.5 text-brand-600" />
                <span>So Sánh Lịch Sử (Diff v1.1 vs v1.2)</span>
              </button>
              <button
                onClick={() => showToast('Đã lưu nháp kịch bản thành công!')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
              >
                Lưu nháp
              </button>
              <button
                onClick={() => {
                  showToast('Đã nộp lại bản kịch bản cho Reviewer!');
                  setCurrentScreen('dashboard-writer');
                }}
                className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp Lại Bản Đã Sửa (Resubmit)</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Cột 1: Danh sách cảnh */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">Cấu trúc cảnh (5)</span>
                <span className="font-semibold text-brand-600">Tổng ~85s</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {scenes.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-brand-400 bg-white cursor-pointer text-xs space-y-1"
                  >
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{sc.name.split(':')[0]}</span>
                      <span className="text-slate-400">{sc.duration}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{sc.title}</p>
                  </div>
                ))}
              </div>
            </aside>

            {/* Cột 2: Soạn thảo */}
            <main className="flex-1 bg-slate-50 p-6 overflow-y-auto flex justify-center">
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xs p-6 flex flex-col space-y-5">
                <div className="border-b pb-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-brand-600 uppercase">Cảnh đang soạn thảo</span>
                    <h2 className="text-base font-bold text-slate-900">Scene 2: Phát biểu công thức & Điều kiện</h2>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">20 giây</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <Mic className="w-3.5 h-3.5 text-brand-600" />
                    <span>Lời thoại Thuyết minh (TTS Audio Script)</span>
                  </label>
                  <textarea
                    rows={6}
                    defaultValue="Cho phương trình bậc hai dạng chuẩn ax² + bx + c = 0. Điều kiện tiên quyết là biệt thức delta phải lớn hơn hoặc bằng không để phương trình có nghiệm. Khi đó, tổng hai nghiệm x1 + x2 bằng trừ b trên a, và tích hai nghiệm x1 nhân x2 bằng c trên a."
                    className="w-full text-sm text-slate-800 p-3 border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </main>

            {/* Cột 3: AI Script Intelligence */}
            <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs">
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

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => showToast('AI: Đã phân cảnh tự động 5 bước tối ưu!')}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition-all"
                  >
                    <Split className="w-4 h-4 text-emerald-600 mb-1" />
                    <div className="font-bold text-slate-800 text-[11px]">1. Phân Cảnh Tự Động</div>
                    <div className="text-[10px] text-slate-400">Gợi ý scenes & duration</div>
                  </button>

                  <button
                    onClick={() => showToast('AI: Độ khó đạt chuẩn Sách Giáo Khoa Lớp 9!')}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-blue-50/50 text-left transition-all"
                  >
                    <BarChart2 className="w-4 h-4 text-brand-600 mb-1" />
                    <div className="font-bold text-slate-800 text-[11px]">2. Chấm Độ Khó</div>
                    <div className="text-[10px] text-slate-400">Readability cho Lớp 9</div>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 📚 THƯ VIỆN MEDIA STEM CÔNG KHAI */}
      {/* ========================================================================= */}
      {currentScreen === 'screen-library' && (
        <main className="flex-1 bg-slate-50 p-6 flex flex-col">
          <div className="max-w-6xl w-full mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-extrabold text-slate-900">Thư Viện Clip STEM Nội Bộ (Media Library)</h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Đã Xuất Bản</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Kho lưu trữ video bài giảng STEM đã duyệt, xuất bản lên kênh YouTube Data API hoặc nhúng LMS / Moodle.
                </p>
              </div>
              <button
                onClick={() => setCurrentScreen('screen-production')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 self-start md:self-auto"
              >
                <Clapperboard className="w-4 h-4" />
                <span>Quay lại Studio Dựng Video →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="aspect-video bg-gradient-to-br from-blue-900 to-indigo-950 p-4 text-white flex flex-col justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 w-fit">Toán • Lớp 9</span>
                  <div className="font-bold text-base">Định lý Vi-ét và Ứng dụng giải toán</div>
                  <span className="text-[11px] text-slate-400">Thời lượng: 01:25</span>
                </div>
                <div className="p-4 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-bold">✓ Đã duyệt xuất bản</span>
                  <button
                    onClick={() => setIsPublishModalOpen(true)}
                    className="px-3 py-1.5 bg-brand-50 text-brand-700 font-bold rounded-lg hover:bg-brand-100"
                  >
                    Xem Mã Nhúng LMS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* ⚙️ DASHBOARD ADMIN */}
      {/* ========================================================================= */}
      {currentScreen === 'dashboard-admin' && (
        <main className="flex-1 bg-slate-50 p-6 flex flex-col">
          <div className="max-w-6xl w-full mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-extrabold text-slate-900">Bảng Quản Trị Hệ Thống (Admin Control Center)</h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">System Root</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Quản lý cấp quyền RBAC, giám sát chi phí OpenAI API, hàng đợi BullMQ và thư viện mẫu Remotion.</p>
              </div>
              <button
                onClick={() => setIsInviteWorkspaceModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Cấp Quyền Người Dùng Mới</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 🔐 MÀN HÌNH ĐĂNG NHẬP / CHỌN VAI TRÒ NHANH (LOGIN SCREEN) */}
      {/* ========================================================================= */}
      {currentScreen === 'login' && (
        <div className="fixed inset-0 bg-slate-100 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[560px]">
            {/* Cột Trái */}
            <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-2xl">
                    S
                  </div>
                  <span className="font-extrabold text-2xl tracking-tight">STEMotion</span>
                </div>
                <h2 className="text-2xl font-bold leading-snug">Hệ thống sản xuất clip STEM có hỗ trợ AI</h2>
                <p className="text-blue-100 text-xs mt-3 leading-relaxed">
                  Quy trình hoàn chỉnh: Admin cấp quyền RBAC ➔ Writer viết kịch bản với AI Intelligence ➔ Reviewer thẩm định kịch bản & clip ➔ Producer dựng Remotion Studio ➔ Xuất bản YouTube & Thư viện số.
                </p>
              </div>

              <div className="text-[11px] text-blue-200/80 mt-4">
                © 2026 STEMotion Platform • Capstone Project
              </div>
            </div>

            {/* Cột Phải */}
            <div className="p-8 flex flex-col justify-between bg-white">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Đăng nhập trải nghiệm</h3>
                <p className="text-xs text-slate-500 mb-4">Chọn vai trò trong hệ sinh thái STEMotion</p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <button
                    onClick={() => {
                      handleRoleSwitch('producer');
                      setCurrentScreen('screen-production');
                    }}
                    className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-left hover:bg-indigo-100 transition-all font-bold text-indigo-700"
                  >
                    <div>3. Producer (Dựng video)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Remotion Studio & Render</div>
                  </button>

                  <button
                    onClick={() => {
                      handleRoleSwitch('writer');
                      setCurrentScreen('dashboard-writer');
                    }}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-left hover:bg-blue-100 transition-all font-bold text-brand-700"
                  >
                    <div>1. Writer (Biên kịch)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Script Studio & AI</div>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setCurrentScreen('screen-production')}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs"
              >
                Vào Studio Dựng Video Ngay →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* MODAL: MỜI THÀNH VIÊN VÀO WORKSPACE */}
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
                <label className="font-bold text-slate-700 block mb-1">Phân Quyền Vai Trò (Role):</label>
                <select className="w-full p-2 border border-slate-200 rounded-lg bg-white">
                  <option>Writer (Biên kịch kịch bản)</option>
                  <option>Reviewer / Editor (Thẩm định học thuật & clip)</option>
                  <option>Producer (Dựng video Remotion)</option>
                  <option>Admin (Trưởng bộ môn)</option>
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

      {/* MODAL: ĐỔI TÀI NGUYÊN ĐỒ HỌA STEM (SWAP ASSETS) */}
      {isSwapAssetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Image className="w-4 h-4 text-indigo-600" />
                <span>Kho Tài Nguyên Đồ Họa STEM (Swap Assets)</span>
              </h3>
              <button onClick={() => setIsSwapAssetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div
                onClick={() => {
                  setIsSwapAssetModalOpen(false);
                  showToast('Đã áp dụng Sơ đồ Parabol Tương Tác vào Scene!');
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

      {/* MODAL: MÃ NHÚNG LMS & XUẤT BẢN */}
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
                defaultValue={`<iframe src="https://stemotion.edu.vn/embed/SCR-MATH9-001" width="100%" height="540" frameborder="0" allowfullscreen></iframe>`}
                className="w-full p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe src="https://stemotion.edu.vn/embed/SCR-MATH9-001" width="100%" height="540" frameborder="0" allowfullscreen></iframe>`);
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

      {/* MODAL: SO SÁNH DIFF PHIÊN BẢN */}
      {isVersionDiffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <GitCompare className="w-4 h-4 text-brand-600" />
                <span>So Sánh Lịch Sử (Diff v1.1 vs v1.2)</span>
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
