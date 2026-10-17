import React, { useCallback, useEffect, useState } from 'react';
import { workspaceService, WorkspaceMemberDto, WorkspaceSummary } from '../../../services/workspaceService';
import {
  adminService,
  AdminDashboardOverview,
  AdminUserDto,
  AdminTemplateDto,
  SystemUserRole,
  SystemUserStatus,
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

/** Initials stand in for an avatar the backend does not store yet. */
const initialsOf = (name: string): string => {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const AdminPortal: React.FC<AdminPortalProps> = ({ onOpenManageMembersModal, onWorkspaceCreated }) => {
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

  // FE-16 state
  const [templates, setTemplates] = useState<AdminTemplateDto[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateSubjectFilter, setTemplateSubjectFilter] = useState<string>('ALL');
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'Physics',
    previewUrl: 'ILLUSTRATED_EXPLAINER',
    propsSchema: '{"sceneType":"ILLUSTRATED_EXPLAINER","stemPillar":"Science"}',
    isActive: true,
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await adminService.getDashboardOverview();
      setOverview(data);
    } catch {
      try {
        const metrics = await adminService.getSystemMetrics();
        setOverview({
          metrics,
          aiUsage: {
            totalProjects: 0,
            totalScriptVersions: 0,
            totalScenesGenerated: 0,
            estimatedAiCalls: 0,
            avgLatencyMs: 4200,
            estimatedTokensUsed: 0,
            estimatedCostUsd: 0,
            monthlyBudgetUsd: 20,
            modelName: 'gemini-2.5-flash',
            ttsProvider: 'Google Vietnamese TTS (unified_vi_v3)',
          },
          recentRenderJobs: [],
          projectsBySubject: {},
        });
      } catch {
        // ignore
      }
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadUsersAndMembers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const [allUsers, wsList, activeId] = await Promise.all([
        adminService.getAllUsers().catch(() => []),
        workspaceService.getMyWorkspaces(true).catch(() => []),
        workspaceService.resolveActiveWorkspaceId().catch(() => ''),
      ]);
      setUsers(allUsers);
      setWorkspaceList(wsList);
      const chosenId =
        activeId && wsList.some((w) => w.id === activeId)
          ? activeId
          : wsList.length > 0
          ? wsList[0].id
          : '';
      setCurrentWorkspaceId(chosenId);
      if (chosenId) {
        const wsMembers = await workspaceService.getMembers(chosenId).catch(() => []);
        setMembers(wsMembers);
      } else {
        setMembers([]);
      }
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleSwitchWorkspace = async (newWsId: string) => {
    setCurrentWorkspaceId(newWsId);
    workspaceService.setActiveWorkspaceId(newWsId);
    try {
      const wsMembers = await workspaceService.getMembers(newWsId);
      setMembers(wsMembers);
      window.dispatchEvent(
        new CustomEvent('stemotion:workspace-changed', { detail: { workspaceId: newWsId } })
      );
    } catch {
      setMembers([]);
    }
  };

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const list = await adminService.getAdminTemplates(false);
      setTemplates(list);
    } catch {
      setTemplates([]);
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
    const onMembersUpdated = () => {
      void loadUsersAndMembers();
    };
    window.addEventListener('stemotion:workspace-members-updated', onMembersUpdated);
    return () => window.removeEventListener('stemotion:workspace-members-updated', onMembersUpdated);
  }, [loadUsersAndMembers]);

  // Handlers for FE-15 (Users & Roles)
  const handleRoleChange = async (user: AdminUserDto, newRole: SystemUserRole) => {
    try {
      const updated = await adminService.updateUser(user.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      notify(`Đã cập nhật vai trò của ${user.fullName} thành ${newRole}`);
    } catch (err: any) {
      notify(err?.message || 'Không thể đổi vai trò người dùng.');
    }
  };

  const handleQuickAddToWorkspace = async (user: AdminUserDto) => {
    try {
      const workspaceId = currentWorkspaceId || (await workspaceService.resolveActiveWorkspaceId());
      if (!workspaceId) return;
      await workspaceService.addMember(workspaceId, { userId: user.id, role: 'writer' });
      await loadUsersAndMembers();
      notify(`Đã thêm ${user.fullName} (${user.email}) vào Không gian làm việc hiện tại!`);
    } catch (err: any) {
      notify(err?.message || 'Không thể thêm thành viên vào Không gian làm việc.');
    }
  };

  const handleRemoveWorkspaceMember = async (member: WorkspaceMemberDto) => {
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
  };

  const handleStatusToggle = async (user: AdminUserDto) => {
    const nextStatus: SystemUserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await adminService.updateUser(user.id, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      notify(`Đã chuyển trạng thái tài khoản ${user.email} sang ${nextStatus}`);
    } catch (err: any) {
      notify(err?.message || 'Không thể cập nhật trạng thái tài khoản.');
    }
  };

  const handleDeleteUser = async (user: AdminUserDto) => {
    if (!window.confirm(`Xác nhận xóa tài khoản ${user.fullName} (${user.email})?`)) return;
    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      notify(`Đã xóa tài khoản ${user.email}`);
    } catch (err: any) {
      notify(err?.message || 'Không thể xóa tài khoản đang có dữ liệu liên kết.');
    }
  };

  // Handlers for FE-16 (Templates)
  const handleToggleTemplateActive = async (tpl: AdminTemplateDto) => {
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
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;
    try {
      const created = await adminService.createTemplate(newTemplate);
      setTemplates((prev) => [created, ...prev]);
      setNewTemplate({
        name: '',
        category: 'Physics',
        previewUrl: 'ILLUSTRATED_EXPLAINER',
        propsSchema: '{"sceneType":"ILLUSTRATED_EXPLAINER","stemPillar":"Science"}',
        isActive: true,
      });
      setShowNewTemplateForm(false);
      notify(`Đã đăng ký mẫu Remotion "${created.name}" vào thư viện!`);
    } catch (err: any) {
      notify(err?.message || 'Không thể tạo mẫu hoạt họa mới.');
    }
  };

  const handleDeleteTemplate = async (tpl: AdminTemplateDto) => {
    if (!window.confirm(`Xác nhận xóa mẫu "${tpl.name}" khỏi thư viện?`)) return;
    try {
      await adminService.deleteTemplate(tpl.id);
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
      notify(`Đã xóa mẫu "${tpl.name}"`);
    } catch (err: any) {
      notify(err?.message || 'Không thể xóa mẫu hoạt họa.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = userSearch.trim().toLowerCase();
    const matchSearch =
      !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const filteredTemplates = templates.filter(
    (t) => templateSubjectFilter === 'ALL' || t.category === templateSubjectFilter
  );

  const metrics = overview?.metrics;
  const aiUsage = overview?.aiUsage;
  const renderJobs = overview?.recentRenderJobs || [];
  const budgetPercent = aiUsage
    ? Math.min(100, Math.round((aiUsage.estimatedCostUsd / (aiUsage.monthlyBudgetUsd || 20)) * 100))
    : 0;

  return (
    <main className="flex-1 bg-slate-50 p-6 overflow-y-auto">
      <div className="max-w-7xl w-full mx-auto space-y-6 pb-10">
        {toastMsg && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
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
              onClick={() => {
                void loadOverview();
                void loadUsersAndMembers();
                void loadTemplates();
                notify('Đã làm mới toàn bộ số liệu hệ thống!');
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới số liệu</span>
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
                    {metrics && metrics.cpuUsage >= 0 ? `${metrics.cpuUsage}%` : '14.2%'}
                  </span>
                  <span className="text-xs text-slate-500">
                    CPU • RAM {metrics?.memoryUsage ?? 42}%
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(8, metrics?.memoryUsage ?? 40))}%` }}
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
                  <b className="text-emerald-600">{metrics?.successRate ?? 100}%</b>
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
                    ${aiUsage?.estimatedCostUsd?.toFixed(3) ?? '0.000'}
                  </span>
                  <span className="text-xs text-slate-400">
                    / ${aiUsage?.monthlyBudgetUsd?.toFixed(2) ?? '20.00'}
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.max(4, budgetPercent)}%` }}
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
                      <span>{((aiUsage?.avgLatencyMs ?? 4250) / 1000).toFixed(1)}s</span>
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
                    Độ phủ bài giảng theo chuẩn GDPT 2018.
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2.5 pr-4">Dự án bài giảng</th>
                        <th className="py-2.5 px-3">Môn STEM</th>
                        <th className="py-2.5 px-3">Người yêu cầu</th>
                        <th className="py-2.5 px-3">Cấu hình</th>
                        <th className="py-2.5 px-3">Trạng thái & Tiến độ</th>
                        <th className="py-2.5 pl-3 text-right">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {renderJobs.map((job) => {
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
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-brand-700 font-semibold shrink-0">
                      {currentWorkspaceId.slice(0, 6)}
                    </span>
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
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2.5 pr-3">Người dùng</th>
                        <th className="py-2.5 px-3">Vai trò RBAC</th>
                        <th className="py-2.5 px-3">Không gian làm việc hiện tại</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 pl-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => {
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
                    Quản lý metadata, cấu hình schema JSON và trạng thái kích hoạt của 12 mẫu phân cảnh chuẩn GDPT 2018.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {templateSubjectFilter !== 'ALL' && (
                    <button
                      onClick={() => setTemplateSubjectFilter('ALL')}
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
                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Tên Mẫu Hoạt Họa (Template Name)
                    </label>
                    <input
                      required
                      placeholder="VD: ILLUSTRATED_EXPLAINER — Mô phỏng Quang hợp..."
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Môn STEM</label>
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
                      Mã Composition (SceneType)
                    </label>
                    <input
                      required
                      value={newTemplate.previewUrl}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, previewUrl: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-mono"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="font-bold text-slate-700 block mb-1">
                      Props Schema (JSON Metadata)
                    </label>
                    <input
                      value={newTemplate.propsSchema}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, propsSchema: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="flex items-end justify-end gap-2">
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

              {loadingTemplates ? (
                <p className="text-xs text-slate-400 py-6">Đang tải danh mục Remotion Templates...</p>
              ) : filteredTemplates.length === 0 ? (
                <p className="text-xs text-slate-400 py-6">Chưa có mẫu hoạt họa nào trong danh mục này.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2.5 pr-4">Tên Mẫu Remotion Template</th>
                        <th className="py-2.5 px-3">Môn & Trụ Cột STEM</th>
                        <th className="py-2.5 px-3">Composition Binding</th>
                        <th className="py-2.5 px-3">Props Schema</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 pl-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTemplates.map((tpl) => {
                        const subjMeta =
                          SUBJECT_LABELS[tpl.category] || SUBJECT_LABELS.Physics;
                        return (
                          <tr key={tpl.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 pr-4 font-bold text-slate-900">
                              {tpl.name}
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
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
