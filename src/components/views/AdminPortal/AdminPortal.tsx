import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActionGuard } from '../../../hooks/useActionGuard';
import { useDialog } from '../../../hooks/useDialog';
import { workspaceService, WorkspaceMemberDto, WorkspaceSummary } from '../../../services/workspaceService';
import {
  adminService,
  AdminDashboardOverview,
  AdminUserDto,
  AdminTemplateDto,
  SystemUserRole,
  SystemUserStatus,
  AiUsagePage,
  AiUsageGroup,
} from '../../../services/adminService';
import { AccountProvisionForm } from './AccountProvisionForm';
import { CreateWorkspaceForm } from './CreateWorkspaceForm';
import {
  UserPlus,
  Activity,
  Users,
  Layers,
  Cpu,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
  Video,
  ShieldCheck,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Edit3,
  X,
} from 'lucide-react';

interface AdminPortalProps {
  /** Members are added from existing accounts; there are no email invitations. */
  onOpenManageMembersModal: () => void;
  onWorkspaceCreated?: (workspace: WorkspaceSummary) => void;
}

type AdminTab = 'MONITORING' | 'USERS' | 'TEMPLATES';

const SUBJECT_LABELS: Record<string, { label: string; pillar: string; badgeClass: string }> = {
  Physics: { label: 'Vật Lý', pillar: 'S — Science', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  Chemistry: { label: 'Hóa Học', pillar: 'S — Science', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Biology: { label: 'Sinh Học', pillar: 'S — Science', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' },
  ComputerScience: { label: 'Tin Học', pillar: 'T — Technology', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  Math: { label: 'Toán Học', pillar: 'M — Mathematics', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

const ROLE_LABELS: Record<SystemUserRole, { label: string; badge: string }> = {
  ADMIN: { label: 'ADMIN (Quản trị)', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  PRODUCER: { label: 'PRODUCER (Sản xuất)', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  REVIEWER: { label: 'REVIEWER (Thẩm định)', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  WRITER: { label: 'WRITER (Biên soạn)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const SCENE_TYPE_OPTIONS = [
  {
    value: 'ILLUSTRATED_EXPLAINER',
    label: 'Minh họa Khái niệm & Trực quan (ILLUSTRATED_EXPLAINER)',
    category: 'Physics',
    theme: 'default',
    recommended: ['Physics', 'Biology'],
    defaultSchema: '{"sceneType":"ILLUSTRATED_EXPLAINER","stemPillar":"Science"}',
  },
  {
    value: 'MATH_FORMULA',
    label: 'Công thức & Phương trình Toán học (MATH_FORMULA)',
    category: 'Math',
    theme: 'academic',
    recommended: ['Math', 'Physics'],
    defaultSchema: '{"sceneType":"MATH_FORMULA","formula":"E = mc^2","stemPillar":"Mathematics"}',
  },
  {
    value: 'CHEMICAL_REACTION',
    label: 'Phương trình & Phản ứng Hóa học (CHEMICAL_REACTION)',
    category: 'Chemistry',
    theme: 'emerald',
    recommended: ['Chemistry', 'Biology'],
    defaultSchema: '{"sceneType":"CHEMICAL_REACTION","equation":"2H2 + O2 -> 2H2O","stemPillar":"Science"}',
  },
  {
    value: 'ALGORITHM_WALKTHROUGH',
    label: 'Thuật toán & Mã nguồn Tin học (ALGORITHM_WALKTHROUGH)',
    category: 'ComputerScience',
    theme: 'cyber',
    recommended: ['ComputerScience', 'Math'],
    defaultSchema: '{"sceneType":"ALGORITHM_WALKTHROUGH","language":"python","stemPillar":"Technology"}',
  },
  {
    value: 'DIAGRAM_EXPLAINER',
    label: 'Sơ đồ Quy trình & Cơ chế (DIAGRAM_EXPLAINER)',
    category: 'Biology',
    theme: 'emerald',
    recommended: ['Biology', 'Chemistry'],
    defaultSchema: '{"sceneType":"DIAGRAM_EXPLAINER","diagramType":"flowchart","stemPillar":"Science"}',
  },
  {
    value: 'DATA_CHART',
    label: 'Biểu đồ & Đồ thị Số liệu (DATA_CHART)',
    category: 'Math',
    theme: 'default',
    recommended: ['Math', 'Physics'],
    defaultSchema: '{"sceneType":"DATA_CHART","chartType":"line","stemPillar":"Mathematics"}',
  },
  {
    value: 'GEOMETRY_SPACE',
    label: 'Hình học Không gian 3D (GEOMETRY_SPACE)',
    category: 'Math',
    theme: 'academic',
    recommended: ['Math'],
    defaultSchema: '{"sceneType":"GEOMETRY_SPACE","shape":"cube","stemPillar":"Mathematics"}',
  },
  {
    value: 'TITLE_HERO',
    label: 'Phân cảnh Mở đầu Bài học (TITLE_HERO)',
    category: 'Physics',
    theme: 'default',
    recommended: ['Math', 'Physics', 'Chemistry', 'Biology', 'ComputerScience'],
    defaultSchema: '{"sceneType":"TITLE_HERO","stemPillar":"Science"}',
  },
  {
    value: 'OUTRO',
    label: 'Phân cảnh Tổng kết & Ghi nhớ (OUTRO)',
    category: 'Physics',
    theme: 'default',
    recommended: ['Math', 'Physics', 'Chemistry', 'Biology', 'ComputerScience'],
    defaultSchema: '{"sceneType":"OUTRO","stemPillar":"Science"}',
  },
];

/** Initials stand in for an avatar the backend does not store yet. */
const initialsOf = (name: string): string => {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};


function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  if (totalItems === 0) return null;
  const start = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span>
          Hiển thị <strong className="text-slate-800">{start}–{end}</strong> trên tổng số <strong className="text-slate-800">{totalItems}</strong>
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-slate-400">Số dòng/trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          title="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Trước</span>
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="px-1 text-slate-400 select-none">…</span>}
                  <button
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      p === currentPage
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          title="Trang sau"
        >
          <span>Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onOpenManageMembersModal, onWorkspaceCreated }) => {
  const actions = useActionGuard();
  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
  const loadSequence = useRef<Record<string, number>>({});
  const reportLoad = (area: string, message = '') => setLoadErrors(old => ({ ...old, [area]: message }));
  const [activeTab, setActiveTab] = useState<AdminTab>('MONITORING');

  // FE-17 state
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // FE-15 state
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([]);
  const [workspaceList, setWorkspaceList] = useState<WorkspaceSummary[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [userSortField, setUserSortField] = useState<'name' | 'email' | 'role' | 'status'>('name');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(8);

  const [templateSortField, setTemplateSortField] = useState<'name' | 'category' | 'previewUrl' | 'isActive'>('name');
  const [templateSortOrder, setTemplateSortOrder] = useState<'asc' | 'desc'>('asc');
  const [templatePage, setTemplatePage] = useState(1);
  const [templatePageSize, setTemplatePageSize] = useState(8);

  const [jobSortField, setJobSortField] = useState<'title' | 'subject' | 'requester' | 'status' | 'progress'>('title');
  const [jobSortOrder, setJobSortOrder] = useState<'asc' | 'desc'>('asc');
  const [jobPage, setJobPage] = useState(1);
  const [jobPageSize, setJobPageSize] = useState(5);

  // FE-16 state
  const [templates, setTemplates] = useState<AdminTemplateDto[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateSubjectFilter, setTemplateSubjectFilter] = useState<string>('ALL');
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    category: string;
    previewUrl: string;
    propsSchema: string;
    isActive: boolean;
    recommendedSubjects: string[];
    defaultVisualTheme: string;
  }>({
    name: '',
    category: 'Physics',
    previewUrl: 'ILLUSTRATED_EXPLAINER',
    propsSchema: '{"sceneType":"ILLUSTRATED_EXPLAINER","stemPillar":"Science"}',
    isActive: true,
    recommendedSubjects: [],
    defaultVisualTheme: '',
  });
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplateDto | null>(null);

  const editDialog = useDialog(Boolean(editingTemplate), 'Chỉnh sửa mẫu hoạt họa', () => setEditingTemplate(null), actions.pending);

  // AI Usage Drill-down state (GET /api/v1/admin/ai-usage)
  const [aiUsagePage, setAiUsagePage] = useState<AiUsagePage | null>(null);
  const [loadingAiUsage, setLoadingAiUsage] = useState(false);
  const [aiUsageFilter, setAiUsageFilter] = useState({
    from: '',
    to: '',
    model: '',
    userId: '',
    page: 0,
    size: 10,
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const notify = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 6000);
  };

  const loadAiUsage = useCallback(async () => {
    const request = (loadSequence.current.aiUsage ?? 0) + 1;
    loadSequence.current.aiUsage = request;
    setLoadingAiUsage(true);
    try {
      const data = await adminService.getAiUsageHistory({
        from: aiUsageFilter.from || undefined,
        to: aiUsageFilter.to || undefined,
        model: aiUsageFilter.model || undefined,
        userId: aiUsageFilter.userId || undefined,
        page: aiUsageFilter.page,
        size: aiUsageFilter.size,
      });
      if (request !== loadSequence.current.aiUsage) return;
      setAiUsagePage(data); reportLoad('aiUsage');
    } catch (err: any) {
      if (request === loadSequence.current.aiUsage) reportLoad('aiUsage', err.message || 'Không tải được lịch sử AI.');
    } finally {
      if (request === loadSequence.current.aiUsage) setLoadingAiUsage(false);
    }
  }, [aiUsageFilter]);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await adminService.getDashboardOverview();
      setOverview(data); reportLoad('overview');
    } catch (error: any) { reportLoad('overview', error.message || 'Không tải được số liệu tổng quan.'); }
    finally { setLoadingOverview(false); }
  }, []);

  const loadUsersAndMembers = useCallback(async () => {
    const request = (loadSequence.current.users ?? 0) + 1;
    loadSequence.current.users = request;
    setLoadingUsers(true);
    try {
      const [allUsers, wsList, activeId] = await Promise.all([
        adminService.getAllUsers(), workspaceService.getAllWorkspaces(), workspaceService.resolveActiveWorkspaceId(),
      ]);
      if (request !== loadSequence.current.users) return;
      setUsers(allUsers); setWorkspaceList(wsList);
      const chosenId = activeId && wsList.some(w => w.id === activeId) ? activeId : wsList[0]?.id || '';
      setCurrentWorkspaceId(chosenId);
      const loadedMembers = chosenId ? await workspaceService.getMembers(chosenId) : [];
      if (request !== loadSequence.current.users) return;
      setMembers(loadedMembers); reportLoad('users');
    } catch (error: any) { if (request === loadSequence.current.users) reportLoad('users', error.message || 'Không tải được tài khoản/thành viên.'); }
    finally { if (request === loadSequence.current.users) setLoadingUsers(false); }
  }, []);

  const handleSwitchWorkspace = async (newWsId: string) => {
    const request = (loadSequence.current.users ?? 0) + 1;
    loadSequence.current.users = request;
    setCurrentWorkspaceId(newWsId);
    setMembers([]);
    workspaceService.setActiveWorkspaceId(newWsId);
    try {
      const wsMembers = await workspaceService.getMembers(newWsId);
      if (request !== loadSequence.current.users) return;
      setMembers(wsMembers);
      reportLoad('members');
      window.dispatchEvent(
        new CustomEvent('stemotion:workspace-changed', { detail: { workspaceId: newWsId } })
      );
    } catch {
      if (request === loadSequence.current.users) reportLoad('members', 'Không tải được thành viên của không gian làm việc.');
    }
  };

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const list = await adminService.getAdminTemplates(false);
      setTemplates(list); reportLoad('templates');
    } catch (error: any) {
      reportLoad('templates', error.message || 'Không tải được mẫu hoạt họa.');
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadUsersAndMembers();
    void loadTemplates();
  }, [loadOverview, loadUsersAndMembers, loadTemplates]);

  useEffect(() => {
    void loadAiUsage();
    return () => { loadSequence.current.aiUsage = (loadSequence.current.aiUsage ?? 0) + 1; };
  }, [loadAiUsage]);

  useEffect(() => {
    const onMembersUpdated = () => {
      void loadUsersAndMembers();
    };
    window.addEventListener('stemotion:workspace-members-updated', onMembersUpdated);
    window.addEventListener('stemotion:workspace-changed', onMembersUpdated);
    return () => {
      window.removeEventListener('stemotion:workspace-members-updated', onMembersUpdated);
      window.removeEventListener('stemotion:workspace-changed', onMembersUpdated);
    };
  }, [loadUsersAndMembers]);

  // Handlers for FE-15 (Users & Roles)
  const handleRoleChange = actions.wrap(async (user: AdminUserDto, newRole: SystemUserRole) => {
    try {
      const updated = await adminService.updateUser(user.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      notify(`Đã cập nhật vai trò của ${user.fullName} thành ${newRole}`);
    } catch (err: any) {
      notify(err?.message || 'Không thể đổi vai trò người dùng.');
    }
  });

  const handleQuickAddToWorkspace = actions.wrap(async (user: AdminUserDto) => {
    try {
      const workspaceId = currentWorkspaceId || (await workspaceService.resolveActiveWorkspaceId());
      if (!workspaceId) return;
      await workspaceService.addMember(workspaceId, { userId: user.id, role: 'writer' });
      await loadUsersAndMembers();
      notify(`Đã thêm ${user.fullName} (${user.email}) vào Không gian làm việc hiện tại!`);
    } catch (err: any) {
      notify(err?.message || 'Không thể thêm thành viên vào Không gian làm việc.');
    }
  });

  const handleDeleteWorkspace = actions.wrap(async () => {
    const curWs = workspaceList.find((w) => w.id === currentWorkspaceId);
    if (!curWs) return;
    if (!window.confirm(`Xác nhận xóa Không gian làm việc "${curWs.name}"? Mọi dữ liệu liên quan sẽ bị xóa vĩnh viễn.`)) return;
    try {
      await workspaceService.deleteWorkspace(curWs.id);
      notify(`Đã xóa Không gian làm việc "${curWs.name}"`);
      await loadUsersAndMembers();
    } catch (err: any) {
      notify(err?.message || 'Không thể xóa Không gian làm việc.');
    }
  });

  const handleRemoveWorkspaceMember = actions.wrap(async (member: WorkspaceMemberDto) => {
    if (!window.confirm(`Xóa ${member.name} (${member.email}) khỏi Không gian làm việc hiện tại?`)) return;
    try {
      const workspaceId = currentWorkspaceId || (await workspaceService.resolveActiveWorkspaceId());
      if (!workspaceId) return;
      await workspaceService.removeMember(workspaceId, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      notify(`Đã xóa ${member.email} khỏi Không gian làm việc.`);
    } catch (err: any) {
      notify(err?.message || 'Không thể xóa thành viên khỏi Không gian làm việc.');
    }
  });

  const handleStatusToggle = actions.wrap(async (user: AdminUserDto) => {
    const nextStatus: SystemUserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await adminService.updateUser(user.id, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      notify(`Đã chuyển trạng thái tài khoản ${user.email} sang ${nextStatus}`);
    } catch (err: any) {
      notify(err?.message || 'Không thể cập nhật trạng thái tài khoản.');
    }
  });

  const handleDeleteUser = actions.wrap(async (user: AdminUserDto) => {
    if (!window.confirm(`Xác nhận xóa tài khoản ${user.fullName} (${user.email})?`)) return;
    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      notify(`Đã xóa tài khoản ${user.email}`);
    } catch (err: any) {
      notify(err?.message || 'Không thể xóa tài khoản đang có dữ liệu liên kết.');
    }
  });

  // Handlers for FE-16 (Templates)
  const handleToggleTemplateActive = actions.wrap(async (tpl: AdminTemplateDto) => {
    try {
      const updated = await adminService.updateTemplate(tpl.id, {
        name: tpl.name,
        category: tpl.category,
        propsSchema: tpl.propsSchema,
        previewUrl: tpl.previewUrl,
        isActive: !tpl.isActive,
      });
      setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? updated : t)));
      notify(`Đã ${updated.isActive ? 'bật' : 'tắt'} mẫu hoạt họa "${tpl.name}"`);
    } catch (err: any) {
      notify(err?.message || 'Không thể cập nhật trạng thái mẫu hoạt họa.');
    }
  });

  const handleCreateTemplate = actions.wrap(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;
    try {
      const created = await adminService.createTemplate({
        ...newTemplate,
        defaultVisualTheme: newTemplate.defaultVisualTheme || undefined,
      });
      setTemplates((prev) => [created, ...prev]);
      setNewTemplate({
        name: '',
        category: 'Physics',
        previewUrl: 'ILLUSTRATED_EXPLAINER',
        propsSchema: '{"sceneType":"ILLUSTRATED_EXPLAINER","stemPillar":"Science"}',
        isActive: true,
        recommendedSubjects: [],
        defaultVisualTheme: '',
      });
      setShowNewTemplateForm(false);
      notify(`Đã đăng ký mẫu Remotion "${created.name}" vào thư viện!`);
    } catch (err: any) {
      notify(err?.message || 'Không thể tạo mẫu hoạt họa mới.');
    }
  });

  const handleUpdateTemplateSubmit = actions.wrap(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.name.trim()) return;
    try {
      const updated = await adminService.updateTemplate(editingTemplate.id, {
        name: editingTemplate.name,
        category: editingTemplate.category,
        propsSchema: editingTemplate.propsSchema,
        previewUrl: editingTemplate.previewUrl,
        isActive: editingTemplate.isActive,
        recommendedSubjects: editingTemplate.recommendedSubjects || [],
        defaultVisualTheme: editingTemplate.defaultVisualTheme || '',
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTemplate(null);
      notify(`Đã cập nhật mẫu Remotion "${updated.name}"!`);
    } catch (err: any) {
      notify(err?.message || 'Không thể cập nhật mẫu hoạt họa.');
    }
  });

  const handleDeleteTemplate = actions.wrap(async (tpl: AdminTemplateDto) => {
    if (!window.confirm(`Xác nhận xóa mẫu "${tpl.name}" khỏi thư viện?`)) return;
    try {
      await adminService.deleteTemplate(tpl.id);
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
      notify(`Đã xóa mẫu "${tpl.name}"`);
    } catch (err: any) {
      notify(err?.message || 'Không thể xóa mẫu hoạt họa.');
    }
  });

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = userSearch.trim().toLowerCase();
    const matchSearch =
      !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, roleFilter]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let comp = 0;
      if (userSortField === 'name') {
        comp = (a.fullName || '').localeCompare(b.fullName || '', 'vi', { sensitivity: 'base' });
      } else if (userSortField === 'email') {
        comp = (a.email || '').localeCompare(b.email || '', 'en', { sensitivity: 'base' });
      } else if (userSortField === 'role') {
        comp = (a.role || '').localeCompare(b.role || '', 'en', { sensitivity: 'base' });
      } else if (userSortField === 'status') {
        comp = (a.status || '').localeCompare(b.status || '', 'en', { sensitivity: 'base' });
      }
      return userSortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredUsers, userSortField, userSortOrder]);

  const totalUserPages = Math.max(1, Math.ceil(sortedUsers.length / userPageSize));
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return sortedUsers.slice(start, start + userPageSize);
  }, [sortedUsers, userPage, userPageSize]);

  const handleUserSort = (field: 'name' | 'email' | 'role' | 'status') => {
    if (userSortField === field) {
      setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortOrder('asc');
    }
    setUserPage(1);
  };

  const filteredTemplates = templates.filter(
    (t) => templateSubjectFilter === 'ALL' || t.category === templateSubjectFilter
  );

  useEffect(() => {
    setTemplatePage(1);
  }, [templateSubjectFilter]);

  const sortedTemplates = useMemo(() => {
    return [...filteredTemplates].sort((a, b) => {
      let comp = 0;
      if (templateSortField === 'name') {
        comp = (a.name || '').localeCompare(b.name || '', 'vi', { sensitivity: 'base' });
      } else if (templateSortField === 'category') {
        comp = (a.category || '').localeCompare(b.category || '', 'en', { sensitivity: 'base' });
      } else if (templateSortField === 'previewUrl') {
        comp = (a.previewUrl || '').localeCompare(b.previewUrl || '', 'en', { sensitivity: 'base' });
      } else if (templateSortField === 'isActive') {
        const valA = a.isActive ? 1 : 0;
        const valB = b.isActive ? 1 : 0;
        comp = valA - valB;
      }
      return templateSortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredTemplates, templateSortField, templateSortOrder]);

  const totalTemplatePages = Math.max(1, Math.ceil(sortedTemplates.length / templatePageSize));
  const paginatedTemplates = useMemo(() => {
    const start = (templatePage - 1) * templatePageSize;
    return sortedTemplates.slice(start, start + templatePageSize);
  }, [sortedTemplates, templatePage, templatePageSize]);

  const handleTemplateSort = (field: 'name' | 'category' | 'previewUrl' | 'isActive') => {
    if (templateSortField === field) {
      setTemplateSortOrder(templateSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTemplateSortField(field);
      setTemplateSortOrder('asc');
    }
    setTemplatePage(1);
  };

  const metrics = overview?.metrics;
  const aiUsage = overview?.aiUsage;
  const renderJobs = overview?.recentRenderJobs || [];

  const sortedJobs = useMemo(() => {
    return [...renderJobs].sort((a, b) => {
      if (jobSortField === 'title') {
        const comp = (a.projectTitle || '').localeCompare(b.projectTitle || '', 'vi', { sensitivity: 'base' });
        return jobSortOrder === 'asc' ? comp : -comp;
      } else if (jobSortField === 'subject') {
        const comp = (a.subject || '').localeCompare(b.subject || '', 'vi', { sensitivity: 'base' });
        return jobSortOrder === 'asc' ? comp : -comp;
      } else if (jobSortField === 'requester') {
        const comp = (a.requestedByName || '').localeCompare(b.requestedByName || '', 'vi', { sensitivity: 'base' });
        return jobSortOrder === 'asc' ? comp : -comp;
      } else if (jobSortField === 'status') {
        const comp = (a.status || '').localeCompare(b.status || '', 'vi', { sensitivity: 'base' });
        return jobSortOrder === 'asc' ? comp : -comp;
      } else if (jobSortField === 'progress') {
        const valA = a.progress || 0;
        const valB = b.progress || 0;
        return jobSortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [renderJobs, jobSortField, jobSortOrder]);

  const totalJobPages = Math.max(1, Math.ceil(sortedJobs.length / jobPageSize));
  const paginatedJobs = useMemo(() => {
    const start = (jobPage - 1) * jobPageSize;
    return sortedJobs.slice(start, start + jobPageSize);
  }, [sortedJobs, jobPage, jobPageSize]);

  const handleJobSort = (field: 'title' | 'subject' | 'requester' | 'status' | 'progress') => {
    if (jobSortField === field) {
      setJobSortOrder(jobSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setJobSortField(field);
      setJobSortOrder('asc');
    }
    setJobPage(1);
  };
  const budgetPercent = aiUsage
    ? Math.min(100, Math.round((aiUsage.estimatedCostUsd / (aiUsage.monthlyBudgetUsd || 20)) * 100))
    : 0;

  return (
    <main className="flex-1 bg-slate-50 p-6 overflow-y-auto">
      {actions.pending && <p role="status" className="sticky top-0 z-50 bg-indigo-50 p-3 text-sm text-indigo-900">Đang lưu thay đổi. Vui lòng chờ…</p>}
      {Object.entries(loadErrors).filter(([, value]) => value).map(([key, value]) => <div key={key} role="alert" className="bg-amber-50 border border-amber-200 p-3 rounded text-sm"><p>{value}</p><button className="underline" onClick={() => { void loadOverview(); void loadUsersAndMembers(); void loadTemplates(); void loadAiUsage(); }}>Thử tải lại dữ liệu</button></div>)}
      <fieldset disabled={actions.pending} aria-busy={actions.pending} className="min-w-0">
      <div className="max-w-7xl w-full mx-auto space-y-6 pb-10">
        {toastMsg && (
          <div role="status" className="fixed bottom-5 right-5 max-w-[calc(100vw-2.5rem)] z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2">
            <span aria-hidden="true">ℹ</span>
            <span>{toastMsg}</span>
            <button type="button" aria-label="Đóng thông báo Admin" onClick={() => setToastMsg(null)}>×</button>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                ADMIN CONTROL CENTER
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                FE-15 • FE-16 • FE-17
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              Bảng Quản Trị Hệ Thống & Giám Sát Vận Hành STEMotion
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý người dùng & phân quyền RBAC (FE-15), Thư viện mẫu hoạt họa Remotion STEM (FE-16), Giám sát hàng đợi Render & Chi phí AI (FE-17).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              disabled={loadingOverview || loadingUsers || loadingTemplates || loadingAiUsage}
              onClick={() => {
                void loadOverview();
                void loadUsersAndMembers();
                void loadTemplates();
                void loadAiUsage();
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{loadingOverview || loadingUsers || loadingTemplates || loadingAiUsage ? 'Đang tải số liệu…' : 'Làm mới số liệu'}</span>
            </button>
            <button
              onClick={onOpenManageMembersModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Quản lý thành viên nhóm</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs for FE-17, FE-15, FE-16 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('MONITORING')}
            className={`flex-1 min-w-[220px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'MONITORING'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>FE-17: Giám Sát Render Queue & AI Cost</span>
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex-1 min-w-[220px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'USERS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>FE-15: Người Dùng & Phân Quyền RBAC ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={`flex-1 min-w-[220px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'TEMPLATES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>FE-16: Quản Lý Kho Remotion Templates ({templates.length})</span>
          </button>
        </div>

        {/* ===================================================================
            TAB 1: FE-17 — MONITOR RENDER QUEUE & STORAGE + AI COST & USAGE
           =================================================================== */}
        {activeTab === 'MONITORING' && (
          <div className="space-y-6">
            {/* Row 1: Host Resource & Render Queue KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Tải CPU & Bộ nhớ JVM</span>
                  <Cpu className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {metrics && metrics.cpuUsage >= 0 ? `${metrics.cpuUsage}%` : 'Chưa có số liệu'}
                  </span>
                  <span className="text-xs text-slate-500">
                    CPU • RAM {metrics?.memoryUsage != null && metrics.memoryUsage >= 0 ? `${metrics.memoryUsage}%` : '—'}
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, metrics?.memoryUsage ?? 0))}%` }}
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Hàng Đợi Render (BullMQ / Worker)</span>
                  <Video className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {metrics?.activeRenderJobs ?? 0} đang chạy
                  </span>
                  <span className="text-xs text-emerald-600 font-bold">
                    • {metrics?.completedToday ?? 0} hoàn tất
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Lỗi hôm nay: <b className="text-rose-600">{metrics?.failedToday ?? 0}</b> • Tỉ lệ thành công:{' '}
                  <b className="text-emerald-600">
                    {metrics?.successRate === -1 || metrics?.successRate == null ? '—' : `${metrics.successRate}%`}
                  </b>
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Dung Lượng Lưu Trữ Video & Audio</span>
                  <HardDrive className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {metrics?.storageUsedGb ?? 0} GB
                  </span>
                  <span className="text-xs text-slate-400">đã sử dụng</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Bao gồm MP4 1080p, cache TTS MP3 & SVG/PNG minh họa.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Chi Phí & Hạn Mức AI (Monthly Cap)</span>
                  <DollarSign className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {aiUsage?.estimatedCostUsd != null ? `$${aiUsage.estimatedCostUsd.toFixed(3)}` : '—'}
                  </span>
                  <span className="text-xs text-slate-400">
                    / {aiUsage?.monthlyBudgetUsd != null ? `$${aiUsage.monthlyBudgetUsd.toFixed(2)}` : 'Chưa cấu hình hạn mức'}
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: AI Usage & Cost Accounting + STEM Subject Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Giám Sát Chi Phí & Hiệu Năng AI (AI_Request Telemetry — FE-17)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Theo dõi lưu lượng sinh kịch bản AI, thẩm định sư phạm & tổng hợp giọng đọc tiếng Việt.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold border border-indigo-200">
                    {aiUsage?.modelName || 'gemini-2.5-flash'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500">Tổng Dự Án STEM</div>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {aiUsage?.totalProjects ?? 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500">Phiên Bản Kịch Bản</div>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {aiUsage?.totalScriptVersions ?? 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500">Phân Cảnh Đã Sinh</div>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {aiUsage?.totalScenesGenerated ?? 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500">Độ Trễ AI TB (SLA &lt; 15s)</div>
                    <div className="text-lg font-extrabold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{aiUsage?.avgLatencyMs != null && aiUsage.avgLatencyMs >= 0 ? `${(aiUsage.avgLatencyMs / 1000).toFixed(1)}s` : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <div>
                    Tổng lượt gọi AI & TTS ước tính:{' '}
                    <b className="text-slate-900">{aiUsage?.estimatedAiCalls ?? 0} requests</b> •{' '}
                    <b className="text-slate-900">
                      {(aiUsage?.estimatedTokensUsed ?? 0).toLocaleString()} tokens
                    </b>
                  </div>
                  <div>
                    Voice Engine:{' '}
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      {aiUsage?.ttsProvider || 'Google Vietnamese TTS (unified_vi_v3)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* STEM Subject Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Phân Bổ Học Liệu Theo 5 Môn STEM
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Độ phủ học liệu theo 5 lĩnh vực STEM.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  {(['Physics', 'Chemistry', 'Biology', 'ComputerScience', 'Math'] as const).map(
                    (subj) => {
                      const count = overview?.projectsBySubject?.[subj] ?? 0;
                      const total = Math.max(1, aiUsage?.totalProjects ?? 1);
                      const pct = Math.min(100, Math.round((count / total) * 100));
                      const meta = SUBJECT_LABELS[subj];
                      return (
                        <div key={subj} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">
                              {meta.label}{' '}
                              <span className="text-[10px] font-normal text-slate-400">
                                ({meta.pillar})
                              </span>
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {count} dự án
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-brand-600 h-full rounded-full"
                              style={{ width: `${Math.max(count > 0 ? 12 : 3, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Row 2.5: AI Usage Telemetry Drill-down (GET /api/v1/admin/ai-usage — UC-31) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-600" />
                    <span>Nhật Ký Sử Dụng AI & Chi Phí Chi Tiết (AI Usage Drill-Down — UC-31)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thống kê chi tiết số lượt request, token tiêu thụ và chi phí ước tính theo ngày, mô hình AI và người dùng.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void loadAiUsage()}
                    disabled={loadingAiUsage}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAiUsage ? 'animate-spin' : ''}`} />
                    <span>Tải lại</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Từ ngày:</span>
                  <input
                    type="date"
                    value={aiUsageFilter.from}
                    onChange={(e) => setAiUsageFilter((prev) => ({ ...prev, from: e.target.value, page: 0 }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Đến ngày:</span>
                  <input
                    type="date"
                    value={aiUsageFilter.to}
                    onChange={(e) => setAiUsageFilter((prev) => ({ ...prev, to: e.target.value, page: 0 }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Model:</span>
                  <input
                    type="text"
                    placeholder="Tất cả model..."
                    value={aiUsageFilter.model}
                    onChange={(e) => setAiUsageFilter((prev) => ({ ...prev, model: e.target.value, page: 0 }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-36"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">User ID:</span>
                  <input
                    type="text"
                    placeholder="Lọc theo User..."
                    value={aiUsageFilter.userId}
                    onChange={(e) => setAiUsageFilter((prev) => ({ ...prev, userId: e.target.value, page: 0 }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-36"
                  />
                </div>
                {(aiUsageFilter.from || aiUsageFilter.to || aiUsageFilter.model || aiUsageFilter.userId) && (
                  <button
                    onClick={() => setAiUsageFilter({ from: '', to: '', model: '', userId: '', page: 0, size: 10 })}
                    className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              {/* Table */}
              {loadingAiUsage ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                  Đang tải dữ liệu AI Usage...
                </div>
              ) : !aiUsagePage || aiUsagePage.content.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  Không tìm thấy bản ghi sử dụng AI nào trong khoảng thời gian đã chọn.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                        <th className="py-2.5 px-3">Ngày</th>
                        <th className="py-2.5 px-3">Mô hình (Model)</th>
                        <th className="py-2.5 px-3">Người dùng (User ID)</th>
                        <th className="py-2.5 px-3 text-right">Lượt gọi</th>
                        <th className="py-2.5 px-3 text-right">Tokens In</th>
                        <th className="py-2.5 px-3 text-right">Tokens Out</th>
                        <th className="py-2.5 px-3 text-right">Chi phí ước tính</th>
                        <th className="py-2.5 px-3 text-center">Thất bại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {aiUsagePage.content.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{row.day}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">{row.model}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{row.userId || 'Hệ thống / Chung'}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{row.requestCount.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(row.tokensIn ?? 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(row.tokensOut ?? 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                            ${row.knownEstimatedCostUsd != null ? Number(row.knownEstimatedCostUsd).toFixed(4) : '0.0000'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row.failedRequests > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px]">
                                {row.failedRequests}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="pt-3 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                    <div>
                      Trang <span className="font-bold text-slate-800">{aiUsagePage.page + 1}</span> / {Math.max(1, aiUsagePage.totalPages)} ({aiUsagePage.totalElements} bản ghi)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setAiUsageFilter((prev) => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
                        disabled={aiUsagePage.page <= 0}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-xs font-semibold cursor-pointer"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setAiUsageFilter((prev) => ({ ...prev, page: prev.page + 1 }))}
                        disabled={aiUsagePage.page >= aiUsagePage.totalPages - 1}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-xs font-semibold cursor-pointer"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: Render Queue & Recent Render Jobs Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Giám Sát Hàng Đợi Kết Xuất Video (RenderJob Queue — FE-17)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Danh sách các tiến trình kết xuất MP4 từ Remotion Worker Pool.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Hiển thị {renderJobs.length} job gần nhất
                </span>
              </div>

              {loadingOverview ? (
                <p className="text-xs text-slate-400 py-4">Đang tải danh sách Render Jobs...</p>
              ) : renderJobs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  Chưa có tiến trình Render MP4 nào được ghi nhận. Khi Producer bấm "Xuất Video MP4", tiến trình sẽ hiển thị trực tiếp tại đây.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-2.5 pr-4">
                            <button
                              type="button"
                              onClick={() => handleJobSort('title')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Dự án bài giảng</span>
                              {jobSortField === 'title' ? (
                                jobSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleJobSort('subject')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Môn STEM</span>
                              {jobSortField === 'subject' ? (
                                jobSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleJobSort('requester')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Người yêu cầu</span>
                              {jobSortField === 'requester' ? (
                                jobSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">Cấu hình</th>
                          <th className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleJobSort('status')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Trạng thái & Tiến độ</span>
                              {jobSortField === 'status' ? (
                                jobSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 pl-3 text-right">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                      {paginatedJobs.map((job) => {
                        const subjMeta = SUBJECT_LABELS[job.subject] || SUBJECT_LABELS.Physics;
                        return (
                          <tr key={job.id} className="hover:bg-slate-50/80">
                            <td className="py-3 pr-4">
                              <div className="font-bold text-slate-900">{job.projectTitle}</div>
                              <div className="text-[10px] font-mono text-slate-400">
                                Job ID: {job.externalJobId || job.id.slice(0, 8)}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${subjMeta.badgeClass}`}
                              >
                                {subjMeta.label}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-medium">
                              {job.requestedByName}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                              {job.resolution.replace('RES_', '')} • {job.fps}fps
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    job.status === 'COMPLETED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : job.status === 'FAILED'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {job.status} ({job.progress}%)
                                </span>
                                {job.stage && (
                                  <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                    {job.stage}
                                  </span>
                                )}
                              </div>
                              {job.errorMessage && (
                                <div className="text-[10px] text-rose-600 mt-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-xs">{job.errorMessage}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 pl-3 text-right">
                              {job.videoUrl ? (
                                <a
                                  href={job.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:underline font-bold"
                                >
                                  Xem MP4 ↗
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  currentPage={jobPage}
                  totalPages={totalJobPages}
                  totalItems={sortedJobs.length}
                  pageSize={jobPageSize}
                  onPageChange={setJobPage}
                  onPageSizeChange={setJobPageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              </>
            )}
          </div>
        </div>
      )}

        {/* ===================================================================
            TAB 2: FE-15 — MANAGE USERS & ROLES (RBAC)
           =================================================================== */}
        {activeTab === 'USERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <AccountProvisionForm onUserCreated={() => void loadUsersAndMembers()} />

              <CreateWorkspaceForm
                onWorkspaceCreated={(workspace) => {
                  workspaceService.setActiveWorkspaceId(workspace.id);
                  void loadUsersAndMembers();
                  onWorkspaceCreated?.(workspace);
                }}
              />

              {/* Workspace Members Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      2. Thành viên Không gian làm việc ({members.length})
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Danh sách thành viên đang tham gia Không gian làm việc hiện tại
                    </p>
                  </div>
                  <button
                    onClick={onOpenManageMembersModal}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                  >
                    + Thêm vào Nhóm
                  </button>
                </div>

                {/* Workspace Switcher Selector */}
                {workspaceList.length > 0 && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 shrink-0">Nhóm:</span>
                      <div className="relative inline-flex items-center">
                        <select
                          value={currentWorkspaceId}
                          onChange={(e) => void handleSwitchWorkspace(e.target.value)}
                          className="text-xs font-bold text-brand-700 bg-white border border-slate-300 rounded-lg pl-2 pr-6 py-1 focus:ring-2 focus:ring-brand-500 focus:outline-hidden cursor-pointer truncate max-w-[180px] appearance-none"
                        >
                          {workspaceList.map((ws) => (
                            <option key={ws.id} value={ws.id}>
                              {ws.name} {ws.department ? `(${ws.department})` : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-1.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-brand-700 font-semibold shrink-0">
                        {currentWorkspaceId.slice(0, 6)}
                      </span>
                      <button
                        onClick={() => void handleDeleteWorkspace()}
                        title="Xóa Không gian làm việc này"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="divide-y divide-slate-100 text-xs max-h-72 overflow-y-auto">
                  {members.map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {initialsOf(m.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{m.name}</div>
                          <div className="text-slate-400 font-mono text-[10px] truncate">{m.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.isLeader && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                            Trưởng nhóm
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-brand-700 font-bold text-[10px] border border-blue-200">
                          {m.role}
                        </span>
                        <button
                          onClick={() => void handleRemoveWorkspaceMember(m)}
                          title="Xóa khỏi Nhóm này"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full System Users RBAC Table */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span>Quản Lý Tài Khoản & Phân Quyền Hệ Thống (RBAC — FE-15)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Loại tài khoản (Thành viên / Quản trị viên), thêm vào Không gian làm việc, khóa hoặc xóa tài khoản. Vai trò Writer / Reviewer / Producer được gán riêng trong từng nhóm.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setUserPage(1); }}
                    className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-slate-50"
                  >
                    <option value="ALL">Tất cả loại tài khoản</option>
                    <option value="WRITER">Thành viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
              </div>

              {loadingUsers ? (
                <p className="text-xs text-slate-400 py-6">Đang tải danh sách tài khoản hệ thống...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-xs text-slate-400 py-6">Không tìm thấy người dùng phù hợp.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-2.5 pr-3">
                            <button
                              type="button"
                              onClick={() => handleUserSort('name')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Người dùng</span>
                              {userSortField === 'name' ? (
                                userSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleUserSort('role')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Vai trò RBAC</span>
                              {userSortField === 'role' ? (
                                userSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">Không gian làm việc hiện tại</th>
                          <th className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleUserSort('status')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Trạng thái</span>
                              {userSortField === 'status' ? (
                                userSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 pl-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                      {paginatedUsers.map((u) => {
                        const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS.WRITER;
                        const isInWorkspace = members.some(
                          (m) => m.userId === u.id || m.email.toLowerCase() === u.email.toLowerCase()
                        );
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80">
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                                  {initialsOf(u.fullName)}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900">{u.fullName}</div>
                                  <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  void handleRoleChange(u, e.target.value as SystemUserRole)
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${roleInfo.badge}`}
                              >
                                <option value="WRITER">Thành viên</option>
                                <option value="ADMIN">Quản trị viên</option>
                                {u.role !== 'WRITER' && u.role !== 'ADMIN' && (
                                  <option value={u.role}>{u.role} (vai trò cũ)</option>
                                )}
                              </select>
                            </td>
                            <td className="py-3 px-3">
                              {u.role === 'ADMIN' ? (
                                <span className="text-[10px] text-slate-400 font-medium">Toàn hệ thống</span>
                              ) : isInWorkspace ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-brand-700 border border-blue-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đã trong Nhóm</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => void handleQuickAddToWorkspace(u)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
                                >
                                  + Thêm vào Nhóm
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => void handleStatusToggle(u)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}
                                title="Bấm để chuyển đổi ACTIVE / INACTIVE"
                              >
                                {u.status}
                              </button>
                            </td>
                            <td className="py-3 pl-3 text-right">
                              <button
                                onClick={() => void handleDeleteUser(u)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  currentPage={userPage}
                  totalPages={totalUserPages}
                  totalItems={sortedUsers.length}
                  pageSize={userPageSize}
                  onPageChange={setUserPage}
                  onPageSizeChange={setUserPageSize}
                  pageSizeOptions={[5, 8, 15, 30]}
                />
              </>
            )}
          </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: FE-16 — MANAGE REMOTION TEMPLATES
           =================================================================== */}
        {activeTab === 'TEMPLATES' && (
          <div className="space-y-6">
            {/* Subject Balance Overview Cards (Review 1 requirement) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['Physics', 'Chemistry', 'Biology', 'ComputerScience', 'Math'] as const).map(
                (subj) => {
                  const meta = SUBJECT_LABELS[subj];
                  const count = templates.filter((t) => t.category === subj).length;
                  const activeCount = templates.filter(
                    (t) => t.category === subj && t.isActive
                  ).length;
                  return (
                    <button
                      key={subj}
                      onClick={() =>
                        setTemplateSubjectFilter((prev) => (prev === subj ? 'ALL' : subj))
                      }
                      className={`text-left p-4 rounded-2xl border transition ${
                        templateSubjectFilter === subj
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`text-[10px] font-mono font-bold ${
                          templateSubjectFilter === subj ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {meta.pillar}
                      </div>
                      <div className="text-sm font-extrabold mt-0.5">{meta.label}</div>
                      <div
                        className={`text-xs mt-2 font-semibold ${
                          templateSubjectFilter === subj ? 'text-emerald-300' : 'text-slate-600'
                        }`}
                      >
                        {activeCount}/{count} mẫu đang bật
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* Template Registry Header & Add Button */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Danh Mục Mẫu Hoạt Họa Remotion STEM (Template Registry — FE-16)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý metadata, cấu hình schema JSON và trạng thái kích hoạt của các mẫu phân cảnh đồ họa Remotion STEM.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {templateSubjectFilter !== 'ALL' && (
                    <button
                      onClick={() => { setTemplateSubjectFilter('ALL'); setTemplatePage(1); }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                    >
                      Hiển thị tất cả môn ({templates.length})
                    </button>
                  )}
                  <button
                    onClick={() => setShowNewTemplateForm((v) => !v)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Đăng ký Mẫu Template mới</span>
                  </button>
                </div>
              </div>

              {showNewTemplateForm && (
                <form
                  onSubmit={handleCreateTemplate}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
                >
                  {/* Preset Buttons for Non-Technical Users */}
                  <div className="md:col-span-4 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Mẫu Cấu Hình Nhanh (Dành cho người không biết lập trình):</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        Bấm 1 chạm để tự động điền JSON chuẩn
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '📐 Toán học (Công thức)', opt: SCENE_TYPE_OPTIONS[1], name: 'Công thức & Định lý Toán học' },
                        { label: '⚛️ Vật Lý (Minh họa)', opt: SCENE_TYPE_OPTIONS[0], name: 'Mô phỏng Hiện tượng Vật Lý' },
                        { label: '🧪 Hóa Học (Phản ứng)', opt: SCENE_TYPE_OPTIONS[2], name: 'Phản ứng & Phương trình Hóa học' },
                        { label: '💻 Tin Học (Mã nguồn)', opt: SCENE_TYPE_OPTIONS[3], name: 'Minh họa Thuật toán Tin học' },
                        { label: '🧬 Sinh Học (Quy trình)', opt: SCENE_TYPE_OPTIONS[4], name: 'Sơ đồ Sinh học & Cơ chế tế bào' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setNewTemplate({
                              ...newTemplate,
                              name: preset.name,
                              category: preset.opt.category,
                              previewUrl: preset.opt.value,
                              propsSchema: preset.opt.defaultSchema,
                              defaultVisualTheme: preset.opt.theme,
                              recommendedSubjects: preset.opt.recommended,
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold shadow-2xs transition cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Tên Mẫu Hoạt Họa (Template Name)
                    </label>
                    <input
                      required
                      placeholder="VD: Mô phỏng Quang hợp tế bào thực vật..."
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Môn STEM Chính</label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, category: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                    >
                      <option value="Physics">Vật Lý (Science)</option>
                      <option value="Chemistry">Hóa Học (Science)</option>
                      <option value="Biology">Sinh Học (Science)</option>
                      <option value="ComputerScience">Tin Học (Technology)</option>
                      <option value="Math">Toán Học (Mathematics)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Loại Phân Cảnh (SceneType)
                    </label>
                    <select
                      value={newTemplate.previewUrl}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        const matched = SCENE_TYPE_OPTIONS.find((opt) => opt.value === selectedVal);
                        setNewTemplate({
                          ...newTemplate,
                          previewUrl: selectedVal,
                          propsSchema: matched ? matched.defaultSchema : newTemplate.propsSchema,
                          category: matched ? matched.category : newTemplate.category,
                          defaultVisualTheme: matched?.theme || newTemplate.defaultVisualTheme,
                          recommendedSubjects: matched?.recommended || newTemplate.recommendedSubjects,
                        });
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                    >
                      {SCENE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        Cấu trúc Dữ liệu AI (Props Schema JSON)
                      </label>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Tự động sinh theo phân cảnh
                      </span>
                    </div>
                    <input
                      value={newTemplate.propsSchema}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, propsSchema: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-mono text-[11px]"
                      title="Nếu không rành lập trình, bạn chỉ cần giữ nguyên giá trị tự sinh này."
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      💡 <b>Dành cho người không biết code:</b> Hệ thống đã tự động điền cấu trúc chuẩn. Bạn không cần chỉnh sửa gì thêm!
                    </p>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Theme Mặc Định</label>
                    <select
                      value={newTemplate.defaultVisualTheme}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, defaultVisualTheme: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                    >
                      <option value="">(Không gán theme)</option>
                      <option value="default">Hiện đại (Indigo)</option>
                      <option value="cyber">Dark Cyber (Tin / Lý)</option>
                      <option value="emerald">Nature Lab (Sinh / Hóa)</option>
                      <option value="sunset">Sáng tạo (Sunset)</option>
                      <option value="academic">Học thuật (Toán)</option>
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="font-bold text-slate-700 block mb-1">
                      Môn Khuyến Nghị (recommendedSubjects)
                    </label>
                    <div className="flex flex-wrap gap-4 pt-1">
                      {['Math', 'Physics', 'Chemistry', 'Biology', 'ComputerScience'].map((subj) => {
                        const checked = newTemplate.recommendedSubjects.includes(subj);
                        return (
                          <label key={subj} className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...newTemplate.recommendedSubjects, subj]
                                  : newTemplate.recommendedSubjects.filter((s) => s !== subj);
                                setNewTemplate({ ...newTemplate, recommendedSubjects: next });
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{subj}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-end justify-end gap-2 md:col-span-4">
                    <button
                      type="button"
                      onClick={() => setShowNewTemplateForm(false)}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold"
                    >
                      Lưu Template
                    </button>
                  </div>
                </form>
              )}

              {/* Modal chỉnh sửa template (Edit Template Modal) */}
              {editingTemplate && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div ref={editDialog} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-sm font-bold text-slate-900">Sửa Mẫu Remotion Template</h2>
                      </div>
                      <button
                        onClick={() => setEditingTemplate(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleUpdateTemplateSubmit} className="p-6 space-y-4 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Tên Mẫu</label>
                        <input
                          required
                          value={editingTemplate.name}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Môn STEM Chính</label>
                          <select
                            value={editingTemplate.category}
                            onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                          >
                            <option value="Physics">Vật Lý (Science)</option>
                            <option value="Chemistry">Hóa Học (Science)</option>
                            <option value="Biology">Sinh Học (Science)</option>
                            <option value="ComputerScience">Tin Học (Technology)</option>
                            <option value="Math">Toán Học (Mathematics)</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Theme Mặc Định</label>
                          <select
                            value={editingTemplate.defaultVisualTheme || ''}
                            onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultVisualTheme: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                          >
                            <option value="">(Không gán theme)</option>
                            <option value="default">Hiện đại (Indigo)</option>
                            <option value="cyber">Dark Cyber (Tin / Lý)</option>
                            <option value="emerald">Nature Lab (Sinh / Hóa)</option>
                            <option value="sunset">Sáng tạo (Sunset)</option>
                            <option value="academic">Học thuật (Toán)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Loại Phân Cảnh (SceneType)</label>
                        <select
                          value={editingTemplate.previewUrl || ''}
                          onChange={(e) => {
                            const selectedVal = e.target.value;
                            const matched = SCENE_TYPE_OPTIONS.find((opt) => opt.value === selectedVal);
                            setEditingTemplate({
                              ...editingTemplate,
                              previewUrl: selectedVal,
                              propsSchema: matched ? matched.defaultSchema : editingTemplate.propsSchema,
                              category: matched ? matched.category : editingTemplate.category,
                              defaultVisualTheme: matched?.theme || editingTemplate.defaultVisualTheme,
                            });
                          }}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                        >
                          {SCENE_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700">Props Schema (JSON Metadata)</label>
                          <span className="text-[10px] text-slate-400">Tùy biến tham số AI sinh</span>
                        </div>
                        <input
                          value={editingTemplate.propsSchema || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, propsSchema: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Môn Khuyến Nghị (recommendedSubjects)
                        </label>
                        <div className="flex flex-wrap gap-4 pt-1">
                          {['Math', 'Physics', 'Chemistry', 'Biology', 'ComputerScience'].map((subj) => {
                            const cur = editingTemplate.recommendedSubjects || [];
                            const checked = cur.includes(subj);
                            return (
                              <label key={subj} className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...cur, subj]
                                      : cur.filter((s) => s !== subj);
                                    setEditingTemplate({ ...editingTemplate, recommendedSubjects: next });
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{subj}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTemplate(null)}
                          className="px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-xl"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-xs"
                        >
                          Lưu Thay Đổi
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {loadingTemplates ? (
                <p className="text-xs text-slate-400 py-6">Đang tải danh mục Remotion Templates...</p>
              ) : filteredTemplates.length === 0 ? (
                <p className="text-xs text-slate-400 py-6">Chưa có mẫu hoạt họa nào trong danh mục này.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-2.5 pr-4">
                            <button
                              type="button"
                              onClick={() => handleTemplateSort('name')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Tên Mẫu Remotion Template</span>
                              {templateSortField === 'name' ? (
                                templateSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleTemplateSort('category')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Môn & Trụ Cột STEM</span>
                              {templateSortField === 'category' ? (
                                templateSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleTemplateSort('previewUrl')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Composition Binding</span>
                              {templateSortField === 'previewUrl' ? (
                                templateSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">Props Schema</th>
                          <th className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleTemplateSort('isActive')}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <span>Trạng thái</span>
                              {templateSortField === 'isActive' ? (
                                templateSortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 pl-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                      {paginatedTemplates.map((tpl) => {
                        const subjMeta =
                          SUBJECT_LABELS[tpl.category] || SUBJECT_LABELS.Physics;
                        return (
                          <tr key={tpl.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 pr-4 font-bold text-slate-900">
                              <div>{tpl.name}</div>
                              <div className="flex flex-wrap gap-1 mt-1 font-normal">
                                {tpl.defaultVisualTheme && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[10px] font-mono border border-purple-200">
                                    Theme: {tpl.defaultVisualTheme}
                                  </span>
                                )}
                                {tpl.recommendedSubjects && tpl.recommendedSubjects.length > 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-mono border border-blue-200">
                                    Môn: {tpl.recommendedSubjects.join(', ')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${subjMeta.badgeClass}`}
                              >
                                {subjMeta.label} • {subjMeta.pillar}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 font-mono text-[11px] text-indigo-700 font-bold">
                              {tpl.previewUrl || 'ILLUSTRATED_EXPLAINER'}
                            </td>
                            <td className="py-3.5 px-3 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                              {tpl.propsSchema || '{}'}
                            </td>
                            <td className="py-3.5 px-3">
                              <button
                                onClick={() => void handleToggleTemplateActive(tpl)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                  tpl.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-300'
                                }`}
                              >
                                {tpl.isActive ? (
                                  <>
                                    <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>ACTIVE</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                                    <span>INACTIVE</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="py-3.5 pl-3 text-right">
                              <button
                                onClick={() => setEditingTemplate(tpl)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition mr-1"
                                title="Sửa mẫu hoạt họa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => void handleDeleteTemplate(tpl)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                title="Xóa mẫu hoạt họa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  currentPage={templatePage}
                  totalPages={totalTemplatePages}
                  totalItems={sortedTemplates.length}
                  pageSize={templatePageSize}
                  onPageChange={setTemplatePage}
                  onPageSizeChange={setTemplatePageSize}
                  pageSizeOptions={[5, 8, 15, 30]}
                />
              </>
            )}
          </div>
        </div>
      )}
      </div>
      </fieldset>
    </main>
  );
};
