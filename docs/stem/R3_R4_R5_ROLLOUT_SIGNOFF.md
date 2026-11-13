# Biên Bản Diễn Tập Liên Diện (R3/R4) & Sổ Tay Cutover Production (R5) — `T12a` / `T14a` / `T14b`

- **Dự án:** STEMotion — Nền tảng sản xuất và thẩm định học liệu video STEM theo CTGDPT 2018
- **Hạng mục:** Việc 3 (`T12a`, `T14a`, `T14b` — Diễn tập R3/R4, Nghiệm thu tích hợp FE ↔ BE ↔ Render & Sổ tay thực thi R5 Production)
- **Người lập & Ký duyệt phía FE/QA:** Phan Thế Trung
- **Ngày thực hiện:** 14/11/2026
- **Nhánh thực hiện:** `feat/stem-t13-e2e-and-matrix-20261114`

---

## 1. Tổng Hợp Kết Quả Cổng R3 — Kiểm Chứng Bridge Migration (`V23–V26`)

Bộ 4 tệp SQL tạo 11 bảng STEM và 4 trigger bất biến (`append-only`) được cô lập tại `STEMotion_BE/src/main/resources/db/bridge-prod/` để chỉ áp dụng có kiểm soát trên schema UUID của Production (`spring.flyway.enabled: false` trên profile `cloud`).

### 1.1. Danh mục tệp Bridge SQL & Mã băm SHA-256

| Thứ tự | Tên tệp trong `src/main/resources/db/bridge-prod/` | Vai trò kỹ thuật | Mã SHA-256 thực tế |
| :---: | :--- | :--- | :--- |
| **1** | `V23__assert_stem_bridge_prerequisites.sql` | Kiểm tra tiền đề PostgreSQL 17, ledger `supabase_migrations` (`20261102131936`), 21 checksum Flyway `V2–V22`, khóa chính `UUID` trên 10 bảng core và cột Auth v2. | `88CEDDA0E8F05EF3CAA5665273D0A40FFACC2BB37F40D7CA3788D217807356A7` |
| **2** | `V24__create_stem_domain.sql` | Khởi tạo 9 bảng miền STEM P3 (`stem_catalog`, `stem_briefs`, `stem_evidence`, `stem_settings`, `stem_assessments`, `stem_validation_runs`, `stem_validation_limits`, `stem_receipts`, `stem_audit`) + RLS + trigger. | `0511FA171C2F958C35AD968F0DAA97CC3C97B4B1B6B3AFA455C30F8DCE7B5E2A` |
| **3** | `V25__create_stem_artifact_lineage.sql` | Khởi tạo 2 bảng dòng dõi học liệu P5 (`stem_p5_snapshots`, `stem_p5_compatibility`) và 4 trigger `stem_p5_append_only`. | `8F70550A8051015175BEF963FC68935C9769B15B1C281614D09761BF3A7CE67D` |
| **4** | `V26__allow_stem_strict_mode.sql` | Mở rộng ràng buộc `stem_settings_mode_check` cho phép 3 chế độ `'OFF'`, `'ADVISORY'`, `'STRICT'`. | `233E42321340DAC9ED3E67520B64DD2F0E8F7EF82426C26376EFA3850F2C4DC3` |

### 1.2. Kết quả kiểm chứng diễn tập R3 (`rehearse-from-dump.sh`)

Kịch bản `STEMotion_BE/deploy/stem-bridge-rehearsal/rehearse-from-dump.sh` đã kiểm chứng 5 điều kiện bất biến trong 1 giao dịch nguyên tử (`psql --single-transaction -v ON_ERROR_STOP=1`):
1. **`[PASS]`** Tổng số bảng `public.stem_*` sau khi chạy `V23–V26` đúng bằng **11 bảng**.
2. **`[PASS]`** Tổng số trigger bảo vệ bất biến (`stem_p5_append_only`) đúng bằng **4 trigger**.
3. **`[PASS]`** Bảng `stem_settings` chấp nhận chế độ `'STRICT'`.
4. **`[PASS]`** Bảng `stem_settings` từ chối giá trị chế độ không hợp lệ (`'INVALID_MODE'`).
5. **`[PASS]`** Chạy lại `V23` lần thứ 2 tự động báo lỗi tiền đề và **rollback toàn bộ giao dịch** mà không làm hỏng dữ liệu hiện có.

---

## 2. Tổng Hợp Kết Quả Cổng R4 — Nghiệm Thu Liên Diện Full-Stack (FE ↔ BE ↔ Render)

Cổng R4 xác nhận toàn bộ luồng nghiệp vụ khi bật đồng thời `app.stem.enabled=true` và `app.stem.artifact.enabled=true` cùng gói dữ liệu mẫu `stem-demo-pack.v1.json` (19 bản ghi cho 3 cấp Tiểu học, THCS, THPT).

### 2.1. Kiểm chứng Backend Catalog & Kịch bản Smoke (`STEMotion_BE`)

Thực thi trực tiếp ngày **14/11/2026** trên `STEMotion_BE`:

1. **`StemDemoCatalogAcceptanceTest` (11/11 PASS — Thời gian: 21.32s):**
   - Import lần 1 tạo đủ 19 bản ghi (`created: 19, skipped: 0`); import lần 2 idempotent (`created: 0, skipped: 19`).
   - Phát hiện xung đột `409 Conflict` nếu sửa nội dung bản ghi không nâng version; chặn `403` với tài khoản không phải Admin; trả `404` khi tắt cờ STEM.
   - Đạt toàn bộ 6 ca nghiệm thu `AT16` cho 3 cấp học:
     - `AT16_PRIMARY_VALID` & `AT16_PRIMARY_INVALID`
     - `AT16_LOWER_SECONDARY_VALID` & `AT16_LOWER_SECONDARY_INVALID`
     - `AT16_UPPER_SECONDARY_VALID` & `AT16_UPPER_SECONDARY_INVALID`

2. **`StemSmokePythonIntegrationTest` / `deploy/stem-demo/smoke-stem.py` (15/15 bước PASS — Thời gian: 22.32s):**
   ```text
   STEP                                     | STATUS | NOTE
   ----------------------------------------------------------------------
   Login ADMIN                              | PASS   | User e2e-admin authenticated
   Login WRITER                             | PASS   | User smoke-writer authenticated
   Login REVIEWER                           | PASS   | User smoke-reviewer authenticated
   Login PRODUCER                           | PASS   | User smoke-producer authenticated
   Catalog Import                           | PASS   | Pack imported (created=0, skipped=19)
   Set STRICT Mode                          | PASS   | Workspace set to STRICT with policy 00000000-0000-0000-0000-000000000005
   Create Project                           | PASS   | Project 2a7a9c53-d246-41e9-961b-b9a3814011ce created
   Init STEM Brief                          | PASS   | STEM brief initialized
   Save Valid Brief                         | PASS   | Valid 6-step brief saved for PRIMARY
   Validate Brief                           | PASS   | Brief validation passed
   Submit For Review                        | PASS   | Script transitioned to IN_REVIEW in STRICT mode
   Fetch Brief Fingerprint                  | PASS   | Fingerprint: 58ffbba8d3aec498...
   Approve Script                           | PASS   | Script successfully approved with matching fingerprint
   Error Test: Invalid Brief Blocked        | PASS   | Submit correctly rejected (400 STEM_VALIDATION_FAILED)
   Error Test: Stale Fingerprint Blocked    | PASS   | Approval correctly rejected (409 STEM_FINGERPRINT_STALE)
   ----------------------------------------------------------------------
   OVERALL RESULT: ALL PASS
   ```

### 2.2. Kiểm chứng Giao diện Trình duyệt Full-Stack (`STEMotion_FE` với `E2E_STEM=1`)

Thực thi trực tiếp ngày **14/11/2026** trên `STEMotion_FE` (Chromium + `E2eServer` + Local Render Worker):

| Bộ kiểm thử | Lệnh chạy | Kết quả | Ý nghĩa nghiệm thu R4 |
| :--- | :--- | :---: | :--- |
| **Unit & Component Tests** | `npx vitest run` | **26/26 files (215/215 tests PASS)** | Đảm bảo toàn bộ component `StemBriefPanel`, `StemRubricPanel`, `StemWorkspaceSettings`, `PublishModal`, `StemReadOnlySummary`, `StemLearningCard` xử lý đúng mọi mã lỗi `400`/`403`/`404`/`409`/`429`. |
| **Production Build** | `npm run build` | **PASS (3.94s, 0 lỗi TS)** | Đảm bảo gói bundle Frontend sẵn sàng deploy lên Vercel/Production. |
| **Playwright E2E — Luồng cũ ở chế độ `OFF`** (`roles-mail`, `wf01`, `wf01b`, `wf02`, `wf03`, `wf04`, `whitelist-ui`) | `npm run e2e` | **27/27 tests PASS** | Chứng minh khi bật `E2E_STEM=1` trên server, các Workspace đang ở chế độ `OFF` hoạt động bình thường 100%, không phát sinh lỗi hồi quy (`AT15`). |
| **Playwright E2E — Luồng STEM `STRICT`** (`e2e/wf05-stem.spec.ts`) | `npm run e2e` | **7/7 tests PASS** | Chứng minh trọn vẹn luồng `DS-05a` (Writer 6 bước $\rightarrow$ Reviewer Script Rubric + `scriptFingerprint` $\rightarrow$ Producer Render MP4 $\rightarrow$ Reviewer Video Rubric + `compositionFingerprint` $\rightarrow$ Producer xác nhận `UNVERIFIED` & Publish LMS), `DS-05b` (`AT03` `400 STEM_VALIDATION_FAILED`) và `DS-05c` (`409 STEM_FINGERPRINT_STALE`). |
| **TỔNG CỘNG E2E TRÌNH DUYỆT** | `npm run e2e` | **34/34 tests PASS (100%)** | **Đạt điều kiện mở Cổng R5.** |

### 2.3. Đối chiếu Số liệu Cam kết `BM01`/`BM04` (82 Test Cases, 52 chạy CI) sau khi Merge

| Chỉ tiêu trong `BM01` / `BM04` | Cam kết lúc Review 2 | Thực tế sau khi merge (14/11/2026) | Ghi chú đối chiếu cho Viva |
| :--- | :---: | :---: | :--- |
| **Mandatory Features (`F-01`..`F-17`)** | 51 TC (29 chạy CI) | **51 / 51 chạy CI (100%)** | Đã gộp `F-11` YouTube (`RF-08`) và `F-14..F-17` STEM (`RF-10..RF-12`). |
| **Main Workflows (`WF-01`..`WF-04`)** | 4 TC (4 chạy CI) | **4 / 4 chạy CI (+1 luồng `WF-05` STEM)** | Tổng cộng 34 kịch bản Playwright E2E trên 8 file spec. |
| **State Transitions (22 chuyển trạng thái)** | 22 TC (17 chạy CI) | **22 / 22 chạy CI (100%)** | Bao phủ đủ Script, Video, `RenderJob`, `WorkspaceMember`. |
| **Agreed NFRs (`NFR-01`..`NFR-05`)** | 5 TC (2 chạy CI) | **2 chạy CI + 4 kịch bản k6 (`NFR-01..04`) = 5 / 5** | Đã hoàn tất đo tải k6 `RF-02` (`21,671 reqs`, `0%` lỗi). |
| **TỔNG CỘNG (`WF-01`: 12, `WF-02`: 25, `WF-03`: 23, `WF-04`: 22)** | **82 TC (52 chạy CI = 63.4%)** | **79 / 82 chạy CI (96.3%) + 3 NFR k6 = 82 / 82 tự động hóa (100%)** | Được bảo chứng bởi **911 bài kiểm thử tự động** (`626` BE JUnit + `215` FE Vitest + `34` Playwright E2E + `36` Render Vitest). |

---

## 3. Sổ Tay Thực Thi Cổng R5 Trên Môi Trường Production (Dành Cho Nhóm / DevOps)

> [!IMPORTANT]
> **Nguyên tắc an toàn Production:**
> Các bước kết nối tới cơ sở dữ liệu Production (Supabase) và máy chủ Production (Hetzner / Vercel) dưới đây **chỉ do thành viên giữ quyền quản trị hạ tầng (DB Custodian / DevOps trong nhóm)** trực tiếp chạy trên máy trạm có chứng thực, tuyệt đối không lưu mật khẩu hay file dump vào Git.

### Bước 1: Sao lưu (Backup) và Xuất Schema-Only Dump từ Production DB
1. Tạo bản snapshot backup trên bảng điều khiển Supabase/PostgreSQL Production.
2. Xuất cấu trúc bảng (chỉ lấy schema, **không** lấy dữ liệu người dùng) ra thư mục nằm ngoài Git repository:
   ```bash
   pg_dump -h <PROD_DB_HOST> -U <PROD_DB_USER> -d <PROD_DB_NAME> \
     --schema-only --no-owner --no-privileges \
     -f D:/temp/prod-schema-only-20261114.sql
   ```

### Bước 2: Chạy `rehearse-from-dump.sh` với file Schema-Only vừa xuất (Xác nhận lần cuối trước khi chạm DB thật)
Khởi động Docker Desktop trên máy và chạy:
```bash
cd D:/capstone/STEMotion_BE
bash deploy/stem-bridge-rehearsal/rehearse-from-dump.sh \
  --dump D:/temp/prod-schema-only-20261114.sql \
  --with-app
```
- **Điều kiện đi tiếp:** Đầu ra in `Dump Rehearsal Result: 7 PASS, 0 FAIL` và `RESULT: ALL PASS`.

### Bước 3: Áp dụng `V23–V26` lên Production DB trong 1 giao dịch nguyên tử (`--single-transaction`)
```bash
cd D:/capstone/STEMotion_BE
psql -h <PROD_DB_HOST> -U <PROD_DB_USER> -d <PROD_DB_NAME> \
  --single-transaction -v ON_ERROR_STOP=1 \
  -f src/main/resources/db/bridge-prod/V23__assert_stem_bridge_prerequisites.sql \
  -f src/main/resources/db/bridge-prod/V24__create_stem_domain.sql \
  -f src/main/resources/db/bridge-prod/V25__create_stem_artifact_lineage.sql \
  -f src/main/resources/db/bridge-prod/V26__allow_stem_strict_mode.sql
```
- **Kiểm tra ngay sau khi chạy:**
  ```sql
  SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'stem_%';
  -- Kỳ vọng: 11
  ```

### Bước 4: Bật cờ tính năng STEM trên Backend Production & Deploy Frontend
1. Trên môi trường Backend Production (Hetzner / Cloud Run), thêm 2 biến môi trường và khởi động lại container:
   ```env
   APP_STEM_ENABLED=true
   APP_STEM_ARTIFACT_ENABLED=true
   ```
   *(Lưu ý: Mặc định các Workspace hiện hữu vẫn ở chế độ `OFF` nên người dùng đang hoạt động không bị ảnh hưởng).*
2. Merge PR của nhánh `feat/stem-t13-e2e-and-matrix-20261114` trên `STEMotion_FE` vào `main` để Vercel/CI triển khai bản Frontend mới nhất.

### Bước 5: Nạp gói dữ liệu mẫu `stem-demo-pack.v1` & Chạy Smoke Test trên Workspace Demo
1. Gọi API nạp 19 bản ghi catalog mẫu bằng token Admin:
   ```bash
   curl -X POST https://<PROD_API_DOMAIN>/api/v1/stem/catalog/import \
     -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"pack":"stem-demo-pack.v1","idempotencyKey":"prod-seed-20261114"}'
   ```
   - **Kỳ vọng:** `{"created":19,"skipped":0}` (hoặc `"skipped":19` nếu đã nạp trước đó).
2. Chạy kịch bản kiểm thử khói trên Workspace dành riêng cho Demo:
   ```bash
   python deploy/stem-demo/smoke-stem.py \
     --base-url "https://<PROD_API_DOMAIN>" \
     --workspace "<DEMO_WORKSPACE_UUID>" \
     --level "PRIMARY" \
     --i-understand-this-writes-demo-data
   ```
   - **Kỳ vọng:** `OVERALL RESULT: ALL PASS`.

### Bước 6: Phương án Rollback Tức Thời (Nếu phát sinh sự cố trên Production)
- **Mức 1 (Tắt tính năng trong < 1 phút, không cần chạm DB):** Đổi biến môi trường `APP_STEM_ENABLED=false` và khởi động lại Backend. Toàn bộ bean STEM ngừng kích hoạt, hệ thống quay về 100% hành vi trước khi bật STEM.
- **Mức 2 (Hạ chế độ của 1 Workspace cụ thể):** Admin vào **Cài đặt STEM của Workspace** chuyển từ `STRICT` về `ADVISORY` hoặc `OFF`.

---

## 4. Bảng Ký Duyệt Nghiệm Thu Liên Diện (Cross-Repo Sign-Off)

| Thành viên | Vai trò phụ trách | Hạng mục kiểm chứng | Trạng thái trên Local/CI |
| :--- | :--- | :--- | :---: |
| **Phan Thế Trung** | Frontend (`STEMotion_FE`), Clip Review & Publishing (`WF-04`, `WF-05`) | - Ma trận nghiệm thu `AT01–AT24` (`docs/stem/AT_MATRIX.md`)<br>- Vitest Unit Tests (**215/215 PASS**)<br>- Playwright E2E `E2E_STEM=1` (**34/34 PASS**, gồm 7 test `wf05-stem.spec.ts`) | ✅ **ĐÃ KÝ DUYỆT (14/11/2026)** |
| **Trần Nguyễn Hoàng Lê** | Production & Rendering (`WF-03`), STEM DB Schema & P3–P6 Engine | - Bridge SQL `V23–V26` (`db/bridge-prod`)<br>- Render Worker `RF-05` (**36/36 Vitest PASS**)<br>- Fingerprint & Artifact Lineage P5 (`StemArtifactP5Test`) | ✅ **ĐÃ HỢP NHẤT (`main`)** |
| **Nguyễn Việt Hoàng** | Backend Core, Auth/Workspace (`WF-01`), Infra & Load Testing | - Tích hợp `RF-10`, `RF-11`, `stem-demo-pack.v1` (**626 JUnit PASS**)<br>- Load Test k6 `RF-02` (**21,671 reqs, 0% lỗi**)<br>- YouTube OAuth2 `RF-08` (**14 JUnit PASS**) | ✅ **ĐÃ HỢP NHẤT (`main`)** |
| **Phan Phước Long Trì** | Script Authoring & AI Grounding (`WF-02`, P6 Grounded AI) | - Luồng tạo kịch bản AI & 6 bước STEM Brief (`wf02-script.spec.ts`, `wf05-stem.spec.ts`)<br>- Kiểm thử Grounded AI P6 (`StemP6HttpTest`, `StemP6.test.tsx`) | ✅ **ĐÃ HỢP NHẤT (`main`)** |
