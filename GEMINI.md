# STEMotion Frontend – Project Context & Review 2 Directives

## 1. MỤC TIÊU CỐT LÕI (FE STEM REFACTOR)
Thư mục này là mã nguồn Frontend (React 18, Vite, Tailwind CSS, Remotion Player) của dự án **STEMotion**.
Sau đợt Review 2, nhiệm vụ của Frontend là **chuyển hóa giao diện từ công cụ làm video chung chung thành Nền tảng Học liệu Sư phạm STEM chuẩn mực**.

Tài liệu chi tiết nằm tại: `docs/stem-review2-2026-11-03/`

---

## 2. NHIỆM VỤ TRỌNG TÂM PHÍA FRONTEND (TASKS T07, T08, T11)

### Task T07: Cập nhật Types, Modal Tạo Dự Án & Writer Studio
1. **File `src/types/stem.ts`:**
   - Bổ sung types:
     ```typescript
     export type EducationLevel = 'PRIMARY' | 'LOWER_SECONDARY' | 'UPPER_SECONDARY';
     export type StemComponent = 'SCIENCE' | 'TECHNOLOGY' | 'ENGINEERING' | 'MATHEMATICS';
     export type PedagogicalRole = 
       | 'PROBLEM_HOOK'           // Pha 1: Đặt vấn đề / Nhiệm vụ thiết kế
       | 'FOUNDATION_KNOWLEDGE'   // Pha 2: Kiến thức nền tảng
       | 'DESIGN_SOLUTION'        // Pha 3: Đề xuất giải pháp / Thiết kế
       | 'TEST_AND_EVALUATE'      // Pha 4: Chế tạo, thử nghiệm, mô phỏng
       | 'SHARING_APPLICATION';   // Pha 5: Báo cáo, chia sẻ, vận dụng thực tế
     
     export interface StemBrief {
       educationLevel: EducationLevel;
       gradeNo: number; // 1 -> 12
       standardCode: 'CV_909' | 'CV_3089';
       primarySubject: string;
       integratedElements: StemComponent[];
       learningObjective: string;
       realWorldProblem: string;
       safetyNotes?: string;
     }
     ```
   - Mở rộng interface `Scene` để có thuộc tính: `pedagogicalRole: PedagogicalRole`.
2. **File `src/components/modals/CreateProjectModal.tsx`:**
   - Xóa bỏ dropdown kiểu cũ ("Đại chúng, Cơ bản, Nâng cao").
   - Thay bằng Dropdown chọn Cấp học -> Dropdown chọn Khối lớp 1-12.
   - Dropdown chọn Môn học chính theo đúng cấp học (Tiểu học: Toán, Khoa học, TN&XH; THCS: KHTN, Toán, Tin, Công nghệ; THPT: Vật lí, Hóa học, Sinh học...).
   - Checkbox tích chọn các thành tố STEM (bắt buộc chọn $\ge 2$ thành tố S - T - E - M).
   - Hiển thị nhãn công văn áp dụng: "Chuẩn CV 909/BGDĐT" (Tiểu học) hoặc "Chuẩn CV 3089/BGDĐT" (THCS/THPT).
3. **File `WriterStudio.tsx`:**
   - Hiển thị Panel "STEM Brief" cho phép xem/soạn mục tiêu sư phạm và bối cảnh.
   - Trên mỗi Scene Card: Có badge/tag hiển thị `PedagogicalRole` (Pha 1 -> Pha 5).

---

### Task T08: Cập nhật Không gian Thẩm định (`ReviewerStudio.tsx`)
- Thêm tab/panel **"Thẩm định Sư phạm STEM" (STEM Rubric Evaluation)** bên cạnh tab Review kỹ thuật.
- Hiển thị checklist:
  - Tính chuẩn hóa các pha sư phạm theo công văn.
  - Mức độ tích hợp liên môn (S - T - E - M).
  - Độ chính xác khoa học & an toàn.
- Chỉ khi Reviewer đánh giá PASS các tiêu chí này thì mới duyệt kịch bản/video.

---

### Task T11: Cập nhật Thư viện & Xuất bản (`MediaLibraryView.tsx` & Publish)
- Bộ lọc Media Library: Cho phép lọc theo Cấp học (Tiểu học / THCS / THPT), Khối lớp (1-12) và Môn học.
- Mỗi video hiển thị kèm **"Thẻ học liệu STEM" (STEM Learning Card)** gồm: Tên bài, Cấp/Lớp, Yêu cầu cần đạt, và Nhiệm vụ hoạt động của học sinh sau khi xem clip.

---

## 3. NGUYÊN TẮC KHI CODE FRONTEND (CẤM VI PHẠM)
1. **Bảo toàn Remotion Engine:** Tuyệt đối không thay đổi logic core của Remotion Player, các props render 13 mẫu cảnh, KaTeX CSS và tailwind config.
2. **Trải nghiệm mượt mà:** Tiếp tục giữ cơ chế Autosave Debounce 600ms, không gọi API validation thừa thãi khi người dùng đang gõ phím.
3. **Bắt mã lỗi chính xác:** Bắt các mã lỗi mới từ Backend:
   - `422 Unprocessable Entity` (Thiếu StemBrief hoặc không đủ 2 thành tố STEM).
   - `409 Stale Revision` (Kịch bản/Bản dựng đã bị sửa đổi nội dung khoa học cần duyệt lại).
