import React, { useState } from 'react';
import { PlusCircle, X, Sparkles, Loader2, Route } from 'lucide-react';
import { STEMSubject } from '../../types/stem';
import { LessonApproach, describeApproach, scriptService } from '../../services/scriptService';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    title: string,
    subject: STEMSubject,
    grade: string,
    useAi: boolean,
    targetDurationSec?: number,
    /** How the video should lead through the lesson; empty lets the AI choose. */
    approach?: string
  ) => Promise<void> | void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSubject, setNewProjSubject] = useState<STEMSubject>('Physics');
  const [newProjGrade, setNewProjGrade] = useState('Lớp 10');
  const [useAi, setUseAi] = useState(true);
  const [targetDurationSec, setTargetDurationSec] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  // 'auto': the AI invents an approach; 'own': the writer's idea; a number: one of the suggestions.
  const [approachChoice, setApproachChoice] = useState<'auto' | 'own' | number>('auto');
  const [ownApproach, setOwnApproach] = useState('');
  const [suggestions, setSuggestions] = useState<LessonApproach[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState('');

  if (!isOpen) return null;

  const suggest = async () => {
    if (!newProjTitle.trim() || isSuggesting) return;
    setIsSuggesting(true);
    setSuggestError('');
    try {
      const options = await scriptService.suggestApproaches(newProjTitle.trim(), newProjSubject, newProjGrade);
      setSuggestions(options);
      if (options.length) setApproachChoice(0);
    } catch (err: any) {
      setSuggestError(err?.message || 'Chưa gợi ý được, thử lại sau.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const chosenApproach =
    approachChoice === 'own'
      ? ownApproach.trim()
      : typeof approachChoice === 'number' && suggestions[approachChoice]
        ? describeApproach(suggestions[approachChoice])
        : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;
    setIsLoading(true);
    try {
      await onCreate(newProjTitle.trim(), newProjSubject, newProjGrade, useAi, targetDurationSec, useAi ? chosenApproach : undefined);
      setNewProjTitle('');
      setSuggestions([]);
      setApproachChoice('auto');
      setOwnApproach('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
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
              placeholder="VD: Điều gì xảy ra nếu bạn rơi vào Hố Đen?, Hệ miễn dịch..."
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

          {useAi && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Độ sâu & Số lượng phân cảnh (AI Pacing):</label>
              <select
                value={targetDurationSec}
                onChange={(e) => setTargetDurationSec(Number(e.target.value))}
                className="w-full p-2 border border-indigo-200 rounded-lg bg-indigo-50/40 font-semibold text-indigo-950"
              >
                <option value={0}>✨ Tự động co giãn theo độ sâu chủ đề (4 – 9 cảnh)</option>
                <option value={60}>⚡ Ngắn gọn / Cô đọng (4 – 5 cảnh | ~60s)</option>
                <option value={90}>📘 Tiêu chuẩn bài giảng (6 – 7 cảnh | ~90s)</option>
                <option value={135}>🚀 Chuyên sâu Kurzgesagt (8 – 10 cảnh | ~135s)</option>
              </select>
            </div>
          )}

          {useAi && (
            <div className="space-y-2 border border-amber-200 bg-amber-50/50 rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <label className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-amber-600" />
                  Cách dẫn dắt video
                </label>
                <button
                  type="button"
                  onClick={suggest}
                  disabled={!newProjTitle.trim() || isSuggesting}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold flex items-center gap-1"
                >
                  {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {suggestions.length ? 'Gợi ý khác' : 'Gợi ý 3 cách'}
                </button>
              </div>
              <p className="text-[10px] text-amber-900/70">
                Cùng một bài có thể dạy theo nhiều cách. Chọn một gợi ý, tự viết ý tưởng, hoặc để AI tự nghĩ.
              </p>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="radio" className="mt-0.5" checked={approachChoice === 'auto'} onChange={() => setApproachChoice('auto')} />
                <span className="font-semibold text-slate-800">Để AI tự chọn cách hợp nhất</span>
              </label>

              {suggestions.map((s, i) => (
                <label
                  key={`${s.name}-${i}`}
                  className={`flex items-start gap-2 cursor-pointer p-2 rounded-lg border ${
                    approachChoice === i ? 'border-amber-400 bg-white' : 'border-transparent'
                  }`}
                >
                  <input type="radio" className="mt-0.5" checked={approachChoice === i} onChange={() => setApproachChoice(i)} />
                  <span className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">{s.name}</span>
                    {s.hook && <span className="italic text-slate-600 block">“{s.hook}”</span>}
                    {s.flow.length > 0 && <span className="text-[10px] text-slate-500 block">{s.flow.join(' → ')}</span>}
                    {s.whyItFits && <span className="text-[10px] text-emerald-700 block">{s.whyItFits}</span>}
                  </span>
                </label>
              ))}

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="radio" className="mt-0.5" checked={approachChoice === 'own'} onChange={() => setApproachChoice('own')} />
                <span className="font-semibold text-slate-800">Ý tưởng của tôi</span>
              </label>
              {approachChoice === 'own' && (
                <textarea
                  rows={2}
                  maxLength={800}
                  value={ownApproach}
                  onChange={(e) => setOwnApproach(e.target.value)}
                  placeholder="VD: Dạy như một gameshow; điều tra vì sao cầu chì bị cháy; phỏng vấn một hạt electron…"
                  className="w-full p-2 border border-amber-200 rounded-lg bg-white"
                />
              )}
              {suggestError && <p className="text-[10px] text-rose-600">{suggestError}</p>}
            </div>
          )}

          <div className="flex items-center space-x-2 bg-indigo-50/80 border border-indigo-200 p-2.5 rounded-xl">
            <input
              type="checkbox"
              id="useAiGenerate"
              checked={useAi}
              onChange={(e) => setUseAi(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="useAiGenerate" className="text-indigo-950 font-medium cursor-pointer select-none">
              <span className="font-bold flex items-center gap-1.5 text-xs text-indigo-950">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Soạn kịch bản thông minh bằng Google Gemini AI
              </span>
              <span className="text-[10px] text-indigo-600 block">Tự động phân tích độ sâu chủ đề (4–10 phân cảnh), lời thoại thuyết minh & minh họa Kurzgesagt</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1.5 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini AI Đang Soạn Kịch Bản...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Khởi Tạo & Mở Studio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
