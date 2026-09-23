import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { enableTailwind } from '@remotion/tailwind';
import * as googleTTS from 'google-tts-api';
import getMP3Duration from 'get-mp3-duration';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
const RENDERS_DIR = path.resolve(__dirname, 'public', 'renders');
const RENDER_SERVICE_KEY = process.env.RENDER_SERVICE_KEY || 'stemotion_render_secret_key_2026';

if (!fs.existsSync(RENDERS_DIR)) {
  fs.mkdirSync(RENDERS_DIR, { recursive: true });
}

// In-memory queue & job tracking
const renderQueue = [];
const jobStatuses = new Map();
let isRendering = false;
let cachedBundleLocation = null;

async function getOrCreateBundle() {
  if (!cachedBundleLocation) {
    console.log('[RenderWorker] Đang bundle source code Remotion (kèm Tailwind & KaTeX)...');
    cachedBundleLocation = await bundle({
      entryPoint: path.resolve(__dirname, 'src', 'remotion', 'index.ts'),
      webpackOverride: (currentConfiguration) => {
        return enableTailwind(currentConfiguration);
      },
    });
    console.log('[RenderWorker] Bundle hoàn tất tại:', cachedBundleLocation);
  }
  return cachedBundleLocation;
}

async function sendCallback(callbackUrl, payload) {
  if (!callbackUrl) return;
  try {
    const res = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Render-Api-Key': RENDER_SERVICE_KEY,
      },
      body: JSON.stringify(payload),
    });
    console.log(`[Callback] Gửi cập nhật tiến độ [${payload.jobId} - ${payload.status} (${payload.progress}%)] -> HTTP ${res.status}`);
  } catch (err) {
    console.error(`[Callback] Lỗi gửi callback tới ${callbackUrl}:`, err.message);
  }
}

async function processQueue() {
  if (isRendering || renderQueue.length === 0) {
    return;
  }

  isRendering = true;
  const job = renderQueue.shift();
  console.log(`\n======================================================`);
  console.log(`[RenderWorker] Bắt đầu xử lý Job: ${job.jobId}`);
  console.log(`======================================================`);

  const outputPath = path.resolve(RENDERS_DIR, `${job.jobId}.mp4`);
  const publicVideoUrl = `http://localhost:${PORT}/videos/${job.jobId}.mp4`;

  try {
    jobStatuses.set(job.jobId, {
      jobId: job.jobId,
      status: 'RENDERING',
      progress: 5,
      stage: 'Khởi động môi trường render...',
      videoUrl: null,
      errorMessage: null,
    });
    await sendCallback(job.callbackUrl, {
      jobId: job.jobId,
      status: 'RENDERING',
      progress: 5,
      stage: 'Khởi động môi trường render...',
      videoUrl: null,
      errorMessage: null,
    });

    const bundleLocation = await getOrCreateBundle();

    // 1. Tự động tổng hợp giọng đọc tiếng Việt cho từng phân cảnh có lời thoại narration
    const script = job.inputProps?.script;
    if (script && Array.isArray(script.scenes)) {
      console.log(`[RenderWorker] Đang tổng hợp giọng lồng tiếng cho ${script.scenes.length} phân cảnh...`);
      jobStatuses.set(job.jobId, {
        jobId: job.jobId,
        status: 'RENDERING',
        progress: 8,
        stage: 'Đang tổng hợp giọng thuyết minh tiếng Việt AI...',
        videoUrl: null,
        errorMessage: null,
      });

      for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i];
        if (scene.narration && !scene.narrationAudioUrl) {
          try {
            console.log(`[RenderWorker] Tổng hợp audio cảnh ${i + 1}/${script.scenes.length}: "${scene.title || scene.id}"...`);
            const results = await googleTTS.getAllAudioBase64(scene.narration, {
              lang: 'vi',
              slow: false,
              host: 'https://translate.google.com',
              timeout: 10000,
            });
            const audioBuffer = Buffer.concat(results.map(r => Buffer.from(r.base64, 'base64')));
            
            // Lưu file MP3 vào thư mục renders
            const audioFileName = `tts_${job.jobId}_scene_${scene.id || i}.mp3`;
            const audioFilePath = path.resolve(RENDERS_DIR, audioFileName);
            fs.writeFileSync(audioFilePath, audioBuffer);
            
            // Gán data URL để Remotion load trực tiếp với độ tin cậy tuyệt đối
            scene.narrationAudioUrl = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;

            // Tự động tính toán chính xác độ dài file âm thanh (Audio-Driven Auto-Duration Sync)
            const durationMs = getMP3Duration(audioBuffer);
            const speechSeconds = durationMs > 0 ? (durationMs / 1000) : (wordCount / 2.5);
            // Nghỉ nhẹ 0.6s sau khi dứt lời để chuyển cảnh tự nhiên, không ngắt cụt
            const targetSeconds = Math.max(2.5, speechSeconds + 0.6);
            const fps = job.fps || 30;
            const syncedFrames = Math.round(targetSeconds * fps);
            scene.durationInFrames = syncedFrames;

            console.log(`[RenderWorker] Cảnh ${i + 1} (${scene.title || scene.id}): Lời thoại đọc ${speechSeconds.toFixed(2)}s -> Khớp chính xác thời lượng Scene: ${syncedFrames} frames (~${targetSeconds.toFixed(1)}s)`);
          } catch (ttsErr) {
            console.warn(`[RenderWorker] Cảnh báo lỗi TTS cảnh ${i + 1}:`, ttsErr.message);
          }
        } else if (scene.narrationAudioUrl && scene.narrationAudioUrl.startsWith('data:audio/')) {
          try {
            const b64 = scene.narrationAudioUrl.split(',')[1];
            const audioBuffer = Buffer.from(b64, 'base64');
            const durationMs = getMP3Duration(audioBuffer);
            if (durationMs > 0) {
              const speechSeconds = durationMs / 1000;
              const targetSeconds = Math.max(2.5, speechSeconds + 0.6);
              const fps = job.fps || 30;
              scene.durationInFrames = Math.round(targetSeconds * fps);
              console.log(`[RenderWorker] Cảnh ${i + 1} (audio có sẵn): Lời đọc ${speechSeconds.toFixed(2)}s -> Khớp thời lượng Scene: ${scene.durationInFrames} frames (~${targetSeconds.toFixed(1)}s)`);
            }
          } catch (e) {
            console.warn(`[RenderWorker] Không thể đo audio có sẵn của cảnh ${i + 1}:`, e.message);
          }
        }
      }

      // Cập nhật lại tổng thời lượng totalDurationSeconds của toàn bộ kịch bản
      const totalFrames = script.scenes.reduce((sum, s) => sum + (s.durationInFrames || 150), 0);
      script.totalDurationSeconds = Math.round(totalFrames / (job.fps || 30));
      console.log(`[RenderWorker] Tổng thời lượng video đã đồng bộ hoàn hảo: ${script.totalDurationSeconds}s (${totalFrames} frames)`);
    }

    console.log(`[RenderWorker] Lựa chọn Composition: ${job.composition || 'FullSTEMVideo'}`);
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: job.composition || 'FullSTEMVideo',
      inputProps: job.inputProps || {},
    });

    let lastReportTime = 0;
    console.log(`[RenderWorker] Bắt đầu render video sang MP4 (Codec H.264)...`);

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: job.inputProps || {},
      onProgress: async ({ progress }) => {
        const percent = Math.round(progress * 100);
        const now = Date.now();
        jobStatuses.set(job.jobId, {
          jobId: job.jobId,
          status: 'RENDERING',
          progress: percent,
          stage: `Đang kết xuất khung hình (${percent}%)...`,
          videoUrl: null,
          errorMessage: null,
        });
        if (now - lastReportTime > 2500 || percent === 100) {
          lastReportTime = now;
          console.log(`[RenderWorker] Tiến độ render [${job.jobId}]: ${percent}%`);
          await sendCallback(job.callbackUrl, {
            jobId: job.jobId,
            status: 'RENDERING',
            progress: percent,
            stage: `Đang kết xuất khung hình (${percent}%)...`,
            videoUrl: null,
            errorMessage: null,
          });
        }
      },
    });

    console.log(`[RenderWorker] Render thành công! File xuất tại: ${outputPath}`);
    jobStatuses.set(job.jobId, {
      jobId: job.jobId,
      status: 'COMPLETED',
      progress: 100,
      stage: 'Hoàn tất đóng gói video MP4 1080p!',
      videoUrl: publicVideoUrl,
      errorMessage: null,
    });
    await sendCallback(job.callbackUrl, {
      jobId: job.jobId,
      status: 'COMPLETED',
      progress: 100,
      stage: 'Hoàn tất đóng gói video MP4 1080p!',
      videoUrl: publicVideoUrl,
      errorMessage: null,
    });

  } catch (error) {
    console.error(`[RenderWorker] Thất bại khi render Job ${job.jobId}:`, error);
    jobStatuses.set(job.jobId, {
      jobId: job.jobId,
      status: 'FAILED',
      progress: 0,
      stage: 'Lỗi render video',
      videoUrl: null,
      errorMessage: error.message || 'Unknown render error',
    });
    await sendCallback(job.callbackUrl, {
      jobId: job.jobId,
      status: 'FAILED',
      progress: 0,
      stage: 'Lỗi render video',
      videoUrl: null,
      errorMessage: error.message || 'Unknown render error',
    });
  } finally {
    isRendering = false;
    // Xử lý job tiếp theo nếu có
    setImmediate(processQueue);
  }
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Health check
  if (req.method === 'GET' && pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP', isRendering, queueLength: renderQueue.length }));
    return;
  }

  // Tải và phát file video MP4 (hỗ trợ cả GET, HEAD và Range streaming)
  if ((req.method === 'GET' || req.method === 'HEAD') && pathname.startsWith('/videos/')) {
    const filename = path.basename(pathname);
    const filePath = path.resolve(RENDERS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Video not found' }));
      return;
    }

    const stat = fs.statSync(filePath);
    const totalSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length, Content-Disposition',
      });

      if (req.method === 'HEAD') {
        res.end();
      } else {
        fs.createReadStream(filePath, { start, end }).pipe(res);
      }
    } else {
      const isDownload = parsedUrl.searchParams.get('download') === '1';
      const customFileName = parsedUrl.searchParams.get('filename') || filename;
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length',
        'Content-Disposition': isDownload
          ? `attachment; filename="${encodeURIComponent(customFileName)}"`
          : `inline; filename="${filename}"`,
      });

      if (req.method === 'HEAD') {
        res.end();
      } else {
        fs.createReadStream(filePath).pipe(res);
      }
    }
    return;
  }

  // Tải và phát file audio MP3 (hỗ trợ nghe voiceover)
  if ((req.method === 'GET' || req.method === 'HEAD') && pathname.startsWith('/audio/')) {
    const filename = path.basename(pathname);
    const filePath = path.resolve(RENDERS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Audio file not found' }));
      return;
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
    });

    if (req.method === 'HEAD') {
      res.end();
    } else {
      fs.createReadStream(filePath).pipe(res);
    }
    return;
  }

  // Nghe thử giọng đọc AI TTS: GET /tts-preview?text=... (hỗ trợ cache đĩa & range streaming cho Remotion Player)
  if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/tts-preview') {
    const text = (parsedUrl.searchParams.get('text') || '').trim();
    if (!text) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing text parameter' }));
      return;
    }

    (async () => {
      try {
        const hash = crypto.createHash('md5').update(text).digest('hex');
        const cachedFilePath = path.resolve(RENDERS_DIR, `tts_cache_${hash}.mp3`);

        if (!fs.existsSync(cachedFilePath)) {
          const results = await googleTTS.getAllAudioBase64(text, {
            lang: 'vi',
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
          });
          const buffer = Buffer.concat(results.map(r => Buffer.from(r.base64, 'base64')));
          fs.writeFileSync(cachedFilePath, buffer);
        }

        const stat = fs.statSync(cachedFilePath);
        const totalSize = stat.size;
        const range = req.headers.range;

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Range, Accept-Ranges');
        res.setHeader('Cache-Control', 'public, max-age=86400');

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
          const chunksize = (end - start) + 1;

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Content-Length': chunksize,
          });

          if (req.method === 'HEAD') {
            res.end();
          } else {
            fs.createReadStream(cachedFilePath, { start, end }).pipe(res);
          }
        } else {
          res.writeHead(200, {
            'Content-Length': totalSize,
          });

          if (req.method === 'HEAD') {
            res.end();
          } else {
            fs.createReadStream(cachedFilePath).pipe(res);
          }
        }
      } catch (err) {
        console.warn('[TTS Preview Error]:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    })();
    return;
  }

  // Đồng bộ nhanh thời lượng script theo AI TTS: POST /sync-durations
  if (req.method === 'POST' && pathname === '/sync-durations') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const script = payload.script;
        const fps = payload.fps || 30;
        if (!script || !Array.isArray(script.scenes)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing or invalid script.scenes' }));
          return;
        }

        for (let i = 0; i < script.scenes.length; i++) {
          const sc = script.scenes[i];
          if (sc.narration && sc.narration.trim()) {
            try {
              const results = await googleTTS.getAllAudioBase64(sc.narration, {
                lang: 'vi',
                slow: false,
                host: 'https://translate.google.com',
                timeout: 8000,
              });
              const buf = Buffer.concat(results.map(r => Buffer.from(r.base64, 'base64')));
              const durationMs = getMP3Duration(buf);
              const speechSec = durationMs > 0 ? (durationMs / 1000) : (sc.narration.trim().split(/\s+/).length / 2.5);
              const targetSec = Math.max(2.5, speechSec + 0.6);
              sc.durationInFrames = Math.round(targetSec * fps);
            } catch (err) {
              const words = sc.narration.trim().split(/\s+/).length;
              const estSec = Math.max(2.5, Math.ceil(words / 2.3) + 0.6);
              sc.durationInFrames = Math.round(estSec * fps);
            }
          }
        }

        const totalFrames = script.scenes.reduce((sum, s) => sum + (s.durationInFrames || 150), 0);
        script.totalDurationSeconds = Math.round(totalFrames / fps);

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ script, success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Kiểm tra tiến độ Render (dành cho Client / FE polling)
  if (req.method === 'GET' && pathname.startsWith('/render-status/')) {
    const jobId = pathname.replace('/render-status/', '').trim();
    const statusObj = jobStatuses.get(jobId);
    if (!statusObj) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Job not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(statusObj));
    return;
  }

  // Tiếp nhận yêu cầu render từ BE hoặc FE
  if (req.method === 'POST' && pathname === '/render') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const jobId = payload.jobId || `job_${Date.now()}`;

        jobStatuses.set(jobId, {
          jobId,
          status: 'QUEUED',
          progress: 0,
          stage: 'Đang xếp hàng trong hàng đợi render...',
          videoUrl: null,
          errorMessage: null,
        });

        renderQueue.push({
          jobId,
          composition: payload.composition || 'FullSTEMVideo',
          inputProps: payload.inputProps || {},
          width: payload.width || 1920,
          height: payload.height || 1080,
          fps: payload.fps || 30,
          ttsVoice: payload.ttsVoice || 'banmai',
          callbackUrl: payload.callbackUrl || null,
        });

        console.log(`[Server] Đã nhận yêu cầu Render Job [${jobId}], vị trí trong hàng đợi: ${renderQueue.length}`);

        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          jobId,
          status: 'QUEUED',
          message: 'Job đã được xếp hàng xử lý.',
        }));

        processQueue();
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`
======================================================
  STEMotion Remotion Render Service đang chạy!
  - Cổng: ${PORT}
  - URL Health: http://localhost:${PORT}/health
  - Endpoint render: POST http://localhost:${PORT}/render
  - Thư mục xuất video: ${RENDERS_DIR}
======================================================
  `);
});
