import React, { useState } from 'react';
import { Library, X, Plus } from 'lucide-react';
import { SceneData } from '../../types/stem';
import { STEM_TEMPLATES_CATALOG } from '../../constants/templatesCatalog';

interface TemplateCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (type: SceneData['type'], title: string) => void;
}

export const TemplateCatalogModal: React.FC<TemplateCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [templateCatalogFilter, setTemplateCatalogFilter] = useState<
    'ALL' | 'Math' | 'Physics' | 'Chemistry' | 'Biology' | 'ComputerScience'
  >('ALL');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Kho Template Phân Cảnh STEMotion 4.0</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold">
                  11 Templates Chuẩn GDPT
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Kho mẫu hoạt họa video Remotion trực quan hóa kiến thức chuyên sâu cho 5 môn học STEM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 border-b border-slate-100">
          {[
            { id: 'ALL', label: 'Tất Cả (11)' },
            { id: 'Math', label: 'Toán Học' },
            { id: 'Physics', label: 'Vật Lý' },
            { id: 'Chemistry', label: 'Hóa Học' },
            { id: 'Biology', label: 'Sinh Học' },
            { id: 'ComputerScience', label: 'Tin Học' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTemplateCatalogFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                templateCatalogFilter === tab.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Template Grid List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {STEM_TEMPLATES_CATALOG
            .filter(
              (tpl) =>
                templateCatalogFilter === 'ALL' ||
                tpl.category === templateCatalogFilter ||
                tpl.category === 'ALL'
            )
            .map((tpl) => (
              <div
                key={tpl.type}
                className="border border-slate-200 rounded-xl p-3.5 hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between group bg-white"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tpl.bgBadge}`}>
                      {tpl.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{tpl.duration}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs group-hover:text-brand-600 transition-colors">
                    {tpl.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">{tpl.subject}</span>
                  <button
                    onClick={() => {
                      onSelectTemplate(tpl.type, tpl.title);
                      onClose();
                    }}
                    className="px-3 py-1 bg-brand-50 group-hover:bg-brand-600 group-hover:text-white text-brand-700 font-bold rounded-lg transition-all text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Chèn Vào Video</span>
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[11px] text-slate-500 shrink-0 font-mono">
          <span>Được xây dựng chuẩn sư phạm chương trình GDPT 2018</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
