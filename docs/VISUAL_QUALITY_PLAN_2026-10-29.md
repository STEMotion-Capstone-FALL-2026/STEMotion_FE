# Nhánh chất lượng hình ảnh — plan P0–P5

Ngày: **29/10/2026**. Liên quan `master_update_plan.md`: M03 (học thuật, tiết chế), M04/M05 (AI + QC), M08 (Manim), M09 (Producer), D03/D04/D05/D06/D20.
Trạng thái: **plan để team duyệt; chưa triển khai, chưa thêm endpoint, chưa gọi API trả phí.**

## 1. Vì sao clip nào cũng giống nhau (đối chiếu code `7d43fb8`)

| Nguyên nhân | Bằng chứng |
|---|---|
| AI chỉ **chọn trong danh sách**; hình ảnh là code viết cứng | 6 ambience, 6 layout (`flat/theme.ts`), 6 màu nhấn neon `ACCENTS`, 1 font Baloo2, icon cố định (`stemIcons.ts`), 4 SVG sơ đồ (`DiagramExplainer`) |
| Phong cách **cố ý gắn theo workspace** | `flat/variation.ts`: seed = `workspaceId`; "mọi clip của một tổ dùng chung" màu/kiểu xuất hiện |
| **Theme Producer chọn không phải là phong cách** | `ProducerStudio` chọn "Học thuật" chỉ nối `::academic` vào `workspaceId` (BE `RenderService` làm y vậy), tức là chỉ **đổi seed xoay màu** trong dải cũ. Không template nào đọc `visualTheme` |
| Màu viết thẳng trong component | 140 mã hex trong `src/remotion` (nhiều nhất: `flat/theme.ts` 54, `lego/LegoBlock.tsx` 16 + 25 rgba, `GeometrySpace` 11, `flat-stage.css` 9, `DataChartVisual` 8, `DiagramExplainer` 7); glow/shadow ở `IllustratedExplainer`, `blocks.tsx`, `StemIcon` |

Kết luận: thêm AI vào khâu "chọn" không đổi được bộ mặt clip. Phải có **Style Spec** (phong cách là dữ liệu) và **scene specification** (cảnh mô tả bằng dữ liệu, không bằng template cứng), rồi AI mới thiết kế được.

## 2. Nguyên tắc (đã thống nhất với teammate)

- **Con người quyết định.** Writer chịu trách nhiệm nội dung, Reviewer duyệt nội dung, audio và **final QC trên MP4 thật** (D20). AI/vision chỉ gợi ý kèm lý do và vị trí, **không chặn và không tự sửa** (D06).
- **Academic là mặc định** khi D03 được chốt. "Đẹp" đến từ bố cục, typography, chuyển động có mục đích, không từ màu neon/glow.
- **Không gọi API trả phí** (model sinh ảnh/SVG, vision, TTS mới) khi chưa chốt ngân sách và provider (D04/D07). Không thêm endpoint BE trước P2 được duyệt. BE chỉ hỗ trợ contract (T11).
- **Manim chỉ prototype** so với Remotion thuần trên cùng một cảnh, chưa tích hợp (D05).
- **Bubble Sort** chỉ là ý tưởng video demo mentor. Không xây engine/trace riêng. Minh họa bằng code vẫn dùng được khi cảnh cụ thể cần.
- Preview và MP4 phải cùng phong cách. Mọi thay đổi so sánh **MP4 trước/sau**, không chỉ ảnh chụp Player.

## 3. Phân công đề xuất

| Vai | Phụ trách |
|---|---|
| Nội dung (team) | Bộ bài chuẩn, brief, rubric, chấm mù, duyệt nội dung |
| FE | Style Spec trong Remotion, bỏ màu viết cứng, renderer scene spec, UI Producer |
| Worker (RENDER) | Render frame tĩnh cho QC, artifact provenance, ghép audio |
| BE (Nemo) | Contract lưu Style Spec/scene spec/artifact theo project/job, snapshot cấu hình (T11). Không endpoint trước khi duyệt |
| Người phụ trách team | Chốt D03, D04, D05, D06, D07, ngân sách |

## 4. Các giai đoạn

### P0 — Baseline và rubric *(làm được ngay, không tốn phí)*

- **Bộ bài chuẩn**: 4 chủ đề ở 4 môn khác nhau, mỗi bài 6–8 cảnh. Đề xuất: định luật Ohm (Lý), oxi hóa–khử (Hóa), quang hợp (Sinh), một bài Tin. Bài Tin có thể là Bubble Sort nếu team làm demo, nhưng không bắt buộc. Kịch bản do người viết và Reviewer duyệt; P1–P5 **dùng lại đúng các kịch bản này** để so sánh công bằng.
- **Rubric** (thang 1–5, chấm mù, ≥ 3 người chấm):

| Tiêu chí | Câu hỏi |
|---|---|
| Đọc được | Chữ, công thức, code đọc rõ ở 1080p và trên điện thoại? |
| Đúng kiến thức | Hình minh họa đúng nội dung lời đọc? Không có hình "gần đúng"? |
| Tiết chế | Có màu/hiệu ứng không phục vụ bài học không? |
| Khác biệt | Đặt 4 clip cạnh nhau, có nhận ra chúng là 4 video khác nhau không? |
| Mạch hình | Hình xuất hiện đúng lúc lời đọc nhắc tới? |
| Mượt | Chuyển cảnh, chuyển động có giật hoặc thừa không? |

- **Baseline MP4**: render 4 bài trên `main` hiện tại.
  - Nếu không muốn tốn phí TTS: render với TTS tắt để so phần hình. Audio so riêng ở nhánh M01.
  - Lưu MP4, SHA của FE/worker và điểm rubric.
- **Acceptance P0**: 4 MP4 baseline kèm SHA; bảng điểm rubric; kịch bản đã duyệt được khóa phiên bản.

### P1 — Style Spec và bỏ màu viết cứng trên phạm vi pilot *(sau khi chốt D03)*

- **Style Spec** là dữ liệu:
  - bảng màu: nền, chữ, 1–2 màu nhấn có nghĩa, kiểm tra tương phản WCAG;
  - cặp font hỗ trợ tiếng Việt;
  - kiểu nét;
  - nhịp chuyển động;
  - kiểu nền.

  Có preset **Academic** (nền sáng hoặc trung tính, tối đa 1 màu nhấn, không glow, không nền chuyển động). Nếu D03 chọn trắng đen tuyệt đối thì phân biệt trạng thái bằng viền, nhãn, độ đậm.
- `visualTheme` trở thành **tên một Style Spec thật**, không còn là seed. Bỏ cách nối `::theme` vào `workspaceId` ở cả FE lẫn BE (`RenderService`). Variation theo seed chỉ còn lo bố cục/camera.
- **Pilot**: 5 template của đề tài gốc trước: `TitleHeroReveal`, `MathFormulaStep`, `DiagramExplainer`, `DataChartVisual`, `OutroCard`, cộng `CaptionTrack`. Mọi màu/font đọc từ Style Spec.
- Project cũ: giữ phong cách cũ (preset `legacy`) để video lịch sử không đổi khi render lại.
- AI ở P1 **chỉ chọn preset** đã duyệt, chưa tự sinh bảng màu.
- **Acceptance P1**:
  - 5 template pilot không còn mã màu/font viết cứng (kiểm bằng grep);
  - Player và MP4 giống nhau;
  - render lại 4 bài P0 bằng Academic → điểm "tiết chế" và "đọc được" không thấp hơn baseline;
  - project cũ render ra như trước.

### P2 — Scene specification

- Một renderer chung cho dữ liệu mô tả cảnh:
  - hình khối, path, mũi tên, chữ, LaTeX, code, biểu đồ, ảnh;
  - lưới bố cục, camera;
  - keyframe gắn vào **từ trong lời đọc** (word timing của Whisper đã có).
- Template hiện có thành **preset** của spec, nên không mất gì.
- AI đề xuất spec. Code kiểm tra schema, nằm trong khung, chồng hình, tràn chữ, tương phản. Producer xem, sửa, chọn.
- BE: contract lưu spec theo composition revision (đã có revision/snapshot). **Endpoint mới chỉ sau khi duyệt.**
- **Acceptance P2**:
  - 4 bài P0 dựng bằng spec, đạt điểm "khác biệt" cao hơn baseline;
  - spec lỗi bị từ chối kèm vị trí lỗi;
  - Producer sửa một phần tử mà không phải sinh lại cả cảnh.

### P3 — Minh họa đúng chủ đề

- Thay 4 SVG sơ đồ cố định bằng minh họa theo đúng chủ đề:
  - **SVG** do model sinh, lọc an toàn (không script, không link ngoài), chia lớp để làm hoạt ảnh, cache theo hash, đổi màu theo Style Spec;
  - **minh họa bằng code** khi cảnh cần độ chính xác: đồ thị hàm, cấu trúc phân tử, bước của một thuật toán trong ví dụ. Đây là lựa chọn cho từng cảnh, không phải module bắt buộc;
  - **ảnh sinh** chỉ cho nền/minh họa **không chứa chữ hay công thức**.
- Không có minh họa đạt yêu cầu → hiện sơ đồ nhãn tổng quát và gắn cờ cho Reviewer, **không ép về hình gần đúng**.
- Cần chốt ngân sách và model (D04/D07) trước khi gọi API.
- **Acceptance P3**:
  - Reviewer xác nhận minh họa đúng nội dung ở ≥ 90% cảnh của bộ bài chuẩn;
  - mỗi asset có provenance (model, prompt version, hash, người duyệt).

### P4 — QC hỗ trợ bằng vision *(chỉ gợi ý)*

- Worker render vài frame mỗi cảnh. Model vision chấm theo rubric P0, trả **finding có lý do và vị trí**.
- Producer quyết định sửa hay bỏ qua. Tối đa 2 vòng tự sửa và chỉ khi Producer bấm.
- Reviewer vẫn duyệt MP4 thật.
- **Acceptance P4**:
  - trên bộ bài có lỗi cài sẵn (chữ tràn, chồng hình, tương phản thấp), finding bắt được ≥ 80% lỗi;
  - không có trường hợp tự chặn publish.

### P5 — Chuyển động và âm thanh

- Thư viện motion: spring/easing chuẩn, hiện lần lượt, chuyển cảnh thống nhất, camera có mục đích.
- Hoạt ảnh khớp nhịp lời đọc.
- Phối hợp nhánh M01: nhạc nền tự giảm khi có lời, hiệu ứng âm thanh tiết chế, chuẩn hóa âm lượng (ngưỡng do team chốt).
- **Acceptance P5**: chấm mù 4 bài, điểm "mượt" và "mạch hình" cao hơn baseline; Reviewer duyệt audio trên MP4 thật.

### Song song

- Spike Manim: cùng một cảnh minh họa, so Remotion thuần với Manim + Remotion về độ đúng, khả năng chỉnh, thời gian render và vận hành (M08).
- Nhánh audio M01: nghe A/B giọng TTS.

## 5. Cần chốt trước

| Mã | Câu hỏi | Chặn |
|---|---|---|
| D03 | Trắng đen tuyệt đối hay nền trung tính + 1 màu nhấn? Font? Giữ phong cách cũ cho project lịch sử? | P1 |
| D04/D07 | Ngân sách mỗi clip; model/provider được dùng; có cho dùng model sinh ảnh không | P3, P4 |
| D05 | Kết quả spike Manim | Tích hợp Manim |
| D06 | AI QC chỉ gợi ý (đề xuất) hay được chặn? | P4 |
| D19 | Producer sửa đến mức nào (chọn phương án, hay sửa từng phần tử)? | P2 |
| Hạ tầng | Render/lưu asset ở đâu khi job tăng (laptop hiện tại không đủ) | P3+ |

## 6. Không làm trong plan này

- Không mở rộng kho asset rộng rãi trước khi chốt scene spec (master plan mục 6).
- Không YouTube OAuth, multitrack editor, co-editing realtime.
- Không có module/endpoint riêng cho Bubble Sort.
