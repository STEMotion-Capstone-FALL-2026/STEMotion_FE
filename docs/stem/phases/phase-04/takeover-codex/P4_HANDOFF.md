# Bàn giao tiếp quản P4 — FE-only — PARTIAL

05/11/2026, Asia/Saigon. Codex tiếp tục phần Antigravity đã dừng; không chạy song song. **P4 chưa đóng/nghiệm thu.** FE code local để Bond review; live integration bị chặn bởi BE P3 HTTP500. Không commit/push/deploy/merge hoặc mở P5.

## Kết quả chính

- Hoàn thiện DTO/services, Writer STEM Tab/Panel, Reviewer Drawer/active seat, Producer brief read-only + identity guard, lỗi400/403/404/409/429, draft/legacy, Read/Assign DRAFT.
- **216FE tests pass (32mới +184pre-existing),39files; typecheck/build exit0.** Không cộng lượt lặp. [TEST_BASELINE](TEST_BASELINE.md) mô tả từng suite/log và giới hạn.
- **Live2cases FAILED** trước mutation/flow STEM: GETsettings và POSTcreate trả500, `StemService` đọc `db.jdbc`/`db.json` null. G06 assign/mode/stale409 và full submit→assessment còn NOT_RUN. [Blocker cụ thể](BE_INTEGRATION_BLOCKER.md), không sửa BE hoặc dùng mock thay Q10.
- Hash201file FE gốc và738file BE P3 trùng ban đầu; HEAD/status giữ nguyên. Script Antigravity không chạy, không đổi. [PRESERVATION_CHECK](PRESERVATION_CHECK.json). Bốn DB tạm P4 đã dừng đúngPID/data dir; process có trước giữ nguyên.

## Nguồn và quyết định

Đã đọc lại đầy đủ CONTRACT_DELTA.md/P3_HANDOFF.md trong clone BE P3 trước code; prompt thực thi P4 gốc đính kèm §1–7 là phạm vi thực thi. Sau khi người dùng bổ sung, đọc toàn văn `C:/Users/LeTran/Downloads/PHASE_04_SCOPE_DRAFT.md` làm thẻ phạm vi; trạng thái DRAFT/câu hỏi chưa chọn trong file không ghi đè quyết định đã duyệt. Hash input tại SOURCE_MANIFEST.json. Đọc thêm52ca P2 và field classification C07 để tách mapping đúng trigger.

Người dùng duyệt **G06 adapter** trong lượt tiếp quản: `modeRevision` là tên nội bộ FE, wire chỉ `baseRevision` của **cùng counter workspace**, không phải counter mới/brief/script. Không sửa BE; nợ đặt tên contract cần phase/quyết định riêng. [Quyết định G06](G06_CONTRACT_CONFLICT.md).

FE: `C:/Users/LeTran/FPT University/2026_FALL/STEMotion/.audit/stem-phase-2026-11-05/phase-04/STEMotion_FE`, HEAD9fe67cf7801b3e971b3c852c80f68214fd13bba7, nhánh feat/stem-p4-isolated-20261105. Chỉ xác nhận SHA, không checkout FE gốc. BE clone: phase-03/STEMotion_BE, HEADf6c6f0bdcdcc6bbaf1f1246f86678d3249dea8e1, nhánh feat/stem-p3-isolated-20261105; source P3 uncommitted vẫn giữ nguyên. Không đọc Render dashboard/cập nhật live trong P4; liveBEf6c6f0b là baseline P0 kế thừa.

P0/P1/P2/P3 đều PARTIAL. C01/C02/cloud Flyway OFF và V23/V24/V25+ giữ là đề xuất. UC43/44, FR61–68 vẫn candidate; FR56–60 auth chưa được tự cấp số. Ba brief lớp4/8/11 DRAFT/UNVERIFIED; giữ G-SOURCE/G-CURRENCY/G-TECH/G-EXPERT/G-MAPPING. BM04 giữ RF09/10:17/11/2026; RF11/12/13:24/11/2026; RF08:29/11/2026, không tự gia hạn.

## Bước0–1: kiểm kê trước code / attribution

[ANTIGRAVITY_REVIEW](ANTIGRAVITY_REVIEW.md) là review trước code, có bảng P4.1–P4.9 lúc nhận + script đọc toàn văn. [FILE_INVENTORY](FILE_INVENTORY.md) ghi đủ5đường dẫn tuyệt đối/hash/disposition và file mục tiêu FE gốc. INPUT_BASELINE.json ghi status/hash201FE +738BE; ANTIGRAVITY_STARTING_DIFF.patch ghi tracked diff lúc nhận.

Không suy +1668/-0 là đã test. Ngoài5file ảnh chụp, khi nhận đã có5tracked changes +377/-13 ở types/services/Writer/Reviewer. Giữ công Antigravity cho khung2panel, context/channel controls, Drawer/judgment labels và phần tích hợp ban đầu. Codex thay logic UUID/revision/authorization/payload/save/error và bổ sung phần thiếu. Không bỏ/xóa/đổi tên file;3script Python được giữ nguyên làm bằng chứng và không rerun.

## Expected / actual P4.1–P4.9

| Mục | Expected | Actual cuối / file locator | Tests / giới hạn |
|---|---|---|---|
| P4.1 | DTO exact + wrapper theo BE | stem.ts; stemClient.ts; scriptService.ts; reviewService.ts. UUID current từ history, CAS0; POSTcreate khác PUTaggregate; whitelist create/save/validate/assessment/changeTarget. endpoint map riêng. |15unit stemClient; live response/mutations bị BE500, không coi wire mới đã live-pass |
| P4.2 | Writer Tab, catalog/context/evidence | WriterStudio + StemBriefPanel/StemLearningFields. Panel giữ mounted khi đổi tab, hai primary; secondary condition/adaptations; channel riêng; grade/level/subject/outcome DRAFT từ metadata; objectives/tasks/contributions/evidence editors. Flush scene aliases trước brief; evidence IDs do BE cấp. |Component null/draft/context/channel/catalog tests pass; businessflow thật NOT_RUN sau create500 |
| P4.3 | Reviewer Drawer, active seat, atomic approval/targeted changes | StemRubricPanel + ReviewerStudio. Raw user/roleREVIEWER/statusACTIVE của workspace target; không init/bật ghi khi thiếu seat; await View trước assessment; null rubricVersionId; same request note+assessment; retry key theo payload, changeTarget giữ target/key. |Reviewer component+seat unit+existing QA regression pass; SCRIPT/VIDEO live approval/CAS/copy chưa tới |
| P4.4 | Producer read-only + ID-safe presentation | ProducerStudio/ProducerView + StemReadOnlySummary; updater chặn đổi id/type và giữ scene cũ khi lỗi; read-only objective/context/pin/findings. Không claim timing/theme/layout an toàn toàn cục; conditional/unclassified NEEDS_REVIEW, projector P5. |Pure identity unit + build; chưa test13type/13block/projector/AT21; mismatch composition-version hiện warning. Không sửa semantic/render pipeline |
| P4.5 |400/403/404/409/429 giữ input | ApiError giữ Retry-After seconds/date; StemErrorNotice; field path aria-invalid/highlight;409dialog Reload explicit;403seat banner;404Dashboard;429countdown/manualresume; scene/composition autosave cooldown giữ payload. Không retry vô hạn. |400/409/429 panel + queue tests pass; actualBE400/409/429paths trong live NOT_RUN |
| P4.6 |Null draft/legacy không auto-map | Null save hợp lệ; empty cần POST trước PUT; OFF legacy submit không create/validate missing brief. Apply legacy giữ raw, không autosave gợi ý cho tới manualSave. Orphan giữ Scene ID và cần Writer xử lý, không cascade. |Component legacy/orphan + Writer OFF submission pass; specialist conflict recommendation chưa thẩm định |
| P4.7 |OFF/ADVISORY, pinned policy, mode CAS | Workspace settings read/assign + settings alias đã duyệt; chỉ OFF/ADVISORY; policy unavailable không remap; findings warning không hard gate. Counter workspace không lấy brief revision. |Unit/component adapter/settings pass; **live GET500 nên assign/mode/stale409 NOT_RUN**, nợ contract đặt tên |
| P4.8 |DRAFT catalog Read/Assign MVP | StemCatalogFields + StemWorkspaceSettings; phân trang và source/outcome labels; dữ liệu metadata thiếu thì không tự bịa cấp/môn. TEST_ONLY fixture component độc lập; seed catalogDRAFT trong DB test clone cho live. Không CRUD/activate. |Component fixture DRAFT/source/grade/subject/outcome pass; catalog/assignment live bị blocker trước flow |
| P4.9 |Unit/Component + real clone integration |216FE pass; typecheck/build pass; real E2eServer clone chạy được nhưng2casefail BE500. [TEST_BASELINE](TEST_BASELINE.md) tách rõ. |PARTIAL. Không Contract Mock thay clone; không browser E2E/MP4/provider/exact-lock |

**Rubric Drawer là đề xuất UI DRAFT của thẻ P4**, không rubric P2 đã khóa, không phản hồi/chuẩn chuyên môn đã thẩm định. Không nâng bất kỳ brief/rubric/catalog lên VERIFIED/ACTIVE. Không STRICT UI hoặc activation.

## Các sửa/làm rõ và phạm vi bổ sung cần thiết

- Sai props/versionNo/`||1` được thay bằng UUID current/`??` để không làm sai0. Không swallow load403/404/500 thành brief rỗng.
- Xóa fake evidence.id và fake rubricVersionId phía client; response evidence không được map theo vị trí request. Evidence editing tạm khóa khi save đang chạy, input brief khác vẫn giữ qua request.
- Save giữ idempotency cùng payload; payload/note mới dùng key mới, không tái dùng key đã bind payload khác. Submit chờ save/flush, không gửi khi form còn operational error hoặc429.
- Legacy suggestion không xóa rawLegacy, không tự suy context từ title/subject/channel, manualSave mới CAS persist. OFF legacy chưa aggregate giữ workflow.
- Giữ optional signatures/undefined note behavior cũ; request-changes không gửi assessment, send-back chỉ note. Không thêm endpoint mới vì tên mô tả trong thẻ.
- Bổ sung helpers/components để dùng chung, không đổi kiến trúc React/Vite. apiClient/sceneSaveQueue/compositionService đổi tối thiểu cho429 và giữ input; tests regression có sẵn được chạy lại. Baseline Reviewer test chỉ thêm fixture target mới, không nới assertion.
- Native loader/cache/build riêng là cấu hình audit để junction node_modules không ghi cache vào FE gốc. Không package/lock/dependency/global install changes.
- DraftReviewModal là ứng viên: PendingDraft chỉ có title/scenes/approach/flow, chưa project/version/StemBrief/objectives; nó phục vụ Create. **Giữ nguyên**, không thêm dữ liệu STEM giả hoặc mở Create flow. StemIcon giữ nguyên, icon không là evidence.
- Cleanup runner được harden sau khi phát hiện pg_ctl detach; runtime hardening chưa rerun sau BE blocker, ghi rõ ở TEST_BASELINE. Không tái chạy Antigravity.

## Mapping, source/hash/diff và rollback

[SERVICE_ENDPOINT_MAP](SERVICE_ENDPOINT_MAP.md) ghi từng wrapper/wire; [CASE_COVERAGE](CASE_COVERAGE.md) tách đủ52dòng, riêngF11/F12/F13, P01/P02/P03, L01/L02, G05. Không biến216FE tests thành52case đầy đủ hoặc thay38test P3 cũ.

[SOURCE_MANIFEST](SOURCE_MANIFEST.json) ghi24code/test files và SHA256 tuyệt đối; [FILE_INVENTORY](FILE_INVENTORY.md) có bảng hash cuối; [PATCH_P4.diff](PATCH_P4.diff) gồm code/test tracked và untracked so với9fe67cf, không build/log/artifact. Hai panel có công Antigravity theo inventory, không ghi toàn patch là Codex tự viết từ đầu. Source P0/P1/P2/P3/master/reports/Word/diagram giữ nguyên.

Rollback chỉ review/revert chọn lọc phần FE P4 trong clone này, đối chiếu Antigravity starting diff/hash và patch cuối; không tự reset/stash/clean hoặc ghi đè FE gốc. Các panel untracked lúc nhận không có git commit gốc; không dùng `git restore` như thể khôi phục được bản panel Antigravity ban đầu. Không xóa3script audit hay drop/down DB shared; không sửa migrations/checksum/history.

## Bước đề nghị sau bàn giao — chưa thực thi

1. Bond review patch/UI/tests + blocker runtime; người dùng quyết scope BE riêng để điều tra/sửa `StemRepository` fields/proxy ở full Spring context, giữ P3 report cũ và bổ sung regression phù hợp. Đây chưa là quyền sửa BE trong P4.
2. Sau scope BE và prompt rerun riêng, chạy lại P4-Q10 full save/submit/assessment, G06 assign/mode/stale409; xác nhận hai video branches nếu được giao. Chưa coi các nhánh đó là xong.
3. P5 projector/3hash/timing/AT21/snapshot/render/publish; P6 AI/library; P8/shared bridge/release vẫn cần thẻ/duyệt riêng. FR38/Word/BM/diagram/T12a và chuyên môn không được tự mở.

**DỪNG sau bàn giao này. P0/P1/P2/P3/P4 vẫn PARTIAL/chưa tự đóng; không commit/push/deploy/merge, không tự chạy P5.**
