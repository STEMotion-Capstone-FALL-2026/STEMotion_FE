import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { scriptService } from '../../services/scriptService';
import { projectService } from '../../services/projectService';
import { reviewService } from '../../services/reviewService';
import { authService } from '../../services/authService';
import { sceneSaveQueue } from '../../services/sceneSaveQueue';
import { ApiError, apiClient } from '../../services/apiClient';
import { StemBriefPanel } from './StemBriefPanel';
import { StemRubricPanel } from './StemRubricPanel';
import { StemWorkspaceSettings } from './StemWorkspaceSettings';
import { StemErrorNotice } from './StemErrorNotice';
import { WriterStudio } from '../views/WriterStudio/WriterStudio';
import { ReviewerStudio } from '../views/ReviewerStudio/ReviewerStudio';
import { workspaceModeFromWire, emptyStemBrief } from '../../services/stemClient';
import type { StemViewResponse, STEMScript, WorkspaceStemSettingsWire } from '../../types/stem';

const dummyScript = (patch: Partial<STEMScript> = {}): STEMScript => ({
  id: 'test_project_1',
  title: 'TEST_ONLY Bài học Năng lượng',
  subject: 'Physics',
  gradeLevel: '10',
  scriptStatus: 'DRAFT',
  version: '1',
  draftRevision: 0,
  currentVersionNo: 1,
  workspaceId: 'ws_test_1',
  scenes: [
    { id: 'sc_1', type: 'TITLE_HERO', title: 'Cảnh 1: Mở đầu', narration: 'Chào các em', durationInFrames: 90, subtitle: '', subject: 'Physics', gradeLevel: '10', badgeText: '' },
    { id: 'sc_2', type: 'MATH_FORMULA', title: 'Cảnh 2: Công thức', narration: 'Định luật', durationInFrames: 90, latex: 'E = mc^2', steps: [] },
    { id: 'sc_3', type: 'OUTRO', title: 'Cảnh 3: Kết thúc', narration: 'Hẹn gặp lại', durationInFrames: 90, summaryPoints: [] },
  ] as any,
  ...patch,
});

const dummyView = (patch: Partial<StemViewResponse> = {}): StemViewResponse => ({
  schemaVersion: 'stem.v1',
  briefId: 'brief_1',
  scriptVersionId: 'ver_1',
  revision: 0,
  modeRevision: 0,
  verificationStatus: 'UNVERIFIED',
  readiness: 'INCOMPLETE',
  effectiveMode: 'STRICT',
  scriptFingerprint: 'fp_script_sha256_mock_123',
  compositionFingerprint: 'fp_comp_sha256_mock_456',
  brief: {
    ...emptyStemBrief(),
    studentTasks: [{ key: 'task_1', learnerAction: 'Đo điện áp', teacherSupport: '', materials: '', safety: '', assessmentEvidence: '', executionContextKey: 'IN_CLASS_SCREEN' }],
    objectives: [{ key: 'obj_1', outcomeId: 'out_1', learnerAction: 'Hiểu định luật', observableEvidence: 'Làm bài tập' }],
    steps: [],
  },
  evidence: [],
  findings: [],
  ...patch,
});

beforeEach(() => {
  vi.spyOn(authService, 'getCurrentUser').mockReturnValue({ id: 'user_1', systemRole: 'ADMIN' } as any);
  vi.spyOn(scriptService, 'getStemTarget').mockResolvedValue({ versionId: 'ver_1', scriptRevision: 0, versionNo: 1, workspaceId: 'ws_test_1' });
  vi.spyOn(scriptService, 'getStemBrief').mockResolvedValue(dummyView());
  vi.spyOn(scriptService, 'saveStemBrief').mockImplementation(async (_p, _v, req) => dummyView({ brief: req.brief, evidence: req.evidence, revision: req.baseRevision + 1 }));
  vi.spyOn(scriptService, 'getCatalog').mockResolvedValue([
    { id: 'rubric_v1', kind: 'RUBRIC', logicalKey: 'STEM_RUBRIC_GDPT2018', version: 1, status: 'DRAFT', data: {}, revision: 0, verificationStatus: 'UNVERIFIED' },
  ]);
  vi.spyOn(scriptService, 'getWorkspaceStemSettings').mockResolvedValue({
    workspaceId: 'ws_test_1',
    modeRevision: 0,
    mode: 'STRICT',
    policyVersionIds: [],
    defaultPolicyVersionId: null,
  });
  vi.spyOn(sceneSaveQueue, 'saveNow').mockResolvedValue(dummyScript());
  vi.spyOn(sceneSaveQueue, 'getDraftRevision').mockReturnValue(0);
  vi.spyOn(reviewService, 'getComments').mockResolvedValue([]);
  vi.spyOn(projectService, 'getProjectById').mockResolvedValue(dummyScript());
  vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
    if (url.includes('/members')) return [{ userId: 'user_1', role: 'REVIEWER', status: 'ACTIVE' }];
    return {};
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Task 3: 3 Workspace Modes (OFF, ADVISORY, STRICT)', () => {
  it('wire parser validates all 3 modes and rejects invalid modes', () => {
    const wireOff: WorkspaceStemSettingsWire = { workspaceId: 'w', revision: 1, mode: 'OFF', policyIds: [], defaultPolicyId: null };
    const wireAdv: WorkspaceStemSettingsWire = { workspaceId: 'w', revision: 2, mode: 'ADVISORY', policyIds: [], defaultPolicyId: null };
    const wireStrict: WorkspaceStemSettingsWire = { workspaceId: 'w', revision: 3, mode: 'STRICT', policyIds: [], defaultPolicyId: null };

    expect(workspaceModeFromWire(wireOff).mode).toBe('OFF');
    expect(workspaceModeFromWire(wireAdv).mode).toBe('ADVISORY');
    expect(workspaceModeFromWire(wireStrict).mode).toBe('STRICT');

    expect(() => workspaceModeFromWire({ ...wireOff, mode: 'UNKNOWN' as any })).toThrow();
  });

  it('Admin can switch mode to STRICT or ADVISORY or OFF and sends baseRevision and idempotencyKey', async () => {
    const saveSpy = vi.spyOn(scriptService, 'saveWorkspaceStemSettings').mockResolvedValue({
      workspaceId: 'ws_test_1',
      modeRevision: 1,
      mode: 'STRICT',
      policyVersionIds: [],
      defaultPolicyVersionId: null,
    });

    render(<StemWorkspaceSettings workspaceId="ws_test_1" />);
    fireEvent.click(screen.getByText('Workspace STEM — xem/gán policy DRAFT'));

    const modeSelect = await screen.findByRole('combobox', { name: 'Mode' });
    fireEvent.change(modeSelect, { target: { value: 'STRICT' } });

    fireEvent.click(screen.getByRole('button', { name: 'Lưu settings workspace (CAS)' }));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(
        'ws_test_1',
        expect.objectContaining({
          modeRevision: 0,
          baseRevision: 0,
          mode: 'STRICT',
          idempotencyKey: expect.any(String),
        })
      );
    });
  });
});

describe('Task 4: Template 6 bước trong Panel Brief', () => {
  it('applies default 6-step template and binds opening/closing scenes', async () => {
    const script = dummyScript();
    render(
      <StemBriefPanel
        projectId={script.id}
        versionId="ver_1"
        scriptRevision={0}
        scenes={script.scenes}
        isWriter={true}
        workspaceId="ws_test_1"
        showToast={vi.fn()}
      />
    );

    // Switch to STEPS tab
    const stepsTab = await screen.findByRole('button', { name: /Tiến trình 6 bước/ });
    fireEvent.click(stepsTab);

    // Click apply default steps
    const applyBtn = screen.getByRole('button', { name: /Áp dụng mẫu 6 bước/ });
    fireEvent.click(applyBtn);

    // Verify all 6 steps are rendered
    expect(screen.getByTestId('lesson-step-OPENING_PROBLEM')).toBeTruthy();
    expect(screen.getByTestId('lesson-step-BACKGROUND_KNOWLEDGE')).toBeTruthy();
    expect(screen.getByTestId('lesson-step-PROPOSE_SOLUTION')).toBeTruthy();
    expect(screen.getByTestId('lesson-step-SELECT_SOLUTION')).toBeTruthy();
    expect(screen.getByTestId('lesson-step-BUILD_TEST')).toBeTruthy();
    expect(screen.getByTestId('lesson-step-CLOSING_SHARE_REFLECT')).toBeTruthy();
  });

  it('displays TECH-LESSON-OPENING, TECH-LESSON-CLOSING, TECH-LESSON-ORDER and TECH-LESSON-STEPS findings in correct slots', async () => {
    const script = dummyScript();
    vi.mocked(scriptService.getStemBrief).mockResolvedValue(
      dummyView({
        findings: [
          { ruleId: 'TECH-LESSON-OPENING', field: 'brief.steps.OPENING_PROBLEM', severity: 'ERROR', message: 'Thiếu bước mở đầu', basis: 'CV909' },
          { ruleId: 'TECH-LESSON-CLOSING', field: 'brief.steps.CLOSING_SHARE_REFLECT', severity: 'ERROR', message: 'Thiếu bước kết thúc', basis: 'CV909' },
          { ruleId: 'TECH-LESSON-ORDER', field: 'brief.steps', severity: 'ERROR', message: 'Sai thứ tự các bước', basis: 'CV909' },
          { ruleId: 'TECH-LESSON-STEPS', field: 'brief.steps', severity: 'WARN', message: 'Thiếu các bước ở giữa', basis: 'CV909' },
        ],
      })
    );

    render(
      <StemBriefPanel
        projectId={script.id}
        versionId="ver_1"
        scriptRevision={0}
        scenes={script.scenes}
        isWriter={true}
        workspaceId="ws_test_1"
        showToast={vi.fn()}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /Tiến trình 6 bước/ }));

    // Global order and steps warnings
    expect(screen.getByText(/\[LỖI THỨ TỰ\] Sai thứ tự các bước/)).toBeTruthy();
    expect(screen.getByText(/\[CẢNH BÁO TIẾN TRÌNH\] Thiếu các bước ở giữa/)).toBeTruthy();

    // Specific slot errors
    expect(screen.getByText(/\[TECH-LESSON-OPENING\] Thiếu bước mở đầu/)).toBeTruthy();
    expect(screen.getByText(/\[TECH-LESSON-CLOSING\] Thiếu bước kết thúc/)).toBeTruthy();
  });
});

describe('Task 5 & 6: Rubric với Fingerprint, Chế độ STRICT và Xử lý Lỗi', () => {
  it('StemRubricPanel receives scriptFingerprint and sets expectedFingerprint and rubricVersionId', async () => {
    let capturedAssessment: any = null;
    render(
      <StemRubricPanel
        isOpen={true}
        onClose={vi.fn()}
        scriptId="test_project_1"
        versionId="ver_1"
        scriptRevision={0}
        phase="SCRIPT"
        isReviewerActive={true}
        assessment={null}
        onAssessmentChange={(a) => {
          capturedAssessment = a;
        }}
      />
    );

    await waitFor(() => {
      expect(capturedAssessment).not.toBeNull();
      expect(capturedAssessment.expectedFingerprint).toBe('fp_script_sha256_mock_123');
      expect(capturedAssessment.rubricVersionId).toBe('rubric_v1');
    });
  });

  it('StemErrorNotice handles 409 STEM_FINGERPRINT_STALE and STEM_RUBRIC_REQUIRED', () => {
    const onReload = vi.fn();
    const staleError = new ApiError('Fingerprint stale', 'STEM_FINGERPRINT_STALE', 409, { expected: 'fp_new', actual: 'fp_old' });

    render(<StemErrorNotice error={staleError} onReload={onReload} />);

    expect(screen.getByRole('dialog', { name: 'Fingerprint STEM bị cũ (Stale)' })).toBeTruthy();
    expect(screen.getByText(/Fingerprint không khớp/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Tải lại & chấm lại' }));
    expect(onReload).toHaveBeenCalledOnce();
  });

  it('ReviewerStudio in STRICT mode enforces rubric assessment and prevents approval if incomplete', async () => {
    const script = dummyScript({ scriptStatus: 'IN_REVIEW' });
    const showToast = vi.fn();
    const approveSpy = vi.spyOn(reviewService, 'submitReviewDecision').mockResolvedValue(script);

    render(
      <ReviewerStudio
        {...({
          script,
          selectedScene: script.scenes[0],
          comments: [],
          reviewerMode: 'script',
          setScript: vi.fn(),
          onRoleChange: vi.fn(),
          showToast,
        } as any)}
      />
    );

    // Click Duyệt Kịch Bản without completing rubric
    const approveBtn = await screen.findByRole('button', { name: /Duyệt Kịch Bản.*Chuyển Producer/ });
    fireEvent.click(approveBtn);

    // Approval must be prevented client-side with a warning
    expect(approveSpy).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Chế độ STRICT yêu cầu hoàn tất chấm điểm Rubric STEM'),
      'warn'
    );
  });
});

describe('Task 2: Graceful Fallback when STEM is Disabled (404 Not Found)', () => {
  it('WriterStudio permits submission without brief when STEM API returns 404', async () => {
    const script = dummyScript({ scriptStatus: 'DRAFT' });
    vi.spyOn(scriptService, 'getStemTarget').mockRejectedValue(new ApiError('Not found', 'NOT_FOUND', 404));
    const submitSpy = vi.spyOn(projectService, 'submitForReview').mockResolvedValue({ ...script, scriptStatus: 'IN_REVIEW' });
    vi.spyOn(projectService, 'getProjectById').mockResolvedValue({ ...script, scriptStatus: 'IN_REVIEW' });

    const showToast = vi.fn();
    render(
      <WriterStudio
        {...({
          script,
          selectedScene: script.scenes[0],
          setActiveSceneId: vi.fn(),
          setScript: vi.fn(),
          onOpenCreateProjectModal: vi.fn(),
          onOpenVersionDiffModal: vi.fn(),
          onSetReviewerMode: vi.fn(),
          showToast,
        } as any)}
      />
    );

    // No red alert notice should be rendered
    expect(screen.queryByRole('alert')).toBeNull();

    // Submit button should succeed
    const submitBtn = screen.getByRole('button', { name: /Gửi Kịch Bản Cho Reviewer/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith(script.id);
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Kịch bản đã được lưu và gửi'), 'success');
    });
  });
});
