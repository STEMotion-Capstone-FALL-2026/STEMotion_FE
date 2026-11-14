import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Youtube } from 'lucide-react';
import { youtubeService, type YouTubeConnection } from '../../services/youtubeService';
import { youtubeErrorMessage } from './youtubeErrors';

interface Props {
  workspaceId: string;
  /** Producer of this workspace or system Admin: the API refuses connect/disconnect to anyone else. */
  canManage: boolean;
  onNotify?: (message: string, type?: 'success' | 'info' | 'warn') => void;
  /** True right after Google sent the browser back: say whether the channel is now connected. */
  announceReturn?: boolean;
  /** Lets the caller send the browser to Google; replaced in tests. */
  navigate?: (url: string) => void;
}

export const formatVietnameseDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

export function YouTubeChannelPanel({ workspaceId, canManage, onNotify, announceReturn = false, navigate = url => window.location.assign(url) }: Props) {
  const [connection, setConnection] = useState<YouTubeConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const announced = useRef(false);
  // The parent's toast function changes every render; reading it from a ref keeps the load effect stable.
  const notify = useRef(onNotify);
  notify.current = onNotify;

  const load = useCallback(async () => {
    setError(null);
    try {
      const value = await youtubeService.getConnection(workspaceId);
      setConnection(value);
      return value;
    } catch (err) {
      setError(youtubeErrorMessage(err) ?? 'Không đọc được trạng thái kênh YouTube.');
      return null;
    }
  }, [workspaceId]);

  useEffect(() => {
    let current = true;
    setConnection(null); setConfirming(false);
    void load().then(value => {
      if (!current || !announceReturn || announced.current || !value) return;
      announced.current = true;
      if (value.connected) notify.current?.(`Đã kết nối kênh YouTube: ${value.channelTitle || 'kênh của workspace'}.`, 'success');
      else notify.current?.('Kênh YouTube chưa được kết nối. Hãy thử kết nối lại.', 'warn');
    });
    return () => { current = false; };
  }, [load, announceReturn]);

  const connect = async () => {
    setBusy(true); setError(null);
    try {
      navigate(await youtubeService.startConnect(workspaceId));
    } catch (err) {
      setError(youtubeErrorMessage(err) ?? (err instanceof Error ? err.message : 'Không bắt đầu kết nối YouTube được.'));
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true); setError(null);
    try {
      await youtubeService.disconnect(workspaceId);
      setConfirming(false);
      notify.current?.('Đã ngắt kết nối kênh YouTube.', 'info');
      await load();
    } catch (err) {
      setError(youtubeErrorMessage(err) ?? 'Không ngắt kết nối được.');
    } finally { setBusy(false); }
  };

  return (
    <section aria-label="Kênh YouTube" className="space-y-3 text-sm">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Youtube size={18} className="text-rose-600" /> Kênh YouTube của workspace</h3>
      {!connection && !error && <p>Đang đọc trạng thái kênh…</p>}
      {connection && (connection.connected ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
          <p className="font-semibold">Đã kết nối: {connection.channelTitle || 'Kênh chưa đặt tên'}</p>
          {connection.connectedAt && <p>Kết nối lúc {formatVietnameseDateTime(connection.connectedAt)}</p>}
        </div>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">Chưa kết nối kênh YouTube.</p>
      ))}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">{error}</p>}
      {connection && canManage && !connection.connected && (
        <button type="button" onClick={connect} disabled={busy} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? 'Đang chuyển sang Google…' : 'Kết nối kênh YouTube'}
        </button>
      )}
      {connection?.connected && canManage && (!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} disabled={busy} className="rounded-lg border border-rose-300 px-4 py-2 text-rose-700 disabled:opacity-50">Ngắt kết nối</button>
      ) : (
        <div role="group" aria-label="Xác nhận ngắt kết nối" className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
          <p>Ngắt kết nối thì workspace không đăng video lên kênh này được nữa cho tới khi kết nối lại.</p>
          <div className="flex gap-2">
            <button type="button" onClick={disconnect} disabled={busy} className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">Xác nhận ngắt kết nối</button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="rounded-lg border px-3 py-1.5">Hủy</button>
          </div>
        </div>
      ))}
      {connection && !canManage && <p className="text-slate-500">Producer của workspace hoặc Admin mới kết nối hay ngắt kết nối được kênh.</p>}
      <p className="text-xs text-slate-500">Video có thể bị giữ ở chế độ riêng tư cho tới khi dự án Google được kiểm định.</p>
    </section>
  );
}
