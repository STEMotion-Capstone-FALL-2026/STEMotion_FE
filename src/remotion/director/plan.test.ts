import {describe,it,expect} from 'vitest';
import {scenePlanToSceneData,validateScenePlan} from './plan';
import {cosmicPlan,talkingPlan} from './demo';
describe('director contract',()=>{
  it('keeps stable IDs and converts seconds at 30 and 60 FPS without mutation',()=>{
    expect(scenePlanToSceneData({...cosmicPlan,duration_sec:1.25},30,'stable').durationInFrames).toBe(38);
    expect(scenePlanToSceneData({...cosmicPlan,duration_sec:1.25},60,'stable').durationInFrames).toBe(75);
    expect(scenePlanToSceneData(cosmicPlan,30,'stable').id).toBe('stable');
    expect(scenePlanToSceneData(cosmicPlan,30,'stable')).toMatchObject({type:'ILLUSTRATED_EXPLAINER',icons:[{name:'planet'}]});
    expect(cosmicPlan).not.toHaveProperty('durationInFrames');
  });
  it('accepts both templates and rejects invented components, slots and executable props',()=>{
    expect(()=>validateScenePlan(talkingPlan)).not.toThrow();
    for(const assets of [
      [{asset_id:'injected',slot:'main',props:{}}],
      [{asset_id:'glow_body',slot:'unknown',props:{}}],
      [{asset_id:'glow_body',slot:'main',props:{svg:'<svg/>'}}],
      [{asset_id:'glow_body',slot:'main',props:{color:'url(https://example.com)'}}],
      [cosmicPlan.assets[0],cosmicPlan.assets[0]],
    ]) expect(()=>validateScenePlan({...cosmicPlan,assets})).toThrow();
    expect(()=>validateScenePlan({...cosmicPlan,durationInFrames:900})).toThrow();
    expect(()=>validateScenePlan({...cosmicPlan,duration_sec:NaN})).toThrow();
    expect(()=>scenePlanToSceneData(cosmicPlan,25,'stable')).toThrow();
  });
});
