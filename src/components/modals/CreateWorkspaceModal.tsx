import { useDialog } from '../../hooks/useDialog';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CreateWorkspaceForm } from '../views/AdminPortal/CreateWorkspaceForm';
import { WorkspaceSummary } from '../../services/workspaceService';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated?: (workspace: WorkspaceSummary) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onWorkspaceCreated,
}) => {
  const [busy, setBusy] = useState(false);
  const dialog = useDialog(isOpen, 'Tạo không gian làm việc', onClose, busy);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div ref={dialog} className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={onClose}
          disabled={busy}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="p-2">
          <CreateWorkspaceForm
            onBusyChange={setBusy}
            onWorkspaceCreated={(created) => {
              onWorkspaceCreated?.(created);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
