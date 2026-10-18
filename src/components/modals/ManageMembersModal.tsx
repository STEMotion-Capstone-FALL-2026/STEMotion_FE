import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  X,
  UserPlus,
  ShieldCheck,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Building,
  ChevronDown,
} from 'lucide-react';
import {
  workspaceService,
  WorkspaceMemberDto,
  CandidateUser,
  UserRole,
} from '../../services';

export interface WorkspaceItemSummary {
  id: string;
  name: string;
  department?: string;
}

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  isCurrentUserAdminOrLeader: boolean;
  onMembersUpdated?: () => void;
  workspaces?: WorkspaceItemSummary[];
  onSelectWorkspace?: (workspaceId: string) => void;
}

const initialsOf = (name: string): string => {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  isCurrentUserAdminOrLeader,
  onMembersUpdated,
  workspaces,
  onSelectWorkspace,
}) => {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(workspaceId);
  const [workspaceList, setWorkspaceList] = useState<WorkspaceItemSummary[]>(workspaces || []);
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([]);
  const [candidates, setCandidates] = useState<CandidateUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Member Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'WRITER' | 'REVIEWER' | 'PRODUCER'>('WRITER');
  const [newMemberIsLeader, setNewMemberIsLeader] = useState(false);

  // Fetch / sync workspace list whenever modal opens
  useEffect(() => {
    if (isOpen) {
      void (async () => {
        try {
          if (workspaces && workspaces.length > 0) {
            setWorkspaceList(workspaces.map((w) => ({ id: w.id, name: w.name, department: w.department })));
          }

          let list: WorkspaceItemSummary[] = [];
          try {
            const rawList = isCurrentUserAdminOrLeader
              ? await workspaceService.getAllWorkspaces()
              : await workspaceService.getMyWorkspaces(true);
            list = (rawList || []).map((w) => ({ id: w.id, name: w.name, department: w.department }));
          } catch {
            const rawList = await workspaceService.getMyWorkspaces(true).catch(() => []);
            list = (rawList || []).map((w) => ({ id: w.id, name: w.name, department: w.department }));
          }

          if (list && list.length > 0) {
            setWorkspaceList(list);
            if (!activeWorkspaceId || !list.some((w) => w.id === activeWorkspaceId)) {
              const matched = workspaceId && list.some((w) => w.id === workspaceId) ? workspaceId : list[0].id;
              setActiveWorkspaceId(matched);
            }
          } else if (workspaces && workspaces.length > 0) {
            const mapped = workspaces.map((w) => ({ id: w.id, name: w.name, department: w.department }));
            setWorkspaceList(mapped);
            if (!activeWorkspaceId || !mapped.some((w) => w.id === activeWorkspaceId)) {
              const matched = workspaceId && mapped.some((w) => w.id === workspaceId) ? workspaceId : mapped[0].id;
              setActiveWorkspaceId(matched);
            }
          } else if (workspaceId) {
            setActiveWorkspaceId(workspaceId);
          }
        } catch {
          if (workspaces && workspaces.length > 0) {
            setWorkspaceList(workspaces.map((w) => ({ id: w.id, name: w.name, department: w.department })));
          }
          if (workspaceId) setActiveWorkspaceId(workspaceId);
        }
      })();
    }
  }, [isOpen, isCurrentUserAdminOrLeader, workspaceId, workspaces]);

  useEffect(() => {
    if (workspaceId) {
      setActiveWorkspaceId(workspaceId);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      setWorkspaceList(workspaces);
    }
  }, [workspaces]);

  const loadData = useCallback(async (targetWsId: string) => {
    if (!targetWsId) return;
    setIsLoading(true);
    setError(null);
    try {
      const memberList = await workspaceService.getMembers(targetWsId);
      setMembers(memberList);

      if (isCurrentUserAdminOrLeader) {
        const candidateList = await workspaceService.getCandidates(targetWsId);
        setCandidates(candidateList);
        if (candidateList.length > 0) {
          setSelectedUserId((prev) => (candidateList.some((c) => c.id === prev) ? prev : candidateList[0].id));
        } else {
          setSelectedUserId('');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách thành viên.');
    } finally {
      setIsLoading(false);
    }
  }, [isCurrentUserAdminOrLeader]);

  useEffect(() => {
    if (isOpen && activeWorkspaceId) {
      void loadData(activeWorkspaceId);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, activeWorkspaceId, loadData]);

  if (!isOpen) return null;

  const handleSwitchWorkspace = (newWsId: string) => {
    if (newWsId === activeWorkspaceId) return;
    setActiveWorkspaceId(newWsId);
    workspaceService.setActiveWorkspaceId(newWsId);
    setError(null);
    setSuccessMsg(null);
    onSelectWorkspace?.(newWsId);
    onMembersUpdated?.();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !activeWorkspaceId) return;
    setActionBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await workspaceService.addMember(activeWorkspaceId, {
        userId: selectedUserId,
        role: newMemberRole,
        isLeader: newMemberIsLeader,
      });
      setSuccessMsg('Đã thêm thành viên vào tổ thành công.');
      setSelectedUserId('');
      setNewMemberIsLeader(false);
      await loadData(activeWorkspaceId);
      onMembersUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể thêm thành viên vào tổ.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleUpdateRole = async (member: WorkspaceMemberDto, newRole: string) => {
    if (!activeWorkspaceId) return;
    setActionBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await workspaceService.updateMember(activeWorkspaceId, member.id, {
        role: newRole,
      });
      setSuccessMsg(`Đã đổi vai trò của ${member.name} thành ${newRole}.`);
      await loadData(activeWorkspaceId);
      onMembersUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể cập nhật vai trò.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleToggleLeader = async (member: WorkspaceMemberDto) => {
    if (!activeWorkspaceId) return;
    setActionBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await workspaceService.updateMember(activeWorkspaceId, member.id, {
        isLeader: !member.isLeader,
      });
      setSuccessMsg(
        !member.isLeader
          ? `Đã bổ nhiệm ${member.name} làm Trưởng nhóm.`
          : `Đã hạ quyền Trưởng nhóm của ${member.name}.`
      );
      await loadData(activeWorkspaceId);
      onMembersUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể thay đổi quyền Trưởng nhóm.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleToggleStatus = async (member: WorkspaceMemberDto) => {
    if (!activeWorkspaceId) return;
    setActionBusy(true);
    setError(null);
    setSuccessMsg(null);
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await workspaceService.updateMember(activeWorkspaceId, member.id, {
        status: newStatus,
      });
      setSuccessMsg(`Đã chuyển trạng thái ${member.name} sang ${newStatus}.`);
      await loadData(activeWorkspaceId);
      onMembersUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể thay đổi trạng thái.');
    } finally {
      setActionBusy(false);
    }
  };

  const currentWsObj = workspaceList.find((w) => w.id === activeWorkspaceId);
  const currentWsDisplayName =
    currentWsObj?.name ||
    (activeWorkspaceId === workspaceId && workspaceName !== 'Chưa có nhóm' ? workspaceName : 'Không gian làm việc');

  const handleRemoveMember = async (member: WorkspaceMemberDto) => {
    if (!activeWorkspaceId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${member.name}" khỏi nhóm ${currentWsDisplayName}?`)) {
      return;
    }
    setActionBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await workspaceService.removeMember(activeWorkspaceId, member.id);
      setSuccessMsg(`Đã xóa ${member.name} khỏi nhóm.`);
      await loadData(activeWorkspaceId);
      onMembersUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa thành viên khỏi nhóm.');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-xs animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 shrink-0">
                  Quản Lý Thành Viên:
                </h3>
                {workspaceList.length > 0 ? (
                  <div className="relative inline-flex items-center">
                    <Building className="w-3.5 h-3.5 text-brand-600 absolute left-2.5 pointer-events-none" />
                    <select
                      value={activeWorkspaceId}
                      onChange={(e) => handleSwitchWorkspace(e.target.value)}
                      className="font-bold text-xs text-brand-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg pl-8 pr-7 py-1 focus:ring-2 focus:ring-brand-500 focus:outline-hidden cursor-pointer transition-colors shadow-2xs appearance-none max-w-xs truncate"
                      title="Chuyển đổi Không gian làm việc để quản lý"
                    >
                      {workspaceList.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name} {ws.department ? `(${ws.department})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-brand-600 absolute right-2 pointer-events-none" />
                  </div>
                ) : (
                  <div className="relative inline-flex items-center">
                    <Building className="w-3.5 h-3.5 text-brand-600 absolute left-2.5 pointer-events-none" />
                    <select
                      value={activeWorkspaceId}
                      disabled
                      className="font-bold text-xs text-brand-800 bg-blue-50 border border-blue-200 rounded-lg pl-8 pr-7 py-1 appearance-none max-w-xs truncate cursor-default"
                      title="Không gian làm việc hiện tại"
                    >
                      <option value={activeWorkspaceId}>
                        {currentWsDisplayName}
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-brand-400 absolute right-2 pointer-events-none" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isCurrentUserAdminOrLeader
                  ? 'Chuyển đổi không gian làm việc để quản lý thành viên, phân công vai trò và chỉ định Trưởng nhóm.'
                  : 'Danh sách thành viên hiện tại trong nhóm.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback banners */}
        {error && (
          <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div role="status" className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-start space-x-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Add Member Form (Admin / Leader only) */}
        {isCurrentUserAdminOrLeader && (
          <form
            onSubmit={handleAddMember}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shrink-0"
          >
            <div className="flex items-center space-x-2 font-bold text-slate-800">
              <UserPlus className="w-4 h-4 text-brand-600" />
              <span>Gán thành viên mới vào nhóm</span>
            </div>

            {candidates.length === 0 ? (
              <p className="text-slate-500 text-[11px]">
                Tất cả người dùng hệ thống hiện tại đã là thành viên của nhóm này.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Chọn người dùng
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs"
                  >
                    <option value="">-- Chọn thành viên / người dùng --</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Vai trò trong nhóm
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs"
                  >
                    <option value="WRITER">Writer (Biên kịch)</option>
                    <option value="REVIEWER">Reviewer (Thẩm định)</option>
                    <option value="PRODUCER">Producer (Dựng video)</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center h-9">
                  <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newMemberIsLeader}
                      onChange={(e) => setNewMemberIsLeader(e.target.checked)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-semibold text-slate-700 text-[11px]">Trưởng nhóm</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={actionBusy || !selectedUserId}
                    className="w-full py-2 px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-1"
                  >
                    <span>+ Thêm</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Members List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center justify-between font-bold text-slate-700 pb-1">
            <span>Danh sách thành viên ({members.length})</span>
            {isLoading && (
              <span className="flex items-center space-x-1 text-slate-400 font-normal">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Đang tải...</span>
              </span>
            )}
          </div>

          {members.length === 0 && !isLoading && (
            <p className="text-slate-400 py-6 text-center">Nhóm chưa có thành viên nào.</p>
          )}

          <div className="divide-y divide-slate-100">
            {members.map((m) => (
              <div
                key={m.id}
                className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                    {initialsOf(m.name)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{m.name}</span>
                      {m.isLeader && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 flex items-center space-x-0.5">
                          <ShieldCheck className="w-3 h-3 text-amber-600" />
                          <span>Trưởng nhóm</span>
                        </span>
                      )}
                      {m.status === 'INACTIVE' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px]">
                          Vô hiệu hóa
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">{m.email}</div>
                  </div>
                </div>

                {/* Member Controls */}
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {isCurrentUserAdminOrLeader ? (
                    <>
                      {/* Role selector */}
                      <select
                        value={m.role.toUpperCase()}
                        disabled={actionBusy}
                        onChange={(e) => handleUpdateRole(m, e.target.value)}
                        className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-[11px] font-medium"
                      >
                        <option value="WRITER">Writer</option>
                        <option value="REVIEWER">Reviewer</option>
                        <option value="PRODUCER">Producer</option>
                      </select>

                      {/* Toggle Leader */}
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => handleToggleLeader(m)}
                        title={m.isLeader ? 'Hạ quyền Trưởng nhóm' : 'Đặt làm Trưởng nhóm'}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                          m.isLeader
                            ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.isLeader ? 'Bỏ Trưởng nhóm' : '+ Làm Trưởng nhóm'}
                      </button>

                      {/* Toggle Status */}
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => handleToggleStatus(m)}
                        title={m.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                          m.status === 'ACTIVE'
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {m.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
                      </button>

                      {/* Remove Member */}
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => handleRemoveMember(m)}
                        title="Xóa thành viên khỏi tổ"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-700 font-medium border border-blue-200">
                      {m.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
