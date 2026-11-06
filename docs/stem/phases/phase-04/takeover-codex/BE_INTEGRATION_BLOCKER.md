# P4-Q10 — Blocker runtime BE P3, không sửa trong FE-only

05/11/2026. BE clone f6c6f0b / feat/stem-p3-isolated-20261105, dùng bytecode .build-p3 đã có của P3, E2eServer + profile stem-p3-test, localhost127.0.0.1:59726, embedded PostgreSQL dùng một lần. V1–V22 + V9000/V9001 + V91000 TEST_ONLY của P3; catalog seed DRAFT nằm riêng trong FE runner. Không copy/sửa BE, không shared DB/provider thật.

## Kết quả cuối thực sự

`integration-results.json`: **2 tests FAILED**, không phải PASS hoặc skip. Bootstrap login/provision test users/workspace/script qua HTTP thật chạy tới được test body. Hai business paths dừng sớm:

| Ca | Điểm dừng thật | Nhánh chưa tới |
|---|---|---|
| live G06 policy/mode/CAS | GET /workspaces/{id}/stem-settings → HTTP500; StemService.workspace:98/settings:97 | PUT adapter, assign/mode, stale409 qua BE: NOT_RUN |
| live thiếu/sửa/save/submit/approve | POST /scripts/{id}/versions/{uuid}/stem → HTTP500 | 400/corrected UI save/submit/atomic approval trong flow này: NOT_RUN |

`be-live.log:26`: `NullPointerException` vì `this.db.jdbc` null. `be-live.log:189`: `NullPointerException` vì `this.db.json` null. Truy cập public fields của StemRepository ở runtime Spring proxy là nghi vấn cần điều tra trong scope BE riêng; P4 không khẳng định đã fix root cause. Không disable exception translation/AOP hoặc dùng reflection để né lỗi, không thay clone bằng Contract Mock.

Hash source/bytecode đầu vào tại SOURCE_MANIFEST.json; PRESERVATION_CHECK.json xác nhận738file BE P3 vẫn trùng hash, HEAD/status giữ nguyên. Kết quả422 BE P3 pass trước đây không bị sửa, nhưng không được dùng thay bằng chứng live P4.

## Những lượt trước giữ để truy vết, không cộng count

- live-r1: config SQL init defer gây circular Flyway/entityManagerFactory; đã bỏ defer trong runner FE.
- live-r2-sandbox: localhost/embedded PG bị Permission denied: getsockopt; retry qua cơ chế cấp quyền, không dùng server khác.
- live-r3-fixture: test include bị merge rộng + fixture subject Science không có trong enum; sửa fixture sang Math, không nới BE.
- live-r4-config: runner live thiếu jsdom sau tách include; sửa config test FE.
- live-r5-scene-fixture: TITLE_HERO thiếu required props; sửa fixture, không nới BE validator.
- Lượt cuối: BE runtime500 ở trên. Đây là blocker còn tồn tại, không rerun vô hạn.

## Cleanup và giới hạn runner

Java do runner tạo đã dừng. Windows pg_ctl tách PostgreSQL khỏi cây Java; kiểm tra CIM phát hiện4DB native còn sống. Đã đối chiếu PID/postmaster.pid/data dir/thời điểm với từng startup log (`OWNED_PG_IDENTITY.json`) rồi pg_ctl fast shutdown đúng4DB (`OWNED_PG_SHUTDOWN.json`, tất cả exit0/still_alive0). Không xóa data dir;10process PostgreSQL tạo lúc10:56 có trước lượt Codex được giữ nguyên (`POSTGRES_REMAINING_READ_ONLY.json`). Không suy `LIVE_RUN_RESULT.cleaned` lịch sử thành đủ cleanup PG; dùng chứng cứ shutdown bổ sung.

Runner FE đã được làm rõ cleanup bằng log EmbeddedPostgres + PID/CIM + pg_ctl trước khi dừng Java. **Chỉnh runner cleanup này chỉ kiểm syntax Python, chưa chạy lại sau blocker BE**. Không dùng nó như bằng chứng test runtime đã pass. Không tự chạy lại/P5; cần scope riêng sửa BE và duyệt rerun P4-Q10.
