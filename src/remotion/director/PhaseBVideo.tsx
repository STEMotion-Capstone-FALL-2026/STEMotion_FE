import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile} from 'remotion';
import {TransitionSeries,linearTiming} from '@remotion/transitions';
import {renderSceneComponent} from '../compositions/FullSTEMVideo';
import {pushThrough} from './transitions/remocn/push-through';
import type {STEMScript} from '../../types/stem';
export function musicVolume(frame:number,scenes:STEMScript['scenes']):number {
 let start=0;
 for(const scene of scenes){if(frame<start+scene.durationInFrames){const narration=(scene as typeof scene & {narrationAudioUrl?:string}).narrationAudioUrl;const local=frame-start;const ramp=Math.min(1,local/8,(scene.durationInFrames-1-local)/8);return narration?.length ? .035 : .035+.075*Math.max(0,ramp);}start+=scene.durationInFrames;}
 return 0;
}
export function narratedTimeline(scenes:STEMScript['scenes']) {
 let start=0;
 return scenes.map((scene,i)=>{const entry={scene,start,visualFrames:scene.durationInFrames+(i<scenes.length-1?24:0)};start+=scene.durationInFrames;return entry;});
}
/** Outgoing visual handles preserve the measured narration timeline across overlap. */
export const PhaseBVideo:React.FC<{script:STEMScript}>=({script})=>{
 const timeline=narratedTimeline(script.scenes);
 return <AbsoluteFill style={{background:'#080e27'}}><TransitionSeries>
  {timeline.map(({scene,visualFrames},i)=><React.Fragment key={scene.id}>
   {i>0&&<TransitionSeries.Transition presentation={pushThrough({zoom:1.16,blur:3})} timing={linearTiming({durationInFrames:24})}/>}
   <TransitionSeries.Sequence durationInFrames={visualFrames}>{renderSceneComponent(scene.visualPlan?{...scene,visualPlan:{...scene.visualPlan,duration_sec:visualFrames/(script.fps||30)}}:scene)}</TransitionSeries.Sequence>
  </React.Fragment>)}
 </TransitionSeries>
 {timeline.map(({scene,start})=>{const url=(scene as typeof scene & {narrationAudioUrl?:string}).narrationAudioUrl;return url?<Sequence key={scene.id} from={start} durationInFrames={scene.durationInFrames}><Audio src={url}/></Sequence>:null;})}
 <Audio src={staticFile('music/spacyloop.ogg')} loop volume={frame=>musicVolume(frame,script.scenes)}/></AbsoluteFill>;
};
