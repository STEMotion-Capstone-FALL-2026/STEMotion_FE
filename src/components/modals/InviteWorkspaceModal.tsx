import React from 'react';
import { UserPlus, X } from 'lucide-react';

interface InviteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: () => void;
}

export const InviteWorkspaceModal: React.FC<InviteWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSendInvite,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <UserPlus className="w-4 h-4 text-brand-600" />
            <span>Mời Thành Viên Vào Nhóm</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Thành Viên:</label>
            <input
              type="email"
              placeholder="dongnghiep@edtech.vn"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Vai Trò:</label>
            <select className="w-full p-2 border border-slate-200 rounded-lg bg-white">
              <option>Writer (Biên kịch kịch bản)</option>
              <option>Reviewer (Thẩm định học thuật & clip)</option>
              <option>Producer (Dựng video Remotion)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              onSendInvite();
              onClose();
            }}
            className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-xs"
          >
            Gửi Lời Mời
          </button>
        </div>
      </div>
    </div>
  );
};
