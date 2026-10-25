# Checklist kiểm thử UX theo luồng

Đầu mối UX QA kiểm tra hành vi người dùng thấy được và ghi lỗi có bước tái hiện.
FE sửa trạng thái nút, loading, thông báo và đồng bộ màn hình; BE chịu trách nhiệm
quyền, chuyển trạng thái và chống tạo dữ liệu trùng ở server.

## Quy tắc phản hồi thao tác

| Tình huống | Hành vi mong đợi |
|---|---|
| Vừa bấm nút gọi API | Nút đổi nhãn ngay: “Đang lưu…”, “Đang gửi…”, “Đang đồng bộ…”; có spinner |
| Request đang chạy | Không gửi trùng; khóa các hành động xung đột, vẫn cho xem nội dung |
| Server xác nhận thành công | Cập nhật trạng thái từ response; một toast ngắn, nút chuyển sang hành động tiếp theo |
| Mạng lỗi / 503 / timeout | Giữ nội dung đã nhập; mở khóa nút; nói rõ chưa hoàn tất và cách thử lại |
| Revision conflict 409 | Tải bản mới nhất, báo xung đột; không tự lặp lại thao tác ghi |
| Chưa đủ điều kiện thao tác | Disable trước khi click; hiện lý do gần nút, không chỉ dựa vào toast |
| Công việc dài như render | Hiện tiến độ/trạng thái cố định; không dùng toast làm chỉ báo duy nhất |

## Kiểm thử hai bản sửa hiện tại

Chạy trên local/preview với dữ liệu thử. Các tình huống lỗi dùng mock hoặc chặn request
trong DevTools; không thực hiện duyệt/render trên dữ liệu production để thử nút.

- [ ] Reviewer mở video chưa có MP4: player hiển thị scenes/theme của composition Producer.
- [ ] Chặn GET composition: không phát kịch bản gốc, nút duyệt bị khóa, có thông báo và “Tải lại bản dựng”.
- [ ] Bỏ chặn và tải lại: player trở lại, thông báo lỗi biến mất, nút duyệt được mở.
- [ ] Cho response project A chậm, mở B: response A không thay player B.
- [ ] Bấm duyệt liên tiếp khi API chậm: Network chỉ có một request approve, nút hiện đang lưu.
- [ ] Approve thất bại: hiện lỗi, không báo thành công, có thể thử lại.
- [ ] Producer vừa sửa scene rồi bấm sync: PUT autosave hoàn tất trước POST sync, baseRevision dùng revision vừa lưu.
- [ ] Autosave thất bại: không gửi POST sync.
- [ ] Trong lúc sync: nút có spinner/nhãn đang đồng bộ; không chỉnh scene/theme, gửi duyệt hoặc render đồng thời.
- [ ] Sync trả 409: tải lại composition và báo kiểm tra bản mới trước khi thử lại.
- [ ] Sync trả 503: mở khóa thao tác, báo lỗi, không hiện toast thành công.
- [ ] Sync xong nhưng tải lại composition lỗi: không thông báo đã hoàn tất thành công trên màn hình.

## Đi toàn bộ luồng tiếp theo

| Vai trò | Các nút cần kiểm tra |
|---|---|
| Writer | Tạo project → tạo AI draft → chỉnh scene → lưu → nghe TTS → gửi reviewer |
| Reviewer | Mở hàng đợi → nhận xét → reply/resolve → trả về có lý do → duyệt script |
| Producer | Mở bản dựng → chỉnh theme/scene → sync → gửi duyệt |
| Reviewer video | Xem đúng bản dựng → trả về/duyệt → theo dõi render → xuất bản |
| Admin | Chọn workspace → thêm/gán thành viên → chỉnh template |

Với từng nút: thử click một lần, double-click, mạng chậm, mất mạng, lỗi API,
reload trang và đổi project khi request chưa xong. Kiểm tra desktop và màn hình nhỏ.

## Mẫu ghi bug

- Màn hình / vai trò / project thử / SHA của bản preview:
- Bước tái hiện:
- Kết quả mong đợi:
- Kết quả thực tế:
- Ảnh/video và status API (không đính kèm token):
- Mức độ: chặn luồng / dễ thao tác sai / khó hiểu / thẩm mỹ.
- Người xử lý và kết quả retest:

Các ô trên là checklist để chạy thủ công, không phải tuyên bố đã pass.

## Triển khai theo backlog — 23/10/2026

Thứ tự đã chốt: xử lý technical debt → audit UI/UX tổng quát theo checklist này →
sửa các điểm còn thiếu của checklist → nhận bug main flow do LeTran test và sửa trực tiếp.
Không coi test tự động là nghiệm thu toàn bộ UX trên browser hoặc production.

### Đợt 1A: đã có code và regression tests local, chờ browser retest

| Backlog | Thay đổi | Bằng chứng tự động | Manual cần chạy |
|---|---|---|---|
| UX-01 | Tạo project lỗi giữ form/input, inline error, chỉ reset/close khi thành công; khóa submit và đóng khi request đang chạy | `CreateProjectModal.test.tsx`: lỗi/retry, repeated submit | Writer tạo thường/AI: slow, 503, Enter nhiều lần; kiểm tra form không mất |
| UX-02 (phần gửi duyệt) | Producer flush pending saves trước submit, không submit nếu save fail hoặc đổi saver/project, khóa chỉnh sửa/sync/render khi gửi, nhãn “Đang lưu và gửi duyệt…” | `reviewService.test.ts`: save-before-submit, failed save, stale saver | Sửa scene/theme rồi gửi ngay; quan sát PUT trước POST; save 409/network fail giữ đúng bản; đổi project khi chờ |
| UX-03 | Library phân biệt lỗi/rỗng, retry, giữ dữ liệu cũ khi refresh fail; bỏ request filters không dùng; ignore response subject cũ | `MediaLibraryView.test.tsx`: fail/retry, failed refresh, stale response | Đổi subject nhanh, mạng chậm, offline/online, clipboard denied |
| UX-04 (phần Reviewer) | Resolve/reopen/delete khóa theo comment; scene comment/reply có synchronous guard | `ReviewerStudio.test.tsx`: resolve double-click | Retest từng nút + reply, delete thất bại, đổi project; Writer/Admin/Publish còn cần audit riêng |
| UX-05 | Resolve/reopen dùng response server; bỏ tên “Reviewer” và giờ client tự đặt | `reviewService.test.ts`, `ReviewerStudio.test.tsx` | Kiểm tra đúng tên người giải quyết và thời gian |
| UX-06 | Poll sau mỗi response, không overlap, backoff lỗi mạng, dừng terminal, ignore project cũ; UI QUEUED/PROCESSING/FAILED có thông báo | `useRenderProgress.test.ts`: slow response, retry delay, completion, stale project | Worker down/restart, queue chậm, failed job, completed job, thử lại; không phát sinh request dồn |

Các mục partial chưa được đóng toàn bộ. UX-07/08/09, pagination, bundle, render reliability,
TTS và các acceptance tests liên quan vẫn theo backlog tổng trong workspace
`docs/TECH_DEBT_UX_BACKLOG_2026-10-23.md`. Đợt này chưa deploy, chưa tick các ô manual ở trên.

Kết quả local đợt 1A: **162 tests / 28 files pass**, TypeScript và production build pass.
Bundle chính còn 1,724.16 kB / gzip 478.06 kB; tối ưu bundle chưa thuộc đợt sửa này.

## Kết quả triển khai FE — 26/10/2026

Phần dưới thay thế trạng thái triển khai đợt 1A ở trên. Các ô đầu tài liệu vẫn dành cho
nghiệm thu thủ công đầy đủ; không tự tick từ unit tests hoặc từ API giả.

### Đã triển khai

- Tạo project/AI draft: khóa submit đồng bộ; giữ form khi callback App thất bại;
  lỗi inline và retry; chỉ đóng/reset khi thành công.
- Writer: gửi duyệt chờ lưu scene; khóa thao tác xung đột; thất bại giữ nội dung.
  Kịch bản đã gửi duyệt có lý do chỉ đọc và khóa điều khiển chỉnh sửa.
  Sync thất bại giữ thời lượng cũ; TTS hủy kết quả cũ khi đổi scene/project, dọn audio URL.
  AI analysis có pending state/guard; gợi ý cũ không ghi đè project mới.
- Reviewer: player dùng composition; load fail khóa duyệt và có tải lại.
  Approve/reject, comment/reply/resolve/reopen/delete có guard; reject fail giữ lý do.
  Resolve dùng metadata server; lỗi QA report và hàng đợi có thông báo riêng.
  Approve video không gọi thêm một yêu cầu render phía FE khi BE đã tự enqueue.
- Producer: flush autosave trước sync/gửi duyệt/render; sync dùng revision vừa lưu.
  Lỗi lưu giữ draft; retry rõ ràng; 409 sync tải bản mới và không tự lặp POST.
  Reload composition fail không báo sync thành công. Lịch sử/render fail có trạng thái cố định;
  mất kết nối yêu cầu kiểm tra lịch sử trước khi tạo job mới.
- Library: error/empty/loading tách biệt, retry, giữ kết quả cũ khi refresh fail,
  bỏ response cũ khi đổi bộ lọc. Không gọi API filters không dùng.
- Admin/members/forms/publish: guard đồng bộ và busy state; khóa thao tác xung đột,
  giữ input khi lỗi; thành viên và AI usage không bị response cũ ghi đè.
  Lỗi tải Admin có retry, không bịa CPU/latency; refresh không báo success trước response.
- UX chung: trạng thái autosave saving/failed, chặn rời màn hình khi lưu thất bại,
  cảnh báo đóng tab khi còn draft chưa lưu; modal có dialog/focus trap/Escape/focus return;
  toast có live region/đóng, warning App giữ đến khi đóng; responsive studios/header/player.
  Version Diff dùng API thật. Các nút xử lý theo quy tắc/số từ được ghi đúng tên,
  không báo đã chạy AI hoặc đo TTS.

### Đối chiếu 12 tình huống hồi quy đầu checklist

| # | Tình huống | Test tự động | Browser local với fixture |
|---|---|---|---|
| 1 | Video chưa có MP4 dùng composition | ReviewerStudio | Đã thấy tiêu đề bản dựng khác kịch bản gốc |
| 2 | Composition lỗi khóa duyệt | ReviewerStudio | Đã thử 503, không có player gốc, có tải lại |
| 3 | Tải lại phục hồi | ReviewerStudio | Đã bỏ lỗi và thấy player/nút duyệt mở lại |
| 4 | Response A chậm không thay B | ReviewerStudio | Chưa chạy thủ công |
| 5 | Duyệt liên tiếp chỉ một request | ReviewerStudio | Đã thấy nút pending/disabled; double-click được kiểm ở test tự động |
| 6 | Duyệt thất bại mở khóa | ReviewerStudio | Đã thử 503, nút mở lại, không success |
| 7 | PUT trước sync, revision mới | App.ux, compositionService | PUT composition trước POST sync, cách nhau 1.22s với delay fixture 1.2s |
| 8 | Autosave lỗi chặn POST sync | App.ux | Chưa chạy thủ công |
| 9 | Khóa scene/theme/gửi duyệt/render khi sync | App.ux + view state | Đã quan sát pending/disabled trên trình duyệt |
| 10 | Sync 409 không lặp POST | App.ux | Chưa chạy thủ công |
| 11 | Sync 503 giữ draft/mở khóa | App.ux | Đã sửa title rồi thử 503, nội dung giữ nguyên |
| 12 | Sync xong, reload lỗi không success | App.ux | Chưa chạy thủ công |

### Kiểm chứng và giới hạn

- Full regression suite local: **181 tests / 35 files pass**; TypeScript và production build pass.
- Browser local: Writer create fail giữ form (25/10); Producer sync/save order/503;
  Reviewer composition fail/retry/approve fail; Admin error và layout mobile.
  Producer/Admin ở 390×844 không tràn ngang document; header/modal đã kiểm tra thêm bằng keyboard tests.
  Modal thành viên: đã xác nhận Escape đóng và focus trở về nút Thành viên trên browser local.
- Môi trường browser chỉ dùng API fixture trong `.audit/ux-fixture.mjs` ở workspace cha,
  không truy cập DB, AI, worker hoặc tài khoản production.
- Chưa nghiệm thu âm thanh/video thật, AI service, worker restart/render artifact,
  quyền/idempotency BE, thao tác đa người dùng hoặc toàn bộ ma trận offline/reload cho từng nút.
  Các việc này vẫn là acceptance tests cần môi trường tích hợp, không phải đã pass.
- Không commit/push/deploy. Pagination, bundle, BE/worker reliability, storage/hosting,
  voice contract và các debt ngoài checklist UX vẫn theo backlog tổng; không được đánh dấu hoàn tất.
  Build hiện tại: main JS 1,736.51 kB / gzip 482.18 kB, còn cảnh báo chunk lớn.
