import React, { useState, useEffect, useCallback } from 'react';
import { sceneSaveQueue } from './services/sceneSaveQueue';
import { renderService } from './services/renderService';
import { compositionService, createCompositionSaver, type Composition, type CompositionSaver } from './services/compositionService';
import { STEMScript, FeedbackComment, SceneData, STEMSubject } from './types/stem';
import { LoginScreen } from './components/LoginScreen';
import type { WorkspaceSummary } from './services/workspaceService';
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
import { ToastContainer, ToastItem } from './components/layout/ToastContainer';

// Studio Views
import { ProducerStudio } from './components/views/ProducerStudio/ProducerStudio';
import { WriterStudio } from './components/views/WriterStudio/WriterStudio';
import { ReviewerStudio } from './components/views/ReviewerStudio/ReviewerStudio';
import { AdminPortal } from './components/views/AdminPortal/AdminPortal';
import { MediaLibraryView } from './components/views/MediaLibrary/MediaLibraryView';
import { ProjectDashboardView } from './components/views/ProjectDashboard/ProjectDashboardView';

// Modals
import { TemplateCatalogModal } from './components/modals/TemplateCatalogModal';
import { PublishModal } from './components/modals/PublishModal';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { ManageMembersModal } from './components/modals/ManageMembersModal';
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';
import { DraftReviewModal, PendingDraft } from './components/modals/DraftReviewModal';
import { WorkspacePickerModal } from './components/modals/WorkspacePickerModal';
import { VersionDiffModal } from './components/modals/VersionDiffModal';
import { CreateWorkspaceModal } from './components/modals/CreateWorkspaceModal';
import { pipelineStage } from './lib/pipeline';

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

  // The role the user holds in the active workspace; roles are per workspace.
  const [workspaceRole, setWorkspaceRole] = useState<UserRole | null>(null);
  // Set when the user belongs to several workspaces and has not picked one on this device.
  const [workspaceChoices, setWorkspaceChoices] = useState<WorkspaceSummary[] | null>(null);

  const handleRoleChange = (role: UserRole) => {
    // Only admins switch freely; everyone else works in the role of the active workspace.
    if (currentUser.role !== 'admin' && role !== workspaceRole && role !== 'library') return;
    setCurrentRole(role);
  };

  // Multi-workspace state
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState({ name: 'Đang tải nhóm…', code: '' });
  const [isLeader, setIsLeader] = useState(false);
  const [hasNoWorkspace, setHasNoWorkspace] = useState(false);

  // Central Dynamic Script State (Single Source of Truth).
  // Starts empty: everything on screen comes from the backend, so an empty
  // workspace shows an empty studio rather than somebody else's lesson.
  const [script, setScript] = useState<STEMScript>(EMPTY_SCRIPT);
  const [projectsList, setProjectsList] = useState<STEMScript[]>([]);
  const [isInStudio, setIsInStudio] = useState<boolean>(false);
  const [isFetchingProjects, setIsFetchingProjects] = useState<boolean>(false);
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
    requestId?: string;
    decision?: string;
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
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
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
  const bootstrapInFlight = React.useRef(false);
  /** Loads only server-owned workspace and script data. */
  useEffect(() => sceneSaveQueue.subscribe(event => {
    if (event.scriptId !== script.id) return;
    if (event.error) {
      showToast((event.error as any)?.message || 'Chưa lưu được phân cảnh. Hãy thử lại trước khi gửi duyệt.', 'warn');
      return;
    }
    // Reconcile identity only: a slow save must not replace newer local text.
    setScript(prev => prev.id !== event.scriptId ? prev : {
      ...prev, scenes: prev.scenes.map(scene => ({ ...scene, id: sceneSaveQueue.resolveId(prev.id, scene.id) })),
    });
    setActiveSceneId(id => sceneSaveQueue.resolveId(event.scriptId, id));
  }), [script.id]);

  const bootstrapFromApi = useCallback(async () => {
    if (bootstrapInFlight.current) return;
    bootstrapInFlight.current = true;
    setIsBootstrapping(true);
    try {
      const profile = await authService.fetchCurrentUser();
      setCurrentUser(profile);
      if (profile.mustChangePassword) {
        setIsChangePasswordModalOpen(true);
      }

      // Remembered before resolving, which would otherwise fall back to the first workspace.
      const remembered = workspaceService.getCachedWorkspaceId();
      const myWorkspaces = await workspaceService.getMyWorkspaces(true);

      if (myWorkspaces.length > 0) {
        setHasNoWorkspace(false);
        const active = myWorkspaces.find((w) => w.id === remembered) ?? myWorkspaces[0];
        workspaceService.setActiveWorkspaceId(active.id);
        const wsList = myWorkspaces.map((w) => ({
          id: w.id,
          name: w.name,
          department: w.department || '',
          membersCount: w.membersCount,
          activeProjects: w.activeProjects,
          myRole: w.myRole,
          isLeader: w.isLeader,
        }));
        setWorkspaces(wsList);
        setActiveGroup({ name: active.name, code: active.id.slice(0, 6) });
        setIsLeader(Boolean(active.isLeader));
        setWorkspaceRole(active.myRole ?? null);

        // Only show picker modal for regular users with multiple workspaces if not remembered
        if (profile.role !== 'admin' && myWorkspaces.length > 1 && !remembered) {
          setWorkspaceChoices(myWorkspaces);
          return;
        }
        setWorkspaceChoices(null);

        if (profile.role === 'admin') {
          setCurrentRole('admin');
        } else if (active.myRole) {
          setCurrentRole(active.myRole);
        } else {
          setCurrentRole(profile.role);
        }

        const list = await projectService.getProjects();
        setProjectsList(list);
        if (list.length > 0) {
          showToast(`Đã tải ${list.length} kịch bản từ máy chủ`, 'success');
        } else {
          setScript(EMPTY_SCRIPT);
          setComments([]);
          setActiveSceneId('');
          showToast('Workspace chưa có kịch bản nào. Hãy tạo kịch bản đầu tiên.', 'info');
        }
      } else {
        setHasNoWorkspace(true);
        setWorkspaces([]);
        setActiveGroup({ name: 'Chưa có nhóm', code: '------' });
        setIsLeader(false);
        setWorkspaceRole(null);
        setScript(EMPTY_SCRIPT);
        setComments([]);
        setActiveSceneId('');
        if (profile.role === 'admin') {
          setCurrentRole('admin');
          showToast('Hệ thống chưa có không gian làm việc nào. Vui lòng tạo nhóm đầu tiên.', 'info');
        } else {
          showToast('Tài khoản của bạn chưa được phân vào không gian làm việc nào.', 'warn');
        }
      }
    } catch (error: any) {
      console.error('[bootstrap] Không tải được dữ liệu từ backend:', error);
      showToast('Không tải được dữ liệu từ máy chủ. Kiểm tra backend đã chạy chưa.', 'warn');
    } finally {
      bootstrapInFlight.current = false;
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
    const onPasswordChangeReq = () => {
      setIsChangePasswordModalOpen(true);
    };
    const onWorkspaceChanged = (e: any) => {
      const wsId = e.detail?.workspaceId;
      if (wsId) {
        workspaceService.setActiveWorkspaceId(wsId);
        void bootstrapFromApi();
      }
    };
    window.addEventListener('stemotion:unauthorized', onUnauthorized);
    window.addEventListener('stemotion:password-change-required', onPasswordChangeReq);
    window.addEventListener('stemotion:workspace-changed', onWorkspaceChanged);
    return () => {
      window.removeEventListener('stemotion:unauthorized', onUnauthorized);
      window.removeEventListener('stemotion:password-change-required', onPasswordChangeReq);
      window.removeEventListener('stemotion:workspace-changed', onWorkspaceChanged);
    };
  }, [bootstrapFromApi]);

  // Production Workspace (proposal): an approved script opens for the producer
  // as a draft of its own. The approved script stays as the reviewer saw it.
  const inProduction = currentRole === 'producer' && script.scriptStatus === 'APPROVED' && Boolean(script.id);
  const [composition, setComposition] = useState<Composition | null>(null);
  const [isSavingComposition, setIsSavingComposition] = useState(false);
  const compositionSaver = React.useRef<CompositionSaver | null>(null);

  const loadComposition = useCallback(async (projectId: string) => {
    compositionSaver.current?.dispose();
    compositionSaver.current = null;
    try {
      const draft = await compositionService.get(projectId);
      compositionSaver.current = createCompositionSaver(projectId, draft.revision, {
        onSaved: (saved) => {
          setIsSavingComposition(false);
          setComposition((prev) => (prev && prev.projectId === saved.projectId
            ? { ...prev, revision: saved.revision, updatedAt: saved.updatedAt, updatedByName: saved.updatedByName }
            : prev));
        },
        onError: (error: any) => {
          setIsSavingComposition(false);
          showToast(error?.status === 409
            ? 'Bản dựng vừa được lưu ở nơi khác; đã tải lại bản mới nhất.'
            : error?.message || 'Không lưu được bản dựng.', 'warn');
          void loadComposition(projectId);
        },
      });
      setComposition(draft);
    } catch (error: any) {
      setComposition(null);
      showToast('Không mở được bản dựng: ' + (error?.message || 'lỗi máy chủ'), 'warn');
    }
  }, []);

  useEffect(() => {
    if (!inProduction) {
      compositionSaver.current?.dispose();
      compositionSaver.current = null;
      setComposition(null);
      return;
    }
    // Reloaded when the clip changes state: rendering, in review and approved lock the draft.
    void loadComposition(script.id);
  }, [inProduction, script.id, script.videoStatus, loadComposition]);
  useEffect(() => () => compositionSaver.current?.dispose(), []);

  // What the studio shows: the producer's draft in production, the script otherwise.
  const viewScript: STEMScript = inProduction && composition ? { ...script, scenes: composition.scenes } : script;

  // Active scene pointer
  const selectedScene = viewScript.scenes.find((s) => s.id === activeSceneId) || viewScript.scenes[0];

  /** Producer edits: per-scene properties of the draft; scenes and templates stay as approved. */
  const editComposition = (change: (scenes: SceneData[]) => SceneData[]) => {
    if (!composition) {
      setScript((prev) => ({ ...prev, scenes: change(prev.scenes) }));
      return;
    }
    if (!composition.editable) {
      showToast(composition.lockedReason || 'Bản dựng đang khóa.', 'warn');
      return;
    }
    setComposition((prev) => {
      if (!prev) return prev;
      const next = { ...prev, scenes: change(prev.scenes) };
      compositionSaver.current?.schedule(next.scenes);
      return next;
    });
    setIsSavingComposition(true);
  };

  // Dynamic Scene Updater (Live Props Binding via Service Layer)
  const canEditScript = () => {
    // The producer edits the composition (editComposition), never the approved script.
    if (inProduction) {
      showToast('Bản dựng giữ đúng danh sách, thứ tự và template cảnh đã duyệt; Producer chỉnh thuộc tính từng cảnh.', 'warn');
      return false;
    }
    // Roles are per workspace: the role of the active workspace decides, not the account role.
    if (!['DRAFT', 'CHANGE_REQUESTED'].includes(script.scriptStatus)
      || !(currentRole === 'writer' || currentRole === 'producer' || currentUser.role === 'admin')) {
      showToast(currentRole === 'producer'
        ? 'Producer chỉ dựng và chỉnh sửa video khi kịch bản chưa khóa xuất bản.'
        : 'Kịch bản đã gửi duyệt hoặc đã được phê duyệt, Writer không thể chỉnh sửa.', 'warn');
      return false;
    }
    return true;
  };
  const updateSceneProperty = (updater: (s: any) => any) => {
    if (!selectedScene) return;
    if (inProduction) {
      const id = selectedScene.id;
      editComposition((scenes) => scenes.map((sc) => (sc.id === id ? updater(sc) : sc)));
      return;
    }
    if (currentRole === 'producer' && !['APPROVED', 'PUBLISHED'].includes(script.videoStatus || '')) {
      const id = selectedScene.id;
      setScript((prev) => ({
        ...prev,
        scenes: prev.scenes.map((sc) => (sc.id === id ? updater(sc) : sc)),
      }));
      return;
    }
    if (!canEditScript()) return;
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
    if (!canEditScript()) return;
    try {
      const { updatedScript, newScene } = await scriptService.addScene(script, type);
      setScript(updatedScript);
      setActiveSceneId(newScene.id);
      showToast(`Đã thêm Scene mới (${type}) vào kịch bản!`);
    } catch (err) {
      showToast((err as any)?.message || 'Không thêm được phân cảnh.', 'warn');
    }
  };

  // Delete scene dynamically via Service Layer
  const handleDeleteScene = async (sceneId: string) => {
    if (!canEditScript()) return;
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
      showToast((err as any)?.message || 'Không xóa được phân cảnh.', 'warn');
    }
  };

  const handleUpdateSceneTitle = async (sceneId: string, newTitle: string) => {
    await updateSceneProperty((s) => (s.id === sceneId ? { ...s, title: newTitle } : s));
    showToast('Đã đổi tên phân cảnh thành công!');
  };

  const persistSceneList = async (scenes: SceneData[], message: string, activeId?: string) => {
    try {
      const saved = await sceneSaveQueue.saveNow(script.id, scenes);
      setScript(prev => prev.id === saved.id ? saved : prev);
      if (activeId) setActiveSceneId(sceneSaveQueue.resolveId(script.id, activeId));
      showToast(message);
    } catch (error: any) { showToast(error?.message || 'Không lưu được thay đổi phân cảnh.', 'warn'); }
  };

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    if (!canEditScript()) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= script.scenes.length) return;
    const newScenes = [...script.scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;
    void persistSceneList(newScenes, `Đã di chuyển phân cảnh sang vị trí ${targetIndex + 1}.`);
  };

  const handleReorderScenes = (fromIndex: number, toIndex: number) => {
    if (!canEditScript()) return;
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
    void persistSceneList(newScenes, `Đã di chuyển phân cảnh đến vị trí ${toIndex + 1}.`);
  };

  const handleDuplicateScene = (scene: SceneData) => {
    if (!canEditScript()) return;
    const duplicated: SceneData = {
      ...scene,
      id: `scene_${Date.now()}`,
      title: `${scene.title} (Bản sao)`,
    };
    const currentIdx = script.scenes.findIndex((s) => s.id === scene.id);
    const newScenes = [...script.scenes];
    newScenes.splice(currentIdx + 1, 0, duplicated);
    void persistSceneList(newScenes, 'Đã nhân bản phân cảnh.', duplicated.id);
  };

  const handleChangeDuration = (sceneId: string, seconds: number) => {
    const frames = Math.max(1, Math.round(seconds * (script.fps || 30)));
    if (inProduction) {
      editComposition((scenes) => scenes.map((sc) => (sc.id === sceneId ? { ...sc, durationInFrames: frames } : sc)));
      return;
    }
    if (!canEditScript()) return;
    const scenes = script.scenes.map(scene => scene.id === sceneId ? { ...scene, durationInFrames: frames } : scene);
    void persistSceneList(scenes, `Đã chỉnh thời lượng cảnh thành ${seconds} giây.`);
  };

  const renderGeneration = React.useRef(0);
  useEffect(() => { setIsRendering(false); return () => { renderGeneration.current++; }; }, [script.id]);

  const startRender = async () => {
    if (isRendering || !script.id) return;
    const generation = ++renderGeneration.current;
    const projectId = script.id;
    setIsRendering(true);
    setRenderProgress(0);
    setRenderPercentageText('0%');
    setRenderStageText('Đang gửi yêu cầu kết xuất…');
    try {
      // The render takes the saved draft, so the last edit must reach the server first.
      if (inProduction) await compositionSaver.current?.flush();
      let job = await renderService.requestRender(projectId, { fps: script.fps || 30 });
      showToast('Máy chủ đã nhận yêu cầu kết xuất.', 'info');
      const deadline = Date.now() + 20 * 60 * 1000;
      while (generation === renderGeneration.current) {
        setRenderProgress(job.progressPercentage);
        setRenderPercentageText(`${job.progressPercentage}%`);
        setRenderStageText(job.stage || job.status);
        if (job.status === 'FAILED') throw new Error(job.errorMessage || 'Kết xuất thất bại');
        if (job.status === 'COMPLETED') {
          if (!job.outputUrl) throw new Error('Máy chủ chưa trả về video.');
          const rendered = await projectService.getProjectById(projectId);
          if (generation !== renderGeneration.current) return;
          setScript(rendered);
          showToast('Video đã kết xuất thành công! File MP4 đã sẵn sàng.', 'success');
          return;
        }
        if (Date.now() >= deadline) throw new Error('Hết thời gian theo dõi. Job có thể vẫn chạy trên máy chủ.');
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (generation !== renderGeneration.current) return;
        job = await renderService.getRenderStatus(job.id);
      }
    } catch (error: any) {
      if (generation === renderGeneration.current) {
        setRenderStageText('Chưa hoàn tất kết xuất');
        showToast(error.message || 'Không kết nối được dịch vụ kết xuất.', 'warn');
      }
    } finally {
      if (generation === renderGeneration.current) setIsRendering(false);
    }
  };

  const handleSubmitVideoForReview = async () => {
    try {
      const updated = await reviewService.submitVideoForReview(script.id);
      setScript(updated);
      showToast('Đã gửi clip sang cho Reviewer thẩm định chất lượng trên Web Player!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể gửi video duyệt.', 'warn');
    }
  };

  // Reviewer add comment dynamically
  const [newCommentInput, setNewCommentInput] = useState('');

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;
    try {
    const newC = await reviewService.addComment(script.id, {
      author: currentUser.name,
      avatar: currentUser.name.slice(0, 2).toUpperCase(),
      role: 'Reviewer',
      timestampSec: Math.round(currentSec * 10) / 10,
      sceneId: reviewerMode === 'script' ? selectedScene?.id : undefined,
      content: newCommentInput.trim(),
      status: 'OPEN',
      createdAt: 'Vừa xong',
    });
    setComments((prev) => [...prev, newC]);
    setNewCommentInput('');
    showToast(
      'Máy chủ đã lưu nhận xét.',
      'info'
    );
    } catch (error: any) {
      showToast(error.message || 'Chưa lưu được nhận xét. Nội dung vẫn được giữ để thử lại.', 'warn');
    }
  };

  // An AI draft waiting for the writer's decision; nothing is saved until they choose.
  const [pendingDraft, setPendingDraft] = useState<
    (PendingDraft & { subject: STEMSubject; grade: string; requestId?: string }) | null
  >(null);

  const recordDraftDecision = async (requestId: string | undefined, decision: 'ACCEPTED' | 'IGNORED') => {
    if (!requestId) return;
    try {
      await scriptService.decideAiRequest(requestId, decision);
    } catch {
      showToast('Đã tạo dự án; chưa lưu được quyết định với gợi ý AI.', 'warn');
    }
  };

  const [dashboardScope, setDashboardScope] = useState<'WORKSPACE' | 'MINE'>('WORKSPACE');

  const refreshProjectsList = async (overrideScope?: 'WORKSPACE' | 'MINE') => {
    const scopeToUse = overrideScope || dashboardScope;
    setIsFetchingProjects(true);
    try {
      const list = scopeToUse === 'MINE'
        ? await projectService.getMyScripts()
        : await projectService.getProjects();
      setProjectsList(list);
    } catch (e: any) {
      showToast('Không làm mới được danh sách: ' + (e?.message || 'lỗi máy chủ'), 'warn');
    } finally {
      setIsFetchingProjects(false);
    }
  };

  const handleScopeChange = (newScope: 'WORKSPACE' | 'MINE') => {
    setDashboardScope(newScope);
    void refreshProjectsList(newScope);
  };

  /** Opens another project of the workspace, e.g. from the dashboard or pipeline board. */
  const openProject = async (projectId: string) => {
    try {
      const full = await projectService.getProjectById(projectId);
      const stage = pipelineStage(full);

      // Guard: Producer chỉ mở khi kịch bản đã được duyệt
      if (currentRole === 'producer' && (stage === 'DRAFT' || stage === 'SCRIPT_REVIEW')) {
        showToast('Kịch bản chưa được phê duyệt. Producer chỉ sản xuất khi kịch bản ở trạng thái Approved.', 'warn');
        return;
      }

      // Guard: Reviewer chỉ mở khi kịch bản đã gửi duyệt hoặc video cần duyệt
      if (currentRole === 'reviewer' && stage === 'DRAFT') {
        showToast('Kịch bản này còn đang là Bản nháp của tác giả, chưa gửi duyệt.', 'info');
        return;
      }

      // Tự động chọn chế độ duyệt phù hợp: chỉ vào duyệt video khi Producer đã nộp video
      if (currentRole === 'reviewer') {
        const isVideoReady =
          full.videoStatus === 'IN_QA' ||
          full.videoStatus === 'APPROVED' ||
          full.videoStatus === 'PUBLISHED';
        setReviewerMode(isVideoReady ? 'video' : 'script');
      }

      setScript(full);
      setActiveSceneId(full.scenes?.[0]?.id || '');
      setComments(await reviewService.getComments(full.id));
      setIsInStudio(true);
    } catch (err: any) {
      showToast('Không mở được dự án: ' + (err?.message || 'lỗi máy chủ'), 'warn');
    }
  };

  const openNewProject = (newScript: STEMScript) => {
    setScript(newScript);
    setActiveSceneId(newScript.scenes[0]?.id || '');
    setCurrentRole('writer');
    setIsInStudio(true);
    void refreshProjectsList();
  };

  const acceptDraft = async () => {
    if (!pendingDraft) return;
    try {
      const newScript = await projectService.createProject({
        title: pendingDraft.title,
        subject: pendingDraft.subject,
        gradeLevel: pendingDraft.grade,
        scenes: pendingDraft.scenes,
      });
      await recordDraftDecision(pendingDraft.requestId, 'ACCEPTED');
      setPendingDraft(null);
      openNewProject(newScript);
      showToast(`Đã dùng bản nháp AI (${newScript.scenes.length} cảnh). Hãy chỉnh lại trước khi gửi duyệt.`, 'success');
    } catch (err: any) {
      showToast('Không tạo được dự án: ' + (err?.message || 'lỗi máy chủ'), 'warn');
    }
  };

  const ignoreDraft = async () => {
    if (!pendingDraft) return;
    try {
      const newScript = await projectService.createProject({
        title: pendingDraft.title,
        subject: pendingDraft.subject,
        gradeLevel: pendingDraft.grade,
      });
      await recordDraftDecision(pendingDraft.requestId, 'IGNORED');
      setPendingDraft(null);
      openNewProject(newScript);
      showToast('Đã bỏ qua bản nháp AI. Dự án trống đã sẵn sàng để bạn tự viết.', 'info');
    } catch (err: any) {
      showToast('Không tạo được dự án: ' + (err?.message || 'lỗi máy chủ'), 'warn');
    }
  };

  const handleCreateNewProject = async (
    title: string,
    subject: STEMSubject,
    grade: string,
    useAi: boolean = true,
    targetDurationSec: number = 0,
    approach?: string
  ) => {
    try {
      if (useAi) {
        showToast(`AI đang soạn bản nháp gợi ý cho "${title}"...`, 'info');
        const aiDraft = await scriptService.generateScriptWithAI(title, subject, grade, targetDurationSec, approach);
        // Shown to the writer first; the project is created only after they decide.
        setPendingDraft({
          title: aiDraft.title,
          scenes: aiDraft.scenes,
          approachName: aiDraft.approachName,
          flow: aiDraft.flow,
          subject,
          grade,
          requestId: aiDraft.aiRequestId,
        });
        return;
      }
      const newScript = await projectService.createProject({
        title,
        subject,
        gradeLevel: grade,
      });
      setScript(newScript);
      setActiveSceneId(newScript.scenes[0]?.id || '');
      setCurrentRole('writer');
      setIsInStudio(true);
      void refreshProjectsList();
      showToast(`Đã tạo dự án mới: "${title}"! Đang mở Writer Studio.`);
    } catch (err: any) {
      // No local fallback: a project that only exists in the browser would be
      // lost on reload and hide the real failure.
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
          requestId: res.requestId,
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
            `Cap do tiep can danh gia: ${response.estimatedGrade} (${
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
          requestId: res.requestId,
          type: 'grade',
          title: `Cham Do Kho Su Pham (${response?.readabilityScore ?? '?'}/100)`,
          details,
        });
        showToast('AI: Da phan tich do doc de hieu cho hoc sinh!', 'success');
      } else if (action === 'extract') {
        const concepts = response?.concepts || [];
        setAiAnalysisResult({
          requestId: res.requestId,
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
          requestId: res.requestId,
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
          if (user.mustChangePassword) {
            setIsChangePasswordModalOpen(true);
          }
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
        accountRole={currentUser.role}
        isLeader={isLeader}
        userName={currentUser.name}
        userEmail={currentUser.email}
        onLogout={() => {
          authService.logout();
          setIsAuthenticated(false);
          setIsChangePasswordModalOpen(false);
          setIsManageMembersModalOpen(false);
        }}
        onRoleChange={handleRoleChange}
        activeGroup={activeGroup}
        groups={workspaces}
        onSelectGroup={(workspaceId) => {
          if (!workspaces.some((workspace) => workspace.id === workspaceId) || isBootstrapping) return;
          workspaceService.setActiveWorkspaceId(workspaceId);
          setScript(EMPTY_SCRIPT);
          setComments([]);
          setActiveSceneId('');
          setIsInStudio(false);
          void bootstrapFromApi();
        }}
        onOpenManageMembersModal={() => setIsManageMembersModalOpen(true)}
        onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
        onCreateWorkspace={() => setIsCreateWorkspaceModalOpen(true)}
        onNavigateToDashboard={() => setIsInStudio(false)}
        isInStudio={isInStudio}
      />

      {hasNoWorkspace && currentUser.role !== 'admin' && (
        <main className="flex-1 bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="text-4xl">🏢</div>
            <h2 className="text-base font-extrabold text-slate-900">
              Chưa Được Phân Vào Không Gian Làm Việc
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tài khoản của bạn chưa được phân vào không gian làm việc nào. Vui lòng liên hệ Quản trị viên để được gán vào nhóm sản xuất.
            </p>
            <button
              type="button"
              onClick={() => {
                authService.logout();
                setIsAuthenticated(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </main>
      )}

      {/* Main Role View Container */}
      {!hasNoWorkspace && currentRole !== 'admin' && currentRole !== 'library' && !isInStudio && (
        <ProjectDashboardView
          scripts={projectsList}
          currentRole={currentRole}
          activeGroupName={activeGroup.name}
          onSelectProject={(projectId) => void openProject(projectId)}
          onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
          onRefresh={() => void refreshProjectsList()}
          isRefreshing={isFetchingProjects}
          scope={dashboardScope}
          onScopeChange={handleScopeChange}
        />
      )}

      {!hasNoWorkspace && isInStudio && script.scenes.length === 0 && currentRole !== 'admin' && currentRole !== 'library' && (
        <main className="flex-1 bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-3">
            <div className="text-4xl">📄</div>
            <h2 className="text-lg font-bold text-slate-800">
              {isBootstrapping ? 'Đang tải kịch bản...' : 'Kịch bản chưa có phân cảnh'}
            </h2>
            <p className="text-xs text-slate-500">
              {isBootstrapping
                ? 'Đang lấy dữ liệu từ máy chủ.'
                : 'Kịch bản này chưa có nội dung. Thêm phân cảnh hoặc quay lại danh sách.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsInStudio(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                ← Về kho kịch bản
              </button>
              {!isBootstrapping && currentRole === 'writer' && (
                <button
                  onClick={() => handleAddNewScene('MATH_FORMULA')}
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + Thêm phân cảnh
                </button>
              )}
            </div>
          </div>
        </main>
      )}

      {isInStudio && script.scenes.length > 0 && currentRole === 'producer' && (
        <ProducerStudio
          script={viewScript}
          production={inProduction && composition ? {
            revision: composition.revision,
            scriptVersionNo: composition.scriptVersionNo,
            editable: composition.editable,
            lockedReason: composition.lockedReason,
            saving: isSavingComposition,
          } : undefined}
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
          startRender={startRender}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
          onSubmitForReview={handleSubmitVideoForReview}
          showToast={showToast}
        />
      )}

      {isInStudio && script.scenes.length > 0 && currentRole === 'reviewer' && (
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
          onOpenProject={openProject}
          onStartRender={startRender}
          isRendering={isRendering}
          showToast={showToast}
        />
      )}

      {isInStudio && script.scenes.length > 0 && currentRole === 'writer' && (
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
          onAiDecision={async (decision) => {
            if (!aiAnalysisResult.requestId) return;
            try {
              await scriptService.decideAiRequest(aiAnalysisResult.requestId, decision);
              setAiAnalysisResult(previous => previous.requestId === aiAnalysisResult.requestId ? ({...previous, decision}) : previous);
              showToast('Đã lưu quyết định AI; nội dung kịch bản chưa thay đổi.', 'success');
            } catch (error: any) { showToast(error.message || 'Không lưu được quyết định AI', 'warn'); }
          }}
          handleTriggerAiAction={handleTriggerAiAction}
          showToast={showToast}
        />
      )}

      {currentRole === 'admin' && (
        <AdminPortal
          onOpenManageMembersModal={() => setIsManageMembersModalOpen(true)}
          onWorkspaceCreated={(workspace) => {
            workspaceService.setActiveWorkspaceId(workspace.id);
            void bootstrapFromApi();
          }}
        />
      )}

      {currentRole === 'library' && (
        <MediaLibraryView
          script={script}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
          showToast={showToast}
        />
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onCreate={handleCreateNewProject}
      />

      <ManageMembersModal
        isOpen={isManageMembersModalOpen}
        onClose={() => setIsManageMembersModalOpen(false)}
        workspaceId={workspaceService.getCachedWorkspaceId() || workspaces[0]?.id || ''}
        workspaceName={
          workspaces.find(
            (w) => w.id === (workspaceService.getCachedWorkspaceId() || workspaces[0]?.id)
          )?.name || (activeGroup.name !== 'Chưa có nhóm' ? activeGroup.name : (workspaces[0]?.name || 'Không gian làm việc'))
        }
        isCurrentUserAdminOrLeader={currentUser.role === 'admin' || isLeader}
        workspaces={workspaces}
        onSelectWorkspace={(newWsId) => {
          workspaceService.setActiveWorkspaceId(newWsId);
          const found = workspaces.find((w) => w.id === newWsId);
          if (found) {
            setActiveGroup({ name: found.name, code: found.id.slice(0, 6) });
          }
          void bootstrapFromApi();
        }}
        onMembersUpdated={() => {
          void bootstrapFromApi();
        }}
      />

      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceModalOpen}
        onClose={() => setIsCreateWorkspaceModalOpen(false)}
        onWorkspaceCreated={(created) => {
          workspaceService.setActiveWorkspaceId(created.id);
          showToast(`Đã tạo không gian làm việc "${created.name}" thành công!`, 'success');
          void bootstrapFromApi();
        }}
      />

      {pendingDraft && (
        <DraftReviewModal draft={pendingDraft} onAccept={acceptDraft} onIgnore={ignoreDraft} />
      )}

      {workspaceChoices && !isChangePasswordModalOpen && (
        <WorkspacePickerModal
          workspaces={workspaceChoices}
          onPick={(workspaceId) => {
            workspaceService.setActiveWorkspaceId(workspaceId);
            setWorkspaceChoices(null);
            void bootstrapFromApi();
          }}
        />
      )}

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onSuccess={() => {
          setIsChangePasswordModalOpen(false);
          setCurrentUser((prev) => ({ ...prev, mustChangePassword: false }));
          showToast('Đổi mật khẩu thành công! Chào mừng bạn đến với STEMotion.', 'success');
        }}
        onLogout={() => {
          authService.logout();
          setIsAuthenticated(false);
          setIsChangePasswordModalOpen(false);
          setIsManageMembersModalOpen(false);
        }}
      />

      <PublishModal
        canPublish={currentRole === 'producer' || currentUser.role === 'admin'}
        onPublished={async () => {
          const published = await projectService.getProjectById(script.id);
          setScript(previous => previous.id === published.id ? published : previous);
        }}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        script={script}
        onNotify={showToast}
        selectedScene={selectedScene}
      />

      <TemplateCatalogModal
        isOpen={isSwapAssetModalOpen}
        onClose={() => setIsSwapAssetModalOpen(false)}
        onSelectTemplate={(type) => {
          // handleAddNewScene reports the outcome itself, including a refusal.
          void handleAddNewScene(type);
        }}
      />

      <VersionDiffModal
        isOpen={isVersionDiffModalOpen}
        onClose={() => setIsVersionDiffModalOpen(false)}
      />
    </div>
  );
}
