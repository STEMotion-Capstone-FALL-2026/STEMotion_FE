import React from 'react';
import type { YouTubeMetadata, YouTubePrivacy } from '../../services/publicationService';

export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 5000;

export interface YouTubeFormState {
  title: string;
  description: string;
  tags: string;
  privacyStatus: YouTubePrivacy;
  selfDeclaredMadeForKids: boolean;
}

export const initialYouTubeForm = (title: string): YouTubeFormState => ({
  title: title.slice(0, TITLE_MAX), description: '', tags: 'STEM', privacyStatus: 'private', selfDeclaredMadeForKids: false,
});

/** Null when the form can be sent; otherwise the reason in Vietnamese. */
export function youtubeFormProblem(form: YouTubeFormState): string | null {
  if (!form.title.trim()) return 'Cần nhập tiêu đề video YouTube.';
  if (form.title.trim().length > TITLE_MAX) return `Tiêu đề tối đa ${TITLE_MAX} ký tự.`;
  if (form.description.length > DESCRIPTION_MAX) return `Mô tả tối đa ${DESCRIPTION_MAX} ký tự.`;
  return null;
}

export const toMetadata = (form: YouTubeFormState): YouTubeMetadata => ({
  title: form.title,
  description: form.description,
  tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
  privacyStatus: form.privacyStatus,
  selfDeclaredMadeForKids: form.selfDeclaredMadeForKids,
});

interface Props {
  value: YouTubeFormState;
  onChange: (next: YouTubeFormState) => void;
  disabled?: boolean;
}

export function YouTubeMetadataForm({ value, onChange, disabled }: Props) {
  const set = <K extends keyof YouTubeFormState>(key: K, next: YouTubeFormState[K]) => onChange({ ...value, [key]: next });
  return (
    <fieldset aria-label="Thông tin video YouTube" disabled={disabled} className="space-y-2 text-sm">
      <label className="block">Tiêu đề YouTube
        <input value={value.title} maxLength={TITLE_MAX} onChange={e => set('title', e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <label className="block">Mô tả
        <textarea value={value.description} maxLength={DESCRIPTION_MAX} rows={3} onChange={e => set('description', e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <label className="block">Thẻ (cách nhau bằng dấu phẩy)
        <input value={value.tags} onChange={e => set('tags', e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <label className="block">Chế độ hiển thị
        <select value={value.privacyStatus} onChange={e => set('privacyStatus', e.target.value as YouTubePrivacy)} className="mt-1 w-full rounded border px-2 py-1">
          <option value="private">Riêng tư</option>
          <option value="unlisted">Không công khai</option>
          <option value="public">Công khai</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={value.selfDeclaredMadeForKids} onChange={e => set('selfDeclaredMadeForKids', e.target.checked)} />
        Video dành cho trẻ em
      </label>
      <p className="text-xs text-slate-500">Video có thể bị giữ ở chế độ riêng tư cho tới khi dự án Google được kiểm định.</p>
    </fieldset>
  );
}
