# P5 FE — Bàn giao tối thiểu, 06/11/2026

**LOCAL / UNCOMMITTED / PARTIAL.** HEAD 9fe67cf, branch feat/stem-p4-isolated-20261105 giữ; patchP4/Antigravity vẫn là baseline, không claim đã viết lại trong P5. Không merge/push/deploy/Create hoặc mở phase sau.

227tests pass =216existing +11P5;40 files; typecheck/build exit0. Original2 live P4/G06 pass qua BEP5clone/fullSpring/JWT/PG26, G06wirebaseRevision giữ. Không sửa P4testsource/config/runner hoặc package/lock/assets. Chỉ8existingproductionfiles đổi theo scope/gate,1newtest; source/delta/hash tổng ở BE.

| FE method / surface | Actual BE endpoint (prefix/api/v1) |
|---|---|
| stemClient.getArtifactStatus | GET `/scripts/{projectId}/stem-artifact-status`, current status/origin/eligibility; no trustedclienthash |
| reviewService.submitVideoForReview / approveVideo / sendBackVideo | ExistingPOST `/scripts/{projectId}/submit-video-review`, `/approve-video`, `/send-back`; P3assessment/seat/CAS unchanged |
| renderService.requestRender/getStatus/retry | Existing `/render/projects/{projectId}/start`, `/render/status/{jobId}`, `/render/jobs/{jobId}/retry`; no worker/renderer edits |
| publicationService.publishInternal | ExistingPOST `/scripts/{projectId}/publish`; optionalack/exactartifactexpectation/idempotencykey, old2args compatibility kept |
| reviewService.getQaReport | GET `/scripts/{projectId}/qa-report`; optional evaluatedAgainst frozeninputref, QA separate STEM |
| libraryService reads | Existing `/library/clips`, `/library/clips/{projectId}`, `/library/filters`; additiveverificationStatus/snapshotId, nofullP6cards |
| G06 settings | ExistingPUT `/workspaces/{workspaceId}/stem-settings`; UI/service modeRevision→wirebaseRevision of SAMEcounter, responseadapter retained |

UI implementation: Producer/StemReadOnlySummary shows technicalCURRENT/NEEDS_REVIEW, classificationUNKNOWN, artifactintegrity/publisheligibility, captured/effectivemode +origin and QAinput. PublishModal explicitlegacyUNVERIFIEDack, knownmismatchblocked, field/errorstatus handling/RetryAfter via existingStemErrorNotice, sameuncertainretrykey, ignoredlateprojectresponse. Publicationstatusread failure không tự tạo claimcurrent/verified; BE always rechecks mutation. Reviewer giữ P4DRAFTrubric và servererror/CAShandling, không redesign.

Extra2files publicationService.ts và PublishModal.tsx được người dùng duyệt gate; không publisher duplicate/newFEproductionfile. Newtest duy nhất `src/components/stem/StemArtifact.p5.test.tsx`. Fullphase handoff và actualcontract ở:

- `C:/Users/LeTran/FPT University/2026_FALL/STEMotion/.audit/stem-phase-2026-11-05/phase-03/STEMotion_BE/docs/stem/phases/phase-05/P5_HANDOFF.md`
- Cùng thư mục BE: CONTRACT_ACTUAL_P5.md, SOURCE_MANIFEST_P5.json, PATCH_P5_FE.diff, PRESERVATION_P5.json, CASE_COVERAGE_P5.md, TEST_BASELINE_P5.md.
- Runtime logs: BE/.audit/stem-p5/fe-final và p4-live-final, không overwrite P4logs.

NoMP4/browser/realAI/TTS/exact-lock. Noexpertverification/ACTIVE/STRICT;3briefs vẫnDRAFT/UNVERIFIED, P0–P5 không tự đóng. Broad dynamictemplate/audio/theme safeproof cònUNKNOWN, không tự giữ approval. Rollback chỉdeltaP5 có hashpreservation, không reset/stash/clean/ghi đè localassets. **DỪNG chờ review, không tự P6.**
