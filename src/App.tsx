import React, { useState, useEffect, useCallback } from 'react';
import { STEMScript, FeedbackComment, SceneData, STEMSubject } from './types/stem';
import { LoginScreen } from './components/LoginScreen';
import {
  apiClient,
  authService,
  workspaceService,
  projectService,
  scriptService,
  reviewService,
  UserRole,
} from './services';

// Layout Components
import { HeaderNav } from './components/layout/HeaderNav';
import { WorkflowBar } from './components/layout/WorkflowBar';
import { ToastContainer, ToastItem } from './components/layout/ToastContainer';

// Studio Views
import { ProducerStudio } from './components/views/ProducerStudio/ProducerStudio';
import { WriterStudio } from './components/views/WriterStudio/WriterStudio';
import { ReviewerStudio } from './components/views/ReviewerStudio/ReviewerStudio';
import { AdminPortal } from './components/views/AdminPortal/AdminPortal';
import { MediaLibraryView } from './components/views/MediaLibrary/MediaLibraryView';

// Modals
import { TemplateCatalogModal } from './components/modals/TemplateCatalogModal';
import { PublishModal } from './components/modals/PublishModal';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { InviteWorkspaceModal } from './components/modals/InviteWorkspaceModal';
import { VersionDiffModal } from './components/modals/VersionDiffModal';

/** Shape the studio renders before the first script arrives. */
const EMPTY_SCRIPT: STEMScript = {
  id: '',
  title: '',
  subject: 'Math',
  gradeLevel: '',
  totalDurationSeconds: 0,
  scriptStatus: 'DRAFT',
  videoStatus: 'NOT_RENDERED',
  fps: 30,
  scenes: [],
  createdAt: new Date().toISOString(),
};

export default function App() {
  // Navigation Role: 'producer' | 'writer' | 'reviewer' | 'admin' | 'library'
  // ---- Session -----------------------------------------------------------
  // In mock mode the studio opens straight away; against a real backend the
  // user must sign in first so every request carries a JWT.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => Boolean(apiClient.getAuthToken())
  );
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);

  const [currentRole, setCurrentRole] = useState<UserRole>(() => authService.getCurrentUser().role);
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  const handleRoleChange = (role: UserRole) => {
    authService.switchRole(role);
    setCurrentRole(role);
  };

  // Multi-workspace state
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState({ name: 'Nhóm STEM THCS Tân Bình', code: 'Gr-01' });

  // Central Dynamic Script State (Single Source of Truth).
  // Starts empty: everything on screen comes from the backend, so an empty
  // workspace shows an empty studio rather than somebody else's lesson.
  const [script, setScript] = useState<STEMScript>(EMPTY_SCRIPT);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [seekTimestampSec, setSeekTimestampSec] = useState<number | null>(null);
  const [currentSec, setCurrentSec] = useState(0);

  // AI Assistant Output State in Writer Studio
  // Empty until the writer actually runs an analysis; the panel used to open
  // on a fixed readability report that had never been computed.
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    type: 'resegment' | 'grade' | 'extract' | 'terms' | null;
    title: string;
    details: string[];
  }>({
    type: null,
    title: 'AI Script Intelligence',
    details: ['Chọn một tác vụ AI bên dưới để phân tích kịch bản này.'],
  });

  // Render Hub state
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStageText, setRenderStageText] = useState<string>('Khởi động BullMQ Worker...');
  const [renderPercentageText, setRenderPercentageText] = useState<string>('0%');

  // Modals state
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isInviteWorkspaceModalOpen, setIsInviteWorkspaceModalOpen] = useState(false);
  const [isVersionDiffModalOpen, setIsVersionDiffModalOpen] = useState(false);
  const [isSwapAssetModalOpen, setIsSwapAssetModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Reviewer review mode: 'script' (Duyệt kịch bản của Writer) | 'video' (Duyệt video của Producer)
  const [reviewerMode, setReviewerMode] = useState<'script' | 'video'>('script');

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toastSeq = React.useRef(0);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    // Date.now() alone collided when two toasts fired in the same millisecond,
    // which React reported as duplicate keys.
    const id = Date.now() * 1000 + (toastSeq.current++ % 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // ---- Load the studio from the backend -----------------------------------
  /**
   * Pulls the signed-in user, their workspace and its scripts. Falls back to
   * the bundled sample data when the workspace is still empty, so a fresh
   * account opens on a usable studio instead of a blank screen.
   */
  const bootstrapFromApi = useCallback(async () => {
    setIsBootstrapping(true);
    try {
      const profile = await authService.fetchCurrentUser();
      setCurrentRole(profile.role);
      setCurrentUser(profile);

      // Resolve first: a brand-new account has no workspace yet and this
      // creates the default one. It already caches the active id, so the list
      // below is fetched once rather than twice.
      const activeId = await workspaceService.resolveActiveWorkspaceId();
      const myWorkspaces = await workspaceService.getMyWorkspaces();
      if (myWorkspaces.length > 0) {
        const active = myWorkspaces.find((w) => w.id === activeId) ?? myWorkspaces[0];
        workspaceService.setActiveWorkspaceId(active.id);
        setWorkspaces(
          myWorkspaces.map((w) => ({
            id: w.id,
            name: w.name,
            department: w.department || '',
            membersCount: w.membersCount,
            activeProjects: w.activeProjects,
          }))
        );
        setActiveGroup({ name: active.name, code: active.id.slice(0, 6) });
      }

      const list = await projectService.getProjects();
      if (list.length > 0) {
        // The list endpoint returns summaries; fetch the newest in full so the
        // Player and the scene editor have the actual scenes to work with.
        const full = await projectService.getProjectById(list[0].id);
        setScript(full);
        setActiveSceneId(full.scenes?.[0]?.id || '');

        const qa = await reviewService.getComments(full.id);
        setComments(qa);
        showToast(`Đã tải ${list.length} kịch bản từ máy chủ`, 'success');
      } else {
        showToast('Workspace chưa có kịch bản nào. Hãy tạo kịch bản đầu tiên.', 'info');
      }
    } catch (error: any) {
      console.error('[bootstrap] Không tải được dữ liệu từ backend:', error);
      showToast('Không tải được dữ liệu từ máy chủ. Kiểm tra backend đã chạy chưa.', 'warn');
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void bootstrapFromApi();
    }
  }, [isAuthenticated, bootstrapFromApi]);

  // apiClient raises this the moment any request comes back 401, so an expired
  // session sends the user to the login screen instead of a broken studio.
  useEffect(() => {
    const onUnauthorized = () => {
      setIsAuthenticated(false);
      workspaceService.clearCache();
    };
    window.addEventListener('stemotion:unauthorized', onUnauthorized);
    return () => window.removeEventListener('stemotion:unauthorized', onUnauthorized);
  }, []);

  // Active scene pointer
  const selectedScene = script.scenes.find((s) => s.id === activeSceneId) || script.scenes[0];

  // Dynamic Scene Updater (Live Props Binding via Service Layer)
  const updateSceneProperty = (updater: (s: any) => any) => {
    if (!selectedScene) return;
    setScript((prev) => {
      const updatedScenes = prev.scenes.map((sc) => {
        if (sc.id === selectedScene.id) {
          return updater(sc);
        }
        return sc;
      });
      const updatedScript = { ...prev, scenes: updatedScenes };
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

  const handleUpdateSceneTitle = async (sceneId: string, newTitle: string) => {
    await updateSceneProperty((s) => (s.id === sceneId ? { ...s, title: newTitle } : s));
    showToast('Đã đổi tên phân cảnh thành công!');
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

  const handleReorderScenes = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= script.scenes.length ||
      toIndex >= script.scenes.length
    )
      return;
    const newScenes = [...script.scenes];
    const [moved] = newScenes.splice(fromIndex, 1);
    newScenes.splice(toIndex, 0, moved);
    setScript((prev) => ({ ...prev, scenes: newScenes }));
    showToast(`Đã di chuyển phân cảnh đến vị trí 0${toIndex + 1}!`);
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
      totalDurationSeconds: Math.round(
        newScenes.reduce((sum, s) => sum + (s.durationInFrames || 150), 0) / 30
      ),
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
        prev.scenes.reduce(
          (sum, s) => sum + (s.id === sceneId ? frames : s.durationInFrames || 150),
          0
        ) / 30
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
    setComments((prev) => [...prev, newC]);
    setNewCommentInput('');
    showToast(
      `Đã ghim nhận xét của Reviewer tại giây thứ ${Math.round(currentSec)}!`,
      'info'
    );
  };

  const handleCreateNewProject = async (
    title: string,
    subject: STEMSubject,
    grade: string,
    useAi: boolean = true
  ) => {
    try {
      if (useAi) {
        showToast(`Đang kết nối Gemini để soạn kịch bản STEM: "${title}"...`, 'info');
        try {
          const aiScript = await scriptService.generateScriptWithAI(title, subject, grade, 60);
          let finalScript = aiScript;
          try {
            const savedProject = await projectService.createProject({
              title: aiScript.title || title,
              subject,
              gradeLevel: grade,
              scenes: aiScript.scenes,
            });
            if (savedProject && savedProject.id) {
              finalScript = {
                ...aiScript,
                id: savedProject.id,
              };
            }
          } catch (saveErr) {
            console.warn('[handleCreateNewProject] Backend persist skipped or failed, using local script:', saveErr);
          }
          setScript(finalScript);
          setActiveSceneId(finalScript.scenes[0]?.id || '');
          setCurrentRole('writer');
          showToast(`AI đã soạn kịch bản hoàn tất: "${finalScript.title}" (${finalScript.scenes.length} phân cảnh)!`, 'success');
          return;
        } catch (aiErr: any) {
          console.warn('[handleCreateNewProject] AI generation error, falling back to starter project:', aiErr);
          showToast(`AI tạm thời gián đoạn. Đang tạo dự án với các phân cảnh STEM chuẩn để bạn soạn thảo...`, 'warn');
        }
      }
      const newScript = await projectService.createProject({
        title,
        subject,
        gradeLevel: grade,
      });
      setScript(newScript);
      setActiveSceneId(newScript.scenes[0]?.id || '');
      setCurrentRole('writer');
      showToast(`Đã tạo dự án mới: "${title}"! Đang mở Writer Studio.`);
    } catch (err: any) {
      console.error('Error creating project:', err);
      showToast('Không tạo được dự án: ' + (err?.message || 'lỗi máy chủ'), 'warn');
    }
  };

  // AI Script Action Trigger in Writer Studio
  // Guards against a second click while a call is in flight.
  const [isAiRunning, setIsAiRunning] = useState(false);

  const handleTriggerAiAction = async (action: 'resegment' | 'grade' | 'extract' | 'terms') => {
    if (isAiRunning) return;
    setIsAiRunning(true);

    const rawScript = script.scenes
      .map((s) => s.narration || (s as any).latex || (s as any).question || '')
      .join(' ');

    showToast(`Dang gui kich ban cho AI phan tich (${action})...`, 'info');

    try {
      const res = await scriptService.runAiAction(action, rawScript, script.subject, script.gradeLevel);
      // runAiAction returns {action, result, model, elapsedMs}; the analysis
      // payload itself sits under `result`.
      const response = res.result;
      const footer = `— ${res.model} · ${(res.elapsedMs / 1000).toFixed(1)}s`;

      if (action === 'resegment') {
        const scenesList = response?.scenes || [];
        setAiAnalysisResult({
          type: 'resegment',
          title: `Phan Canh Tu Dong (${scenesList.length} Scenes)`,
          details: [
            ...(scenesList.length
              ? scenesList.map(
                  (s: any, idx: number) =>
                    `Scene ${idx + 1} (${s.type || s.templateType || 'Scene'}, ${s.suggestedDurationSec || 15}s): ${
                      s.title ? s.title + ' - ' : ''
                    }${s.narration || s.narrationText || 'Phan canh tieu chuan'}`
                )
              : ['AI khong de xuat phan canh nao.']),
            footer,
          ],
        });
        showToast('AI: Da toi uu hoa phan canh thanh cong!', 'success');
      } else if (action === 'grade') {
        const details: string[] = [];
        if (response?.readabilityScore !== undefined) {
          details.push(`Diem de doc (Readability Score): ${response.readabilityScore}/100`);
        }
        if (response?.estimatedGrade) {
          details.push(
            `Khoi lop danh gia: ${response.estimatedGrade} (${
              response.matchesTargetGrade ? 'Khop chuan muc tieu' : 'Can tinh chinh'
            })`
          );
        }
        if (response?.verdict) {
          details.push(`Nhan dinh su pham: ${response.verdict}`);
        }
        if (Array.isArray(response?.suggestions) && response.suggestions.length > 0) {
          response.suggestions.forEach((sug: string) => details.push(`Goi y: ${sug}`));
        }
        details.push(footer);
        setAiAnalysisResult({
          type: 'grade',
          title: `Cham Do Kho Su Pham (${response?.readabilityScore ?? '?'}/100)`,
          details,
        });
        showToast('AI: Da phan tich do doc de hieu cho hoc sinh!', 'success');
      } else if (action === 'extract') {
        const concepts = response?.concepts || [];
        setAiAnalysisResult({
          type: 'extract',
          title: `Trich Xuat Khai Niem STEM (${concepts.length} Khai niem)`,
          details: [
            ...(concepts.length
              ? concepts.map(
                  (c: any) =>
                    `#${String(c.name || '').replace(/\s+/g, '')} [${c.category || 'STEM'}] - Muc do: ${
                      c.importance || 'Quan trong'
                    }`
                )
              : ['Khong trich xuat duoc khai niem nao.']),
            footer,
          ],
        });
        showToast('AI: Da trich xuat cac tu khoa khai niem STEM cot loi!', 'success');
      } else if (action === 'terms') {
        const issues = response?.issues || [];
        setAiAnalysisResult({
          type: 'terms',
          title: `Ra Soat Tinh Nhat Quan Thuat Ngu (${issues.length} canh bao)`,
          details: [
            ...(issues.length
              ? issues.map(
                  (iss: any) =>
                    `[${iss.severity || 'Luu y'}] ${iss.term}: ${iss.issue}${
                      iss.suggestion ? ` (Goi y: ${iss.suggestion})` : ''
                    }`
                )
              : ['Khong phat hien mau thuan thuat ngu khoa hoc.']),
            footer,
          ],
        });
        showToast('AI: Da quet tinh nhat quan thuat ngu khoa hoc!', 'success');
      }
    } catch (err: any) {
      console.error('AI action failed:', err);
      // A missing GEMINI_API_KEY comes back as 503 from the API.
      const message =
        err?.code === 'AI_NOT_CONFIGURED'
          ? 'Chua cau hinh GEMINI_API_KEY o backend (.env).'
          : err?.code === 'AI_BUSY'
            ? 'Mo hinh AI dang qua tai, thu lai sau it phut.'
            : err?.message || 'Khong goi duoc dich vu AI.';
      showToast('Loi AI: ' + message, 'warn');
    } finally {
      setIsAiRunning(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onAuthenticated={(user) => {
          setCurrentRole(user.role);
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {isBootstrapping && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-brand-100 overflow-hidden">
          <div className="h-full w-1/3 bg-brand-600 animate-pulse" />
        </div>
      )}
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Top Header Navigation */}
      <HeaderNav
        currentRole={currentRole}
        userName={currentUser.name}
        userEmail={currentUser.email}
        onLogout={() => {
          authService.logout();
          setIsAuthenticated(false);
        }}
        onRoleChange={handleRoleChange}
        activeGroup={activeGroup}
        onSelectGroup={setActiveGroup}
        onOpenInviteModal={() => setIsInviteWorkspaceModalOpen(true)}
        onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
      />

      {/* 5-Step Sequential Workflow Status Bar */}
      <WorkflowBar
        currentRole={currentRole}
        reviewerMode={reviewerMode}
        script={script}
        onRoleChange={handleRoleChange}
        onSetReviewerMode={setReviewerMode}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
      />

      {/* Main Role View Container */}
      {script.scenes.length === 0 && currentRole !== 'admin' && currentRole !== 'library' && (
        <main className="flex-1 bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-3">
            <div className="text-4xl">📄</div>
            <h2 className="text-lg font-bold text-slate-800">
              {isBootstrapping ? 'Đang tải kịch bản...' : 'Chưa có kịch bản nào'}
            </h2>
            <p className="text-xs text-slate-500">
              {isBootstrapping
                ? 'Đang lấy dữ liệu từ máy chủ.'
                : 'Tổ bộ môn này chưa có kịch bản. Tạo kịch bản đầu tiên để bắt đầu.'}
            </p>
            {!isBootstrapping && currentRole === 'writer' && (
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold"
              >
                + Tạo kịch bản đầu tiên
              </button>
            )}
          </div>
        </main>
      )}

      {script.scenes.length > 0 && currentRole === 'producer' && (
        <ProducerStudio
          script={script}
          selectedScene={selectedScene}
          activeSceneId={activeSceneId}
          setActiveSceneId={setActiveSceneId}
          updateSceneProperty={updateSceneProperty}
          handleAddNewScene={handleAddNewScene}
          handleDeleteScene={handleDeleteScene}
          handleMoveScene={handleMoveScene}
          handleReorderScenes={handleReorderScenes}
          handleDuplicateScene={handleDuplicateScene}
          handleChangeDuration={handleChangeDuration}
          handleUpdateSceneTitle={handleUpdateSceneTitle}
          onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
          onOpenTemplateCatalog={() => setIsSwapAssetModalOpen(true)}
          isRendering={isRendering}
          renderProgress={renderProgress}
          renderStageText={renderStageText}
          renderPercentageText={renderPercentageText}
          startRenderMock={startRenderMock}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
          onSubmitForReview={() => {
            setScript((prev) => ({
              ...prev,
              videoStatus: 'IN_QA',
            }));
            setReviewerMode('video');
            handleRoleChange('reviewer');
            showToast('Đã gửi video sang Bước 4: Reviewer Duyệt Video!', 'success');
          }}
        />
      )}

      {script.scenes.length > 0 && currentRole === 'reviewer' && (
        <ReviewerStudio
          script={script}
          setScript={setScript}
          reviewerMode={reviewerMode}
          setReviewerMode={setReviewerMode}
          selectedScene={selectedScene}
          setActiveSceneId={setActiveSceneId}
          comments={comments}
          currentSec={currentSec}
          setCurrentSec={setCurrentSec}
          seekTimestampSec={seekTimestampSec}
          setSeekTimestampSec={setSeekTimestampSec}
          newCommentInput={newCommentInput}
          setNewCommentInput={setNewCommentInput}
          handleAddComment={handleAddComment}
          onRoleChange={handleRoleChange}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
          showToast={showToast}
        />
      )}

      {script.scenes.length > 0 && currentRole === 'writer' && (
        <WriterStudio
          script={script}
          setScript={setScript}
          selectedScene={selectedScene}
          setActiveSceneId={setActiveSceneId}
          updateSceneProperty={updateSceneProperty}
          handleAddNewScene={handleAddNewScene}
          handleDeleteScene={handleDeleteScene}
          handleMoveScene={handleMoveScene}
          handleReorderScenes={handleReorderScenes}
          onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
          onOpenVersionDiffModal={() => setIsVersionDiffModalOpen(true)}
          onOpenTemplateCatalog={() => setIsSwapAssetModalOpen(true)}
          onRoleChange={handleRoleChange}
          onSetReviewerMode={setReviewerMode}
          aiAnalysisResult={aiAnalysisResult}
          handleTriggerAiAction={handleTriggerAiAction}
          showToast={showToast}
        />
      )}

      {currentRole === 'admin' && (
        <AdminPortal onOpenInviteModal={() => setIsInviteWorkspaceModalOpen(true)} />
      )}

      {currentRole === 'library' && (
        <MediaLibraryView
          script={script}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
        />
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onCreate={handleCreateNewProject}
      />

      <InviteWorkspaceModal
        isOpen={isInviteWorkspaceModalOpen}
        onClose={() => setIsInviteWorkspaceModalOpen(false)}
        onSendInvite={() => showToast('Đã gửi thư mời tham gia nhóm thành công!')}
      />

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        script={script}
        onNotify={showToast}
        selectedScene={selectedScene}
      />

      <TemplateCatalogModal
        isOpen={isSwapAssetModalOpen}
        onClose={() => setIsSwapAssetModalOpen(false)}
        onSelectTemplate={(type, title) => {
          handleAddNewScene(type);
          showToast(`Đã thêm phân cảnh mới: "${title}"!`);
        }}
      />

      <VersionDiffModal
        isOpen={isVersionDiffModalOpen}
        onClose={() => setIsVersionDiffModalOpen(false)}
      />
    </div>
  );
}
