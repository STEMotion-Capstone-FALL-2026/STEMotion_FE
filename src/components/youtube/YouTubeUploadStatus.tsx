import React, { useEffect, useState } from 'react';
import { publicationService, type PublicationResponse, type YouTubeUploadStatus as UploadStatus } from '../../services/publicationService';

export const POLL_INTERVAL_MS = 5000;
const ACTIVE: UploadStatus[] = ['PENDING', 'UPLOADING'];

/** The YouTube state of a project: every publication row carries it, so the first one that has it wins. */
export function youtubeStateOf(rows: PublicationResponse[]): PublicationResponse | null {
  return rows.find(row => row.uploadStatus) ?? null;
}

interface Props {
  projectId: string;
  /** The answer of the publish call, shown at once and polled from. */
  initial?: PublicationResponse | null;
  onRetry?: () => void;
  retryDisabled?: boolean;
}

/** Polls the publications every 5 seconds while the upload is PENDING/UPLOADING; stops on a final state or unmount. */
export function YouTubeUploadStatus({ projectId, initial = null, onRetry, retryDisabled }: Props) {
  const [state, setState] = useState<PublicationResponse | null>(initial?.uploadStatus ? initial : null);
  const [readError, setReadError] = useState(false);

  useEffect(() => { if (initial?.uploadStatus) setState(initial); }, [initial]);

  useEffect(() => {
    let current = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const next = youtubeStateOf(await publicationService.listPublications(projectId));
        if (!current) return;
        setReadError(false);
        if (next) setState(next);
        // No YouTube row means the project was never sent to YouTube: one read, no polling.
        if (next?.uploadStatus && ACTIVE.includes(next.uploadStatus)) timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!current) return;
        setReadError(true);
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };
    const status = initial?.uploadStatus;
    if (!status || ACTIVE.includes(status)) void poll();
    return () => { current = false; if (timer) clearTimeout(timer); };
  }, [projectId, initial]);

  if (!state?.uploadStatus) return readError ? <p className="text-xs text-amber-700">Chưa đọc được trạng thái YouTube, đang thử lại…</p> : null;
  const status = state.uploadStatus;
  return (
    <div aria-label="Trạng thái YouTube" aria-live="polite" className="space-y-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
      {status === 'PENDING' && <p>YouTube: đang chờ tải lên…</p>}
      {status === 'UPLOADING' && <p>YouTube: đang tải lên…</p>}
      {status === 'UPLOADED' && <p className="text-emerald-700">YouTube: đã đăng.{' '}
        {state.youtubeUrl && /^https:\/\//.test(state.youtubeUrl) && <a href={state.youtubeUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Mở video trên YouTube</a>}
      </p>}
      {status === 'FAILED' && <>
        <p role="alert" className="text-rose-700">YouTube: tải lên thất bại{state.uploadError ? `: ${state.uploadError}` : '.'}</p>
        {onRetry && <button type="button" onClick={onRetry} disabled={retryDisabled} className="rounded-lg border border-rose-300 px-3 py-1.5 text-rose-700 disabled:opacity-50">Đăng lại lên YouTube</button>}
      </>}
      {readError && <p className="text-xs text-amber-700">Mất kết nối khi đọc trạng thái, đang thử lại…</p>}
    </div>
  );
}
