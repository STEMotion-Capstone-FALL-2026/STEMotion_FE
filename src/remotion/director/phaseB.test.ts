import {describe,it,expect} from 'vitest';
import {phaseBPlans,phaseBScript} from './phaseB';
import {registry,validateScenePlan} from './plan';
import {scenePositions} from './CinematicScene';
import {musicVolume} from './PhaseBVideo';
describe('Phase B library contract',()=>{
 it('has six different frame layouts and all nine typed subject assets',()=>{
  expect(new Set(phaseBPlans.map(p=>JSON.stringify(scenePositions(p)))).size).toBe(6);
  const ids=['force_vector','orbit_path','pendulum','lens','wave','atom','molecule','flask','element_tile'] as const;
  for(const asset_id of ids){expect(registry.assets[asset_id].tags.length).toBeGreaterThan(0);expect(()=>validateScenePlan({template_id:'talking_diagram',duration_sec:10,narration:'',assets:[{asset_id,slot:'main',props:{}}]})).not.toThrow();}
  for(const plan of phaseBPlans)expect(()=>validateScenePlan(plan)).not.toThrow();
 });
 it('rejects fractional particle counts, unsafe props and unknown variants',()=>{
  const plan={template_id:'talking_diagram',duration_sec:10,narration:'',assets:[{asset_id:'atom',slot:'main',props:{electrons:2.5}}]};
  expect(()=>validateScenePlan(plan)).toThrow();
  expect(()=>validateScenePlan({...phaseBPlans[0],layout_variant:'unregistered'})).toThrow();
 });
 it('ducks music beneath narration without changing narration volume',()=>{
  const script=phaseBScript();expect(musicVolume(100,script.scenes)).toBeGreaterThan(.035);
  const scenes=script.scenes.map(s=>({...s,narrationAudioUrl:'data:audio/wav;base64,AA=='}));
  expect(musicVolume(100,scenes)).toBe(.035);expect(musicVolume(1800,scenes)).toBe(0);
 });
});
