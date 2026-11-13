# BÁO CÁO KIỂM TOÁN TỔNG HỢP CÁC TÀI LIỆU CAPSTONE (REPORT 1 – 4)
**Dự án:** STEMotion – Nền tảng sản xuất clip STEM có hỗ trợ AI trên nền Remotion  
**Mã đề tài:** FA26SE054  
**Người thực hiện kiểm toán:** Senior Technical & Pedagogical Reviewer  
**Đối tượng bàn giao:** Trì (Senior Frontend Lead) & Đội ngũ Dự án (Hoàng, Lê, Trung)  
**Thời điểm kiểm toán:** 13/11/2026 (Sau đợt Refactor Review 2)  

---

## I. MỤC ĐÍCH & PHẠM VI KIỂM TOÁN
Tài liệu này tổng hợp toàn bộ các phát hiện, lỗ hổng logic, xung đột kiến trúc và điểm gãy nghiệp vụ qua việc đối soát chéo 4 tập tài liệu Capstone chính:
1. **Report 1 (v1.2 – 09/11/2026):** Project Introduction
2. **Report 2 (v1.0 – 26/09/2026):** Project Management Plan
3. **Report 3 (v1.2 – 09/11/2026):** Software Requirement Specification (SRS)
4. **Report 4 (v1.2 – 09/11/2026):** Software Design Document (SDD)

*Căn cứ đối soát:* Biên bản nhận xét Review 2, Bộ chỉ dẫn bất biến `BR-ST01..BR-ST15` (`GEMINI.md`), các quy định Bộ GD&ĐT (CV 909, CV 3089, TT 86/2026), và mã nguồn thực tế trên nhánh tích hợp `integrate/stem-fe-20261112`.

---

## II. MA TRẬN PHÂN LOẠI LỖ HỔNG THEO MỨC ĐỘ

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MỨC ĐỘ NGHIÊM TRỌNG (SEVERITY)                    │
├───────────────────┬───────────────────┬────────────────────────────────┤
│   CRITICAL (03)   │     MAJOR (04)    │           MINOR (03)           │
│ Nguy cơ bị Hội    │ Mâu thuẫn logic,  │ Lệch format, tên mã lỗi chưa   │
│ đồng đánh trượt   │ lệch căn cứ học   │ đồng nhất giữa SRS & Exception │
│ hoặc chất vấn gắt │ thuật / pháp lý   │                                │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## III. CHI TIẾT CÁC LỖ HỔNG NGHIÊM TRỌNG (CRITICAL GAPS)

### 1. [CRITICAL-01] Report 2 (PMP) bị "bỏ quên" hoàn toàn miền nghiệp vụ STEM (FE-18 đến FE-21)
* **Vị trí phát hiện:** Report 2, Mục 1.1 (*Scope & Estimation / WBS*), Mục 1.2 (*Project Objectives / Quality*), Mục 2.2 (*Quality Management*), Mục 4 (*Responsibility Assignments / RACI*).
* **Mô tả chi tiết:**
  - Trong khi Report 1 và Report 3 đã được cập nhật ngày 09/11/2026 lên **21 Major Features** (FE-01 đến FE-21) và **61 Use Cases**, thì Report 2 vẫn là phiên bản cũ ngày 26/09/2026 (v1.0).
  - Toàn bộ bảng phân rã công việc WBS chỉ tính toán 8 Work Packages với 247 man-days cho **FE-01 đến FE-17**. Không có một dòng nào cấp ngân sách hay thời gian cho:
    - `FE-18`: STEM Policy Management.
    - `FE-19`: Author STEM Brief & 6 Pedagogical Steps.
    - `FE-20`: Rubric Quality Gate & Fingerprint Invalidation.
    - `FE-21`: Grounded AI & Frozen Learning Card.
  - Ma trận RACI không phân công ai làm các module STEM. Mục tiêu kiểm thử (System testing) chỉ dừng lại ở FE-17.
* **Hậu quả trước Hội đồng:** Đây là lỗi quản lý dự án nặng nhất. Thầy cô sẽ chất vấn: *"Các em tuyên bố giải quyết nhận xét Review 2 bằng cách thêm miền nghiệp vụ STEM, nhưng tài liệu quản lý dự án của PM lại không cấp 1 giờ công nào cho việc này? Kế hoạch triển khai và thực tế hoàn toàn tách rời nhau?"*
* **Hành động khắc phục khẩn cấp:**
  - Nâng cấp Report 2 lên phiên bản **v1.1** (Record of Changes: `09/11/2026`).
  - Đưa FE-18 đến FE-21 vào WBS (cân đối 25-30 man-days trích từ quỹ dự phòng 33 man-days còn lại).
  - Sửa toàn bộ cụm từ `FE-01 to FE-17` thành `FE-01 to FE-21` ở Mục 1.2, Mục 2.2, Deliverable 11.
  - Cập nhật ma trận phân công RACI cho 4 thành viên (Trì, Trung, Lê, Hoàng).

---

### 2. [CRITICAL-02] Report 4 (SDD) chưa đưa 11 bảng STEM vào Logical ERD và sơ đồ Workflow
* **Vị trí phát hiện:** Report 4, Mục 2.1 (*Logical ERD and Table Descriptions* & Figure 5), Mục 4 (*Main Business Workflows* - Figure 29, 31).
* **Mô tả chi tiết:**
  - Figure 5 (Logical ERD) chỉ thể hiện **15 bảng cơ sở dữ liệu cũ**, hoàn toàn vắng bóng 11 thực thể STEM cốt lõi (`stem_catalog`, `stem_settings`, `stem_briefs`, `stem_evidence`, `stem_validation_runs`, `stem_assessments`, `learning_cards`, v.v.).
  - Báo cáo tự thừa nhận ở trang 4: *"the STEM framework of Report 3 section IV.3.12 is built on an isolated branch and is not yet part of this design baseline"*.
  - Sơ đồ quy trình **WF-02** (*Write and Approve a STEM Script* - Figure 29) và **WF-04** (*Review and Publish a Clip* - Figure 31) thiếu hẳn các bước then chốt: soạn Brief, kiểm tra Invariants, Reviewer chấm Rubric 4 tiêu chí, kiểm tra Content Fingerprint SHA-256 để chống stale, và đóng băng Learning Card.
* **Hậu quả trước Hội đồng:** Thực tế team **đã merge code STEM** vào FE và BE. Nếu nộp một tài liệu thiết kế tự nhận là "chưa thiết kế STEM", Hội đồng sẽ đánh giá tính năng STEM trong sản phẩm là chắp vá, không có thiết kế bài bản từ đầu.
* **Hành động khắc phục:**
  - Cập nhật Figure 5 (Logical ERD) và bảng Table Descriptions: Bổ sung các bảng Flyway V25+ của nhánh STEM.
  - Vẽ lại Activity Diagram WF-02 và WF-04 có các swimlanes/actions kiểm tra `StemValidationRun`, `StemRubricPanel` và `Fingerprint Check`.

---

### 3. [CRITICAL-03] Report 3 (SRS) cấp quyền "Decide" cho Admin trong Reviewer Studio (Vi phạm Invariant BR-ST14)
* **Vị trí phát hiện:** Report 3, Trang 14, Mục 1.3 (*Screen Authorization Table*).
* **Mô tả chi tiết:**
  - Tại bảng ma trận phân quyền màn hình, cột **Admin** bị đánh dấu `X` ở dòng màn hình **`Reviewer Studio (decide)`**.
  - Điều này mâu thuẫn trực tiếp với:
    - **BR-ST14 (Chống bypass):** *"Publishing needs media QA and a STEM decision for the same artifact; an Admin cannot bypass it."*
    - **FR-68:** *"A Reviewer holding an active REVIEWER seat shall record a STEM assessment... and an Admin without the seat cannot record it (UC-52)."*
* **Hậu quả trước Hội đồng:** Giảng viên phản biện sẽ chỉ ra lỗ hổng bảo mật sư phạm: *"Tại sao một tài khoản quản trị kỹ thuật (Admin) không có chuyên môn giáo dục lại có quyền bấm nút Duyệt nội dung bài giảng STEM?"*
* **Hành động khắc phục:**
  - Xóa bỏ dấu `X` ở cột Admin tại dòng `Reviewer Studio (decide)`.
  - Khẳng định rõ: Admin chỉ có quyền quản trị hệ thống và workspace, tuyệt đối không có quyền can thiệp vào quyết định thẩm định chất lượng nội dung trừ khi được phân bổ vai trò Reviewer chính thức trong dự án.

---

## IV. CHI TIẾT CÁC LỖ HỔNG LỚN (MAJOR GAPS)

### 4. [MAJOR-01] Report 1 hoàn toàn thiếu vắng các Căn cứ Pháp lý nền tảng của Bộ GD&ĐT
* **Vị trí phát hiện:** Report 1, Mục 2 (*Product Background*, Trang 4-5) & Mục 5 (*Software Product Vision*, Trang 7).
* **Mô tả chi tiết:** Báo cáo chỉ nêu các nhận định chung chung về "chương trình GDPT" mà không hề trích dẫn các văn bản pháp lý làm nền móng học thuật cho đề tài:
  1. **Công văn 909/BGDĐT-GDTH** (Tiến trình 4 bước cấp Tiểu học).
  2. **Công văn 3089/BGDĐT-GDTrH** (Tiến trình 5 hoạt động cấp THCS & THPT).
  3. **Thông tư 86/2026/TT-BGDĐT** (Quy chế hoạt động giáo dục STEM mới nhất).
* **Hành động khắc phục:** Thêm một đoạn trích dẫn cụ thể 3 văn bản này vào trang 4 của Report 1 để làm đòn bẩy pháp lý vững chắc trước Hội đồng.

---

### 5. [MAJOR-02] Report 3 (FR-11) liệt kê sai danh mục môn học cấp Tiểu học
* **Vị trí phát hiện:** Report 3, Trang 17, Mục 3.3, Yêu cầu **FR-11**.
* **Mô tả chi tiết:** FR-11 ghi cứng: *"A Writer shall create a project with title, subject (**Math, Physics, Chemistry, Biology, Computer Science**) and grade."* Trong khi đó, CT GDPT 2018 quy định cấp Tiểu học (Lớp 1-5) không có môn Vật lí, Hóa học, Sinh học riêng biệt mà chỉ có: *Tự nhiên và Xã hội (Lớp 1-3), Khoa học (Lớp 4-5), Tin học & Công nghệ*.
* **Hành động khắc phục:** Sửa FR-11 thành: *"A Writer shall create a project with title, grade (1-12) and subject(s) valid for that educational level according to the MOET curriculum catalogue"*.

---

### 6. [MAJOR-03] Xung đột cơ chế Đăng nhập (Auth cũ vs. Auth v2) giữa Report 2, Report 4 và Report 1, 3
* **Vị trí phát hiện:** Report 2 (WBS Item 1.4), Report 4 (Class Diagram Figure 11, Sequence Diagram Figure 13).
* **Mô tả chi tiết:**
  - Report 1 và Report 3 đã chuyển sang chuẩn **Auth v2**: Không cho public self-registration; tài khoản do Admin cấp (Admin-provisioned); đăng nhập qua Username/Password hoặc Google OAuth có kiểm tra **Google Whitelist**.
  - Report 2 vẫn ghi là "OAuth public", và Report 4 thừa nhận sơ đồ hình vẽ vẫn giữ `findByEmailIgnoreCase` từ cơ chế cũ chưa vẽ lại.
* **Hành động khắc phục:** Xuất lại Figure 11 & 13 trong SDD, xóa bỏ các tham chiếu email login cũ, đồng bộ với AuthService và GoogleWhitelistService hiện tại.

---

### 7. [MAJOR-04] Figure 1 và Figure 2 trong Report 1 bị vỡ nét, không thể đọc được
* **Vị trí phát hiện:** Report 1, Trang 10 (Figure 1: Use Case Diagram 61 UCs) và Trang 11 (Figure 2: Conceptual ERD 22 thực thể).
* **Mô tả chi tiết:** Cả 2 hình bị nén nhỏ để nhét vào nửa trang giấy A4. Khi xem ở tỉ lệ chuẩn hoặc in ấn, chữ trên sơ đồ bị mờ nhòe hoàn toàn, không thể thẩm tra được các use cases và relationships.
* **Hành động khắc phục:** Tách mỗi hình ra một trang Landscape riêng hoặc đính kèm bản vẽ độ phân giải cao dạng vector vào Phụ lục.

---

## V. CHI TIẾT CÁC ĐIỂM CẦN LÀM RÕ (MINOR GAPS)

### 8. [MINOR-01] Mã lỗi Rubric & Fingerprint chưa đồng nhất giữa SRS và Code thực tế
* **Vị trí:** Report 3, Trang 33 (Application Messages) so với Codebase FE/BE.
* **Chi tiết:** Trong SRS ghi `MSG22 STEM_STALE_TARGET (409)`. Tuy nhiên thực tế FE (`StemErrorNotice.tsx`) và BE (`StemExceptions.java`) đang dùng mã chuẩn hóa: `409 STEM_FINGERPRINT_STALE` và `400 STEM_VALIDATION_FAILED`. Cần đồng nhất tên mã lỗi trong bảng Application Messages.

### 9. [MINOR-02] Report 4 Package Diagram (Figure 2) thiếu khối `domain.stem`
* **Vị trí:** Report 4, Trang 6-7.
* **Chi tiết:** Figure 2 liệt kê đủ các module (`auth`, `workspace`, `project`, `script`, `review`, `production`, `library`, `ai`, `admin`) nhưng thiếu mất khối **`domain.stem`**. Cần vẽ bổ sung để thể hiện tính trọn vẹn của kiến trúc Backend.

### 10. [MINOR-03] Lệch thông tin công nghệ TTS trong Report 2
* **Vị trí:** Report 2, Trang 5 & 13.
* **Chi tiết:** Report 2 ghi *"FPT.AI / Google Cloud TTS"*, trong khi kiến trúc thực tế của hệ thống (`GEMINI.md` và SDD) đã chuyển sang tích hợp **Fast-Whisper / local container TTS** để tối ưu chi phí và căn chỉnh thời lượng phụ đề chuẩn xác.

---

## VI. BẢNG CHECKLIST HÀNH ĐỘNG CỤ THỂ CHO TỪNG THÀNH VIÊN

| Người phụ trách | Hạng mục công việc cần xử lý | Thời hạn đề xuất |
| :--- | :--- | :---: |
| **Nguyễn Việt Hoàng** *(Leader / Báo cáo)* | 1. Nâng cấp **Report 2 lên v1.1**: Đưa FE-18..FE-21 vào WBS, Quality, RACI.<br>2. Nâng cấp **Report 4 lên v1.3**: Xuất lại các hình Mermaid (ERD Figure 5 có 11 bảng STEM; Sơ đồ WF-02, WF-04 có luồng Rubric/Fingerprint; Auth v2 Figure 11, 13).<br>3. Sửa **Report 3 (SRS)**: Bỏ quyền `decide` của Admin ở Reviewer Studio (Trang 14); sửa danh mục môn học FR-11.<br>4. Sửa **Report 1**: Bổ sung trích dẫn CV 909, CV 3089, TT 86 vào mục Background. | **15/11/2026** |
| **Phan Phước Long Trì** *(Senior FE Lead)* | 1. Rà soát lại toàn bộ test suite FE (43 files, 270 unit tests đã pass).<br>2. Đảm bảo UI khớp 100% với tài liệu SRS sau khi Hoàng cập nhật mã lỗi và tiến trình 6 bước.<br>3. Push nhánh `integrate/stem-fe-20261112` lên remote để tạo Pull Request. | **Đã hoàn thành** (Sẵn sàng push) |
| **Phan Thế Trung** *(Tester / E2E)* | 1. Triển khai bộ kịch bản Playwright E2E (`wf05-stem.spec.ts`) dựa trên các use case mới trong SRS.<br>2. Cập nhật ma trận kiểm thử Acceptance Tests (AT01 đến AT24) để đối chiếu khớp với Report 3 & 4. | **16/11/2026** |
| **Trần Nguyễn Hoàng Lê** *(Backend)* | 1. Kiểm tra lại Flyway migration scripts (V25+) của miền STEM trên Supabase/PostgreSQL.<br>2. Rà soát Exception handler để đảm bảo bắn mã lỗi `STEM_FINGERPRINT_STALE` khớp tuyệt đối với tài liệu. | **15/11/2026** |

---
*Tài liệu kiểm toán được lưu trữ tại:* `STEMotion_FE/docs/stem/AUDIT_REPORTS_1_TO_4.md`
