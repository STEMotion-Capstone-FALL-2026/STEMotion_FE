import { useDialog } from '../../hooks/useDialog';
import React, { useEffect, useRef, useState } from 'react';
import { Columns2, Loader2, Pause, Play, X } from 'lucide-react';
import { RenderHistoryEntry, renderService } from '../../services/renderService';

const describe = (job: RenderHistoryEntry, index: number) =>
  `Bản ${index + 1}${job.scriptVersionNo ? ` · kịch bản v${job.scriptVersionNo}` : ''}${
    job.createdAt ? ` · ${new Date(job.createdAt).toLocaleString('vi-VN')}` : ''
  }`;

/**
 * Compares two renders of the same clip side by side ("compare a re-rendered
 * clip across iterations" in the proposal). Both players share one play
 * button and one timeline, so the reviewer sees the same moment in each.
 */
export const ClipCompareModal: React.FC<{ projectId: string; onClose: () => void }> = ({ projectId, onClose }) => {
  const dialog = useDialog(true, 'So sánh các bản render', onClose);
  const [renders, setRenders] = useState<RenderHistoryEntry[] | null>(null);
  const [error, setError] = useState('');
  const [left, setLeft] = useState(1);
  const [right, setRight] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let active = true;
    setError('');
    setRenders(null);
    renderService
      .getHistory(projectId)
      .then((jobs) => { if (active) setRenders(jobs.filter((j) => j.status === 'COMPLETED' && j.videoUrl)); })
      .catch((err: any) => { if (active) setError(err?.message || 'Không tải được lịch sử render.'); });
    return () => { active = false; };
  }, [projectId]);

  const both = (fn: (v: HTMLVideoElement) => void) => [a.current, b.current].forEach((v) => v && fn(v));
  const toggle = async () => {
    if (playing) { both((v) => v.pause()); setPlaying(false); return; }
    try {
      await Promise.all([a.current, b.current].filter(Boolean).map(v => v!.play()));
      setPlaying(true);
      setError('');
    } catch {
      both(v => v.pause()); setPlaying(false);
      setError('Không phát được video. Kiểm tra kết nối hoặc chọn lại bản render.');
    }
  };
  const seek = (t: number) => {
    both((v) => (v.currentTime = Math.min(t, v.duration || t)));
    setTime(t);
  };

  const enough = renders && renders.length >= 2;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div ref={dialog} className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-200 text-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Columns2 className="w-4 h-4 text-purple-600" /> So sánh hai bản render
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {error && <p role="alert" className="text-rose-600">{error}</p>}
          {!renders && !error && (
            <p className="text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lịch sử render...
            </p>
          )}
          {renders && !enough && (
            <p className="text-slate-500">Clip này mới có {renders.length} bản render hoàn tất; cần ít nhất hai bản để so sánh.</p>
          )}
          {enough && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { ref: a, value: left, set: setLeft },
                  { ref: b, value: right, set: setRight },
                ].map((side, k) => (
                  <div key={k} className="space-y-2">
                    <select
                      value={side.value}
                      onChange={(e) => {
                        side.set(Number(e.target.value));
                        setPlaying(false);
                        setTime(0);
                      }}
                      className="w-full p-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      {renders!.map((job, i) => (
                        <option key={job.jobId} value={i}>
                          {describe(job, renders!.length - 1 - i)}
                          {i === 0 ? ' (mới nhất)' : ''}
                        </option>
                      ))}
                    </select>
                    <video
                      ref={side.ref}
                      src={renders![side.value].videoUrl!}
                      className="w-full rounded-lg bg-black aspect-video"
                      muted={k === 1}
                      onLoadedMetadata={(e) => setDuration((d) => Math.max(d, e.currentTarget.duration || 0))}
                      onTimeUpdate={k === 0 ? (e) => setTime(e.currentTarget.currentTime) : undefined}
                      onEnded={() => { both(v => v.pause()); setPlaying(false); }}
                      onError={() => { both(v => v.pause()); setPlaying(false); setError('Video không tải được. Kiểm tra kết nối hoặc chọn lại bản render.'); }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggle}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5"
                >
                  {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {playing ? 'Tạm dừng' : 'Phát cả hai'}
                </button>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={time}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-mono text-slate-500 w-20 text-right">
                  {time.toFixed(1)}s / {duration.toFixed(1)}s
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Tiếng chỉ phát từ bản bên trái để không bị chồng âm.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
