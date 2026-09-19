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
  Trash2,
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
  Sliders,
  FileText,
  Volume2
} from 'lucide-react';
import { RemotionPlayerWrapper } from './components/RemotionPlayerWrapper';
import { DEFAULT_SAMPLE_SCRIPT, SAMPLE_WORKSPACES, SAMPLE_MEMBERS, SAMPLE_COMMENTS } from './lib/sampleData';
import { STEMScript, WorkspaceMember, FeedbackComment, Workspace, SceneData, STEMSubject } from './types/stem';
import {
  authService,
  projectService,
  scriptService,
  renderService,
  reviewService,
  adminService,
  UserRole
} from './services';

export default function App() {
  // Navigation Role: 'producer' | 'writer' | 'reviewer' | 'admin' | 'library'
  const [currentRole, setCurrentRole] = useState<UserRole>(() => authService.getCurrentUser().role);

  const handleRoleChange = (role: UserRole) => {
    authService.switchRole(role);
    setCurrentRole(role);
  };

  // Multi-workspace state
  const [workspaces, setWorkspaces] = useState<Workspace[]>(SAMPLE_WORKSPACES);
  const [activeGroup, setActiveGroup] = useState({ name: 'Nhóm STEM THCS Tân Bình', code: 'Gr-01' });
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  // Central Dynamic Script State (Single Source of Truth)
  const [script, setScript] = useState<STEMScript>(DEFAULT_SAMPLE_SCRIPT);
  const [activeSceneId, setActiveSceneId] = useState<string>(script.scenes[0]?.id || 'scene_1');
  const [comments, setComments] = useState<FeedbackComment[]>(SAMPLE_COMMENTS);
  const [seekTimestampSec, setSeekTimestampSec] = useState<number | null>(null);
  const [currentSec, setCurrentSec] = useState(0);

  // AI Assistant Output State in Writer Studio
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    type: 'resegment' | 'grade' | 'extract' | 'terms' | null;
    title: string;
    details: string[];
  }>({
    type: 'grade',
    title: 'Độ khó sư phạm (Readability Analysis)',
    details: [
      'Chỉ số Flesch-Kincaid: 7.8 (Phù hợp học sinh lớp 9 THCS)',
      'Tốc độ đọc trung bình: 130 từ/phút (Chuẩn bài giảng video ngắn)',
      'Thuật ngữ chuyên ngành: 8 từ (Định lý, Biệt thức Delta, Hệ thức Vi-ét, Parabol...)',
      'Đánh giá: ĐẠT TIÊU CHUẨN SƯ PHẠM GDPT MỚI'
    ]
  });

  // Render Hub state
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

  // Dynamic Scene Updater (Live Props Binding via Service Layer)
  const updateSceneProperty = async (updater: (s: any) => any) => {
    const updated = await scriptService.updateScene(script, selectedScene.id, updater);
    setScript(updated);
  };

  // Add new scene dynamically via Service Layer
  const handleAddNewScene = async (type: SceneData['type'] = 'MATH_FORMULA') => {
    const { updatedScript, newScene } = await scriptService.addScene(script, type);
    setScript(updatedScript);
    setActiveSceneId(newScene.id);
    showToast(`Đã thêm Scene mới (${type}) vào kịch bản!`);
  };

  // Delete scene dynamically via Service Layer
  const handleDeleteScene = async (sceneId: string) => {
    if (script.scenes.length <= 1) {
      showToast('Video cần có ít nhất 1 phân cảnh!', 'warn');
      return;
    }
    const updatedScript = await scriptService.deleteScene(script, sceneId);
    setScript(updatedScript);
    setActiveSceneId(updatedScript.scenes[0].id);
    showToast('Đã xóa phân cảnh khỏi video.');
  };

  // Render Simulation with Real Stages
  const startRenderMock = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderPercentageText('0%');
    setRenderStageText('BullMQ: Đang gửi job render lên GPU Node...');
    showToast('Đã bắt đầu kết xuất Remotion Video MP4!', 'info');

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      if (current === 20) {
        setRenderStageText('Remotion: Đang render các khung hình KaTeX SVG...');
      } else if (current === 50) {
        setRenderStageText('FPT.AI TTS: Đang tổng hợp giọng thuyết minh tiếng Việt...');
      } else if (current === 80) {
        setRenderStageText('Whisper: Đang đồng bộ Karaoke Subtitles & FFmpeg...');
      }

      if (current >= 100) {
        clearInterval(interval);
        setIsRendering(false);
        setRenderProgress(100);
        setRenderPercentageText('100%');
        setRenderStageText('Kết xuất hoàn tất 1080p60!');
        setScript((prev) => ({ ...prev, videoStatus: 'IN_QA' }));
        showToast('Kết xuất video MP4 thành công! Clip đã chuyển sang Reviewer QA.', 'success');
      } else {
        setRenderProgress(current);
        setRenderPercentageText(`${current}%`);
      }
    }, 350);
  };

  // Reviewer add comment dynamically
  const [newCommentInput, setNewCommentInput] = useState('');

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;
    const newC = await reviewService.addComment(script.id, {
      author: 'ThS. Trần Thị B (Reviewer)',
      avatar: '👩‍🏫',
      role: 'Reviewer',
      timestampSec: Math.round(currentSec * 10) / 10,
      content: newCommentInput.trim(),
      status: 'OPEN',
      createdAt: 'Vừa xong',
    });
    setComments([newC, ...comments]);
    setNewCommentInput('');
    showToast(`Đã ghim nhận xét tại giây thứ ${Math.round(currentSec)}!`);
  };

  // Create Project Form State
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSubject, setNewProjSubject] = useState<STEMSubject>('Physics');
  const [newProjGrade, setNewProjGrade] = useState('Lớp 11');

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    const newScript = await projectService.createProject({
      title: newProjTitle.trim(),
      subject: newProjSubject,
      gradeLevel: newProjGrade,
    });

    setScript(newScript);
    setActiveSceneId(newScript.scenes[0]?.id || '');
    setIsCreateProjectModalOpen(false);
    setCurrentRole('producer'); // Jump immediately to Studio to see the new video!
    showToast(`Đã tạo dự án mới: "${newProjTitle}"! Đang mở Studio dựng video.`);
  };

  // AI Script Action Trigger in Writer Studio
  const handleTriggerAiAction = (action: 'resegment' | 'grade' | 'extract' | 'terms') => {
    if (action === 'resegment') {
      setAiAnalysisResult({
        type: 'resegment',
        title: 'Phân Cảnh Tự Động (AI Segment Optimization)',
        details: [
          'Gợi ý cấu trúc: 5 phân cảnh (Tối ưu cho video dưới 90 giây)',
          'Scene 1: Hook & Đặt vấn đề (15s)',
          'Scene 2: Khai triển công thức KaTeX trọng tâm (20s)',
          'Scene 3: Đồ thị / Sơ đồ tương tác thực tế (20s)',
          'Scene 4: Checkpoint Quiz phản xạ 3 giây (15s)',
          'Scene 5: Tóm tắt & Bài tập về nhà LMS (15s)'
        ]
      });
      showToast('AI: Đã tối ưu hóa lại phân cảnh và thời lượng từng Scene!');
    } else if (action === 'grade') {
      setAiAnalysisResult({
        type: 'grade',
        title: 'Chấm Điểm Độ Khó Sư Phạm (Readability)',
        details: [
          `Độ khó: Phù hợp chuẩn ${script.gradeLevel}`,
          'Chỉ số dễ hiểu: 82/100 (Học sinh tiếp thu nhanh)',
          'Độ dài câu trung bình: 14 từ (Tránh câu phức tạp gây khó hiểu)',
          'Khuyến nghị: Lời thoại rất trôi chảy, giọng đọc AI sẽ đọc tự nhiên.'
        ]
      });
      showToast('AI: Đã phân tích chỉ số đọc dễ hiểu cho học sinh!');
    } else if (action === 'extract') {
      setAiAnalysisResult({
        type: 'extract',
        title: 'Trích Xuất Khái Niệm STEM (Concept Tags)',
        details: [
          '#DinhLyViet',
          '#PhuongTrinhBacHai',
          '#BietThucDelta',
          '#ParabolOx',
          '#ToanHoc9_GDPT2018'
        ]
      });
      showToast('AI: Đã trích xuất các từ khóa khái niệm STEM cốt lõi!');
    } else if (action === 'terms') {
      setAiAnalysisResult({
        type: 'terms',
        title: 'Kiểm Tra Tính Nhất Quán Thuật Ngữ (Term Audit)',
        details: [
          'Thuật ngữ "Biệt thức Delta": Đồng nhất 100% giữa kịch bản và đồ họa.',
          'Ký hiệu nghiệm x1, x2: Chuẩn định dạng chỉ số dưới (Subscript).',
          'Không phát hiện mâu thuẫn ký hiệu toán học.'
        ]
      });
      showToast('AI: Đã quét tính nhất quán thuật ngữ khoa học!');
    }
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

            {/* Nút Mời Thành Viên */}
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
                      setIsCreateProjectModalOpen(true);
                    }}
                    className="w-full p-2 rounded-lg hover:bg-blue-50 text-left flex items-center space-x-2 text-brand-600 font-bold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Tạo Dự Án Kịch Bản Mới</span>
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
                handleRoleChange('writer');
                showToast('Chuyển sang Writer Studio');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'writer'
                  ? 'bg-white text-brand-600 shadow-xs ring-2 ring-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Writer</span>
            </button>

            <button
              onClick={() => {
                handleRoleChange('reviewer');
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
                handleRoleChange('producer');
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
                handleRoleChange('admin');
                showToast('Chuyển sang Admin Portal');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'admin'
                  ? 'bg-white text-rose-600 shadow-xs ring-2 ring-rose-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-500" />
              <span>Admin Portal</span>
            </button>
          </div>

          <button
            onClick={() => {
              handleRoleChange('library');
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
            <span>Vai trò: {currentRole === 'producer' ? 'Producer (Dựng Video)' : currentRole === 'writer' ? 'Writer (Biên kịch)' : currentRole === 'reviewer' ? 'Reviewer (Thẩm định)' : currentRole === 'admin' ? 'Admin (Quản trị)' : 'Khách xem'}</span>
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
      {/* 🎬 MÀN HÌNH 1: PRODUCER REMOTION STUDIO (TẠO & DỰNG VIDEO THẬT ĐỘNG 100%) */}
      {/* ========================================================================= */}
      {currentRole === 'producer' && (
        <section className="flex-1 flex flex-col">
          {/* Top Bar Studio */}
          <div className="bg-white border-b px-6 py-2.5 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                PRODUCER WORKSPACE
              </span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-sm text-slate-900">{script.title}</span>
              <span className="text-slate-500 font-mono text-[11px]">• {script.scenes.length} Scenes (Tổng: {script.totalDurationSeconds}s)</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="px-3 py-1.5 bg-blue-50 text-brand-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 flex items-center space-x-1 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Đề Tài Mới</span>
              </button>
              <button
                onClick={() => setIsSwapAssetModalOpen(true)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center space-x-1 shadow-xs"
              >
                <Image className="w-3.5 h-3.5 text-indigo-600" />
                <span>Đổi Tài Nguyên STEM</span>
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

          {/* 3 CỘT ĐỘNG: Cột Trái (Scenes list) - Cột Giữa (Remotion Player Live) - Cột Phải (Live Props Inspector) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Cột 1: Danh sách cảnh (Cho phép Click, Thêm mới, Xóa) */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">
                  Phân cảnh ({script.scenes.length})
                </span>
                <button
                  onClick={() => handleAddNewScene('MATH_FORMULA')}
                  className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Thêm Cảnh
                </button>
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
                          ? 'bg-indigo-50/90 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          0{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            {Math.round((sc.durationInFrames || 150) / 30)}s
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScene(sc.id);
                            }}
                            className="text-slate-300 hover:text-rose-600 transition-colors ml-1"
                            title="Xóa phân cảnh này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{sc.title}</h4>
                      <span className="text-[10px] font-mono text-indigo-600 font-medium block mt-1">
                        {sc.type}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-1.5">
                <button
                  onClick={() => handleAddNewScene('MATH_FORMULA')}
                  className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
                >
                  + Công Thức
                </button>
                <button
                  onClick={() => handleAddNewScene('DATA_CHART')}
                  className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
                >
                  + Biểu Đồ
                </button>
                <button
                  onClick={() => handleAddNewScene('STEM_QUIZ')}
                  className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
                >
                  + Quiz
                </button>
              </div>
            </aside>

            {/* Cột 2: LIVE REMOTION PLAYER (Chạy Animation, KaTeX thật) */}
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
                      <span>GPU Server: NVIDIA A10G (1080p60)</span>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Cột 3: LIVE PROPS INSPECTOR (Sửa công thức KaTeX, tiêu đề, số liệu là video bên trái đổi theo tức thì!) */}
            <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">Thuộc Tính Cảnh (Live Props)</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Scene ID: {selectedScene.id}</span>
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

                {/* Sửa công thức KaTeX nếu là MATH_FORMULA */}
                {selectedScene.type === 'MATH_FORMULA' && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                    <span className="font-bold text-blue-900 block text-[11px]">
                      Mã KaTeX / LaTeX công thức:
                    </span>
                    <textarea
                      rows={2}
                      value={(selectedScene as any).latex}
                      onChange={(e) => updateSceneProperty((s) => ({ ...s, latex: e.target.value }))}
                      className="w-full p-2 border border-blue-300 rounded-lg font-mono text-xs text-blue-800 bg-white"
                    />
                    <p className="text-[10px] text-blue-600">
                      * Nhập mã LaTeX (VD: <code>\sqrt&#123;...&#125;</code>, <code>x_1 + x_2 = -b/a</code>). Video bên cạnh hiển thị chuẩn xác ngay!
                    </p>
                  </div>
                )}

                {/* Sửa biểu đồ nếu là DATA_CHART */}
                {selectedScene.type === 'DATA_CHART' && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-900 block text-[11px]">
                      Số liệu các cột biểu đồ (Data Points):
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

                {/* Sửa Code nếu là ALGORITHM */}
                {selectedScene.type === 'ALGORITHM_WALKTHROUGH' && (
                  <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2">
                    <span className="font-bold text-emerald-400 block text-[11px] font-mono">
                      Mã nguồn thuật toán:
                    </span>
                    <textarea
                      rows={4}
                      value={(selectedScene as any).codeSnippet}
                      onChange={(e) => updateSceneProperty((s) => ({ ...s, codeSnippet: e.target.value }))}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-emerald-300"
                    />
                  </div>
                )}

                {/* Sửa Subtitle nếu là TITLE_HERO */}
                {selectedScene.type === 'TITLE_HERO' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mô tả phụ (Subtitle):</label>
                    <input
                      type="text"
                      value={(selectedScene as any).subtitle || ''}
                      onChange={(e) => updateSceneProperty((s) => ({ ...s, subtitle: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
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
      {/* 🔍 MÀN HÌNH 2: REVIEWER QA WORKSPACE (TIMELINE GHIM BÌNH LUẬN ĐỘNG) */}
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
                onClick={async () => {
                  await reviewService.submitReviewDecision(script.id, 'CHANGE_REQUESTED');
                  setScript((prev) => ({ ...prev, scriptStatus: 'CHANGE_REQUESTED' }));
                  showToast('Đã gửi yêu cầu chỉnh sửa lại cho Writer!', 'warn');
                }}
                className="px-3.5 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yêu Cầu Sửa Lại</span>
              </button>
              <button
                onClick={async () => {
                  await reviewService.submitReviewDecision(script.id, 'APPROVED');
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

            {/* Cột Phải: Ghi chú phản biện theo mốc thời gian (Thêm mới, Nhảy tới giây) */}
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

                {/* Danh sách bình luận động */}
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* ✍️ MÀN HÌNH 3: WRITER SCRIPT STUDIO (TÍCH HỢP AI INTELLIGENCE TƯƠNG TÁC THẬT) */}
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
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
                <span>+ Đề Tài Mới</span>
              </button>
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
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MÀN HÌNH 4: ADMIN PORTAL (QUẢN TRỊ VIÊN & TỔ BỘ MÔN) */}
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
      {/* 📌 MODAL TẠO DỰ ÁN KỊCH BẢN MỚI (TẠO CHỦ ĐỀ MỚI ĐỘNG 100%) */}
      {/* ========================================================================= */}
      {isCreateProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <PlusCircle className="w-4 h-4 text-brand-600" />
                <span>Tạo Dự Án Kịch Bản Video Mới</span>
              </h3>
              <button onClick={() => setIsCreateProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProject} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chủ đề bài học STEM:</label>
                <input
                  type="text"
                  required
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  placeholder="VD: Cân bằng phản ứng Oxi hóa khử, Định luật khúc xạ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Môn Học:</label>
                  <select
                    value={newProjSubject}
                    onChange={(e) => setNewProjSubject(e.target.value as STEMSubject)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Physics">Vật Lý (Physics)</option>
                    <option value="Math">Toán Học (Math)</option>
                    <option value="Chemistry">Hóa Học (Chemistry)</option>
                    <option value="Biology">Sinh Học (Biology)</option>
                    <option value="ComputerScience">Tin Học (Computer Science)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khối Lớp:</label>
                  <select
                    value={newProjGrade}
                    onChange={(e) => setNewProjGrade(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Lớp 9">Lớp 9</option>
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1"
                >
                  <span>Khởi Tạo & Mở Studio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MỜI THÀNH VIÊN VÀO WORKSPACE */}
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

      {/* ========================================================================= */}
      {/* MODAL: MÃ NHÚNG LMS */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* MODAL: ĐỔI TÀI NGUYÊN ĐỒ HỌA STEM */}
      {/* ========================================================================= */}
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
                  handleAddNewScene('MATH_FORMULA');
                  setIsSwapAssetModalOpen(false);
                  showToast('Đã chèn sơ đồ Toán học mới vào Scene!');
                }}
                className="p-3 border rounded-xl hover:border-brand-500 hover:bg-blue-50 cursor-pointer text-center space-y-1.5"
              >
                <div className="h-16 bg-slate-100 rounded-lg flex items-center justify-center font-mono text-xs text-brand-600 font-bold">
                  KaTeX Formula
                </div>
                <div className="font-bold text-slate-800 text-[11px]">Công Thức KaTeX</div>
              </div>

              <div
                onClick={() => {
                  handleAddNewScene('DATA_CHART');
                  setIsSwapAssetModalOpen(false);
                  showToast('Đã chèn Biểu đồ dữ liệu vào Scene!');
                }}
                className="p-3 border rounded-xl hover:border-brand-500 hover:bg-blue-50 cursor-pointer text-center space-y-1.5"
              >
                <div className="h-16 bg-slate-100 rounded-lg flex items-center justify-center font-mono text-xs text-emerald-600 font-bold">
                  Bar Chart
                </div>
                <div className="font-bold text-slate-800 text-[11px]">Biểu Đồ Cột Động</div>
              </div>

              <div
                onClick={() => {
                  handleAddNewScene('STEM_QUIZ');
                  setIsSwapAssetModalOpen(false);
                  showToast('Đã chèn Câu hỏi trắc nghiệm vào Scene!');
                }}
                className="p-3 border rounded-xl hover:border-brand-500 hover:bg-blue-50 cursor-pointer text-center space-y-1.5"
              >
                <div className="h-16 bg-slate-100 rounded-lg flex items-center justify-center font-mono text-xs text-amber-600 font-bold">
                  STEM Quiz
                </div>
                <div className="font-bold text-slate-800 text-[11px]">Thẻ Trắc Nghiệm</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SO SÁNH DIFF PHIÊN BẢN */}
      {/* ========================================================================= */}
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
