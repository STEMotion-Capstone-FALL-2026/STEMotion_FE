import { test, expect } from '@playwright/test';
import {
  API_URL,
  CHANGED_PASSWORD,
  runId,
  setupWorkspace,
  createProject,
  getProject,
  formulaScenes,
  setWorkspaceStemMode,
  seedStemBrief,
  STEM_PRIMARY_POLICY_ID,
  STEM_PRIMARY_RUBRIC_ID,
} from './support/api';
import { signInReady, openProject } from './support/ui';
import { DEFAULT_CRITERIA_KEYS } from '../src/components/stem/StemRubricPanel';

/**
 * WF-05 – End-to-End STEM Governance & Strict Mode Verification (T13a):
 *   - DS-05a: Workspace enables STRICT -> Writer authors 6-step STEM brief & submits ->
 *             Reviewer evaluates Rubric (with scriptFingerprint) & approves script ->
 *             Producer syncs & renders MP4 -> Reviewer evaluates Video Rubric (with
 *             compositionFingerprint) & approves video -> Producer publishes to library.
 *   - DS-05b (AT03): Script without a STEM brief in STRICT mode can save draft edits
 *             but is blocked on submit with 400 STEM_VALIDATION_FAILED (TECH-BRIEF).
 *   - DS-05c: Editing a script invalidates its fingerprint; stale fingerprint is
 *             refused with 409 STEM_FINGERPRINT_STALE on approval and render.
 */
test.describe.serial('WF-05 STEM strict governance, 6-step brief, rubric fingerprint and publish', () => {
  const run = `wf05-${runId()}`;
  const projectTitle = `Bình lọc nước mini STEM ${run}`;
  let ws: Awaited<ReturnType<typeof setupWorkspace>>;
  let projectId: string;

  test.beforeAll(async ({ request }) => {
    ws = await setupWorkspace(request, run);
    await setWorkspaceStemMode(request, ws.adminToken, ws.workspaceId, 'STRICT', STEM_PRIMARY_POLICY_ID);
    projectId = await createProject(request, ws.tokens.WRITER, ws.workspaceId, projectTitle);
    await seedStemBrief(request, ws.tokens.WRITER, projectId, STEM_PRIMARY_POLICY_ID);
  });

  test('DS-05a: Writer verifies 6-step STEM brief in STRICT workspace and submits for review', async ({ page, request }) => {
    await signInReady(page, ws.writer.username, CHANGED_PASSWORD);
    await openProject(page, projectTitle);

    await page.getByRole('button', { name: /Hồ Sơ STEM/ }).click();

    const stepsTab = page.getByRole('button', { name: /Tiến trình 6 bước/ });
    await expect(stepsTab).toBeVisible();
    await stepsTab.click();

    await expect(page.getByTestId('lesson-step-OPENING_PROBLEM')).toBeVisible();
    await expect(page.getByTestId('lesson-step-BACKGROUND_KNOWLEDGE')).toBeVisible();
    await expect(page.getByTestId('lesson-step-PROPOSE_SOLUTION')).toBeVisible();
    await expect(page.getByTestId('lesson-step-SELECT_SOLUTION')).toBeVisible();
    await expect(page.getByTestId('lesson-step-BUILD_TEST')).toBeVisible();
    await expect(page.getByTestId('lesson-step-CLOSING_SHARE_REFLECT')).toBeVisible();

    await page.getByRole('button', { name: /Gửi Kịch Bản Cho Reviewer/ }).click();

    await expect.poll(async () => (await getProject(request, ws.tokens.WRITER, projectId)).scriptStatus).toBe('IN_REVIEW');
  });

  test('DS-05a: Reviewer evaluates STEM Rubric with scriptFingerprint and approves the script', async ({ page, request }) => {
    await signInReady(page, ws.reviewer.username, CHANGED_PASSWORD);
    await openProject(page, projectTitle);

    await expect(page.getByText(/Chế độ STRICT: Thẩm định Rubric STEM là bắt buộc/)).toBeVisible();
    await page.getByRole('button', { name: /Mở Rubric|Rubric STEM/ }).first().click();

    const drawer = page.getByRole('complementary', { name: 'STEM Rubric QA Drawer' });
    await expect(drawer).toBeVisible();

    const rubricSelect = drawer.getByLabel('Chọn Rubric');
    await expect(rubricSelect).toBeVisible();
    await rubricSelect.selectOption(STEM_PRIMARY_RUBRIC_ID);

    await expect(drawer.getByText('Script Fingerprint:')).toBeVisible();
    await expect(drawer.locator('code')).not.toHaveText('Chờ server cấp');

    for (const crit of DEFAULT_CRITERIA_KEYS) {
      await drawer.locator(`input[name="judgment_${crit.key}"][value="ADEQUATE"]`).check();
      await drawer.getByLabel(`Lý do ${crit.key}`).fill(`Đạt chuẩn STEM Tiểu học cho ${crit.key} (TEST_ONLY)`);
    }

    await drawer.getByTitle('Đóng bảng thẩm định').click();
    await page.getByRole('button', { name: /Duyệt Kịch Bản ➔ Chuyển Producer/ }).click();

    await expect.poll(async () => (await getProject(request, ws.tokens.REVIEWER, projectId)).scriptStatus).toBe('APPROVED');
  });

  test('DS-05a: Producer updates composition theme, renders MP4 and submits clip to QA', async ({ page, request }) => {
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await openProject(page, projectTitle);
    await expect(page.getByText(/Bản dựng (chưa chỉnh|r\d+)/)).toBeVisible();

    await page.getByTitle(/Chọn bộ Theme màu/).selectOption('cyber');
    await expect(page.getByRole('button', { name: /Kết xuất bản dựng r1/ })).toBeVisible();

    await page.getByRole('button', { name: /Kết xuất bản dựng r1/ }).click();

    // Record the composition review snapshot while the render job is running so STRICT video review has its baseline snapshot.
    await expect.poll(async () => {
      const submitRes = await request.post(`${API_URL}/scripts/${projectId}/submit-video-review`, {
        headers: { Authorization: `Bearer ${ws.tokens.PRODUCER}` },
      });
      return submitRes.status();
    }).toBe(200);

    await expect.poll(
      async () => {
        const p = await getProject(request, ws.tokens.PRODUCER, projectId);
        return { status: p.videoStatus, hasVideo: Boolean(p.videoUrl) };
      },
      { timeout: 25_000 },
    ).toEqual({ status: 'IN_QA', hasVideo: true });
  });

  test('DS-05a: Reviewer evaluates Video STEM Rubric with compositionFingerprint and approves the clip', async ({ page, request }) => {
    await signInReady(page, ws.reviewer.username, CHANGED_PASSWORD);
    await openProject(page, projectTitle);
    await page.getByRole('button', { name: /2\. Duyệt Video Thành Phẩm/ }).click();

    const approveVideoBtn = page.getByRole('button', { name: /Duyệt Video ➔/ });
    await expect(approveVideoBtn).toBeEnabled();

    await page.getByRole('button', { name: /Mở Rubric|Rubric STEM/ }).first().click();
    const drawer = page.getByRole('complementary', { name: 'STEM Rubric QA Drawer' });
    await expect(drawer).toBeVisible();

    const rubricSelect = drawer.getByLabel('Chọn Rubric');
    await expect(rubricSelect).toBeVisible();
    await rubricSelect.selectOption(STEM_PRIMARY_RUBRIC_ID);

    await expect(drawer.getByText('Composition Fingerprint:')).toBeVisible();
    await expect(drawer.locator('code')).not.toHaveText('Chờ server cấp');

    for (const crit of DEFAULT_CRITERIA_KEYS) {
      await drawer.locator(`input[name="judgment_${crit.key}"][value="ADEQUATE"]`).check();
      await drawer.getByLabel(`Lý do ${crit.key}`).fill(`Video khớp kịch bản đã duyệt cho ${crit.key} (TEST_ONLY)`);
    }

    await drawer.getByTitle('Đóng bảng thẩm định').click();
    await approveVideoBtn.click();

    await expect.poll(async () => (await getProject(request, ws.tokens.REVIEWER, projectId)).videoStatus, { timeout: 30_000 }).toBe('APPROVED');
  });

  test('DS-05a: Producer acknowledges UNVERIFIED artifact lineage and publishes to library', async ({ page, request }) => {
    await signInReady(page, ws.producer.username, CHANGED_PASSWORD);
    await openProject(page, projectTitle);
    await page.getByRole('button', { name: /Xuất bản \(đã duyệt\)/ }).click();

    const ackCheckbox = page.getByRole('checkbox', { name: /Tôi xác nhận xuất bản nội dung chưa được thẩm định STEM/ });
    await expect(ackCheckbox).toBeVisible();
    await ackCheckbox.check();

    await page.getByRole('button', { name: 'Xuất bản vào thư viện & lấy mã nhúng LMS' }).click();
    await expect(page.getByLabel('Mã nhúng LMS')).toHaveValue(/<iframe|embed/i);

    await expect.poll(async () => (await getProject(request, ws.tokens.PRODUCER, projectId)).videoStatus).toBe('PUBLISHED');
  });

  test('DS-05b (AT03): script without a STEM brief in STRICT mode can save drafts but is blocked from submitting (400 STEM_VALIDATION_FAILED)', async ({ request }) => {
    const noBriefId = await createProject(request, ws.tokens.WRITER, ws.workspaceId, `Thiếu hồ sơ STEM ${run}`);
    const current = await getProject(request, ws.tokens.WRITER, noBriefId);

    // Saving draft scenes without a STEM brief is allowed in STRICT mode.
    const draftRes = await request.put(`${API_URL}/scripts/${noBriefId}`, {
      headers: { Authorization: `Bearer ${ws.tokens.WRITER}` },
      data: {
        baseRevision: current.draftRevision ?? 0,
        scenes: formulaScenes('Cảnh nháp chưa có brief'),
      },
    });
    expect(draftRes.status()).toBe(200);

    // Submitting for review without a STEM brief is blocked with 400 STEM_VALIDATION_FAILED (TECH-BRIEF).
    const submitRes = await request.post(`${API_URL}/scripts/${noBriefId}/submit-review`, {
      headers: { Authorization: `Bearer ${ws.tokens.WRITER}` },
    });
    expect(submitRes.status()).toBe(400);
    const body = await submitRes.json();
    expect(body.code).toBe('STEM_VALIDATION_FAILED');
    expect(JSON.stringify(body.details?.findings ?? [])).toContain('TECH-BRIEF');

    expect((await getProject(request, ws.tokens.WRITER, noBriefId)).scriptStatus).toBe('DRAFT');
  });

  test('DS-05c: editing script invalidates fingerprint; stale approval and stale render are refused with 409 STEM_FINGERPRINT_STALE', async ({ request }) => {
    // 1. Create a script with a valid 6-step brief and capture its initial scriptFingerprint.
    const staleProjectId = await createProject(request, ws.tokens.WRITER, ws.workspaceId, `Stale Fingerprint ${run}`);
    const seeded = await seedStemBrief(request, ws.tokens.WRITER, staleProjectId, STEM_PRIMARY_POLICY_ID);
    const oldFingerprint = seeded.view.scriptFingerprint as string;
    expect(oldFingerprint).toBeTruthy();

    // 2. Edit the script draft scenes after reading the fingerprint; verify scriptFingerprint changes.
    const beforeEdit = await getProject(request, ws.tokens.WRITER, staleProjectId);
    const updatedScenes = beforeEdit.scenes.map((s: any, idx: number) => ({
      ...s,
      narration: `Lời thoại đã chỉnh sửa làm đổi fingerprint cảnh ${idx + 1} (${run}).`,
    }));
    const editRes = await request.put(`${API_URL}/scripts/${staleProjectId}`, {
      headers: { Authorization: `Bearer ${ws.tokens.WRITER}` },
      data: { baseRevision: beforeEdit.draftRevision ?? 0, scenes: updatedScenes },
    });
    expect(editRes.status()).toBe(200);

    // Re-save the STEM brief against the new scriptRevision so submission passes validation.
    const afterEditBrief = await seedStemBrief(request, ws.tokens.WRITER, staleProjectId, STEM_PRIMARY_POLICY_ID);
    const newFingerprint = afterEditBrief.view.scriptFingerprint as string;
    expect(newFingerprint).toBeTruthy();
    expect(newFingerprint).not.toBe(oldFingerprint);

    const submitRes = await request.post(`${API_URL}/scripts/${staleProjectId}/submit-review`, {
      headers: { Authorization: `Bearer ${ws.tokens.WRITER}` },
    });
    expect(submitRes.status()).toBe(200);

    // 3. Approving with the old (pre-edit) fingerprint in STRICT mode is rejected with 409 STEM_FINGERPRINT_STALE.
    const latestProject = await getProject(request, ws.tokens.REVIEWER, staleProjectId);
    const staleApproveRes = await request.post(`${API_URL}/scripts/${staleProjectId}/approve`, {
      headers: { Authorization: `Bearer ${ws.tokens.REVIEWER}` },
      data: {
        note: 'Thử duyệt bằng fingerprint cũ (TEST_ONLY)',
        stemAssessment: {
          expectedBriefRevision: afterEditBrief.view.revision,
          expectedScriptRevision: latestProject.draftRevision ?? 1,
          expectedModeRevision: afterEditBrief.view.modeRevision,
          rubricVersionId: STEM_PRIMARY_RUBRIC_ID,
          expectedFingerprint: oldFingerprint,
          criteria: DEFAULT_CRITERIA_KEYS.map((c) => ({
            key: c.key,
            judgment: 'ADEQUATE',
            rationale: 'Đánh giá thử nghiệm (TEST_ONLY)',
            evidenceIds: [],
          })),
          idempotencyKey: `e2e-stale-approve-${run}`,
        },
      },
    });
    expect(staleApproveRes.status()).toBe(409);
    const staleApproveBody = await staleApproveRes.json();
    expect(staleApproveBody.code).toBe('STEM_FINGERPRINT_STALE');
    expect(staleApproveBody.details?.expected).toBe(newFingerprint);
    expect(staleApproveBody.details?.actual).toBe(oldFingerprint);

    // 4. If a script was approved in ADVISORY mode with a stale/mismatched fingerprint and the workspace is then switched to STRICT, rendering is blocked with 409 STEM_FINGERPRINT_STALE.
    await setWorkspaceStemMode(request, ws.adminToken, ws.workspaceId, 'ADVISORY', STEM_PRIMARY_POLICY_ID);
    const advisoryApproveRes = await request.post(`${API_URL}/scripts/${staleProjectId}/approve`, {
      headers: { Authorization: `Bearer ${ws.tokens.REVIEWER}` },
      data: { note: 'Duyệt ở chế độ ADVISORY không có fingerprint STRICT (TEST_ONLY)' },
    });
    expect(advisoryApproveRes.status()).toBe(200);

    await setWorkspaceStemMode(request, ws.adminToken, ws.workspaceId, 'STRICT', STEM_PRIMARY_POLICY_ID);
    const renderRes = await request.post(`${API_URL}/render/projects/${staleProjectId}/start`, {
      headers: { Authorization: `Bearer ${ws.tokens.PRODUCER}` },
      data: { fps: 30 },
    });
    expect(renderRes.status()).toBe(409);
    const renderBody = await renderRes.json();
    expect(renderBody.code).toBe('STEM_FINGERPRINT_STALE');
  });
});
