import {describe,it,expect} from 'vitest';
import {CARBON,carbonElectrons,waterGeometry,assertCarbon} from './assets/chemistry/facts';
import {forceScale,waveDisplacement} from './motion';
import {reviewTimeline,REVIEW_TRANSITION_FRAMES} from './PhaseBMotionReview';
import {validateScenePlan} from './plan';
describe('motion review scientific contract',()=>{
 it('has six carbon electrons, two inner/four outer, always on their drawn shells',()=>{
  for(const frame of [0,17,63,151,299]) {
   const e=carbonElectrons(frame,30,150);
   expect(e.length).toBe(CARBON.atomicNumber);expect(e.filter(p=>p.shell===0).length).toBe(2);expect(e.filter(p=>p.shell===1).length).toBe(4);
   for(const p of e)expect(Math.hypot(p.x,p.y)).toBeCloseTo(p.radius,10);
  }
  expect(carbonElectrons(15,30,150)).not.toEqual(carbonElectrons(0,30,150));
 });
 it('water bonds are equal and subtend 104.5 degrees',()=>{
  const [h1,o,h2]=waterGeometry();const a=[h1.x-o.x,h1.y-o.y],b=[h2.x-o.x,h2.y-o.y];
  expect(Math.hypot(...a)).toBeCloseTo(150);expect(Math.hypot(...b)).toBeCloseTo(150);
  expect(Math.acos((a[0]*b[0]+a[1]*b[1])/150**2)*180/Math.PI).toBeCloseTo(104.5,10);
  expect(()=>waterGeometry('carbon_dioxide')).toThrow();expect(()=>assertCarbon({electrons:5})).toThrow();
 });
 it('rejects chemically unverified props before render',()=>{
  for(const [asset_id,props] of [['atom',{protons:7}],['element_tile',{symbol:'O'}],['element_tile',{mass:14}],['molecule',{formula:'oxygen'}]] as const)
   expect(()=>validateScenePlan({template_id:'talking_diagram',duration_sec:10,narration:'',assets:[{asset_id,slot:'main',props}]})).toThrow();
 });
 it('wave profile translates in positive x with speed frequency * wavelength',()=>{
  for(const x of [-250,0,90,230]) expect(waveDisplacement(x+104*.4,.4,60,160,.65)).toBeCloseTo(waveDisplacement(x,0,60,160,.65),10);
  expect(waveDisplacement(0,1,60,160,.65)).not.toBeCloseTo(waveDisplacement(0,0,60,160,.65));
 });
 it('force has a visible directional pulse, repeating at about 1.5s',()=>{
  const samples=Array.from({length:46},(_,f)=>forceScale(f,30));
  expect(Math.max(...samples)-Math.min(...samples)).toBeGreaterThan(.14);
  expect(forceScale(0,30)).toBe(forceScale(46,30));
 });
 it('five overlaps leave exactly 1800 frames, no gap',()=>{
  const timeline=reviewTimeline();expect(timeline.length).toBe(6);
  expect(timeline.reduce((s,t)=>s+t.frames,0)-5*REVIEW_TRANSITION_FRAMES).toBe(1800);
  timeline.slice(1).forEach((t,i)=>expect(timeline[i].start+timeline[i].frames-t.start).toBe(24));
 });
});
