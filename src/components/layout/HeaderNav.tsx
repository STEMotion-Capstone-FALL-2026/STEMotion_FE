import React, { useState } from 'react';
import {
  Building,
  UserPlus,
  ChevronDown,
  Check,
  PlusCircle,
  Users,
  PenTool,
  CheckSquare,
  Clapperboard,
  Shield,
  LogOut,
  Library,
} from 'lucide-react';
import { UserRole } from '../../services';

/**
 * Studios the signed-in user may open.
 *
 * The backend authorises every request from the role inside the JWT, so a tab
 * the user cannot use would only lead to a screen full of 403s. Admin is the
 * exception: the API grants it every role's endpoints, so it keeps all tabs.
 */
const allowedStudios = (role: UserRole): UserRole[] =>
  role === 'admin'
    ? ['writer', 'reviewer', 'producer', 'admin', 'library']
    : [role, 'library'];

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
  /** The signed-in user, so the header shows who is actually logged in. */
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
  groups: { id: string; name: string; department?: string }[];
  activeGroup: { name: string; code: string };
  onSelectGroup: (workspaceId: string) => void;
  onOpenInviteModal: () => void;
  onOpenCreateProjectModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentRole,
  accountRole,
  userName,
  userEmail,
  onLogout,
  onRoleChange,
  groups,
  activeGroup,
  onSelectGroup,
  onOpenInviteModal,
  onOpenCreateProjectModal,
}) => {
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  const studios = allowedStudios(accountRole);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-2.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-4">
        <div
          onClick={() => onRoleChange(studios[0])}
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
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-brand-700 font-semibold">
              {activeGroup.code}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Nút Mời Thành Viên */}
          <button
            onClick={onOpenInviteModal}
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
                {groups.map((group) => (
                  <button key={group.id} onClick={() => {
                    onSelectGroup(group.id);
                    setIsGroupDropdownOpen(false);
                  }} className="w-full p-2 rounded-lg hover:bg-blue-50 text-left flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{group.name}</div>
                      <div className="text-[10px] text-slate-500">{group.department}</div>
                    </div>
                    {activeGroup.code === group.id.slice(0, 6) && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                ))}
              </div>
              <div className="pt-1.5 border-t border-slate-100 space-y-1">
                <button
                  onClick={() => {
                    setIsGroupDropdownOpen(false);
                    onOpenCreateProjectModal();
                  }}
                  className="w-full p-2 rounded-lg hover:bg-blue-50 text-left flex items-center space-x-2 text-brand-600 font-bold"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Tạo Dự Án Kịch Bản Mới</span>
                </button>
                <button
                  onClick={() => {
                    setIsGroupDropdownOpen(false);
                    onOpenInviteModal();
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
          {studios.includes('writer') && (
          <button
              onClick={() => onRoleChange('writer')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'writer'
                  ? 'bg-white text-brand-600 shadow-xs ring-2 ring-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Writer</span>
            </button>
          )}

          {studios.includes('reviewer') && (
          <button
              onClick={() => onRoleChange('reviewer')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'reviewer'
                  ? 'bg-white text-amber-600 shadow-xs ring-2 ring-amber-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Reviewer</span>
            </button>
          )}

          {studios.includes('producer') && (
          <button
              onClick={() => onRoleChange('producer')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'producer'
                  ? 'bg-white text-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Producer (Tạo Video)</span>
            </button>
          )}

          {studios.includes('admin') && (
          <button
              onClick={() => onRoleChange('admin')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-semibold ${
                currentRole === 'admin'
                  ? 'bg-white text-rose-600 shadow-xs ring-2 ring-rose-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-500" />
              <span>Admin Portal</span>
            </button>
          )}
        </div>

        <button
          onClick={() => onRoleChange('library')}
          className={`px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-colors ${
            currentRole === 'library'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
              : 'bg-white text-slate-700'
          }`}
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
            {currentRole === 'producer'
              ? 'Producer (Dựng Video)'
              : currentRole === 'writer'
              ? 'Writer (Biên kịch)'
              : currentRole === 'reviewer'
              ? 'Reviewer (Thẩm định)'
              : currentRole === 'admin'
              ? 'Admin (Quản trị)'
              : 'Khách xem'}
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
