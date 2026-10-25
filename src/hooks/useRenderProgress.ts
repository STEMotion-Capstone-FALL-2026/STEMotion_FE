import { useEffect, useRef, useState } from 'react';
import { renderService } from '../services/renderService';

/** Poll after each response, so slow requests never overlap or overwrite another project. */
export function useRenderProgress(projectId: string, enabled: boolean,
    onCompleted: (videoUrl: string) => void) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const completed = useRef(onCompleted);
  completed.current = onCompleted;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    setStatus(null);
    setError('');
    if (!enabled) return;
    const poll = async () => {
      let terminal = false;
      try {
        const jobs = await renderService.getHistory(projectId);
        if (!active) return;
        const job = jobs[0];
        setError('');
        failures = 0;
        setStatus(job?.status ?? 'QUEUED');
        if (job?.status === 'COMPLETED' && job.videoUrl) {
          terminal = true;
          completed.current(job.videoUrl);
        } else if (job?.status === 'FAILED') {
          terminal = true;
          setError('Kết xuất MP4 thất bại. Mở lịch sử render trong Producer để xem lỗi và thử lại.');
        } else if (job?.status === 'COMPLETED') {
          setError('Render đã hoàn tất nhưng chưa nhận được URL video. Đang kiểm tra lại.');
        }
      } catch {
        if (!active) return;
        failures++;
        setError('Chưa cập nhật được tiến độ render do lỗi kết nối. Hệ thống sẽ tự kiểm tra lại.');
      }
      if (active && !terminal) timer = setTimeout(poll, Math.min(30000, 4000 * 2 ** failures));
    };
    void poll();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [projectId, enabled, retryToken]);

  return { status, error, retry: () => setRetryToken(value => value + 1) };
}
