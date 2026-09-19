# TÀI LIỆU BÀN GIAO FRONT-END & ĐẶC TẢ TÍCH HỢP BACKEND (FE HANDOVER & API SPECIFICATION)

> **Dành cho**: Developer / AI Agent phụ trách phát triển Backend cho dự án **STEMotion**.  
> **Mục tiêu**: Cung cấp toàn bộ ngữ cảnh kỹ thuật, kiến trúc Front-End, Data Models (TypeScript Interfaces), và danh sách các REST API Endpoints cần triển khai để kết nối hoàn chỉnh với Front-End.

---

## 1. TỔNG QUAN HỆ THỐNG & FRONT-END ĐÃ HOÀN THIỆN

Front-End của dự án STEMotion nằm tại thư mục: **`STEMotion_FE`**
- **Tech Stack**: React 18 + Vite + Tailwind CSS + Lucide Icons + KaTeX.
- **Engine chuyển động Video**: **Remotion 4.0** (`remotion`, `@remotion/player`).
- **Kiến trúc giao diện**: Đã xây dựng hoàn chỉnh giao diện đa vai trò (RBAC) và các modal theo đúng bản thiết kế:
  1. **Writer Studio**: Soạn thảo kịch bản, gọi AI Script Intelligence (Phân cảnh, Chấm độ khó, Trích xuất khái niệm, Bắt lỗi thuật ngữ).
  2. **Reviewer QA**: Thẩm định học thuật 2 cấp: (1) Duyệt kịch bản văn bản; (2) Kiểm duyệt video MP4 ghim góp ý theo mốc thời gian (Timestamped pins).
  3. **Producer Studio (Trọng tâm)**: Canvas Remotion Player xem trước video 1080p60, tinh chỉnh tham số 5-7 phân cảnh trực quan, điều khiển kết xuất Render Job qua BullMQ Queue.
  4. **Multi-Workspace & Admin**: Quản lý tổ bộ môn, mời giáo viên bằng email, phân quyền, lấy mã nhúng LMS (Canvas, Moodle, iFrame).

---

## 2. DATA SCHEMAS & TYPESCRIPT INTERFACES (DATA CONTRACT)

Tất cả các kiểu dữ liệu của Front-End được định nghĩa chuẩn tại:  
📁 [`src/types/stem.ts`](file:///d:/capstone/STEMotion_FE/src/types/stem.ts)

Backend cần tuân thủ cấu trúc JSON sau để đảm bảo FE parse dữ liệu không bị lỗi:

### 2.1. Cấu trúc Kịch bản Tổng thể (`STEMScript`)
```typescript
export type STEMSubject = 'Math' | 'Physics' | 'Chemistry' | 'Biology' | 'ComputerScience';

export interface STEMScript {
  id: string;                         // Ví dụ: "SCR-MATH9-001"
  title: string;                      // Tên bài giảng: "Định lý Vi-ét và Ứng dụng giải toán"
  subject: STEMSubject;               // "Math" | "Physics" | "Chemistry" | "Biology" | "ComputerScience"
  gradeLevel: string;                 // "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12"
  totalDurationSeconds: number;       // Thời lượng tổng (giây), ví dụ: 85
  scriptStatus: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'CHANGE_REQUESTED';
  videoStatus: 'NOT_RENDERED' | 'RENDERING' | 'IN_QA' | 'APPROVED' | 'PUBLISHED';
  fps: number;                        // 30 hoặc 60
  scenes: SceneData[];                // Danh sách các phân cảnh STEM
  createdAt: string;
}
```

### 2.2. Cấu trúc 7 Dạng Phân Cảnh STEM (`SceneData`)
Mỗi phân cảnh trong kịch bản kế thừa từ `SceneBase` và thuộc 1 trong 7 kiểu sau:

```typescript
export interface SceneBase {
  id: string;                         // "scene_1", "scene_2",...
  type: SceneType;                    // Kiểu phân cảnh
  title: string;                      // Tiêu đề hiển thị trong video
  narration: string;                  // Lời thoại thuyết minh (Audio TTS đọc)
  durationInFrames: number;           // Số frames (30 frames = 1 giây)
}

// 1. Scene Tiêu đề Mở màn
export interface TitleHeroProps extends SceneBase {
  type: 'TITLE_HERO';
  subtitle: string;
  subject: STEMSubject;
  gradeLevel: string;
  badgeText: string;
}

// 2. Scene Công thức Toán/Lý (KaTeX)
export interface MathFormulaProps extends SceneBase {
  type: 'MATH_FORMULA';
  latex: string;                      // Mã LaTeX: "x_1 + x_2 = -\\frac{b}{a}"
  steps: {
    label: string;
    latexSnippet: string;
    explanation: string;
  }[];
}

// 3. Scene Sơ đồ / Hình giải phẫu khoa học
export interface DiagramExplainerProps extends SceneBase {
  type: 'DIAGRAM_EXPLAINER';
  diagramTitle: string;
  labels: {
    name: string;
    description: string;
    xPercent: number;
    yPercent: number;
  }[];
}

// 4. Scene Biểu đồ Dữ liệu Động
export interface DataChartProps extends SceneBase {
  type: 'DATA_CHART';
  chartType: 'bar' | 'line';
  xAxisLabel: string;
  yAxisLabel: string;
  dataPoints: {
    label: string;
    value: number;
    color?: string;
  }[];
}

// 5. Scene Mô phỏng Thuật toán Tin học
export interface AlgorithmWalkthroughProps extends SceneBase {
  type: 'ALGORITHM_WALKTHROUGH';
  language: string;                   // "python", "cpp", "javascript"
  codeSnippet: string;
  steps: {
    lineHighlight: number;
    variableState: string;
    note: string;
  }[];
}

// 6. Scene Câu hỏi Trắc nghiệm Phản xạ
export interface STEMQuizProps extends SceneBase {
  type: 'STEM_QUIZ';
  question: string;
  options: string[];                  // Mảng 4 đáp án [A, B, C, D]
  correctIndex: number;               // 0, 1, 2, 3
  hint: string;
  explanation: string;
}

// 7. Scene Tổng kết & Gợi ý bài học
export interface OutroProps extends SceneBase {
  type: 'OUTRO';
  summaryPoints: string[];
  nextLessonSuggestion: string;
  instructorName: string;
}
```

### 2.3. Cấu trúc Góp ý Phản biện theo Thời gian (`FeedbackComment`)
```typescript
export interface FeedbackComment {
  id: string;
  author: string;                     // "GS. Lê Hoàng Nam (Reviewer)"
  avatar: string;
  role: 'Writer' | 'Reviewer' | 'Producer' | 'Admin';
  timestampSec: number;               // Ví dụ: 15.5 (giây thứ 15.5 trong video)
  sceneId?: string;
  content: string;                    // Nội dung góp ý
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
}
```

---

## 3. DANH SÁCH REST API ENDPOINTS CẦN TRIỂN KHAI PHÍA BACKEND

Backend cần xây dựng máy chủ (khuyến nghị **Node.js/Express/Fastify** hoặc **Python FastAPI**) cung cấp các endpoints sau:

### 3.1. Module AI Script Intelligence
Sử dụng **Google Gemini 1.5 Flash API** (hoặc OpenAI GPT-4o-mini):

* **`POST /api/ai/script/generate`**
  - **Request Body**:
    ```json
    {
      "topic": "Con lắc đơn và dao động điều hòa",
      "subject": "Physics",
      "gradeLevel": "Lớp 11",
      "targetDurationSec": 90
    }
    ```
  - **Response**: Trả về đúng JSON Object theo cấu trúc `STEMScript` với mảng `scenes` gồm 5 - 7 phân cảnh hợp lệ.

* **`POST /api/ai/script/action`**
  - **Mục đích**: Thực thi 4 tác vụ AI on-demand theo yêu cầu đề bài:
    1. `"resegment"`: Phân cảnh tự động lại thời lượng và số scene.
    2. `"grade"`: Đánh giá chỉ số Readability (độ khó đọc) theo khối lớp.
    3. `"extract"`: Trích xuất các STEM Concept tags chính.
    4. `"terms"`: Quét và bắt lỗi không nhất quán về thuật ngữ khoa học.
  - **Request Body**:
    ```json
    {
      "action": "resegment" | "grade" | "extract" | "terms",
      "scriptText": "string...",
      "subject": "Math",
      "gradeLevel": "Lớp 9"
    }
    ```

---

### 3.2. Module Kịch bản & Dự án (Script Projects CRUD)

* **`GET /api/workspaces/:workspaceId/scripts`**: Lấy danh sách kịch bản trong nhóm làm việc.
* **`POST /api/workspaces/:workspaceId/scripts`**: Tạo mới kịch bản.
* **`GET /api/scripts/:id`**: Xem chi tiết kịch bản và các scenes.
* **`PUT /api/scripts/:id`**: Lưu nháp / Cập nhật nội dung phân cảnh.
* **`POST /api/scripts/:id/submit-review`**: Writer nộp kịch bản xin phê duyệt (`scriptStatus` -> `IN_REVIEW`).
* **`POST /api/scripts/:id/approve`**: Reviewer duyệt kịch bản (`scriptStatus` -> `APPROVED`).
* **`POST /api/scripts/:id/request-changes`**: Reviewer yêu cầu chỉnh sửa kèm nhận xét (`scriptStatus` -> `CHANGE_REQUESTED`).

---

### 3.3. Module Render Video Remotion (Render Pipeline & BullMQ)

* **`POST /api/render/start`**
  - **Mục đích**: Nhận yêu cầu kết xuất video từ Producer, đẩy Job vào hàng đợi BullMQ / Redis.
  - **Request Body**:
    ```json
    {
      "scriptId": "SCR-MATH9-001",
      "resolution": "1080p", // "1080p" | "720p" | "4k"
      "fps": 30, // 30 hoặc 60
      "ttsVoice": "banmai" // FPT.AI hoặc Edge TTS
    }
    ```
  - **Response**:
    ```json
    {
      "jobId": "BULL-RENDER-9812",
      "status": "QUEUED",
      "estimatedSeconds": 45
    }
    ```

* **`GET /api/render/status/:jobId`**
  - **Mục đích**: Front-End polling để cập nhật thanh tiến trình % kết xuất.
  - **Response**:
    ```json
    {
      "jobId": "BULL-RENDER-9812",
      "status": "PROCESSING", // "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"
      "progress": 65, // Phần trăm hoàn thành (0 - 100)
      "stage": "Đang ghép âm thanh và phụ đề Karaoke...",
      "videoUrl": null // Hoặc URL file video .mp4 khi status = "COMPLETED"
    }
    ```

---

### 3.4. Module Video QA & Timestamp Annotations

* **`GET /api/scripts/:id/qa-comments`**: Lấy danh sách các ghi chú thời gian của video.
* **`POST /api/scripts/:id/qa-comments`**: Reviewer ghim bình luận tại giây cụ thể:
  ```json
  {
    "timestampSec": 15.5,
    "content": "Cần tăng kích thước font công thức Vi-ét",
    "tag": "Đồ họa"
  }
  ```
* **`PUT /api/qa-comments/:commentId/resolve`**: Đánh dấu đã sửa xong nhận xét.
* **`POST /api/scripts/:id/approve-video`**: Phê duyệt chất lượng video hoàn chỉnh (`videoStatus` -> `APPROVED`).

---

### 3.5. Module Xuất Bản LMS & YouTube

* **`POST /api/scripts/:id/publish`**
  - **Request Body**:
    ```json
    {
      "targets": ["LMS", "YOUTUBE"],
      "title": "Định lý Vi-ét và Ứng dụng giải toán",
      "description": "Video bài giảng STEM Toán 9..."
    }
    ```
  - **Response**:
    ```json
    {
      "lmsEmbedCode": "<iframe src=\"https://stemotion.edu.vn/embed/SCR-MATH9-001\" width=\"100%\" height=\"540\" frameborder=\"0\" allowfullscreen></iframe>",
      "youtubeUrl": "https://youtube.com/watch?v=mock_stem_id"
    }
    ```

---

## 4. HƯỚNG DẪN DÀNH CHO AI CỦA TEAMMATE KHI BẮT ĐẦU CODE BACKEND

Khi AI của teammate bắt đầu làm Backend, teammate hãy dán lời nhắc (Prompt) sau vào AI của họ:

> **System Prompt gợi ý cho AI Backend**:
> *"Bạn là Backend AI Engineer cho dự án STEMotion. Bạn hãy đọc kỹ file `API_SPEC_AND_FE_HANDOVER.md` nằm tại thư mục gốc để nắm rõ toàn bộ Data Schemas và danh sách REST API Endpoints mà Front-End (`STEMotion_FE`) đang yêu cầu. Hãy sử dụng Node.js (Express/NestJS) hoặc Python (FastAPI), tích hợp Google Gemini API (`@google/genai`) cho phần AI Script, và dùng `@remotion/renderer` để thực thi tác vụ kết xuất video MP4. Đảm bảo trả về đúng các trường JSON mà FE đã quy định."*

---

*Tài liệu được sinh tự động bởi Antigravity AI Assistant cho dự án STEMotion Capstone.*
