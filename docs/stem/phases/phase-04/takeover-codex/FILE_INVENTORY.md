# Kiểm kê file và quyền tác giả — P4 takeover

05/11/2026. Mọi file vẫn local, chưa commit. SHA256 đầy đủ; hash đầu vào giữ nguyên trong INPUT_BASELINE.json.

## Năm file Antigravity trong bàn giao

| File tuyệt đối | SHA256 lúc nhận | Disposition cuối |
|---|---|---|
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\update_writer.py` | `04e734f71dac5cfd0ac4dcbc54d1b8d7673a2a7cf3f565c01cad97d9e2b2f32a` | GIỮ NGUYÊN, không chạy; hash hiện tại trùng lúc nhận |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\update_reviewer.py` | `b961b36569ea5a356c39deb4007567c9a13f938bee7d7faf12bef565b85cda79` | GIỮ NGUYÊN, không chạy; hash hiện tại trùng lúc nhận |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\update_fe.py` | `dc99abd6cd2420618305c0afcbe36b94ecd2f96a0143734fa240455cc6ea90df` | GIỮ NGUYÊN, không chạy; hash hiện tại trùng lúc nhận |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemBriefPanel.tsx` | `562a7d2417d57cd71feac575d329d7013ee15d9224773df8a119528a98035851` | SỬA; giữ phần khung UI Antigravity, thay logic contract/state/lỗi; xem ANTIGRAVITY_REVIEW.md và P4_HANDOFF.md |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemRubricPanel.tsx` | `9f27c281af8717b48ad465fe03efbfefa1e69746cd55c585315474e2350ec98d` | SỬA; giữ phần khung UI Antigravity, thay logic contract/state/lỗi; xem ANTIGRAVITY_REVIEW.md và P4_HANDOFF.md |

Không xóa/đổi tên file Antigravity. Không chạy ba script Python; các đoạn str.replace không đủ an toàn để tái chạy. Năm tracked changes đã có khi nhận cũng được ghi công Antigravity, không tính là Codex tạo từ đầu.

## Working tree FE gốc trước/sau

| File mục tiêu | Status lúc nhận | Đối soát |
|---|---|---|
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\STEMotion_FE\src\components\views\WriterStudio\WriterStudio.tsx` | CLEAN | hash bảo toàn; PRESERVATION_CHECK.json |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\STEMotion_FE\src\components\views\ReviewerStudio\ReviewerStudio.tsx` | CLEAN | hash bảo toàn; PRESERVATION_CHECK.json |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\STEMotion_FE\src\components\views\ProducerStudio\ProducerStudio.tsx` | CLEAN | hash bảo toàn; PRESERVATION_CHECK.json |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\STEMotion_FE\src\components\modals\DraftReviewModal.tsx` | CLEAN | hash bảo toàn; PRESERVATION_CHECK.json |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\STEMotion_FE\src\services\scriptService.ts` | CLEAN | hash bảo toàn; PRESERVATION_CHECK.json |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\STEMotion_FE\src\services\reviewService.ts` | CLEAN | hash bảo toàn; PRESERVATION_CHECK.json |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\STEMotion_FE\src\types\stem.ts` | CLEAN | hash bảo toàn; PRESERVATION_CHECK.json |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\STEMotion_FE\src\components\ProducerView.tsx` | CLEAN (hash có trong full inventory ban đầu) | Lỗi đường dẫn targeted inventory ban đầu đã ghi rõ/corrected, không chạm file gốc |

Repo gốc giữ các file dirty CinematicScene.tsx, lego/catalog.ts và asset untracked. `PRESERVATION_CHECK.json` đối soát đủ201 file FE gốc và738 file BE P3, HEAD/status không đổi; không chỉ đối chiếu các mục tiêu P4.

## File code/test P4 cuối

Các dòng dưới được chốt lại từ SOURCE_MANIFEST.json sau lượt test cuối. Hash của handoff/doc không dùng làm hash source.

| File tuyệt đối | SHA256 cuối | Số dòng |
|---|---|---|
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\ProducerView.tsx` | `9d331c3887d4578dcd851ba95819cd9e4d8cda313621672ca7e89602e7462f25` | 435 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemBriefPanel.tsx` | `416d1929b4c488e8e1727228cb8747d40a1e31ce3604a83b4cdd08c7a45fa8af` | 642 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemErrorNotice.tsx` | `9474bc3da762fd897b35d145c0a1ea273c6cfaaa0fdd18951e36fe9ecb0bffc6` | 20 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemFlow.p4-live.test.tsx` | `854ae1f7c1b50a9c3630b7e614d4153294d1060559edd114faf97703efa03ef1` | 91 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemLearningFields.tsx` | `0235eb7abd43cda2b390e07b4d15ae42a61c800456667cf2a4aee436087163f1` | 78 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemPanels.test.tsx` | `44ccbaf7171639688d2c6ccd6c4c12e5f4a3a8c5d867d6adf4df8409bddecbe2` | 125 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemReadOnlySummary.tsx` | `25140ed1d258f6ab326a928620534bdb71faf6dba8a2a1114488fd7bb18f7dc3` | 35 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemRubricPanel.tsx` | `3d48378b1abc1a67d3bc4452a7b591339a9929dc02d9d48a38cf7d286e105fb2` | 426 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\StemWorkspaceSettings.tsx` | `ac3165d738c7886c0e1337c25217048a47af0ae6fe4e04830960d21e7858764c` | 47 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\stem\useStemTarget.ts` | `d350bec6a2f6e2644c6ed28a74eed6edfb8833c6a84087bc924ffd66921f6c99` | 15 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\views\ProducerStudio\ProducerStudio.tsx` | `8963b561b414da1326c430a22f3335884b1ebf071c087f01ea0849e700bccab4` | 648 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\views\ReviewerStudio\ReviewerStudio.test.tsx` | `64088f90865be6b2538509708b046ddfc7870e44def348cf8856e9c926329ba7` | 113 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\views\ReviewerStudio\ReviewerStudio.tsx` | `a93f9fa004a4280009490b8b30e0fc1c7cc8cef65fd6a8bcca7650920200ae8a` | 1660 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\views\WriterStudio\WriterStudio.test.tsx` | `5f8a2fbcc9ea5733f9052a2f293d11a38ea4c63f0b009ba7d1886434f8a500ae` | 77 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\components\views\WriterStudio\WriterStudio.tsx` | `8c72fc534f3ec00f5142c3625f1c19c2e66fb85bdde510e51d05900e0493f34c` | 1567 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\services\apiClient.ts` | `9269d3047eecb9312125578f9dc0352a1ea44255b13dde5cfdd60cfed0dd182b` | 174 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\services\compositionService.ts` | `b4797dda2935e4fd2fcf28c1ba402cde0793550276298227ed3026cc8ada71ac` | 120 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\services\reviewService.ts` | `c852225db4ac49abb6eaa26db8905a1f3339e88ccba472be6ab164e2a046e086` | 198 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\services\sceneSaveQueue.ts` | `4124d7b388f76e940899db4746e3745feafa4f3d966ffe6e40375cd06a7c8344` | 166 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\services\scriptService.ts` | `2a18c03b472b5dcee612d419274ed21f3e9b875b6bab0c7835d22d9859a56fef` | 670 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\services\stemAutosave.test.ts` | `076381159df8defb725ac78d99a3f813ac4934a9adf0555f4405931b16b77838` | 38 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\services\stemClient.test.ts` | `3c432e16cdbb6b575aa51959f8b8804c6dc9e0c9ba89c5f45f037164857b1bf1` | 59 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\services\stemClient.ts` | `9d9d186b13c549d7aa9b32bcc582eafcd92f28dbf9a81ae8c9257d43043363a9` | 55 |
| `C:\Users\LeTran\FPT University\2026_FALL\STEMotion\.audit\stem-phase-2026-11-05\phase-04\STEMotion_FE\src\types\stem.ts` | `3d4ca8dbae91d073341c3ecf33797915a3f2558cdd1fbf4a6e5977a9c372b7bf` | 564 |
