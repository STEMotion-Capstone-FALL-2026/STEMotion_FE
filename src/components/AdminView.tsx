import React, { useState } from 'react';
import { WorkspaceMember, Workspace, STEMScript } from '../types/stem';
import { Users, UserPlus, Shield, Code, Check, Copy, Video, FolderKanban } from 'lucide-react';

interface AdminViewProps {
  currentWorkspace: Workspace;
  members: WorkspaceMember[];
  script: STEMScript;
  onOpenInviteModal: () => void;
  onUpdateMemberRole: (memberId: string, newRole: WorkspaceMember['role']) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentWorkspace,
  members,
  script,
  onOpenInviteModal,
  onUpdateMemberRole,
}) => {
  const [copiedLms, setCopiedLms] = useState(false);
  const [lmsPlatform, setLmsPlatform] = useState<'canvas' | 'moodle' | 'iframe'>('iframe');

  const getEmbedCode = () => {
    const videoUrl = `https://stemotion.edu.vn/player/embed/${script.id}`;
    if (lmsPlatform === 'iframe') {
      return `<iframe src="${videoUrl}" width="100%" height="540" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${script.title}"></iframe>`;
    }
    if (lmsPlatform === 'canvas') {
      return `<div class="canvas-stemotion-embed" data-lesson-id="${script.id}" data-subject="${script.subject}">\n  <iframe src="${videoUrl}?theme=canvas" width="100%" height="540" allowfullscreen></iframe>\n</div>`;
    }
    return `<!-- Moodle SCORM / LTI Embed -->\n<div class="moodle-lti-resource" data-id="${script.id}">\n  <iframe src="${videoUrl}?lti=1" width="100%" height="540" allowfullscreen></iframe>\n</div>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopiedLms(true);
    setTimeout(() => setCopiedLms(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
              TRƯỞNG BỘ MÔN • QUẢN TRỊ VIÊN
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Workspace: {currentWorkspace.name}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Bảng điều khiển Tổ bộ môn & Xuất bản LMS</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị nhân sự bộ môn, cấp quyền biên tập, phân luồng sản xuất và tích hợp video vào hệ thống trường học
          </p>
        </div>

        <button
          onClick={onOpenInviteModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Mời thành viên mới vào tổ
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{members.length}</div>
            <div className="text-xs text-slate-500">Thành viên trong tổ bộ môn</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{currentWorkspace.activeProjects}</div>
            <div className="text-xs text-slate-500">Dự án video đang sản xuất</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">18</div>
            <div className="text-xs text-slate-500">Bài giảng đã xuất bản LMS</div>
          </div>
        </div>
      </div>

      {/* Grid: Member Management & LMS Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Members Management Table (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Danh sách & Phân quyền thành viên ({members.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Chỉ Trưởng bộ môn mới đổi được Role</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{member.avatar}</span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{member.name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => onUpdateMemberRole(member.id, e.target.value as any)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Writer (Biên kịch)">✍️ Writer (Biên kịch)</option>
                    <option value="Reviewer (Chuyên gia)">🧑‍🔬 Reviewer (Chuyên gia)</option>
                    <option value="Producer (Dựng video)">🎬 Producer (Dựng video)</option>
                    <option value="Trưởng bộ môn (Admin)">👨‍🏫 Trưởng bộ môn (Admin)</option>
                  </select>

                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                    member.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {member.status === 'ACTIVE' ? 'Hoạt động' : 'Đang mời'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LMS Embed Generator (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Tạo Mã Nhúng LMS (Canvas / Moodle)
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                SCORM & LTI Ready
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Mã nhúng cho phép giáo viên nhúng trực tiếp bài giảng tương tác vào hệ thống trường học (LMS). Học sinh có thể xem và làm bài trắc nghiệm ngay trong khóa học.
            </p>

            {/* Platform selector */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setLmsPlatform('iframe')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  lmsPlatform === 'iframe'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                iFrame Chuẩn
              </button>
              <button
                onClick={() => setLmsPlatform('canvas')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  lmsPlatform === 'canvas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Canvas LMS
              </button>
              <button
                onClick={() => setLmsPlatform('moodle')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  lmsPlatform === 'moodle'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Moodle LTI
              </button>
            </div>

            {/* Embed Code Box */}
            <div className="relative">
              <textarea
                readOnly
                rows={6}
                value={getEmbedCode()}
                className="w-full p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs border border-slate-800 focus:outline-none select-all"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleCopyCode}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 transition-all"
            >
              {copiedLms ? (
                <>
                  <Check className="w-4 h-4" />
                  Đã sao chép mã nhúng vào bộ nhớ tạm!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Sao chép mã nhúng vào hệ thống LMS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
