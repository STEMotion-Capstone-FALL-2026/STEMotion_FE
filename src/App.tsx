import React, { useState } from 'react';
import {
  Building,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Edit2,
  Copy,
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
  Youtube,
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
  Volume2,
  FlaskConical,
  Shapes,
} from 'lucide-react';
import { RemotionPlayerWrapper } from './components/RemotionPlayerWrapper';
import { DEFAULT_SAMPLE_SCRIPT, SAMPLE_WORKSPACES, SAMPLE_MEMBERS, SAMPLE_COMMENTS } from './lib/sampleData';
import { STEMScript, WorkspaceMember, FeedbackComment, Workspace, SceneData, STEMSubject } from './types/stem';
import katex from 'katex';

const renderLatexToString = (tex: string) => {
  try {
    return {
      __html: katex.renderToString(tex || '', {
        displayMode: true,
        throwOnError: false,
      }),
    };
  } catch {
    return { __html: `<span>${tex}</span>` };
  }
};
import {
  authService,
  projectService,
  scriptService,
  renderService,
  reviewService,
  adminService,
  UserRole
} from './services';

export interface STEMTemplateCatalogItem {
  type: SceneData['type'];
  title: string;
  subject: string;
  category: 'ALL' | 'Math' | 'Physics' | 'Chemistry' | 'Biology' | 'ComputerScience';
  badge: string;
  duration: string;
  description: string;
  color: string;
  bgBadge: string;
}

export const STEM_TEMPLATES_CATALOG: STEMTemplateCatalogItem[] = [
  {
    type: 'TITLE_HERO',
    title: 'Tiêu Đề & Mở Đầu Bài Giảng',
    subject: 'Đa Môn STEM',
    category: 'ALL',
    badge: 'Hook & Intro',
    duration: '5 giây (150 frames)',
    description: 'Mở đầu bài giảng với hiệu ứng chữ xuất hiện sống động, cấp học, môn học và lời dẫn.',
    color: 'text-blue-600',
    bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    type: 'MATH_FORMULA',
    title: 'Khai Triển Công Thức KaTeX',
    subject: 'Toán Học',
    category: 'Math',
    badge: 'Toán 9-12',
    duration: '6 giây (180 frames)',
    description: 'Biểu diễn công thức toán học sắc nét từng bước, giải thích tham số và điều kiện.',
    color: 'text-indigo-600',
    bgBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    type: 'CHEMICAL_REACTION',
    title: 'Phản Ứng & Ống Nghiệm Hóa Học',
    subject: 'Hóa Học',
    category: 'Chemistry',
    badge: 'Hóa Học 8-12',
    duration: '6 giây (180 frames)',
    description: 'Bình tam giác sủi bọt khí đổi màu, phương trình hóa học KaTeX và hiện tượng quan sát.',
    color: 'text-rose-600',
    bgBadge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    type: 'COMPARISON_SPLIT',
    title: 'So Sánh Đối Chiếu Chia Đôi Màn Hình',
    subject: 'Đa Môn STEM',
    category: 'ALL',
    badge: 'Phân Tích 2 Chiều',
    duration: '6 giây (180 frames)',
    description: 'Màn hình 2 cột đối chiếu trực quan 2 khái niệm (DC vs AC, Nhân sơ vs Nhân thực, BFS vs DFS).',
    color: 'text-amber-600',
    bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    type: 'PROCESS_TIMELINE',
    title: 'Tiến Trình & Chu Trình Sinh Học',
    subject: 'Sinh Học',
    category: 'Biology',
    badge: 'Sinh Học & Tế Bào',
    duration: '6 giây (180 frames)',
    description: 'Quy trình theo dòng thời gian (nguyên phân, quang hợp) phát sáng theo từng giai đoạn.',
    color: 'text-emerald-600',
    bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    type: 'GEOMETRY_SPACE',
    title: 'Hình Học Trực Quan & Định Lý',
    subject: 'Toán Học',
    category: 'Math',
    badge: 'Hình Học & Định Lý',
    duration: '6 giây (180 frames)',
    description: 'Mô hình hình học SVG (định lý Pytago diện tích 3 hình vuông, tam giác vuông).',
    color: 'text-cyan-600',
    bgBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    type: 'DIAGRAM_EXPLAINER',
    title: 'Sơ Đồ Cơ Chế & Vật Lý Động',
    subject: 'Vật Lý',
    category: 'Physics',
    badge: 'Vật Lý 9-12',
    duration: '6 giây (180 frames)',
    description: 'Sơ đồ con lắc đơn, mô hình nguyên tử, mạch điện có ghim nhãn tương tác.',
    color: 'text-purple-600',
    bgBadge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    type: 'DATA_CHART',
    title: 'Biểu Đồ Trực Quan Số Liệu',
    subject: 'Vật Lý / Toán',
    category: 'Physics',
    badge: 'Thực Nghiệm Số Liệu',
    duration: '5 giây (150 frames)',
    description: 'Biểu đồ cột/đường trực quan hóa mối tương quan số liệu thực nghiệm khoa học.',
    color: 'text-teal-600',
    bgBadge: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    type: 'ALGORITHM_WALKTHROUGH',
    title: 'Mô Phỏng Chạy Code Thuật Toán',
    subject: 'Tin Học',
    category: 'ComputerScience',
    badge: 'Tin Học Lập Trình',
    duration: '6 giây (180 frames)',
    description: 'Chạy từng dòng code Python/C++, hiển thị trạng thái biến thiên bộ nhớ.',
    color: 'text-slate-800',
    bgBadge: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  {
    type: 'STEM_QUIZ',
    title: 'Trắc Nghiệm Tương Tác Checkpoint',
    subject: 'Đa Môn STEM',
    category: 'ALL',
    badge: 'Củng Cố Kiến Thức',
    duration: '6 giây (180 frames)',
    description: 'Câu hỏi trắc nghiệm kiểm tra độ hiểu bài kèm đồng hồ đếm ngược 5 giây.',
    color: 'text-yellow-600',
    bgBadge: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  },
  {
    type: 'OUTRO',
    title: 'Tổng Kết Bài Học & Bài Tập LMS',
    subject: 'Đa Môn STEM',
    category: 'ALL',
    badge: 'Tổng Kết & Về Nhà',
    duration: '5 giây (150 frames)',
    description: 'Tóm lược các điểm chính của bài học, bài tập thực hành trên Canvas/Moodle.',
    color: 'text-sky-600',
    bgBadge: 'bg-sky-50 text-sky-700 border-sky-200',
  },
];

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
  const [templateCatalogFilter, setTemplateCatalogFilter] = useState<'ALL' | 'Math' | 'Physics' | 'Chemistry' | 'Biology' | 'ComputerScience'>('ALL');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<'youtube' | 'lms'>('youtube');
  const [youtubeForm, setYoutubeForm] = useState({
    title: 'Định luật Ohm & Mạch Điện Cơ Bản - Bài Giảng STEM Vật Lý Lớp 9',
    description: 'Video bài giảng trực quan hóa kiến thức STEMotion được sản xuất tự động bằng Remotion + React.\n\nNội dung chính:\n1. Mở đầu và đặt vấn đề về dòng điện\n2. Phát biểu Định luật Ohm và công thức tính I = U/R\n3. Trắc nghiệm tương tác kiểm tra độ hiểu bài\n\n#STEM #VatLy9 #Remotion #STEMotion',
    tags: '#STEM, #VatLy9, #DinhLuatOhm, #STEMotion, #Remotion',
    privacy: 'public' as 'public' | 'unlisted' | 'private',
    isPublishing: false,
    publishedUrl: '',
  });

  // Reviewer review mode: 'script' (Duyệt kịch bản của Writer) | 'video' (Duyệt video của Producer)
  const [reviewerMode, setReviewerMode] = useState<'script' | 'video'>('script');

  // Writer view mode: 'scenes' (Từng cảnh) | 'master' (Toàn văn giáo án)
  const [writerViewMode, setWriterViewMode] = useState<'scenes' | 'master'>('scenes');

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
  const updateSceneProperty = (updater: (s: any) => any) => {
    // 1. Immediate synchronous local update for zero input lag and reliable editing
    setScript((prev) => {
      const updatedScenes = prev.scenes.map((sc) => {
        if (sc.id === selectedScene.id) {
          return updater(sc);
        }
        return sc;
      });
      const updatedScript = { ...prev, scenes: updatedScenes };
      // 2. Background async sync
      scriptService.updateScene(prev, selectedScene.id, updater).catch((err) => {
        console.warn('[updateSceneProperty] Sync note:', err);
      });
      return updatedScript;
    });
  };

  // Add new scene dynamically via Service Layer
  const handleAddNewScene = async (type: SceneData['type'] = 'MATH_FORMULA') => {
    try {
      const { updatedScript, newScene } = await scriptService.addScene(script, type);
      setScript(updatedScript);
      setActiveSceneId(newScene.id);
      showToast(`Đã thêm Scene mới (${type}) vào kịch bản!`);
    } catch (err) {
      console.warn('Fallback adding scene:', err);
    }
  };

  // Delete scene dynamically via Service Layer
  const handleDeleteScene = async (sceneId: string) => {
    if (script.scenes.length <= 1) {
      showToast('Video cần có ít nhất 1 phân cảnh!', 'warn');
      return;
    }
    try {
      const updatedScript = await scriptService.deleteScene(script, sceneId);
      setScript(updatedScript);
      setActiveSceneId(updatedScript.scenes[0].id);
      showToast('Đã xóa phân cảnh khỏi video.');
    } catch (err) {
      console.warn('Fallback deleting scene:', err);
    }
  };

  // Inline scene title edit state & handlers
  const [editingSceneTitleId, setEditingSceneTitleId] = useState<string | null>(null);
  const [inlineTitleValue, setInlineTitleValue] = useState<string>('');

  const handleStartEditTitle = (e: React.MouseEvent, sceneId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingSceneTitleId(sceneId);
    setInlineTitleValue(currentTitle);
  };

  const handleSaveInlineTitle = async (sceneId: string) => {
    if (inlineTitleValue.trim()) {
      await updateSceneProperty((s) => (s.id === sceneId ? { ...s, title: inlineTitleValue.trim() } : s));
      showToast('Đã đổi tên phân cảnh thành công!');
    }
    setEditingSceneTitleId(null);
  };

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= script.scenes.length) return;
    const newScenes = [...script.scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;
    setScript((prev) => ({ ...prev, scenes: newScenes }));
    showToast(`Đã di chuyển phân cảnh sang vị trí 0${targetIndex + 1}!`);
  };

  const handleDuplicateScene = (scene: SceneData) => {
    const duplicated: SceneData = {
      ...scene,
      id: `scene_${Date.now()}`,
      title: `${scene.title} (Bản sao)`,
    };
    const currentIdx = script.scenes.findIndex((s) => s.id === scene.id);
    const newScenes = [...script.scenes];
    newScenes.splice(currentIdx + 1, 0, duplicated);
    setScript((prev) => ({
      ...prev,
      scenes: newScenes,
      totalDurationSeconds: Math.round(newScenes.reduce((sum, s) => sum + (s.durationInFrames || 150), 0) / 30),
    }));
    setActiveSceneId(duplicated.id);
    showToast('Đã nhân bản phân cảnh thành công!');
  };

  const handleChangeDuration = (sceneId: string, seconds: number) => {
    const frames = Math.max(30, Math.round(seconds * 30));
    setScript((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, durationInFrames: frames } : s)),
      totalDurationSeconds: Math.round(
        prev.scenes.reduce((sum, s) => sum + (s.id === sceneId ? frames : (s.durationInFrames || 150)), 0) / 30
      ),
    }));
    showToast(`Đã chỉnh thời lượng cảnh thành ${seconds} giây!`);
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
    const title = newProjTitle.trim();
    if (!title) {
      showToast('Vui lòng nhập chủ đề bài học STEM!', 'warn');
      return;
    }

    try {
      const newScript = await projectService.createProject({
        title,
        subject: newProjSubject,
        gradeLevel: newProjGrade,
      });

      setScript(newScript);
      setActiveSceneId(newScript.scenes[0]?.id || '');
      setIsCreateProjectModalOpen(false);
      setNewProjTitle('');
      setCurrentRole('producer'); // Jump immediately to Studio to see the new video!
      showToast(`Đã tạo dự án mới: "${title}"! Đang mở Studio dựng video.`);
    } catch (err: any) {
      console.error('Error creating project:', err);
      // Even in worst case, close modal and create fallback locally
      const fallbackScript = projectService._generateNewProject({
        title,
        subject: newProjSubject,
        gradeLevel: newProjGrade,
      });
      setScript(fallbackScript);
      setActiveSceneId(fallbackScript.scenes[0]?.id || '');
      setIsCreateProjectModalOpen(false);
      setNewProjTitle('');
      setCurrentRole('producer');
      showToast(`Đã tạo dự án mới: "${title}"!`);
    }
  };

  // AI Script Action Trigger in Writer Studio
  const handleTriggerAiAction = async (action: 'resegment' | 'grade' | 'extract' | 'terms') => {
    if (action === 'resegment') {
      try {
        const rawScript = script.scenes.map(s => s.narration || (s as any).latex || (s as any).question || '').join(' ');
        const response = await scriptService.segmentScript(rawScript);
        
        setAiAnalysisResult({
          type: 'resegment',
          title: 'Phân Cảnh Tự Động (Backend AI Response)',
          details: [
            'API Backend đã trả về:',
            ...(response?.scenes?.length
              ? response.scenes.map((s: any, idx: number) => `Scene ${idx + 1} (${s.templateType || 'Scene'}, ${s.suggestedDuration || 15}s): ${s.narrationText || 'Phân cảnh tiêu chuẩn'}`)
              : ['1. Scene 1 (15s): Mở đầu bài học', '2. Scene 2 (20s): Công thức trọng tâm', '3. Scene 3 (20s): Thực nghiệm ảo', '4. Scene 4 (15s): Trắc nghiệm kiểm tra', '5. Scene 5 (15s): Tổng kết & Bài tập'])
          ]
        });
        showToast('AI: Đã tối ưu hóa phân cảnh thành công!');
      } catch (err: any) {
        showToast('Lỗi khi gọi AI: ' + err.message, 'warn');
      }
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
      {/* 🌟 QUY TRÌNH 5 BƯỚC: WRITER VIẾT ➔ REVIEWER DUYỆT BÀI ➔ PRODUCER TẠO ➔ REVIEWER DUYỆT VIDEO ➔ XUẤT YOUTUBE */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs select-none gap-2 sticky top-[53px] z-30 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Luồng Sản Xuất:
          </span>

          <div className="flex items-center gap-1 font-semibold text-[11px] shrink-0">
            {/* Bước 1: Writer Viết Kịch Bản */}
            <button
              onClick={() => {
                handleRoleChange('writer');
                showToast('Bước 1: Soạn thảo kịch bản & lời thoại (Writer Studio)');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                currentRole === 'writer'
                  ? 'bg-brand-600 text-white shadow-xs font-bold ring-2 ring-blue-400/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">1</span>
              <span>Writer Viết Kịch Bản</span>
              {script.scriptStatus !== 'DRAFT' && <Check className="w-3 h-3 text-emerald-400" />}
            </button>

            <span className="text-slate-600 font-bold">➔</span>

            {/* Bước 2: Reviewer Duyệt Kịch Bản */}
            <button
              onClick={() => {
                handleRoleChange('reviewer');
                setReviewerMode('script');
                showToast('Bước 2: Reviewer thẩm định kịch bản chữ của Writer');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                currentRole === 'reviewer' && reviewerMode === 'script'
                  ? 'bg-amber-600 text-white shadow-xs font-bold ring-2 ring-amber-400/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">2</span>
              <span>Reviewer Duyệt Kịch Bản</span>
              {script.scriptStatus === 'APPROVED' && <Check className="w-3 h-3 text-emerald-400" />}
            </button>

            <span className="text-slate-600 font-bold">➔</span>

            {/* Bước 3: Producer Dựng & Render Video */}
            <button
              onClick={() => {
                handleRoleChange('producer');
                showToast('Bước 3: Producer dựng hình & render video Remotion');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                currentRole === 'producer'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-400/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">3</span>
              <span>Producer Tạo Video</span>
              {script.videoStatus === 'IN_QA' || script.videoStatus === 'APPROVED' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : null}
            </button>

            <span className="text-slate-600 font-bold">➔</span>

            {/* Bước 4: Reviewer Duyệt Video */}
            <button
              onClick={() => {
                handleRoleChange('reviewer');
                setReviewerMode('video');
                showToast('Bước 4: Reviewer kiểm duyệt video thành phẩm');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                currentRole === 'reviewer' && reviewerMode === 'video'
                  ? 'bg-purple-600 text-white shadow-xs font-bold ring-2 ring-purple-400/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">4</span>
              <span>Reviewer Duyệt Video</span>
              {script.videoStatus === 'APPROVED' && <Check className="w-3 h-3 text-emerald-400" />}
            </button>

            <span className="text-slate-600 font-bold">➔</span>

            {/* Bước 5: Xuất YouTube / LMS */}
            <button
              onClick={() => {
                setIsPublishModalOpen(true);
                setPublishTarget('youtube');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all font-bold ${
                script.videoStatus === 'APPROVED'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-white" />
              <span>5. Xuất YouTube</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Kịch bản: <b className={script.scriptStatus === 'APPROVED' ? 'text-emerald-400' : script.scriptStatus === 'CHANGE_REQUESTED' ? 'text-rose-400' : 'text-amber-400'}>{script.scriptStatus}</b>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Video: <b className={script.videoStatus === 'APPROVED' ? 'text-emerald-400' : 'text-indigo-400'}>{script.videoStatus || 'NOT_RENDERED'}</b>
          </span>
        </div>
      </div>

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
                  const isEditingTitle = editingSceneTitleId === sc.id;

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
                      {/* Top Header of Card: Index, Reorder arrows, Duration select, Duplicate & Delete */}
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            0{idx + 1}
                          </span>

                          {/* Reorder Up / Down */}
                          <div className="flex items-center">
                            {idx > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveScene(idx, 'up');
                                }}
                                className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors"
                                title="Di chuyển phân cảnh lên trước"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {idx < script.scenes.length - 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveScene(idx, 'down');
                                }}
                                className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors"
                                title="Di chuyển phân cảnh xuống sau"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Sửa Thời Lượng Nhanh (Duration) */}
                          <select
                            value={Math.round((sc.durationInFrames || 150) / 30)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleChangeDuration(sc.id, parseInt(e.target.value));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-mono font-bold text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5 hover:border-indigo-400 cursor-pointer focus:outline-none shadow-2xs"
                            title="Thời lượng phân cảnh"
                          >
                            <option value={3}>3s</option>
                            <option value={5}>5s</option>
                            <option value={6}>6s</option>
                            <option value={8}>8s</option>
                            <option value={10}>10s</option>
                            <option value={15}>15s</option>
                          </select>

                          {/* Nhân bản Scene */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateScene(sc);
                            }}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            title="Nhân bản phân cảnh này"
                          >
                            <Copy className="w-3 h-3" />
                          </button>

                          {/* Xóa Scene */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScene(sc.id);
                            }}
                            className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                            title="Xóa phân cảnh này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Tiêu đề Phân Cảnh (Hỗ trợ nhấp đúp hoặc bấm bút để sửa trực tiếp) */}
                      {isEditingTitle ? (
                        <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={inlineTitleValue}
                            onChange={(e) => setInlineTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineTitle(sc.id);
                              if (e.key === 'Escape') setEditingSceneTitleId(null);
                            }}
                            autoFocus
                            placeholder="Nhập tên cảnh..."
                            className="w-full px-2 py-1 text-xs font-bold border border-indigo-500 rounded-lg bg-white focus:outline-none shadow-inner"
                          />
                          <button
                            onClick={() => handleSaveInlineTitle(sc.id)}
                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-2xs shrink-0"
                            title="Lưu tên mới"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group/title mt-1">
                          <h4
                            onDoubleClick={(e) => handleStartEditTitle(e, sc.id, sc.title)}
                            className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-indigo-600 transition-colors cursor-text flex-1 pr-1"
                            title="Nhấp đúp chuột để đổi tên nhanh phân cảnh này"
                          >
                            {sc.title}
                          </h4>
                          <button
                            onClick={(e) => handleStartEditTitle(e, sc.id, sc.title)}
                            className="text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover/title:opacity-100 p-0.5 shrink-0"
                            title="Sửa tên cảnh trực tiếp"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Loại template và chỉ dẫn */}
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100/80">
                        <span className="text-[10px] font-mono text-indigo-600 font-bold">
                          {sc.type}
                        </span>
                        {isActive && (
                          <span className="text-[9px] text-indigo-500 font-semibold animate-pulse">
                            Sửa chi tiết ở cột phải ➔
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <button
                  onClick={() => setIsSwapAssetModalOpen(true)}
                  className="w-full py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg border border-brand-200 flex items-center justify-center gap-1.5 shadow-2xs text-[11px]"
                >
                  <Library className="w-3.5 h-3.5 text-brand-600" />
                  <span>+ Kho Template STEM (11)</span>
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAddNewScene('MATH_FORMULA')}
                    className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-700 text-center"
                    title="Thêm công thức Toán KaTeX"
                  >
                    + Toán
                  </button>
                  <button
                    onClick={() => handleAddNewScene('CHEMICAL_REACTION')}
                    className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-rose-700 text-center"
                    title="Thêm phản ứng Hóa học"
                  >
                    + Hóa
                  </button>
                  <button
                    onClick={() => handleAddNewScene('COMPARISON_SPLIT')}
                    className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-amber-700 text-center"
                    title="Thêm so sánh đối chiếu"
                  >
                    + So sánh
                  </button>
                  <button
                    onClick={() => handleAddNewScene('PROCESS_TIMELINE')}
                    className="flex-1 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-emerald-700 text-center"
                    title="Thêm chu trình tiến trình"
                  >
                    + Chu trình
                  </button>
                </div>
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

                {/* Sửa Phản ứng nếu là CHEMICAL_REACTION */}
                {selectedScene.type === 'CHEMICAL_REACTION' && (
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                    <span className="font-bold text-rose-950 block text-[11px]">
                      Phương Trình Hóa Học & Phản Ứng:
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Mã LaTeX Phương Trình:</span>
                      <input
                        type="text"
                        value={(selectedScene as any).equation || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, equation: e.target.value }))}
                        className="w-full p-1.5 border border-rose-300 rounded text-xs font-mono bg-white text-rose-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Chất tham gia:</span>
                      <input
                        type="text"
                        value={(selectedScene as any).reactants || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, reactants: e.target.value }))}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Sản phẩm thu được:</span>
                      <input
                        type="text"
                        value={(selectedScene as any).products || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, products: e.target.value }))}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Hiện tượng quan sát:</span>
                      <textarea
                        rows={2}
                        value={(selectedScene as any).observation || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, observation: e.target.value }))}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Sửa So Sánh nếu là COMPARISON_SPLIT */}
                {selectedScene.type === 'COMPARISON_SPLIT' && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <span className="font-bold text-amber-950 block text-[11px]">
                      Thông Số So Sánh Đối Chiếu:
                    </span>
                    <div>
                      <span className="text-[10px] text-blue-700 font-bold block mb-0.5">Tiêu đề Chủ Đề A (Cột Trái):</span>
                      <input
                        type="text"
                        value={(selectedScene as any).topicA?.title || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, topicA: { ...(s as any).topicA, title: e.target.value } }))}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-700 font-bold block mb-0.5">Tiêu đề Chủ Đề B (Cột Phải):</span>
                      <input
                        type="text"
                        value={(selectedScene as any).topicB?.title || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, topicB: { ...(s as any).topicB, title: e.target.value } }))}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Kết Luận Sư Phạm:</span>
                      <textarea
                        rows={2}
                        value={(selectedScene as any).conclusion || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, conclusion: e.target.value }))}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Sửa Chu Trình nếu là PROCESS_TIMELINE */}
                {selectedScene.type === 'PROCESS_TIMELINE' && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-950 block text-[11px]">
                      Thông Số Chu Trình & Tiến Trình:
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Tên Chu Trình:</span>
                      <input
                        type="text"
                        value={(selectedScene as any).processTitle || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, processTitle: e.target.value }))}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      {(selectedScene as any).stages?.map((stg: any, sIdx: number) => (
                        <div key={sIdx} className="p-2 border border-emerald-200 rounded-lg bg-white">
                          <span className="text-[9px] font-bold text-emerald-700 block">Pha {sIdx + 1}:</span>
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
                            className="w-full p-1 border border-slate-100 rounded text-[11px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sửa Hình Học nếu là GEOMETRY_SPACE */}
                {selectedScene.type === 'GEOMETRY_SPACE' && (
                  <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl space-y-2">
                    <span className="font-bold text-cyan-950 block text-[11px]">
                      Thông Số Hình Học & Định Lý:
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Tên Định Lý:</span>
                      <input
                        type="text"
                        value={(selectedScene as any).theoremName || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, theoremName: e.target.value }))}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Cạnh a:</span>
                        <input
                          type="number"
                          value={(selectedScene as any).dimensions?.a || 3}
                          onChange={(e) => updateSceneProperty((s) => ({ ...s, dimensions: { ...(s as any).dimensions, a: Number(e.target.value) } }))}
                          className="w-full p-1 border border-slate-200 rounded text-xs bg-white text-center font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Cạnh b:</span>
                        <input
                          type="number"
                          value={(selectedScene as any).dimensions?.b || 4}
                          onChange={(e) => updateSceneProperty((s) => ({ ...s, dimensions: { ...(s as any).dimensions, b: Number(e.target.value) } }))}
                          className="w-full p-1 border border-slate-200 rounded text-xs bg-white text-center font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Cạnh huyền c:</span>
                        <input
                          type="number"
                          value={(selectedScene as any).dimensions?.c || 5}
                          onChange={(e) => updateSceneProperty((s) => ({ ...s, dimensions: { ...(s as any).dimensions, c: Number(e.target.value) } }))}
                          className="w-full p-1 border border-slate-200 rounded text-xs bg-white text-center font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold block mb-0.5">Ý Nghĩa Định Lý:</span>
                      <textarea
                        rows={2}
                        value={(selectedScene as any).explanation || ''}
                        onChange={(e) => updateSceneProperty((s) => ({ ...s, explanation: e.target.value }))}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
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
      {/* 🔍 MÀN HÌNH 2: REVIEWER WORKSPACE (2 CẤP ĐỘ: DUYỆT KỊCH BẢN CHỮ & DUYỆT VIDEO QA) */}
      {/* ========================================================================= */}
      {currentRole === 'reviewer' && (
        <section className="flex-1 flex flex-col">
          {/* Top Bar Reviewer với Bộ Chuyển Chế Độ Duyệt */}
          <div className="bg-white border-b px-6 py-2.5 flex justify-between items-center text-xs">
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
                {script.scriptStatus === 'APPROVED' && <Check className="w-3 h-3 text-emerald-500 font-bold" />}
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
                {script.videoStatus === 'APPROVED' && <Check className="w-3 h-3 text-emerald-500 font-bold" />}
              </button>
            </div>

            {/* Quyết định của Reviewer */}
            <div className="flex items-center space-x-2">
              {reviewerMode === 'script' ? (
                <>
                  <button
                    onClick={async () => {
                      await reviewService.submitReviewDecision(script.id, 'CHANGE_REQUESTED');
                      setScript((prev) => ({ ...prev, scriptStatus: 'CHANGE_REQUESTED' }));
                      showToast('Đã gửi yêu cầu sửa lại kịch bản cho Writer!', 'warn');
                      setTimeout(() => handleRoleChange('writer'), 900);
                    }}
                    className="px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Yêu Cầu Writer Sửa Lại</span>
                  </button>
                  <button
                    onClick={async () => {
                      await reviewService.submitReviewDecision(script.id, 'APPROVED');
                      setScript((prev) => ({ ...prev, scriptStatus: 'APPROVED' }));
                      showToast('Đã phê duyệt kịch bản! Hệ thống chuyển sang Producer để tạo video.', 'success');
                      setTimeout(() => handleRoleChange('producer'), 1000);
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
                    onClick={() => {
                      showToast('Đã gửi yêu cầu chỉnh sửa video cho Producer!', 'warn');
                      setTimeout(() => handleRoleChange('producer'), 900);
                    }}
                    className="px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Yêu Cầu Producer Sửa Clip</span>
                  </button>
                  <button
                    onClick={async () => {
                      await reviewService.submitReviewDecision(script.id, 'APPROVED');
                      setScript((prev) => ({ ...prev, videoStatus: 'APPROVED' }));
                      showToast('Đã phê duyệt video hoàn chỉnh! Mở màn hình Xuất Bản YouTube.');
                      setIsPublishModalOpen(true);
                      setPublishTarget('youtube');
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Duyệt Video ➔ Xuất YouTube</span>
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
            <div className="flex-1 flex overflow-hidden">
              {/* Cột 1: Cấu trúc kịch bản */}
              <aside className="w-72 bg-white border-r border-slate-200 p-4 overflow-y-auto flex flex-col">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
                  Danh Sách Cảnh Cần Duyệt ({script.scenes.length})
                </span>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
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
                      <span className="text-[10px] font-mono text-amber-700 block mt-0.5">{sc.type}</span>
                    </div>
                  ))}
                </div>
              </aside>

              {/* Cột 2: Nội dung chi tiết kịch bản cần thẩm định */}
              <main className="flex-1 bg-slate-50 p-6 overflow-y-auto flex justify-center">
                <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col space-y-5">
                  <div className="border-b pb-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {selectedScene.type}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 mt-1">{selectedScene.title}</h2>
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
                          <span className="text-[11px] font-bold text-slate-700">Các bước biến đổi:</span>
                          {(selectedScene as any).steps.map((st: any, idx: number) => (
                            <div key={idx} className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-100 flex items-center justify-between">
                              <span><b>{st.label}:</b> {st.explanation}</span>
                              <span className="font-mono text-brand-600 font-bold text-[11px]">{st.latexSnippet}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedScene.type === 'STEM_QUIZ' && (
                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                      <label className="text-xs font-bold text-amber-900 block">Câu Hỏi Trắc Nghiệm Tương Tác:</label>
                      <p className="font-bold text-slate-900 text-sm">{(selectedScene as any).question}</p>
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
                      <label className="text-xs font-bold text-emerald-900 block">Số Liệu Biểu Đồ Thực Nghiệm:</label>
                      <div className="flex gap-2 text-xs text-slate-700">
                        <span>Trục X: <b>{(selectedScene as any).xAxisLabel}</b></span>
                        <span>•</span>
                        <span>Trục Y: <b>{(selectedScene as any).yAxisLabel}</b></span>
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
                      <label className="text-xs font-bold text-rose-900 block">Thẩm Định Phương Trình & Phản Ứng Hóa Học:</label>
                      <div
                        className="p-3 bg-white rounded-lg border border-rose-200 text-center text-lg"
                        dangerouslySetInnerHTML={renderLatexToString((selectedScene as any).equation || '')}
                      />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-white rounded border">
                          <b className="text-slate-700">Chất tham gia:</b> {(selectedScene as any).reactants}
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
                      <label className="text-xs font-bold text-amber-900 block">Thẩm Định Đối Chiếu Hai Khái Niệm:</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200">
                          <b className="text-blue-900 block mb-1">{(selectedScene as any).topicA?.title}</b>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                            {(selectedScene as any).topicA?.points?.map((p: string, pIdx: number) => (
                              <li key={pIdx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200">
                          <b className="text-amber-900 block mb-1">{(selectedScene as any).topicB?.title}</b>
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
                      <label className="text-xs font-bold text-emerald-900 block">Thẩm Định Chu Trình Sinh Học & Tiến Trình:</label>
                      <p className="font-bold text-slate-800 text-xs">{(selectedScene as any).processTitle}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(selectedScene as any).stages?.map((st: any, sIdx: number) => (
                          <div key={sIdx} className="p-2 bg-white rounded-lg border border-emerald-100 text-xs">
                            <span className="font-bold text-emerald-800 block">Pha {sIdx + 1}: {st.title}</span>
                            <span className="text-[11px] text-slate-600 mt-0.5 block">{st.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedScene.type === 'GEOMETRY_SPACE' && (
                    <div className="p-4 bg-cyan-50/60 rounded-xl border border-cyan-200 space-y-2">
                      <label className="text-xs font-bold text-cyan-900 block">Thẩm Định Hình Học & Định Lý:</label>
                      <p className="font-bold text-slate-800 text-xs">{(selectedScene as any).theoremName}</p>
                      <div
                        className="p-3 bg-white rounded-lg border border-cyan-200 text-center text-lg"
                        dangerouslySetInnerHTML={renderLatexToString((selectedScene as any).formulaLatex || '')}
                      />
                      <div className="p-2 bg-white rounded border text-xs text-slate-700">
                        <b>Kích thước:</b> a = {(selectedScene as any).dimensions?.a}, b = {(selectedScene as any).dimensions?.b}, c = {(selectedScene as any).dimensions?.c}
                      </div>
                      <p className="text-xs text-slate-600 bg-white p-2 rounded border">
                        <b>Ý nghĩa:</b> {(selectedScene as any).explanation}
                      </p>
                    </div>
                  )}
                </div>
              </main>

              {/* Cột 3: Chỉ số AI Sư phạm & Khung Góp Ý Kịch Bản */}
              <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar text-xs">
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
                      <li>Độ khó bài giảng: <b>Phù hợp chuẩn {script.gradeLevel}</b></li>
                      <li>Thuật ngữ khoa học: <b>Đồng nhất 100%</b></li>
                      <li>Khuyến nghị: <b>Đủ điều kiện phê duyệt</b></li>
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

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <button
                    onClick={async () => {
                      await reviewService.submitReviewDecision(script.id, 'APPROVED');
                      setScript((prev) => ({ ...prev, scriptStatus: 'APPROVED' }));
                      showToast('Đã phê duyệt kịch bản! Hệ thống chuyển sang Producer để tạo video.', 'success');
                      setTimeout(() => handleRoleChange('producer'), 900);
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
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* ✍️ MÀN HÌNH 3: WRITER SCRIPT STUDIO (SOẠN THẢO KỊCH BẢN STEM TOÀN DIỆN) */}
      {/* ========================================================================= */}
      {currentRole === 'writer' && (
        <section className="flex-1 flex flex-col">
          {/* Top Bar Writer */}
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-brand-700 font-bold border border-blue-200">
                WRITER SCRIPT STUDIO
              </span>
              <span className="text-slate-300">/</span>
              <h1 className="text-sm font-bold text-slate-900">{script.title}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-brand-700 font-bold">{script.gradeLevel}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                Trạng thái: <b>{script.scriptStatus}</b>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-1 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
                <span>+ Đề Tài Mới</span>
              </button>
              <button
                onClick={() => setIsVersionDiffModalOpen(true)}
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
                    handleRoleChange('reviewer');
                    setReviewerMode('script');
                  }, 800);
                }}
                className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Kịch Bản Cho Reviewer Thẩm Định (Bước 1 ➔ 2)</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Cột 1: Cấu trúc phân cảnh (Cho phép Thêm / Xóa / Đổi thứ tự) */}
            <aside className="w-72 bg-white border-r border-slate-200 p-4 overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">
                  Phân Cảnh ({script.scenes.length})
                </span>
                <span className="font-semibold text-brand-600 font-mono">{script.totalDurationSeconds}s</span>
              </div>

              {/* Danh sách cảnh */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {script.scenes.map((sc, i) => (
                  <div
                    key={sc.id}
                    onClick={() => setActiveSceneId(sc.id)}
                    className={`p-3 rounded-xl border cursor-pointer text-xs space-y-1.5 transition-all ${
                      sc.id === selectedScene.id
                        ? 'bg-blue-50 border-brand-500 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5">
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
                ))}
              </div>

              {/* Nút Thêm Cảnh Mới Nhanh */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <button
                  onClick={() => setIsSwapAssetModalOpen(true)}
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
            <main className="flex-1 bg-slate-50 p-6 overflow-y-auto flex justify-center">
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col space-y-5">
                
                {/* 1. Tiêu Đề Cảnh (Cho Phép Writer Sửa Trực Tiếp) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Tiêu Đề Phân Cảnh (Scene Title):</span>
                    <span className="font-mono text-[10px] text-brand-600 font-bold">{selectedScene.type}</span>
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
                      {Math.round((selectedScene.narration || '').trim().split(/\s+/).filter(Boolean).length / 2.2)}s đọc)
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    value={selectedScene.narration}
                    onChange={(e) => updateSceneProperty((s) => ({ ...s, narration: e.target.value }))}
                    placeholder="Nhập lời giảng sư phạm để AI đọc thuyết minh cho phân cảnh này..."
                    className="w-full text-sm text-slate-800 p-3.5 border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none leading-relaxed shadow-2xs"
                  />

                  {/* AI Quick Helpers cho Lời Thoại */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        updateSceneProperty((s) => ({
                          ...s,
                          narration: `${s.narration} Các em hãy quan sát kỹ hiện tượng trên màn hình để rút ra kết luận khoa học quan trọng nhất.`,
                        }));
                        showToast('AI: Đã mở rộng thêm lời dẫn dắt sư phạm!');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-brand-700 hover:bg-blue-100 font-semibold border border-blue-200 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-brand-600" />
                      <span>AI Mở Rộng Lời Thoại</span>
                    </button>
                    <button
                      onClick={() => {
                        updateSceneProperty((s) => ({
                          ...s,
                          narration: s.narration.replace(/rất là|hoàn toàn là/g, ''),
                        }));
                        showToast('AI: Đã tối ưu câu văn súc tích, dễ hiểu!');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 flex items-center gap-1"
                    >
                      <span>Tối Ưu Sư Phạm</span>
                    </button>
                  </div>
                </div>

                {/* 3. Nội Dung Trọng Tâm: KaTeX / Biểu Đồ / Quiz */}
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
                      <span className="text-[10px] text-blue-700 font-bold block mb-1">Xem Trước Hiển Thị Toán Học:</span>
                      <div
                        className="p-3 bg-white rounded-xl border border-blue-200 text-center text-lg overflow-x-auto"
                        dangerouslySetInnerHTML={renderLatexToString((selectedScene as any).latex || '')}
                      />
                    </div>
                  </div>
                )}

                {selectedScene.type === 'STEM_QUIZ' && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                    <label className="text-xs font-bold text-amber-950 block">Câu Hỏi Trắc Nghiệm Ôn Tập:</label>
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
                      <label className="text-[11px] font-bold text-amber-900 block mb-1">Giải Thích Đáp Án:</label>
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
                    <label className="text-xs font-bold text-rose-950 block">Soạn Thảo Phản Ứng Hóa Học & Phương Trình:</label>
                    <div>
                      <span className="text-[10px] text-rose-700 font-bold block mb-1">Phương Trình Hóa Học (LaTeX):</span>
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
                    <label className="text-xs font-bold text-amber-950 block">Soạn Thảo Nội Dung So Sánh Đối Chiếu:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-blue-700 font-bold block mb-1">Chủ Đề A (Cột Trái):</span>
                        <input
                          type="text"
                          value={(selectedScene as any).topicA?.title || ''}
                          onChange={(e) => updateSceneProperty((s) => ({ ...s, topicA: { ...(s as any).topicA, title: e.target.value } }))}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-700 font-bold block mb-1">Chủ Đề B (Cột Phải):</span>
                        <input
                          type="text"
                          value={(selectedScene as any).topicB?.title || ''}
                          onChange={(e) => updateSceneProperty((s) => ({ ...s, topicB: { ...(s as any).topicB, title: e.target.value } }))}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
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
                    <label className="text-xs font-bold text-emerald-950 block">Chu Trình & Tiến Trình Từng Giai Đoạn:</label>
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
      {/* MODAL: BƯỚC 5 - XUẤT BẢN YOUTUBE & MÃ NHÚNG LMS */}
      {/* ========================================================================= */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Youtube className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bước 5: Xuất Bản Kênh YouTube & LMS
                  </h3>
                  <p className="text-[11px] text-slate-500">Phân phối video bài giảng STEM tới học sinh và cộng đồng</p>
                </div>
              </div>
              <button onClick={() => setIsPublishModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Workflow approval status banner */}
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              script.videoStatus === 'APPROVED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center space-x-2">
                {script.videoStatus === 'APPROVED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold">
                    {script.videoStatus === 'APPROVED'
                      ? 'Video đã được Reviewer phê duyệt hoàn tất (Cấp 2)'
                      : 'Video chưa có phê duyệt chính thức từ Reviewer'}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {script.videoStatus === 'APPROVED'
                      ? 'Bạn có thể xuất bản lên kênh YouTube chính thức hoặc nhúng LMS ngay.'
                      : 'Nên để Reviewer kiểm định chất lượng âm thanh và hình ảnh trước khi công khai.'}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                script.videoStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {script.videoStatus === 'APPROVED' ? 'ĐÃ DUYỆT' : 'CHƯA DUYỆT'}
              </span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-2">
              <button
                onClick={() => setPublishTarget('youtube')}
                className={`pb-2 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
                  publishTarget === 'youtube'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span>Kênh YouTube (Khuyên dùng)</span>
              </button>
              <button
                onClick={() => setPublishTarget('lms')}
                className={`pb-2 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
                  publishTarget === 'lms'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Mã Nhúng Canvas / Moodle</span>
              </button>
            </div>

            {/* TAB CONTENT: YOUTUBE */}
            {publishTarget === 'youtube' && (
              <div className="space-y-3">
                {youtubeForm.publishedUrl ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900">
                    <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
                      <CheckCheck className="w-5 h-5 text-emerald-600" />
                      <span>Video đã được tải lên Kênh YouTube thành công!</span>
                    </div>
                    <p className="text-xs text-emerald-700">
                      Đã hoàn tất quy trình 5 bước: Writer ➔ Reviewer kịch bản ➔ Producer render ➔ Reviewer duyệt ➔ YouTube.
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <a
                        href={youtubeForm.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs"
                      >
                        <Youtube className="w-4 h-4" />
                        <span>Xem Video trên YouTube</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                      <button
                        onClick={() => setYoutubeForm((prev) => ({ ...prev, publishedUrl: '' }))}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-xs"
                      >
                        Đăng lại / Sửa thông tin
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tiêu đề Video YouTube:</label>
                      <input
                        type="text"
                        value={youtubeForm.title}
                        onChange={(e) => setYoutubeForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full p-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-rose-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mô tả Video & Giáo Án (Description):</label>
                      <textarea
                        rows={3}
                        value={youtubeForm.description}
                        onChange={(e) => setYoutubeForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full p-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-rose-500 font-mono text-[11px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Thẻ gắn (Tags):</label>
                        <input
                          type="text"
                          value={youtubeForm.tags}
                          onChange={(e) => setYoutubeForm((prev) => ({ ...prev, tags: e.target.value }))}
                          className="w-full p-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Chế độ hiển thị:</label>
                        <select
                          value={youtubeForm.privacy}
                          onChange={(e) => setYoutubeForm((prev) => ({ ...prev, privacy: e.target.value as any }))}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-rose-500"
                        >
                          <option value="public">Công khai (Public)</option>
                          <option value="unlisted">Không công khai (Unlisted)</option>
                          <option value="private">Riêng tư (Private)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">
                        Độ phân giải xuất: 1080p Full HD • 60 FPS
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsPublishModalOpen(false)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold"
                        >
                          Hủy
                        </button>
                        <button
                          disabled={youtubeForm.isPublishing}
                          onClick={() => {
                            setYoutubeForm((prev) => ({ ...prev, isPublishing: true }));
                            showToast('Đang kết nối YouTube Data API v3 và đẩy video lên kênh...');
                            setTimeout(() => {
                              setYoutubeForm((prev) => ({
                                ...prev,
                                isPublishing: false,
                                publishedUrl: 'https://www.youtube.com/watch?v=stemotion_demo_ohm',
                              }));
                              showToast('Chúc mừng! Đã xuất bản video lên kênh YouTube thành công!');
                            }, 1400);
                          }}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1.5"
                        >
                          {youtubeForm.isPublishing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang tải lên YouTube...</span>
                            </>
                          ) : (
                            <>
                              <Youtube className="w-4 h-4" />
                              <span>Đăng Lên Kênh YouTube Ngay</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: LMS */}
            {publishTarget === 'lms' && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mã thẻ iFrame tích hợp vào Canvas / Moodle / Blackboard:</label>
                  <textarea
                    readOnly
                    rows={3}
                    defaultValue={`<iframe src="https://stemotion.edu.vn/embed/${script.id}" width="100%" height="540" frameborder="0" allowfullscreen></iframe>`}
                    className="w-full p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800">Hướng dẫn nhanh giáo viên:</div>
                  <p>1. Sao chép đoạn mã iFrame phía trên.</p>
                  <p>2. Mở khóa học Canvas hoặc Moodle ➔ Thêm hoạt động dạng &quot;Page&quot; hoặc &quot;URL/Embed&quot;.</p>
                  <p>3. Chuyển sang trình soạn thảo HTML và dán mã vào để học sinh xem trực tiếp có câu hỏi tương tác.</p>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe src="https://stemotion.edu.vn/embed/${script.id}" width="100%" height="540" frameborder="0" allowfullscreen></iframe>`);
                      showToast('Đã sao chép mã nhúng LMS vào bộ nhớ tạm!');
                      setIsPublishModalOpen(false);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Mã Nhúng LMS</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KHO PHÂN CẢNH & TEMPLATE STEM (TEMPLATE CATALOG 11 LOẠI) */}
      {/* ========================================================================= */}
      {isSwapAssetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Kho Template Phân Cảnh STEMotion 4.0</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold">
                      11 Templates Chuẩn GDPT
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kho mẫu hoạt họa video Remotion trực quan hóa kiến thức chuyên sâu cho 5 môn học STEM
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSwapAssetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 border-b border-slate-100">
              {[
                { id: 'ALL', label: 'Tất Cả (11)' },
                { id: 'Math', label: 'Toán Học' },
                { id: 'Physics', label: 'Vật Lý' },
                { id: 'Chemistry', label: 'Hóa Học' },
                { id: 'Biology', label: 'Sinh Học' },
                { id: 'ComputerScience', label: 'Tin Học' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTemplateCatalogFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                    templateCatalogFilter === tab.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Template Grid List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {STEM_TEMPLATES_CATALOG
                .filter((tpl) => templateCatalogFilter === 'ALL' || tpl.category === templateCatalogFilter || tpl.category === 'ALL')
                .map((tpl) => (
                  <div
                    key={tpl.type}
                    className="border border-slate-200 rounded-xl p-3.5 hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between group bg-white"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tpl.bgBadge}`}>
                          {tpl.badge}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{tpl.duration}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-brand-600 transition-colors">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{tpl.subject}</span>
                      <button
                        onClick={() => {
                          handleAddNewScene(tpl.type);
                          setIsSwapAssetModalOpen(false);
                          showToast(`Đã thêm phân cảnh mới: "${tpl.title}"!`);
                        }}
                        className="px-3 py-1 bg-brand-50 group-hover:bg-brand-600 group-hover:text-white text-brand-700 font-bold rounded-lg transition-all text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Chèn Vào Video</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[11px] text-slate-500 shrink-0 font-mono">
              <span>Được xây dựng chuẩn sư phạm chương trình GDPT 2018</span>
              <button
                onClick={() => setIsSwapAssetModalOpen(false)}
                className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg"
              >
                Đóng
              </button>
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
