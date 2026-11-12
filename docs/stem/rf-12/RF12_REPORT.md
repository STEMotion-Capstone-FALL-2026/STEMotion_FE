# Báo Cáo Triển Khai FE STEM: RF-12 & E2E Integration

- **Người thực hiện:** Trì (Senior Frontend Lead)
- **Nhánh tích hợp:** `integrate/stem-fe-20261112`
- **Gốc xuất phát:** `origin/main` (`88570f2`)
- **Nhánh tính năng đã gộp:** `origin/feat/stem-p4-isolated-20261105` (Clean merge, `docs/deliverables/**` giữ nguyên 100%)
- **Trạng thái CI:** ✅ **270/270 tests PASS (43 test files)** | ✅ **Production Build (`tsc && vite build`) PASS**

---

## 1. Mục Tiêu & Phạm Vi Công Việc RF-12

Triển khai hoàn thiện phần giao diện người dùng (Frontend) cho miền nghiệp vụ sư phạm STEMotion theo định hướng GDPT 2018 (Công văn 909/BGDĐT-GDTH, Công văn 3089/BGDĐT-GDTrH, Thông tư 86/2026/TT-BGDĐT) bao gồm 7 nhiệm vụ trọng tâm:

1. **Khởi tạo & Hợp nhất nhánh:** Tạo nhánh `integrate/stem-fe-20261112` từ `main`, tích hợp trọn vẹn `feat/stem-p4-isolated-20261105` (P4-P6: Brief Panel, Rubric, Grounded AI, Library Cards, Bộ lọc STEM).
2. **Dark Launch & Graceful Fallback (Task 2):** Khi Workspace để STEM ở chế độ `OFF` hoặc Backend trả về `404 Not Found`, các giao diện WriterStudio, ReviewerStudio và MediaLibrary hoạt động bình thường, không hiển thị banner lỗi đỏ, không chặn luồng nộp duyệt kịch bản truyền thống.
3. **Cấu hình Workspace STEM Mode & Chế độ STRICT (Task 3):** Bổ sung lựa chọn `STRICT` bên cạnh `OFF` và `ADVISORY`. Hỗ trợ CAS `baseRevision` và `idempotencyKey`, xử lý `409 Conflict` (stale revision) và `403 Forbidden` (non-admin).
4. **Template Tiến trình Sư phạm 6 Bước (Task 4):** Tích hợp tab "Tiến trình 6 bước" trong `StemBriefPanel` với các mã bước chuẩn:
   - `OPENING_PROBLEM` (Mở đầu / Xác định vấn đề)
   - `BACKGROUND_KNOWLEDGE` (Nghiên cứu kiến thức nền)
   - `PROPOSE_SOLUTION` (Đề xuất giải pháp / thiết kế)
   - `SELECT_SOLUTION` (Lựa chọn giải pháp tối ưu)
   - `BUILD_TEST` (Chế tạo / thử nghiệm mô hình)
   - `CLOSING_SHARE_REFLECT` (Chia sẻ, thảo luận & vận dụng)
   Map trực quan các cảnh (`sceneIds`), hoạt động (`activityKey`), mục tiêu (`objectiveKeys`), và hiển thị trực tiếp các vi phạm kiểm định `TECH-LESSON-OPENING`, `TECH-LESSON-CLOSING`, `TECH-LESSON-ORDER` (Lỗi đỏ) và `TECH-LESSON-STEPS` (Cảnh báo vàng) vào từng slot tương ứng.
5. **Rubric Thẩm định Gắn Fingerprint (Task 5):** Thẩm định kịch bản (`SCRIPT`) và thẩm định video (`VIDEO`) gửi kèm `scriptFingerprint` / `compositionFingerprint` vào `stemAssessment.expectedFingerprint` cùng `rubricVersionId` động từ Catalog.
6. **Xử lý Lỗi Nghiệp vụ & Chống Bypass STRICT (Task 6):**
   - Trong chế độ `STRICT`: Cổng duyệt tự động kích hoạt Rubric Drawer, chặn nút Duyệt nếu chưa hoàn tất đánh giá Rubric hoặc vi phạm tiêu chí sư phạm. Không cho phép bypass Rubric.
   - Bắt các mã lỗi chuyên biệt: `STEM_RUBRIC_REQUIRED` (400), `STEM_VALIDATION_FAILED` (400, render danh sách findings), `STEM_FINGERPRINT_STALE` (409: thông báo kịch bản/bản dựng đã bị sửa đổi trong lúc reviewer đang xem, cung cấp nút "Tải lại & chấm lại").
7. **Kiểm thử Tự động (Task 7):** Xây dựng bộ test toàn diện `StemStrictRubric.test.tsx` (8/8 tests pass), cập nhật `StemPanels.test.tsx` (13/13 tests pass), `StemP6.test.tsx` (31/31 tests pass), xác nhận toàn bộ 43 test files với 270 unit tests vượt qua thành công.

---

## 2. Chi Tiết Các File Thay Đổi

| File | Thay đổi chính |
|---|---|
| `src/types/stem.ts` | Bổ sung `LessonStep`, mở rộng `StemBrief.steps`, bổ sung mode `'STRICT'`, `baseRevision` cho `WorkspaceStemSettingsRequest`, `expectedFingerprint` cho `StemAssessment`, fingerprints cho `StemViewResponse`. |
| `src/services/stemClient.ts` | Hỗ trợ `'STRICT'` mode trong `workspaceModeFromWire`, chuẩn hoá `emptyStemBrief`, tuần tự hoá `steps` trong `stemSavePayload`, bảo toàn `expectedFingerprint` trong `stemAssessmentPayload`. |
| `src/services/scriptService.ts` | Cập nhật `saveWorkspaceStemSettings` truyền `baseRevision ?? modeRevision`. |
| `src/components/stem/StemWorkspaceSettings.tsx` | Dropdown 3 chế độ `OFF`, `ADVISORY`, `STRICT`. Gửi kèm `baseRevision` và `idempotencyKey`. Xử lý 403 & 409. |
| `src/components/stem/StemBriefPanel.tsx` | Tab "Tiến trình 6 bước" (`STEPS`), nút "Áp dụng mẫu 6 bước", multiselect gán cảnh, hiển thị findings `TECH-LESSON-OPENING/CLOSING/ORDER/STEPS`. |
| `src/components/stem/StemRubricPanel.tsx` | Tự động lấy `rubricVersionId` từ Catalog, tự động nạp `expectedFingerprint` từ `scriptFingerprint` hoặc `compositionFingerprint`. |
| `src/components/stem/StemErrorNotice.tsx` | Hộp thoại thông báo lỗi 409 `STEM_FINGERPRINT_STALE` có nút hành động tải lại, và bảng hiển thị findings `STEM_VALIDATION_FAILED`. |
| `src/components/views/WriterStudio/WriterStudio.tsx` | Graceful fallback khi STEM API 404 (cho phép gửi duyệt script trực tiếp), phòng ngừa lỗi null `selectedScene` và `aiAnalysisResult`. |
| `src/components/views/ReviewerStudio/ReviewerStudio.tsx` | Bắt buộc đính kèm `stemAssessment` trong chế độ `STRICT`, phòng ngừa lỗi undefined `comments`, tích hợp xử lý lỗi 409 Stale Fingerprint. |
| `src/components/views/MediaLibrary/MediaLibraryView.tsx` | Graceful fallback khi STEM filters trả về 404. |
| `src/components/stem/StemStrictRubric.test.tsx` | **File mới:** 8 bài kiểm thử chuyên sâu cho 3 chế độ workspace, 6 bước sư phạm, rubric fingerprint, stale handling và fallback khi 404. |
| `src/components/stem/StemPanels.test.tsx` | Cập nhật bộ test kiểm tra Admin bật `STRICT`, kiểm tra non-admin bị disabled, và kiểm tra CAS 409. |
| `src/components/stem/StemP6.test.tsx` & `contract-specimens.json` | Cung cấp fixture nội bộ FE để test độc lập không phụ thuộc đường dẫn tuyệt đối ngoài ổ đĩa. |
| `vite.config.ts` | Loại trừ các file `*live.test.tsx` (cần live backend server) khỏi lệnh chạy unit test thông thường. |

---

## 3. Kết Quả Kiểm Thử (Verification Metrics)

```
Test Files  43 passed (43)
     Tests  270 passed (270)
  Duration  ~142s
TypeScript  Zero errors (tsc exits 0)
Vite Build  dist bundle generated cleanly (built in 12.12s)
```

---

## 4. Hướng Dẫn Kế Tiếp Cho Team

1. Kiểm tra trạng thái Git cục bộ:
   ```bash
   git status
   git diff --stat
   ```
2. Tạo Pull Request từ `integrate/stem-fe-20261112` vào nhánh `main` khi có yêu cầu từ Trì hoặc Team Lead.
3. Không push trực tiếp lên remote trừ khi Trì yêu cầu.
