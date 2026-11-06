# FE method ↔ BE endpoint thực tế

05/11/2026. Prefix `/api/v1`. DTO theo CONTRACT_DELTA.md + source P3 đọc lại; không theo candidate P2. `projectId` là ClipProject ID; `versionId` là UUID thật từ history, không phải số version hoặc fallback `1`.

| FE method / caller | Method và path BE | Request / response / xác nhận |
|---|---|---|
| scriptService.getStemTarget | GET /scripts/{project}; GET /scripts/{project}/versions | Tìm duy nhất isCurrent; draftRevision có thể0; fail-closed khi không xác định được |
| getStemBrief | GET /scripts/{project}/versions/{version}/stem | View có brief:null là thành công legacy; không biến403/404/500 thành brief rỗng |
| createStemBrief | POST /scripts/{project}/versions/{version}/stem | Create{schemaVersion,expectedScriptRevision,idempotencyKey}. **POST riêng có thật**, không phải alias PUT |
| saveStemBrief | PUT cùng path /stem | Aggregate CAS brief baseRevision + expectedScriptRevision; whitelist brief/evidence; bỏ trường UI/server-owned |
| validateStem | POST cùng path /stem/validate | expectedBriefRevision,expectedScriptRevision,phase,expectedCompositionRevision?; header Retry-After được giữ qua ApiError |
| getCatalog | GET /stem/catalog?kind=&page=&size= | List CatalogVersion; size1–100, phân trang; DRAFT/UNVERIFIED; không public CRUD |
| getWorkspaceStemSettings | GET /workspaces/{workspace}/stem-settings | Wire revision/policyIds/defaultPolicyId → client modeRevision/policyVersionIds/defaultPolicyVersionId |
| saveWorkspaceStemSettings | PUT cùng path /stem-settings | **Adapter đã duyệt:** client modeRevision → wire baseRevision của CÙNG counter workspace; chỉ wire baseRevision, không field modeRevision. OFF/ADVISORY. Unit/component pass; live PUT/409 NOT_RUN do GET500 |
| hasActiveReviewerSeat | GET /workspaces/{workspace}/members | Raw role REVIEWER + status ACTIVE + userId trùng; missing/inactive/khác user không được ghi assessment; không cached workspace/Admin bypass |
| reviewService.submitReviewDecision(APPROVED) | POST /scripts/{project}/approve | note + optional stemAssessment; criteria/evidence IDs whitelist, CAS atomic do BE |
| submitReviewDecision(CHANGE_REQUESTED) | POST /scripts/{project}/request-changes | note + changeTarget exact/key; không gửi assessment vào route này; BE copy/remap identity |
| approveVideo | POST /scripts/{project}/approve-video | note + optional stemAssessment với expectedCompositionRevision; giữ endpoint chung cho CLIP/COMPOSITION |
| sendBackVideo | POST /scripts/{project}/send-back | Chỉ note. Không thêm finding/assessment gate |
| submitVideoForReview (có sẵn) | POST /scripts/{project}/submit-video-review | Tên FE có sẵn, không tự tạo route submitForVideoReview khác |
| projectService.submitForReview (có sẵn) | POST /scripts/{project}/submit-review | Flush scene/brief trước submit; OFF legacy chưa brief bỏ /validate vốn cần aggregate; findings OFF/ADVISORY không bị FE nâng thành STRICT |
| compositionService (có sẵn) | GET/PUT /scripts/{project}/composition | Giữ pipeline; bổ sung cooldown429, giữ payload lỗi; Producer presentation giữ Scene.id/type |

`TECH-EVIDENCE`, `TECH-POLICY` được xác nhận trong StemService/StemValidator P3, không tự gán ruleId mới cho BE. Mã FE riêng có prefix FE_; UI hiển thị mã/findings BE trả về nguyên văn. Không thêm endpoint approveScript/requestChanges/sendBackToProduction chỉ vì thẻ dùng tên mô tả đó.

G06 là nợ đặt tên contract cho phase riêng: alias FE không tạo counter mới, không lấy revision brief/script làm CAS mode. Không sửa BE hoặc rename DTO wire. Không tuyên bố live gán policy/mode/409 đã pass.
