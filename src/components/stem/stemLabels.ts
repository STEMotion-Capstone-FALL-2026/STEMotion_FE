// Vietnamese labels for the STEM codes the API returns. A value missing from a
// table shows as "Không rõ" so a new server code never reaches the reader raw.
import type { StemValidationFinding } from '../../types/stem';

export const UNKNOWN_LABEL = 'Không rõ';

const pick = (table: Record<string, string>, value?: string | null) =>
  (value != null && Object.prototype.hasOwnProperty.call(table, value) ? table[value] : UNKNOWN_LABEL);

const FRESHNESS: Record<string, string> = {
  CURRENT: 'Khớp nội dung đã duyệt',
  NEEDS_REVIEW: 'Nội dung đã đổi, cần duyệt lại',
};
const CLASSIFICATION: Record<string, string> = {
  CLASSIFIED: 'Đã phân loại thay đổi',
  UNKNOWN: 'Chưa phân loại thay đổi',
};
const INTEGRITY: Record<string, string> = {
  MATCH: 'Video khớp bản đã duyệt',
  MISMATCH: 'Video không khớp bản đã duyệt',
  UNKNOWN: 'Chưa có bản ghi đối chiếu video',
};
const ROUTE: Record<string, string> = {
  CURRENT: 'Xuất bản được',
  LEGACY_UNVERIFIED: 'Xuất bản được sau khi xác nhận nội dung chưa thẩm định',
  BLOCKED: 'Bị chặn xuất bản',
};
const REASON: Record<string, string> = {
  LEGACY_ACK_REQUIRED: 'Video được tạo trước khi có hồ sơ STEM; cần xác nhận trước khi xuất bản.',
  ARTIFACT_BINDING_MISMATCH: 'Video không khớp nội dung đã duyệt; cần kết xuất lại hoặc duyệt lại.',
};
const READINESS: Record<string, string> = {
  INCOMPLETE: 'Hồ sơ STEM chưa đủ',
  READY_FOR_REVIEW: 'Hồ sơ STEM sẵn sàng để duyệt',
  NEEDS_REVIEW: 'Hồ sơ STEM cần duyệt lại',
  LEGACY_UNMAPPED: 'Dự án cũ, chưa gắn hồ sơ STEM',
};
const MODE: Record<string, string> = { OFF: 'Tắt', ADVISORY: 'Gợi ý', STRICT: 'Bắt buộc' };
const SEVERITY: Record<string, string> = { ERROR: 'Lỗi', WARN: 'Cảnh báo', INFO: 'Thông tin' };
const CONTEXT: Record<string, string> = {
  IN_CLASS_SCREEN: 'Chiếu chung trong lớp',
  GROUP_PRACTICE: 'Thực hành nhóm',
};
const CHANNEL: Record<string, string> = { DEPARTMENT_LIBRARY: 'Kho học liệu tổ chuyên môn' };
const COMPONENT: Record<string, string> = {
  S: 'Khoa học (S)', T: 'Công nghệ (T)', E: 'Kỹ thuật (E)', M: 'Toán học (M)',
};
// Longest prefix first so "brief.steps.OPENING_PROBLEM" wins over "brief.steps".
const FIELD: [string, string][] = [
  ['brief.steps.OPENING_PROBLEM', 'Bước mở đầu (nêu vấn đề)'],
  ['brief.steps.CLOSING_SHARE_REFLECT', 'Bước kết thúc (chia sẻ, điều chỉnh)'],
  ['brief.context.primary', 'Bối cảnh sử dụng chính'],
  ['brief.context.secondary', 'Bối cảnh sử dụng phụ'],
  ['brief.policyVersionId', 'Chính sách STEM'],
  ['brief.contributions', 'Đóng góp S/T/E/M'],
  ['brief.objectives', 'Mục tiêu học tập'],
  ['brief.studentTasks', 'Nhiệm vụ của học sinh'],
  ['brief.steps', 'Các bước bài học'],
  ['brief', 'Hồ sơ STEM'],
];
const RULE: Record<string, string> = {
  'TECH-BRIEF': 'Chế độ Bắt buộc cần có hồ sơ STEM.',
  'TECH-CATALOG': 'Chưa chọn đủ cấp học, lớp hoặc yêu cầu cần đạt.',
  'TECH-PROVENANCE': 'Dữ liệu STEM là bản nháp, chưa được thẩm định khoa học.',
  'TECH-SCOPE': 'Chưa ghi đủ phạm vi clip và lưu ý an toàn.',
  'TECH-CONTEXT': 'Bối cảnh sử dụng chưa đủ hoặc bị trùng.',
  'TECH-CONTRIBUTION': 'Đóng góp S/T/E/M cần người duyệt xem xét.',
  'TECH-OBJECTIVE': 'Mục tiêu học tập chưa đủ (hành động của học sinh và minh chứng).',
  'TECH-POLICY': 'Chính sách STEM đã chọn không còn dùng được.',
  'TECH-LESSON-ORDER': 'Các bước bài học bị trùng, sai tên hoặc sai thứ tự.',
  'TECH-LESSON-STEPS': 'Các bước giữa của bài học (bước 2–5) chưa đủ.',
  'TECH-LESSON-CLOSING': 'Thiếu bước kết thúc hoặc chưa gắn với phân cảnh/hoạt động.',
  'TECH-LESSON-OPENING': 'Thiếu bước mở đầu hoặc chưa gắn với phân cảnh/hoạt động.',
  'TECH-TASK': 'Nhiệm vụ của học sinh chưa đủ.',
};

export const freshnessLabel = (v?: string | null) => pick(FRESHNESS, v);
export const classificationLabel = (v?: string | null) => pick(CLASSIFICATION, v);
export const integrityLabel = (v?: string | null) => pick(INTEGRITY, v);
export const routeLabel = (v?: string | null) => pick(ROUTE, v);
export const reasonLabel = (v?: string | null) => pick(REASON, v);
export const readinessLabel = (v?: string | null) => pick(READINESS, v);
export const modeLabel = (v?: string | null) => pick(MODE, v);
export const severityLabel = (v?: string | null) => pick(SEVERITY, v);
export const contextLabel = (v?: string | null) => pick(CONTEXT, v);
export const channelLabel = (v?: string | null) => pick(CHANNEL, v);
export const componentLabel = (v?: string | null) => pick(COMPONENT, v);

export function fieldLabel(field?: string | null): string {
  if (!field) return UNKNOWN_LABEL;
  const plain = field.replace(/\[[^\]]*\]/g, '');
  const hit = FIELD.find(([prefix]) => plain === prefix || plain.startsWith(`${prefix}.`));
  return hit ? hit[1] : UNKNOWN_LABEL;
}

/** The finding as a sentence: the rule's Vietnamese text, or the server message when the rule is new. */
export function findingMessage(finding: Pick<StemValidationFinding, 'ruleId' | 'message'>): string {
  return RULE[finding.ruleId] ?? finding.message;
}
