import React, { useState } from 'react';
import { X, Mail, UserPlus, Shield, CheckCircle2 } from 'lucide-react';
import { WorkspaceMember } from '../types/stem';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
  members: WorkspaceMember[];
  onInvite: (member: WorkspaceMember) => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  workspaceName,
  members,
  onInvite,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<WorkspaceMember['role']>('Reviewer (Chuyên gia)');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    const newMember: WorkspaceMember = {
      id: `u_${Date.now()}`,
      name,
      email,
      role,
      avatar: role.includes('Writer') ? '👩‍💻' : role.includes('Reviewer') ? '🧑‍🔬' : role.includes('Producer') ? '🎬' : '👨‍🏫',
      status: 'INVITED',
    };

    onInvite(newMember);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setEmail('');
      setName('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Mời thành viên vào Tổ bộ môn
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Workspace hiện tại: <span className="font-semibold text-slate-700">{workspaceName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {sentSuccess ? (
            <div className="py-8 flex flex-col items-center text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-3 animate-bounce" />
              <h4 className="text-base font-bold text-slate-900">Đã gửi lời mời thành công!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Email hướng dẫn đăng nhập đã được gửi tới <span className="font-mono text-slate-700">{email}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Họ và tên thành viên
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: ThS. Lê Hoàng Nam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Địa chỉ Email giáo dục / trường học
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="ten.nguoidung@stemotion.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Phân quyền vai trò (Role Permission)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as WorkspaceMember['role'])}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="Writer (Biên kịch)">✍️ Writer (Biên kịch kịch bản STEM)</option>
                  <option value="Reviewer (Chuyên gia)">🧑‍🔬 Reviewer (Chuyên gia thẩm định học thuật & video)</option>
                  <option value="Producer (Dựng video)">🎬 Producer (Lập trình Remotion & Render)</option>
                  <option value="Trưởng bộ môn (Admin)">👨‍🏫 Trưởng bộ môn (Admin toàn quyền)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  Chỉ Trưởng bộ môn mới có quyền thay đổi role hoặc xoá dự án.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Gửi lời mời tham gia nhóm
                </button>
              </div>
            </form>
          )}

          {/* Current team members list */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Thành viên trong tổ bộ môn ({members.length})
            </h5>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{m.avatar}</span>
                    <div>
                      <div className="font-semibold text-slate-800">{m.name}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{m.email}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    m.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {m.status === 'ACTIVE' ? m.role.split(' ')[0] : 'Đang chờ'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
