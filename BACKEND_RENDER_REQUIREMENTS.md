# YÊU CẦU TRIỂN KHAI BACKEND RENDER SERVICE (DÀNH CHO AI TEAMMATE)

> **Dự án**: STEMotion (Nền tảng sản xuất video bài giảng STEM GDPT 2018 bằng Remotion)  
> **Người giao việc**: Frontend Lead  
> **Đối tượng tiếp nhận**: Backend Developer / AI Agent của Teammate phụ trách Backend  
> **Mục tiêu cấp bách**: Xây dựng **Dịch Vụ Kết Xuất Video Remotion Động (Dynamic Video Rendering Service)** để khi người dùng tạo/sửa bất kỳ bài học nào trên FE, hệ thống sẽ render ra đúng file MP4 thật của bài học đó (thay vì tải file mẫu tĩnh như hiện tại).

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT (THE PROBLEM)

1. **Hiện trạng trên Frontend**:
   - Giáo viên có thể tạo đề tài mới (Toán, Lý, Hóa, Sinh, Tin), biên soạn kịch bản, chỉnh sửa trực tiếp kiểu Canva, đổi cỡ chữ, công thức KaTeX.
   - Trình phát Remotion Player trên Web hiển thị thời gian thực (real-time preview) rất mượt.
   - **Tuy nhiên**, khi bấm *"Tải Video MP4 Về Máy"* sau khi Duyệt kịch bản, FE hiện đang trỏ về file tĩnh `/sample_stem_video.mp4` (bản mẫu Con Lắc Đơn).
   - Người dùng tạo bài mới về Hóa học hay Sinh học nhưng khi tải về vẫn ra video bài Vật lý cũ.

2. **Nhiệm vụ của Backend**:
   - Nhận toàn bộ đối tượng kịch bản `STEMScript` từ Frontend gửi sang.
   - Đưa job vào hàng đợi xử lý nền (Queue).
   - Gọi Remotion Engine (`@remotion/renderer`) để render đúng từng cảnh, từng chữ, từng công thức KaTeX thành file `.mp4` 1080p chuẩn.
   - Trả về đường link tải file video mới toanh cho giáo viên.

---

## 2. NHỮNG LỖI KỸ THUẬT QUAN TRỌNG ĐÃ ĐƯỢC FE FIX (BẮT BUỘC BE PHẢI ÁP DỤNG ĐỂ KHÔNG BỊ LỖI)

Đội FE đã kiểm tra và tìm ra 2 lỗi nghiêm trọng khi render Remotion ngoại tuyến, AI Backend **bắt buộc phải cấu hình đúng**:

### ⚠️ Lưu ý 1: Bắt buộc cấu hình `@remotion/tailwind`
- **Hiện tượng lỗi**: Nếu không cấu hình, tiêu đề sử dụng class `text-transparent bg-clip-text bg-gradient-to-r` sẽ biến thành vô hình, màn hình video bị đen xì ("ko có gì hết").
- **Cách Backend phải làm**:
  - Cài đặt: `npm install -D @remotion/tailwind`
  - Tạo file `remotion.config.ts`:
    ```typescript
    import { Config } from '@remotion/cli/config';
    import { enableTailwind } from '@remotion/tailwind';

    Config.overrideWebpackConfig((currentConfiguration) => {
      return enableTailwind(currentConfiguration);
    });
    ```

### ⚠️ Lưu ý 2: Bắt buộc nạp KaTeX CSS và đặt `output: 'html'`
- **Hiện tượng lỗi**: Nếu thiếu CSS KaTeX, KaTeX sẽ in cả MathML thô (chữ bị nhân đôi `T = 2\pi gl`) và dấu căn bậc 2 bị kéo dài ngoằng khắp màn hình.
- **Cách Backend phải làm**:
  - Cài đặt `katex`: `npm install katex`
  - Trong entry file render của Remotion, phải import:
    ```typescript
    import 'katex/dist/katex.min.css';
    import './index.css';
    ```
  - Trong các hàm render công thức toán `katex.renderToString`, phải đặt:
    ```typescript
    katex.renderToString(tex, {
      displayMode: true,
      throwOnError: false,
      output: 'html', // BẮT BUỘC 'html' để triệt tiêu MathML thô bị trùng chữ
    })
    ```

---

## 3. ĐẶC TẢ API CHI TIẾT CẦN CODE NGAY (API SPECIFICATION)

Tiền tố chung: `/api/v1`

### 3.1. Kích hoạt Render Job (`POST /api/v1/renders`)
* **Endpoint**: `POST /api/v1/renders`
* **Mục đích**: FE gửi yêu cầu render khi Producer bấm "Kết Xuất Video" hoặc Reviewer bấm "Duyệt & Xuất Bản".
* **Request Body**:
```json
{
  "projectId": "proj_pendulum_physics_11",
  "resolution": "1080p", // "1080p" | "720p"
  "fps": 60, // 30 | 60
  "script": {
    "id": "proj_pendulum_physics_11",
    "title": "Cân bằng phản ứng Oxi hóa khử",
    "subject": "Chemistry",
    "gradeLevel": "Lớp 10",
    "totalDurationSeconds": 45,
    "fps": 30,
    "scenes": [
      {
        "id": "scene_1",
        "type": "TITLE_HERO",
        "title": "Cân bằng phản ứng Oxi hóa khử",
        "subtitle": "Phương pháp thăng bằng electron",
        "subject": "Chemistry",
        "gradeLevel": "Lớp 10",
        "durationInFrames": 150
      },
      {
        "id": "scene_2",
        "type": "CHEMICAL_REACTION",
        "title": "Phản ứng giữa Fe và H2SO4 đặc nóng",
        "equation": "2Fe + 6H_2SO_4 \\xrightarrow{t^\\circ} Fe_2(SO_4)_3 + 3SO_2\\uparrow + 6H_2O",
        "reactants": "Sắt (Fe) + Axit Sunfuric (H2SO4)",
        "products": "Muối sắt (III) + Khí SO2 + H2O",
        "condition": "Đun nóng",
        "observation": "Sắt tan dần, dung dịch hóa nâu vàng, có khí mùi hắc thoát ra.",
        "durationInFrames": 240
      }
    ]
  }
}
```

* **Response (Status 202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "renderId": "rnd_job_98421",
    "projectId": "proj_pendulum_physics_11",
    "status": "QUEUED",
    "progressPercentage": 0,
    "estimatedTimeSec": 35,
    "createdAt": "2026-09-20T14:50:00Z"
  },
  "meta": { "timestamp": "2026-09-20T14:50:00Z" }
}
```

---

### 3.2. Polling Tiến Độ Render (`GET /api/v1/renders/:renderId`)
* **Endpoint**: `GET /api/v1/renders/:renderId`
* **Mục đích**: FE gọi định kỳ 2-3s một lần để cập nhật thanh % loading trên giao diện.
* **Response (Khi đang render)**:
```json
{
  "success": true,
  "data": {
    "renderId": "rnd_job_98421",
    "status": "RENDERING", // "QUEUED" | "RENDERING" | "COMPLETED" | "FAILED"
    "progressPercentage": 65,
    "stage": "Remotion: Rendering KaTeX SVG frames (682/1050)...",
    "outputUrl": null,
    "errorMessage": null
  }
}
```

* **Response (Khi hoàn tất)**:
```json
{
  "success": true,
  "data": {
    "renderId": "rnd_job_98421",
    "status": "COMPLETED",
    "progressPercentage": 100,
    "stage": "Hoàn tất đóng gói MP4 1080p!",
    "outputUrl": "http://localhost:8000/api/v1/renders/rnd_job_98421/download",
    "fileSizeBytes": 3670016,
    "durationSeconds": 35,
    "completedAt": "2026-09-20T14:51:12Z"
  }
}
```

---

### 3.3. Tải File Video MP4 Về Máy (`GET /api/v1/renders/:renderId/download`)
* **Endpoint**: `GET /api/v1/renders/:renderId/download`
* **Mục đích**: Khi FE bấm "Tải Video MP4", trình duyệt mở link này để tải file trực tiếp.
* **Headers Response trả về**:
  ```http
  Content-Type: video/mp4
  Content-Disposition: attachment; filename="can_bang_phan_ung_oxi_hoa_khu_1080p_60fps.mp4"
  Content-Length: [dung lượng byte]
  ```

---

## 4. KIẾN TRÚC THỰC THI GỢI Ý CHO BACKEND (IMPLEMENTATION GUIDE)

Backend có thể sử dụng **Node.js (Express hoặc NestJS) + TypeScript**:

```mermaid
flowchart LR
    FE[FE: Client Browser] -->|POST /api/v1/renders| API[Express/NestJS API]
    API -->|Push Job| Queue[Redis + BullMQ Queue]
    Queue -->|Process| Worker[Remotion Render Worker]
    Worker -->|bundle & renderMedia| Remotion[@remotion/renderer]
    Remotion -->|Save MP4| Storage[Local /dist/renders hoặc S3]
    FE -->|Polling GET /renders/:id| API
    FE -->|Download MP4| Storage
```

### Code mẫu Worker thực thi (`renderWorker.ts`):
```typescript
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';

export async function processRenderJob(scriptData: any, outputPath: string, onProgress: (p: number) => void) {
  // 1. Bundle Remotion với Webpack + Tailwind đã config
  const bundleLocation = await bundle({
    entryPoint: path.resolve('./src/remotion/index.ts'),
    webpackOverride: (config) => {
      // enableTailwind override
      return config;
    },
  });

  // 2. Lấy composition FullSTEMVideo
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'FullSTEMVideo',
    inputProps: {
      script: scriptData,
    },
  });

  // 3. Render ra file MP4 Full HD
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: {
      script: scriptData,
    },
    onProgress: ({ progress }) => {
      onProgress(Math.round(progress * 100));
    },
  });

  return outputPath;
}
```

---

## 5. PROMPT DÀNH RIÊNG ĐỂ GỬI CHO AI CỦA TEAMMATE

Hãy copy nguyên văn đoạn dưới đây gửi cho AI của đồng đội:

````markdown
Bạn là Backend AI Engineer cho dự án STEMotion.
Phân hệ Frontend (React + Remotion) đã hoàn thiện 100% giao diện và kịch bản.
Hiện tại có một vấn đề cần bạn giải quyết ngay:
"Khi người dùng tạo kịch bản mới trên FE, hệ thống cần render ra đúng video MP4 của bài học đó chứ không dùng file tĩnh mẫu nữa."

Nhiệm vụ của bạn:
1. Đọc file `BACKEND_RENDER_REQUIREMENTS_FOR_AI.md` nằm ở thư mục gốc của repo.
2. Viết module Render Service trong Backend:
   - `POST /api/v1/renders`: Nhận payload `STEMScript` từ FE, tạo job render.
   - `GET /api/v1/renders/:renderId`: Trả về tiến độ % (0 -> 100) và link tải file khi xong.
   - `GET /api/v1/renders/:renderId/download`: Stream file MP4 đã render cho giáo viên tải về máy.
3. Sử dụng thư viện `@remotion/renderer` và `@remotion/bundler`.
4. BẮT BUỘC tuân thủ 2 lưu ý kỹ thuật:
   - Cài đặt `@remotion/tailwind` và file `remotion.config.ts` để không bị đen màn hình chữ gradient.
   - Cài đặt `katex/dist/katex.min.css` và đặt `output: 'html'` trong renderToString để công thức toán không bị vỡ và không bị trùng chữ.
5. Kiểm tra test thử render 1 script động và trả về file MP4 chạy mượt mà trên Windows Media Player.
````
