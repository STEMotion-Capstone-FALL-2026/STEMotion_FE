# Checklist STEMotion_FE — đối chiếu đề cương (cập nhật 2026-10-14)
> Trạng thái: treo chờ họp team.

Snapshot: working tree sạch trước audit, nhánh `main`, commit `fb9f48f148cfbcde8085d9260a4ab9fbb687b244`. `git show d6843bf` không resolve trong Git local; không fetch hoặc thay nhánh. Không coi seed mô tả commit này là bằng chứng implementation của snapshot hiện tại.

Nguồn chuẩn: `../FA26SE054_STEMOTION_AI_ASSISTED_STEM_VIDEO_PRODUCT_hungld.pdf`, trang 2–4 (GVHD Lại Đức Hùng). Đã đọc trực tiếp PDF; tài liệu 10/10 chỉ dùng làm gợi ý kiểm tra.
Ba diagram được khôi phục trực tiếp từ mxfile nhúng trong `../Diagram/DB Diagram.drawio.png`: các page `Conceptual ERD chính` (zSC5lsinmhmytekVOFV1), `Usecase Diagram chính` (_NVHilQU-TT4CWfU4AiK), `DB Diagram` (hR3o_WWvYJ1BRLBpgeb0). Đối chiếu thêm các PNG Week2 và Usecase. Không dùng bản Phase0 DRAFT thay cho diagram đã accept. PNG không có số dòng: định danh page/cell dùng cho nguồn diagram; từng mục bên dưới vẫn có evidence code file:dòng hoặc commit.
Quy ước: “Đã làm” = có implementation trong phạm vi ghi rõ, không đồng nghĩa đã nghiệm thu/production. “Chưa làm” gồm bug mở và việc chưa xác minh được; “Thiếu” là khoảng cách với PDF/diagram. Todo có thể nhắc lại khoảng cách để giao việc, không phải chức năng độc lập. Phần “Thừa” phân biệt mở rộng thực sự với chi tiết triển khai/hardening vốn phục vụ yêu cầu đã đăng ký. Không có bằng chứng duyệt chính thức các mở rộng trong các nguồn đã đọc.

## ✅ Đã làm

- FE-01: React/Vite/Tailwind và Remotion Player có dependency thực; Vite hiện 8.3.4, không còn snapshot Vite 5 của báo cáo cũ. Evidence: `package.json:16`, `package.json:47`.
- FE-02: Login gọi BE, lưu JWT và đọc lại `/auth/me`. Evidence: `src/services/authService.ts:62`, `src/services/authService.ts:81`.
- FE-03: Tạo project với môn, khối và tùy chọn AI; lưu project qua service. Evidence: `src/components/modals/CreateProjectModal.tsx:16`, `src/services/projectService.ts:41`.
- FE-04: Sửa scene có hàng đợi lưu; thêm/xóa scene gọi save thật. Evidence: `src/services/scriptService.ts:234`, `src/services/scriptService.ts:453`, `src/services/scriptService.ts:478`.
- FE-05: Submit review và lấy history/diff script qua BE. Evidence: `src/services/projectService.ts:58`, `src/services/projectService.ts:63`, `src/services/projectService.ts:68`.
- FE-06: Review script/clip và comment hỗ trợ sceneId hoặc timestamp. Evidence: `src/services/reviewService.ts:20`, `src/services/reviewService.ts:26`, `src/services/reviewService.ts:38`.
- FE-07: Bốn AI action resegment/grade/extract/terms và thao tác ghi ACCEPTED/IGNORED đã có ở FE; phụ thuộc BE staging có endpoint tương ứng. Evidence: `src/services/scriptService.ts:10`, `src/services/scriptService.ts:44`, `src/services/scriptService.ts:59`, `src/App.tsx:737`.
- FE-08: Render đã nối API thật và polling, không còn kết luận “nút render mock” của 10/10. Evidence: `src/App.tsx:351`, `src/App.tsx:360`, `src/App.tsx:379`, `src/services/renderService.ts:46`.
- FE-09: Player preview full/single scene, có seek/frame callback. Evidence: `src/components/RemotionPlayerWrapper.tsx:20`, `src/components/RemotionPlayerWrapper.tsx:42`, `src/components/RemotionPlayerWrapper.tsx:87`.
- FE-10: Catalog có đúng 12 scene types, gồm ILLUSTRATED_EXPLAINER; không gọi registry director là một scene type thứ 13. Evidence: `src/types/stem.ts:5`, `src/constants/templatesCatalog.ts:15`, `src/constants/templatesCatalog.ts:138`.
- FE-11: KaTeX pin 0.18.2 và renderer không bật trust; đây là fix đã có, khác hai bug seed chưa đóng. Evidence: `package.json:24`, `src/utils/latex.ts:6`, `src/utils/latex.ts:10`; commit `fb9f48f`.
- FE-12: Publish nội bộ gọi BE, YouTube được ghi rõ chưa khả dụng. Evidence: `src/services/publicationService.ts:12`, `src/components/modals/PublishModal.tsx:82`.

## ❌ Chưa làm

- FE-13: Bug fail-closed regression tại `d6843bf` do team báo vẫn mở để kiểm tra đúng snapshot, KHÔNG ghi đã sửa. Local hiện có guard reject scenes rỗng và dữ liệu khoa học thiếu; chưa có commit nêu trên để tái hiện regression. Evidence đối chiếu: `src/services/scriptService.ts:75`, `src/services/scriptService.ts:80`, `src/services/scriptService.ts:100`; snapshot `fb9f48f`.
- FE-14: Bug localhost hardcode `tts-preview` tại `d6843bf` do team báo vẫn mở/chưa xác minh trên bản này: tìm toàn bộ `src` không có `tts-preview`. Có hardcode localhost render ở hai component cũ, không đủ để đồng nhất với bug tts-preview. Evidence: `src/components/ProducerView.tsx:37`, `src/components/VideoCreationStudio.tsx:146`; snapshot `fb9f48f`.
- FE-15: Chưa có UI dynamic pacing chọn auto/target duration; form vẫn mô tả 5–7 cảnh, service mặc định gửi 60 giây. Evidence: `src/components/modals/CreateProjectModal.tsx:8`, `src/components/modals/CreateProjectModal.tsx:106`, `src/services/scriptService.ts:67`.
- FE-16: Chưa nối Step 1 narrative brief/arc vào form/request/response FE; generate chỉ gửi topic/subject/grade/targetDurationSec. Evidence: `src/services/scriptService.ts:63`, `src/services/scriptService.ts:69`, `src/components/modals/CreateProjectModal.tsx:29`.

## ⚠️ Thiếu so với đề cương

- FE-17: Google OAuth chưa có luồng UI; login hiện email/password (PDF tr.3, UC cell hrSEnK2m8x9lOrE9KC7D-13). Evidence: `src/components/LoginScreen.tsx:69`, `src/services/authService.ts:62`.
- FE-18: YouTube Data API/connected channel chưa tích hợp; publish chỉ INTERNAL_LIBRARY/LMS (PDF tr.3). Evidence: `src/services/publicationService.ts:14`, `src/components/modals/PublishModal.tsx:82`.
- FE-19: Chưa có editor caption timestamp từng từ; `caption` hiện là câu mô tả của illustrated scene, không phải auto-caption alignment (PDF tr.3; DB scenes.captions_data). Evidence: `src/components/views/ProducerStudio/IllustratedExplainerInspector.tsx:75`, `src/services/scriptService.ts:187`.
- FE-20: Media library UI chỉ nhận một `script`, chưa danh sách/filter môn + khối như PDF tr.3; không đánh dấu library hoàn chỉnh dù BE có API filter. Evidence: `src/components/views/MediaLibrary/MediaLibraryView.tsx:5`, `src/components/views/MediaLibrary/MediaLibraryView.tsx:39`.
- FE-21: Admin portal chủ yếu membership/provision account, chưa dashboard AI cost/usage và object storage; có service metrics không chứng minh dashboard đã đủ (PDF tr.3–4). Evidence: `src/components/views/AdminPortal/AdminPortal.tsx:20`, `src/components/views/AdminPortal/AdminPortal.tsx:64`, `src/services/adminService.ts:37`.
- FE-22: Stack chưa có React Query, Recharts/Chart.js trong dependencies; client tự gọi API. Chưa thấy shadcn/ui component system trong src (PDF tr.4). Evidence: `package.json:16`, `src/services/apiClient.ts:39`.
- FE-23: Chưa đủ bằng chứng so sánh hai bản clip render; diff hiện theo script versions (PDF tr.2). Evidence: `src/services/projectService.ts:63`, `src/services/projectService.ts:68`.

## ➕ Thừa so với đề cương (làm ngoài đề cương, chưa được duyệt chính thức)

- FE-24: Step 1 narrative arc là mở rộng UX ngoài mô tả AI segmentation/drafting trong PDF; implementation mới ở BE feature branch, CHƯA có FE ở snapshot này. Evidence: `../STEMotion_BE/src/main/java/com/stemotion/domain/ai/service/AiScriptService.java:70`; BE commit `0525475`; `src/services/scriptService.ts:69`.
- FE-25: Dynamic scene pacing theo độ phức tạp/Kurzgesagt là mở rộng chính sách ngoài PDF; FE local chưa có UI điều khiển. Evidence: `src/components/modals/CreateProjectModal.tsx:106`, `src/services/scriptService.ts:67`; BE commit `3c13c06`.
- FE-26: Director template/asset registry có schema, slot allowlist và visual plan, cụ thể hơn template form trong PDF; không thay thế template management BE. Evidence: `src/remotion/director/registry.json:1`, `src/remotion/director/plan.ts:20`, `src/remotion/director/plan.ts:48`.
- FE-27: Canva-style interactive overlay là mở rộng so với form editor đã đăng ký. Evidence: `src/components/RemotionPlayerWrapper.tsx:19`, `src/components/RemotionPlayerWrapper.tsx:40`.
- FE-28: LMS/iFrame là đích bổ sung bên cạnh YouTube và internal library của PDF. Evidence: `src/services/publicationService.ts:14`, `src/components/views/MediaLibrary/MediaLibraryView.tsx:28`.
- FE-29: M01 accept/ignore và M14 khóa 1080p30 là các gói triển khai đã thêm, nhưng chức năng gốc ĐÃ thuộc PDF; không gọi chúng là scope thừa cần loại bỏ. FE M01 có code; M14 có commit UI; N08 là worker, không phải FE. Evidence: `src/services/scriptService.ts:59`; commits `619b81f`, `afb847a`; `../STEMotion_RENDER/src/googleCloudNarration.ts:13`.

## 📝 Todo

- [CHỜ HỌP] FE-30: Xác định repo/ref chứa `d6843bf`, tái hiện hai bug fail-closed/tts-preview trước khi đóng; không tự coi guard hiện tại là bằng chứng fix. Evidence: `src/services/scriptService.ts:75`, `src/components/ProducerView.tsx:37`; snapshot `fb9f48f`.
- [CHỜ HỌP] FE-31: Chốt giữ narrative arc/dynamic pacing rồi thống nhất request và UI với BE feature branch; sửa mô tả 5–7 cảnh nếu duyệt. Evidence: `src/components/modals/CreateProjectModal.tsx:106`, `src/services/scriptService.ts:69`; BE `0525475`.
- [CHỜ HỌP] FE-32: Chốt bộ nhánh tích hợp: FE M01 gọi endpoint decision mà BE working tree hiện không có; kiểm thử accept/ignore sau khi hợp nhất. Evidence: `src/services/scriptService.ts:59`, `../STEMotion_BE/src/main/java/com/stemotion/domain/ai/controller/AiController.java:23`; BE staging `5b90623`.
- FE-33: Bổ sung library filter/list, caption timing editor và admin usage view theo contract thật; không dùng một clip hay caption tĩnh thay cho yêu cầu. Evidence: `src/components/views/MediaLibrary/MediaLibraryView.tsx:5`, `src/components/views/ProducerStudio/IllustratedExplainerInspector.tsx:75`, `src/components/views/AdminPortal/AdminPortal.tsx:20`.
- FE-34: Lập bằng chứng browser matrix và dashboard <3s/200 concurrent users trước nghiệm thu; dependency/build không chứng minh NFR. Evidence phạm vi hiện có: `package.json:9`, `src/App.tsx:351`; PDF tr.3.

Tự review 2026-10-14: chọn ngẫu nhiên 4 mục bằng seed 20261014 (FE-12, FE-10, FE-31, FE-33), mở lại code tại evidence để đối chiếu; kiểm tra tồn tại file/số dòng cho toàn bộ citations. Chỉ audit tài liệu; không chạy lại test suite, không gọi production. Các kết quả test/smoke cũ đều được ghi là evidence có sẵn.
