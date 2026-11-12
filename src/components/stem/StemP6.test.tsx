import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {StemLearningCard} from './StemLearningCard';
import {StemGroundedAiPanel} from './StemGroundedAiPanel';
import {libraryService} from '../../services/libraryService';
import {scriptService} from '../../services/scriptService';
import {apiClient} from '../../services/apiClient';
import {MediaLibraryView} from '../views/MediaLibrary/MediaLibraryView';

afterEach(()=>{cleanup();vi.restoreAllMocks();});
const item:any={id:'TEST_ONLY',title:'TEST_ONLY',subject:'Math',gradeLevel:'4',videoUrl:'https://example.invalid/test.mp4',learningCard:{schemaVersion:'stem-learning-card.v1',publicationId:'TEST_ONLY',snapshotId:'TEST_ONLY',verificationStatus:'UNVERIFIED',gradeKey:'4',context:{primary:{key:'IN_CLASS_SCREEN'},secondary:[{key:'GROUP_PRACTICE',condition:'TEST_ONLY điều kiện',adaptations:'TEST_ONLY thay thế'}]},distributionChannels:['DEPARTMENT_LIBRARY'],objectives:[{key:'o1',learnerAction:'TEST_ONLY quan sát'}],studentTasks:[{key:'t1',learnerAction:'TEST_ONLY đo và ghi',safety:'TEST_ONLY giáo viên giám sát'}],scopeOfClip:'TEST_ONLY hoạt động ngoài MP4'}};
it('learning card separates frozen tasks, context channel and expert status',()=>{render(<StemLearningCard item={item}/>);expect(screen.getByText('Chưa được thẩm định chuyên môn')).toBeTruthy();expect(screen.getByText(/Học sinh làm gì/)).toBeTruthy();expect(screen.getByText(/TEST_ONLY đo và ghi/)).toBeTruthy();expect(screen.getByText(/Kho học liệu tổ chuyên môn/)).toBeTruthy();expect(screen.getByText(/hoạt động ngoài MP4/)).toBeTruthy();});
it('legacy card does not infer curriculum or hide read export',()=>{render(<StemLearningCard item={{...item,learningCard:null}}/>);expect(screen.getByText('Chưa đối chiếu hồ sơ STEM')).toBeTruthy();expect(screen.queryByText(/Lớp: 4/)).toBeNull();expect(screen.getByText(/Vẫn có thể xem, tải/)).toBeTruthy();});
it('combined library params are sent to server and totals use headers',async()=>{
  const get=vi.spyOn(apiClient,'getPage').mockResolvedValue({data:[item],total:27,pages:2,page:1,size:20});
  const rows=await libraryService.getPublishedClips('Math','4',{page:1,size:20,educationLevel:'PRIMARY',outcomeId:'TEST_ONLY',usageContext:'GROUP_PRACTICE',contextRole:'SECONDARY',channel:'DEPARTMENT_LIBRARY'});
  const url=get.mock.calls[0][0];for(const text of ['page=1','gradeLevel=4','outcomeId=TEST_ONLY','contextRole=SECONDARY','channel=DEPARTMENT_LIBRARY'])expect(url).toContain(text);expect(rows.pagination?.total).toBe(27);expect(rows).toHaveLength(1);
});
it('library view sends page and advanced filters instead of filtering a page locally',async()=>{
  const rows:any=[item];rows.pagination={total:21,pages:2,page:0,size:20};
  const load=vi.spyOn(libraryService,'getPublishedClips').mockResolvedValue(rows);
  vi.spyOn(libraryService,'getFilters').mockResolvedValue({subjects:['Math'],gradeLevels:['4'],educationLevels:['PRIMARY']});
  render(<MediaLibraryView script={{videoStatus:'NOT_RENDERED'} as any} onOpenPublishModal={()=>{}}/>);
  await screen.findByText(item.title);fireEvent.click(screen.getByRole('button',{name:'Trang sau'}));
  await waitFor(()=>expect(load).toHaveBeenLastCalledWith('',undefined,expect.objectContaining({page:1,size:20})));
  fireEvent.click(screen.getByRole('button',{name:'Bộ lọc STEM'}));await screen.findByLabelText('Cấp học');
  fireEvent.change(screen.getByLabelText('Bối cảnh học'),{target:{value:'GROUP_PRACTICE'}});
  fireEvent.change(screen.getByLabelText('Vai trò bối cảnh'),{target:{value:'SECONDARY'}});
  await waitFor(()=>expect(load).toHaveBeenLastCalledWith('',undefined,expect.objectContaining({page:0,usageContext:'GROUP_PRACTICE',contextRole:'SECONDARY'})));
});
it('grounded action failure keeps manual editing available',async()=>{
  vi.spyOn(scriptService,'getStemTarget').mockRejectedValue(new Error('TEST_ONLY unavailable'));
  render(<StemGroundedAiPanel projectId="p" isWriter/>);fireEvent.click(screen.getByRole('button',{name:'Yêu cầu gợi ý theo hồ sơ'}));await screen.findByText(/Bạn vẫn có thể chỉnh sửa/);expect((screen.getByRole('button',{name:'Yêu cầu gợi ý theo hồ sơ'}) as HTMLButtonElement).disabled).toBe(false);
});
it('accept passes binding and only records a decision',async()=>{
  vi.spyOn(scriptService,'getStemTarget').mockResolvedValue({versionId:'v',scriptRevision:2} as any);vi.spyOn(scriptService,'getStemBrief').mockResolvedValue({briefId:'b',revision:3,modeRevision:4} as any);
  const target={scriptVersionId:'v',expectedScriptRevision:2,expectedBriefRevision:3,expectedModeRevision:4};
  vi.spyOn(scriptService,'getGroundedSuggestion').mockResolvedValue({operation:'terms',result:{issues:[]},model:'TEST_ONLY',requestId:'r',grounding:{schemaVersion:'stem-ai.v1',contextDigest:'TEST_ONLY-digest',target,verificationStatus:'UNVERIFIED',profile:'PRIMARY_DRAFT',objectiveKeys:['o1'],activityKeys:['t1'],warnings:[]}});
  const decide=vi.spyOn(scriptService,'decideAiRequest').mockResolvedValue();
  render(<StemGroundedAiPanel projectId="p" isWriter/>);fireEvent.click(screen.getByRole('button',{name:'Yêu cầu gợi ý theo hồ sơ'}));fireEvent.click(await screen.findByRole('button',{name:'Chấp nhận gợi ý STEM'}));
  await waitFor(()=>expect(decide).toHaveBeenCalledWith('r','ACCEPTED',{projectId:'p',target,contextDigest:'TEST_ONLY-digest'}));await screen.findByText('Đã ghi nhận lựa chọn. Kịch bản chưa tự thay đổi.');
});
const specimens=JSON.parse(readFileSync(resolve(process.cwd(),'../../phase-03/STEMotion_BE/src/test/resources/stem-p6/contract-specimens.json'),'utf8'));
for(const scene of specimens.scenes)it(`F09 valid DTO through FE AI scene validator: ${scene.type}`,async()=>{
  vi.spyOn(apiClient,'post').mockResolvedValue({result:{scenes:[scene]}});const result=await scriptService.generateScriptWithAI('TEST_ONLY','Math','4');expect(result.scenes).toHaveLength(1);
});
for(const block of specimens.blocks)it(`F10 composed and extraBlocks DTO through FE validator: ${block.kind}`,async()=>{
  vi.spyOn(apiClient,'post').mockResolvedValue({result:{scenes:[block.scene,block.extraScene]}});const result=await scriptService.generateScriptWithAI('TEST_ONLY','Math','4');expect(result.scenes).toHaveLength(2);
});
