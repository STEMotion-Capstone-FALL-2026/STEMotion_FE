# Bước0–1 — Review tiếp quản Antigravity, trước code Codex

05/11/2026. Snapshot source read-only trước sửa: INPUT_BASELINE.json, ANTIGRAVITY_STARTING_DIFF.patch và ORIGINAL_FE_STARTING_DIFF.patch. FE cô lập9fe67cf7801b3e971b3c852c80f68214fd13bba7, nhánhfeat/stem-p4-isolated-20261105. Tìm --hidden --no-ignore toàn workspace (bỏ.git/node_modules/build), mỗi tên5file chỉ có1bản, tất cả trong scope cô lập/auditP4; không file panel ở FE gốc. Không có thẻ PHASE_04_SCOPE.md trong workspace hoặc text/markdown attachments đã tìm; prompt thực thi gốc đính kèm chứa§1–7/P4.1–P4.9 là chỉ dẫn phạm vi hiện có. Không suy nội dung thẻ còn thiếu.

Ngoài ảnh chụp, git hiện có5trackedfiles đã đổi: WriterStudio, ReviewerStudio, scriptService, reviewService, stem.ts (+377/-13), cộng2panel untracked. Điều này chứng minh state hiện tại đã có tích hợp một phần, không chứng minh các script đã chạy hoặc panels đã đúng/test. Chưa ghi nhận test của Antigravity. Đã đọc toàn văn2panel và3update scripts, không chạy script nào.

## File Antigravity / giữ–sửa–bỏ

Đường dẫn tuyệt đối và SHA256 trước sửa của cả5file nằm trong INPUT_BASELINE.json.antigravity_files. Ba script nằm dưới C:/Users/LeTran/FPT University/2026_FALL/STEMotion/.audit/stem-phase-2026-11-05/phase-04/; hai panel dưới .../STEMotion_FE/src/components/stem/.

| File / locator trước sửa | Actual / disposition |
|---|---|
| StemBriefPanel.tsx:34–45,49–130,135–196 |Giữ khung Tab,2primary enums, DRAFT/UNVERIFIED, UI context/evidence và nguyên tắc giữ input. Cần sửa: không khởi tạo qua POST khi brief null; save PUT ngay sẽ404; dùng err.data thay vì ApiError.details; không Retry-After header; fresh idempotency mỗi retry; loading/error dễ hiện thành mặc định như thành công |
| StemBriefPanel.tsx:230–257,260–280,350–728 |Cần sửa: legacy rawLegacy bị xóa; tự bịa evidence.id ev_timestamp trái BE ownership; không task selector; không catalog/grade/subject/outcome editor, objectives chỉ placeholder, không editor tasks/contributions; primary key|string; chưa autosave/parent dirty preservation qua tab;409 là banner chưa dialog;403/404 chưa đúng |
| StemRubricPanel.tsx:130–215,225–472 |Giữ Drawer/thang judgment/UI label draft. Cần sửa: init trước fetch, ||1 làm sai0revision; rubricVersionId bịa rubric.stem.v1.default bị BE reject; keys thay đổi/cached không đúng target; chưa evidence pick/approve button, subtitle gọi chuẩn thẩm định quá mạnh. Phải mô tả rubric là đề xuất UI DRAFT, không rubric P2 đã khóa |
| update_writer.py:3–168 |Đọc/ghi đè toàn WriterStudio.tsx theo đường dẫn tương đối dưới cloneP4, nhiều str.replace không assert coverage/idempotency, không delete/ngoài scope, không secret. Có wrapper props cũ sai, revision/versionNo sai, validation trước flush và hard-block OFF/ADVISORY. **Giữ script nguyên làm evidence, không chạy lại**, sửa thủ công phần cần thiết |
| update_reviewer.py:3–163 |Ghi đè ReviewerStudio.tsx tương đối cloneP4; không delete/ngoài scope/secret. Role defaulttrue/catchtrue fail-open, dùng cached workspace, sai lowercase/uppercase; service call signatures sai; đoạn mount Drawer replace không hiện trongdiff. **Không chạy lại**; giữ file nguyên và sửa thủ công |
| update_fe.py:4–128 |Absolute base_dir đúng cloneP4 đã định vị, chỉ ghi scriptService/reviewService, không delete/secret/đường dẫn lạ. PUTsettings baseRevision không đáp ứng G06; type/arguments lệch consumer; string replace có thể skip/mất tương thích. **Không chạy lại**, giữ nguyên evidence, sửa thủ công đúng contract |

## Bảng P4.1–P4.9 — trạng thái lúc nhận, chưa code Codex

| Mục | Trạng thái | Evidence và phần còn thiếu |
|---|---|---|
| P4.1 DTO/services |Cần sửa |stem.ts:378–538, scriptService:621–666, reviewService:114–155. Types rộng|string, originalSceneId không phải request; settings BE WorkspaceMode là revision/policyIds/defaultPolicyId, không policyVersionIds. Service signatures lệch các callsite Reviewer. Version UUID bị nhầm script.version display number |
| P4.2 Writer |Một phần/Cần sửa |WriterStudio:90–119,506–598,633–650. Có tab và mount nhưng versionNo làm versionId, ||1 sai0, submit dùng briefRevision0/hardgate cảOFF, validation lỗi bị swallow; panel thiếu catalog/objective/task/contribution editors |
| P4.3 Reviewer |Một phần/Cần sửa |ReviewerStudio:543–636,654–674; panel có file nhưng không mount ở cuối diff. Role fail-open, callservice wrong payload, chưa exact target/phase/composition revision và safe retry |
| P4.4 Producer |Chưa làm |Không diff ProducerStudio/ProducerView/DraftReviewModal. Chưa read-only brief hoặc presentation ID guard |
| P4.5 Error UX |Một phần/Cần sửa |Panel err.data vs ApiError.details; header Retry-After bị apiClient bỏ;429 localcounter chỉ đọc body;409banner;403/404/fieldpaths chưa đủ; sceneSaveQueue không cooldown |
| P4.6 Null/legacy |Một phần/Cần sửa |UI null có sẵn, nhưng không POSTcreate empty; legacy acceptance xóa rawLegacy; chưa CAS confirm đầy đủ |
| P4.7 Mode/policy |Cần sửa / blockerG06 |Antigravity wrapper dùngbaseRevision; P4G06 yêu cầumodeRevision. BE P3 source/contract đang Settings.baseRevision và responseWorkspaceMode.revision. Không được sửaBE hoặc ngầm gửiunknownmodeRevision. Cần quyết adapterFE hay giữread-only/block assign |
| P4.8 Catalog DRAFT |Chưa làm |Chỉ có getCatalog wrapper; chưa selector/read-assignUI, không seedofficialdata |
| P4.9 Tests |Chưa có evidence/NOT_RUN |Không test Antigravity được ghi; chưa type/unit/component/integration baseline; không suy +1668/-0 làPASS |

## Nguồn / phần chắc chắn và blocker

Đã đọc lại toàn CONTRACT_DELTA.md vàP3_HANDOFF.md từ clone BE P3. Đối chiếu StemDtos.java/StemModels.java read-only: settings input baseRevision, response revision/policyIds/defaultPolicyId; brief response modeRevision; assessment expectedModeRevision. G06 là mismatch cụ thể cần trình lại, phần settings write dừng tới khi có quyết định. createStemBrief là wrapper **POST riêng có thật**, saveStemBrief làPUTaggregate có thật. TECH-EVIDENCE vàTECH-POLICY là ruleId server source đã có; vẫn hiển thị findings/rawcode, không bịa verdict. Không nâng rubric/content ACTIVE/VERIFIED.

Giữ công của Antigravity cho khung2panel và5tracked modifications hiện có. Mọi chỉnh sau snapshot được ghi riêng Codex delta. Không đổi tên/xóa script hoặc panel chỉ để thay tác giả. Các script chứa replacement không đủ an toàn để chạy lại; code sẽ sửa thủ công trong clone đã định vị, không động repoFE gốc/BE P3.


## Bổ sung sau review trước code (không thay lịch sử bước0–1)

Người dùng đã cung cấp thẻ tại C:/Users/LeTran/Downloads/PHASE_04_SCOPE_DRAFT.md và duyệt G06 adapter trong lượt tiếp quản. Thẻ đã đọc toàn văn/đối chiếu với prompt thực thi; không còn gap thiếu file thẻ. G06 adapter UI modeRevision → wire baseRevision cùng counter đã áp; actual live500 và phần chưa test ghi riêng tại P4_HANDOFF.md, không đổi status ban đầu thành đã xong.
