import React from 'react';
import { X } from 'lucide-react';
import { useDialog } from '../../hooks/useDialog';
import { YouTubeChannelPanel } from './YouTubeChannelPanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName?: string;
  canManage: boolean;
  announceReturn?: boolean;
  onNotify?: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export function YouTubeChannelModal({ isOpen, onClose, workspaceId, workspaceName, canManage, announceReturn, onNotify }: Props) {
  const dialog = useDialog(isOpen, 'Kênh YouTube', onClose);
  if (!isOpen || !workspaceId) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div ref={dialog} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Kênh YouTube{workspaceName ? ` · ${workspaceName}` : ''}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        </div>
        <YouTubeChannelPanel workspaceId={workspaceId} canManage={canManage} announceReturn={announceReturn} onNotify={onNotify} />
      </div>
    </div>
  );
}
