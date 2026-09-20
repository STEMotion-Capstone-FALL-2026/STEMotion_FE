import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { STEMSubject } from '../../types/stem';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, subject: STEMSubject, grade: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSubject, setNewProjSubject] = useState<STEMSubject>('Physics');
  const [newProjGrade, setNewProjGrade] = useState('Lớp 10');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;
    onCreate(newProjTitle.trim(), newProjSubject, newProjGrade);
    setNewProjTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>Tạo Dự Án Kịch Bản Video Mới</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Chủ đề bài học STEM:</label>
            <input
              type="text"
              required
              value={newProjTitle}
              onChange={(e) => setNewProjTitle(e.target.value)}
              placeholder="VD: Cân bằng phản ứng Oxi hóa khử, Định luật khúc xạ..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Môn Học:</label>
              <select
                value={newProjSubject}
                onChange={(e) => setNewProjSubject(e.target.value as STEMSubject)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Physics">Vật Lý (Physics)</option>
                <option value="Math">Toán Học (Math)</option>
                <option value="Chemistry">Hóa Học (Chemistry)</option>
                <option value="Biology">Sinh Học (Biology)</option>
                <option value="ComputerScience">Tin Học (Computer Science)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Khối Lớp:</label>
              <select
                value={newProjGrade}
                onChange={(e) => setNewProjGrade(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Lớp 9">Lớp 9</option>
                <option value="Lớp 10">Lớp 10</option>
                <option value="Lớp 11">Lớp 11</option>
                <option value="Lớp 12">Lớp 12</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1"
            >
              <span>Khởi Tạo & Mở Studio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
