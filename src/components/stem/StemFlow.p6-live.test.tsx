import React from 'react';
import {beforeAll,afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {apiClient} from '../../services/apiClient';
import {scriptService} from '../../services/scriptService';
import {libraryService} from '../../services/libraryService';
import {StemLearningCard} from './StemLearningCard';
import {StemGroundedAiPanel} from './StemGroundedAiPanel';

const url=process.env.P6_LIVE_API_URL;
if(!url||!/^http:\/\/127\.0\.0\.1:\d+\/api\/v1$/.test(url))throw new Error('Owned P6 localhost runner required');
const project=process.env.P6_TEST_PROJECT!,version=process.env.P6_TEST_VERSION!,outcome=process.env.P6_TEST_OUTCOME!;
beforeAll(async()=>{vi.spyOn(apiClient,'getBaseUrl').mockReturnValue(url);const login=await apiClient.post<any>('/auth/login',{username:'p5-writer',password:'P5-fixture-only-123'});apiClient.setAuthToken(login.accessToken);});
afterEach(()=>cleanup());
it('live P6 library card and combined paging come from frozen BE projection',async()=>{
  const rows=await libraryService.getPublishedClips('Math','4',{educationLevel:'PRIMARY',outcomeId:outcome,usageContext:'GROUP_PRACTICE',contextRole:'SECONDARY',channel:'DEPARTMENT_LIBRARY',page:0,size:1});
  expect(rows).toHaveLength(1);expect(rows.pagination?.total).toBe(1);expect(rows[0].learningCard?.verificationStatus).toBe('UNVERIFIED');
  render(<StemLearningCard item={rows[0]}/>);expect(screen.getByText(/TEST_ONLY compare/)).toBeTruthy();expect(screen.getByText('Chưa được thẩm định chuyên môn')).toBeTruthy();
});
it('live P6 FE → BE → Python fake suggestion; changed brief rejects accept without saving script',async()=>{
  render(<StemGroundedAiPanel projectId={project} isWriter/>);fireEvent.click(screen.getByRole('button',{name:'Yêu cầu gợi ý theo hồ sơ'}));
  await screen.findByRole('button',{name:'Chấp nhận gợi ý STEM'}, {timeout:20000});
  const brief=await scriptService.getStemBrief(project,version);
  if(!brief.brief)throw new Error('TEST_ONLY expected a seeded draft brief');
  await scriptService.saveStemBrief(project,version,{schemaVersion:'stem.v1',baseRevision:brief.revision,expectedScriptRevision:0,idempotencyKey:'TEST_ONLY-p6-live-'+Date.now(),brief:{...brief.brief,safetyNotes:'TEST_ONLY changed while suggestion open'},evidence:brief.evidence});
  fireEvent.click(screen.getByRole('button',{name:'Chấp nhận gợi ý STEM'}));await screen.findByText(/Bạn vẫn có thể chỉnh sửa và lưu kịch bản thủ công/,{},{timeout:20000});
  const current=await scriptService.getStemTarget(project);expect(current.scriptRevision).toBe(0);
});
