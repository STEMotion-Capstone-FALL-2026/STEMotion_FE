import {it,expect,vi,afterEach} from 'vitest';
import {ApiError,apiClient} from './apiClient';
import {sceneSaveQueue} from './sceneSaveQueue';
import {createCompositionSaver} from './compositionService';
import {hasActiveReviewerSeat} from './stemClient';
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
it('scene autosave pauses for Retry-After, keeps latest edits and performs one save after a new edit',async()=>{
 vi.useFakeTimers();
 const scenes=[{id:'s',title:'TEST_ONLY latest'}] as any;
 const put=vi.spyOn(apiClient,'put').mockRejectedValueOnce(new ApiError('limited','STEM_RATE_LIMIT',429,undefined,5)).mockResolvedValue({draftRevision:1,scenes});
 await expect(sceneSaveQueue.saveNow('TEST_ONLY_429',scenes)).rejects.toMatchObject({status:429});
 sceneSaveQueue.schedule('TEST_ONLY_429',scenes);
 await vi.advanceTimersByTimeAsync(4000);expect(put).toHaveBeenCalledTimes(1);
 await vi.advanceTimersByTimeAsync(1001);expect(put).toHaveBeenCalledTimes(2);
 await vi.advanceTimersByTimeAsync(10000);expect(put).toHaveBeenCalledTimes(2);
 expect(sceneSaveQueue.isDirty('TEST_ONLY_429')).toBe(false);
});
it('composition autosave preserves the failed payload, waits for the cooldown and never loops retries',async()=>{
 vi.useFakeTimers();
 const scenes=[{id:'s',title:'TEST_ONLY latest'}] as any;
 const save=vi.fn().mockRejectedValueOnce(new ApiError('limited','STEM_RATE_LIMIT',429,undefined,5)).mockResolvedValue({revision:1});
 const saver=createCompositionSaver('TEST_ONLY_p',0,{onSaved:vi.fn(),onError:vi.fn()},{save});
 saver.schedule(scenes);await expect(saver.flush()).rejects.toMatchObject({status:429});
 expect(saver.isDirty?.()).toBe(true);
 await expect(saver.flush()).rejects.toMatchObject({status:429});expect(save).toHaveBeenCalledTimes(1);
 await vi.advanceTimersByTimeAsync(5000);expect(save).toHaveBeenCalledTimes(1);
 await expect(saver.flush()).resolves.toBe(1);expect(save).toHaveBeenLastCalledWith('TEST_ONLY_p',0,scenes);
 saver.dispose();
});
it.each([undefined,'INACTIVE'])('Reviewer seat fails closed for status %s, even with a matching role/user',async(status)=>{
 vi.spyOn(apiClient,'get').mockResolvedValue([{userId:'u',role:'REVIEWER',status}]);
 expect(await hasActiveReviewerSeat('w','u')).toBe(false);
});
it('Reviewer seat uses the target workspace, exact active status and the current user',async()=>{
 const get=vi.spyOn(apiClient,'get').mockResolvedValue([{userId:'u',role:'REVIEWER',status:'ACTIVE'}]);
 expect(await hasActiveReviewerSeat('target-w','u')).toBe(true);
 expect(get).toHaveBeenCalledWith('/workspaces/target-w/members');
});
