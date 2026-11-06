# Mapping52ca P2 — subcase P4 riêng từng dòng

05/11/2026. Đọc CONTRACT_REVIEW_CASES.md P2 và thẻ P4 §6. **52 dòng không phải52test, không ca nào được suy toàn bộ PASS từ216 FE tests.** PASS_UI_SUBCASE chỉ áp phần ghi cụ thể. Live cuối2FAILED do BE500; các nhánh chưa tới là NOT_RUN.

| Case | Trigger P2 | Actual P4 | Evidence UI/phạm vi đã làm | Còn thiếu / phase |
|---|---|---|---|---|
| I01 | UC01–42/FR01–55 giữ nguyên, candidate chưa cấp | DOCUMENT_REVIEW | Không cấp số UC/FR, không sửa reports/Word; registry giữ candidate. | Chốt registry/official docs cần scope riêng. |
| R01 | Outcome có locator nhưng nguồn còn UNVERIFIED | PASS_UI_SUBCASE / PARTIAL | StemPanels catalog TEST_ONLY source/outcome metadata và nhãn DRAFT/UNVERIFIED. | Không provenance/chuyên môn chính thức; catalog live NOT_RUN sau GET settings500. |
| C01 | 1 primary + secondary condition/adaptations + channel | PARTIAL | 2enum primary, secondary condition/adaptations editors; null draft save test. | Chưa positive integration đầy đủ mọi variant và sư phạm. |
| C02 | DEPARTMENT_LIBRARY đặt vào primary | PASS_UI_SUBCASE | Primary dropdown chỉ blank/IN_CLASS_SCREEN/GROUP_PRACTICE; channel riêng; client invalid context400 unit. | BE flow chưa tới mutation do runtime500. |
| C03 | Hai primary hoặc secondary trùng/thiếu condition | PARTIAL | Null primary lưu; secondary tối đa4; tính hoàn chỉnh thành finding BE, không tự STRICT. | Duplicate/variant đầy đủ live NOT_RUN; STRICT ngoài scope. |
| C04 | Legacy usage_context=DEPARTMENT_LIBRARY | PASS_UI_SUBCASE / PARTIAL | Legacy apply giữ rawLegacy, gợi ý channel không suy primary; autosave không persist trước manual Save. | Human mapping/legacy thực tế chưa có. |
| C05 | Biến thể task/an toàn mâu thuẫn | PARTIAL | Editor objective/task/contribution/evidence; khuyến nghị tách khi an toàn/nhiệm vụ mâu thuẫn. | Không máy kết luận mâu thuẫn hoặc thay ý kiến chuyên môn. |
| G01 | Thiếu brief khi save/preview ở mọi mode | PASS_UI_SUBCASE / PARTIAL | POST trước PUT cho null brief; nullable draft, giữ tab panel mounted; component tests. | Preview/render scope P5; live save NOT_RUN. |
| G02 | OFF và ADVISORY submit/approve thiếu STEM | PASS_UI_SUBCASE / PARTIAL | WriterStudio test OFF legacy không tạo/validate brief thiếu; OFF/ADVISORY findings không hard gate FE. | Live submit/approve thiếu STEM NOT_RUN sau create500. |
| G03 | STRICT thiếu policy/outcome/context/assessment | DOCUMENT_REVIEW + UI_SUBCASE | Không UI STRICT/activation; component settings chỉ OFF/ADVISORY. | Không persisted STRICT hoặc scientific positive gate test. |
| G04 | AI WARN nhưng deterministic rules hợp lệ | PARTIAL | Findings không tự approve; OFF/ADVISORY không bị nâng thành hard gate; AI code giữ nguyên. | AI grounding/exact-lock P6, STRICT evaluator không chạy FE. |
| G05 | Media QA hard FAIL hiện hữu, mọi mode | DOCUMENT_REVIEW / NOT_RUN | Giữ QA hiện hữu Reviewer/service và regression; không tạo QA data/gate mới. | Producer summary không có media QA fixture/result mới: hiển thị QA bổ sung dời P5. |
| G06 | ModeRevision đổi sau validate trước approve | PARTIAL / LIVE_NOT_RUN | Adapter đã duyệt cùng counter; Unit/component modeRevision→wire baseRevision pass. | GET settings500 chặn PUT mode/policy và stale409 qua BE. BE_INTEGRATION_BLOCKER.md. |
| A01 | System Admin không có active REVIEWER seat | PASS_UI_SUBCASE / PARTIAL | Drawer không init/ghi assessment khi thiếu active seat; raw members exact role/status/user, không Admin bypass. | Live403 assessment chưa tới; server luôn giữ quyền cuối. |
| A02 | Reviewer inactive/khác workspace, target thuộc workspace khác | PASS_UI_SUBCASE / PARTIAL | Raw seat guard fail-closed với missing/INACTIVE status; target workspace exact. | Cross-workspace HTTP permission paths NOT_RUN trong live cuối. |
| A03 | PUT brief baseRevision cũ hoặc absent | PASS_UI_SUBCASE / PARTIAL | Whitelisted CAS0; payload limits/error400; modal409 giữ input; idempotency giữ khi retry cùng payload. | DB atomic/stale mutation qua BE NOT_RUN. |
| A04 | Hash/version/brief thay sau Reviewer mở trang | PASS_UI_SUBCASE / PARTIAL | 409 dialog yêu cầu Reload rõ ràng, không overwrite tự động; expected revisions gửi đúng target. | Fingerprint proof P5; actual approval CAS live NOT_RUN. |
| V01 | Request changes tạo scene IDs mới | PARTIAL | request-changes whitelist changeTarget có key, không assessment; source giữ target/key cho retry. | Copy/remap/24h retry thực qua BE NOT_RUN; không fallback order_no. |
| V02 | Reorder hai scene đang có evidence | PARTIAL | Scene ID dùng cho evidence; existing scene-save queue tests + pure presentation identity guard. | Reorder semantic fingerprint/projector P5; chưa live reorder/evidence flow. |
| V03 | Chèn scene vào giữa | PARTIAL | Không tự tạo evidence cho scene mới; sceneSaveQueue.resolveId cho scene local sau flush. | Chèn giữa+evidence live NOT_RUN. |
| V04 | Xóa scene có evidence | PASS_UI_SUBCASE / PARTIAL | Orphan giữ ID/option/cảnh báo, Writer confirm khi delete; không cascade xóa evidence. | Delete transaction/live orphan/STRICT không chạy trong P4. |
| V05 | Map thiếu/duplicate/cross-version | PARTIAL | 400/409/429 giữ input; request-changes không xác nhận thành công khi lỗi. | Rollback transaction do BE, live copy NOT_RUN. |
| F01 | Alignment giữ token/visibility/order, tăng duration hợp lệ | NOT_RUN / P5 | Không blanket timing=an toàn; P4 chỉ notice conditional. | AT21/semantic/presentation/render hash proof P5. |
| F02 | Giảm duration cắt nhãn/đáp án/kết luận | PARTIAL / P5 | Notice NEEDS_REVIEW cho conditional timing/layout; không tự giữ duyệt. | Duration clipping/hash/coverage thực P5 NOT_RUN. |
| F03 | Caption bỏ không hoặc đổi đơn vị/dấu trừ | PARTIAL / P5 | Không exclude caption token nghĩa; field classification P2 được tham chiếu, pipeline giữ. | Caption semantic hash/word proof P5 NOT_RUN. |
| F04 | at/until/revealAt/strikeAt làm đảo hỏi→đáp hoặc mất nhãn | PARTIAL / P5 | Cảnh báo conditional/unclassified; không auto xác minh cue/layout. | Cue/reveal order/projector P5 NOT_RUN. |
| F05 | motion count/draw/slide đổi hướng hoặc quan hệ nghĩa | PARTIAL / P5 | Không claim motion chỉ là trang trí; notice conservative. | Motion nghĩa/geometry proof P5 NOT_RUN. |
| F06 | hidden/layout/font cắt dấu trừ hoặc nhãn | PARTIAL / P5 | Producer presentation check Scene.id/type và cảnh báo conditional; không coi font/hidden an toàn toàn cục. | Pixel/visibility/hash proof P5 NOT_RUN. |
| F07 | Đổi theme không mã hóa nghĩa, chữ/visibility giữ nguyên | PARTIAL / P5 | Giữ theme/layout tools và ID guard; không claim theme đổi luôn giữ scientific approval. | P-only cần proof không đổi presentation contract: P5 NOT_RUN. |
| F08 | Field/asset/SceneType chưa có classifier | PARTIAL / P5 | Raw scene subtree giữ bởi updater legacy, không whitelist bỏ field lạ; notice NEEDS_REVIEW. | Classifier/projector đầy đủ và UNKNOWN proof P5 NOT_RUN. |
| F09 | Đổi lần lượt semantic fields của đủ13 SceneTypes | DOCUMENT_REVIEW / NOT_RUN | 13 SceneTypes giữ nguyên, không thay types/renderer matrix. | Chưa test semantic đổi đủ13 loại; P5. |
| F10 | Đổi semantic field của đủ13 BlockKinds | DOCUMENT_REVIEW / NOT_RUN | COMPOSED/extraBlocks giữ source; không skip bằng cờ safe. | 13BlockKind semantic matrix proof P5 NOT_RUN. |
| F11 | Object key order khác; set ID reorder; array step reorder | NOT_RUN / P5 | Canonical invariance không triển khai trong P4. | Object key/set/order hash P5, không suy từ FE pass. |
| F12 | Latex/number/unit/case/dấu khác; NaN/Infinity | PARTIAL | Client limits text4000/body262144/depth16/list bounds/context và parse400 có Unit; giữ server authority. | Không normalize LaTeX/unit/hash; canonical/NaN toàn pipeline P5 NOT_RUN. |
| F13 | URL audio ký lại hoặc file đổi | NOT_RUN / P5 | Không audio URL/digest/hash invariant implementation. | Audio/timing contract proof P5. |
| F14 | Policy/source/rubric edition mới hoặc bị thu hồi | PARTIAL | UI hiện policy pin ID/version/unavailable, không tự remap; findings BE nguyên văn. | Policy/source/rubric withdrawal/snapshot P5/P8; live settings500. |
| B01 | IN_QA có clip current | PARTIAL / LIVE_NOT_RUN | Reviewer Drawer phase VIDEO, compositionRevision; approveVideo chung endpoint; atomic assessment wire. | CLIP branch actual live/MP4/snapshot chưa chạy; P5. |
| B02 | IN_QA chưa MP4 | PARTIAL / LIVE_NOT_RUN | Cùng approveVideo service, optional expectedCompositionRevision; không tạo endpoint nhánh mới. | COMPOSITION branch HTTP thực chưa chạy; render/frozen snapshot P5. |
| B03 | Render callback wrong job/input hoặc retry input khác | NOT_RUN / P5 | Không thay callback/job/artifact contract trong P4. | Wrong job/input/retry snapshot P5. |
| B04 | Send-back khi strict STEM fail | PASS_EXISTING_UI_SUBCASE / PARTIAL | Reviewer regression giữ note khi send-back lỗi; service note-only, không assessment/findings gate. | STRICT workspace/live send-back chưa chạy; callback P5. |
| P01 | Clip cũ nhưng brief hiện tại đã thay | NOT_RUN / P5 | Không thêm publication gate/snapshot ở P4. | Brief mới/clip cũ gate P5. |
| P02 | OFF sau từng có assessment | PARTIAL | OFF legacy UI test pass; không xóa history/assessment qua FE; settings adapter không thêm delete. | OFF-after-assessment history/publication live NOT_RUN; P5/P8. |
| P03 | YouTube chưa cấu hình/source chưa hỗ trợ | DOCUMENT_REVIEW | Giữ YouTube503/PUBLISH_TARGET_UNAVAILABLE theo P3 source review; không nhận RF08 hoàn tất. | Không network/YouTube; RF08 29/11/2026 giữ nguyên. |
| AI01 | Embedded Java và remote Python stemContext | NOT_RUN / P6 | Không Java/Python stemContext/provider changes. | AI grounding/schema/exact-lock P6; P0 gap giữ. |
| AI02 | Accept manual/AI suggestion sai source/evidence | PARTIAL / P6 | STEM mutation service whitelist; không auto persist/verify suggestions; Create/AI pipeline không mở. | AI accept whole flow/exact-lock NOT_RUN; P6/scope riêng. |
| L01 | Filter cấp/lớp/outcome/context/channel | NOT_RUN / P6 | Channel checkbox P4 không được tính là library metadata filter. | Library/snapshot filters P6. |
| L02 | Legacy publication chưa brief | NOT_RUN / P6 | Draft legacy UX không được tính thành legacy publication browse proof. | Library browse/export P6. |
| M01 | Fresh V22 so shared đã cutover | DOCUMENT_REVIEW / PARTIAL | Chỉ fresh disposable DB từ test profile P3; không shared equivalent claim. | Shared drift/preflight P8/scope riêng. |
| M02 | Fixture9000/9001 đã áp, muốn thêm23/24 | DOCUMENT_REVIEW | Giữ V9000/V9001 TEST_ONLY + V91000 location P3; không placeholder23/24, không outOfOrder/repair. | Không production reservation/bridge; V23/V24/V25+ vẫn đề xuất. |
| M03 | Shared drift hoặc chưa preflight | NOT_RUN / SHARED | Không kết nối hoặc sửa shared DB; cloud Flyway OFF kế thừa. | Shared preflight/scope riêng chưa duyệt. |
| D01 | Nguồn recovered2 pages so PNG Report1/3 | DOCUMENT_REVIEW | Không sửa Word/BM/reports/native diagrams; UC/FR candidate giữ nguyên. | Native export/T12a chưa đóng. |
| E01 | Không phản hồi cả3 cấp, gaps P1 còn mở | PARTIAL / CHUYÊN_MÔN | UI DRAFT/UNVERIFIED; independent TEST_ONLY fixtures, không phản hồi giả/VERIFIED/ACTIVE. | 3brief4/8/11 và5gap P1 giữ; thiếu chuyên môn/source/kit/mapping không tự chốt. |

Evidence: unit-component-results.json, unit-component.log, integration-results.json/integration.log/be-live.log, SOURCE_MANIFEST.json, SERVICE_ENDPOINT_MAP.md, PRESERVATION_CHECK.json. Các ca F11/F12/F13, P01/P02/P03, L01/L02, G05 được tách riêng, không gộp thành PASS.
