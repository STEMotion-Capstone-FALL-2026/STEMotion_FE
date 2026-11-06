# P5 — FE consumer / method ↔ endpoint, Chặng1

05/11/2026. **DESIGN ONLY; source/DTO/FE tests/config/runner chưa sửa hoặc chạy.** Baseline F9fe67cf và patch P4 uncommitted giữ; INPUT_BASELINE.json + PRE_P5_SOURCE.patch ghi trước tài liệu P5. Q01 B chỉ UI tối thiểu stale/unknown/publish eligibility/snapshot origin/QA, không redesign/Create/P6 cards.

Contract mới ở B tuyệt đối: `C:/Users/LeTran/FPT University/2026_FALL/STEMotion/.audit/stem-phase-2026-11-05/phase-03/STEMotion_BE/docs/stem/phases/phase-05/CONTRACT_DELTA_P5.md`. Các method NEW bên dưới là proposal, chưa tồn tại. Prefix endpoint đầy đủ `/api/v1`; apiClient hiện prefix sẵn.

| Method / owner | BE method/path | Trạng thái / delta đề nghị |
|---|---|---|
| NEW stemClient.getArtifactStatus (candidate tên) | GET `/api/v1/scripts/{projectId}/stem-artifact-status` | New read DTO ngoài P3 View để không phá P3 strict shape; optional clipId/publicationId. Hiển thị server state, không compute trusted hash FE. |
| reviewService.submitVideoForReview / submitSavedVideoForReview | POST `/api/v1/scripts/{projectId}/submit-video-review` | Existing; flush composition trước submit như cũ; server snapshot. Không create brief giả. |
| reviewService.approveVideo | POST `/api/v1/scripts/{projectId}/approve-video` | Existing note+assessment; server current target/hash recheck; outer artifactExpectation candidate nếu cần, giữ stemAssessment P3 DTO. |
| reviewService.sendBackVideo | POST `/api/v1/scripts/{projectId}/send-back` | Existing note-only, không nhận assessment hoặc bị finding khóa đường sửa. |
| compositionService.get/save | GET/PUT `/api/v1/scripts/{projectId}/composition` | Existing baseRevision CAS; no arbitrary safe timing claim; server technical compatibility mới qua status endpoint. |
| renderService.requestRender | POST `/api/v1/render/projects/{projectId}/start` | Existing; server frozen input/snapshot. Không gửi verified/client hash claim. |
| renderService.getHistory/getRenderStatus | GET `/api/v1/render/projects/{projectId}/jobs`; GET `/api/v1/render/status/{jobId}` | Existing; snapshot origin/status qua candidate read helper, không mặc định job mới nhất là approved artifact. |
| renderService.retryRender/cancelRender | POST `/api/v1/render/jobs/{jobId}/retry`; DELETE `/api/v1/render/jobs/{jobId}` | Existing; frozen input/new attempt lineage do BE. Không callback từ FE. |
| reviewService.getQaReport | GET `/api/v1/scripts/{projectId}/qa-report` | Existing QA criteria/ngưỡng; P5 bind exact artifact input, show evaluatedAgainst và UNKNOWN khi chưa có result phù hợp. |
| publicationService.publishInternal | POST `/api/v1/scripts/{projectId}/publish` | **Publisher actual ngoài allowlist cụ thể**. Body hiện chỉ targets/title. Optional ack/expectations/key cần scope clarification trước sửa. Không tạo publisher mới trong stemClient để né boundary. |
| libraryService.getPublishedClips/getClipDetail/getFilters | GET `/api/v1/library/clips`; `/api/v1/library/clips/{projectId}`; `/api/v1/library/filters` | Existing; consume immutable snapshot-backed existing fields + LEGACY_UNMAPPED; full new curriculum filters/card P6 ngoài scope. |
| scriptService.saveWorkspaceStemSettings (P4 baseline) | PUT `/api/v1/workspaces/{workspaceId}/stem-settings` | Giữ FE modeRevision → wire baseRevision; response revision → alias cùng counter. Không rename/sửa wire. |

## UX tối thiểu trong allowlist

StemReadOnlySummary/Producer/Reviewer chỉ đọc technical freshness, classification UNKNOWN, publish eligibility+reason, snapshot origin (đúng version/job/clip/publication), effective vs captured mode, media QA riêng scientific findings. Không show CURRENT như VERIFIED. Không hiển thị16MiB full snapshot hoặc signed URL/digest secrets. 400 details giữ input,403 seat banner,404 visibility handling,409 explicit reload giữ input,429 Retry-After không loop autosave; P4 behavior giữ. Server guard vẫn quyết quyền/publish, không chỉ disable button FE.

**Gate FE:** actual flow publish nằm ở `src/services/publicationService.ts` và `src/components/modals/PublishModal.tsx`. Prompt §4.8 chưa liệt kê hai file; không sửa trong Chặng1. Đề nghị bổ sung đúng hai file cho legacy-ack/expectation display+request và tests P5 mới; giữ P4 test source/config/runner. Nếu không duyệt, phần display trong allowlist tiếp tục sau migration gate nhưng flow legacy acknowledgement qua UI phải ghi NOT_RUN/blocker, không claim complete.

## Tests sau gate, chưa chạy

Vitest/RTL mới cho stale vs warning, unknown, snapshot vs current, QA result/input origin, G06 alias giữ; regression216 FE và2live P4/G06, không sửa source/assertions/config/runner P4. Live B01/B02 qua real clone BE + JWT/embeddedPG, fake render/callback; no MP4/browser/provider thật. Chưa có test/PASS mới tại Chặng1.
