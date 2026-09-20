import React from 'react';
import { GitCompare, X } from 'lucide-react';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <GitCompare className="w-4 h-4 text-brand-600" />
            <span>So Sánh Lịch Sử Phiên Bản (Diff v1.1 vs v1.2)</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-lg font-bold text-slate-700 border">
            <div>BẢN KHỞI TẠO (v1.1)</div>
            <div>BẢN ĐÃ CẬP NHẬT (v1.2)</div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border text-xs leading-relaxed">
            <div className="text-slate-500">
              <span className="badge-diff-del px-1 rounded">Khi đó tổng hai nghiệm x1 + x2 bằng trừ b trên a</span>
            </div>
            <div className="text-slate-800">
              <span className="badge-diff-add px-1 rounded font-semibold">
                Điều kiện tiên quyết là biệt thức delta phải lớn hơn hoặc bằng không để phương trình có nghiệm.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-bold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
