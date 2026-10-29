import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sceneSaveQueue } from './services/sceneSaveQueue';
import { renderService, type RenderJobStatus } from './services/renderService';
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
  narrationService,
  UserRole,
} from './services';

// Layout Components
import { HeaderNav } from './components/layout/HeaderNav';
import { ToastContainer, ToastItem } from './components/layout/ToastContainer';

// Studio Views
import { ProducerStudio, type VisualTheme } from './components/views/ProducerStudio/ProducerStudio';
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
import { canRoleOpenProject } from './lib/pipeline';

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

  const leaveLibraryAndAdmin = (nextRole?: UserRole) => {
    setIsLibraryView(false);
    if (nextRole) {
      setCurrentRole(nextRole);
      return;
    }
    if (currentRole === 'admin' || currentRole === 'library') {
      const studioRole = workspaceRole && workspaceRole !== 'admin' && workspaceRole !== 'library'
        ? workspaceRole
        : 'writer';
      setCurrentRole(studioRole);
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    if (role === 'library') {
      if (!await saveBeforeLeave()) return;
      setIsLibraryView(true);
      setIsInStudio(false);
      return;
    }
    // Only admins switch freely; everyone else works in the role of the active workspace.
    if (currentUser.role !== 'admin' && role !== workspaceRole) return;
    if (!await saveBeforeLeave()) return;
    setIsLibraryView(false);
    setCurrentRole(role);
    if (role === 'admin') setIsInStudio(false);
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
  const activeProjectId = React.useRef(script.id);
  activeProjectId.current = script.id;
  const [saveError, setSaveError] = useState('');
  const [writerSaving, setWriterSaving] = useState(false);
  const [projectsList, setProjectsList] = useState<STEMScript[]>([]);
  const [isInStudio, setIsInStudio] = useState<boolean>(false);
  const [isLibraryView, setIsLibraryView] = useState(false);
  const openProjectRequest = React.useRef(0);
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
  const [renderError, setRenderError] = useState('');
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
  const toastTimers = React.useRef<number[]>([]);

  useEffect(() => {
    return () => {
      toastTimers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    // Date.now() alone collided when two toasts fired in the same millisecond,
    // which React reported as duplicate keys.
    const id = Date.now() * 1000 + (toastSeq.current++ % 1000);
    setToasts((prev) => prev.some(t => t.message === message && t.type === type) ? prev : [...prev, { id, message, type }]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, type === 'warn' ? 6000 : 3200);
    toastTimers.current.push(timer);
  };

  // Keep sceneSaveQueue draftRevision in sync with the active script
  useEffect(() => {
    if (script.id && typeof script.draftRevision === 'number') {
      sceneSaveQueue.setDraftRevision(script.id, script.draftRevision);
    }
  }, [script.id, script.draftRevision]);

  const handleReloadScript = async (scriptId: string) => {
    try {
      const reloaded = await projectService.getProjectById(scriptId);
      setScript(reloaded);
      setActiveSceneId(reloaded.scenes[0]?.id || '');
      if (typeof reloaded.draftRevision === 'number') {
        sceneSaveQueue.setDraftRevision(reloaded.id, reloaded.draftRevision);
      }
      setSaveConflict(false);
      setSaveError('');
      showToast('Đã tải lại bản nháp mới nhất từ máy chủ.', 'info');
    } catch (err: any) {
      showToast('Không thể tải lại bản nháp: ' + (err?.message || 'lỗi máy chủ'), 'warn');
    }
  };

  // ---- Load the studio from the backend -----------------------------------
  const bootstrapInFlight = React.useRef(false);
  /** Loads only server-owned workspace and script data. */
  useEffect(() => sceneSaveQueue.subscribe(event => {
    if (event.scriptId !== script.id) return;
    if (event.error) {
      setWriterSaving(false);
      const err = event.error as any;
      const isConflict = err?.code === 'STALE_REVISION' || (err?.status === 409 && err?.code !== 'CONFLICT');
      setSaveConflict(isConflict);
      setSaveError(isConflict
        ? 'Bản nháp vừa được lưu ở nơi khác. Nội dung đang chỉnh vẫn được giữ; tải bản mới để đối chiếu trước khi tiếp tục.'
        : (event.error as any)?.message || 'Chưa lưu được phân cảnh. Hãy thử lại trước khi gửi duyệt.');
      return;
    }
    setWriterSaving(Boolean(event.saving));
    if (!event.saving) {
      setSaveError('');
      setSaveConflict(false);
    }
    // Reconcile identity only: a slow save must not replace newer local text.
    setScript(prev => prev.id !== event.scriptId ? prev : {
      ...prev,
      draftRevision: typeof event.draftRevision === 'number' ? event.draftRevision : prev.draftRevision,
      scenes: prev.scenes.map(scene => ({ ...scene, id: sceneSaveQueue.resolveId(prev.id, scene.id) })),
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
      let myWorkspaces = await workspaceService.getMyWorkspaces(true);
      if (profile.role === 'admin' || myWorkspaces.length === 0) {
        try {
          const allWorkspaces = await workspaceService.getAllWorkspaces();
          if (allWorkspaces && allWorkspaces.length > 0) {
            myWorkspaces = allWorkspaces;
          }
        } catch {
          // keep myWorkspaces
        }
      }

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
          setCurrentRole((prev) => (
            prev === 'writer' || prev === 'reviewer' || prev === 'producer' ? prev : 'admin'
          ));
        } else if (active.myRole) {
          setCurrentRole(active.myRole);
        } else {
          setCurrentRole(profile.role);
        }

        const list = await projectService.getProjects();
        setProjectsList(list);
        if (list.length === 0) {
          setScript(EMPTY_SCRIPT);
          setComments([]);
          setActiveSceneId('');
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
      if (error?.status === 401) {
        showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'info');
      } else {
        showToast('Không tải được dữ liệu từ máy chủ. Kiểm tra backend đã chạy chưa.', 'warn');
      }
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
  const syncDurationsPending = React.useRef(false);
  const [isSyncingDurations, setIsSyncingDurations] = useState(false);
  const producerSubmissionPending = React.useRef(false);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const compositionLoad = React.useRef(0);
  const [saveConflict, setSaveConflict] = useState(false);

  const loadComposition = useCallback(async (projectId: string) => {
    const request = ++compositionLoad.current;
    compositionSaver.current?.dispose();
    compositionSaver.current = null;
    try {
      const draft = await compositionService.get(projectId);
      if (request !== compositionLoad.current || activeProjectId.current !== projectId) return false;
      setSaveError('');
      setSaveConflict(false);
      compositionSaver.current = createCompositionSaver(projectId, draft.revision, {
        onSaved: (saved) => {
          setIsSavingComposition(Boolean(compositionSaver.current?.isDirty?.()));
          setSaveError('');
          setComposition((prev) => (prev && prev.projectId === saved.projectId
            ? { ...prev, revision: saved.revision, updatedAt: saved.updatedAt, updatedByName: saved.updatedByName }
            : prev));
        },
        onError: (error: any) => {
          setIsSavingComposition(false);
          const isStale = error?.code === 'STALE_REVISION' || (error?.status === 409 && error?.code !== 'CONFLICT');
          setSaveConflict(isStale);
          setSaveError(isStale
            ? 'Bản dựng đã được sửa ở nơi khác. Nội dung đang chỉnh vẫn được giữ; tải bản mới để đối chiếu trước khi tiếp tục.'
            : error?.message || 'Không lưu được bản dựng. Nội dung đang chỉnh vẫn được giữ.');
        },
      });
      setComposition(draft);
      return true;
    } catch (error: any) {
      if (request !== compositionLoad.current || activeProjectId.current !== projectId) return false;
      setComposition(null);
      showToast('Không mở được bản dựng: ' + (error?.message || 'lỗi máy chủ'), 'warn');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!inProduction) {
      compositionLoad.current++;
      compositionSaver.current?.dispose();
      compositionSaver.current = null;
      setComposition(null);
      return;
    }
    // Reloaded when the clip changes state: rendering, in review and approved lock the draft.
    void loadComposition(script.id);
    return () => { compositionLoad.current++; };
  }, [inProduction, script.id, script.videoStatus, loadComposition]);
  useEffect(() => () => compositionSaver.current?.dispose(), []);

  // What the studio shows: the producer's draft in production, the script otherwise.
  const viewScript: STEMScript = inProduction && composition ? {
    ...script,
    scenes: composition.scenes,
    visualTheme: (composition.visualTheme as VisualTheme) || script.visualTheme,
  } : script;

  const saveBeforeLeave = async () => {
    if (producerSubmissionPending.current || syncDurationsPending.current) {
      showToast('Vui lòng chờ thao tác đang chạy hoàn tất.', 'info');
      return false;
    }
    try {
      if (inProduction) await compositionSaver.current?.flush();
      else if (script.id) await sceneSaveQueue.flush(script.id);
      return true;
    } catch {
      showToast('Chưa lưu được thay đổi. Hãy thử lưu lại trước khi rời màn hình.', 'warn');
      return false;
    }
  };

  useEffect(() => {
    const warnBeforeClose = (event: BeforeUnloadEvent) => {
      if (!compositionSaver.current?.isDirty?.() && !sceneSaveQueue.isDirty(activeProjectId.current)) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeClose);
    return () => window.removeEventListener('beforeunload', warnBeforeClose);
  }, []);

  const retrySave = async () => {
    try {
      if (inProduction && composition && !saveConflict) {
        setIsSavingComposition(true);
        compositionSaver.current?.schedule(composition.scenes, composition.visualTheme);
        await compositionSaver.current?.flush();
      } else if (!inProduction) await sceneSaveQueue.saveNow(script.id, script.scenes);
    } catch (error: any) { setSaveError(error?.message || 'Chưa lưu được thay đổi.'); }
    finally { setIsSavingComposition(false); }
  };

  const handleUpdateTheme = (theme: VisualTheme) => {
    if (syncDurationsPending.current || producerSubmissionPending.current || saveConflict) return;
    if (inProduction && composition) {
      setComposition((prev) => (prev ? { ...prev, visualTheme: theme } : prev));
      compositionSaver.current?.schedule(composition.scenes, theme);
      setIsSavingComposition(true);
    }
    setScript((prev) => ({ ...prev, visualTheme: theme }));
  };

  const handleProducerSyncDurations = async () => {
    if (syncDurationsPending.current || producerSubmissionPending.current) return;
    if (!composition?.editable || !compositionSaver.current) {
      showToast(composition?.lockedReason || 'Bản dựng chưa sẵn sàng để đồng bộ. Vui lòng mở lại project rồi thử lại.', 'warn');
      return;
    }
    syncDurationsPending.current = true;
    setIsSyncingDurations(true);
    const saver = compositionSaver.current;
    try {
      const res = await narrationService.syncCompositionDurations(script.id, saver);
      if (compositionSaver.current !== saver) return;
      if (res && Array.isArray(res.scenes) && res.scenes.length > 0) {
        const durationMap = new Map(res.scenes.map((s) => [s.id, s.durationInFrames]));
        setScript((prev) => {
          const updatedScenes = prev.scenes.map((sc) => {
            const frames = durationMap.get(sc.id);
            return frames ? { ...sc, durationInFrames: frames } : sc;
          });
          const totalSec = res.totalDurationSeconds || Math.round(
            updatedScenes.reduce((acc, sc) => acc + (sc.durationInFrames || 150), 0) / 30
          );
          return {
            ...prev,
            scenes: updatedScenes,
            totalDurationSeconds: totalSec,
          };
        });
      }
      if (inProduction) {
        if (!await loadComposition(script.id)) return;
      }
      showToast('Đã đồng bộ thời lượng các phân cảnh theo giọng đọc AI thành công!', 'success');
    } catch (err: any) {
      if (compositionSaver.current !== saver) return;
      if (err?.status === 409) {
        if (await loadComposition(script.id)) {
          showToast('Bản dựng đã thay đổi. Đã tải bản mới nhất; hãy kiểm tra rồi đồng bộ lại.', 'warn');
        }
      } else {
        showToast(err?.message || 'Không thể đồng bộ thời lượng từ máy chủ. Vui lòng thử lại.', 'warn');
      }
    } finally {
      syncDurationsPending.current = false;
      setIsSyncingDurations(false);
    }
  };

  // Keep projectsList synchronized with the active script so Dashboard reflects changes immediately
  useEffect(() => {
    if (!script.id) return;
    setProjectsList((prev) =>
      prev.map((p) => (p.id === script.id ? { ...p, ...script } : p))
    );
  }, [script]);

  // Active scene pointer
  const selectedScene = viewScript.scenes.find((s) => s.id === activeSceneId) || viewScript.scenes[0];

  const lastLockToastTimeRef = React.useRef<number>(0);
  const warnLocked = (message: string) => {
    const now = Date.now();
    if (now - lastLockToastTimeRef.current <= 3000) return;
    lastLockToastTimeRef.current = now;
    showToast(message, 'warn');
  };

  /** Producer edits: per-scene properties of the draft; scenes and templates stay as approved. */
  const editComposition = (change: (scenes: SceneData[]) => SceneData[]): boolean => {
    if (syncDurationsPending.current || producerSubmissionPending.current || saveConflict) return false;
    if (!composition) {
      if (['IN_QA', 'APPROVED', 'PUBLISHED'].includes(script.videoStatus || '')) {
        warnLocked('Bản dựng đang khóa (đang chờ Reviewer thẩm định hoặc đã hoàn tất). Không thể chỉnh sửa.');
        return false;
      }
      setScript((prev) => ({ ...prev, scenes: change(prev.scenes) }));
      return true;
    }
    if (!composition.editable) {
      warnLocked(
        composition.lockedReason || 'Bản dựng đang khóa (đang chờ Reviewer thẩm định hoặc đã hoàn tất). Không thể chỉnh sửa.'
      );
      return false;
    }
    setComposition((prev) => {
      if (!prev) return prev;
      const next = { ...prev, scenes: change(prev.scenes) };
      compositionSaver.current?.schedule(next.scenes);
      return next;
    });
    setIsSavingComposition(true);
    return true;
  };

  // Dynamic Scene Updater (Live Props Binding via Service Layer)
  const canEditScript = () => {
    // The producer edits the composition (editComposition), never the approved script.
    if (inProduction) {
      warnLocked('Bản dựng giữ đúng danh sách, thứ tự và template cảnh đã duyệt; Producer chỉnh thuộc tính từng cảnh.');
      return false;
    }
    if (['IN_QA', 'APPROVED', 'PUBLISHED'].includes(script.videoStatus || '')) {
      warnLocked('Video đang trong quá trình duyệt hoặc đã xuất bản, không thể thay đổi.');
      return false;
    }
    // Roles are per workspace: the role of the active workspace decides, not the account role.
    if (!['DRAFT', 'CHANGE_REQUESTED'].includes(script.scriptStatus)
      || !(currentRole === 'writer' || currentRole === 'producer' || currentUser.role === 'admin')) {
      warnLocked(currentRole === 'producer'
        ? 'Producer chỉ dựng và chỉnh sửa video khi kịch bản chưa khóa xuất bản.'
        : 'Kịch bản đã gửi duyệt hoặc đã được phê duyệt, Writer không thể chỉnh sửa.');
      return false;
    }
    return true;
  };
  const updateSceneProperty = (updater: (s: SceneData) => SceneData, sceneId = selectedScene?.id): boolean => {
    if (!sceneId) return false;
    if (inProduction) {
      return editComposition((scenes) => scenes.map((sc) => (sc.id === sceneId ? updater(sc) : sc)));
    }
    if (currentRole === 'producer' && !['IN_QA', 'APPROVED', 'PUBLISHED'].includes(script.videoStatus || '')) {
      setScript((prev) => ({
        ...prev,
        scenes: prev.scenes.map((sc) => (sc.id === sceneId ? updater(sc) : sc)),
      }));
      return true;
    }
    if (!canEditScript()) return false;
    const nextScenes = script.scenes.map((sc) => (sc.id === sceneId ? updater(sc) : sc));
    setScript((prev) => (
      prev.id !== script.id ? prev : { ...prev, scenes: prev.scenes.map((sc) => (sc.id === sceneId ? updater(sc) : sc)) }
    ));
    sceneSaveQueue.schedule(script.id, nextScenes);
    return true;
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

  const handleUpdateSceneTitle = (sceneId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    const source = inProduction && composition ? composition.scenes : script.scenes;
    const current = source.find((scene) => scene.id === sceneId);
    if (!current) {
      showToast('Không tìm thấy phân cảnh để đổi tên.', 'warn');
      return;
    }
    if (!trimmed || trimmed === current.title) return;
    if (updateSceneProperty((scene) => ({ ...scene, title: trimmed }), sceneId)) {
      showToast('Đã đổi tên phân cảnh thành công!');
    }
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
  const renderingProjects = React.useRef(new Set<string>());
  useEffect(() => { setIsRendering(false); setRenderError(''); return () => { renderGeneration.current++; }; }, [script.id]);

  const startRender = async () => {
    if (isRendering || renderingProjects.current.has(script.id) || syncDurationsPending.current || producerSubmissionPending.current || !script.id) return;
    const generation = ++renderGeneration.current;
    const projectId = script.id;
    renderingProjects.current.add(projectId);
    setIsRendering(true);
    setRenderError('');
    setRenderProgress(0);
    setRenderPercentageText('0%');
    setRenderStageText('Đang gửi yêu cầu kết xuất…');
    try {
      // The render takes the saved draft, so the last edit must reach the server first.
      if (inProduction) await compositionSaver.current?.flush();
      let job: RenderJobStatus;
      try {
        job = await renderService.requestRender(projectId, { fps: script.fps || 30 });
      } catch (err: any) {
        // If BE already queued the render job on approveVideo, poll that active job
        const history = await renderService.getHistory(projectId);
        const active = history.find(j => j.status === 'PROCESSING' || j.status === 'QUEUED' || j.status === 'RENDERING');
        if (active) {
          job = await renderService.getRenderStatus(active.jobId);
        } else {
          throw err;
        }
      }
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
        setRenderError(error.message || 'Không kết nối được dịch vụ kết xuất.');
        showToast(error.message || 'Không kết nối được dịch vụ kết xuất.', 'warn');
      }
    } finally {
      renderingProjects.current.delete(projectId);
      if (generation === renderGeneration.current) setIsRendering(false);
    }
  };

  const handleSubmitVideoForReview = async () => {
    if (syncDurationsPending.current || producerSubmissionPending.current) return;
    const saver = compositionSaver.current;
    if (!composition?.editable || composition.projectId !== script.id || !saver) {
      showToast('Bản dựng chưa sẵn sàng để gửi duyệt. Vui lòng tải lại rồi thử lại.', 'warn');
      return;
    }
    producerSubmissionPending.current = true;
    setIsSubmittingVideo(true);
    try {
      const updated = await reviewService.submitSavedVideoForReview(script.id, saver,
        () => compositionSaver.current === saver);
      if (!updated || compositionSaver.current !== saver) return;
      setScript(prev => prev.id === updated.id ? updated : prev);
      showToast('Đã gửi clip sang cho Reviewer thẩm định chất lượng trên Web Player!', 'success');
    } catch (err: any) {
      if (compositionSaver.current !== saver) return;
      showToast(err.message || 'Không thể gửi video duyệt.', 'warn');
    } finally {
      producerSubmissionPending.current = false;
      setIsSubmittingVideo(false);
    }
  };

  // Reviewer add comment dynamically
  const [newCommentInput, setNewCommentInput] = useState('');
  const commentPending = React.useRef(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim() || commentPending.current) return;
    commentPending.current = true;
    setIsAddingComment(true);
    const projectId = script.id;
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
    if (activeProjectId.current !== projectId) return;
    setComments((prev) => [...prev, newC]);
    setNewCommentInput('');
    showToast(
      'Máy chủ đã lưu nhận xét.',
      'info'
    );
    } catch (error: any) {
      showToast(error.message || 'Chưa lưu được nhận xét. Nội dung vẫn được giữ để thử lại.', 'warn');
    } finally {
      commentPending.current = false;
      setIsAddingComment(false);
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
    if (!await saveBeforeLeave()) return;
    const request = ++openProjectRequest.current;
    try {
      const full = await projectService.getProjectById(projectId);
      const loadedComments = await reviewService.getComments(full.id);
      if (request !== openProjectRequest.current) return;
      const gate = canRoleOpenProject(currentRole, full);
      if (!gate.allowed) {
        showToast(gate.message || 'Không mở được kịch bản với vai trò hiện tại.', 'warn');
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
      setComments(loadedComments);
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
      // The modal owns the error state and must retain the user's draft on failure.
      throw err;
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
      if (!await saveBeforeLeave()) throw new Error('Chưa lưu được dự án đang mở. Hãy lưu lại trước khi tạo dự án khác.');
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
      throw err;
    }
  };

  // AI Script Action Trigger in Writer Studio
  // Guards against a second click while a call is in flight.
  const [isAiRunning, setIsAiRunning] = useState(false);
  useEffect(() => {
    setAiAnalysisResult({ type: null, title: 'AI Script Intelligence', details: ['Chọn một tác vụ AI để phân tích kịch bản này.'] });
  }, [script.id]);
  const aiPending = useRef(false);
  const aiDecisionPending = useRef(false);

  const handleTriggerAiAction = async (action: 'resegment' | 'grade' | 'extract' | 'terms') => {
    if (aiPending.current) return;
    aiPending.current = true;
    const projectId = script.id;
    setIsAiRunning(true);

    const rawScript = script.scenes
      .map((s) => s.narration || (s as any).latex || (s as any).question || '')
      .join(' ');

    showToast(`Đang gửi kịch bản cho AI phân tích (${action})...`, 'info');

    try {
      const res = await scriptService.runAiAction(action, rawScript, script.subject, script.gradeLevel);
        if (activeProjectId.current !== projectId) return;
      // runAiAction returns {action, result, model, elapsedMs}; the analysis
      // payload itself sits under `result`.
      const response = res.result;
      const footer = `— ${res.model} · ${(res.elapsedMs / 1000).toFixed(1)}s`;

      if (action === 'resegment') {
        const scenesList = response?.scenes || [];
        setAiAnalysisResult({
          requestId: res.requestId,
          type: 'resegment',
          title: `Phân Cảnh Tự Động (${scenesList.length} Scenes)`,
          details: [
            ...(scenesList.length
              ? scenesList.map(
                  (s: any, idx: number) =>
                    `Scene ${idx + 1} (${s.type || s.templateType || 'Scene'}, ${s.suggestedDurationSec || 15}s): ${
                      s.title ? s.title + ' - ' : ''
                    }${s.narration || s.narrationText || 'Phân cảnh tiêu chuẩn'}`
                )
              : ['AI không đề xuất phân cảnh nào.']),
            footer,
          ],
        });
        showToast('AI: Đã tối ưu hóa phân cảnh thành công!', 'success');
      } else if (action === 'grade') {
        const details: string[] = [];
        if (response?.readabilityScore !== undefined) {
          details.push(`Điểm dễ đọc (Readability Score): ${response.readabilityScore}/100`);
        }
        if (response?.estimatedGrade) {
          details.push(
            `Cấp độ tiếp cận đánh giá: ${response.estimatedGrade} (${
              response.matchesTargetGrade ? 'Khớp chuẩn mục tiêu' : 'Cần tinh chỉnh'
            })`
          );
        }
        if (response?.verdict) {
          details.push(`Nhận định sư phạm: ${response.verdict}`);
        }
        if (Array.isArray(response?.suggestions) && response.suggestions.length > 0) {
          response.suggestions.forEach((sug: string) => details.push(`Gợi ý: ${sug}`));
        }
        details.push(footer);
        setAiAnalysisResult({
          requestId: res.requestId,
          type: 'grade',
          title: `Chấm Độ Khó Sư Phạm (${response?.readabilityScore ?? '?'}/100)`,
          details,
        });
        showToast('AI: Đã phân tích độ đọc dễ hiểu cho học sinh!', 'success');
      } else if (action === 'extract') {
        const concepts = response?.concepts || [];
        setAiAnalysisResult({
          requestId: res.requestId,
          type: 'extract',
          title: `Trích Xuất Khái Niệm STEM (${concepts.length} Khái niệm)`,
          details: [
            ...(concepts.length
              ? concepts.map(
                  (c: any) =>
                    `#${String(c.name || '').replace(/\s+/g, '')} [${c.category || 'STEM'}] - Mức độ: ${
                      c.importance || 'Quan trọng'
                    }`
                )
              : ['Không trích xuất được khái niệm nào.']),
            footer,
          ],
        });
        showToast('AI: Đã trích xuất các từ khóa khái niệm STEM cốt lõi!', 'success');
      } else if (action === 'terms') {
        const issues = response?.issues || [];
        setAiAnalysisResult({
          requestId: res.requestId,
          type: 'terms',
          title: `Rà Soát Tính Nhất Quán Thuật Ngữ (${issues.length} cảnh báo)`,
          details: [
            ...(issues.length
              ? issues.map(
                  (iss: any) =>
                    `[${iss.severity || 'Lưu ý'}] ${iss.term}: ${iss.issue}${iss.suggestion ? ` (Gợi ý: ${iss.suggestion})` : ''}`
                )
              : ['Không phát hiện mâu thuẫn thuật ngữ khoa học.']),
            footer,
          ],
        });
        showToast('AI: Đã quét tính nhất quán thuật ngữ khoa học!', 'success');
      }
    } catch (err: any) {
      console.error('AI action failed:', err);
      // A missing GEMINI_API_KEY comes back as 503 from the API.
      const message =
        err?.code === 'AI_NOT_CONFIGURED'
          ? 'Chưa cấu hình GEMINI_API_KEY ở backend (.env).'
          : err?.code === 'AI_BUSY'
            ? 'Mô hình AI đang quá tải, vui lòng thử lại sau ít phút.'
            : err?.message || 'Không gọi được dịch vụ AI.';
      showToast('Lỗi AI: ' + message, 'warn');
    } finally {
      aiPending.current = false;
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
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(items => items.filter(item => item.id !== id))} />
      {(saveError || writerSaving || isSavingComposition) && <div className="bg-amber-50 text-amber-950 p-3 text-sm flex flex-wrap gap-3 items-center" role={saveError ? 'alert' : 'status'}>
        <span>{saveError || 'Đang lưu thay đổi…'}</span>
        {saveError && !saveConflict && <button disabled={writerSaving || isSavingComposition} onClick={() => void retrySave()} className="underline font-semibold">Thử lưu lại</button>}
        {saveConflict && <button className="underline font-semibold" onClick={() => {
          if (window.confirm(inProduction
            ? 'Tải bản mới sẽ thay thế phần đang chỉnh trên màn hình. Bạn đã sao lưu nội dung cần giữ chưa?'
            : 'Tải bản nháp mới sẽ thay thế các chỉnh sửa chưa lưu trên màn hình. Bạn có chắc chắn muốn tải lại không?')) {
            if (inProduction) void loadComposition(script.id);
            else void handleReloadScript(script.id);
          }
        }}>{inProduction ? 'Tải bản dựng mới nhất' : 'Tải bản nháp mới nhất'}</button>}
      </div>}

      {/* Top Header Navigation */}
      <HeaderNav
        currentRole={currentRole}
        accountRole={currentUser.role}
        isLeader={isLeader}
        userName={currentUser.name}
        userEmail={currentUser.email}
        onLogout={async () => {
          if (!await saveBeforeLeave()) return;
          authService.logout();
          setIsAuthenticated(false);
          setIsChangePasswordModalOpen(false);
          setIsManageMembersModalOpen(false);
        }}
        onRoleChange={handleRoleChange}
        activeGroup={activeGroup}
        groups={workspaces}
        onSelectGroup={async (workspaceId) => {
          if (!workspaces.some((workspace) => workspace.id === workspaceId) || isBootstrapping) return;
          if (!await saveBeforeLeave()) return;
          openProjectRequest.current++;
          workspaceService.setActiveWorkspaceId(workspaceId);
          setScript(EMPTY_SCRIPT);
          setComments([]);
          setActiveSceneId('');
          setIsInStudio(false);
          setIsLibraryView(false);
          void bootstrapFromApi();
        }}
        onOpenManageMembersModal={async () => { if (await saveBeforeLeave()) setIsManageMembersModalOpen(true); }}
        onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
        onCreateWorkspace={async () => { if (await saveBeforeLeave()) setIsCreateWorkspaceModalOpen(true); }}
        onNavigateToDashboard={async () => {
          if (!await saveBeforeLeave()) return;
          leaveLibraryAndAdmin();
          setIsInStudio(false);
        }}
        isInStudio={isInStudio}
        isLibraryView={isLibraryView}
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
      {!hasNoWorkspace && currentRole !== 'admin' && !isLibraryView && !isInStudio && (
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

      {!hasNoWorkspace && isInStudio && script.scenes.length === 0 && currentRole !== 'admin' && !isLibraryView && (
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
                onClick={async () => { if (await saveBeforeLeave()) { leaveLibraryAndAdmin(); setIsInStudio(false); } }}
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

      {isInStudio && !isLibraryView && script.scenes.length > 0 && currentRole === 'producer' && (
        <ProducerStudio
          script={viewScript}
          production={inProduction && composition ? {
            revision: composition.revision,
            scriptVersionNo: composition.scriptVersionNo,
            editable: composition.editable && !saveConflict,
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
          renderError={renderError}
          renderPercentageText={renderPercentageText}
          startRender={startRender}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
          onSubmitForReview={handleSubmitVideoForReview}
          onUpdateTheme={handleUpdateTheme}
          onSyncDurations={handleProducerSyncDurations}
          isSyncingDurations={isSyncingDurations}
          isSubmittingForReview={isSubmittingVideo}
          showToast={showToast}
        />
      )}

      {isInStudio && !isLibraryView && script.scenes.length > 0 && currentRole === 'reviewer' && (
        <ReviewerStudio
          script={script}
          setScript={setScript}
          reviewerMode={reviewerMode}
          setReviewerMode={setReviewerMode}
          selectedScene={selectedScene}
          setActiveSceneId={setActiveSceneId}
          comments={comments}
          onCommentsChange={setComments}
          currentSec={currentSec}
          setCurrentSec={setCurrentSec}
          seekTimestampSec={seekTimestampSec}
          setSeekTimestampSec={setSeekTimestampSec}
          newCommentInput={newCommentInput}
          setNewCommentInput={setNewCommentInput}
          handleAddComment={handleAddComment}
          isAddingComment={isAddingComment}
          onRoleChange={handleRoleChange}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
          onOpenProject={openProject}
          onStartRender={startRender}
          isRendering={isRendering}
          showToast={showToast}
        />
      )}

      {isInStudio && !isLibraryView && script.scenes.length > 0 && currentRole === 'writer' && (
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
          isAiRunning={isAiRunning}
          onAiDecision={async (decision) => {
            if (!aiAnalysisResult.requestId || aiDecisionPending.current) return;
            aiDecisionPending.current = true;
            try {
              await scriptService.decideAiRequest(aiAnalysisResult.requestId, decision);
              setAiAnalysisResult(previous => previous.requestId === aiAnalysisResult.requestId ? ({...previous, decision}) : previous);
              showToast('Đã lưu quyết định AI; nội dung kịch bản chưa thay đổi.', 'success');
            } catch (error: any) { showToast(error.message || 'Không lưu được quyết định AI', 'warn'); }
            finally { aiDecisionPending.current = false; }
          }}
          handleTriggerAiAction={handleTriggerAiAction}
          showToast={showToast}
        />
      )}

      {currentRole === 'admin' && !isLibraryView && (
        <AdminPortal
          onOpenManageMembersModal={() => setIsManageMembersModalOpen(true)}
          onWorkspaceCreated={(workspace) => {
            workspaceService.setActiveWorkspaceId(workspace.id);
            void bootstrapFromApi();
          }}
        />
      )}

      {isLibraryView && (
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
        isAdmin={currentUser.role === 'admin'}
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
        projectId={script.id}
        isOpen={isVersionDiffModalOpen}
        onClose={() => setIsVersionDiffModalOpen(false)}
      />
    </div>
  );
}
