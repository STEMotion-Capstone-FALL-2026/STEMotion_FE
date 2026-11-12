# P6 FE — bàn giao

07/11/2026. LOCAL / UNCOMMITTED / PARTIAL. HEAD4dfa65e và nhánh feat/stem-p4-isolated-20261105 giữ. Không commit/push/merge/deploy hoặc mở P7.

- Learning card mới + server combined filters/paging/count, context role/channel riêng, UNVERIFIED/legacy labels, read/export/link reuse. Public fields từ frozen publication, không current brief backfill.
- Panel AI theo hồ sơ STEM trong Writer: explicit request5operations, server resolve target; accept/ignore chỉ ghi lựa chọn, không auto-apply/save. Existing legacy AI endpoints/toolbar giữ, không được coi đã grounded. Không Create/dashboard/full clone.
- apiClient.getPage đọc header, request/get legacy giữ; libraryService thêm options/pagination và card. scriptService thêm grounded request/decision binding; G06 chỉ baseRevision wire không đổi.
- Tests cuối: xem BE docs/stem/phases/phase-06/TEST_SUMMARY_P6.json và TEST_BASELINE_P6.md; 227 cũ giữ source/assertions,31 P6 unit/component/specimens mới;2 live P6 qua BE/Python fake và2 original live P4/G06 tách riêng, không cộng trùng orchestration BE.
- PATCH_P6_FE.diff / SOURCE_MANIFEST_P6_FE.json là delta trên backup, không whole diff P4 so main. Cache/build/log ở BE `.audit/stem-p6`, không ghi node_modules junction/repo gốc.

| FE method / view | BE endpoint | Actual boundary |
|---|---|---|
| getGroundedSuggestion | POST /ai/scripts/{projectId}/grounded | Only server target refs/counters, no client grounding blob |
| decideAiRequest | PUT /ai/requests/{requestId}/decision | Optional grounded binding; request-owner/Writer/current-target checked, no persistence of script |
| getPublishedClips | GET /library/clips | Array + page headers, combined filter before count/page |
| getClipDetail | GET /library/clips/{projectId} | Frozen card/legacy behavior and existing visibility guard |
| getFilters | GET /library/filters | Frozen metadata facets with same predicate |
| StemLearningCard | LibraryItem.learningCard | Task/safety/sources/outside-MP4/provenance, not expert verification |

Limits: no real provider/browser/MP4/pixel/audio or VERIFIED fixtures; no curricular validation, no one-click AI apply. Old P4/P5 test/config/runner bytes giữ, runner P6 riêng. Rollback chỉ selective P6 delta, giữ P4/P5 backup và user assets. Bond/người dùng review riêng rồi mới quyết phase sau. DỪNG.
