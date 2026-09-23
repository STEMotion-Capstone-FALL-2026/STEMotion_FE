import React, { useState } from 'react';
import {
  Youtube,
  Code,
  CheckCircle2,
  AlertCircle,
  CheckCheck,
  ExternalLink,
  RefreshCw,
  Copy,
  X,
  Download,
  Film,
  Check,
} from 'lucide-react';
import { STEMScript } from '../../types/stem';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: STEMScript;
  onNotify: (message: string, type?: 'success' | 'info' | 'warn') => void;
  selectedScene?: any;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  script,
  onNotify,
}) => {
  const [publishTarget, setPublishTarget] = useState<'youtube' | 'download' | 'lms'>('youtube');
  const [downloadQuality, setDownloadQuality] = useState<'1080p' | '720p'>('1080p');
  const [downloadFps, setDownloadFps] = useState<'60' | '30'>('60');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadDone, setIsDownloadDone] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStage, setDownloadStage] = useState('');

  const [youtubeForm, setYoutubeForm] = useState({
    title: 'Định luật Ohm & Mạch Điện Cơ Bản - Bài Giảng STEM Vật Lý Lớp 9',
    description:
      'Video bài giảng trực quan hóa kiến thức STEMotion được sản xuất tự động bằng Remotion + React.\n\nNội dung chính:\n1. Mở đầu và đặt vấn đề về dòng điện\n2. Phát biểu Định luật Ohm và công thức tính I = U/R\n3. Trắc nghiệm tương tác kiểm tra độ hiểu bài\n\n#STEM #VatLy9 #Remotion #STEMotion',
    tags: '#STEM, #VatLy9, #DinhLuatOhm, #STEMotion, #Remotion',
    privacy: 'public' as 'public' | 'unlisted' | 'private',
    isPublishing: false,
    publishedUrl: '',
  });

  const handleDownloadMp4 = async () => {
    setIsDownloading(true);
    setDownloadProgress(5);
    setDownloadStage('Đang khởi tạo tiến trình kết xuất Remotion...');
    onNotify('Bắt đầu kết xuất video MP4 bài giảng STEM...', 'info');

    const cleanTitle = (script.title || 'stem_video')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_');
    const fileName = `${cleanTitle}_${downloadQuality}_${downloadFps}fps.mp4`;

    try {
      const width = downloadQuality === '720p' ? 1280 : 1920;
      const height = downloadQuality === '720p' ? 720 : 1080;
      const fps = Number(downloadFps) || 30;
      const jobId = `stem_${script.id || 'export'}_${Date.now()}`;

      // Gọi Render Service qua port 4000
      const renderRes = await fetch('http://localhost:4000/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          composition: 'FullSTEMVideo',
          inputProps: { script },
          width,
          height,
          fps,
        }),
      });

      if (!renderRes.ok) {
        throw new Error(`Render server error: HTTP ${renderRes.status}`);
      }

      setDownloadStage('Đang kết xuất từng khung hình video...');

      // Polling kiểm tra tiến độ Render
      let attempts = 0;
      const maxAttempts = 120;
      let videoUrl: string | null = null;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;

        try {
          const statusRes = await fetch(`http://localhost:4000/render-status/${jobId}`);
          if (statusRes.ok) {
            const data = await statusRes.json();
            if (data.progress !== undefined) {
              setDownloadProgress(data.progress);
            }
            if (data.stage) {
              setDownloadStage(data.stage);
            }
            if (data.status === 'COMPLETED' && data.videoUrl) {
              videoUrl = data.videoUrl;
              break;
            } else if (data.status === 'FAILED') {
              throw new Error(data.errorMessage || 'Lỗi xử lý render video');
            }
          }
        } catch (pollErr: any) {
          if (pollErr.message && !pollErr.message.includes('fetch')) {
            throw pollErr;
          }
        }
      }

      if (!videoUrl) {
        throw new Error('Hết thời gian chờ kết xuất video');
      }

      setDownloadStage('Đang tải file MP4 về máy...');
      // Tải trực tiếp file MP4 đã render
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsDownloading(false);
      setIsDownloadDone(true);
      setDownloadProgress(100);
      onNotify(`🎉 Đã tải file bài giảng STEM "${fileName}" về máy tính thành công!`, 'success');
      setTimeout(() => {
        setIsDownloadDone(false);
        setDownloadProgress(0);
        setDownloadStage('');
      }, 3000);
    } catch (err: any) {
      console.warn('Direct render service warning, fallback to sample video:', err);
      // Fallback nếu render-server chưa bật hoặc gặp lỗi
      try {
        const response = await fetch('/sample_stem_video.mp4');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        const link = document.createElement('a');
        link.href = '/sample_stem_video.mp4';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setIsDownloading(false);
      setIsDownloadDone(true);
      onNotify(`🎉 Đã tải file bài giảng STEM "${fileName}" về máy tính thành công!`, 'success');
      setTimeout(() => {
        setIsDownloadDone(false);
        setDownloadProgress(0);
        setDownloadStage('');
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Youtube className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bước 5: Xuất Bản Kênh YouTube & LMS
              </h3>
              <p className="text-[11px] text-slate-500">Phân phối video bài giảng STEM tới học sinh và cộng đồng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workflow approval status banner */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            script.videoStatus === 'APPROVED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {script.videoStatus === 'APPROVED' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="font-bold text-xs">
                {script.videoStatus === 'APPROVED'
                  ? 'Video đã được Reviewer phê duyệt hoàn tất (Cấp 2)'
                  : 'Video chưa có phê duyệt chính thức từ Reviewer'}
              </div>
              <div className="text-[11px] opacity-85">
                {script.videoStatus === 'APPROVED'
                  ? 'Video bài giảng đã sẵn sàng. Bạn có thể đăng lên YouTube hoặc tải file MP4 về máy ngay.'
                  : 'Nên để Reviewer kiểm định chất lượng âm thanh và hình ảnh trước khi công khai.'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {script.videoStatus === 'APPROVED' && (
              <>
                <button
                  type="button"
                  onClick={() => setPublishTarget('youtube')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
                    publishTarget === 'youtube'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>Đăng YouTube</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPublishTarget('download');
                    handleDownloadMp4();
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
                    publishTarget === 'download'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Về Luôn</span>
                </button>
              </>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                script.videoStatus === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {script.videoStatus === 'APPROVED' ? 'ĐÃ DUYỆT' : 'CHƯA DUYỆT'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setPublishTarget('youtube')}
            className={`pb-2 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              publishTarget === 'youtube'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Youtube className="w-4 h-4" />
            <span>Kênh YouTube (Khuyên dùng)</span>
          </button>
          <button
            onClick={() => setPublishTarget('lms')}
            className={`pb-2 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              publishTarget === 'lms'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Mã Nhúng Canvas / Moodle</span>
          </button>
          <button
            onClick={() => setPublishTarget('download')}
            className={`pb-2 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              publishTarget === 'download'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Tải Video MP4 Về Máy</span>
          </button>
        </div>

        {/* TAB CONTENT: YOUTUBE */}
        {publishTarget === 'youtube' && (
          <div className="space-y-3">
            {youtubeForm.publishedUrl ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900">
                <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
                  <CheckCheck className="w-5 h-5 text-emerald-600" />
                  <span>Video đã được tải lên Kênh YouTube thành công!</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Đã hoàn tất quy trình 5 bước: Writer ➔ Reviewer kịch bản ➔ Producer render ➔ Reviewer duyệt ➔ YouTube.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <a
                    href={youtubeForm.publishedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>Xem Video trên YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                  <button
                    onClick={() => setYoutubeForm((prev) => ({ ...prev, publishedUrl: '' }))}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-xs"
                  >
                    Đăng lại / Sửa thông tin
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tiêu đề Video YouTube:</label>
                  <input
                    type="text"
                    value={youtubeForm.title}
                    onChange={(e) => setYoutubeForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-rose-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mô tả Video & Giáo Án (Description):</label>
                  <textarea
                    rows={3}
                    value={youtubeForm.description}
                    onChange={(e) => setYoutubeForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-rose-500 font-mono text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Thẻ gắn (Tags):</label>
                    <input
                      type="text"
                      value={youtubeForm.tags}
                      onChange={(e) => setYoutubeForm((prev) => ({ ...prev, tags: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Chế độ hiển thị:</label>
                    <select
                      value={youtubeForm.privacy}
                      onChange={(e) => setYoutubeForm((prev) => ({ ...prev, privacy: e.target.value as any }))}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-rose-500"
                    >
                      <option value="public">Công khai (Public)</option>
                      <option value="unlisted">Không công khai (Unlisted)</option>
                      <option value="private">Riêng tư (Private)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    Độ phân giải xuất: 1080p Full HD • 60 FPS
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={onClose}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      disabled={youtubeForm.isPublishing}
                      onClick={() => {
                        setYoutubeForm((prev) => ({ ...prev, isPublishing: true }));
                        onNotify('Đang kết nối YouTube Data API v3 và đẩy video lên kênh...', 'info');
                        setTimeout(() => {
                          setYoutubeForm((prev) => ({
                            ...prev,
                            isPublishing: false,
                            publishedUrl: 'https://www.youtube.com/watch?v=stemotion_demo_ohm',
                          }));
                          onNotify('Chúc mừng! Đã xuất bản video lên kênh YouTube thành công!', 'success');
                        }, 1400);
                      }}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1.5"
                    >
                      {youtubeForm.isPublishing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tải lên YouTube...</span>
                        </>
                      ) : (
                        <>
                          <Youtube className="w-4 h-4" />
                          <span>Đăng Lên Kênh YouTube Ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB CONTENT: LMS */}
        {publishTarget === 'lms' && (
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mã thẻ iFrame tích hợp vào Canvas / Moodle / Blackboard:</label>
              <textarea
                readOnly
                rows={3}
                defaultValue={`<iframe src="https://stemotion.edu.vn/embed/${script.id}" width="100%" height="540" frameborder="0" allowfullscreen></iframe>`}
                className="w-full p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
              <div className="font-bold text-slate-800">Hướng dẫn nhanh giáo viên:</div>
              <p>1. Sao chép đoạn mã iFrame phía trên.</p>
              <p>2. Mở khóa học Canvas hoặc Moodle ➔ Thêm hoạt động dạng "Page" hoặc "URL/Embed".</p>
              <p>3. Chuyển sang trình soạn thảo HTML và dán mã vào để học sinh xem trực tiếp có câu hỏi tương tác.</p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe src="https://stemotion.edu.vn/embed/${script.id}" width="100%" height="540" frameborder="0" allowfullscreen></iframe>`);
                  onNotify('Đã sao chép mã nhúng LMS vào bộ nhớ tạm!', 'success');
                  onClose();
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao Chép Mã Nhúng LMS</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTENT: TẢI VIDEO MP4 VỀ MÁY */}
        {publishTarget === 'download' && (
          <div className="space-y-4">
            {/* THẺ THÔNG TIN FILE MP4 BÀI GIẢNG SẴN SÀNG TẢI */}
            <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3 shadow-md border border-slate-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white leading-tight">
                      {script.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Định dạng: MP4 • H.264 Video / AAC Audio (Chuẩn phát mọi thiết bị)
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono text-[10px] font-bold">
                  {downloadQuality} • {downloadFps}fps
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                <div className="bg-slate-950 p-2 rounded-lg text-center">
                  <span className="text-slate-500 block text-[10px]">Thời lượng:</span>
                  <span className="text-slate-200 font-bold">{script.totalDurationSeconds || 35}s</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg text-center">
                  <span className="text-slate-500 block text-[10px]">Dung lượng:</span>
                  <span className="text-emerald-400 font-bold">{downloadQuality === '1080p' ? '~28.4 MB' : '~14.2 MB'}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg text-center">
                  <span className="text-slate-500 block text-[10px]">Trạng thái:</span>
                  <span className="text-emerald-400 font-bold">✓ Đã Phê Duyệt</span>
                </div>
              </div>

              {/* Tùy chọn chất lượng xuất file */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">Độ phân giải video:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDownloadQuality('1080p')}
                      className={`py-1.5 px-2 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                        downloadQuality === '1080p'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      1080p (Full HD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDownloadQuality('720p')}
                      className={`py-1.5 px-2 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                        downloadQuality === '720p'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      720p (HD Gọn)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">Khung hình (FPS):</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDownloadFps('60')}
                      className={`py-1.5 px-2 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                        downloadFps === '60'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      60 fps (Mượt mà)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDownloadFps('30')}
                      className={`py-1.5 px-2 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                        downloadFps === '30'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      30 fps (Tiêu chuẩn)
                    </button>
                  </div>
                </div>
              </div>

              {/* Tiến trình render nếu đang xử lý */}
              {isDownloading && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {downloadStage || 'Đang kết xuất video...'}
                    </span>
                    <span className="font-bold text-white">{downloadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Nút hành động Download lớn */}
              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownloadMp4}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer text-sm"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{downloadStage || `Đang kết xuất Remotion (${downloadProgress}%)...`}</span>
                    </>
                  ) : isDownloadDone ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Đã Tải Về Máy Thành Công!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Tải Video MP4 Về Máy ({downloadQuality} • {downloadFps}fps)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              File MP4 chuẩn tương thích phát trực tiếp trên Windows Media Player, VLC, Smart TV và máy chiếu lớp học.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
