import React from 'react';
import type { LibraryItem } from '../../services/libraryService';

const contextName = (key?: string) => key === 'IN_CLASS_SCREEN' ? 'Chiếu chung trong lớp' : key === 'GROUP_PRACTICE' ? 'Thực hành nhóm' : 'Chưa đối chiếu';
export function StemLearningCard({ item }: {item: LibraryItem}) {
  const card = item.learningCard;
  const [message,setMessage] = React.useState('');
  return <section aria-label="Thẻ học liệu STEM" className="rounded-lg border border-slate-200 p-3 space-y-2">
    <p className="font-semibold text-amber-800">{!card?.snapshotId || card.verificationStatus === 'LEGACY_UNMAPPED' ? 'Chưa đối chiếu hồ sơ STEM' : 'Chưa được thẩm định chuyên môn'}</p>
    {card?.snapshotId ? <>
      <p>Lớp: {card.gradeKey || 'Chưa khai báo'} · Cấp: {card.educationLevel || 'Chưa đối chiếu'}</p>
      <p>Môn chính/phối hợp: {card.subjectKeys?.join(', ') || 'Chưa khai báo'}</p>
      <p>Bối cảnh chính: {contextName(card.context?.primary?.key)}</p>
      {card.context?.secondary?.map((c,i) => <p key={i}>Bối cảnh phụ: {contextName(c.key)} — {c.condition || 'Chưa nêu điều kiện'}; {c.adaptations || 'Chưa nêu điều chỉnh'}</p>)}
      <p>Kênh sử dụng: {card.distributionChannels?.includes('DEPARTMENT_LIBRARY') ? 'Kho học liệu tổ chuyên môn' : 'Chưa khai báo'}</p>
      <div><strong>Mục tiêu học tập</strong><ul>{card.objectives?.map(o => <li key={o.key}>{o.learnerAction || 'Chưa khai báo'}{o.observableEvidence && ` — Minh chứng: ${o.observableEvidence}`}</li>)}</ul></div>
      <p>Phạm vi clip / hoạt động ngoài MP4: {card.scopeOfClip || 'Chưa khai báo'}</p>
      <div><strong>Học sinh làm gì sau khi xem</strong><ul>{card.studentTasks?.map(t => <li key={t.key}>{t.learnerAction || 'Chưa khai báo'}{t.materials && ` — Vật liệu: ${t.materials}`}{t.safety && ` — An toàn: ${t.safety}`}{t.teacherSupport && ` — Hỗ trợ: ${t.teacherSupport}`}</li>)}</ul></div>
      <p>Lưu ý an toàn: {card.safetyNotes || 'Chưa khai báo; cần giáo viên xem xét'}</p>
      <details><summary>Nguồn và phiên bản của học liệu</summary><ul>{card.sources?.map((s,i) => <li key={i}>{s.title || s.citation || s.kind || 'Nguồn chưa thẩm định'} · bản {s.version ?? '?'} {s.locator || ''}</li>)}</ul><p>Thông tin thuộc bản đã công bố; chưa phải xác nhận chương trình hoặc hiệu quả học tập.</p></details>
      <button type="button" className="underline" onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify({learningCard: card,videoUrl: item.videoUrl},null,2));setMessage('Đã sao chép thẻ và liên kết học liệu.'); } catch {setMessage('Chưa sao chép được. Vui lòng thử lại.');} }}>Sao chép thẻ và liên kết</button>
      {message && <p role="status">{message}</p>}
    </> : <p>Vẫn có thể xem, tải và nhúng video. Chưa xác định lớp, yêu cầu cần đạt hay bối cảnh từ hồ sơ lịch sử.</p>}
  </section>;
}
