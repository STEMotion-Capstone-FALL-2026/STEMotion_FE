import React from 'react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="p-2">
          <CreateWorkspaceForm
            onWorkspaceCreated={(created) => {
              onWorkspaceCreated?.(created);
              setTimeout(() => {
                onClose();
              }, 1200);
            }}
          />
        </div>
      </div>
    </div>
  );
};
