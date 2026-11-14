import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StemReadOnlySummary } from './StemReadOnlySummary';
import * as client from '../../services/stemClient';
import { scriptService } from '../../services/scriptService';
import { reviewService } from '../../services/reviewService';
import { fieldLabel, findingMessage, freshnessLabel, routeLabel, UNKNOWN_LABEL } from './stemLabels';
import type { STEMScript, StemArtifactStatus, StemViewResponse } from '../../types/stem';

const UUID = '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90';
const script: STEMScript = { id: 'TEST_ONLY_labels', title: 'TEST_ONLY', subject: 'Physics', gradeLevel: '8', scriptStatus: 'APPROVED', videoStatus: 'APPROVED', scenes: [], videoUrl: 'https://example.invalid/test.mp4' };
const artifact = (patch: Partial<StemArtifactStatus> = {}): StemArtifactStatus => ({
  schemaVersion: 'stem-artifact.v1', target: { projectId: script.id, versionId: UUID, snapshotId: UUID }, freshness: 'CURRENT', classification: 'CLASSIFIED', integrity: 'MATCH',
  publishEligibility: { allowed: true, route: 'CURRENT', requiresLegacyAcknowledgement: false }, snapshotOrigin: { snapshotId: UUID, capturedMode: 'STRICT', effectiveMode: 'STRICT' },
  verificationStatus: 'UNVERIFIED', reasons: [], ...patch,
});
const view = (patch: Partial<StemViewResponse> = {}): StemViewResponse => ({
  schemaVersion: 'stem.v1', scriptVersionId: UUID, revision: 3, verificationStatus: 'UNVERIFIED', readiness: 'READY_FOR_REVIEW', effectiveMode: 'STRICT', modeRevision: 4, evidence: [],
  findings: [{ ruleId: 'TECH-LESSON-OPENING', field: 'brief.steps.OPENING_PROBLEM', severity: 'ERROR', message: 'Opening problem step missing or not bound to scene/activity' }],
  brief: {
    policyVersionId: UUID, subjectKeys: ['PHYSICS'], outcomeIds: [UUID], scopeOfClip: 'Một chu kỳ đèn', safetyNotes: 'Không chạm bóng đèn nóng',
    context: { primary: { key: 'IN_CLASS_SCREEN', condition: 'Máy chiếu' }, secondary: [] }, distributionChannels: ['DEPARTMENT_LIBRARY'],
    objectives: [{ key: 'obj-1', learnerAction: 'giải thích vì sao sáp nổi', observableEvidence: 'câu trả lời có khối lượng riêng' }], studentTasks: [],
    contributions: [{ component: 'S', explanation: 'Khối lượng riêng và đối lưu', objectiveKeys: ['obj-1'], taskKeys: [] }],
  } as StemViewResponse['brief'],
  ...patch,
});

beforeEach(() => {
  vi.spyOn(scriptService, 'getStemTarget').mockResolvedValue({ versionId: UUID, versionNo: 2, scriptRevision: 0, workspaceId: 'workspace' });
  vi.spyOn(reviewService, 'getQaReport').mockResolvedValue({ projectId: script.id, passed: true, failCount: 0, warnCount: 0, findings: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('labels every code in Vietnamese and keeps raw ids inside the closed technical details', async () => {
  vi.spyOn(client, 'getArtifactStatus').mockResolvedValue(artifact());
  vi.spyOn(scriptService, 'getStemBrief').mockResolvedValue(view());
  const { container } = render(<StemReadOnlySummary script={script} />);
  expect(await screen.findByText(/Xuất bản được · Khớp nội dung đã duyệt/)).toBeTruthy();
  expect(await screen.findByText(/Bối cảnh chính: Chiếu chung trong lớp — Máy chiếu/)).toBeTruthy();
  expect(screen.getByText(/Thiếu bước mở đầu hoặc chưa gắn với phân cảnh/)).toBeTruthy();
  expect(screen.getByText(/Bước mở đầu \(nêu vấn đề\)/)).toBeTruthy();
  expect(screen.getByText(/Kênh sử dụng: Kho học liệu tổ chuyên môn/)).toBeTruthy();

  const technical = container.querySelector('details[aria-label="Chi tiết kỹ thuật"]') as HTMLDetailsElement;
  expect(technical).toBeTruthy();
  expect(technical.open).toBe(false);
  expect(technical.textContent).toContain(UUID);
  // Outside the technical details no UUID, revision or rule id reaches the reader.
  const readable = [...container.querySelectorAll('section')].map(section => section.textContent).join(' ');
  expect(readable).not.toContain(UUID);
  expect(readable).not.toMatch(/TECH-|IN_CLASS_SCREEN|READY_FOR_REVIEW|revision/);
});

it('shows "Không rõ" for a code the server adds later instead of printing it', async () => {
  vi.spyOn(client, 'getArtifactStatus').mockResolvedValue(artifact({ freshness: 'SOMETHING_NEW', publishEligibility: { allowed: false, route: 'NEW_ROUTE' as never, requiresLegacyAcknowledgement: false }, reasons: ['NEW_REASON'] }));
  vi.spyOn(scriptService, 'getStemBrief').mockResolvedValue(view({ readiness: 'NEW_READINESS', findings: [] }));
  const { container } = render(<StemReadOnlySummary script={script} />);
  expect(await screen.findByText(/Không rõ · Không rõ/)).toBeTruthy();
  const readable = [...container.querySelectorAll('section')].map(section => section.textContent).join(' ');
  expect(readable).not.toMatch(/SOMETHING_NEW|NEW_ROUTE|NEW_REASON|NEW_READINESS/);
});

it('label helpers fall back safely', () => {
  expect(freshnessLabel(undefined)).toBe(UNKNOWN_LABEL);
  expect(routeLabel('BLOCKED')).toBe('Bị chặn xuất bản');
  expect(fieldLabel('brief.objectives[2].learnerAction')).toBe('Mục tiêu học tập');
  expect(fieldLabel('brief.steps.CLOSING_SHARE_REFLECT')).toBe('Bước kết thúc (chia sẻ, điều chỉnh)');
  expect(fieldLabel('somethingElse')).toBe(UNKNOWN_LABEL);
  expect(findingMessage({ ruleId: 'TECH-NEW', message: 'Server text' })).toBe('Server text');
});
