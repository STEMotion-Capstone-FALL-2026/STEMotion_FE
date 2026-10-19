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
