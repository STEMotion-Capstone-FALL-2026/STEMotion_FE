import React, { useState } from 'react';
import {
  Building,
  ChevronDown,
  Check,
  PlusCircle,
  Users,
  Shield,
  LogOut,
  Library,
  FolderKanban,
} from 'lucide-react';
import { UserRole } from '../../services';

/** Falls back to a question mark so the avatar is never blank. */
const initialsOf = (fullName: string): string => {
  if (!fullName || !fullName.trim()) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface HeaderNavProps {
  currentRole: UserRole;
  accountRole: UserRole;
  isLeader?: boolean;
  /** The signed-in user, so the header shows who is actually logged in. */
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
  groups: { id: string; name: string; department?: string }[];
  activeGroup: { name: string; code: string };
  onSelectGroup: (workspaceId: string) => void;
  onOpenManageMembersModal?: () => void;
  onOpenCreateProjectModal: () => void;
  onCreateWorkspace?: () => void;
  onNavigateToDashboard?: () => void;
  isInStudio?: boolean;
  /** Library is a view, not a workspace role — keep the working role underneath. */
  isLibraryView?: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentRole,
  accountRole,
  isLeader = false,
  userName,
  userEmail,
  onLogout,
  onRoleChange,
  groups,
  activeGroup,
  onSelectGroup,
  onOpenManageMembersModal,
  onOpenCreateProjectModal,
  onCreateWorkspace,
  onNavigateToDashboard,
  isInStudio = false,
  isLibraryView = false,
}) => {
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  const canManageMembers = accountRole === 'admin' || isLeader;
  const showBoardButton = isInStudio || isLibraryView || currentRole === 'admin';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 flex flex-wrap gap-2 items-center justify-between shadow-xs">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <div
          onClick={() => onNavigateToDashboard?.()}
          className="flex items-center space-x-2.5 cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNavigateToDashboard?.(); } }}
          title="Về danh sách kịch bản & dự án"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            S
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-base">STEMotion</span>
        </div>

        <span className="text-slate-300">|</span>

        {showBoardButton && onNavigateToDashboard && (
          <button
            onClick={onNavigateToDashboard}
            title="Quay lại danh sách kịch bản của tổ"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-blue-50 text-xs font-bold text-slate-700 hover:text-brand-700 flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5 text-brand-600" />
            <span>Kho kịch bản</span>
          </button>
        )}



        {/* WORKSPACE SELECTOR */}
        <div className="relative flex items-center space-x-1.5">
          <button
            onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-brand-600" />
            <span className="font-bold">{activeGroup.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-brand-700 font-semibold">
              {activeGroup.code}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Xem / Quản lý Thành Viên (Mọi thành viên đều được xem danh sách nhóm mình) */}
          {onOpenManageMembersModal && (
            <button
              onClick={onOpenManageMembersModal}
              title={canManageMembers ? 'Quản lý thành viên trong nhóm này' : 'Xem danh sách thành viên trong nhóm này'}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-blue-50 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-brand-600" />
              <span>Thành viên</span>
            </button>
          )}

          {/* Dropdown danh sách nhóm */}
          {isGroupDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-1.5 z-50 text-xs animate-fade-in">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                <span>Không gian làm việc:</span>
                <span className="text-brand-600 font-semibold">Multi-Workspace</span>
              </div>
              <div className="space-y-1">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      onSelectGroup(group.id);
                      setIsGroupDropdownOpen(false);
                    }}
                    className="w-full p-2 rounded-lg hover:bg-blue-50 text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{group.name}</div>
                      <div className="text-[10px] text-slate-500">{group.department}</div>
                    </div>
                    {activeGroup.code === group.id.slice(0, 6) && (
                      <Check className="w-3.5 h-3.5 text-brand-600" />
                    )}
                  </button>
                ))}
              </div>
              <div className="pt-1.5 border-t border-slate-100 space-y-1">
                {accountRole === 'admin' && onCreateWorkspace && (
                  <button
                    onClick={() => {
                      setIsGroupDropdownOpen(false);
                      onCreateWorkspace();
                    }}
                    className="w-full p-2 rounded-lg hover:bg-emerald-50 text-left flex items-center space-x-2 text-emerald-700 font-bold"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>+ Tạo Không Gian Làm Việc Mới</span>
                  </button>
                )}
                {currentRole === 'writer' && (
                  <button
                    onClick={() => {
                      setIsGroupDropdownOpen(false);
                      onOpenCreateProjectModal();
                    }}
                    className="w-full p-2 rounded-lg hover:bg-blue-50 text-left flex items-center space-x-2 text-brand-600 font-bold cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Tạo Dự Án Kịch Bản Mới</span>
                  </button>
                )}
                {onOpenManageMembersModal && (
                  <button
                    onClick={() => {
                      setIsGroupDropdownOpen(false);
                      onOpenManageMembersModal();
                    }}
                    className="w-full p-2 rounded-lg hover:bg-slate-50 text-left flex items-center space-x-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>{canManageMembers ? 'Quản lý thành viên nhóm...' : 'Xem thành viên nhóm...'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation: Admin Portal (if admin) & Media Library */}
      <div className="flex items-center space-x-2">
        {accountRole === 'admin' && (
          <button
            onClick={() => onRoleChange('admin')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              currentRole === 'admin' && !isLibraryView
                ? 'bg-rose-50 text-rose-600 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Trang quản trị hệ thống"
          >
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span>Admin Portal</span>
          </button>
        )}

        <button
          onClick={() => (isLibraryView ? onNavigateToDashboard?.() : onRoleChange('library'))}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            isLibraryView
              ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title={isLibraryView ? 'Quay lại kho kịch bản' : 'Kho học liệu & tư liệu dùng chung'}
        >
          <Library className="w-3.5 h-3.5 text-indigo-600" />
          <span>Thư Viện Media</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="flex items-center space-x-3">
        <div className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-brand-700 border border-blue-200 flex items-center space-x-1.5">
          <span>
            Vai trò:{' '}
            {accountRole === 'admin'
              ? 'Admin (Quản trị)'
              : currentRole === 'producer'
              ? 'Producer (Dựng Video)'
              : currentRole === 'writer'
              ? 'Writer (Biên kịch)'
              : currentRole === 'reviewer'
              ? 'Reviewer (Thẩm định)'
              : 'Khách xem'}
            {accountRole !== 'admin' && isLeader && ' • Trưởng nhóm'}
          </span>
        </div>

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {initialsOf(userName)}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">{userName}</div>
            <div className="text-[10px] text-slate-400">{userEmail}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Đăng xuất khỏi STEMotion"
            className="ml-2 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 hover:border-rose-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
