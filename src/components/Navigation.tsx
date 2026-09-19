import React from 'react';
import { Workspace, STEMScript } from '../types/stem';
import { Users, UserPlus, ShieldCheck, PenTool, Video, ChevronDown } from 'lucide-react';

export type UserRole = 'Writer' | 'Reviewer' | 'Producer' | 'Admin';

interface NavigationProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onSelectWorkspace: (ws: Workspace) => void;
  script: STEMScript;
  onOpenInviteModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentRole,
  onChangeRole,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onOpenInviteModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Workspace Dropdown */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-blue-500/20">
                S
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  STEMotion
                </span>
                <span className="text-[10px] font-mono block text-slate-400 leading-none">
                  Vite + Remotion
                </span>
              </div>
            </div>

            {/* Workspace Selector */}
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-medium text-slate-700">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentWorkspace.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>

              {/* Dropdown menu */}
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1 hidden group-hover:block animate-fade-in z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Chọn Tổ Bộ Môn
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => onSelectWorkspace(ws)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      ws.id === currentWorkspace.id ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{ws.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{ws.membersCount} GV</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Invite Button */}
            <button
              onClick={onOpenInviteModal}
              className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mời GV</span>
            </button>
          </div>

          {/* Role Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onChangeRole('Writer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentRole === 'Writer'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Writer</span>
            </button>

            <button
              onClick={() => onChangeRole('Reviewer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentRole === 'Reviewer'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Reviewer</span>
            </button>

            <button
              onClick={() => onChangeRole('Producer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentRole === 'Producer'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Producer</span>
            </button>

            <button
              onClick={() => onChangeRole('Admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentRole === 'Admin'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Trưởng bộ môn</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
