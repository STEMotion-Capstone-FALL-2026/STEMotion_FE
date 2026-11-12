COMPLETED / TASK_COMPLETED
Đã trích xuất toàn bộ nội dung chi tiết của artifact "Kế hoạch FE STEM: RF-12 và E2E (Trì, Trung)" từ https://claude.ai/artifact/QVd72kxQzk12ps7kyjsARK#a7766887-543c.mjr4rnwf986.56.

Nội dung chi tiết trích xuất:

---

# Kế hoạch FE STEM: RF-12 và E2E (Trì, Trung)
**Ngày:** Nov 12, 2026 · **Tác giả:** @Someone

---

## 1. Bối cảnh
BE đã xong và đã merge vào `main` (12/11/2026); FE STEM vẫn nằm ở nhánh cô lập chưa merge, nên FE là đường găng để demo STEM trước 24/11.

### Bảng trạng thái hiện tại:
| Phần | Trạng thái | Ở đâu |
| :--- | :--- | :--- |
| **BE RF-10: bảng STEM + API** | Merged vào `main` (`8b4d7af`), CI xanh | STEMotion_BE PR #1 |
| **BE RF-11: STRICT, rubric, fingerprint** | Merged vào `main` (`aeced50`), CI xanh, 606 test | STEMotion_BE PR #2 |
| **Bảng STEM trên production (V23–V26)** | Chưa áp; Lê làm R3 rồi R5 | `db/bridge-prod` |
| **FE STEM (P4–P6)** | Chưa merge: 2 commit, 87 file, +11.971 dòng | STEMotion_FE `feat/stem-p4-isolated-20261105` |
| **FE hỗ trợ STRICT** | Chưa có; test hiện tại còn khẳng định *không có* option STRICT | `StemPanels.test.tsx` |
| **E2E STEM** | Chưa có `wf05-stem.spec.ts` | STEMotion_FE `e2e/` |

**Quy tắc Dark Launch:**
STEM vẫn là dark launch: `app.stem.enabled` mặc định tắt, mode workspace mặc định `OFF`. FE phải hoạt động đúng khi STEM tắt (không gọi API STEM, không vỡ màn hình cũ).

---

## 2. Việc của Trì (RF-12, hạn 24/11)
Trì đưa FE STEM vào `main` theo đúng cách BE đã làm: nhánh tích hợp riêng, merge nhánh cô lập, rồi thêm phần STRICT.

1. **Tạo nhánh tích hợp:** `integrate/stem-fe-<ngày>` từ `origin/main` (`88570f2`), merge `origin/feat/stem-p4-isolated-20261105` (P4–P6: panel brief, rubric, grounded AI, thẻ thư viện, lọc). Giữ nguyên `docs/deliverables`.
2. **Chạy đúng khi STEM tắt:** khi BE trả 404 cho API STEM hoặc mode `OFF`, Writer/Reviewer/Library hiển thị như cũ, không lỗi đỏ. Toàn bộ test cũ và E2E wf01–wf04 phải xanh.
3. **Admin bật STRICT:** dropdown mode có `OFF` / `ADVISORY` / `STRICT`, gửi `baseRevision` + `idempotencyKey`; xử lý 409 (revision cũ) và 403 (không phải Admin). Sửa test `StemPanels.test.tsx` đang khẳng định không có option STRICT.
4. **Template 6 bước trong panel brief:** mỗi bước có `stepKey`, gắn `sceneIds` hoặc `activityKey`, `objectiveKeys`; hiển thị finding `TECH-LESSON-OPENING/CLOSING/ORDER` (lỗi) và `TECH-LESSON-STEPS` (cảnh báo) đúng ô. Nhãn 6 bước là DRAFT, sẽ chốt theo nguồn RF-09 của Lê.
5. **Rubric gửi fingerprint:** khi Reviewer duyệt script hoặc video ở STRICT, FE lấy fingerprint hiện tại từ BE (API Hoàng bổ sung, xem mục Hợp đồng API) và gửi lại trong `stemAssessment.expectedFingerprint` cùng `rubricVersionId`.
6. **Xử lý lỗi STEM:**
   - `STEM_RUBRIC_REQUIRED` (400)
   - `STEM_VALIDATION_FAILED` (400, kèm findings)
   - `STEM_FINGERPRINT_STALE` (409: nội dung đã đổi, bảo người dùng tải lại và chấm lại)
   - Không có nút "bỏ qua rubric".
7. **Test FE:** unit test cho 3 mode, 6 bước, rubric có/không fingerprint, 409 stale.

**Đầu ra:** PR `integrate/stem-fe-… → main`, CI xanh, kèm báo cáo ngắn trong `docs/stem/rf-12/`.

---

## 3. Việc của Trung (T13a, T13b, RF-13)
Trung chịu trách nhiệm chứng minh STEM chạy được end-to-end và hồ sơ khớp với code thật.

1. **E2E wf05-stem.spec.ts (T13a):**
   - Luồng chính: Workspace bật STRICT → Writer tạo brief đủ 6 bước → submit → Reviewer chấm rubric (có fingerprint) → duyệt → render → duyệt video → publish.
   - Nhánh lỗi: script không có brief bị chặn submit (AT03); sửa script sau khi duyệt thì render bị 409.
   - Các spec wf01–wf04 giữ ở `OFF` và phải vẫn xanh.
2. **Hạ tầng E2E:** Spec STEM cần `E2eServer` của BE chạy với STEM bật và fixture STEM (Hoàng bổ sung, xem mục Hợp đồng API). Thêm helper `seedStemBrief` trong `e2e/support/api.ts`.
3. **Ma trận AT01–AT24 (T13b):** Mỗi AT ghi test nào chứng minh (BE unit, BE e2e, FE unit, Playwright), commit, kết quả. Hiện BE có test đặt tên theo mã cho AT03, AT21, AT24; các AT khác có thể đã được test dưới tên khác (P3/P5/P6 của Lê), cần dò và ghi lại.
4. **Số liệu cho viva:** Cập nhật số test case cam kết (82, trong đó 52 chạy CI) theo test thật sau khi merge.
5. **RF-13 và T12b:** Cập nhật sơ đồ (use case, ERD) và Report 3/4 theo code đã merge: 11 bảng STEM, mode `OFF/ADVISORY/STRICT`, rubric, fingerprint, template 6 bước; bảng Designed / Implemented / Tested / Deployed.

**Đầu ra:** Spec wf05 xanh trên CI, ma trận AT trong `docs/stem/`, report cập nhật.

---

## 4. Hợp đồng API BE
Các API dưới đã có trên `main`, trừ hai dòng (Hoàng bổ sung). Tiền tố `/api/v1`.

### Bảng API:
| API | Dùng để | Ghi chú |
| :--- | :--- | :--- |
| `GET/PUT /workspaces/{ws}/stem-settings` | Đọc / đặt mode | `mode`: `OFF`, `ADVISORY`, `STRICT`; cần `baseRevision`, `idempotencyKey`; chỉ Admin |
| `GET/POST/PUT /scripts/{project}/versions/{version}/stem` | Đọc / tạo / lưu brief | Brief có `steps[]`: `stepKey`, `sceneIds`, `activityKey`, `objectiveKeys`; trả `findings`, `effectiveMode` |
| `POST /scripts/{project}/versions/{version}/stem/validate` | Kiểm tra brief | Trả findings theo field |
| `GET /stem/catalog`, `GET /stem/frameworks` | Danh mục cấp/lớp/môn/outcome | Nội dung vẫn DRAFT |
| `Duyệt script / duyệt video (API cũ)` | Gửi rubric | `stemAssessment`: `rubricVersionId`, `criteria[]` (`key`, `judgment`, `rationale`, `evidenceIds`), các `expected*Revision`, `expectedFingerprint` (bắt buộc ở STRICT) |
| `Fingerprint hiện tại (Hoàng bổ sung)` | FE lấy để gửi lại khi chấm | Hiện BE chưa trả fingerprint nào, nên STRICT chưa duyệt được từ UI; sẽ thêm `scriptFingerprint` và `compositionFingerprint` vào phản hồi GET brief |
| `E2eServer bật STEM (Hoàng bổ sung)` | Chạy wf05 trên CI | Server E2E có STEM bật + fixture STEM + một workspace STRICT mẫu |

### Bảng mã lỗi FE phải xử lý:
| Mã | HTTP | Khi nào | FE làm gì |
| :--- | :--- | :--- | :--- |
| `STEM_VALIDATION_FAILED` | 400 | Submit ở STRICT còn lỗi (thiếu brief, thiếu bước mở đầu/kết thúc…) | Hiển thị `details.findings` đúng ô |
| `STEM_RUBRIC_REQUIRED` | 400 | Duyệt ở STRICT mà không có rubric | Bắt chấm rubric trước |
| `STEM_FINGERPRINT_STALE` | 409 | Nội dung đổi sau khi chấm/duyệt (render, duyệt video, publish) | Báo tải lại, chấm lại; `details.expected` / `details.actual` |
| `409 revision` | 409 | Brief/mode/script đã đổi bởi người khác | Tải lại, giữ ghi chú người dùng |

*Lưu ý:* Gửi trả về sản xuất (send-back) không bao giờ bị chặn. Workspace chuyển sang STRICT thì script đã duyệt trước đó phải duyệt lại mới render được.

---

## 5. Lịch và mốc (Timeline / Gantt Chart)
*Tiêu đề chart:* Mọi việc hội tụ về hạn 24/11, FE là đường găng  
*Phụ đề:* Lịch đề xuất 13–24/11/2026, mỗi dòng một việc, theo người phụ trách  

| Mốc thời gian | Người phụ trách | Công việc |
| :--- | :--- | :--- |
| **13/11–15/11** | Lê | R3 diễn tập V23–V26 |
| **16/11–17/11** | Lê | R5 lên production, RF-09 |
| **13/11–15/11** | Hoàng | API fingerprint, E2E STEM |
| **18/11–19/11** | Hoàng | Chốt nhãn 6 bước |
| **13/11–16/11** | Trì | Tích hợp nhánh FE STEM |
| **17/11–21/11** | Trì | UI STRICT, rubric, lỗi 409 |
| **13/11–18/11** | Trung | Ma trận AT01–AT24 |
| **18/11–22/11** | Trung | E2E wf05, report |
| **22/11–23/11** | Cả nhóm | Demo trên staging |
| **24/11** | Toàn đội | **Hạn RF-11/12/13** |

*Ghi chú lịch trình:*  
Đây là lịch đề xuất, các bạn chỉnh theo thực tế. Phụ thuộc chính: `wf05` cần API fingerprint và E2E STEM của Hoàng (xong 15/11) và UI STRICT của Trì; demo trên staging cần Lê áp xong V23–V26 (R5, 17/11) và bật `APP_STEM_ENABLED=true` trên staging.

---

## 6. Cách làm với Antigravity
Nếu dùng Antigravity, làm theo vòng mà BE đã dùng cho RF-10/RF-11: prompt chi tiết → agent làm → tự kiểm tra → review → prompt sửa. RF-11 lần đầu test xanh hết nhưng review vẫn ra 8 lỗi logic, nên bước review là bắt buộc.

- **Nhánh riêng, không push thẳng main:** mọi thay đổi qua PR, CI phải xanh.
- **Không để agent tự push:** agent chỉ commit; người push sau khi xem diff.
- **Không sửa `docs/deliverables/**`**, không commit `.env`, không thêm secret; fixture test chỉ dùng giá trị `TEST_ONLY`.
- **Không tắt test hay nới assert để cho qua.**
- **Chạy đủ trước khi báo xong:** `npm run lint`, unit test, build, và E2E liên quan; ghi số test vào báo cáo.
- **Review:** gửi PR cho Hoàng; Hoàng (có Claude hỗ trợ) review các diff quan trọng và gửi prompt vòng sửa nếu cần.
- Hoàng có thể soạn sẵn prompt Antigravity cho bước tích hợp FE (việc 1–2 của Trì) nếu cần.