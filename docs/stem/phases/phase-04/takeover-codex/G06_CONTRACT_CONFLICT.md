# G06 — quyết định cần người dùng trước settings write

Nguồn1: prompt thực thi P4 §4.7 và prompt bàn giao §2 yêu cầu CAS settings bằng **modeRevision**, không baseRevision.
Nguồn2: P3 CONTRACT_DELTA.md §2 và StemDtos.Settings nhận `{baseRevision,mode,policyVersionIds,defaultPolicyVersionId,idempotencyKey,legacyModeSelection}`; StemModels.WorkspaceMode trả `{workspaceId,revision,mode,policyIds,defaultPolicyId}`; strict unknown fields nên gửi wire modeRevision sẽ400.

BE P3 immutable trong P4. Phương án FE-only trình quyết: UI/service API dùng typed `modeRevision` riêng cho counter workspace, adapter chuyển từ response.revision và serialize sang **wire baseRevision của chính counter workspace**, tuyệt đối không lấy brief/script.baseRevision; thêm unit+real integration test stale settings409. Cách này giữ CAS semantic nhưng tên wire vẫnbaseRevision, nên **chưa coi đáp ứng nguyên văn G06 khi chưa có quyết định**.

Đối chứng: giữ settings read-only/assign write NOT_RUN+blocker tới phạm vi contract riêng; không gửi unknown field hoặc sửaBE. Phần Writer/Reviewer/Producer độc lập tiếp tục theo phạm vi rõ.


## Quyết định người dùng trong lượt tiếp quản 05/11/2026

ĐÃ DUYỆT adapter FE. Tên nội bộ UI/service là `modeRevision`; adapter gửi duy nhất tên wire `baseRevision`, không gửi `modeRevision`. Đây là alias của CÙNG counter workspace (`WorkspaceMode.revision`), không phải counter mới và không lấy revision brief/script. Không sửa BE. Nợ đặt tên contract để quyết riêng ở phase sau. Kết quả test gán policy/mode và stale409 qua BE P3 clone phải theo log cuối; chưa chạy không được ghi PASS.

Thẻ phạm vi bổ sung đã đọc toàn văn tại `C:/Users/LeTran/Downloads/PHASE_04_SCOPE_DRAFT.md`; các lựa chọn đã duyệt và prompt thực thi gốc thắng phần trạng thái DRAFT/câu hỏi còn mở của thẻ. Dòng G06 `baseRevision` trong thẻ được giải thích qua adapter đã duyệt; blanket timing/layout không cảnh báo trong thẻ bị sửa bởi prompt thực thi §4.4.


## Kết quả bàn giao cuối

Adapter đã áp và Unit/Component pass. Live GET stem-settings trả500 vì StemService truy cập db.jdbc null, nên PUT assign/mode và stale409 qua clone **NOT_RUN**. Hai test live cuối FAILED ở prerequisites, không gọi là PASS. Không sửa BE. Xem BE_INTEGRATION_BLOCKER.md, integration.log và be-live.log.
