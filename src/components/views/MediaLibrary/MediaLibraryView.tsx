import React from 'react';
import { Code } from 'lucide-react';
import { STEMScript } from '../../../types/stem';

interface MediaLibraryViewProps {
  script: STEMScript;
  onOpenPublishModal: () => void;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  script,
  onOpenPublishModal,
}) => {
  return (
    <main className="flex-1 bg-slate-50 p-6 flex flex-col">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Thư Viện Clip STEM Nội Bộ (Media Library)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kho video bài giảng STEM đã duyệt, sẵn sàng nhúng vào LMS hoặc chia sẻ.
            </p>
          </div>
          <button
            onClick={onOpenPublishModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5"
          >
            <Code className="w-4 h-4" />
            <span>Xem Mã Nhúng LMS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="aspect-video bg-gradient-to-br from-blue-900 to-indigo-950 p-4 text-white flex flex-col justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 w-fit">
                {script.subject} • {script.gradeLevel}
              </span>
              <div className="font-bold text-base">{script.title}</div>
              <span className="text-[11px] text-slate-400">
                Thời lượng: ~{script.totalDurationSeconds}s
              </span>
            </div>
            <div className="p-4 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-bold">✓ Đã xuất bản LMS</span>
              <button
                onClick={onOpenPublishModal}
                className="px-3 py-1.5 bg-brand-50 text-brand-700 font-bold rounded-lg hover:bg-brand-100"
              >
                Lấy mã iFrame
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
