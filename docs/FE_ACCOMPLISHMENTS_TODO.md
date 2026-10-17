# 📋 TÀI LIỆU TỔNG KẾT TÍNH NĂNG, KIẾN TRÚC PHÂN TẦNG VÀ HỆ THỐNG XỬ LÝ LỖI FRONTEND (STEMOTION FE)

> **Cập nhật ngày:** 17/10/2026  
> **Dự án:** STEMotion Front-End (`STEMotion_FE`)  
> **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Remotion, Lucide Icons, KaTeX (LaTeX).

---

## 📑 MỤC LỤC
1. [Tổng Quan Tiến Độ & Tính Năng Đã Hoàn Thành](#1-tổng-quan-tiến-độ--tính-năng-đã-hoàn-thành)
2. [Kiến Trúc Phân Tầng Hệ Thống (Architecture Layers)](#2-kiến-trúc-phân-tầng-hệ-thống-architecture-layers)
3. [Tách Chi Tiết Tầng Dịch Vụ & Danh Mục API Endpoints](#3-tách-chi-tiết-tầng-dịch-vụ--danh-mục-api-endpoints)
4. [Đặc Tả Hệ Thống Báo Lỗi & Xử Lý Ngoại Lệ (Error Logs & Handling)](#4-đặc-tả-hệ-thống-báo-lỗi--xử-lý-ngoại-lệ-error-logs--handling)
5. [Đặc Tả Chi Tiết Những Gì Chưa Làm Được / Còn Thiếu (Missing & Incomplete Features)](#5-đặc-tả-chi-tiết-những-gì-chưa-làm-được--còn-thiếu-missing--incomplete-features)
6. [Ma Trận Đánh Giá Mức Độ Hoàn Thiện Của Từng Module](#6-ma-trận-đánh-giá-mức-độ-hoàn-thiện-của-từng-module)
7. [Danh Sách TODO & Kế Hoạch Nâng Cấp Ưu Tiên](#7-danh-sách-todo--kế-hoạch-nâng-cấp-ưu-tiên)

---

## 1. TỔNG QUAN TIẾN ĐỘ & TÍNH NĂNG ĐÃ HOÀN THÀNH

Frontend của STEMotion được thiết kế như một **SaaS Studio hoàn chỉnh** phục vụ quy trình sản xuất video giáo dục STEM tinh gọn (Creative Production Pipeline), gồm các module chính:

### 1.1. Xác Thực & Phân Quyền Đa Vai Trò (Authentication & RBAC)
- [x] **Đăng nhập bằng Email/Password**: Tích hợp mã hóa JWT, lưu trữ token an toàn và tự động làm mới phiên làm việc.
- [x] **Google Sign-In (OAuth 2.0 / GSI)**: Đăng nhập an toàn một chạm cho các tài khoản đã được cấp phép.
- [x] **Bắt buộc đổi mật khẩu lần đầu (First-login Password Change)**: Modal chặn tự động khi nhận cờ `mustChangePassword: true` từ BE.
- [x] **Chuyển đổi vai trò người dùng (Multi-Role Switching)**:
  - `Admin`: Toàn quyền quản trị tài khoản, template mẫu và hạ tầng render/chi phí AI.
  - `Writer`: Soạn kịch bản, quản lý phân cảnh, gợi ý AI.
  - `Reviewer`: Thẩm định sư phạm, phê duyệt/yêu cầu sửa kịch bản.
  - `Producer`: Dựng video trên Remotion canvas, tinh chỉnh animation/audio, render.
  - `Library`: Truy cập kho học liệu, video thành phẩm và mã nhúng iframe.

### 1.2. Quản Lý Không Gian Làm Việc (Workspace & Multi-Team)
- [x] **Chuyển đổi nhóm làm việc linh hoạt (Multi-Workspace Switcher)**: Tích hợp ngay trên Header và modal lựa chọn không gian làm việc.
- [x] **Modal Quản lý thành viên (`ManageMembersModal`)**:
  - Gán thành viên mới vào nhóm sản xuất.
  - Phân công vai trò (`Writer`, `Reviewer`, `Producer`).
  - Bổ nhiệm hoặc hạ quyền **Trưởng nhóm (Team Leader)**.
  - Chuyển đổi trạng thái hoạt động: `ACTIVE` / `INACTIVE` (vô hiệu hóa).
  - Xóa thành viên khỏi nhóm có xác nhận an toàn.
- [x] **Tạo Không Gian Làm Việc Mới (`CreateWorkspaceModal`)**: Cho phép Admin khởi tạo nhóm sản xuất và chỉ định Trưởng nhóm ban đầu.

### 1.3. Kho Kịch Bản & Bảng Điều Khiển Dự Án (`ProjectDashboardView`)
- [x] **Lọc & Tìm kiếm đa tiêu chí**: Theo 5 trụ cột môn học STEM (Toán, Vật Lý, Hóa Học, Sinh Học, Tin Học), theo khối lớp (K10 - K12), và theo trạng thái kịch bản/video.
- [x] **Thẻ dự án thông minh (Smart Action Cards)**: Nút hành động thay đổi linh hoạt theo vai trò hiện tại (Vào Soạn Kịch Bản, Vào Thẩm Định, Vào Dựng Video, Xem Chi Tiết).
- [x] **Modal Tạo dự án mới (`CreateProjectModal`)**: Nhập tiêu đề, chọn bộ môn, khối lớp, tỷ lệ khung hình (FPS) và thời lượng dự kiến.

### 1.4. Xưởng Biên Kịch Kịch Bản (`WriterStudio`)
- [x] **Quản lý danh sách phân cảnh (Scenes Management)**: Thêm mới, nhân bản, xóa, di chuyển lên/xuống và sắp xếp thứ tự phân cảnh.
- [x] **Trình soạn thảo trực quan từng Scene**:
  - Lời dẫn thuyết minh (Voiceover Narration).
  - Mô tả hình ảnh trực quan (Visual Prompt).
  - Công thức Toán/Lý/Hóa hiển thị bằng ký hiệu toán học **LaTeX (KaTeX)**.
  - Câu hỏi tương tác trắc nghiệm STEM (STEM Quiz options & đáp án đúng).
- [x] **Hàng đợi tự động lưu kịch bản (`sceneSaveQueue`)**:
  - Cơ chế debounce tự động lưu mỗi khi ngừng gõ phím.
  - Đối chiếu định danh phân cảnh (ID reconciliation) tránh ghi đè dữ liệu cục bộ.
  - Bắt lỗi lưu mạng và thông báo người dùng thử lại trước khi chuyển màn hình.
- [x] **Trí tuệ nhân tạo hỗ trợ kịch bản (AI Script Intelligence)**:
  - Phân tích và tự động chia phân đoạn kịch bản (`segmentScript`).
  - Gợi ý hình ảnh minh họa và công thức toán học phù hợp.
  - Lưu và ghi nhận quyết định phê duyệt AI (`decideAiRequest`).
- [x] **So sánh phiên bản (`VersionDiffModal`)**: Xem khác biệt giữa bản nháp hiện tại và phiên bản kịch bản trước đó.

### 1.5. Xưởng Thẩm Định & Kiểm Duyệt (`ReviewerStudio`)
- [x] **Thẩm định từng phân cảnh (Scene Feedback Comments)**: Thêm ghi chú nhận xét trực tiếp vào từng scene.
- [x] **Quy trình phê duyệt kịch bản (Approval Workflow)**:
  - Phê duyệt kịch bản (`APPROVED`) -> Chuyển giao sang xưởng Producer dựng phim.
  - Yêu cầu chỉnh sửa (`CHANGE_REQUESTED`) -> Gửi trả Writer kèm lý do chi tiết.
- [x] **Modal Duyệt Bản Nháp (`DraftReviewModal`)**: Xem trước các thay đổi bản nháp đang chờ xử lý.

### 1.6. Xưởng Dựng Video Remotion (`ProducerStudio`)
- [x] **Tích hợp Remotion Player thời gian thực**: Trình phát canvas video chuẩn 60fps / 30fps ngay trên trình duyệt.
- [x] **Điều chỉnh thông số thuộc tính phân cảnh (`SceneInspector`)**:
  - Tinh chỉnh bố cục template Remotion: `TITLE_HERO`, `MATH_FORMULA`, `DIAGRAM_EXPLAINER`, `DATA_CHART`, `ALGORITHM_WALKTHROUGH`, `STEM_QUIZ`, `CHEMICAL_REACTION`, `GEOMETRY_SPACE`, `OUTRO`.
  - Căn chỉnh thời lượng phân cảnh theo số khung hình (`durationInFrames`).
  - Tùy chỉnh giọng đọc thuyết minh TTS tiếng Việt và hiển thị phụ đề thời gian thực (Whisper auto-captioning).
- [x] **Đệ trình tác vụ Render video**: Gửi lệnh render sang Worker pool (Node.js + Remotion + BullMQ) và theo dõi tiến độ theo % hoàn thành.
- [x] **So sánh video render (`ClipCompareModal`)**: Xem song song clip phiên bản mới và phiên bản cũ.

### 1.7. Thư Viện Media & Xuất Bản Video (`MediaLibrary` & `PublishModal`)
- [x] **Media Library**: Lưu trữ video thành phẩm, phân loại theo chủ đề STEM.
- [x] **Xuất bản YouTube 1-Click (`PublishModal`)**: Tích hợp YouTube Data API v3 (tiêu đề, mô tả, thẻ tags, chế độ riêng tư/công khai).
- [x] **Mã nhúng nhúng iframe (Embed Code)**: Sinh đường dẫn và mã HTML nhúng vào Canvas LMS hoặc website học tập.

### 1.8. Cổng Quản Trị Hệ Thống (`AdminPortal`)
- [x] **Giám sát hạ tầng & chi phí AI (FE-17)**:
  - Theo dõi tổng số dự án, kịch bản, phân cảnh đã sinh.
  - Thống kê lượt gọi AI, chi phí ước tính ($ USD), độ trễ trung bình (latency ms), số token tiêu thụ, ngân sách hàng tháng.
  - Danh sách công việc render gần đây và trạng thái queue.
- [x] **Quản lý người dùng & Phân quyền RBAC (FE-15)**:
  - Cấp tài khoản mới (`AccountProvisionForm`).
  - Gán vai trò hệ thống (`ADMIN`, `WRITER`).
  - Khóa tài khoản (`INACTIVE`) hoặc mở khóa (`ACTIVE`).
  - Xóa tài khoản an toàn với kiểm tra ràng buộc sở hữu dự án/workspace.
- [x] **Quản lý danh mục Template Remotion (FE-16)**:
  - Xem danh mục template theo bộ môn STEM.
  - Bật/tắt trạng thái sử dụng của template.
  - Thêm template mẫu mới kèm schema cấu hình `propsSchema` JSON.

---

## 2. KIẾN TRÚC PHÂN TẦNG HỆ THỐNG (ARCHITECTURE LAYERS)

Frontend được cấu trúc theo mô hình phân tầng chặt chẽ (Separation of Concerns):

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER (UI & COMPONENTS)                 │
│  - Views: WriterStudio, ReviewerStudio, ProducerStudio, AdminPortal    │
│  - Modals: ManageMembers, CreateProject, CreateWorkspace, Diff, Publish│
│  - Layout: HeaderNav, ToastContainer                                  │
│  - Remotion Engine: Player Canvas, Compositions, Lego Blocks           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Calls action & subscribes state)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER (BUSINESS LOGIC)                  │
│  - authService        - workspaceService      - projectService         │
│  - scriptService      - sceneSaveQueue        - reviewService          │
│  - compositionService - renderService         - publicationService     │
│  - adminService       - metaphorService                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Delegates network requests)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      BASE API CLIENT (TRANSPORT LAYER)                 │
│  - apiClient: Singleton quản lý BaseURL, JWT Authorization Header,     │
│    Timeout, JSON parsing, Bắt lỗi ApiError, Dispatching Global Events  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (HTTP REST / JSON over TLS)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API SERVICES                          │
│  - Spring Boot API (/api/v1)                                           │
│  - FastApi AI Microservice (qua Spring Boot)                           │
│  - Node.js Remotion Render Worker                                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. TÁCH CHI TIẾT TẦNG DỊCH VỤ & DANH MỤC API ENDPOINTS

### 3.1. `apiClient` (`src/services/apiClient.ts`)
* **Trách nhiệm:** Trục giao tiếp mạng trung tâm; tự động thêm `Authorization: Bearer <token>`; chuẩn hóa lỗi thành `ApiError`; phát sự kiện toàn cục khi gặp mã lỗi 401 hoặc 403.
* **Cơ chế đặc biệt:**
  - `stemotion:unauthorized` (HTTP 401): Tự động xóa token và điều hướng về trang đăng nhập.
  - `stemotion:password-change-required` (HTTP 403): Tự động mở modal bắt buộc đổi mật khẩu.

---

### 3.2. `authService` (`src/services/authService.ts`)
| Chức năng | Phương thức HTTP | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| Đăng nhập Email/Pass | `POST` | `/auth/login` | Nhận JWT access token & thông tin profile |
| Đăng nhập Google | `POST` | `/auth/google` | Gửi credential Google ID token (GSI) |
| Lấy profile hiện tại | `GET` | `/auth/me` | Lấy vai trò hệ thống, họ tên, email |
| Đổi mật khẩu | `POST` | `/auth/change-password` | Đổi mật khẩu lần đầu hoặc định kỳ |
| Đăng xuất | Client | N/A | Xóa JWT & cache, chuyển trạng thái đăng xuất |

---

### 3.3. `workspaceService` (`src/services/workspaceService.ts`)
| Chức năng | Phương thức HTTP | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| Lấy nhóm của tôi | `GET` | `/workspaces/mine` | Danh sách nhóm user tham gia (hoặc tất cả nếu là Admin) |
| Lấy tất cả nhóm | `GET` | `/workspaces` | Danh sách toàn bộ không gian làm việc (dành cho Admin) |
| Chi tiết nhóm | `GET` | `/workspaces/{id}` | Lấy metadata của 1 nhóm |
| Tạo nhóm mới | `POST` | `/workspaces` | Khởi tạo workspace mới và chỉ định Trưởng nhóm |
| Danh sách thành viên | `GET` | `/workspaces/{id}/members` | Lấy danh sách thành viên trong nhóm |
| Ứng viên thêm vào nhóm | `GET` | `/workspaces/{id}/candidates` | Lấy các tài khoản hệ thống chưa ở trong nhóm |
| Gán thành viên mới | `POST` | `/workspaces/{id}/members` | Gán user vào nhóm kèm vai trò & cờ Trưởng nhóm |
| Cập nhật thành viên | `PATCH` | `/workspaces/{id}/members/{mId}` | Đổi vai trò, trạng thái ACTIVE/INACTIVE, cờ Leader |
| Xóa thành viên | `DELETE` | `/workspaces/{id}/members/{mId}` | Xóa thành viên khỏi nhóm |

---

### 3.4. `projectService` (`src/services/projectService.ts`)
| Chức năng | Phương thức HTTP | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| Danh sách dự án | `GET` | `/projects?workspaceId={id}` | Lấy danh sách kịch bản trong nhóm hiện tại |
| Chi tiết dự án | `GET` | `/projects/{id}` | Lấy thông tin dự án, cấu hình fps, thời lượng |
| Tạo dự án kịch bản | `POST` | `/projects` | Khởi tạo dự án kịch bản mới trong workspace |
| Lưu trữ dự án | `POST` | `/projects/{id}/archive` | Đưa dự án vào kho lưu trữ (Archive) |
| Lịch sử phiên bản | `GET` | `/projects/{id}/versions` | Danh sách các version kịch bản của dự án |

---

### 3.5. `scriptService` (`src/services/scriptService.ts`)
| Chức năng | Phương thức HTTP | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| Lấy kịch bản hiện tại | `GET` | `/projects/{id}/scripts/current` | Lấy danh sách phân cảnh của bản nháp hiện tại |
| Lưu phân cảnh | `PUT` | `/projects/{id}/scripts/scenes/{sceneId}` | Cập nhật nội dung một phân cảnh |
| Xóa phân cảnh | `DELETE`| `/projects/{id}/scripts/scenes/{sceneId}` | Xóa một phân cảnh khỏi kịch bản |
| Sắp xếp phân cảnh | `POST` | `/projects/{id}/scripts/reorder` | Cập nhật thứ tự các phân cảnh (`order_no`) |
| Gợi ý AI phân đoạn | `POST` | `/ai/script/segment` | AI chia kịch bản thô thành các scene chi tiết |
| Phê duyệt quyết định AI | `POST`| `/ai/requests/{id}/decision` | Lưu trạng thái chấp nhận hoặc từ chối gợi ý AI |
| Thẩm định sư phạm AI | `POST` | `/ai/script/pedagogical-review` | AI chấm điểm độ dễ hiểu và tính sư phạm |

---

### 3.6. `sceneSaveQueue` (`src/services/sceneSaveQueue.ts`)
- **Trách nhiệm:** Quản lý hàng đợi lưu phân cảnh tự động (Auto-save) ở chế độ ngầm.
- **Tính năng:**
  - Chống nghẽn mạng bằng kỹ thuật **Debounce** (hoãn gửi yêu cầu 800ms sau khi ngừng gõ).
  - Tự động hoán đổi ID phân cảnh tạm thời thành ID chính thức từ DB (ID Reconciliation).
  - Cung cấp Subscription Pattern (`subscribe`) để giao diện cập nhật trạng thái "Đang lưu...", "Đã lưu" hoặc thông báo lỗi nếu lưu thất bại.

---

### 3.7. `reviewService` (`src/services/reviewService.ts`)
| Chức năng | Phương thức HTTP | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| Lấy danh sách comment | `GET` | `/projects/{id}/comments` | Lấy các ghi chú thẩm định theo từng phân cảnh |
| Thêm comment thẩm định | `POST` | `/projects/{id}/comments` | Thẩm định viên để lại nhận xét tại phân cảnh cụ thể |
| Quyết định duyệt | `POST` | `/projects/{id}/review/decision` | Gửi quyết định `APPROVED` hoặc `CHANGE_REQUESTED` |

---

### 3.8. `compositionService` & `composed` (`src/services/compositionService.ts`, `composed.ts`)
| Chức năng | Phương thức HTTP | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| Lấy Composition video | `GET` | `/projects/{id}/composition` | Lấy cấu trúc Remotion composition của dự án |
| Lưu Composition | `PUT` | `/projects/{id}/composition` | Lưu cấu hình timeline, props các Lego block |

---

### 3.9. `renderService` (`src/services/renderService.ts`)
| Chức năng | Phương thức HTTP | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| Bắt đầu Render video | `POST` | `/render/jobs` | Gửi yêu cầu render clip lên hàng đợi BullMQ |
| Kiểm tra trạng thái Render | `GET`| `/render/jobs/{id}/status` | Lấy tiến độ rendering (0% - 100%, URL mp4 thành phẩm) |
| Hủy tác vụ Render | `POST` | `/render/jobs/{id}/cancel` | Hủy tiến trình render nếu đang chờ |

---

### 3.10. `publicationService` (`src/services/publicationService.ts`)
| Chức năng | Phương thức HTTP | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| Xuất bản lên YouTube | `POST` | `/publications/youtube` | Đăng video thành phẩm lên kênh YouTube qua API |
| Lấy thông tin mã nhúng | `GET` | `/publications/{id}/embed` | Lấy link nhúng iframe cho hệ thống LMS |

---

### 3.11. `adminService` (`src/services/adminService.ts`)
| Chức năng | Phương thức HTTP | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| Thống kê tổng quan | `GET` | `/admin/metrics/overview` | Lấy số liệu AI usage, latency, tokens, chi phí USD |
| Danh sách tài khoản | `GET` | `/admin/users` | Toàn bộ tài khoản người dùng trong hệ sinh thái |
| Cấp tài khoản mới | `POST` | `/admin/users/provision` | Tạo tài khoản giáo viên/nhân sự ban đầu |
| Cập nhật tài khoản | `PATCH`| `/admin/users/{id}` | Khóa/mở khóa tài khoản (ACTIVE / INACTIVE) |
| Xóa tài khoản | `DELETE`| `/admin/users/{id}` | Xóa tài khoản (kiểm tra an toàn dữ liệu) |
| Danh mục Template | `GET` | `/admin/templates` | Lấy catalog các mẫu Remotion theo môn học |
| Cập nhật Template | `PATCH`| `/admin/templates/{id}` | Kích hoạt hoặc ẩn template khỏi studio |
| Thêm Template mẫu | `POST` | `/admin/templates` | Thêm template Remotion mới kèm schema JSON |

---

## 4. ĐẶC TẢ HỆ THỐNG BÁO LỖI & XỬ LÝ NGOẠI LỆ (ERROR LOGS & HANDLING)

Toàn bộ lỗi từ API trả về được đóng gói theo định dạng chuẩn:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Thông điệp mô tả lỗi chi tiết dành cho người dùng",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-10-17T12:00:00Z",
    "requestId": "req-xyz-123"
  }
}
```

### 4.1. Bảng Mã Lỗi Chuẩn & Hành Động Xử Lý Tại Frontend

| HTTP Status | Mã Lỗi (`code`) | Nguyên Nhân Thường Gặp | Hành Động & Phản Hồi của Frontend |
| :---: | :--- | :--- | :--- |
| **0** | `NETWORK_ERROR` | Mất mạng hoặc Server Backend chưa bật | Báo Toast vàng: *"Không thể kết nối đến máy chủ Backend. Kiểm tra backend đã chạy chưa."* |
| **401** | `UNAUTHORIZED` / `TOKEN_EXPIRED` | Phiên đăng nhập hết hạn hoặc JWT không hợp lệ | Xóa token trong localStorage, phát sự kiện `stemotion:unauthorized`, chuyển người dùng về màn hình Login |
| **403** | `PASSWORD_CHANGE_REQUIRED` | Tài khoản mới được cấp cần đổi mật khẩu lần đầu | Bật `ChangePasswordModal` chặn giao diện cho đến khi đổi mật khẩu thành công |
| **403** | `FORBIDDEN` | Người dùng thao tác ngoài quyền hạn (ví dụ: Writer bấm xóa thành viên nhóm) | Báo Toast đỏ/vàng: *"Bạn không có quyền thực hiện thao tác này."* |
| **404** | `NOT_FOUND` | Dự án, kịch bản hoặc thành viên không tồn tại trong DB | Hiển thị màn hình fallback rỗng (Empty State) kèm thông điệp hướng dẫn |
| **409** | `CONFLICT` / `ALREADY_EXISTS` | Thêm thành viên đã có sẵn trong nhóm hoặc trùng email | Hiển thị Banner đỏ trong Modal: *"Người dùng này đã là thành viên của nhóm."* |
| **400** | `BAD_REQUEST` | Dữ liệu gửi lên thiếu trường bắt buộc hoặc sai định dạng | Đọc trường `error.message` từ server và hiển thị Toast/Banner trực quan cho người dùng |
| **500** | `INTERNAL_SERVER_ERROR` | Lỗi ngoại lệ trong xử lý phía backend / database | Báo Toast: *"Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau."* |
| **503** | `AI_SERVICE_UNAVAILABLE` | Dịch vụ AI microservice quá tải hoặc lỗi kết nối | Báo Toast: *"Không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau vài giây."* |

### 4.2. Cơ Chế Hiển Thị Thông Báo Lỗi Trực Quan Trên UI
1. **Toast Notification System (`ToastContainer.tsx`)**:
   - `success`: Màu xanh lá, tự đóng sau 3.2 giây.
   - `warn`: Màu vàng hổ phách, hiển thị khi lưu nháp thất bại hoặc thiếu quyền.
   - `info`: Màu xanh dương, thông báo trạng thái tải dữ liệu.
2. **Inline Alert Banner (`AlertCircle` icon)**:
   - Được nhúng trực tiếp trong các Form/Modal (ví dụ: `ManageMembersModal`, `CreateWorkspaceForm`, `AccountProvisionForm`) để báo lỗi ngay tại ngữ cảnh người dùng đang thao tác.
3. **Empty States & Fallbacks**:
   - Khi chưa có dự án: Hiển thị icon thân thiện kèm nút bấm tạo kịch bản đầu tiên.
   - Khi tài khoản chưa thuộc nhóm nào: Hiển thị màn hình hướng dẫn liên hệ Admin.

---

## 5. ĐẶC TẢ CHI TIẾT NHỮNG GÌ CHƯA LÀM ĐƯỢC / CÒN THIẾU (MISSING & INCOMPLETE FEATURES)

Dưới đây là bảng tổng hợp và đánh giá chuyên sâu về các tính năng còn thiếu, đang ở trạng thái làm mẫu (Mock/Stub), hoặc cần hoàn thiện trên Frontend so với bản đặc tả đề tài Capstone:

### 5.1. Nhóm 1: Trình Phát & Kết Xuất Remotion (Remotion Engine & Audio)
* **[Thiếu] Tùy chọn Tỷ lệ khung hình dọc (9:16 Shorts/TikTok) và vuông (1:1)**:
  - *Hiện trạng:* Giao diện Player (`RemotionPlayerWrapper`) và các composition hiện fix cứng tỷ lệ ngang `1920x1080` (16:9).
  - *Khoảng trống:* Đề tài hướng tới việc sản xuất video cho các kênh giáo dục YouTube Shorts/TikTok. Chưa có nút chuyển đổi tỷ lệ khung hình (16:9 ↔ 9:16) và chưa có CSS/Layout tự động co giãn các Lego block theo chiều dọc.
* **[Thiếu] Multi-track Audio Timeline (Đa luồng âm thanh)**:
  - *Hiện trạng:* Trình phát Remotion hiện chỉ hỗ trợ một thẻ `<Audio>` duy nhất chứa lời đọc thuyết minh (`narrationAudioUrl`).
  - *Khoảng trống:* Chưa có dòng thời gian đa rãnh âm thanh:
    1. Rãnh Lời thoại (Voiceover track).
    2. Rãnh Nhạc nền (BGM - Background Music track) kèm chọn nhạc nền theo thể loại.
    3. Rãnh Hiệu ứng âm thanh (SFX - Sound Effects) khi chuyển cảnh.
    4. Thanh trượt điều chỉnh âm lượng riêng (Volume/Gain) và tính năng tự động giảm nhạc nền khi có lời nói (Audio Ducking).
* **[Chưa hoàn thiện] Nghe thử Lời thoại AI (Neural TTS Preview)**:
  - *Hiện trạng:* Nút "Nghe thử lời thoại" trong `WriterStudio` đang sử dụng `window.speechSynthesis` (Web Speech API tích hợp sẵn của trình duyệt).
  - *Khoảng trống:* Đây chỉ là giọng robot cục bộ của hệ điều hành, khác xa với chất lượng giọng đọc AI tiếng Việt thực tế của backend (FPT.AI / Google Cloud TTS / OpenAI TTS). Cần bổ sung API gọi trực tiếp sang AI service để nhận về audio stream phát thử ngay trên UI.

---

### 5.2. Nhóm 2: Thẩm Định & Phản Biện Clip (Reviewer QA & Annotations)
* **[Chưa hoàn thiện] Ghim nhận xét trực quan lên khung hình Video (Visual Frame Annotation)**:
  - *Hiện trạng:* `ReviewerStudio` ở chế độ "Duyệt Video" mới chỉ hỗ trợ ghim bình luận dạng văn bản theo mốc thời gian giây (`timestampSec`).
  - *Khoảng trống:* Chưa có công cụ vẽ trực quan trên canvas video (như khoanh vùng hình chữ nhật, mũi tên trỏ vào chi tiết lỗi đồ họa hoặc bút vẽ tự do - On-screen Drawing Pinning) tương tự như Frame.io hoặc Figma.
* **[Thiếu] Luồng trao đổi thảo luận có phân nhánh (Threaded Discussion & Resolved State)**:
  - *Hiện trạng:* Danh sách comment hiển thị dạng phẳng (flat list).
  - *Khoảng trống:* Chưa có chức năng phản hồi qua lại (Reply thread) giữa Writer/Producer và Reviewer trên từng nhận xét; chưa có checkbox "Đã khắc phục" (Mark as Resolved) để Reviewer nghiệm thu từng điểm góp ý.

---

### 5.3. Nhóm 3: Đồng Bộ Thời Gian Thực & Hợp Tác Nhóm (Realtime & Collaboration)
* **[Thiếu] Kết nối Thời gian thực WebSocket / SSE (Server-Sent Events)**:
  - *Hiện trạng:* Mọi cập nhật trạng thái kịch bản (khi Reviewer phê duyệt, Producer nộp video, AI phân tích xong) đều dựa vào việc polling thủ công hoặc người dùng tự tải lại trang (reload).
  - *Khoảng trống:* Chưa có kênh kết nối WebSocket hoặc SSE để cập nhật tức thì trạng thái tiến độ pipeline giữa các tab của các thành viên trong cùng nhóm.
* **[Thiếu] Hiển thị sự hiện diện & Cơ chế Khóa phân cảnh (Presence & Collaborative Locking)**:
  - *Hiện trạng:* `sceneSaveQueue` xử lý hàng đợi debounce ở phía client của 1 máy.
  - *Khoảng trống:* Nếu 2 người dùng (ví dụ 2 Writer hoặc 1 Writer và 1 Reviewer) cùng mở một dự án kịch bản, hệ thống chưa hiển thị avatar ai đang online cùng xem/sửa, và chưa có cơ chế khóa phân cảnh (Scene Lock) để ngăn chặn việc người này vô tình ghi đè nội dung của người kia.

---

### 5.4. Nhóm 4: Quản Lý Học Liệu & Tải Lên Media (Asset Upload & Media Library)
* **[Chưa hoàn thiện] Thư viện Media Library (`MediaLibraryView`)**:
  - *Hiện trạng:* Màn hình `MediaLibraryView` hiện mới chỉ hiển thị dạng mẫu (1 card duy nhất lấy từ kịch bản đang mở trong state).
  - *Khoảng trống:* Chưa có trang Gallery danh mục toàn diện kết nối API backend để duyệt qua tất cả video đã xuất bản của workspace; chưa có bộ lọc phân trang theo môn học, thời gian, từ khóa tìm kiếm.
* **[Thiếu] Tải lên Media cá nhân (User Asset Upload)**:
  - *Hiện trạng:* Các phân cảnh chỉ có thể sử dụng các icon hoặc khối Lego có sẵn trong mã nguồn.
  - *Khoảng trống:* Chưa có chức năng kéo thả tải file từ máy tính (ảnh minh họa PNG/JPG, vector SVG công thức, video tư liệu ngắn MP4) lên hệ thống lưu trữ S3/MinIO để gắn trực tiếp vào bài giảng.
* **[Thiếu] Sinh ảnh minh họa AI tức thì (AI Image Generation Preview)**:
  - *Hiện trạng:* Trường `visualPrompt` chỉ lưu đoạn text mô tả hình ảnh cần hiển thị.
  - *Khoảng trống:* Chưa có nút bấm "Tạo ảnh minh họa bằng AI" (tích hợp Imagen / DALL-E 3 / FLUX) để sinh ra ảnh minh họa trực tiếp và nhúng vào scene ngay trong `SceneInspector`.

---

### 5.5. Nhóm 5: Xuất Bản Đa Nền Tảng & Tích Hợp LMS (Publishing & Integrations)
* **[Chưa hoàn thiện] Đăng tải YouTube 1-Click (YouTube Data API v3)**:
  - *Hiện trạng:* Modal xuất bản (`PublishModal`) có nút YouTube nhưng hiển thị cảnh báo "Xuất YouTube chưa khả dụng; cần kết nối kênh bằng OAuth".
  - *Khoảng trống:* Chưa có giao diện người dùng để thực hiện OAuth Connect với kênh YouTube cá nhân/studio, chưa cho phép chọn Playlist, đặt Ảnh đại diện (Thumbnail) và gắn thẻ tags trước khi gửi lệnh đăng tải.
* **[Thiếu] Đóng gói chuẩn SCORM & Tích hợp LTI cho hệ thống LMS**:
  - *Hiện trạng:* Chỉ mới tạo ra chuỗi thẻ HTML `<iframe>` để nhúng thủ công.
  - *Khoảng trống:* Thiếu tính năng đóng gói khóa học theo chuẩn SCORM 1.2 / SCORM 2004 (file .zip kèm bài kiểm tra tương tác trắc nghiệm `STEM_QUIZ`) để import trực tiếp vào Moodle, Canvas LMS hoặc Blackboard.

---

### 5.6. Nhóm 6: Trải Nghiệm Người Dùng & Năng Suất (UX & Productivity)
* **[Thiếu] Hoàn tác / Làm lại (Undo / Redo)**: Chưa hỗ trợ phím tắt `Ctrl + Z` / `Ctrl + Y` khi soạn thảo văn bản hoặc căn chỉnh vị trí các khối trên canvas Canva overlay.
* **[Thiếu] Xuất bản kịch bản ngoại tuyến (Export to Word/PDF)**: Chưa có nút xuất kịch bản chi tiết ra định dạng PDF hoặc Word có hiển thị công thức toán KaTeX chuẩn mực để in ấn duyệt sư phạm ngoại tuyến.
* **[Thiếu] Chế độ Giao diện Tối (Dark Mode)**: Giao diện hiện tại toàn bộ là Light Mode, chưa có toggle chuyển Dark Mode cho các studio dựng phim chuyên nghiệp.

---

## 6. MA TRẬN ĐÁNH GIÁ MỨC ĐỘ HOÀN THIỆN CỦA TỪNG MODULE

| Phân Hệ (Module) | Thành Phần UI / Service | Mức Độ Hoàn Thiện | Trạng Thái & Khoảng Trống Còn Lại |
| :--- | :--- | :---: | :--- |
| **Xác thực & RBAC** | `LoginScreen`, `authService`, Google SSO | **95%** | Rất tốt. Đầy đủ JWT, Google GSI, bắt buộc đổi mật khẩu lần đầu. |
| **Không Gian Làm Việc** | `ManageMembersModal`, `workspaceService` | **95%** | Rất tốt. Chuyển đổi workspace, phân quyền Leader/Member, gán/xóa thành viên. |
| **Bảng Điều Khiển Dự Án**| `ProjectDashboardView`, `projectService` | **90%** | Rất tốt. Lọc theo 5 môn STEM, khối lớp, tìm kiếm, thẻ hành động theo vai trò. |
| **Xưởng Biên Kịch** | `WriterStudio`, `sceneSaveQueue`, KaTeX | **85%** | Tốt. Auto-save debounce, reorder scene, KaTeX mượt mà. *(Thiếu Undo/Redo, Neural TTS)* |
| **Trí Tuệ Nhân Tạo** | `scriptService.runAiAction`, AI Review | **80%** | Khá. Chia phân cảnh, chấm độ khó, bóc tách thuật ngữ. *(Thiếu sinh ảnh AI live)* |
| **Xưởng Thẩm Định** | `ReviewerStudio`, `reviewService` | **80%** | Khá. Duyệt kịch bản + Duyệt clip, ghim comment theo giây. *(Thiếu vẽ lên khung hình)* |
| **Xưởng Dựng Remotion** | `ProducerStudio`, `RemotionPlayerWrapper` | **75%** | Khá. Canva WYSIWYG, Player 60fps, chỉnh props. *(Thiếu 9:16, thiếu Multi-track Audio)* |
| **Render Engine** | `renderService`, BullMQ Progress Polling | **80%** | Khá. Gửi job, đo %, hủy job. *(Phụ thuộc Backend Chromium Worker)* |
| **Thư Viện Học Liệu** | `MediaLibraryView` | **40%** | Cơ bản / Mock. Mới có 1 card mẫu, chưa có thư viện duyệt toàn bộ clip DB. |
| **Xuất Bản & LMS** | `PublishModal`, `publicationService` | **50%** | Một phần. Đã có tải MP4 & sinh mã iFrame. *(Chưa có YouTube OAuth UI & SCORM)* |
| **Cổng Quản Trị Hệ Thống**| `AdminPortal`, `adminService` | **90%** | Rất tốt. Giám sát chi phí AI, token, quản lý user, template catalog. |

---

## 7. DANH SÁCH TODO & KẾ HOẠCH NÂNG CẤP ƯU TIÊN

### 7.1. Giai Đoạn 1: Hoàn Thiện Các Nút Thắt Cốt Lõi (Ưu Tiên Cao - P0)
- [ ] **Kết nối Thư viện Media Library thật (`MediaLibraryView`)**: Viết endpoint gọi `GET /publications` để hiển thị toàn bộ danh sách video thành phẩm của Workspace với thanh tìm kiếm và bộ lọc môn học.
- [ ] **Tích hợp Tải Lên Media (Asset Upload)**: Bổ sung input upload file ảnh/vector trực tiếp trong `SceneInspector`, gửi lên API lưu trữ MinIO/S3 và gắn URL vào phân cảnh.
- [ ] **Nâng cấp Neural TTS Preview**: Thay thế `window.speechSynthesis` bằng API gọi trực tiếp đến dịch vụ TTS của backend để nghe thử giọng đọc AI thực tế.

### 7.2. Giai Đoạn 2: Nâng Cao Năng Lực Studio Remotion & Đa Nền Tảng (Ưu Tiên Trung Bình - P1)
- [ ] **Chuyển đổi Tỷ lệ khung hình 9:16 (Shorts / TikTok)**: Bổ sung công tắc 16:9 / 9:16 trên Toolbar, điều chỉnh `compositionWidth`/`compositionHeight` của Player và căn chỉnh lại tỷ lệ component.
- [ ] **Multi-track Audio Mixing**: Bổ sung rãnh Nhạc nền (BGM) và thanh trượt điều chỉnh âm lượng riêng biệt cho từng loại âm thanh trong Remotion Composition.
- [ ] **Vẽ chú thích trực tiếp trên Video (Visual Canvas Annotation)**: Bổ sung lớp canvas vẽ khoanh vùng lỗi đồ họa tại từng frame cho Reviewer.
- [ ] **Threaded Comments & Resolved Status**: Bổ sung tính năng trả lời thảo luận phân nhánh và nút đánh dấu đã giải quyết trên từng ghi chú phản biện.

### 7.3. Giai Đoạn 3: Nâng Cấp Nâng Cao & Tích Hợp Hệ Thống Ngoài (Ưu Tiên P2)
- [ ] **YouTube OAuth Connect UI**: Hoàn thiện luồng đăng nhập cấp quyền Google YouTube Data API trực tiếp trên giao diện để xuất bản video 1 chạm lên kênh của studio.
- [ ] **Đóng gói xuất file SCORM / LTI**: Cung cấp tùy chọn tải về gói `.zip` chuẩn SCORM phục vụ các trường học sử dụng Canvas LMS / Moodle.
- [ ] **Realtime Collaboration (WebSocket)**: Hiển thị trạng thái con trỏ và khóa phân cảnh khi có nhiều thành viên cùng mở một kịch bản.
- [ ] **Hỗ trợ Dark Mode & Hoàn tác (Undo/Redo)**: Bổ sung theme tối và phím tắt `Ctrl + Z` trong xưởng soạn thảo.

