import React from 'react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {PublishModal} from '../modals/PublishModal';
import {StemReadOnlySummary} from './StemReadOnlySummary';
import * as client from '../../services/stemClient';
import {publicationService} from '../../services/publicationService';
import {apiClient,ApiError} from '../../services/apiClient';
import {scriptService} from '../../services/scriptService';
import {reviewService} from '../../services/reviewService';
import type {STEMScript,StemArtifactStatus} from '../../types/stem';

const script:STEMScript={id:'TEST_ONLY_p5',title:'TEST_ONLY unverified',subject:'Math',gradeLevel:'4',scriptStatus:'APPROVED',videoStatus:'APPROVED',scenes:[],videoUrl:'https://example.invalid/test.mp4'};
const status=(patch:Partial<StemArtifactStatus>={}):StemArtifactStatus=>({schemaVersion:'stem-artifact.v1',target:{projectId:script.id,versionId:'version',clipId:'clip',jobId:'job',snapshotId:'snapshot',inputHash:'a'.repeat(64)},freshness:'CURRENT',classification:'UNKNOWN',integrity:'MATCH',publishEligibility:{allowed:true,route:'LEGACY_UNVERIFIED',requiresLegacyAcknowledgement:true},snapshotOrigin:{snapshotId:'snapshot',capturedMode:'ADVISORY',effectiveMode:'OFF'},verificationStatus:'UNVERIFIED',reasons:['LEGACY_ACK_REQUIRED'],...patch});
beforeEach(()=>{vi.spyOn(client,'getArtifactStatus').mockResolvedValue(status());});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
const modal=()=>render(<PublishModal isOpen canPublish script={script} onClose={()=>{}} onNotify={()=>{}}/>);

it('requires explicit unverified acknowledgement and sends exact artifact preconditions',async()=>{
 const publish=vi.spyOn(publicationService,'publishInternal').mockResolvedValue({id:'publication',projectId:script.id,lmsEmbedCode:null,youtubeUrl:null,publishedAt:'TEST_ONLY'});
 modal();const ack=await screen.findByRole('checkbox');const button=screen.getByRole('button',{name:/Xuất bản vào thư viện/});
 expect(button.hasAttribute('disabled')).toBe(true);expect(publish).not.toHaveBeenCalled();fireEvent.click(ack);fireEvent.click(button);
 await waitFor(()=>expect(publish).toHaveBeenCalledWith(script.id,script.title,expect.objectContaining({legacyUnverifiedAcknowledged:true,artifactExpectation:{clipId:'clip',jobId:'job',snapshotId:'snapshot',inputHash:'a'.repeat(64)},idempotencyKey:expect.any(String)})));
});
it('known mismatch remains blocked and cannot be acknowledged around',async()=>{
 vi.mocked(client.getArtifactStatus).mockResolvedValue(status({integrity:'MISMATCH',freshness:'NEEDS_REVIEW',publishEligibility:{allowed:false,route:'BLOCKED',requiresLegacyAcknowledgement:false},reasons:['ARTIFACT_BINDING_MISMATCH']}));
 const publish=vi.spyOn(publicationService,'publishInternal');modal();await screen.findByText('ARTIFACT_BINDING_MISMATCH');
 expect(screen.queryByRole('checkbox')).toBeNull();expect(screen.getByRole('button',{name:/Xuất bản vào thư viện/}).hasAttribute('disabled')).toBe(true);expect(publish).not.toHaveBeenCalled();
});
it('uncertain publication failure keeps the same retry key and never claims success',async()=>{
 const publish=vi.spyOn(publicationService,'publishInternal').mockRejectedValue(new Error('TEST_ONLY uncertain response'));
 modal();fireEvent.click(await screen.findByRole('checkbox'));const button=screen.getByRole('button',{name:/Xuất bản vào thư viện/});fireEvent.click(button);
 await screen.findByText('TEST_ONLY uncertain response');const first=publish.mock.calls[0][2]?.idempotencyKey;fireEvent.click(button);await waitFor(()=>expect(publish).toHaveBeenCalledTimes(2));
 expect(publish.mock.calls[1][2]?.idempotencyKey).toBe(first);expect(screen.queryByLabelText('Mã nhúng LMS')).toBeNull();
});
it('publication service does not send whole status object or verification claims',async()=>{
 const post=vi.spyOn(apiClient,'post').mockResolvedValue({});await publicationService.publishInternal('p','TEST_ONLY',{legacyUnverifiedAcknowledged:true,artifactExpectation:client.artifactExpectation(status()),idempotencyKey:'TEST_ONLY_key'});
 expect(post.mock.calls[0][1]).toEqual({targets:['INTERNAL_LIBRARY','LMS'],title:'TEST_ONLY',legacyUnverifiedAcknowledged:true,artifactExpectation:{clipId:'clip',jobId:'job',snapshotId:'snapshot',inputHash:'a'.repeat(64)},idempotencyKey:'TEST_ONLY_key'});
});
it('summary separates artifact origin, mode rollback and media QA from scientific verification',async()=>{
 vi.spyOn(scriptService,'getStemTarget').mockResolvedValue({versionId:'version',versionNo:1,scriptRevision:0,workspaceId:'workspace'});
 vi.spyOn(scriptService,'getStemBrief').mockResolvedValue({schemaVersion:'stem.v1',scriptVersionId:'version',brief:null,revision:0,verificationStatus:'UNVERIFIED',readiness:'LEGACY_UNMAPPED',effectiveMode:'OFF',modeRevision:2,evidence:[],findings:[]});
 vi.spyOn(reviewService,'getQaReport').mockResolvedValue({projectId:script.id,passed:false,failCount:1,warnCount:2,findings:[]});
 render(<StemReadOnlySummary script={script}/>);expect(await screen.findByText(/Snapshot: snapshot/)).toBeTruthy();expect(await screen.findByText(/Media QA: FAIL/)).toBeTruthy();expect(screen.getByText(/mode lúc chụp ADVISORY.*hiện tại OFF/)).toBeTruthy();
});
it('switching project ignores the prior asynchronous artifact status',async()=>{
 let resolve!:(value:StemArtifactStatus)=>void;
 vi.mocked(client.getArtifactStatus).mockReturnValueOnce(new Promise(r=>{resolve=r;})).mockResolvedValueOnce(status({reasons:['TEST_ONLY_current']}));
 const view=modal();view.rerender(<PublishModal isOpen canPublish script={{...script,id:'other'}} onClose={()=>{}} onNotify={()=>{}}/>);
 await screen.findByText('TEST_ONLY_current');resolve(status({reasons:['TEST_ONLY_old']}));await waitFor(()=>expect(screen.queryByText('TEST_ONLY_old')).toBeNull());
});

it.each([400,403,404,409,429])('publication %s keeps acknowledgement and requires explicit recovery',async(code)=>{
 const publish=vi.spyOn(publicationService,'publishInternal').mockRejectedValue(new ApiError('TEST_ONLY operational error','TEST_ONLY_CODE',code,{field:'title'},2));
 modal();fireEvent.click(await screen.findByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:/Xuất bản vào thư viện/}));
 await screen.findByText(/TEST_ONLY operational error/);expect(publish).toHaveBeenCalledTimes(1);
 expect(screen.getByRole('button',{name:/Xuất bản vào thư viện/}).hasAttribute('disabled')).toBe(true);
 expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
});
