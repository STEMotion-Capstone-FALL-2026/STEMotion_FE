import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { UserRole } from '../../types/stem';

interface InviteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (email: string, role: UserRole) => Promise<string>;
}

export const InviteWorkspaceModal: React.FC<InviteWorkspaceModalProps> = ({ isOpen, onClose, onSendInvite }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('writer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <form className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true); setError(''); setLink('');
          try { setLink(await onSendInvite(email, role)); }
          catch (failure: any) { setError(failure.message || 'Không tạo được lời mời.'); }
          finally { setBusy(false); }
        }}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm flex gap-2"><UserPlus className="w-4 h-4" />Mời thành viên</h3>
          <button type="button" onClick={onClose} aria-label="Đóng"><X className="w-4 h-4" /></button>
        </div>
        <label className="block">Email được mời
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full border rounded-lg p-2" />
        </label>
        <label className="block">Vai trò trong nhóm
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}
            className="mt-1 w-full border rounded-lg p-2">
            <option value="writer">Writer</option><option value="reviewer">Reviewer</option>
            <option value="producer">Producer</option>
          </select>
        </label>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        {link && <div className="p-3 bg-blue-50 rounded-lg space-y-2">
          <p>Chuyển link này riêng cho người được mời. Link có hạn 7 ngày, dùng một lần; người nhận cần đăng nhập bằng email được mời.</p>
          <input aria-label="Link lời mời" readOnly value={link} className="w-full border rounded p-2" />
          <p>Hệ thống chưa tự gửi email. Link mới thay thế lời mời trước đó.</p>
        </div>}
        <button disabled={busy} type="submit" className="w-full p-2.5 rounded-lg bg-brand-600 text-white font-bold disabled:opacity-50">
          {busy ? 'Đang tạo…' : 'Tạo link lời mời'}
        </button>
      </form>
    </div>
  );
};
